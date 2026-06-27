// app.js — UI controller. Screens, i18n, PIN, safety plan, brain-dump, and the crisis
// safety gate (offline keyword) + optional AI semantic second layer in front of AI calls.

import { EXAMS, LANGUAGES, HELPLINES, EXERCISES, SUGGESTIONS, QUOTES } from "./config.js";
import { assessRisk } from "./safety.js";
import { analyseEntry, companionReply, setKeys, aiAvailable, translateUI, brainDump, assessRiskAI, getAINote } from "./ai.js";
import { deterministicReflection, detectPatterns } from "./analysis.js";
import * as store from "./storage.js";
import { buildMoodSeries, buildTriggerCloud, currentStreak } from "./insights.js";
import { t, setLang, getLang, STRINGS, applyTranslations } from "./i18n.js";
import { hasPin, setPin, verifyPin, clearPin } from "./auth.js";

const $ = (id) => document.getElementById(id);
const state = { profile: null, mood: null, chat: [], lastScreen: "screen-app" };

function el(tag, cls, text) { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }
function langMeta(code) { return LANGUAGES.find((l) => l.code === code) || LANGUAGES[0]; }

const SCREENS = ["screen-lock", "screen-onboard", "screen-app", "screen-crisis", "screen-settings", "screen-pinset"];
function show(id) { SCREENS.forEach((s) => $(s).classList.toggle("hidden", s !== id)); window.scrollTo({ top: 0, behavior: "smooth" }); }

function applyStoredTheme() { setTheme(localStorage.getItem("mm_theme") || "dark"); }
function setTheme(tm) {
  if (tm === "light") document.documentElement.setAttribute("data-theme", "light");
  else document.documentElement.removeAttribute("data-theme");
  localStorage.setItem("mm_theme", tm);
  const b = $("theme-btn"); if (b) b.textContent = tm === "light" ? "☀️" : "🌙";
}
function toggleTheme() { setTheme(localStorage.getItem("mm_theme") === "light" ? "dark" : "light"); }

async function applyLanguage(code, statusEl) {
  const meta = langMeta(code);
  const needsAI = !STRINGS[code] && !localStorage.getItem("mm_i18n_" + code);
  if (needsAI && statusEl) statusEl.textContent = aiAvailable() ? "Translating to " + meta.en + "…" : "Showing English (add an AI key to auto-translate to " + meta.en + ").";
  await setLang(code, translateUI, meta.en);
  renderHelplines(); renderToolkit(); renderQuote(); renderGreeting(); renderChatSuggestions();
  if (statusEl) statusEl.textContent = "";
}

async function init() {
  applyStoredTheme();
  EXAMS.forEach((e) => $("onb-exam").appendChild(new Option(e.label, e.id)));
  LANGUAGES.forEach((l) => { $("onb-lang").appendChild(new Option(l.name + " · " + l.en, l.code)); $("set-lang").appendChild(new Option(l.name + " · " + l.en, l.code)); });
  renderHelplines(); renderToolkit(); wireEvents(); injectSettingsExtras(); injectBrainDumpButton(); injectHelpButton(); applyTranslations();
  state.profile = store.getProfile();
  if (state.profile && state.profile.language) { $("onb-lang").value = state.profile.language; $("set-lang").value = state.profile.language; await applyLanguage(state.profile.language); }
  refreshPinStatus();
  if (hasPin()) openLock(); else if (state.profile) enterApp(); else show("screen-onboard");
  openWelcome(false);
}

