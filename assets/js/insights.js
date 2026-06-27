// insights.js — pure helpers that shape stored entries into view-model data for the
// insights dashboard (mood trend + trigger cloud + streak). No DOM, no AI.

/** Ordered mood points for a simple sparkline: [{ts, mood, label}] (oldest → newest). */
export function buildMoodSeries(entries) {
  return entries
    .filter((e) => typeof e.mood === "number")
    .slice()
    .sort((a, b) => a.ts - b.ts)
    .map((e) => ({
      ts: e.ts,
      mood: e.mood,
      label: new Date(e.ts).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
    }));
}

/** Trigger cloud: [{ trigger, count, weight }] where weight is 1..5 for font sizing. */
export function buildTriggerCloud(triggerCounts) {
  const entries = Object.entries(triggerCounts || {});
  if (entries.length === 0) return [];
  const max = Math.max(...entries.map(([, c]) => c));
  return entries
    .sort((a, b) => b[1] - a[1])
    .map(([trigger, count]) => ({
      trigger,
      count,
      weight: Math.max(1, Math.round((count / max) * 5)),
    }));
}

/** Current consecutive-day check-in streak, framed as gentle self-care (not pressure). */
export function currentStreak(entries) {
  if (!entries || entries.length === 0) return 0;
  const days = new Set(
    entries.map((e) => new Date(e.ts).toLocaleDateString("en-IN"))
  );
  let streak = 0;
  const cursor = new Date();
  // Allow today OR yesterday to start the streak (so a missed "today" isn't punishing).
  if (!days.has(cursor.toLocaleDateString("en-IN"))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!days.has(cursor.toLocaleDateString("en-IN"))) return 0;
  }
  while (days.has(cursor.toLocaleDateString("en-IN"))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
