// app.js — UI controller. Screen routing, i18n, optional PIN lock, safe DOM rendering,
// and the crisis safety gate that sits in front of every AI interaction.

import { EXAMS, LANGUAGES, HELPLINES, EXERCISES, SUGGESTIONS, QUOTES } from "./config.js";
import { assessRisk } from "./safety.js";
import { analyseEntry, companionReply, setKeys, aiAvailable, translateUI } from "./ai.js";
import { deterministicReflection, detectPatterns } from "./analysis.js";
import * as store from "./storage.js";
import { buildMoodSeries, buildTriggerCloud, currentStreak } from "./insights.js";
import { t, setLang, applyTranslations, getLang, STRINGS } from "./i18n.js";
import { hasPin, setPin, verifyPin, clearPin } from "./auth.js";

const $ = (id) => document.getElementById(id);
const state = { profile: null, mood: null, chat: [], lastScreen: "screen-app" };

/* ---------- safe-DOM helpers ---------- */
function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}
function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }
function langMeta(code) { return LANGUAGES.find((l) => l.code === code) || LANGUAGES[0]; }

/* ---------- screens ---------- */
const SCREENS = ["screen-lock", "screen-onboard", "screen-app", "screen-crisis", "screen-settings", "screen-pinset"];
function show(id) {
  SCREENS.forEach((s) => $(s).classList.toggle("hidden", s !== id));
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* ---------- theme ---------- */
function applyStoredTheme() { setTheme(localStorage.getItem("mm_theme") || "dark"); }
function setTheme(tm) {
  if (tm === "light") document.documentElement.setAttribute("data-theme", "light");
  else document.documentElement.removeAttribute("data-theme");
  localStorage.setItem("mm_theme", tm);
  const b = $("theme-btn"); if (b) b.textContent = tm === "light" ? "☀️" : "🌙";
}
function toggleTheme() { setTheme(localStorage.getItem("mm_theme") === "light" ? "dark" : "light"); }

/* ---------- language ---------- */
async function applyLanguage(code, statusEl) {
  const meta = langMeta(code);
  const needsAI = !STRINGS[code] && !localStorage.getItem("mm_i18n_" + code);
  if (needsAI && statusEl) statusEl.textContent = aiAvailable()
    ? `Translating to ${meta.en}…`
    : `Showing English (add an AI key to auto-translate to ${meta.en}).`;
  await setLang(code, translateUI, meta.en);
  // refresh JS-rendered, non-static text
  renderHelplines(); renderToolkit(); renderQuote(); renderGreeting(); renderChatSuggestions();
  if (statusEl) statusEl.textContent = "";
}

/* ---------- init ---------- */
async function init() {
  applyStoredTheme();
  EXAMS.forEach((e) => $("onb-exam").appendChild(new Option(e.label, e.id)));
  LANGUAGES.forEach((l) => {
    $("onb-lang").appendChild(new Option(l.name + " · " + l.en, l.code));
    $("set-lang").appendChild(new Option(l.name + " · " + l.en, l.code));
  });

  renderHelplines();
  renderToolkit();
  wireEvents();

  state.profile = store.getProfile();
  if (state.profile?.language) {
    $("onb-lang").value = state.profile.language;
    $("set-lang").value = state.profile.language;
    await applyLanguage(state.profile.language);
  }
  refreshPinStatus();

  // Route: PIN lock → app/onboard
  if (hasPin()) {
    openLock();
  } else if (state.profile) {
    enterApp();
  } else {
    show("screen-onboard");
  }
}

/* ---------- PIN lock ---------- */
function renderPinPad(padId, dotsId, onDigit) {
  const pad = $(padId);
  clear(pad);
  const keys = ["1","2","3","4","5","6","7","8","9","","0","del"];
  keys.forEach((k) => {
    if (k === "") { pad.appendChild(el("span")); return; }
    const b = el("button", "pin-key", k === "del" ? "⌫" : k);
    b.type = "button";
    b.addEventListener("click", () => onDigit(k));
    pad.appendChild(b);
  });
  updateDots(dotsId, 0);
}
function updateDots(dotsId, n) {
  const d = $(dotsId); clear(d);
  for (let i = 0; i < 4; i++) d.appendChild(el("span", "pin-dot" + (i < n ? " filled" : "")));
}

let lockBuf = "";
function openLock() {
  lockBuf = "";
  renderPinPad("lock-pad", "lock-dots", async (k) => {
    lockBuf = k === "del" ? lockBuf.slice(0, -1) : (lockBuf.length < 4 ? lockBuf + k : lockBuf);
    updateDots("lock-dots", lockBuf.length);
    if (lockBuf.length === 4) {
      if (await verifyPin(lockBuf)) {
        state.profile ? enterApp() : show("screen-onboard");
      } else {
        $("lock-error").textContent = "Incorrect PIN. Try again.";
        lockBuf = ""; updateDots("lock-dots", 0);
        setTimeout(() => ($("lock-error").textContent = ""), 1500);
      }
    }
  });
  show("screen-lock");
}

let pinsetBuf = "", pinsetFirst = "";
function openPinSet() {
  pinsetBuf = ""; pinsetFirst = "";
  $("pinset-prompt").textContent = "Choose a 4-digit PIN";
  renderPinPad("pinset-pad", "pinset-dots", async (k) => {
    pinsetBuf = k === "del" ? pinsetBuf.slice(0, -1) : (pinsetBuf.length < 4 ? pinsetBuf + k : pinsetBuf);
    updateDots("pinset-dots", pinsetBuf.length);
    if (pinsetBuf.length === 4) {
      if (!pinsetFirst) {
        pinsetFirst = pinsetBuf; pinsetBuf = "";
        $("pinset-prompt").textContent = "Re-enter to confirm";
        updateDots("pinset-dots", 0);
      } else if (pinsetFirst === pinsetBuf) {
        await setPin(pinsetBuf);
        refreshPinStatus();
        show("screen-settings");
      } else {
        $("pinset-prompt").textContent = "Didn't match — choose again";
        pinsetFirst = ""; pinsetBuf = ""; updateDots("pinset-dots", 0);
      }
    }
  });
  show("screen-pinset");
}
function refreshPinStatus() {
  $("pin-status").textContent = hasPin() ? t("pin_on") : "No PIN set.";
}

/* ---------- onboarding ---------- */
function startOnboarding() {
  state.profile = {
    exam: $("onb-exam").value,
    examLabel: $("onb-exam").selectedOptions[0].text,
    language: $("onb-lang").value,
    nickname: ($("onb-name").value || "").trim(),
  };
  store.saveProfile(state.profile);
  enterApp();
}
function enterApp() {
  show("screen-app");
  renderGreeting(); renderQuote(); renderChatSuggestions(); renderExam();
  switchTab("checkin");
  renderInsights();
}
function renderGreeting() {
  if (!state.profile) return;
  const h = new Date().getHours();
  const g = h < 12 ? t("greeting_morning") : h < 17 ? t("greeting_afternoon") : t("greeting_evening");
  const who = state.profile.nickname ? `, ${state.profile.nickname}` : "";
  $("greeting").textContent = `${g}${who}.`;
}
function renderQuote() {
  const q = QUOTES[Math.floor(Math.random() * QUOTES.length)];
  const card = $("quote-card"); clear(card);
  card.appendChild(el("p", "qt", `“${q.text}”`));
  if (q.author && q.author !== "—") card.appendChild(el("p", "qa", "— " + q.author));
}

/* ---------- tabs ---------- */
function switchTab(name) {
  ["checkin","talk","insights","toolkit","exam"].forEach((t2) => $("tab-" + t2).classList.toggle("hidden", t2 !== name));
  document.querySelectorAll(".tab").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.tab === name)));
  if (name === "insights") renderInsights();
  if (name === "exam") renderExam();
  if (name === "talk" && state.chat.length === 0) seedChat();
}