/* ---------- PIN ---------- */
function renderPinPad(padId, dotsId, onDigit) {
  const pad = $(padId); clear(pad);
  ["1","2","3","4","5","6","7","8","9","","0","del"].forEach((k) => {
    if (k === "") { pad.appendChild(el("span")); return; }
    const b = el("button", "pin-key", k === "del" ? "⌫" : k); b.type = "button"; b.addEventListener("click", () => onDigit(k)); pad.appendChild(b);
  });
  updateDots(dotsId, 0);
}
function updateDots(dotsId, n) { const d = $(dotsId); clear(d); for (let i = 0; i < 4; i++) d.appendChild(el("span", "pin-dot" + (i < n ? " filled" : ""))); }
let lockBuf = "";
function openLock() {
  lockBuf = "";
  renderPinPad("lock-pad", "lock-dots", async (k) => {
    lockBuf = k === "del" ? lockBuf.slice(0, -1) : (lockBuf.length < 4 ? lockBuf + k : lockBuf);
    updateDots("lock-dots", lockBuf.length);
    if (lockBuf.length === 4) {
      if (await verifyPin(lockBuf)) { state.profile ? enterApp() : show("screen-onboard"); }
      else { $("lock-error").textContent = "Incorrect PIN. Try again."; lockBuf = ""; updateDots("lock-dots", 0); setTimeout(() => ($("lock-error").textContent = ""), 1500); }
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
      if (!pinsetFirst) { pinsetFirst = pinsetBuf; pinsetBuf = ""; $("pinset-prompt").textContent = "Re-enter to confirm"; updateDots("pinset-dots", 0); }
      else if (pinsetFirst === pinsetBuf) { await setPin(pinsetBuf); refreshPinStatus(); show("screen-settings"); }
      else { $("pinset-prompt").textContent = "Didn't match — choose again"; pinsetFirst = ""; pinsetBuf = ""; updateDots("pinset-dots", 0); }
    }
  });
  show("screen-pinset");
}
function refreshPinStatus() { $("pin-status").textContent = hasPin() ? t("pin_on") : "No PIN set."; }

/* ---------- onboarding ---------- */
async function startOnboarding() {
  state.profile = { exam: $("onb-exam").value, examLabel: $("onb-exam").selectedOptions[0].text, language: $("onb-lang").value, nickname: ($("onb-name").value || "").trim() };
  store.saveProfile(state.profile);
  const btn = $("onb-start"); if (btn) btn.disabled = true;
  // Generate a unique 4-digit access code the user must save to return to their history.
  const code = String(Math.floor(1000 + Math.random() * 9000));
  await setPin(code);
  refreshPinStatus();
  if (btn) btn.disabled = false;
  openPinReveal(code);
}
function openPinReveal(code) {
  const overlay = el("div", "overlay"); const box = el("div", "modal");
  box.style.maxWidth = "430px"; box.style.textAlign = "center";
  box.appendChild(el("h3", null, "🔐 Your access code"));
  box.appendChild(el("p", "muted", "Save this 4-digit code. You'll need it to open MannMitra and see your history next time on this device."));
  const codeEl = el("div", "count-big", code); codeEl.style.letterSpacing = "0.32em"; box.appendChild(codeEl);
  const copy = el("button", "btn btn--block", "📋 Copy code"); copy.type = "button"; copy.style.marginBottom = "8px";
  copy.addEventListener("click", () => { try { if (navigator.clipboard) navigator.clipboard.writeText(code).catch(() => {}); } catch {} copy.textContent = "Copied ✓"; });
  box.appendChild(copy);
  box.appendChild(el("p", "muted", "You can change it later in ⚙️ Settings. If you forget it, you can reset by deleting your data — but your history will be erased."));
  const ok = el("button", "btn btn--primary btn--block", "I've saved it — continue"); ok.type = "button";
  ok.addEventListener("click", () => { overlay.remove(); enterApp(); });
  box.appendChild(ok);
  overlay.appendChild(box); document.body.appendChild(overlay); // no click-outside dismiss — force acknowledgement
}
function enterApp() { show("screen-app"); renderGreeting(); renderQuote(); renderChatSuggestions(); renderExam(); switchTab("checkin"); renderInsights(); }
function renderGreeting() {
  if (!state.profile) return;
  const h = new Date().getHours();
  const g = h < 12 ? t("greeting_morning") : h < 17 ? t("greeting_afternoon") : t("greeting_evening");
  const who = state.profile.nickname ? ", " + state.profile.nickname : "";
  $("greeting").textContent = g + who + ".";
}
function renderQuote() {
  const q = QUOTES[Math.floor(Math.random() * QUOTES.length)];
  const card = $("quote-card"); clear(card);
  card.appendChild(el("p", "qt", "“" + q.text + "”"));
  if (q.author && q.author !== "—") card.appendChild(el("p", "qa", "— " + q.author));
}

