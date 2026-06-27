// ai.js — AI layer. Gemini primary → Groq fallback → deterministic (handled by caller).
// Two capabilities: (1) analyse a journal entry into structured insight; (2) companion chat.
// The SAFETY_SYSTEM_PROMPT is prepended to every call. Keys are runtime/CI, never in source.

import { SAFETY_SYSTEM_PROMPT } from "./safety.js";
import { deterministicReflection } from "./analysis.js";

// ---- Key handling (placeholder-safe) ----
// CONFIG values may be injected by CI (sed). Runtime keys (sessionStorage) take priority.
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

// ---- Low-level provider calls ----
async function gemini(systemText, userText, key, json) {
  const url =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" +
    encodeURIComponent(key);
  const body = {
    systemInstruction: { parts: [{ text: systemText }] },
    contents: [{ role: "user", parts: [{ text: userText }] }],
    generationConfig: { temperature: 0.7 },
  };
  if (json) body.generationConfig.responseMimeType = "application/json";
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Gemini HTTP " + res.status);
  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

async function groq(systemText, userText, key, json) {
  const body = {
    model: "llama-3.3-70b-versatile",
    temperature: 0.7,
    messages: [
      { role: "system", content: systemText },
      { role: "user", content: userText },
    ],
  };
  if (json) body.response_format = { type: "json_object" };
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + key },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Groq HTTP " + res.status);
  const data = await res.json();
  return data?.choices?.[0]?.message?.content || "";
}

// Try Gemini, then Groq. Throws if both unavailable/failed.
async function generate(systemText, userText, json) {
  const keys = getKeys();
  const errs = [];
  if (keys.gemini) {
    try {
      const t = await gemini(systemText, userText, keys.gemini, json);
      if (t) return t;
    } catch (e) {
      errs.push("gemini:" + e.message);
    }
  }
  if (keys.groq) {
    try {
      const t = await groq(systemText, userText, keys.groq, json);
      if (t) return t;
    } catch (e) {
      errs.push("groq:" + e.message);
    }
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

// ---- Capability 1: analyse a journal entry ----
// Falls back to the deterministic reflection so this NEVER throws to the UI.
export async function analyseEntry({ text, mood, exam, language }) {
  if (!aiAvailable()) return deterministicReflection(text, mood);

  const sys =
    SAFETY_SYSTEM_PROMPT +
    `\n\nTASK: Analyse one journal entry. Return ONLY minified JSON:
{"sentiment":<number -1..1>,"triggers":[<short lowercase tags e.g. "comparison","sleep","parents","mocks","burnout","selfdoubt","loneliness","time","health">],"reflection":"<=2 warm non-clinical sentences validating the feeling","coping":["<one tiny doable step>","<optional second>"],"insight":"<one gentle observation>"}
Do not diagnose. Keep it brief and kind.`;
  const user = `Exam: ${exam}. Mood (1-5): ${mood}. Language for text fields: ${language}.\nEntry: """${text}"""`;

  try {
    const out = parseJson(await generate(sys, user, true));
    out.source = "ai";
    out.triggers = Array.isArray(out.triggers) ? out.triggers : [];
    out.coping = Array.isArray(out.coping) ? out.coping : [];
    return out;
  } catch {
    return deterministicReflection(text, mood); // hybrid safety net
  }
}

// ---- Capability 2: companion chat ----
// Caller MUST pre-screen with safety.assessRisk and short-circuit on "crisis".
export async function companionReply({ history, exam, language }) {
  const sys =
    SAFETY_SYSTEM_PROMPT +
    `\n\nContext: the student is preparing for ${exam}. Reply in ${language}. Keep it to 2-5 short sentences.`;
  // Flatten short history into a single user turn for provider-agnostic simplicity.
  const convo = history
    .map((m) => (m.role === "user" ? "Student: " : "MannMitra: ") + m.text)
    .join("\n");
  return generate(sys, convo + "\nMannMitra:", false);
}