/* ---------- check-in ---------- */
async function submitCheckin() {
  const text = $("journal").value.trim();
  if (!state.mood && !text) { $("checkin-status").textContent = "Pick a mood or jot a line — whatever's easier."; return; }
  if (assessRisk(text).level === "crisis") { openCrisis(); return; }

  const btn = $("checkin-submit"); btn.disabled = true;
  $("checkin-status").textContent = aiAvailable() ? "MannMitra is reading with care…" : "Reflecting…";

  let analysis;
  try {
    analysis = await analyseEntry({ text, mood: state.mood, exam: state.profile.examLabel, language: langMeta(getLang()).en });
  } catch { analysis = deterministicReflection(text, state.mood); }

  store.addEntry({ mood: state.mood, text, analysis });
  renderReflection(analysis);
  $("checkin-status").textContent = analysis.source === "ai" ? "" : "Offline reflection (add an AI key in ⚙️ for richer replies).";
  btn.disabled = false;
  $("journal").value = "";
  state.mood = null;
  document.querySelectorAll(".mood").forEach((m) => m.setAttribute("aria-pressed", "false"));
}

function renderReflection(a) {
  $("reflection-out").classList.remove("hidden");
  $("reflection-text").textContent = a.reflection || a.insight || "Thanks for checking in.";
  const chips = $("reflection-triggers"); clear(chips);
  (a.triggers || []).forEach((tr) => chips.appendChild(el("span", "chip", tr)));
  const cop = $("reflection-coping"); clear(cop);
  (a.coping || []).forEach((c) => cop.appendChild(el("li", null, c)));
  renderSuggestedTool(a);
}