/* ---------- tabs ---------- */
function switchTab(name) {
  ["checkin","talk","insights","toolkit","exam"].forEach((x) => $("tab-" + x).classList.toggle("hidden", x !== name));
  document.querySelectorAll(".tab").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.tab === name)));
  if (name === "insights") renderInsights();
  if (name === "exam") renderExam();
  if (name === "talk" && state.chat.length === 0) seedChat();
}

/* ---------- check-in ---------- */
async function submitCheckin() {
  const text = $("journal").value.trim();
  if (!state.mood && !text) { $("checkin-status").textContent = "Pick a mood or jot a line — whatever's easier."; return; }
  if (assessRisk(text).level === "crisis") { openCrisis(); return; }          // offline gate (primary)
  const btn = $("checkin-submit"); btn.disabled = true;
  $("checkin-status").textContent = aiAvailable() ? "MannMitra is reading with care…" : "Reflecting…";
  if (text && aiAvailable()) { try { if (await assessRiskAI(text)) { btn.disabled = false; openCrisis(); return; } } catch {} }  // AI second layer (online)
  let analysis;
  try { analysis = await analyseEntry({ text, mood: state.mood, exam: state.profile.examLabel, language: langMeta(getLang()).en }); }
  catch { analysis = deterministicReflection(text, state.mood); }
  store.addEntry({ mood: state.mood, text, analysis });
  renderReflection(analysis);
  if (analysis.source === "ai") $("checkin-status").textContent = "";
  else if (getAINote() === "limit") $("checkin-status").textContent = "🚦 Today's AI limit is reached — I'm running fully in offline mode (still 100% helpful!). Add your own key in ⚙️ Settings to continue with AI; the limit refreshes later.";
  else $("checkin-status").textContent = "Offline reflection — the hosted version has AI on by default; or add your own key in ⚙️ Settings.";
  btn.disabled = false; $("journal").value = ""; state.mood = null;
  document.querySelectorAll(".mood").forEach((m) => m.setAttribute("aria-pressed", "false"));
}
function renderReflection(a) {
  $("reflection-out").classList.remove("hidden");
  $("reflection-text").textContent = a.reflection || a.insight || "Thanks for checking in.";
  const chips = $("reflection-triggers"); clear(chips); (a.triggers || []).forEach((tr) => chips.appendChild(el("span", "chip", tr)));
  const cop = $("reflection-coping"); clear(cop); (a.coping || []).forEach((c) => cop.appendChild(el("li", null, c)));
  renderSuggestedTool(a);
}
function renderSuggestedTool(a) {
  const wrap = $("suggested-tool"); clear(wrap);
  const trigs = a.triggers || [];
  const variety = ["box","478","grounding","gratitude"];
  let exId = variety[store.getEntries().length % variety.length];
  if (trigs.includes("comparison")) exId = "rankreframe";
  else if (trigs.includes("loneliness")) exId = "connect";
  else if (trigs.includes("selfdoubt")) exId = "reframe";
  else if (trigs.includes("sleep")) exId = "478";
  else if (a.sentiment != null && a.sentiment < -0.3) exId = "grounding";
  const ex = EXERCISES.find((e) => e.id === exId);
  if (!ex) return;
  wrap.classList.remove("hidden");
  const b = el("button", "btn btn--ghost btn--block", ex.icon + " Try: " + ex.title); b.type = "button";
  b.addEventListener("click", () => openExercise(ex)); wrap.appendChild(b);
}

