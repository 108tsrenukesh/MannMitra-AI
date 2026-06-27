<p align="center">
  <img src="docs/banner.svg" alt="MannMitra" width="100%" />
</p>

<h1 align="center">🪷 MannMitra — your mind's quiet companion</h1>

<p align="center">
  <i>A private, multilingual, GenAI wellbeing companion for India's high-stakes exam aspirants.</i>
</p>

<p align="center">
  <a href="https://108tsrenukesh.github.io/MannMitra-AI/"><img src="https://img.shields.io/badge/Live_Demo-MannMitra-7fd8c5?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Live demo"></a>
  <img src="https://img.shields.io/badge/AI-Gemini%20→%20Groq%20→%20Offline-9babff?style=for-the-badge&logo=google" alt="AI">
  <img src="https://img.shields.io/badge/PWA-installable-22c55e?style=for-the-badge&logo=pwa&logoColor=white" alt="PWA">
</p>

<p align="center">
  <img src="https://img.shields.io/badge/tests-21_unit_%2B_19_e2e_passing-22c55e?style=flat-square" alt="tests">
  <img src="https://img.shields.io/badge/dependencies-0-blue?style=flat-square" alt="deps">
  <img src="https://img.shields.io/badge/size-~0.3_MB-blue?style=flat-square" alt="size">
  <img src="https://img.shields.io/badge/languages-23-9babff?style=flat-square" alt="languages">
  <img src="https://img.shields.io/badge/privacy-device--local-7fd8c5?style=flat-square" alt="privacy">
  <img src="https://img.shields.io/badge/license-MIT-lightgrey?style=flat-square" alt="license">
</p>

> Built for **PromptWars · Build with AI** (Google for Developers × Hack2skill).
> **Live:** https://108tsrenukesh.github.io/MannMitra-AI/

---

