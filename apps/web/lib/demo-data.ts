import { parseLibreCsv } from "@glucose/libre-parser";
import { analyzeAllMeals, generateCrossMealInsights } from "@glucose/analytics";
import type { AnalysisOutput, WorkoutEvent } from "@glucose/types";

// Embedded demo CSV content — loaded at build time
import demoCSV from "./demo-csv";

let cachedResult: AnalysisOutput | null = null;

export function getDemoAnalysis(): AnalysisOutput {
    if (cachedResult) return cachedResult;

    const parsed = parseLibreCsv(demoCSV);

    // Create workout events from notes in the CSV (aligned with demo CSV rows)
    const workouts: WorkoutEvent[] = [
        {
            id: "demo-workout-1",
            timestamp: "2026-03-21T13:00:00",
            rawTimestamp: "21-03-2026 13:00",
            type: "walk",
            durationMinutes: 20,
            notes: "Walked 20 mins after lunch",
            source: "csv",
        },
        {
            id: "demo-workout-2",
            timestamp: "2026-03-22T13:00:00",
            rawTimestamp: "22-03-2026 13:00",
            type: "walk",
            durationMinutes: 30,
            notes: "Walked 30 mins after lunch, brisk pace",
            source: "csv",
        },
        {
            id: "demo-workout-3",
            timestamp: "2026-03-23T13:00:00",
            rawTimestamp: "23-03-2026 13:00",
            type: "walk",
            durationMinutes: 25,
            notes: "Walked 25 mins after lunch",
            source: "csv",
        },
        {
            id: "demo-workout-4",
            timestamp: "2026-03-24T13:00:00",
            rawTimestamp: "24-03-2026 13:00",
            type: "walk",
            durationMinutes: 40,
            notes: "Yoga 40 min evening",
            source: "csv",
        },
        {
            id: "demo-workout-5",
            timestamp: "2026-03-25T13:00:00",
            rawTimestamp: "25-03-2026 13:00",
            type: "walk",
            durationMinutes: 25,
            notes: "Walked 25 mins after lunch",
            source: "csv",
        },
        {
            id: "demo-workout-6",
            timestamp: "2026-03-26T13:00:00",
            rawTimestamp: "26-03-2026 13:00",
            type: "walk",
            durationMinutes: 40,
            notes: "Yoga 40 min evening",
            source: "csv",
        },
    ];

    const mealAnalyses = analyzeAllMeals(parsed.readings, parsed.meals, workouts);
    const insights = generateCrossMealInsights(parsed.meals, mealAnalyses, workouts);

    const avgGlucose = Math.round(
        parsed.readings.reduce((s, r) => s + r.value, 0) / parsed.readings.length
    );
    const timeInRange = Math.round(
        (parsed.readings.filter((r) => r.value >= 70 && r.value <= 180).length /
            parsed.readings.length) *
        100
    );
    const spikeMeals = mealAnalyses.filter((a) => a.isSpike);
    const highImpact = mealAnalyses.filter((a) => a.impactLabel === "high");

    const spikeNames = spikeMeals
        .map((a) => parsed.meals.find((m) => m.id === a.mealId)?.name)
        .filter(Boolean);

    const lowImpactNames = mealAnalyses
        .filter((a) => a.impactLabel === "low")
        .map((a) => parsed.meals.find((m) => m.id === a.mealId)?.name)
        .filter(Boolean);

    const summaryText = `Over 7 days and ${parsed.readings.length} glucose readings, your average glucose was ${avgGlucose} mg/dL with ${timeInRange}% of readings in the 70-180 mg/dL range.

${spikeMeals.length} of ${parsed.meals.length} meals appear associated with glucose spikes (≥30 mg/dL rise above baseline). The meals most associated with elevated responses included ${spikeNames.slice(0, 4).join(", ")} — many with higher-carb profiles.

${lowImpactNames.length > 0 ? `Meals that appeared gentler on glucose include ${lowImpactNames.slice(0, 4).join(", ")} — these showed smaller peak rises relative to baseline.` : ""}

${workouts.length > 0 ? `Across the week, post-meal walks and light activity on several days lined up with somewhat softer post-meal curves than the highest-carb meals without movement.` : ""}

Note: These are observational correlations from a sample dataset. Many factors affect glucose responses including portion size, preparation method, stress, and sleep. This is not medical advice.`;

    cachedResult = {
        run: {
            id: "demo-run",
            mode: "csv-food",
            createdAt: new Date().toISOString(),
            status: "complete",
        },
        glucoseReadings: parsed.readings,
        mealEvents: parsed.meals,
        workoutEvents: workouts,
        mealAnalyses,
        summary: {
            text: summaryText,
            generatedAt: new Date().toISOString(),
        },
        crossMealInsights: insights,
    };

    return cachedResult;
}