/* ---------- chat ---------- */
function seedChat() { addBubble("bot", "I'm here. What's weighing on you right now?"); }
function addBubble(role, text) { const b = el("div", "bubble " + (role === "user" ? "me" : "bot"), text); $("chat").appendChild(b); $("chat").scrollTop = $("chat").scrollHeight; }
function renderChatSuggestions() {
  const wrap = $("chat-suggestions"); if (!wrap) return; clear(wrap);
  SUGGESTIONS.forEach((s) => { const c = el("button", "chip chip--btn", s); c.type = "button"; c.addEventListener("click", () => { $("chat-input").value = s; $("chat-form").requestSubmit(); }); wrap.appendChild(c); });
}
async function sendChat(e) {
  e.preventDefault();
  const input = $("chat-input"); const text = input.value.trim(); if (!text) return;
  input.value = "";
  if (assessRisk(text).level === "crisis") { addBubble("user", text); openCrisis(); return; }   // offline gate
  addBubble("user", text); state.chat.push({ role: "user", text }); clear($("chat-suggestions"));
  const thinking = el("div", "bubble bot", "…"); $("chat").appendChild(thinking);
  if (aiAvailable()) { try { if (await assessRiskAI(text)) { thinking.remove(); openCrisis(); return; } } catch {} }  // AI second layer
  try {
    const reply = await companionReply({ history: state.chat.slice(-8), exam: state.profile.examLabel, language: langMeta(getLang()).en });
    thinking.remove(); const safe = reply && reply.trim() ? reply.trim() : fallbackReply(); addBubble("bot", safe); state.chat.push({ role: "bot", text: safe });
  } catch { thinking.remove(); const fb = fallbackReply(); addBubble("bot", fb); state.chat.push({ role: "bot", text: fb }); }
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
  const entries = store.getEntries(); const patterns = detectPatterns(entries);
  const stats = $("insight-stats"); clear(stats);
  const streak = currentStreak(entries);
  stats.appendChild(statBox(entries.length, t("checkins")));
  stats.appendChild(statBox(patterns.avgMood != null ? patterns.avgMood : "—", t("avg_mood")));
  stats.appendChild(statBox(streak, t("streak")));
  const pw = $("pattern-week");
  if (patterns.patternOfWeek) { pw.textContent = patterns.patternOfWeek; pw.classList.remove("hidden"); } else pw.classList.add("hidden");
  const series = buildMoodSeries(entries).slice(-14);
  const spark = $("mood-spark"); clear(spark); $("spark-empty").classList.toggle("hidden", series.length > 1);
  series.forEach((p) => { const bar = el("div", "bar"); bar.style.height = (p.mood / 5) * 100 + "%"; bar.title = (p.full || p.label) + "  ·  mood " + p.mood + "/5"; bar.appendChild(el("span", null, p.label)); spark.appendChild(bar); });
  renderMoodDistribution(entries);
  const cloud = buildTriggerCloud(patterns.triggerCounts);
  const cloudEl = $("trigger-cloud"); clear(cloudEl); $("cloud-empty").classList.toggle("hidden", cloud.length > 0);
  cloud.forEach((c) => { const tg = el("span", "t", c.trigger); tg.style.fontSize = (0.85 + c.weight * 0.16) + "rem"; tg.title = c.count + " entries"; cloudEl.appendChild(tg); cloudEl.appendChild(document.createTextNode(" ")); });
}
function statBox(v, label) { const box = el("div", "box"); box.appendChild(el("b", null, String(v))); box.appendChild(el("span", "muted", label)); return box; }
function renderMoodDistribution(entries) {
  const dist = $("mood-dist"); clear(dist);
  const moods = entries.filter((e) => typeof e.mood === "number");
  if (moods.length === 0) { dist.appendChild(el("p", "muted", "Log a few moods to see the spread.")); return; }
  const counts = { 1:0,2:0,3:0,4:0,5:0 }; moods.forEach((e) => (counts[e.mood] = (counts[e.mood] || 0) + 1));
  const max = Math.max(...Object.values(counts), 1); const emoji = { 1:"😣",2:"😟",3:"😐",4:"🙂",5:"😄" };
  for (let m = 5; m >= 1; m--) {
    const row = el("div", "dist-row"); row.appendChild(el("span", "dist-emoji", emoji[m]));
    const track = el("div", "dist-track"); const fill = el("div", "dist-fill"); fill.style.width = (counts[m] / max) * 100 + "%";
    track.appendChild(fill); row.appendChild(track); row.appendChild(el("span", "dist-num", String(counts[m]))); dist.appendChild(row);
  }
}