## 📑 Table of contents
- [Why MannMitra](#-why-mannmitra)
- [The defining insight](#-the-defining-insight)
- [Features](#-features)
- [How it works (GenAI + safety flow)](#-how-it-works)
- [User journey](#-user-journey)
- [Architecture](#-architecture)
- [Safety & Privacy](#-safety--privacy)
- [GenAI usage](#-genai-usage)
- [Tech stack](#-tech-stack)
- [Run locally](#-run-locally)
- [Deploy](#-deploy)
- [Testing](#-testing)
- [Roadmap](#-roadmap)
- [Disclaimer](#-disclaimer)

---

## 💡 Why MannMitra

India's competitive-exam students are in a silent mental-health crisis:

| Stat | Source |
|---|---|
| **14,488** student suicides in 2024 (≈8.5% of all suicides, +4.3% YoY) | NCRB |
| **Exam failure** = the **#1 recorded cause** for under-18s | NCRB |
| **>85%** of students report moderate-to-severe exam stress | NIMHANS |
| **~70% anxiety / ~60% depressive signs** during prep (8-city study) | 2025 study |
| Kota coaching-hub suicides: **28 → 17** (2023→24), rising in 2025 | Reported |

Counselling capacity can't scale to this. MannMitra is the **upstream, always-on, anonymous layer** that catches students early and bridges them to real human help.

## 🎯 The defining insight

> Among students who reach the point of suicidal thoughts, **fewer than 4 in 10 tell anyone — and those who do tell a friend, not a counsellor.** *(NIMHANS)*

So we didn't build a clinical app. We built the **private friend a student will actually confide in** — one that quietly bridges them to real help (Tele-MANAS & more), and never pretends to replace it.

## ✨ Features

| | Feature | What it does |
|---|---|---|
| 📝 | **Daily check-in** | Open journaling + 1-tap mood. The AI reflects back in 2–4 warm sentences and surfaces **hidden stress triggers**. |
| 🧠 | **Brain-dump summarizer** | Pour out a messy rant → AI sorts it into clear buckets (syllabus / rank / sleep). *Organises, doesn't diagnose.* |
| 💬 | **Companion chat** | Empathetic, exam- & language-aware coping support. Not a therapist — a friend who gets exam pressure. |
| 📈 | **Patterns** | Mood trend **with date & time**, distribution, streaks, a weekly *"pattern of the week,"* and a cloud of recurring themes. |
| 🧰 | **Adaptive toolkit** | Box / 4-7-8 / Ocean breathing (animated), grounding, PMR, **Rank-anxiety reframe** — auto-suggested to your state, **fully offline**. |
| 🎯 | **Exam mode** | Set your exam date → a gentle, paced countdown with stage-aware tips. |
| 🆘 | **SOS safety net** | Crisis gate + one-tap helplines + a private **Stanley-Brown Safety Plan**. |
| 🔐 | **Access-code login** | A unique 4-digit code is generated at onboarding; required to reopen your device-local history. |
| 🌐 | **23 languages** | 22 Eighth-Schedule languages + English — **GenAI-translated** UI, cached on device. |
| 📖 | **Read-me-first tour** | A welcome guide pops on first launch; reopen anytime via the **❔** button. |

## 🔧 How it works

GenAI-first, with a deterministic fallback so the deployed link **always** works — and a **safety gate that runs before any AI call** (offline keyword check + online AI second pass).

```mermaid
flowchart LR
    A([User input]) --> G{Offline crisis gate<br/>keywords · EN + Hindi}
    G -- crisis --> C[🆘 Crisis screen<br/>helplines + Safety Plan]
    G -- ok --> S{AI semantic screen<br/>2nd layer · online}
    S -- risk --> C
    S -- ok --> P{AI provider}
    P -->|primary| Gem[Gemini 2.0 Flash]
    P -->|fallback| Grq[Groq Llama-3.3]
    P -->|offline / fail| Det[Deterministic engine]
    Gem --> R([Reflection · chat · buckets])
    Grq --> R
    Det --> R
    classDef crisis fill:#3a1f27,stroke:#ff8a8a,color:#fff;
    class C crisis;
```

## 🧭 User journey

```mermaid
sequenceDiagram
    actor S as Student
    participant App as MannMitra (browser)
    participant LS as localStorage (device)
    participant AI as Gemini / Groq
    S->>App: Open link → "Read me first" tour
    S->>App: Pick exam + language + name → Start
    App->>App: Generate unique 4-digit access code
    App-->>S: "Save this code" (required to return)
    App->>LS: Save profile + PIN hash (SHA-256)
    S->>App: Daily check-in (mood + journal)
    App->>App: Offline crisis gate (always)
    App->>AI: Analyse entry (only the chosen text)
    AI-->>App: Reflection + triggers + coping
    App->>LS: Store entry locally (never a server)
    Note over S,LS: Next visit → PIN unlocks the same history
```

## 🏗️ Architecture

Zero-dependency, no-build static app. Modules with single responsibilities:

```mermaid
flowchart TD
    HTML[index.html · UI shell] --> APP[app.js · controller + safe DOM]
    APP --> SAFE[safety.js · crisis gate + system prompt]
    APP --> AI[ai.js · Gemini→Groq + brain-dump + AI screen]
    APP --> AN[analysis.js · triggers · patterns · buckets]
    APP --> INS[insights.js · trend · distribution · streak]
    APP --> STO[storage.js · device-local data]
    APP --> I18[i18n.js · 23-language UI]
    APP --> AUTH[auth.js · SHA-256 access code]
    APP --> CFG[config.js · helplines · exercises · langs]
    AI --> AN
    SW[service-worker.js] -. offline cache .- HTML
```

```
mannmitra/
├── index.html            # SPA shell (onboarding, 5 tabs, lock, crisis, settings)
├── manifest.json, service-worker.js, icons/   # installable PWA, offline shell
├── docs/banner.svg
├── assets/css/styles.css
└── assets/js/
    ├── config.js   safety.js   storage.js   analysis.js
    ├── insights.js ai.js       i18n.js      auth.js
    ├── app.js                  # controller (safe DOM, no innerHTML)
    └── app.test.js             # 21 unit tests
```

## 🛡️ Safety & Privacy

**Safety (because careless AI here causes harm — ~20% unsafe responses vs ~7% for humans; APA mandates crisis-escalation):**
- 🔴 **Crisis gate runs before every AI call** — on check-in, chat *and* brain-dump. Offline keyword detection (English + Hindi/Hinglish/Devanagari) **+** an online AI semantic second pass. On any risk → it **halts** and shows helplines + your Safety Plan, never counsels a crisis alone.
- 🧠 **Hardened system prompt** on every call: never give methods, never validate self-harm, never diagnose, always bridge to a human.
- 🆘 **Always-on SOS** + Tele-MANAS 14416 / iCall / Vandrevala / AASRA, one-tap dial.

**Privacy (the #1 thing this audience asks for):**
- 🔒 **Device-local & anonymous** — journals, moods, chat, safety plan live in your browser. **No server, no account.**
- 🔑 **No keys in source** — runtime entry or CI-secret injection, placeholder-guarded.
- 🛡️ **Strict CSP, zero `innerHTML`, zero inline handlers** — minimal XSS surface.
- 📵 No ads, no trackers, **never used to train AI.** Export & delete anytime.

## 🤖 GenAI usage

| Where | Model | Purpose |
|---|---|---|
| Journal reflection | Gemini 2.0 Flash → Groq Llama-3.3 | 2–4 sentence empathetic reflection + structured triggers/coping (JSON) |
| Companion chat | Gemini → Groq | Contextual, exam- & language-aware coping dialogue |
| Brain-dump | Gemini → Groq | Categorise a rant into themed buckets + one tiny step each |
| AI crisis screen | Gemini → Groq | Second-layer semantic risk detection on top of the offline gate |
| 23-language UI | Gemini → Groq | On-demand UI translation, cached locally |

If AI is unavailable, a **deterministic engine** keeps every feature working — so the link never breaks.

## 🧱 Tech stack

![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/Vanilla_JS_(ESM)-F7DF1E?logo=javascript&logoColor=black)
![Gemini](https://img.shields.io/badge/Google_Gemini-8E75B2?logo=google&logoColor=white)
![Groq](https://img.shields.io/badge/Groq-F55036?logo=groq&logoColor=white)
![GitHub Pages](https://img.shields.io/badge/GitHub_Pages-222?logo=githubpages&logoColor=white)
![PWA](https://img.shields.io/badge/PWA-5A0FC8?logo=pwa&logoColor=white)

No framework, no build step, no dependencies — pure HTML/CSS/ESM. Web Crypto for the access code, Service Worker for offline.

## 💻 Run locally

ES modules need HTTP (not `file://`):

```bash
python -m http.server 8000      # or:  npx serve -l 8000
# open http://localhost:8000  (Incognito recommended)
```

Add AI keys via **⚙️ Settings → AI keys** (kept in session memory only).

## 🚀 Deploy

Push to `main` → GitHub Actions builds & publishes to Pages. Set repo secrets `GEMINI_API_KEY` / `GROQ_API_KEY` to enable AI on the live build (otherwise it runs in offline mode).

## ✅ Testing

- **21 unit tests** (`assets/js/app.test.js`) — crisis classifier, triggers, patterns, insights, PIN hashing, brain-dump bucketing. Run in-browser via [`tests.html`](tests.html) or in Node.
- **19 headless end-to-end checks** (jsdom) — full flow: onboarding → access-code → check-in → AI reflection → insights → crisis gate.

## 🗺️ Roadmap

Responsibly deferred (needs a backend or clinical governance): clinical-grade crisis classifier + human-in-the-loop review, campus resource navigator, opt-in peer "buddies," voice brain-dump, RCT validation. *We deliberately did **not** fabricate "alumni topper" personas — survivorship-bias + parasocial risk.*

## ⚠️ Disclaimer

MannMitra is a **supportive companion, not a doctor or therapist** and not a medical device. In distress, please contact **Tele-MANAS 14416** (free, 24×7, India).

## 📄 License

MIT — see [LICENSE](LICENSE).
