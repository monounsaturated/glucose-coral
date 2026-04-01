import type {
    GlucoseReading,
    MealEvent,
    WorkoutEvent,
    MealAnalysisResult,
    MealFlag,
    ImpactLabel,
} from '@glucose/types';
import {
    SPIKE_THRESHOLD_MG_DL,
    BASELINE_WINDOW_MINUTES,
    POST_MEAL_WINDOW_MINUTES,
    OVERLAPPING_MEAL_WINDOW_MINUTES,
    ABOVE_BASELINE_OFFSET_MG_DL,
    IMPACT_LOW_MAX,
    IMPACT_MODERATE_MAX,
} from '@glucose/types';

// ─── Helpers ───────────────────────────────────────────────

function toMs(ts: string): number {
    return new Date(ts).getTime();
}

function minutesBetween(a: string, b: string): number {
    return (toMs(b) - toMs(a)) / 60_000;
}

function median(values: number[]): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
        ? (sorted[mid - 1] + sorted[mid]) / 2
        : sorted[mid];
}

// ─── Get readings in a time window ─────────────────────────

function readingsInWindow(
    readings: GlucoseReading[],
    startTs: string,
    endTs: string,
): GlucoseReading[] {
    const startMs = toMs(startTs);
    const endMs = toMs(endTs);
    return readings.filter((r) => {
        const ms = toMs(r.timestamp);
        return ms >= startMs && ms <= endMs;
    });
}

function offsetTimestamp(ts: string, offsetMinutes: number): string {
    const d = new Date(toMs(ts) + offsetMinutes * 60_000);
    return d.toISOString().replace('Z', '').split('.')[0];
}

// ─── Impact Label ──────────────────────────────────────────

export function getImpactLabel(peakDelta: number): ImpactLabel {
    if (peakDelta < IMPACT_LOW_MAX) return 'low';
    if (peakDelta < IMPACT_MODERATE_MAX) return 'moderate';
    return 'high';
}

// ─── Analyze a single meal ─────────────────────────────────

export function analyzeMeal(
    meal: MealEvent,
    readings: GlucoseReading[],
    allMeals: MealEvent[],
    workouts: WorkoutEvent[],
): MealAnalysisResult {
    const flags: MealFlag[] = [];

    // Check for overlapping meals
    const otherMeals = allMeals.filter((m) => m.id !== meal.id);
    for (const other of otherMeals) {
        const gap = minutesBetween(meal.timestamp, other.timestamp);
        if (gap > 0 && gap <= OVERLAPPING_MEAL_WINDOW_MINUTES) {
            flags.push('overlapping-meal-window');
            break;
        }
    }

    // Check for workout in window
    for (const w of workouts) {
        const gap = minutesBetween(meal.timestamp, w.timestamp);
        if (gap >= 0 && gap <= POST_MEAL_WINDOW_MINUTES) {
            flags.push('workout-in-window');
            break;
        }
    }

    // Baseline: median glucose in [-30min, 0] before meal
    const baselineStart = offsetTimestamp(meal.timestamp, -BASELINE_WINDOW_MINUTES);
    const baselineReadings = readingsInWindow(readings, baselineStart, meal.timestamp);

    if (baselineReadings.length === 0) {
        flags.push('insufficient-baseline-data');
        return {
            mealId: meal.id,
            baseline: null,
            peak: null,
            peakDelta: null,
            peakTimingMinutes: null,
            durationAboveBaseline20: null,
            isSpike: null,
            impactLabel: null,
            flags,
        };
    }

    const baseline = median(baselineReadings.map((r) => r.value));

    // Post-meal window: [0, +120min]
    const postMealEnd = offsetTimestamp(meal.timestamp, POST_MEAL_WINDOW_MINUTES);
    const postMealReadings = readingsInWindow(readings, meal.timestamp, postMealEnd);

    if (postMealReadings.length === 0) {
        return {
            mealId: meal.id,
            baseline,
            peak: null,
            peakDelta: null,
            peakTimingMinutes: null,
            durationAboveBaseline20: null,
            isSpike: null,
            impactLabel: null,
            flags,
        };
    }

    // Peak glucose
    let peak = -Infinity;
    let peakTs = '';
    for (const r of postMealReadings) {
        if (r.value > peak) {
            peak = r.value;
            peakTs = r.timestamp;
        }
    }

    const peakDelta = peak - baseline;
    const peakTimingMinutes = Math.round(minutesBetween(meal.timestamp, peakTs));
    const isSpike = peakDelta >= SPIKE_THRESHOLD_MG_DL;
    const impactLabel = getImpactLabel(peakDelta);

    // Duration above baseline + 20
    const threshold = baseline + ABOVE_BASELINE_OFFSET_MG_DL;
    let durationAbove = 0;
    const sorted = [...postMealReadings].sort((a, b) =>
        a.timestamp.localeCompare(b.timestamp),
    );

    for (let i = 0; i < sorted.length; i++) {
        if (sorted[i].value >= threshold) {
            if (i + 1 < sorted.length) {
                durationAbove += minutesBetween(sorted[i].timestamp, sorted[i + 1].timestamp);
            } else if (i > 0) {
                // Last point: use average interval
                const avgInterval =
                    minutesBetween(sorted[0].timestamp, sorted[sorted.length - 1].timestamp) /
                    (sorted.length - 1);
                durationAbove += avgInterval;
            }
        }
    }

    return {
        mealId: meal.id,
        baseline: Math.round(baseline * 10) / 10,
        peak: Math.round(peak * 10) / 10,
        peakDelta: Math.round(peakDelta * 10) / 10,
        peakTimingMinutes,
        durationAboveBaseline20: Math.round(durationAbove),
        isSpike,
        impactLabel,
        flags,
    };
}

