// config.js — static configuration: helplines, languages, exam types, coping content.
// No secrets here. API keys are entered at runtime (see ai.js) or injected by CI.

// India crisis & support helplines (verified national resources).
export const HELPLINES = [
  {
    name: "Tele-MANAS (Govt. of India)",
    number: "14416",
    dial: "14416",
    note: "Free · 24×7 · 20 languages",
  },
  {
    name: "Tele-MANAS (alt.)",
    number: "1-800-891-4416",
    dial: "18008914416",
    note: "Free · 24×7",
  },
  {
    name: "Vandrevala Foundation",
    number: "1860-266-2345",
    dial: "18602662345",
    note: "24×7 counselling",
  },
  {
    name: "iCall (TISS)",
    number: "022-2552-1111",
    dial: "02225521111",
    note: "Mon–Sat, 8am–10pm",
  },
  {
    name: "AASRA",
    number: "+91-98204-66726",
    dial: "+919820466726",
    note: "24×7 suicide prevention",
  },
];

// Exam contexts — used to tailor prompts and check-in copy.
export const EXAMS = [
  { id: "neet", label: "NEET (medical)" },
  { id: "jee", label: "JEE (engineering)" },
  { id: "cuet", label: "CUET (university)" },
  { id: "cat", label: "CAT (MBA)" },
  { id: "gate", label: "GATE (postgrad)" },
  { id: "upsc", label: "UPSC (civil services)" },
  { id: "other", label: "Other / board exams" },
];

// 22 scheduled languages of the Eighth Schedule + English (23 total).
// `name` is the native script label; `en` is the English name the model understands.
export const LANGUAGES = [
  { code: "en", name: "English", en: "English" },
  { code: "hi", name: "हिन्दी", en: "Hindi" },
  { code: "hinglish", name: "Hinglish", en: "Hinglish (Hindi in Latin script)" },
  { code: "bn", name: "বাংলা", en: "Bengali" },
  { code: "te", name: "తెలుగు", en: "Telugu" },
  { code: "mr", name: "मराठी", en: "Marathi" },
  { code: "ta", name: "தமிழ்", en: "Tamil" },
  { code: "ur", name: "اردو", en: "Urdu" },
  { code: "gu", name: "ગુજરાતી", en: "Gujarati" },
  { code: "kn", name: "ಕನ್ನಡ", en: "Kannada" },
  { code: "ml", name: "മലയാളം", en: "Malayalam" },
  { code: "or", name: "ଓଡ଼ିଆ", en: "Odia" },
  { code: "pa", name: "ਪੰਜਾਬੀ", en: "Punjabi" },
  { code: "as", name: "অসমীয়া", en: "Assamese" },
  { code: "mai", name: "मैथिली", en: "Maithili" },
  { code: "sat", name: "ᱥᱟᱱᱛᱟᱲᱤ", en: "Santali" },
  { code: "ks", name: "کٲشُر", en: "Kashmiri" },
  { code: "ne", name: "नेपाली", en: "Nepali" },
  { code: "sd", name: "سنڌي", en: "Sindhi" },
  { code: "kok", name: "कोंकणी", en: "Konkani" },
  { code: "doi", name: "डोगरी", en: "Dogri" },
  { code: "mni", name: " মৈতৈলোন্", en: "Manipuri (Meitei)" },
  { code: "brx", name: "बड़ो", en: "Bodo" },
  { code: "sa", name: "संस्कृतम्", en: "Sanskrit" },
];

// Offline wellbeing toolkit — always available, no network/AI needed.
export const TOOLKIT = [
  {
    id: "breathing",
    title: "Box breathing",
    desc: "Calm your nervous system in 60 seconds.",
    kind: "breathing",
  },
  {
    id: "grounding",
    title: "5-4-3-2-1 grounding",
    desc: "Pull your mind out of a spiral and back to now.",
    kind: "steps",
    steps: [
      "Name 5 things you can see right now.",
      "Name 4 things you can feel (chair, feet, air).",
      "Name 3 things you can hear.",
      "Name 2 things you can smell.",
      "Name 1 thing you can taste — and take a slow breath.",
    ],
  },
  {
    id: "break",
    title: "Take a real break",
    desc: "A 5-minute reset beats another hour of tired study.",
    kind: "steps",
    steps: [
      "Stand up and stretch your arms overhead.",
      "Drink a glass of water.",
      "Look out of a window at something far away for 30s.",
      "Walk to another room and back.",
      "Return with one small, doable next task in mind.",
    ],
  },
  {
    id: "reframe",
    title: "Reframe a harsh thought",
    desc: "Swap an all-or-nothing thought for a kinder, truer one.",
    kind: "steps",
    steps: [
      "Write the exact harsh thought ('I'll never clear this').",
      "Ask: would I say this to a friend in my place?",
      "Find one piece of evidence it isn't fully true.",
      "Rewrite it fairly ('This topic is hard; I can improve it').",
      "Notice your shoulders drop a little.",
    ],
  },
];

// Deterministic coping suggestions keyed by detected trigger (fallback when AI is off).
export const COPING_BY_TRIGGER = {
  comparison: "Comparison steals calm. Compare today-you to yesterday-you, not to a topper.",
  sleep: "Under-6h sleep tracks with low-mood days. Protect a fixed sleep window tonight.",
  parents: "Family expectations weigh a lot. Try naming one small thing you control today.",
  mocks: "A mock is data, not a verdict. Pull one lesson from it, then close the tab.",
  burnout: "Exhaustion is a signal, not weakness. Schedule a guilt-free 30-min break.",
  selfdoubt: "Self-doubt is loud near exams. List 3 things you've already learned this month.",
  loneliness: "Isolation makes everything heavier. Message one person today, even briefly.",
  time: "Feeling behind? Shrink the plan to the next 25 minutes only.",
  health: "Your body keeps the score. A short walk and water count as studying-support.",
  general: "Be as patient with yourself as you'd be with a friend sitting your exam.",
};