// Adaptive mindfulness: pick the exercise that fits the detected state.
function renderSuggestedTool(a) {
  const wrap = $("suggested-tool"); clear(wrap);
  const trigs = a.triggers || [];
  let exId = "box";
  if (trigs.includes("loneliness") || trigs.includes("selfdoubt")) exId = "reframe";
  else if (trigs.includes("sleep")) exId = "478";
  else if (trigs.includes("comparison")) exId = "reframe";
  else if (a.sentiment != null && a.sentiment < -0.3) exId = "grounding";
  const ex = EXERCISES.find((e) => e.id === exId);
  if (!ex) return;
  wrap.classList.remove("hidden");
  const b = el("button", "btn btn--ghost btn--block", `${ex.icon} Try: ${ex.title}`);
  b.type = "button";
  b.addEventListener("click", () => openExercise(ex));
  wrap.appendChild(b);
}

/* ---------- companion chat ---------- */
function seedChat() { addBubble("bot", "I'm here. What's weighing on you right now?"); }
function addBubble(role, text) {
  const b = el("div", "bubble " + (role === "user" ? "me" : "bot"), text);
  $("chat").appendChild(b); $("chat").scrollTop = $("chat").scrollHeight;
}
function renderChatSuggestions() {
  const wrap = $("chat-suggestions"); if (!wrap) return; clear(wrap);
  SUGGESTIONS.forEach((s) => {
    const c = el("button", "chip chip--btn", s); c.type = "button";
    c.addEventListener("click", () => { $("chat-input").value = s; $("chat-form").requestSubmit(); });
    wrap.appendChild(c);
  });
}
async function sendChat(e) {
  e.preventDefault();
  const input = $("chat-input"); const text = input.value.trim(); if (!text) return;
  input.value = "";
  if (assessRisk(text).level === "crisis") { addBubble("user", text); openCrisis(); return; }
  addBubble("user", text); state.chat.push({ role: "user", text });
  clear($("chat-suggestions"));
  const thinking = el("div", "bubble bot", "…"); $("chat").appendChild(thinking);
  try {
    const reply = await companionReply({ history: state.chat.slice(-8), exam: state.profile.examLabel, language: langMeta(getLang()).en });
    thinking.remove();
    const safe = reply && reply.trim() ? reply.trim() : fallbackReply();
    addBubble("bot", safe); state.chat.push({ role: "bot", text: safe });
  } catch {
    thinking.remove(); const fb = fallbackReply();
    addBubble("bot", fb); state.chat.push({ role: "bot", text: fb });
  }
}
function fallbackReply() {
  const o = [
    "That sounds genuinely hard. Let's slow it down — one steady breath. What's the single heaviest part right now?",
    "I hear you. You don't have to solve all of it tonight. What's one small thing that would make the next hour lighter?",
    "Thank you for saying it out loud. Pressure lies to us near exams. What would you tell a friend who felt this?",
  ];
  return o[Math.floor(Math.random() * o.length)];
}

/* ---------- insights ---------- */
function renderInsights() {
  const entries = store.getEntries();
  const patterns = detectPatterns(entries);
  const stats = $("insight-stats"); clear(stats);
  const streak = currentStreak(entries);
  stats.appendChild(statBox(entries.length, t("checkins")));
  stats.appendChild(statBox(patterns.avgMood != nul