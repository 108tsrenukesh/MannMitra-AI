// i18n.js — UI localization for all 22 scheduled languages.
// Strategy: English + Hindi are hand-authored (accurate). The other 20 languages are
// filled on demand by the GenAI layer (Gemini→Groq) and cached in localStorage, with
// English fallback if AI is unavailable. So every language is *supported* without
// shipping 22 hand-written dictionaries that couldn't be reliably verified.

export const STRINGS = {
  en: {
    sos: "Talk to someone now",
    tagline: "A quiet companion for the hardest stretch of your prep",
    sub: "Private. Anonymous. Here whenever the pressure builds.",
    q_exam: "Which exam are you preparing for?",
    q_lang: "Language you're most comfortable in",
    q_name: "A name or nickname (optional — you can stay anonymous)",
    start: "Start",
    privacy: "🔒 Your journal stays on this device only. We don't ask for a login and we store nothing on a server. Only the words you choose to reflect on are sent to the AI. MannMitra is a supportive companion, not a doctor or therapist — if things get heavy, it will help you reach a real person.",
    nav_checkin: "Check-in",
    nav_talk: "Talk",
    nav_insights: "Patterns",
    nav_toolkit: "Toolkit",
    nav_exam: "Exam",
    checkin_title: "Today's check-in",
    checkin_prompt: "How are you feeling right now?",
    journal_label: "What's on your mind?",
    journal_ph: "The mock went badly and everyone seems ahead of me…",
    reflect_btn: "Reflect with MannMitra",
    talk_through: "Talk it through →",
    talk_title: "Talk it through",
    talk_sub: "A calm space to think out loud. Not a therapist — a companion.",
    chat_ph: "Type how you're feeling…",
    send: "Send",
    insights_title: "Your patterns",
    insights_sub: "Gentle observations from your own check-ins — the things a number alone misses.",
    mood_over_time: "Mood over time",
    spark_empty: "Check in a few times to see your trend here.",
    weighs: "What weighs on you",
    cloud_empty: "Your recurring themes will appear here.",
    toolkit_title: "Calm-down toolkit",
    toolkit_sub: "Works fully offline — no internet or AI needed.",
    exam_title: "Exam mode",
    exam_sub: "A gentle countdown — pace yourself, your health comes first.",
    exam_days: "days to go",
    exam_set: "Set your exam date",
    crisis_title: "You matter — and you don't have to carry this alone 💙",
    crisis_body: "What you're feeling sounds really heavy. I'm just a companion, but a trained person can support you right now, for free and in your language. Please reach out:",
    crisis_emergency: "If you're in immediate danger, please call your local emergency number (112).",
    crisis_back: "I'm safe — go back",
    settings_title: "Settings",
    set_keys: "AI keys (optional)",
    set_keys_note: "MannMitra works without keys (offline reflections). Add a key to enable richer Gemini/Groq responses. Keys stay in this browser tab only.",
    save_keys: "Save keys",
    your_data: "Your data",
    export: "⬇️ Export my data",
    delete: "🗑️ Delete everything",
    set_pin: "Set a screen-lock PIN",
    pin_on: "PIN lock is on",
    back: "← Back",
    greeting_morning: "Good morning",
    greeting_afternoon: "Good afternoon",
    greeting_evening: "Good evening",
    streak: "day streak",
    checkins: "check-ins",
    avg_mood: "avg mood",
  },
  hi: {
    sos: "अभी किसी से बात करें",
    tagline: "तैयारी के सबसे कठिन दौर का एक शांत साथी",
    sub: "निजी। गुमनाम। जब भी दबाव बढ़े, यहाँ मौजूद।",
    q_exam: "आप किस परीक्षा की तैयारी कर रहे हैं?",
    q_lang: "आप किस भाषा में सहज हैं?",
    q_name: "नाम या उपनाम (वैकल्पिक — आप गुमनाम रह सकते हैं)",
    start: "शुरू करें",
    privacy: "🔒 आपकी डायरी केवल इसी डिवाइस पर रहती है। कोई लॉगिन नहीं, सर्वर पर कुछ संग्रहीत नहीं। केवल वही शब्द AI को भेजे जाते हैं जिन पर आप विचार करना चुनते हैं। MannMitra एक सहायक साथी है, डॉक्टर या चिकित्सक नहीं — कठिन समय में यह आपको किसी वास्तविक व्यक्ति तक पहुँचने में मदद करेगा।",
    nav_checkin: "चेक-इन",
    nav_talk: "बात करें",
    nav_insights: "पैटर्न",
    nav_toolkit: "टूलकिट",
    nav_exam: "परीक्षा",
    checkin_title: "आज का चेक-इन",
    checkin_prompt: "आप अभी कैसा महसूस कर रहे हैं?",
    journal_label: "मन में क्या चल रहा है?",
    journal_ph: "मॉक अच्छा नहीं गया और लगता है सब मुझसे आगे हैं…",
    reflect_btn: "MannMitra के साथ विचार करें",
    talk_through: "इस पर बात करें →",
    talk_title: "इस पर बात करें",
    talk_sub: "खुलकर सोचने की एक शांत जगह। चिकित्सक नहीं — एक साथी।",
    chat_ph: "जैसा महसूस हो रहा है लिखें…",
    send: "भेजें",
    insights_title: "आपके पैटर्न",
    insights_sub: "आपके अपने चेक-इन से कोमल अवलोकन — वे बातें जो केवल अंक नहीं बता पाते।",
    mood_over_time: "समय के साथ मनोदशा",
    spark_empty: "रुझान देखने के लिए कुछ बार चेक-इन करें।",
    weighs: "आप पर क्या भारी पड़ता है",
    cloud_empty: "आपके बार-बार आने वाले विषय यहाँ दिखेंगे।",
    toolkit_title: "शांत होने का टूलकिट",
    toolkit_sub: "पूरी तरह ऑफ़लाइन काम करता है — इंटरनेट या AI की ज़रूरत नहीं।",
    exam_title: "परीक्षा मोड",
    exam_sub: "एक कोमल काउंटडाउन — अपनी गति बनाए रखें, स्वास्थ्य पहले।",
    exam_days: "दिन शेष",
    exam_set: "अपनी परीक्षा की तारीख सेट करें",
    crisis_title: "आप मायने रखते हैं — और यह बोझ आपको अकेले नहीं उठाना 💙",
    crisis_body: "आप जो महसूस कर रहे हैं वह वाकई भारी लगता है। मैं सिर्फ़ एक साथी हूँ, पर एक प्रशिक्षित व्यक्ति अभी, मुफ़्त में और आपकी भाषा में आपकी मदद कर सकता है। कृपया संपर्क करें:",
    crisis_emergency: "यदि आप तत्काल खतरे में हैं, तो कृपया अपने आपातकालीन नंबर (112) पर कॉल करें।",
    crisis_back: "मैं सुरक्षित हूँ — वापस जाएँ",
    settings_title: "सेटिंग्स",
    set_keys: "AI कुंजियाँ (वैकल्पिक)",
    set_keys_note: "MannMitra बिना कुंजी के भी काम करता है (ऑफ़लाइन)। बेहतर Gemini/Groq उत्तरों के लिए कुंजी जोड़ें। कुंजियाँ केवल इसी टैब में रहती हैं।",
    save_keys: "कुंजियाँ सहेजें",
    your_data: "आपका डेटा",
    export: "⬇️ मेरा डेटा निर्यात करें",
    delete: "🗑️ सब कुछ हटाएँ",
    set_pin: "स्क्रीन-लॉक पिन सेट करें",
    pin_on: "पिन लॉक चालू है",
    back: "← वापस",
    greeting_morning: "सुप्रभात",
    greeting_afternoon: "नमस्कार",
    greeting_evening: "शुभ संध्या",
    streak: "दिन की लय",
    checkins: "चेक-इन",
    avg_mood: "औसत मनोदशा",
  },
};

