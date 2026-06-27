// analysis.js — deterministic reflection, trigger extraction, patterns, brain-dump bucketing.
// Pure functions so they are unit-testable and run fully offline.
import { COPING_BY_TRIGGER } from "./config.js";

function round1(n) { return Math.round(n * 10) / 10; }

const TRIGGER_KEYWORDS = {
  comparison: ["compare","comparison","topper","rank","everyone else","peers","friends are ahead","behind everyone","batch"],
  sleep: ["sleep","slept","tired","insomnia","awake","no rest","exhausted","neend"],
  parents: ["parents","father","mother","family","ghar","papa","mummy","expectations"],
  mocks: ["mock","test","exam","marks","result","score","low score","failed test","practice paper","cutoff","jee","neet","upsc","gate","cat","cuet","boards"],
  burnout: ["burnout","burned out","can't focus","no motivation","drained","give up studying"],
  selfdoubt: ["doubt","not good enough","stupid","can't do this","cant do this","i'll fail","will fail","failing","not enough","worthless","hopeless about"],
  loneliness: ["lonely","alone","isolated","no friends","homesick","miss home","akela"],
  time: ["no time","behind","syllabus","deadline","running out","too much to cover","revision","study","studies","studying","prepare","preparation","backlog"],
  health: ["headache","not eating","skipping meals","sick","stomach","pain","anxiety","anxious","panic","nervous","scared","fear","worried","stress","stressed","overwhelmed"],
};
const POSITIVE_WORDS = ["good","better","calm","happy","confident","proud","relaxed","hopeful","okay","fine","improved","accha","khush"];
const NEGATIVE_WORDS = ["stress","anxious","anxiety","scared","fear","panic","sad","cry","overwhelmed","pressure","worried","tension","dukhi","pareshan"];

export function detectTriggers(text) {
  if (!text) return [];
  const t = text.toLowerCase();
  const found = [];
  for (const [trigger, words] of Object.entries(TRIGGER_KEYWORDS)) {
    if (words.some((w) => t.includes(w))) found.push(trigger);
  }
  return found;
}
export function sentimentScore(text) {
  if (!text) return 0;
  const t = text.toLowerCase(); let score = 0;
  for (const w of POSITIVE_WORDS) if (t.includes(w)) score += 1;
  for (const w of NEGATIVE_WORDS) if (t.includes(w)) score -= 1;
  if (score > 0) return Math.min(1, score / 3);
  if (score < 0) return Math.max(-1, score / 3);
  return 0;
}
export function deterministicReflection(text, mood) {
  const triggers = detectTriggers(text);
  const sentiment = sentimentScore(text);
  const coping = triggers.slice(0, 3).map((t) => COPING_BY_TRIGGER[t]).filter(Boolean);
  if (coping.length === 0) coping.push(COPING_BY_TRIGGER.general);
  return {
    source: "offline", sentiment, triggers, coping,
    reflection: buildReflection(mood, sentiment),
    insight: triggers.length ? "Today this reads as mostly about " + triggers.join(", ") + "." : "Thanks for checking in — showing up for yourself counts.",
  };
}
function buildReflection(mood, sentiment) {
  if (mood && mood <= 2) return "That sounds like a heavy day, and it's okay to feel it. You don't have to fix everything tonight — just be a bit gentler with yourself.";
  if (sentiment < 0) return "There's some real pressure in what you wrote. Naming it like this is genuinely useful — it makes it smaller and more workable.";
  if (mood && mood >= 4) return "Good to hear there's some lightness today. Worth noticing what helped, so you can lean on it again.";
  return "Thanks for taking a minute for yourself. Steady check-ins like this are how patterns become visible.";
}

// Brain-dump bucketing — offline fallback for the summarizer. Pure & testable.
const BUCKET_LABELS = {
  mocks: "Tests & results", comparison: "Rank & peer pressure", time: "Syllabus & time",
  parents: "Family expectations", sleep: "Sleep & energy", health: "Health & body",
  selfdoubt: "Self-doubt", burnout: "Burnout", loneliness: "Feeling alone", general: "Other",
};
export function bucketBrainDump(text) {
  if (!text) return [];
  const sentences = text.split(/[.!?\n]+/).map((s) => s.trim()).filter((s) => s.length > 0);
  const groups = {};
  sentences.forEach((s) => {
    const trigs = detectTriggers(s);
    const key = trigs[0] || "general";
    (groups[key] = groups[key] || []).push(s);
  });
  return Object.entries(groups).map(([k, items]) => ({
    bucket: BUCKET_LABELS[k] || "Other",
    items: items.slice(0, 4),
    tip: COPING_BY_TRIGGER[k] || COPING_BY_TRIGGER.general,
  }));
}

export function detectPatterns(entries) {
  if (!entries || entries.length === 0) return { patternOfWeek: null, triggerCounts: {}, avgMood: null, lowDays: 0 };
  const triggerCounts = {}; let moodSum = 0, moodN = 0, lowDays = 0; const byWeekday = {};
  for (const e of entries) {
    const trigs = (e.analysis && e.analysis.triggers) || detectTriggers(e.text);
    for (const t of trigs) triggerCounts[t] = (triggerCounts[t] || 0) + 1;
    if (typeof e.mood === "number") {
      moodSum += e.mood; moodN += 1; if (e.mood <= 2) lowDays += 1;
      const d = new Date(e.ts).getDay(); byWeekday[d] = byWeekday[d] || { sum: 0, n: 0 }; byWeekday[d].sum += e.mood; byWeekday[d].n += 1;
    }
  }
  const avgMood = moodN ? round1(moodSum / moodN) : null;
  let patternOfWeek = null;
  const topTrigger = Object.entries(triggerCounts).sort((a, b) => b[1] - a[1])[0];
  const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  let worstDay = null, worstAvg = 6;
  for (const [d, v] of Object.entries(byWeekday)) { if (v.n >= 1) { const a = v.sum / v.n; if (a < worstAvg) { worstAvg = a; worstDay = days[d]; } } }
  if (topTrigger && topTrigger[1] >= 2) {
    patternOfWeek = 'Your most frequent stress theme lately is "' + topTrigger[0] + '" (' + topTrigger[1] + " entries).";
    if (worstDay && worstAvg <= 3) patternOfWeek += " Your mood tends to dip on " + worstDay + "s — worth planning something kind for that day.";
  } else if (worstDay && worstAvg <= 2.5) {
    patternOfWeek = "Your mood tends to be lowest on " + worstDay + "s. A small planned break there might help.";
  }
  return { patternOfWeek, triggerCounts, avgMood, lowDays };
}
