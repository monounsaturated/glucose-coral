import { NextRequest, NextResponse } from "next/server";
import { parseLibreCsv } from "@glucose/libre-parser";
import { extractDocumentText } from "@glucose/document-parser";
import { extractEventsFromTextBasic } from "@glucose/event-parser";
import { analyzeAllMeals, generateCrossMealInsights } from "@glucose/analytics";
import { createLLMProvider } from "@glucose/llm";
import type {
    AnalysisOutput,
    InputMode,
    MealEvent,
    WorkoutEvent,
    SleepEvent,
    MealAnalysisResult,
    FullAnalysisInput,
    MealForAnalysis,
    GlucoseReading,
} from "@glucose/types";

// ─── Build per-meal glucose windows for LLM context ────────

function buildMealCurve(
    meal: MealEvent,
    readings: GlucoseReading[],
    windowBeforeMin = 30,
    windowAfterMin = 120,
): Array<{ minutesOffset: number; value: number }> {
    const mealMs = new Date(meal.timestamp).getTime();
    return readings
        .filter((r) => {
            const diff = (new Date(r.timestamp).getTime() - mealMs) / 60_000;
            return diff >= -windowBeforeMin && diff <= windowAfterMin;
        })
        .map((r) => ({
            minutesOffset: Math.round((new Date(r.timestamp).getTime() - mealMs) / 60_000),
            value: r.value,
        }))
        .sort((a, b) => a.minutesOffset - b.minutesOffset);
}

function buildFullAnalysisInput(
    meals: MealEvent[],
    workouts: WorkoutEvent[],
    sleepEvents: SleepEvent[],
    readings: GlucoseReading[],
    analyses: MealAnalysisResult[],
): FullAnalysisInput {
    const analysisMap = new Map(analyses.map((a) => [a.mealId, a]));
    const mealMs = (m: MealEvent) => new Date(m.timestamp).getTime();
    const workoutMs = (w: WorkoutEvent) => new Date(w.timestamp).getTime();

    const mealsForAnalysis: MealForAnalysis[] = meals.map((meal) => {
        const a = analysisMap.get(meal.id);
        const nearbyWorkouts = workouts
            .map((w) => ({
                type: w.type,
                durationMinutes: w.durationMinutes,
                minutesAfterMeal: Math.round((workoutMs(w) - mealMs(meal)) / 60_000),
            }))
            .filter((w) => w.minutesAfterMeal >= -30 && w.minutesAfterMeal <= 120);

        return {
            id: meal.id,
            name: meal.name,
            mealLabel: meal.mealLabel,
            timestamp: meal.timestamp,
            ingredients: meal.ingredients,
            notes: meal.notes,
            carbsGrams: meal.carbsGrams,
            glucoseCurve: buildMealCurve(meal, readings),
            analytics: {
                baseline: a?.baseline ?? null,
                peak: a?.peak ?? null,
                peakDelta: a?.peakDelta ?? null,
                peakTimingMinutes: a?.peakTimingMinutes ?? null,
                isSpike: a?.isSpike ?? null,
                impactLabel: a?.impactLabel ?? null,
            },
            nearbyWorkouts,
        };
    });

    const sortedReadings = [...readings].sort((a, b) =>
        a.timestamp.localeCompare(b.timestamp),
    );
    const avgGlucose = readings.length > 0
        ? Math.round(readings.reduce((s, r) => s + r.value, 0) / readings.length)
        : 0;
    const timeInRange = readings.length > 0
        ? Math.round(
            (readings.filter((r) => r.value >= 70 && r.value <= 180).length /
                readings.length) * 100,
        )
        : 0;
    const dateStart = sortedReadings[0]?.timestamp?.slice(0, 10) ?? '';
    const dateEnd = sortedReadings[sortedReadings.length - 1]?.timestamp?.slice(0, 10) ?? '';

    return {
        meals: mealsForAnalysis,
        workouts: workouts.map((w) => ({
            type: w.type,
            durationMinutes: w.durationMinutes,
            timestamp: w.timestamp,
        })),
        sleepEvents: sleepEvents.map((s) => ({
            sleepStart: s.sleepStart,
            sleepEnd: s.sleepEnd,
            durationMinutes: s.durationMinutes,
        })),
        overallStats: {
            avgGlucose,
            timeInRange,
            totalReadings: readings.length,
            dateRange: dateStart === dateEnd ? dateStart : `${dateStart} to ${dateEnd}`,
        },
    };
}

// ─── Merge LLM enrichments back into meals ──────────────────

function applyEnrichments(
    meals: MealEvent[],
    llmInsights: Awaited<ReturnType<ReturnType<typeof createLLMProvider>["generateFullAnalysis"]>>,
): MealEvent[] {
    const enrichMap = new Map(llmInsights.mealEnrichments.map((e) => [e.mealId, e]));
    return meals.map((meal) => {
        const e = enrichMap.get(meal.id);
        if (!e) return meal;
        return {
            ...meal,
            carbsGrams: meal.carbsGrams ?? e.carbsGrams ?? null,
            carbsSource: meal.carbsGrams != null
                ? meal.carbsSource
                : (e.carbsSource ?? 'llm-estimated'),
            proteinGrams: meal.proteinGrams ?? e.proteinGrams ?? null,
            fatGrams: meal.fatGrams ?? e.fatGrams ?? null,
            fiberGrams: meal.fiberGrams ?? e.fiberGrams ?? null,
            carbBreakdown: meal.carbBreakdown ?? e.carbBreakdown ?? null,
            macroSource: meal.macroSource ?? (e.macroSource === 'llm-estimated' ? 'llm-estimated' : meal.macroSource),
            mealCommentary: e.mealCommentary,
        } satisfies MealEvent;
    });
}

