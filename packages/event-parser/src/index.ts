import type { MealEvent, WorkoutEvent } from '@glucose/types';
import { parseLibreTimestamp } from '@glucose/libre-parser';

/**
 * Normalize CSV meal data into structured MealEvent[].
 * This is a passthrough since libre-parser already produces MealEvent[].
 */
export function normalizeCsvMeals(csvMeals: MealEvent[]): MealEvent[] {
    return csvMeals.filter((m) => m.timestamp !== '');
}

/**
 * Parse a timestamp from document text (DD-MM-YYYY HH:mm format).
 */
export function parseDocumentTimestamp(raw: string): string | null {
    return parseLibreTimestamp(raw);
}

function parseDateFromLine(line: string): string | null {
    const match = line.match(/(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
    if (!match) return null;
    const [, d, m, y] = match;
    const dd = d.padStart(2, '0');
    const mm = m.padStart(2, '0');
    return `${y}-${mm}-${dd}`;
}

function parseTimeFromLine(line: string): { hour: number; minute: number; raw: string } | null {
    const hFormat = line.match(/(\d{1,2})\s*h\s*(\d{2})?/i);
    if (hFormat) {
        const hour = parseInt(hFormat[1], 10);
        const minute = hFormat[2] ? parseInt(hFormat[2], 10) : 0;
        if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
            return { hour, minute, raw: hFormat[0] };
        }
    }

    const colonFormat = line.match(/\b(\d{1,2}):(\d{2})\b/);
    if (colonFormat) {
        const hour = parseInt(colonFormat[1], 10);
        const minute = parseInt(colonFormat[2], 10);
        if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
            return { hour, minute, raw: colonFormat[0] };
        }
    }

    const amPmFormat = line.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i);
    if (amPmFormat) {
        let hour = parseInt(amPmFormat[1], 10);
        const minute = amPmFormat[2] ? parseInt(amPmFormat[2], 10) : 0;
        const suffix = amPmFormat[3].toLowerCase();
        if (suffix === 'pm' && hour < 12) hour += 12;
        if (suffix === 'am' && hour === 12) hour = 0;
        if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
            return { hour, minute, raw: amPmFormat[0] };
        }
    }

    return null;
}

function toIsoWithDate(dateIso: string, hour: number, minute: number): string {
    return `${dateIso}T${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;
}

/**
 * Simple heuristic event extraction from document text.
 * Falls back to LLM extraction when available, but provides
 * basic regex-based extraction as a deterministic fallback.
 */
export function extractEventsFromTextBasic(text: string): {
    meals: Partial<MealEvent>[];
    workouts: Partial<WorkoutEvent>[];
} {
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    const meals: Partial<MealEvent>[] = [];
    const workouts: Partial<WorkoutEvent>[] = [];

    const workoutKeywords =
        /\b(walk|walked|walking|jog|jogged|jogging|run|running|resistance|weight|gym|exercise|workout|marche|marcher|resistance|musculation|entrainement)\b/i;
    const mealKeywords =
        /\b(ate|eat|eating|breakfast|lunch|dinner|snack|meal|food|had|restaurant|soupe|salade|riz|patate|poulet|honey|miel|banana|oeufs|eggs)\b/i;
    const finishMealKeywords = /\b(fini|finished|termine|terminé)\b/i;

    let counter = 0;
    let currentDate = new Date().toISOString().slice(0, 10);
    let activeMealIndex: number | null = null;

    for (const line of lines) {
        const trimmed = line.replace(/^\s*[-*]\s*/, '').trim();
        const lineDate = parseDateFromLine(trimmed);
        if (lineDate) currentDate = lineDate;

        const time = parseTimeFromLine(trimmed);
        const hasTime = Boolean(time);
        const ts = hasTime ? toIsoWithDate(currentDate, time!.hour, time!.minute) : null;
        const rawTs = hasTime ? `${currentDate} ${time!.raw}` : '';
        const textAfterTs = hasTime
            ? trimmed.slice(trimmed.indexOf(time!.raw) + time!.raw.length).replace(/^[:)\-–\s]+/, '').trim()
            : trimmed;
        const classificationText = trimmed;

        if (hasTime && workoutKeywords.test(classificationText)) {
            counter++;
            let type: 'walk' | 'jogging' | 'resistance' = 'walk';
            if (/\b(jog|jogged|jogging|run|running)\b/i.test(classificationText)) {
                type = 'jogging';
            }
            if (/\b(resistance|weight|gym|musculation)\b/i.test(classificationText)) {
                type = 'resistance';
            }

            let duration: number | null = null;
            const range = classificationText.match(/(?:de|from)?\s*(\d{1,2}\s*h\s*\d{0,2}|\d{1,2}:\d{2}).*?(?:a|à|to|til|until)\s*(\d{1,2}\s*h\s*\d{0,2}|\d{1,2}:\d{2})/i);
            if (range) {
                const start = parseTimeFromLine(range[1]);
                const end = parseTimeFromLine(range[2]);
                if (start && end) {
                    const startMin = start.hour * 60 + start.minute;
                    const endMin = end.hour * 60 + end.minute;
                    const diff = endMin - startMin;
                    if (diff > 0) duration = diff;
                }
            }
            if (duration === null) {
                const durationMatch = classificationText.match(/(\d+)\s*(?:min|minutes|mins|mn)/i);
                duration = durationMatch ? parseInt(durationMatch[1], 10) : null;
            }

            workouts.push({
                id: `doc-workout-${counter}`,
                timestamp: ts!,
                rawTimestamp: rawTs,
                type,
                durationMinutes: duration,
                notes: classificationText,
                source: 'document',
            });
            activeMealIndex = null;
            continue;
        }

        if (hasTime && finishMealKeywords.test(textAfterTs)) {
            activeMealIndex = null;
            continue;
        }

        if (hasTime && (mealKeywords.test(textAfterTs) || textAfterTs.length > 0)) {
            counter++;
            meals.push({
                id: `doc-meal-${counter}`,
                timestamp: ts!,
                rawTimestamp: rawTs,
                name: (textAfterTs || `Meal ${counter}`).slice(0, 100),
                ingredients: textAfterTs ? [textAfterTs] : undefined,
                notes: textAfterTs,
                carbsGrams: null,
                carbsSource: 'unknown',
                source: 'document',
            });
            activeMealIndex = meals.length - 1;
            continue;
        }

        // Continuation bullets without explicit time: attach to most recent meal.
        if (!hasTime && activeMealIndex !== null && trimmed.length > 0 && !workoutKeywords.test(trimmed)) {
            const meal = meals[activeMealIndex];
            const ingredients = meal.ingredients ?? [];
            ingredients.push(trimmed);
            meal.ingredients = ingredients;
            meal.notes = meal.notes ? `${meal.notes}; ${trimmed}` : trimmed;
        }
    }

    return { meals, workouts };
}
