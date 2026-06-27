# Mental Wellness Tracker for Indian Exam Aspirants
### Research analysis & solution design — PromptWars Challenge

> Goal: a Generative-AI companion that helps students preparing for NEET, JEE, CUET, CAT, GATE and UPSC monitor and improve their mental well-being — by analysing open-ended daily journaling and mood logs to surface hidden stress triggers, and offering safe, contextual, conversational support.

This document is the research foundation and the product/engineering plan. It deliberately leads with **safety**, because the evidence shows an AI wellness tool done carelessly can do real harm.

---

## 1. Why this matters — the scale of the problem (researched)

The problem is large, worsening, and now a matter of national policy.

- **Student suicides are rising.** India's NCRB recorded **14,488 student suicides in 2024** — about 8.5% of all suicides and up ~4.3% on 2023. "Failure in examination" is among the leading recorded causes, and is the *single leading* cause for children under 18 (1,071 cases).
- **Aspirants specifically.** A peer-reviewed study of IIT-JEE/NEET aspirant suicides found a sharp recent rise, peaking in 2023–24, with **Rajasthan (~70%)** and Tamil Nadu most affected, and **August–September** (results/exam season) the deadliest months.
- **Kota, the coaching capital, became a warning sign:** ~28 student suicides in 2023, 17 in 2024, and several already in 2025.
- **Distress is near-universal, support is not.** NIMHANS (2023) found **>85% of students experience moderate-to-severe exam stress.** A 2025 study across 1,628 students in 8 cities found **~70% with moderate-to-high anxiety and ~60% showing depressive signs.** Among NEET aspirants, **75.5% report severe pre-exam stress — most with no access to professional support.**
- **For UPSC aspirants:** ~90% report anxiety, ~79% depressive symptoms, and **~60% report loneliness** — driven by years of isolated preparation far from family in hubs like Delhi's Mukherjee Nagar / Rajinder Nagar.

### The single most important insight for our design
NIMHANS research found that **among students who reached the point of suicidal thoughts, fewer than 4 in 10 told anyone — and those who did mostly told a friend, not a parent or counsellor.**

That one finding defines the product. Students will not start by calling a counsellor. They *will* confide in something that feels like a low-pressure, private, always-available friend. The opportunity — and the responsibility — is to be that first, safe point of contact, and to **bridge** the student toward real human help, never to replace it.

---

## 2. What the policy and expert landscape now expects (2024–2026)

A tool launched today is entering a regulated, watched space — aligning with it is both safer and more credible:

- **Supreme Court guidelines (2025)** direct all educational institutions to adopt a uniform mental-health policy, drawing on the **UMMEED draft guidelines, the MANODARPAN initiative, and the National Suicide Prevention Strategy.**
- **Rajasthan's Coaching Centres regulation Bill (2025)** mandates counselling support and a dedicated student helpline/portal.
- **Government infrastructure already exists to plug into:** **Tele-MANAS (14416 / 1-800-891-4416)** — free, 24×7, 20 languages, >10 lakh calls handled across 53 cells. This is the spine of any responsible referral path.
- **Expert framing.** Dr Rajesh Sagar (Psychiatry, AIIMS Delhi) attributes aspirant burnout largely to **unrealistic self-expectations and social comparison**, and points to consistent breaks, physical activity and sleep as protective. Our AI's "voice" should reinforce exactly these messages.

---

## 3. The hard safety lesson — AI mental-health tools can harm

This is not optional reading; it shapes the architecture.

- An AI tool's instinct to **validate and agree** is dangerous here: studies warn this can **accentuate self-destructive ideation and turn impulse into action.** Chatbots are *contraindicated* for actively suicidal users as a standalone.
- Measured failure rates: AI gave **unsafe responses ~20% of the time vs ~7% for human therapists**; one study found **34.4% of interactions with character-style bots led to psychological deterioration.** A 2024 Character.AI case was implicated in a 14-year-old's death.
- The **APA (2025)** advisory is explicit: wellness chatbots are **not a substitute** for professional care and **must** ship with **rigorously tested crisis-escalation pathways** and special safeguards for minors.