// ─── Route handler ─────────────────────────────────────────

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const csvFile = formData.get("csv") as File | null;
        const mode = (formData.get("mode") as InputMode) ?? "csv-food";
        const documentFile = formData.get("document") as File | null;
        const documentTextInput = (formData.get("documentText") as string | null)?.trim() ?? "";

        if (!csvFile) {
            return NextResponse.json({ error: "CSV file is required" }, { status: 400 });
        }
        if (csvFile.size > 10 * 1024 * 1024) {
            return NextResponse.json({ error: "CSV file is too large (max 10 MB)" }, { status: 400 });
        }
        if (mode === "document-food" && !documentFile && !documentTextInput) {
            return NextResponse.json(
                { error: "In document mode, upload a notes file or paste plain text notes." },
                { status: 400 },
            );
        }
        if (documentFile && documentFile.size > 2 * 1024 * 1024) {
            return NextResponse.json({ error: "Document file is too large (max 2 MB)" }, { status: 400 });
        }

        // ── Stage 1: Parse CSV ────────────────────────────────
        const csvText = await csvFile.text();
        const parsed = parseLibreCsv(csvText);

        if (parsed.readings.length === 0) {
            return NextResponse.json(
                { error: "No glucose readings found in the CSV. Please check the file format." },
                { status: 400 },
            );
        }

        const llmProvider = createLLMProvider(process.env.OPENAI_API_KEY);
        const dateHint = parsed.readings[0]?.timestamp?.slice(0, 10)
            ?? new Date().toISOString().slice(0, 10);

        // ── Stage 2: Extract events ───────────────────────────
        let meals: MealEvent[] = [];
        let workouts: WorkoutEvent[] = [];
        let sleepEvents: SleepEvent[] = [];

        if (mode === "csv-food") {
            meals = parsed.meals;
        } else {
            let extractionText = documentTextInput;
            if (documentFile) {
                const docBuffer = Buffer.from(await documentFile.arrayBuffer());
                const extraction = await extractDocumentText(docBuffer, documentFile.name);
                extractionText = extraction.text;
            }

            try {
                const llmEvents = await llmProvider.extractStructuredEvents(extractionText, dateHint);
                meals = llmEvents.meals;
                workouts = llmEvents.workouts;
                sleepEvents = llmEvents.sleepEvents;
                if (meals.length === 0 && workouts.length === 0 && sleepEvents.length === 0) {
                    const basic = extractEventsFromTextBasic(extractionText);
                    meals = basic.meals as MealEvent[];
                    workouts = basic.workouts as WorkoutEvent[];
                }
            } catch {
                const basic = extractEventsFromTextBasic(extractionText);
                meals = basic.meals as MealEvent[];
                workouts = basic.workouts as WorkoutEvent[];
            }
        }

        // ── Stage 3: Deterministic analytics (no LLM) ────────
        const mealAnalyses = analyzeAllMeals(parsed.readings, meals, workouts);
        const insights = generateCrossMealInsights(meals, mealAnalyses, workouts);

        // ── Stage 4: Single LLM analysis call ────────────────
        // Passes glucose windows + analytics → returns macros, commentary, patterns, recommendations
        const analysisInput = buildFullAnalysisInput(
            meals, workouts, sleepEvents, parsed.readings, mealAnalyses,
        );

        let llmInsights;
        try {
            llmInsights = await llmProvider.generateFullAnalysis(analysisInput);
        } catch (err) {
            console.error("LLM full analysis error:", err);
            llmInsights = {
                mealEnrichments: [],
                overallPatterns: [],
                sleepGlucoseInsight: null,
                keyRecommendations: [],
                summaryText: `Analysis complete: ${parsed.readings.length} glucose readings, average ${analysisInput.overallStats.avgGlucose} mg/dL, ${analysisInput.overallStats.timeInRange}% time in range.`,
            };
        }

        // ── Stage 5: Merge enrichments into meals ─────────────
        const enrichedMeals = applyEnrichments(meals, llmInsights);

        const runId = crypto.randomUUID();
        const result: AnalysisOutput = {
            run: { id: runId, mode, createdAt: new Date().toISOString(), status: "complete" },
            glucoseReadings: parsed.readings,
            mealEvents: enrichedMeals,
            workoutEvents: workouts,
            sleepEvents,
            mealAnalyses,
            summary: {
                text: llmInsights.summaryText,
                generatedAt: new Date().toISOString(),
            },
            llmInsights,
            crossMealInsights: insights,
        };

        return NextResponse.json({ ...result, id: runId });
    } catch (error) {
        console.error("Analysis error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "An unexpected error occurred" },
            { status: 500 },
        );
    }
}