/* ---------- exam ---------- */
function renderExam() {
  const stored = localStorage.getItem("mm_exam_date") || "";
  if (stored) $("exam-date").value = stored;
  const cd = $("exam-countdown"); clear(cd); const tips = $("exam-tips");
  if (stored) {
    const days = Math.max(0, Math.ceil((new Date(stored) - new Date()) / 86400000));
    cd.appendChild(el("div", "count-big", String(days))); cd.appendChild(el("div", "muted", t("exam_days")));
    tips.textContent = days > 30 ? "Plenty of runway. Build steady habits now — sleep, breaks, one topic at a time."
      : days > 7 ? "Final stretch. Protect your sleep and take real breaks — tired revision sticks poorly."
      : "Almost there. Trust your prep, breathe, and be kind to yourself. You've done the work.";
  } else { cd.appendChild(el("div", "muted", "Set your exam date to see a gentle countdown.")); tips.textContent = ""; }
}

/* ---------- toolkit ---------- */
function renderToolkit() {
  const list = $("toolkit-list"); if (!list) return; clear(list);
  EXERCISES.forEach((ex) => {
    const card = el("div", "tool"); card.appendChild(el("h3", null, ex.icon + " " + ex.title)); card.appendChild(el("p", "muted", ex.desc));
    const b = el("button", "btn btn--block", "Start"); b.type = "button"; b.addEventListener("click", () => openExercise(ex)); card.appendChild(b); list.appendChild(card);
  });
}
let exerciseTimer = null;
function openExercise(ex) {
  const overlay = el("div", "overlay"); const box = el("div", "modal"); box.appendChild(el("h3", null, ex.icon + " " + ex.title));
  if (ex.kind === "phased") {
    const circle = el("div", "breath-circle", ex.phases[0].label); const count = el("div", "count-big", ex.phases[0].secs + "s");
    box.appendChild(circle); box.appendChild(count);
    let pi = 0, left = ex.phases[0].secs; circle.classList.toggle("in", ex.phases[0].big);
    exerciseTimer = setInterval(() => { left--; if (left <= 0) { pi = (pi + 1) % ex.phases.length; left = ex.phases[pi].secs; circle.textContent = ex.phases[pi].label; circle.classList.toggle("in", ex.phases[pi].big); } count.textContent = left + "s"; }, 1000);
  } else { const ol = el("ol", "coping"); ex.steps.forEach((s) => ol.appendChild(el("li", null, s))); box.appendChild(ol); }
  const done = el("button", "btn btn--primary btn--block", "Done — how do you feel now?"); done.type = "button";
  const closeFn = () => { if (exerciseTimer) { clearInterval(exerciseTimer); exerciseTimer = null; } overlay.remove(); };
  done.addEventListener("click", closeFn); overlay.addEventListener("click", (e) => { if (e.target === overlay) closeFn(); });
  box.appendChild(done); overlay.appendChild(box); document.body.appendChild(overlay);
}

