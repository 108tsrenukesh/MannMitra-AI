// app.js — UI controller. Screen routing, safe DOM rendering, and the safety gate that
// sits in front of every AI interaction.

import { EXAMS, LANGUAGES, HELPLINES, TOOLKIT } from "./config.js";
import { assessRisk } from "./safety.js";
import { analyseEntry, companionReply, setKeys, aiAvailable } from "./ai.js";
import { deterministicReflection, detectPatterns } from "./analysis.js";
import * as store from "./storage.js";
import { buildMoodSeries, buildTriggerCloud, currentStreak } from "./insights.js";

const $ = (id) => document.getElementById(id);

const state = { profile: null, mood: null, chat: [], lastScreen: "screen-app" };

/* ---------- tiny safe-DOM helpers ---------- */
function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}
function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }
function langName(code) { return (LANGUAGES.find((l) => l.code === code) || {}).en || "English"; }

/* ---------- screen routing ---------- */
const SCREENS = ["screen-onboard", "screen-app", "screen-crisis", "screen-settings"];
function show(id) {
  SCREENS.forEach((s) => $(s).classList.toggle("hidden", s !== id));
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* ---------- init ---------- */
function init() {
  applyStoredTheme();
  // populate selects
  EXAMS.forEach((e) => $("onb-exam").appendChild(new Option(e.label, e.id)));
  LANGUAGES.forEach((l) => $("onb-lang").appendChild(new Option(l.name + " · " + l.en, l.code)));

  renderHelplines();
  renderToolkit();
  wireEvents();

  state.profile = store.getProfile();
  if (state.profile) {
    enterApp();
  } else {
    show("screen-onboard");
  }
}

/* ---------- theme ---------- */
function applyStoredTheme() {
  const t = localStorage.getItem("mm_theme") || "dark";
  setTheme(t);
}
function setTheme(t) {
  if (t === "light") document.documentElement.setAttribute("data-theme", "light");
  else document.documentElement.removeAttribute("data-theme");
  localStorage.setItem("mm_theme", t);
  const btn = $("theme-btn");
  if (btn) btn.textContent = t === "light" ? "☀️" : "🌙";
}
function toggleTheme() {
  const now = localStorage.getItem("mm_theme") === "light" ? "dark" : "light";
  setTheme(now);
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
  const who = state.profile.nickname ? `, ${state.profile.nickname}` : "";
  $("greeting").textContent = `Hi${who}. This is your space — no judgement, no scores.`;
  show("screen-app");
  switchTab("checkin");
  renderInsights();
}

/* ---------- tabs ---------- */
function switchTab(name) {
  ["checkin", "talk", "insights", "toolkit"].forEach((t) => {
    $("tab-" + t).classList.toggle("hidden", t !== name);
  });
  document.querySelectorAll(".tab").forEach((b) =>
    b.setAttribute("aria-selected", String(b.dataset.tab === name))
  );
  if (name === "insights") renderInsights();
  if (name === "talk" && state.chat.length === 0) seedChat();
}

/* ---------- check-in flow ---------- */
async function submitCheckin() {
  const text = $("journal").value.trim();
  if (!state.mood && !text) {
    $("checkin-status").textContent = "Pick a mood or jot a line — whatever feels easier.";
    return;
  }

  // SAFETY GATE — before anything else.
  if (assessRisk(text).level === "crisis") {
    openCrisis();
    return;
  }

  const btn = $("checkin-submit");
  btn.disabled = true;
  $("checkin-status").textContent = aiAvailable() ? "MannMitra is reading with care…" : "Reflecting…";

  let analysis;
  try {
    analysis = await analyseEntry({
      text,
      mood: state.mood,
      exam: state.profile.examLabel,
      language: langName(state.profile.language),
    });
  } catch {
    analysis = deterministicReflection(text, state.mood);
  }

  store.addEntry({ mood: state.mood, text, analysis });
  renderReflection(analysis);
  $("checkin-status").textContent = analysis.source === "ai" ? "" : "Offline reflection (add an AI key in ⚙️ for richer replies).";
  btn.disabled = false;

  // reset input for next time
  $("journal").value = "";
  state.mood = null;
  document.querySelectorAll(".mood").forEach((m) => m.setAttribute("aria-pressed", "false"));
}

function renderReflection(a) {
  $("reflection-out").classList.remove("hidden");
  $("reflection-text").textContent = a.reflection || a.insight || "Thanks for checking in.";

  const chips = $("reflection-triggers");
  clear(chips);
  (a.triggers || []).forEach((t) => chips.appendChild(el("span", "chip", t)));

  const cop = $("reflection-coping");
  clear(cop);
  (a.coping || []).forEach((c) => cop.appendChild(el("li", null, c)));
}

/* ---------- companion chat ---------- */
function seedChat() {
  addBubble("bot", "I'm here. What's weighing on you right now?");
}
function addBubble(role, text) {
  const b = el("div", "bubble " + (role === "user" ? "me" : "bot"), text);
  $("chat").appendChild(b);
  $("chat").scrollTop = $("chat").scrollHeight;
}

async function sendChat(e) {
  e.preventDefault();
  const input = $("chat-input");
  const text = input.value.trim();
  if (!text) return;
  input.value = "";

  // SAFETY GATE — every user turn.
  if (assessRisk(text).level === "crisis") {
    addBubble("user", text);
    openCrisis();
    return;
  }

  addBubble("user", text);
  state.chat.push({ role: "user", text });

  const thinking = el("div", "bubble bot", "…");
  $("chat").appendChild(thinking);

  try {
    const reply = await companionReply({
      history: state.chat.slice(-8),
      exam: state.profile.examLabel,
      language: langName(state.profile.language),
    });
    thinking.remove();
    const safe = reply && reply.trim() ? reply.trim() : fallbackReply();
    addBubble("bot", safe);
    state.chat.push({ role: "bot", text: safe });
  } catch {
    thinking.remove();
    const fb = fallbackReply();
    addBubble("bot", fb);
    state.chat.push({ role: "bot", text: fb });
  }
}

function fallbackReply() {
  const options = [
    "That sounds genuinely hard. Let's slow it down — take one steady breath with me. What's the single heaviest part right now?",
    "I hear you. You don't have to solve all of it tonight. What's one small thing that would make the next hour a little lighter?",
    "Thank you for saying it out loud. Comparison and pressure lie to us near exams. What would you tell a friend who felt this?",
  ];
  return options[Math.floor(Math.random() * options.length)];
}

/* ---------- insights ---------- */
function renderInsights() {
  const entries = store.getEntries();
  const patterns = detectPatterns(entries);

  const stats = $("insight-stats");
  clear(stats);
  const streak = currentStreak(entries);
  stats.appendChild(statBox(entries.length, "check-ins"));
  stats.appendChild(statBox(patterns.avgMood != null ? patterns.avgMood : "—", "avg mood"));
  stats.appendChild(statBox(streak, streak === 1 ? "day streak" : "day streak"));

  const pw = $("pattern-week");
  if (patterns.patternOfWeek) {
    pw.textContent = patterns.patternOfWeek;
    pw.classList.remove("hidden");
  } else {
    pw.classList.add("hidden");
  }

  // mood sparkline
  const series = buildMoodSeries(entries).slice(-14);
  const spark = $("mood-spark");
  clear(spark);
  $("spark-empty").classList.toggle("hidden", series.length > 1);
  series.forEach((p) => {
    const bar = el("div", "bar");
    bar.style.height = (p.mood / 5) * 100 + "%";
    bar.title = `${p.label}: ${p.mood}/5`;
    bar.appendChild(el("span", null, p.label));
    spark.appendChild(bar);
  });

  // trigger cloud
  const cloud = buildTriggerCloud(patterns.triggerCounts);
  const cloudEl = $("trigger-cloud");
  clear(cloudEl);
  $("cloud-empty").classList.toggle("hidden", cloud.length > 0);
  cloud.forEach((c) => {
    const t = el("span", "t", c.trigger);
    t.style.fontSize = 0.85 + c.weight * 0.16 + "rem";
    t.title = `${c.count} entries`;
    cloudEl.appendChild(t);
    cloudEl.appendChild(document.createTextNode(" "));
  });
}
function statBox(value, label) {
  const box = el("div", "box");
  box.appendChild(el("b", null, String(value)));
  box.appendChild(el("span", "muted", label));
  return box;
}

/* ---------- toolkit ---------- */
function renderToolkit() {
  const list = $("toolkit-list");
  clear(list);
  TOOLKIT.forEach((tool) => {
    const card = el("div", "tool");
    card.appendChild(el("h3", null, tool.title));
    card.appendChild(el("p", "muted", tool.desc));
    if (tool.kind === "breathing") {
      const circle = el("div", "breath-circle", "Breathe");
      const btn = el("button", "btn btn--block", "Start 4-4-4-4");
      btn.type = "button";
      btn.addEventListener("click", () => runBreathing(circle, btn));
      card.appendChild(circle);
      card.appendChild(btn);
    } else if (tool.kind === "steps") {
      const ol = el("ol");
      tool.steps.forEach((s) => ol.appendChild(el("li", null, s)));
      card.appendChild(ol);
    }
    list.appendChild(card);
  });
}
let breathTimer = null;
function runBreathing(circle, btn) {
  if (breathTimer) { clearInterval(breathTimer); breathTimer = null; circle.classList.remove("in"); circle.textContent = "Breathe"; btn.textContent = "Start 4-4-4-4"; return; }
  btn.textContent = "Stop";
  const phases = [["Breathe in", true], ["Hold", true], ["Breathe out", false], ["Hold", false]];
  let i = 0;
  const tick = () => {
    const [label, big] = phases[i % 4];
    circle.textContent = label;
    circle.classList.toggle("in", big);
    i++;
  };
  tick();
  breathTimer = setInterval(tick, 4000);
}

/* ---------- crisis ---------- */
function renderHelplines() {
  const wrap = $("crisis-helplines");
  clear(wrap);
  HELPLINES.forEach((h) => {
    const row = el("div", "help");
    const left = el("div");
    left.appendChild(el("div", "num", h.number));
    left.appendChild(el("div", "muted", h.name + " · " + h.note));
    const call = el("a", "btn btn--primary");
    call.href = "tel:" + h.dial;
    call.textContent = "Call";
    row.appendChild(left);
    row.appendChild(call);
    wrap.appendChild(row);
  });
}
function openCrisis() {
  state.lastScreen = SCREENS.find((s) => !$(s).classList.contains("hidden")) || "screen-app";
  show("screen-crisis");
}

/* ---------- settings ---------- */
function saveSettings() {
  setKeys({ gemini: $("set-gemini").value, groq: $("set-groq").value });
  $("set-gemini").value = "";
  $("set-groq").value = "";
  alert("Keys saved for this session.");
  show("screen-app");
}

/* ---------- events ---------- */
function wireEvents() {
  $("theme-btn").addEventListener("click", toggleTheme);
  $("onb-start").addEventListener("click", startOnboarding);

  document.querySelectorAll(".mood").forEach((b) =>
    b.addEventListener("click", () => {
      state.mood = Number(b.dataset.mood);
      document.querySelectorAll(".mood").forEach((m) =>
        m.setAttribute("aria-pressed", String(m === b))
      );
    })
  );
  $("checkin-submit").addEventListener("click", submitCheckin);
  $("goto-talk").addEventListener("click", () => switchTab("talk"));

  document.querySelectorAll(".tab").forEach((b) =>
    b.addEventListener("click", () => switchTab(b.dataset.tab))
  );

  $("chat-form").addEventListener("submit", sendChat);

  $("sos-btn").addEventListener("click", openCrisis);
  $("crisis-back").addEventListener("click", () => show(state.lastScreen));

  $("settings-btn").addEventListener("click", () => show("screen-settings"));
  $("set-back").addEventListener("click", () => show(state.profile ? "screen-app" : "screen-onboard"));
  $("set-save").addEventListener("click", saveS