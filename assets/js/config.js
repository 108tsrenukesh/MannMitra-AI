// config.js — static configuration: helplines, languages, exams, coping, exercises.
// No secrets here. API keys are entered at runtime (see ai.js) or injected by CI.

export const HELPLINES = [
  { name: "Tele-MANAS (Govt. of India)", number: "14416", dial: "14416", note: "Free · 24×7 · 20 languages" },
  { name: "Tele-MANAS (alt.)", number: "1-800-891-4416", dial: "18008914416", note: "Free · 24×7" },
  { name: "Vandrevala Foundation", number: "1860-266-2345", dial: "18602662345", note: "24×7 counselling" },
  { name: "iCall (TISS)", number: "022-2552-1111", dial: "02225521111", note: "Mon–Sat, 8am–10pm" },
  { name: "AASRA", number: "+91-98204-66726", dial: "+919820466726", note: "24×7 suicide prevention" },
];

export const EXAMS = [
  { id: "neet", label: "NEET (medical)" },
  { id: "jee", label: "JEE (engineering)" },
  { id: "cuet", label: "CUET (university)" },
  { id: "cat", label: "CAT (MBA)" },
  { id: "gate", label: "GATE (postgrad)" },
  { id: "upsc", label: "UPSC (civil services)" },
  { id: "other", label: "Other / board exams" },
];

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
  { code: "mni", name: "মৈতৈলোন্", en: "Manipuri (Meitei)" },
  { code: "brx", name: "बड़ो", en: "Bodo" },
  { code: "sa", name: "संस्कृतम्", en: "Sanskrit" },
];

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

export const EXERCISES = [
  { id: "box", icon: "🫁", title: "Box breathing", desc: "4-4-4-4 — instant calm.", kind: "phased",
    phases: [ { label: "Breathe in", secs: 4, big: true }, { label: "Hold", secs: 4, big: true }, { label: "Breathe out", secs: 4, big: false }, { label: "Hold", secs: 4, big: false } ] },
  { id: "478", icon: "🌬️", title: "4-7-8 breathing", desc: "Eases anxiety, helps sleep.", kind: "phased",
    phases: [ { label: "Breathe in", secs: 4, big: true }, { label: "Hold", secs: 7, big: true }, { label: "Breathe out", secs: 8, big: false } ] },
  { id: "ocean", icon: "🌊", title: "Ocean breath", desc: "Slow, steady, grounding.", kind: "phased",
    phases: [ { label: "Breathe in", secs: 5, big: true }, { label: "Breathe out", secs: 7, big: false } ] },
  { id: "grounding", icon: "🌿", title: "5-4-3-2-1 grounding", desc: "Pull out of a spiral.", kind: "steps",
    steps: [ "Name 5 things you can see right now.", "Name 4 things you can feel (chair, feet, air).", "Name 3 things you can hear.", "Name 2 things you can smell.", "Name 1 thing you can taste — and take a slow breath." ] },
  { id: "pmr", icon: "🧘", title: "Quick muscle relaxation", desc: "Tense, release, let go.", kind: "phased",
    phases: [ { label: "Tense your fists", secs: 5, big: true }, { label: "Release, notice the calm", secs: 8, big: false }, { label: "Tense your shoulders", secs: 5, big: true }, { label: "Release, breathe", secs: 8, big: false } ] },
  { id: "reframe", icon: "💭", title: "Reframe a harsh thought", desc: "Swap it for a kinder truth.", kind: "steps",
    steps: [ "Write the exact harsh thought ('I'll never clear this').", "Ask: would I say this to a friend in my place?", "Find one piece of evidence it isn't fully true.", "Rewrite it fairly ('This topic is hard; I can improve it').", "Notice your shoulders drop a little." ] },
  { id: "rankreframe", icon: "📊", title: "Rank-anxiety reframe", desc: "Loosen the grip of ranks & comparison.", kind: "steps",
    steps: [ "Name the exact rank fear ('if I'm not top 100 I've failed').", "Whose standard is that — yours, or borrowed from coaching/peers?", "List 2 things YOU improved this week, regardless of rank.", "Rewrite it around progress ('I'm closing my own gaps').", "Pick one next action in your control for the next hour." ] },
  { id: "gratitude", icon: "🙏", title: "Gratitude note", desc: "Name 3 good things — a proven mood lift.", kind: "steps",
    steps: [ "Write down 3 things that went okay today, however small.", "For each, note why it happened or what it meant to you.", "Notice you can usually find something, even on hard days." ] },
  { id: "connect", icon: "🤝", title: "Reach out to someone", desc: "Connection is the strongest buffer.", kind: "steps",
    steps: [ "Pick one person you trust — a friend, sibling, or parent.", "Send a short message: even 'having a rough day, can we talk?'", "You do not have to explain everything — just open the door." ] },
];

export const SUGGESTIONS = [
  "I'm stressed about my exam",
  "I can't focus today",
  "I need some motivation",
  "Help me calm down",
  "I'm comparing myself to everyone",
];

export const QUOTES = [
  { text: "You don't have to be perfect to be worthy of rest.", author: "—" },
  { text: "A mock is data, not a verdict.", author: "—" },
  { text: "Compare today-you to yesterday-you, not to a topper.", author: "—" },
  { text: "Rest is not laziness — it's how your brain saves what you studied.", author: "—" },
  { text: "It's okay to not be okay, as long as you don't give up.", author: "Karen Salmansohn" },
  { text: "Small wins build momentum. Pick one tiny next step.", author: "—" },
];