/* ---------- brain dump (organize, do not treat) ---------- */
function injectBrainDumpButton() {
  if (document.getElementById("braindump-btn")) return;
  const sub = $("checkin-submit"); if (!sub) return;
  const bd = el("button", "btn btn--ghost btn--block", "🧠 Brain dump — organize a messy rant");
  bd.id = "braindump-btn"; bd.type = "button"; bd.style.marginBottom = "10px";
  bd.addEventListener("click", openBrainDump); sub.before(bd);
}
function openBrainDump() {
  const overlay = el("div", "overlay"); const box = el("div", "modal"); box.style.textAlign = "left"; box.style.maxHeight = "85vh"; box.style.overflowY = "auto";
  box.appendChild(el("h3", null, "🧠 Brain dump"));
  box.appendChild(el("p", "muted", "Pour out everything on your mind — messy is fine. I'll sort it into clear buckets. I organise, I don't diagnose."));
  const ta = el("textarea"); ta.placeholder = "Just type it all out…"; ta.style.minHeight = "120px"; box.appendChild(ta);
  const out = el("div"); out.style.marginTop = "12px";
  const go = el("button", "btn btn--primary btn--block", "Organize my thoughts"); go.type = "button";
  go.addEventListener("click", async () => {
    const text = ta.value.trim(); if (!text) return;
    if (assessRisk(text).level === "crisis") { overlay.remove(); openCrisis(); return; }
    go.disabled = true; go.textContent = aiAvailable() ? "Organizing…" : "Organizing (offline)…";
    let buckets;
    try { buckets = await brainDump({ text, exam: (state.profile && state.profile.examLabel) || "exams", language: langMeta(getLang()).en }); } catch { buckets = []; }
    clear(out);
    if (!buckets || buckets.length === 0) out.appendChild(el("p", "muted", "Couldn't sort that — try a few more sentences."));
    (buckets || []).forEach((b) => {
      const card = el("div", "reflection"); card.style.marginBottom = "8px";
      card.appendChild(el("strong", null, b.bucket || "Theme"));
      (b.items || []).forEach((it) => card.appendChild(el("p", null, "• " + it)));
      if (b.tip) card.appendChild(el("p", "qa", "→ " + b.tip));
      out.appendChild(card);
    });
    go.disabled = false; go.textContent = "Organize my thoughts";
  });
  box.appendChild(go); box.appendChild(out);
  const done = el("button", "btn btn--ghost btn--block", "Close"); done.type = "button"; done.addEventListener("click", () => overlay.remove()); box.appendChild(done);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) overlay.remove(); });
  overlay.appendChild(box); document.body.appendChild(overlay);
}

/* ---------- safety plan ---------- */
const SP_FIELDS = [
  { key: "warning", label: "Warning signs I am not okay", ph: "e.g. cannot sleep, skipping meals, spiralling thoughts" },
  { key: "coping", label: "Things that calm me down", ph: "e.g. box breathing, a walk, music" },
  { key: "distract", label: "People or places that distract me", ph: "e.g. call a friend, sit in the common room" },
  { key: "people", label: "People I can reach out to", ph: "name — number" },
  { key: "reasons", label: "My reasons to keep going", ph: "what matters to me" },
];
function openSafetyPlan(view) {
  const plan = store.getSafetyPlan() || {};
  const overlay = el("div", "overlay"); const box = el("div", "modal"); box.style.textAlign = "left"; box.style.maxHeight = "85vh"; box.style.overflowY = "auto";
  box.appendChild(el("h3", null, "🛟 My safety plan"));
  box.appendChild(el("p", "muted", view ? "Your calmer-moment plan, here when you need it." : "Fill this in a calm moment. It stays only on this device."));
  const inputs = {};
  SP_FIELDS.forEach((f) => {
    box.appendChild(el("label", null, f.label));
    if (view) { box.appendChild(el("p", null, plan[f.key] || "—")); }
    else { const ta = el("textarea"); ta.value = plan[f.key] || ""; ta.placeholder = f.ph; ta.style.minHeight = "52px"; inputs[f.key] = ta; box.appendChild(ta); }
  });
  box.appendChild(el("p", "muted", "In crisis now: Tele-MANAS 14416 · iCall 022-2552-1111"));
  const close = () => overlay.remove();
  if (!view) { const save = el("button", "btn btn--primary btn--block", "Save my plan"); save.type = "button"; save.addEventListener("click", () => { const np = {}; SP_FIELDS.forEach((f) => (np[f.key] = inputs[f.key].value.trim())); store.saveSafetyPlan(np); close(); }); box.appendChild(save); }
  const done = el("button", "btn btn--ghost btn--block", "Close"); done.type = "button"; done.addEventListener("click", close); box.appendChild(done);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); }); overlay.appendChild(box); document.body.appendChild(overlay);
}