**Design consequences (non-negotiable):**
1. The app is a **journaling companion and signposter — not a therapist, not a diagnostician.** It says so, plainly.
2. A **safety filter runs on every user input before any normal AI reply.** On crisis signals it **stops the normal flow** and surfaces human help (Tele-MANAS etc.) — it never problem-solves, minimises, or "talks the user down" alone.
3. The AI is **instructed never to validate self-harm**, never to give methods, never to diagnose or prescribe, and to gently redirect to humans when signals appear.
4. **Privacy by default** (see §6) — because for students, anonymity is the #1 requested feature and the thing that gets them to open up at all.

---

## 4. What actually works (evidence base for the features)

We are not inventing therapy — we are delivering *proven, low-intensity, self-help* techniques in a scalable form:

- **Expressive journaling** reduces anxiety/depression symptoms by **~20–45%**; expressive writing cut depression scores ~30% over 8 weeks. Sweet spot: **3–4 times/week, 15–20 min** (even 5–10 min daily helps over 4–6 weeks).
- **Mood tracking complements CBT** by revealing emotional patterns and **consistent triggers across days/weeks** — precisely the "patterns standard trackers miss" the challenge asks for.
- **CBT-style reflection** (spotting cognitive distortions — catastrophising, all-or-nothing thinking, social comparison) is effective and **safe to deliver as psycho-education**, especially as light-touch prompts rather than clinical treatment.
- **Scalable, low-threshold chatbots** are a recognised way to **strengthen resilience** where counsellors are scarce — exactly India's situation.

Students themselves ask for: **anonymity, a quick-exit, immediate crisis support, brevity, and non-clinical language.** We build to that list.

---

## 5. The product — "MannMitra" (मन-मित्र, "friend of the mind")

*(working name — alternatives: Saathi, Sahaj, Mann, Dhyaan)*

A calm, private, mobile-friendly web companion. Five connected parts, each tied to a challenge requirement and to the evidence above.

**1. Daily check-in (journaling + mood log) — the core input.**
A one-tap mood scale plus an open-ended "What's on your mind?" box. Gentle, exam-aware prompts ("How did today's mock go — and how did it *feel*?"). Brevity-first; 60 seconds is a valid entry. *Maps to: open-ended journaling + mood logs.*

**2. AI reflection — surfacing the hidden patterns.**
Gemini analyses each entry and returns structured insight: detected **mood, sentiment, stress triggers** (e.g., *peer comparison, sleep loss, parental pressure, specific subject, mock-test scores*), any **cognitive distortion**, a one-line **empathetic reflection**, and **2–3 tailored coping suggestions**. Over time it reports **patterns** ("your mood reliably dips the evening before weekly tests" / "sleep under 6 h tracks with your low-mood days"). *Maps to: GenAI uncovering hidden triggers & emotional patterns that standard trackers miss.*

**3. Conversational companion — contextual, in-the-moment support.**
An empathetic chat that offers **adaptive coping** (paced breathing, 5-4-3-2-1 grounding, study-break/Pomodoro nudges, reframing a harsh self-thought), **micro-mindfulness**, and **motivational encouragement** grounded in the student's exam context (NEET vs UPSC loneliness vs Kota isolation are different problems). Tone: warm, non-clinical, never preachy. *Maps to: conversational AI, hyper-personalised, real-time coping, adaptive mindfulness, motivational encouragement.*

**4. Safety net — always one layer above everything.**
The crisis filter (input → keyword + AI risk classification) can interrupt at any moment to show a calm, non-alarming screen with **Tele-MANAS 14416**, **Vandrevala 1860-266-2345**, **iCall 022-2552-1111**, **AASRA +91-98204-66726**, a one-tap call, and a reminder that *"a real person can help right now."* A persistent, discreet **"Need to talk to someone now?"** button is always reachable. *Maps to: "safely acting as a companion."*

**5. Insights & momentum.**
A gentle dashboard: mood trend line, a "trigger cloud," check-in streaks framed as self-care (not pressure), and a weekly **"pattern of the week."** Plus a wellbeing toolkit (breathing timer, grounding, sleep/break reminders) that **works fully offline** — so there's always value even with no network or AI.

---

## 6. Privacy & data — the trust foundation

