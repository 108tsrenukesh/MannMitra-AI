// app.test.js — framework-free unit tests. Runs in the browser (tests.html) and Node.
// Focus: the safety classifier (most important), triggers, patterns, insights, i18n, PIN.
import { assessRisk, isCrisis } from "./safety.js";
import { detectTriggers, sentimentScore, deterministicReflection, detectPatterns } from "./analysis.js";
import { buildMoodSeries, buildTriggerCloud, currentStreak } from "./insights.js";
import { t } from "./i18n.js";
import { hasPin, setPin, verifyPin, clearPin } from "./auth.js";

function assert(c, m) { if (!c) throw new Error(m || "assertion failed"); }
function eq(a, b, m) { if (a !== b) throw new Error((m || "expected equality") + ` (got ${a}, expected ${b})`); }
const dayMs = 86400000;

export const tests = [
  { name: "crisis: explicit English suicidal statement", fn() { eq(assessRisk("i want to kill myself").level, "crisis"); } },
  { name: "crisis: 'no reason to live'", fn() { eq(assessRisk("there's no reason to live anymore").level, "crisis"); } },
  { name: "crisis: Hinglish 'marna chahta hu'", fn() { assert(assessRisk("mai marna chahta hu").level === "crisis"); } },
  { name: "crisis: Devanagari आत्महत्या", fn() { eq(assessRisk("मैं आत्महत्या के बारे में सोच रहा हूँ").level, "crisis"); } },
  { name: "crisis: self-harm phrasing", fn() { eq(assessRisk("i keep thinking about cutting myself").level, "crisis"); } },
  { name: "isCrisis helper true for crisis text", fn() { assert(isCrisis("i want to end my life")); } },
  { name: "high-distress: hopelessness flagged not crisis", fn() { eq(assessRisk("i feel completely hopeless about this").level, "high"); } },
  { name: "normal: ordinary stress not a crisis", fn() { eq(assessRisk("i'm stressed about my chemistry mock").level, "normal"); assert(!isCrisis("the syllabus is huge")); } },
  { name: "normal: empty/non-string is safe", fn() { eq(assessRisk("").level, "normal"); eq(assessRisk(null).level, "normal"); } },
  { name: "triggers: comparison + sleep", fn() { const x = detectTriggers("everyone else is ahead and i barely slept"); assert(x.includes("comparison")); assert(x.includes("sleep")); } },
  { name: "sentiment: negative vs positive", fn() { assert(sentimentScore("so much stress and anxiety and fear") < 0); assert(sentimentScore("i feel calm and confident today") > 0); } },
  { name: "deterministicReflection full shape", fn() { const r = deterministicReflection("parents keep comparing me to the topper", 2); assert(r.reflection.length > 0); assert(r.triggers.includes("comparison")); assert(r.coping.length >= 1); eq(r.source, "offline"); } },
  { name: "detectPatterns averages mood + counts triggers", fn() { const now = Date.now(); const e = [ { ts: now - 2*dayMs, mood: 2, text: "mock", analysis: { triggers: ["mocks"] } }, { ts: now - dayMs, mood: 2, text: "behind", analysis: { triggers: ["mocks"] } }, { ts: now, mood: 4, text: "good", analysis: { triggers: [] } } ]; const p = detectPatterns(e); eq(p.avgMood, 2.7); eq(p.triggerCounts.mocks, 2); assert(p.patternOfWeek.includes("mocks")); } },
  { name: "detectPatterns handles empty", fn() { const p = detectPatterns([]); eq(p.avgMood, null); eq(p.patternOfWeek, null); } },
  { name: "buildMoodSeries sorts oldest→newest", fn() { const now = Date.now(); const s = buildMoodSeries([{ ts: now, mood: 5 }, { ts: now - dayMs, mood: 1 }]); eq(s.length, 2); eq(s[0].mood, 1); eq(s[1].mood, 5); } },
  { name: "buildTriggerCloud weights top highest", fn() { const c = buildTriggerCloud({ mocks: 4, sleep: 1 }); eq(c[0].trigger, "mocks"); eq(c[0].weight, 5); assert(c[1].weight <= c[0].weight); } },
  { name: "currentStreak counts consecutive days", fn() { const now = Date.now(); assert(currentStreak([{ ts: now, mood: 3 }, { ts: now - dayMs, mood: 3 }, { ts: now - 2*dayMs, mood: 3 }]) >= 3); } },
  { name: "currentStreak 0 with no recent entries", fn() { eq(currentStreak([{ ts: Date.now() - 10*dayMs, mood: 3 }]), 0); } },
  { name: "i18n t(): English base + key fallback", fn() { eq(t("start"), "Start"); eq(t("__nope__"), "__nope__"); } },
  { name: "auth: set, verify (right+wrong), clear", async fn() { await setPin("1234"); assert(hasPin()); assert(await verifyPin("1234")); assert(!(await verifyPin("0000"))); clearPin(); assert(!hasPin()); } },
];

export async function runTests() {
  const results = [];
  for (const tc of tests) {
    try { await tc.fn(); results.push({ name: tc.name, ok: true }); }
    catch (e) { results.push({ name: tc.name, ok: false, error: e.message }); }
  }
  return { passed: results.filter((r) => r.ok).length, failed: results.filter((r) => !r.ok).length, results };
}
