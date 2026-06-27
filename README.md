# 🪷 MannMitra — your mind's quiet companion

A private, multilingual **AI wellbeing companion** for Indian students preparing for high-stakes
exams (NEET, JEE, CUET, CAT, GATE, UPSC, boards). MannMitra turns open-ended **daily journaling and
mood logs** into gentle, GenAI-powered insight — surfacing the **hidden stress triggers and emotional
patterns that a number-only tracker misses** — and offers safe, contextual, conversational support.

> Built for **PromptWars · Build with AI** (Google for Developers × Hack2skill).

**Live demo:** https://108tsrenukesh.github.io/mannmitra/

---

## Why this exists (the evidence)

- India recorded **14,488 student suicides in 2024** (NCRB); exam failure is the leading recorded cause for under-18s.
- **>85%** of students report moderate-to-severe exam stress (NIMHANS); a 2025 eight-city study found **~70% anxiety / ~60% depressive signs**.
- The defining insight: among students who reach suicidal thoughts, **fewer than 4 in 10 tell anyone — and those who do tell a friend, not a counsellor.**

So MannMitra is built to be the *first, low-pressure, private friend* a student will actually open up
to — and to **bridge them to real human help** (Tele-MANAS 14416 and others), never to replace it.
Full research write-up: see `../MENTAL_WELLNESS_ANALYSIS.md`.

## Safety first (this is the differentiator)

Careless wellness bots can cause harm — studies show ~20% unsafe responses vs ~7% for humans, and the
APA says they must ship with crisis-escalation. MannMitra therefore:

- Runs a **crisis classifier on every input *before* any AI reply** (`safety.js`, English + Hindi/Hinglish). On a crisis signal it **interrupts the flow** and shows real helplines instead of trying to counsel.
- Ships a **hardened safety system-prompt** the AI inherits on every call: never validate self-harm, never give methods, never diagnose, always bridge to a human.
- Keeps a **"Talk to someone now"** button in the header at all times.
- Is **private by default**: no login, journal stays in your browser, only the text you choose to reflect on is sent to the AI. Export/delete your data anytime.

## Features (mapped to the challenge)

| Challenge requirement | In MannMitra |
| --- | --- |
| Open-ended journaling + mood logs | Daily check-in: 1-tap mood + free-text journal |
| GenAI uncovers hidden triggers & patterns | Per-entry AI reflection (triggers, gentle insight, coping) + local longitudinal **pattern-of-the-week** |
| Conversational, hyper-personalised support | "Talk it through" companion, exam- and language-aware |
| Adaptive mindfulness / coping / encouragement | Offline toolkit (box-breathing, 5-4-3-2-1 grounding, reframing, breaks) |
| Safely acting as a companion | Crisis gate + helplines + safety prompt + privacy |

Plus a **Patterns** dashboard (mood trend, trigger cloud, gentle streak) and **23-language** support
(22 Eighth-Schedule languages + English) for AI replies.

## Architecture

- **Static web app**, no build step → deploys to GitHub Pages instantly. The offline toolkit and the
  deterministic reflection run with **zero network**, so the **deployed link always works** (no DQ).
- **AI layer (`ai.js`): Gemini primary → Groq fallback → deterministic hybrid.** Two capabilities:
  structured entry analysis (JSON) and companion chat — both inherit the safety prompt.
- **Local-first storage** (`storage.js`), private by default.
- **Security:** no keys in source (runtime entry or CI secret injection, placeholder-guarded), strict
  CSP, all rendering via `textContent`/`createElement` (no `innerHTML` injection).

```
input ─▶ safety gate ─▶ [Gemini] ─▶ [Groq] ─▶ [deterministic] ─▶ UI
            │
            └─ crisis ▶ helpline screen (skips AI entirely)
```

## Project structure

```
mannmitra/
├── index.html              # SPA shell: onboarding, check-in, talk, insights, toolkit, crisis, settings
├── tests.html              # live unit-test runner
├── manifest.json, service-worker.js, icons/   # installable PWA, offline shell
├── assets/css/styles.css
└── assets/js/
    ├── config.js           # helplines, languages, exams, toolkit, coping
    ├── safety.js           # crisis classifier + safety system prompt  ← gates everything
    ├── storage.js          # local-first persistence + export/delete
    ├── analysis.js         # deterministic reflection, triggers, patterns
    ├── insights.js         # mood series, trigger cloud, streak
    ├── ai.js               # Gemini → Groq → deterministic
    ├── app.js              # controller + safe DOM rendering
    └── app.test.js         # unit tests
```

## Run locally

ES modules need HTTP (not `file://`):

```bash
python -m http.server 8000   # then open http://localhost:8000
```

Add AI keys via the in-app **⚙️ Settings** (kept in session memory only), or set repo secrets
`GEMINI_API_KEY` / `GROQ_API_KEY` for the deployed demo.

## Tests

Open [`tests.html`](tests.html) — it runs the safety classifier, trigger detection, pattern and
insight tests live in the browser.

## Important

MannMitra is a **supportive companion, not a medical device or a substitute for professional care.**
If you or someone you know is in distress: **Tele-MANAS 14416** (free, 24×7, India).

## License

MIT — see [LICENSE](LICENSE).