// ─── Analyze all meals ─────────────────────────────────────

export function analyzeAllMeals(
    readings: GlucoseReading[],
    meals: MealEvent[],
    workouts: WorkoutEvent[],
): MealAnalysisResult[] {
    return meals.map((meal) => analyzeMeal(meal, readings, meals, workouts));
}

// ─── Cross-meal insights ──────────────────────────────────

export interface CrossMealInsights {
    highestImpactMeals: string[];
    foodsAssociatedWithSpikes: string[];
    foodsWithMildResponses: string[];
    walkBenefitExamples: string[];
}

export function generateCrossMealInsights(
    meals: MealEvent[],
    analyses: MealAnalysisResult[],
    workouts: WorkoutEvent[],
): CrossMealInsights {
    const analysisMap = new Map(analyses.map((a) => [a.mealId, a]));

    // Clean meals: no overlapping, no workout-in-window
    const cleanAnalyses = analyses.filter(
        (a) =>
            !a.flags.includes('overlapping-meal-window') &&
            !a.flags.includes('insufficient-baseline-data') &&
            a.peakDelta !== null,
    );

    // Highest impact meals
    const sorted = [...cleanAnalyses]
        .filter((a) => a.peakDelta !== null)
        .sort((a, b) => (b.peakDelta ?? 0) - (a.peakDelta ?? 0));
    const highestImpactMeals = sorted.slice(0, 3).map((a) => {
        const meal = meals.find((m) => m.id === a.mealId);
        return `${meal?.name ?? 'Unknown meal'} (peak delta: ${a.peakDelta} mg/dL, ${a.impactLabel} impact)`;
    });

    // Foods associated with spikes
    const spikeAnalyses = cleanAnalyses.filter((a) => a.isSpike);
    const spikeNames = new Set<string>();
    for (const a of spikeAnalyses) {
        const meal = meals.find((m) => m.id === a.mealId);
        if (meal?.name) spikeNames.add(meal.name);
    }
    const foodsAssociatedWithSpikes = Array.from(spikeNames);

    // Foods with mild responses
    const mildAnalyses = cleanAnalyses
        .filter((a) => a.impactLabel === 'low')
        .filter((a) => !a.flags.includes('workout-in-window'));
    const mildNames = new Set<string>();
    for (const a of mildAnalyses) {
        const meal = meals.find((m) => m.id === a.mealId);
        if (meal?.name) mildNames.add(meal.name);
    }
    const foodsWithMildResponses = Array.from(mildNames);

    // Walk benefit examples
    const walkBenefitExamples: string[] = [];
    const withWorkout = cleanAnalyses.filter((a) =>
        a.flags.includes('workout-in-window'),
    );
    const withoutWorkout = cleanAnalyses.filter(
        (a) => !a.flags.includes('workout-in-window'),
    );

    if (withWorkout.length > 0 && withoutWorkout.length > 0) {
        const avgWithWorkout =
            withWorkout.reduce((s, a) => s + (a.peakDelta ?? 0), 0) / withWorkout.length;
        const avgWithout =
            withoutWorkout.reduce((s, a) => s + (a.peakDelta ?? 0), 0) / withoutWorkout.length;

        if (avgWithWorkout < avgWithout) {
            walkBenefitExamples.push(
                `Meals with workouts nearby had an average peak delta of ${Math.round(avgWithWorkout)} mg/dL vs ${Math.round(avgWithout)} mg/dL without — suggesting exercise may be associated with lower glucose peaks.`,
            );
        }
    }

    for (const a of withWorkout) {
        const meal = meals.find((m) => m.id === a.mealId);
        const workout = workouts.find((w) => {
            const gap = minutesBetween(meal?.timestamp ?? '', w.timestamp);
            return gap >= 0 && gap <= POST_MEAL_WINDOW_MINUTES;
        });
        if (meal && workout) {
            walkBenefitExamples.push(
                `${meal.name}: ${workout.type} after eating appeared associated with a ${a.impactLabel} impact (peak delta: ${a.peakDelta} mg/dL)`,
            );
        }
    }

    return {
        highestImpactMeals,
        foodsAssociatedWithSpikes,
        foodsWithMildResponses,
        walkBenefitExamples,
    };
}
