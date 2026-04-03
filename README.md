# Glucose Coral 🪸

**Exploratory glucose analytics** — upload your FreeStyle Libre export, add plain-text notes if you like, and see how meals and movement line up with your curve. Built for curious humans, not for clinical decisions. 

---

## What it’s for 

- **See patterns** — which meals sit with bigger spikes, which feel gentler, and how walks might line up with the curve.  
- **Notes without spreadsheets** — jot meals and workouts in any language; the app turns them into structured events.  
- **Stay grounded** — spike detection and scoring are **deterministic** (clear rules, same data → same numbers). AI helps **read** your notes and **summarize**; it doesn’t secretly drive the math. 

*Not a medical device. Not a substitute for your care team. For exploration only.* 

---

## How the workflow runs 

1. **Upload your CGM file**  
   Abbott FreeStyle Libre CSV — that’s the spine of the whole story. 

2. **Choose how meals get in**  
   - **From the CSV** — if you already logged food in Libre. 
   - **From a separate note** — paste text or upload `.txt` / `.md` / text-based `.pdf`. 

3. **Structured events (LLM)** 
   When you use notes (not CSV-only food rows), a **large language model** reads your text once and returns **JSON**: meals (with times, labels, ingredients, macro estimates), workouts, and sleep windows. Multilingual in, consistent English field names out — see `packages/llm` for the system prompt. 

4. **Analysis you can reason about (no LLM)** 
   Readings + meals + workouts feed **deterministic** analytics: spike detection, impact labels, cross-meal stats. Same inputs → same outputs. 

5. **Narrative layer (LLM)** 
   Another call turns windows + stats into readable commentary and recommendations — if the model hiccups, you still get charts and numbers. 

6. **Explore** 
   Interactive chart, per-meal detail, summary — on the web app (`apps/web`). 

---

## Data & privacy (plain language) 

- **Your CSV** is processed to extract glucose readings and any meal rows Libre stored. 
- **Your notes** go to the model only to extract **structure** (times, foods, activity) — treat uploads like anything else you’d send to an API: use keys you control, avoid secrets in files. 
- **Outputs** are for **you** to explore trends; they’re not diagnoses. 

---

## Repo layout 

| Area | Role |
|------|------|
| `apps/web` | Next.js UI & API routes 🪸 |
| `packages/libre-parser` | Libre CSV → readings + CSV meals 🪸 |
| `packages/llm` | Prompts + OpenAI calls for parsing & narrative 🪸 |
| `packages/analytics` | Deterministic meal/spike analysis 🪸 |
| `packages/types` | Shared schemas 🪸 |

---

## Running locally 

```bash
npm install
npm run dev
```

Open the app URL shown in the terminal. Set `OPENAI_API_KEY` where the API reads it (for note parsing and full analysis). 

```bash
npm run build
```

---

## Coral count 🪸

If you made it here, you deserve more coral: 🪸 🪸 🪸 🪸 🪸 🪸 🪸 🪸 🪸 🪸

---

*Glucose Coral — dip in, look around, bring questions to your clinician.* 🪸
