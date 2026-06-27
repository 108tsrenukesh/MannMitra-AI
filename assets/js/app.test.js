// app.test.js — framework-free unit tests. Runs in the browser (tests.html) and in Node.
// Focus: the safety classifier (most important), trigger extraction, patterns, insights.
import { assessRisk, isCrisis } from "./safety.js";
import { detectTriggers, sentimentScore, deterministicReflection, detectPatterns } from "./analysis.js";
import { buildMoodSeries, buildTriggerCloud, currentStreak } from "./insights.js";

function assert(c, m) { if (!c) throw new Error(m || "assertion failed"); }
function eq(a, b, m) { if (a !== b) throw new Error((m || "expected equality") + ` (got ${a}, expected ${b})`); }

const dayMs = 86400000;

export const tests = [
  // ---------- SAFETY (highest priority) ----------
  {
    name: "crisis: detects explicit English suicidal statement",
    fn() { eq(assessRisk("i want to kill myself").level, "crisis"); },
  },
  {
    name: "crisis: detects 'no reason to live'",
    fn() { eq(assessRisk("there's no reason to live anymore").level, "crisis"); },
  },
  {
    name: "crisis: detects Hinglish 'marna chahta hu'",
    fn() { assert(["crisis"].includes(assessRisk("mai marna chahta hu").level)); },
  },
  {
    name: "crisis: detects Devanagari आत्महत्या",
    fn() { eq(assessRisk("मैं आत्महत्या के बारे में सोच रहा हूँ").level, "crisis"); },
  },
  {
    name: "crisis: self-harm phrasing flagged",
    fn() { eq(assessRisk("i keep thinking about cutting myself").level, "crisis"); },
  },
  {
    name: "isCrisis helper returns true for crisis text",
    fn() { assert(isCrisis("i want to end my life")); },
  },
  {
    name: "high-distress: hopelessness flagged but not crisis",
    fn() { eq(assessRisk("i feel completely hopeless about this").level, "high"); },
  },
  {
    name: "normal: ordinary stress is NOT a crisis (no false positive)",
    fn() {
      eq(assessRisk("i'm stressed about my chemistry mock tomorrow").level, "normal");
      assert(!isCrisis("the syllabus is huge and i'm tired"));
    },
  },
  {
    name: "normal: empty / non-string is safe",
    fn() { eq(assessRisk("").level, "normal"); eq(assessRisk(null).level, "normal"); },
  },

  // ---------- TRIGGERS & REFLECTION ----------
  {
    name: "detectTriggers finds comparison + sleep",
    fn() {
      const t = detectTriggers("everyone else is ahead and i barely slept");
      assert(t.includes("comparison"));
      assert(t.includes("sleep"));
    },
  },
  {
    name: "sentimentScore is negative for stressed text, positive for calm",
    fn() {
      assert(sentimentScore("so much stress and anxiety and fear") < 0);
      assert(sentimentScore("i feel calm and confident today") > 0);
    },
  },
  {
    name: "deterministicReflection returns full shape with coping",
    fn() {
      const r = deterministicReflection("parents keep comparing me to the topper", 2);
      assert(typeof r.reflection === "string" && r.reflection.length > 0);
      assert(Array.isArray(r.triggers) && r.triggers.includes("comparison"));
      assert(Array.isArray(r.coping) && r.coping.length >= 1);
      eq(r.source, "offline");
    },
  },

  // ---------- PATTERNS ----------
  {
    name: "detectPatterns averages mood and counts triggers",
    fn() {
      const now = Date.now();
      const entries = [
        { ts: now - 2 * dayMs, mood: 2, text: "mock went badly", analysis: { triggers: ["mocks"] } },
        { ts: now - 1 * dayMs, mood: 2, text: "behind on syllabus", analysis: { triggers: ["mocks"] } },
        { ts: now, mood: 4, text: "felt good", analysis: { triggers: [] } },
      ];
      const p = detectPatterns(entries);
      eq(p.avgMood, 2.7);
      eq(p.triggerCounts.mocks, 2);
      assert(p.patternOfWeek && p.patternOfWeek.includes("mocks"));
    },
  },
  {
    name: "detectPatterns handles empty input",
    fn() {
      const p = detectPatterns([]);
      eq(p.avgMood, null);
      eq(p.patternOfWeek, null);
    },
  },

  // ---------- INSIGHTS ----------
  {
    name: "buildMoodSeries sorts oldest→newest and keeps mood",
    fn() {
      const now = Date.now();
      const s = buildMoodSeries([{ ts: now, mood: 5 }, { ts: now - dayMs, mood: 1 }]);
      eq(s.length, 2);
      eq(s[0].mood, 1);
      eq(s[1].mood, 5);
    },
  },
  {
    name: "buildTriggerCloud weights the top trigger highest",
    fn() {
      const cloud = buildTriggerCloud({ mocks: 4, sleep: 1 });
      eq(cloud[0].trigger, "mocks");
      eq(cloud[0].weight, 5);
      assert(cloud[1].weight <= cloud[0].weight);
    },
  },
  {
    name: "currentStreak counts consecutive days including today",
    fn() {
      const now = Date.now();
      const entries = [{ ts: now, mood: 3 }, { ts: now - dayMs, mood: 3 }, { ts: now - 2 * dayMs, mood: 3 }];
      assert(currentStreak(entries) >= 3);
    },
  },
  {
    name: "currentStreak is 0 with no recent entries",
    fn() {
      const entries = [{ ts: Date.now() - 10 * dayMs, mood: 3 }];
      eq(currentStreak(entries), 0);
    },
  },
];

export function runTests() {
  const results = tests.map((t) => {
    try { t.fn(); return { name: t.name, ok: true }; }
    catch (e) { return { name: t.name, ok: false, error: e.message }; }
  });
  return { passed: results.filter((r) => r.ok).length, failed: results.filter((r) => !r.ok).length, results };
}