/* ---------- crisis ---------- */
function renderHelplines() {
  const wrap = $("crisis-helplines"); clear(wrap);
  HELPLINES.forEach((h) => {
    const row = el("div", "help"); const left = el("div");
    left.appendChild(el("div", "num", h.number)); left.appendChild(el("div", "muted", h.name + " · " + h.note));
    const call = el("a", "btn btn--primary"); call.href = "tel:" + h.dial; call.textContent = "Call";
    row.appendChild(left); row.appendChild(call); wrap.appendChild(row);
  });
}
function openCrisis() {
  state.lastScreen = SCREENS.find((s) => !$(s).classList.contains("hidden")) || "screen-app";
  const wrap = $("crisis-helplines"); let b = document.getElementById("crisis-sp-btn");
  if (wrap && !b) { b = el("button", "btn btn--block"); b.id = "crisis-sp-btn"; b.type = "button"; b.style.marginBottom = "10px"; b.addEventListener("click", () => openSafetyPlan(Boolean(store.getSafetyPlan()))); wrap.parentNode.insertBefore(b, wrap); }
  if (b) b.textContent = store.getSafetyPlan() ? "🛟 Open my safety plan" : "🛟 Create a safety plan";
  show("screen-crisis");
}

/* ---------- settings ---------- */
function saveSettings() { setKeys({ gemini: $("set-gemini").value, groq: $("set-groq").value }); $("set-gemini").value = ""; $("set-groq").value = ""; $("pin-status").textContent = "Keys saved for this session."; show("screen-app"); }
function injectSettingsExtras() {
  if (document.getElementById("settings-sp-btn")) return;
  const sp = el("button", "btn btn--block", "🛟 Create / edit my safety plan"); sp.id = "settings-sp-btn"; sp.type = "button"; sp.style.marginTop = "10px"; sp.addEventListener("click", () => openSafetyPlan(false));
  const note = el("p", "muted"); note.style.marginTop = "14px"; note.style.fontSize = ".78rem";
  note.textContent = "MannMitra is evidence-informed (journaling, CBT-style reflection, grounding) and built for healthy use. Not a doctor or therapist. No ads, no tracking; your words are never used to train AI and never leave your device except the text you send for a reflection.";
  const back = $("set-back"); if (back) { back.before(sp); back.before(note); }
}

