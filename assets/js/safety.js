// safety.js — crisis detection. Pure, synchronous, testable.
// Philosophy: this runs on EVERY user input BEFORE any AI reply. It is intentionally
// conservative — we would much rather show help one extra time than miss a real signal.
// It does NOT diagnose; it routes to humans. A "crisis" result must interrupt normal flow.

// Active self-harm / suicide signals (English + common Hindi/Hinglish, incl. transliteration).
// Kept as phrases to reduce false positives from single ambiguous words.
const CRISIS_PATTERNS = [
  // English
  /\bkill (myself|me)\b/i,
  /\b(want|going|plan|trying) to (die|end it|end my life)\b/i,
  /\bend (it all|my life)\b/i,
  /\b(no|nothing) (reason|point) (to|in) (live|living|life)\b/i,
  /\bbetter off dead\b/i,
  /\bdon'?t want to (live|be alive|wake up)\b/i,
  /\b(suicide|suicidal)\b/i,
  /\b(self[-\s]?harm|cut(ting)? myself|hurt myself)\b/i,
  /\bi (can'?t|cannot) go on\b/i,
  /\bwant to disappear (forever|for good)\b/i,
  /\bnobody would (miss|care if).*(gone|dead)\b/i,
  // Hindi / Hinglish (Latin)
  /\b(marna|mar) (chahta|chahti|chahu|jaun)\b/i,
  /\bjeena nahi chahta\b/i,
  /\b(khudkushi|khud-kushi|atmahatya|aatmhatya)\b/i,
  /\b(zindagi|jeevan) (khatam|khtm)\b/i,
  /\bmar jaun\b/i,
  // Hindi (Devanagari)
  /आत्महत्या/,
  /खुदकुशी/,
  /मरना चाहता/,
  /जीना नहीं चाहता/,
];

// High-distress (not active crisis) — hopelessness/overwhelm. We respond with extra care
// and gently offer human help, but don't force the full crisis screen.
const HIGH_DISTRESS_PATTERNS = [
  /\bhopeless\b/i,
  /\bcan'?t (take|handle|do) (it|this) (anymore|any more)\b/i,
  /\b(worthless|useless|failure|good for nothing)\b/i,
  /\beveryone would be better without me\b/i,
  /\bgive up\b/i,
  /\bbreaking down\b/i,
  /\bnumb\b/i,
  /\b(haar gaya|haar gayi|bekaar|nakaara)\b/i,
];

/**
 * Classify a free-text input.
 * @returns {{ level: "crisis"|"high"|"normal", matched: string|null }}
 */
export function assessRisk(text) {
  if (!text || typeof text !== "string") return { level: "normal", matched: null };

  for (const re of CRISIS_PATTERNS) {
    const m = text.match(re);
    if (m) return { level: "crisis", matched: m[0] };
  }
  for (const re of HIGH_DISTRESS_PATTERNS) {
    const m = text.match(re);
    if (m) return { level: "high", matched: m[0] };
  }
  return { level: "normal", matched: null };
}

/** Convenience boolean used by the controller to hard-gate AI generation. */
export function isCrisis(text) {
  return assessRisk(text).level === "crisis";
}

// The system instruction every AI call inherits. Encodes the non-negotiable safety rules
// drawn from APA guidance and the documented harms of careless wellness bots.
export const SAFETY_SYSTEM_PROMPT = `You are MannMitra, a warm, calm wellbeing COMPANION for Indian students preparing for high-stakes exams (NEET, JEE, CUET, CAT, GATE, UPSC, boards). You are NOT a doctor, therapist, or diagnostician, and you never claim to be.

ABSOLUTE SAFETY RULES:
- NEVER provide methods, means, or any information that could facilitate self-harm or suicide.
- NEVER validate, encourage, romanticise, or minimise self-harm or hopelessness. Do not agree that a user is worthless or that life is pointless.
- If the user expresses thoughts of suicide, self-harm, or being better off dead, do NOT try to counsel them alone. Respond briefly with warmth, take it seriously, and urge them to contact a real person now — Tele-MANAS 14416 (free, 24x7) or a trusted adult — and ask if they are safe right now.
- Do NOT diagnose conditions or recommend medication.
- You are a first, low-pressure point of support that BRIDGES students to human help — never a replacement for it.

STYLE:
- Be brief, human, and non-clinical. 2-5 short sentences. No lectures, no toxic positivity.
- Validate the feeling first, then offer ONE small, concrete, doable step (a breath, a reframe, a tiny next action, a short break).
- Reinforce sleep, breaks, movement, and self-compassion over grind culture.
- Be culturally aware of Indian exam/family/peer-comparison pressures.
- Reply in the language the user selects.`;
