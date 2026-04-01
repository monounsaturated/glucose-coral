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

    const tsRegex = /(\d{1,2}[-/.]\d{1,2}[-/.]\d{4}\s+\d{1,2}:\d{2})/;
    const workoutKeywords = /\b(walk|walked|walking|jog|jogged|jogging|run|running|resistance|weight|gym|exercise|workout)\b/i;
    const mealKeywords = /\b(ate|eat|eating|breakfast|lunch|dinner|snack|meal|food|had)\b/i;

    let counter = 0;

    for (const line of lines) {
        const tsMatch = line.match(tsRegex);
        if (!tsMatch) continue;

        const rawTs = tsMatch[1];
        const ts = parseLibreTimestamp(rawTs);
        if (!ts) continue;

        const textAfterTs = line.slice(line.indexOf(rawTs) + rawTs.length).trim();
        counter++;

        if (workoutKeywords.test(textAfterTs)) {
            let type: 'walk' | 'jogging' | 'resistance' = 'walk';
            if (/\b(jog|jogged|jogging|run|running)\b/i.test(textAfterTs)) type = 'jogging';
            if (/\b(resistance|weight|gym)\b/i.test(textAfterTs)) type = 'resistance';

            const durationMatch = textAfterTs.match(/(\d+)\s*(?:min|minutes|mins)/i);
            const duration = durationMatch ? parseInt(durationMatch[1], 10) : null;

            workouts.push({
                id: `doc-workout-${counter}`,
                timestamp: ts,
                rawTimestamp: rawTs,
                type,
                durationMinutes: duration,
                notes: textAfterTs,
                source: 'document',
            });
        } else if (mealKeywords.test(textAfterTs) || textAfterTs.length > 0) {
            meals.push({
                id: `doc-meal-${counter}`,
                timestamp: ts,
                rawTimestamp: rawTs,
                name: textAfterTs.slice(0, 100),
                notes: textAfterTs,
                carbsGrams: null,
                carbsSource: 'unknown',
                source: 'document',
            });
        }
    }

    return { meals, workouts };
}
