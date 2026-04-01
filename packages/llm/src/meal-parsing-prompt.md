# Meal Parsing System Prompt

This file documents the system prompt used by the AI to parse meal, workout,
and sleep notes into structured data.

**To update the prompt:** edit `prompts.ts` in this same directory — the
`MEAL_PARSING_PROMPT` constant is the exact string sent to the model.
This `.md` file is the human-readable reference; keep them in sync.

---

## What the prompt does

1. **Multilingual input → English output**
   Accepts notes in any language (French, Spanish, Italian, etc.) and always
   produces English field values.

2. **Meal grouping**
   Food/drink items logged within 60 minutes of each other are merged into a
   single meal. Supplements at mealtime belong to that meal's `ingredients`.

3. **Meal labeling** (one of each per calendar day)
   | Label       | Time window                        | Extra rules                                             |
   |-------------|------------------------------------|---------------------------------------------------------|
   | `Breakfast` | First meal, before 11:15 AM        | Only assigned once; further early intakes → `Snack`    |
   | `Lunch`     | 11:30 AM – 2:00 PM                 | Only assigned once                                      |
   | `Dinner`    | 5:30 PM – 1:00 AM (next day)       | Only assigned once                                      |
   | `Snack`     | Everything else                    | Any small intake outside the windows above             |

4. **Macro estimation** (all in grams, all labeled `"llm-estimated"`)
   - `carbsGrams` — total carbohydrates
   - `proteinGrams` — total protein
   - `fatGrams` — total fat
   - `fiberGrams` — dietary fiber
   - `carbBreakdown.starchGrams`
   - `carbBreakdown.sugarGrams`
   - `carbBreakdown.fructoseGrams`
   - `carbBreakdown.glucoseGrams`

5. **Workout extraction**
   - Walk / brisk walk → `"walk"`
   - Jog / run → `"jogging"`
   - Resistance training / weights / gym → `"resistance"`
   - Duration in minutes if inferable

6. **Sleep extraction**
   Parses statements like "slept from 11pm to 7am" or "slept 8 hours".
   `sleepStart` / `sleepEnd` as ISO 8601 strings.

7. **Timestamp handling**
   Accepts many formats: `9h17`, `13h25`, `9am`, `1:30pm`, `13:30`, `23-03-2026 10:34`, etc.
   If no date is provided, the `dateHint` passed in the user message is used.
   All output timestamps: `YYYY-MM-DDTHH:mm:00`.

---

## Correlation hooks (future)

The structured output is designed to enable:
- meal × glucose spike correlation
- exercise × post-meal glucose correlation
- sleep quality × fasting glucose correlation
