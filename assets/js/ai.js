// ai.js — AI layer. Gemini primary → Groq fallback → deterministic (handled by caller).
// Capabilities: (1) analyse a journal entry; (2) companion chat; (3) translate the UI.
// The SAFETY_SYSTEM_PROMPT is prepended to every call. Keys are runtime/CI, never in source.

import { SAFETY_SYSTEM_PROMPT } from "./safety.js";
import { deterministicReflection } from "./analysis.js";

const CI_CONFIG = {
  GEMINI_API_KEY: "YOUR_GEMINI_KEY_HERE",
  GROQ_API_KEY: "YOUR_GROQ_KEY_HERE",
};

function valid(k) {
  return typeof k === "string" && k && !k.startsWith("YOUR_") && k.length > 12;
}

export function getKeys() {
  const gem = sessionStorage.getItem("mm_gemini") || CI_CONFIG.GEMINI_API_KEY;
  const grq = sessionStorage.getItem("mm_groq") || CI_CONFIG.GROQ_API_KEY;
  return { gemini: valid(gem) ? gem : "", groq: valid(grq) ? grq : "" };
}

export function setKeys({ gemini, groq }) {
  if (gemini) sessionStorage.setItem("mm_gemini", gemini.trim());
  if (groq) sessionStorage.setItem("mm_groq", groq.trim());
}

export function aiAvailable() {
  const k = getKeys();
  return Boolean(k.gemini || k.groq);
}

async function gemini(systemText, userText, key, json) {
  const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + encodeURIComponent(key);
  const body = {
    systemInstruction: { parts: [{ text: systemText }] },
    contents: [{ role: "user", parts: [{ text: userText }] }],
    generationConfig: { temperature: 0.7 },
  };
  if (json) body.generationConfig.responseMimeType = "application/json";
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error("Gemini HTTP " + res.status);
  const data = await res.json();
  return (data && data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts[0].text) || "";
}

async function groq(systemText, userText, key, json) {
  const body = {
    model: "llama-3.3-70b-versatile",
    temperature: 0.7,
    messages: [ { role: "system", content: systemText }, { role: "user", content: userText } ],
  };
  if (json) body.response_format = { type: "json_object" };
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + key },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Groq HTTP " + res.status);
  const data = await res.json();
  return (data && data.choices && data.choices[0] && data.choices[0].message.content) || "";
}

async function generate(systemText, userText, json) {
  const keys = getKeys();
  const errs = [];
  if (keys.gemini) {
    try { const t = await gemini(systemText, userText, keys.gemini, json); if (t) return t; }
    catch (e) { errs.push("gemini:" + e.message); }
  }
  if (keys.groq) {
    try { const t = await groq(systemText, userText, keys.groq, json); if (t) return t; }
    catch (e) { errs.push("groq:" + e.message); }
  }
  throw new Error(errs.join(" | ") || "no key");
}

function parseJson(text) {
  const c = (text || "").replace(/```json/gi, "").replace(/```/g, "").trim();
  const s = c.indexOf("{");
  const e = c.lastIndexOf("}");
  if (s === -1 || e === -1) throw new Error("no json");
  return JSON.parse(c.slice(s, e + 1));
}

// ---- analyse a journal entry (falls back to deterministic) ----
export async function analyseEntry({ text, mood, exam, language }) {
  if (!aiAvailable()) return deterministicReflection(text, mood);
  const sys = SAFETY_SYSTEM_PROMPT + "\n\nTASK: Analyse one journal entry. Return ONLY minified JSON: " +
    '{"sentiment":<-1..1>,"triggers":[<lowercase tags like comparison,sleep,parents,mocks,burnout,selfdoubt,loneliness,time,health>],"reflection":"<=2 warm non-clinical sentences","coping":["<one tiny step>"],"insight":"<one gentle observation>"} ' +
    "Do not diagnose. Keep it brief and kind.";
  const user = "Exam: " + exam + ". Mood (1-5): " + mood + ". Language for text fields: " + language + ".\nEntry: \"\"\"" + text + "\"\"\"";
  try {
    const out = parseJson(await generate(sys, user, true));
    out.source = "ai";
    out.triggers = Array.isArray(out.triggers) ? out.triggers : [];
    out.coping = Array.isArray(out.coping) ? out.coping : [];
    return out;
  } catch {
    return deterministicReflection(text, mood);
  }
}

// ---- translate the UI dictionary into any language ----
export async function translateUI(enDict, langName) {
  if (!aiAvailable()) return null;
  const sys = "You are a professional UI localizer. Translate the VALUES of this JSON UI string map into " + langName +
    ". Keep keys identical. Keep it natural, warm, and concise. Preserve emojis and the number 112, and keep the brand name MannMitra untranslated. Return ONLY the translated JSON object.";
  try {
    const out = parseJson(await generate(sys, JSON.stringify(enDict), true));
    return out && typeof out === "object" ? out : null;
  } catch {
    return null;
  }
}

// ---- companion chat (caller MUST pre-screen with safety.assessRisk) ----
export async function companionReply({ history, exam, language }) {
  const sys = SAFETY_SYSTEM_PROMPT + "\n\nContext: the student is preparing for " + exam + ". Reply in " + language + ". Keep it to 2-5 short sentences.";
  const convo = history.map((m) => (m.role === "user" ? "Student: " : "MannMitra: ") + m.text).join("\n");
  return generate(sys, convo + "\nMannMitra:", false);
}