/* ---------- welcome / read-me tour ---------- */
function injectHelpButton() {
  if (document.getElementById("help-btn")) return;
  const sb = $("settings-btn"); if (!sb) return;
  const b = el("button", "btn btn--ghost", "❔"); b.id = "help-btn"; b.type = "button";
  b.title = "How MannMitra helps"; b.setAttribute("aria-label", "How it works");
  b.addEventListener("click", () => openWelcome(true));
  sb.before(b);
}
function openWelcome(force) {
  if (!force && localStorage.getItem("mm_seen_welcome")) return;
  const overlay = el("div", "overlay"); const box = el("div", "modal");
  box.style.textAlign = "left"; box.style.maxWidth = "470px"; box.style.maxHeight = "88vh"; box.style.overflowY = "auto";
  box.appendChild(el("h3", null, "🪷 Read me first — how I can help you"));
  box.appendChild(el("p", "muted", "MannMitra is your private, always-on wellbeing companion through exam prep. Here's the 30-second tour:"));
  const steps = [
    ["📝 Check-in", "Log your mood + jot a line. I reflect back — spotting hidden stress triggers and a small coping tip."],
    ["🧠 Brain dump", "Pour out a messy rant; I sort it into clear buckets (syllabus, rank, sleep). I organise, I don't diagnose."],
    ["💬 Talk", "A calm chat companion for real-time coping. Not a therapist — a friend who gets exam pressure."],
    ["📈 Patterns", "Your mood trend (with date & time), distribution, and recurring themes over days."],
    ["🧰 Toolkit", "Breathing, grounding, and a Rank-anxiety reframe — all work fully offline."],
    ["🎯 Exam", "Set your exam date for a gentle, paced countdown."],
    ["🆘 SOS", "If you ever feel unsafe, the red button — and I, automatically — connect you to real helplines instantly."],
  ];
  steps.forEach((st) => { const c = el("div", "reflection"); c.style.marginBottom = "8px"; c.appendChild(el("strong", null, st[0])); c.appendChild(el("p", null, st[1])); box.appendChild(c); });
  box.appendChild(el("p", "muted", "🔒 Private & anonymous — your words stay on this device. I'm a supportive companion, not a doctor."));
  const dismiss = () => { localStorage.setItem("mm_seen_welcome", "1"); overlay.remove(); };
  const ok = el("button", "btn btn--primary btn--block", "Got it — let's begin"); ok.type = "button"; ok.addEventListener("click", dismiss);
  box.appendChild(ok);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) dismiss(); });
  overlay.appendChild(box); document.body.appendChild(overlay);
}

/* ---------- events ---------- */
function wireEvents() {
  $("theme-btn").addEventListener("click", toggleTheme);
  $("onb-start").addEventListener("click", startOnboarding);
  $("onb-lang").addEventListener("change", (e) => applyLanguage(e.target.value, $("lang-status")));
  $("set-lang").addEventListener("change", async (e) => { await applyLanguage(e.target.value, $("set-lang-status")); if (state.profile) { state.profile.language = e.target.value; store.saveProfile(state.profile); } $("onb-lang").value = e.target.value; });
  document.querySelectorAll(".mood").forEach((b) => b.addEventListener("click", () => { state.mood = Number(b.dataset.mood); document.querySelectorAll(".mood").forEach((m) => m.setAttribute("aria-pressed", String(m === b))); }));
  $("checkin-submit").addEventListener("click", submitCheckin);
  $("goto-talk").addEventListener("click", () => switchTab("talk"));
  document.querySelectorAll(".tab").forEach((b) => b.addEventListener("click", () => switchTab(b.dataset.tab)));
  $("chat-form").addEventListener("submit", sendChat);
  $("exam-date").addEventListener("change", (e) => { localStorage.setItem("mm_exam_date", e.target.value); renderExam(); });
  $("sos-btn").addEventListener("click", openCrisis);
  $("crisis-back").addEventListener("click", () => show(state.lastScreen));
  $("settings-btn").addEventListener("click", () => show("screen-settings"));
  $("set-back").addEventListener("click", () => show(state.profile ? "screen-app" : "screen-onboard"));
  $("set-save").addEventListener("click", saveSettings);
  $("data-export").addEventListener("click", exportData);
  $("data-delete").addEventListener("click", deleteData);
  $("pin-set").addEventListener("click", openPinSet);
  $("pin-clear").addEventListener("click", () => { clearPin(); refreshPinStatus(); });
  $("pinset-cancel").addEventListener("click", () => show("screen-settings"));
}
function exportData() { const blob = new Blob([store.exportData()], { type: "application/json" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "mannmitra-data.json"; a.click(); URL.revokeObjectURL(url); }
function deleteData() { if (confirm("Delete all your check-ins, profile and PIN from this device? This can't be undone.")) { store.deleteAll(); clearPin(); state.profile = null; state.chat = []; show("screen-onboard"); } }

if ("serviceWorker" in navigator) navigator.serviceWorker.register("./service-worker.js").catch(() => {});
init();