let current = "en";
let dynamic = {}; // AI-filled cache for the active non-base language

export function getLang() { return current; }

export function t(key) {
  return (STRINGS[current] && STRINGS[current][key]) || dynamic[key] || STRINGS.en[key] || key;
}

/** Apply translations to any element carrying data-i18n / data-i18n-ph. */
export function applyTranslations() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = t(el.getAttribute("data-i18n"));
  });
  document.querySelectorAll("[data-i18n-ph]").forEach((el) => {
    el.setAttribute("placeholder", t(el.getAttribute("data-i18n-ph")));
  });
  document.documentElement.lang = current;
}

/**
 * Switch language. For non-base languages, load cached translations or ask the
 * provided async filler (AI) to translate the English dictionary, then cache it.
 * @param {string} code
 * @param {(enDict:object, langName:string)=>Promise<object|null>} [fill]
 * @param {string} [langName]
 */
export async function setLang(code, fill, langName) {
  current = code;
  dynamic = {};

  if (!STRINGS[code]) {
    const cacheKey = "mm_i18n_" + code;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try { dynamic = JSON.parse(cached); } catch { dynamic = {}; }
    } else if (typeof fill === "function") {
      try {
        const filled = await fill(STRINGS.en, langName || code);
        if (filled && typeof filled === "object") {
          dynamic = filled;
          localStorage.setItem(cacheKey, JSON.stringify(filled));
        }
      } catch { /* fall back to English silently */ }
    }
  }
  applyTranslations();
}
