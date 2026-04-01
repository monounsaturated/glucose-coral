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
    LLMProvider,
} from "@glucose/types";

function mealDescriptionForCarbEstimate(meal: MealEvent): string | null {
    const chunks = [meal.name, meal.ingredients?.join(", "), meal.notes]
        .map((part) => part?.trim())
        .filter((part): part is string => Boolean(part));
    if (chunks.length === 0) return null;
    return chunks.join(" | ");
}

async function enrichMealsWithCarbEstimates(
    meals: MealEvent[],
    llmProvider: LLMProvider
): Promise<MealEvent[]> {
    const enriched = await Promise.all(
        meals.map(async (meal) => {
            if (meal.carbsGrams !== null && meal.carbsGrams !== undefined) {
                return meal;
            }

            const description = mealDescriptionForCarbEstimate(meal);
            if (!description) {
                return meal;
            }

            try {
                const estimate = await llmProvider.estimateMealCarbs(description);
                if (estimate === null) {
                    return meal;
                }
                return {
                    ...meal,
                    carbsGrams: estimate,
                    carbsSource: "llm-estimated" as const,
                };
            } catch {
                return meal;
            }
        })
    );
    return enriched;
}

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const csvFile = formData.get("csv") as File | null;
        const mode = (formData.get("mode") as InputMode) ?? "csv-food";
        const documentFile = formData.get("document") as File | null;
        const documentTextInput = (formData.get("documentText") as string | null)?.trim() ?? "";

        // Validate CSV
        if (!csvFile) {
            return NextResponse.json(
                { error: "CSV file is required" },
                { status: 400 }
            );
        }

        if (csvFile.size > 10 * 1024 * 1024) {
            return NextResponse.json(
                { error: "CSV file is too large (max 10 MB)" },
                { status: 400 }
            );
        }

        // Validate document in document mode
        if (mode === "document-food" && !documentFile && !documentTextInput) {
            return NextResponse.json(
                { error: "In document mode, upload a notes file or paste plain text notes." },
                { status: 400 }
            );
        }

        if (documentFile && documentFile.size > 2 * 1024 * 1024) {
            return NextResponse.json(
                { error: "Document file is too large (max 2 MB)" },
                { status: 400 }
            );
        }

        // Parse CSV
        const csvText = await csvFile.text();
        const parsed = parseLibreCsv(csvText);

        if (parsed.readings.length === 0) {
            return NextResponse.json(
                { error: "No glucose readings found in the CSV. Please check the file format." },
                { status: 400 }
            );
        }

        let meals: MealEvent[] = [];
        let workouts: WorkoutEvent[] = [];
        let sleepEvents: SleepEvent[] = [];
        const llmProvider = createLLMProvider(process.env.OPENAI_API_KEY);

        // Date hint: use the date of the first glucose reading
        const dateHint = parsed.readings[0]?.timestamp?.slice(0, 10) ?? new Date().toISOString().slice(0, 10);

        if (mode === "csv-food") {
            meals = parsed.meals;
        } else if (mode === "document-food") {
            // Extract events from uploaded file or plain text notes
            let extractionText = documentTextInput;
            if (documentFile) {
                const docBuffer = Buffer.from(await documentFile.arrayBuffer());
                const extraction = await extractDocumentText(docBuffer, documentFile.name);
                extractionText = extraction.text;
            }

            // LLM extraction (with full macro/sleep parsing), fall back to regex
            try {
                const llmEvents = await llmProvider.extractStructuredEvents(extractionText, dateHint);
                meals = llmEvents.meals;
                workouts = llmEvents.workouts;
                sleepEvents = llmEvents.sleepEvents;
            } catch {
                const basicEvents = extractEventsFromTextBasic(extractionText);
                meals = basicEvents.meals as MealEvent[];
                workouts = basicEvents.workouts as WorkoutEvent[];
            }
        }

        // For CSV meals that don't already have macros, estimate carbs only
        meals = await enrichMealsWithCarbEstimates(meals, llmProvider);

        // Run analytics
        const mealAnalyses = analyzeAllMeals(parsed.readings, meals, workouts);
        const insights = generateCrossMealInsights(meals, mealAnalyses, workouts);

        // Generate summary
        let summaryText: string;
        try {
            summaryText = await llmProvider.summarizeAnalysis(
                parsed.readings,
                meals,
                workouts,
                mealAnalyses,
                sleepEvents
            );
        } catch {
            const avgGlucose = Math.round(
                parsed.readings.reduce((s, r) => s + r.value, 0) / parsed.readings.length
            );
            summaryText = `Analysis complete: ${parsed.readings.length} glucose readings with an average of ${avgGlucose} mg/dL. ${meals.length} meals and ${workouts.length} workouts tracked.`;
        }

        const runId = crypto.randomUUID();
        const result: AnalysisOutput = {
            run: {
                id: runId,
                mode,
                createdAt: new Date().toISOString(),
                status: "complete",
            },
            glucoseReadings: parsed.readings,
            mealEvents: meals,
            workoutEvents: workouts,
            sleepEvents,
            mealAnalyses,
            summary: {
                text: summaryText,
                generatedAt: new Date().toISOString(),
            },
            crossMealInsights: insights,
        };

        return NextResponse.json({ ...result, id: runId });
    } catch (error) {
        console.error("Analysis error:", error);
        return NextResponse.json(
            {
                error:
                    error instanceof Error ? error.message : "An unexpected error occurred",
            },
            { status: 500 }
        );
    }
}