- **Local-first & anonymous.** No login required, no name needed. Journal entries live on the **user's own device** (localStorage/IndexedDB). Only the **text the user chooses to reflect on** is sent to the AI for analysis, and that is stated plainly before first use.
- **Quick-exit** ("boss button") instantly leaves the page — a top student-requested feature for sensitive apps.
- **Export & delete** my data, one tap each.
- **No third-party trackers or ads.** No selling of data — none is collected server-side.

---

## 7. How this maps to the judging rubric

| Param (weight) | How MannMitra scores |
|---|---|
| **Problem-Statement Alignment (High)** | Hits every clause: journaling + mood logs → GenAI trigger/pattern detection → conversational, hyper-personalised, exam-aware support, delivered *safely*. |
| **Code Quality (High)** | Clean modular static app (reusing the hardened CookMate stack), separated concerns: input, safety filter, AI providers, insights, storage. |
| **Security (Medium)** | No API keys in source; local-first private data; crisis safety filter; input sanitisation + escaped rendering; CSP; no `innerHTML` injection. |
| **Efficiency (Medium)** | Lightweight, instant offline toolkit, minimal/batched AI calls, cached entries. |
| **Testing (Low)** | Unit tests for crisis-keyword detection, mood parsing, trigger extraction and the deterministic fallback. |
| **Accessibility (Low)** | Calming high-contrast UI, full keyboard nav, ARIA live regions, quick-exit, non-clinical plain language, multilingual-ready. |

---

## 8. Technical architecture (fast to build, reuses what works)

- **Static web app** (HTML/CSS/JS, no build) → deploys to GitHub Pages instantly; **the deployed link always works** (DQ rule), because the offline toolkit + deterministic reflection run with zero network.
- **AI layer:** **Gemini primary → Groq fallback → deterministic fallback.** Two prompt types: (a) a strict-JSON **analysis** call per entry; (b) a **companion** chat call with a hardened safety system-prompt.
- **Safety pipeline (runs first, every time):** local crisis-keyword regex + lightweight AI risk check → if triggered, render the crisis screen and **skip** normal generation.
- **Storage:** localStorage/IndexedDB, with export/delete.
- **Privacy:** keys never committed (runtime entry or CI secret injection); CSP limited to the Gemini/Groq endpoints.

### Suggested 1-day MVP build order
1. Shell + calming UI + onboarding (exam type, anonymous) + privacy notice.
2. Daily check-in (mood + journal) → save locally.
3. **Safety filter + crisis screen** (build this early — it gates everything).
4. AI reflection (analysis JSON) with deterministic fallback.
5. Conversational companion with safety system-prompt.
6. Insights dashboard (trend + trigger cloud + pattern of week) + offline toolkit.
7. Tests + accessibility pass + README + deploy.

---

## 9. Open questions for you (your on-ground knowledge helps here)
1. **Lead exam(s):** keep it generic across all six, or optimise the tone/prompts for one or two (e.g., NEET/JEE teens vs UPSC adult aspirants are very different)?
2. **Language:** English-only for the demo, or include a Hindi/Hinglish toggle (big trust signal for this audience)?
3. **Parental angle:** include an optional "how to talk to parents" helper? Family pressure is a recurring trigger but a sensitive one.
4. **Name:** MannMitra, Saathi, Sahaj, or your own?

---

### Sources
- NCRB 2024 / student suicides — The Wire; FACTLY (exam-failure suicides 2019–24)
- JEE/NEET aspirant suicide trends — PMC (PMC12256035); Careers360 (NTF interim report)
- Kota crisis & regulation — Organiser; SCC Online (SC 2025 guidelines); Rajasthan Coaching Bill 2025
- Prevalence/burnout — NIMHANS 2023 (via Solh/Express Healthcare); 2025 8-city study; UPSC stats (The Citizen, PrepAiro); Dr Rajesh Sagar (AIIMS)
- Helplines — Tele-MANAS (telemanas.mohfw.gov.in); Vandrevala Foundation; findahelpline.com (India)
- AI safety — Psychiatric Times; APA health advisory (2025); Brown University (2025); Nature Sci Reports (suicidal-ideation detection)
- Journaling/CBT efficacy — PMC systematic review (PMC8935176); Reflection.app; Springer (chatbot mood/CBT journaling)
- Student app preferences — JMIR Formative Research (co-designed screening app); AIIMS "Never Alone"
