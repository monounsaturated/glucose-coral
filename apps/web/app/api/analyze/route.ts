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
} from "@glucose/types";

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const csvFile = formData.get("csv") as File | null;
        const mode = (formData.get("mode") as InputMode) ?? "csv-food";
        const documentFile = formData.get("document") as File | null;

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
        if (mode === "document-food" && !documentFile) {
            return NextResponse.json(
                { error: "Meal/workout document is required in document mode" },
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

        if (mode === "csv-food") {
            // Use meals from CSV
            meals = parsed.meals;
        } else if (mode === "document-food" && documentFile) {
            // Extract events from document
            const docBuffer = Buffer.from(await documentFile.arrayBuffer());
            const extraction = await extractDocumentText(docBuffer, documentFile.name);

            // Try LLM extraction first, fall back to regex
            const llmProvider = createLLMProvider(process.env.OPENAI_API_KEY);
            try {
                const llmEvents = await llmProvider.extractStructuredEvents(
                    extraction.text
                );
                meals = llmEvents.meals;
                workouts = llmEvents.workouts;
            } catch {
                // Fall back to basic extraction
                const basicEvents = extractEventsFromTextBasic(extraction.text);
                meals = basicEvents.meals as MealEvent[];
                workouts = basicEvents.workouts as WorkoutEvent[];
            }
        }

        // Run analytics
        const mealAnalyses = analyzeAllMeals(parsed.readings, meals, workouts);
        const insights = generateCrossMealInsights(meals, mealAnalyses, workouts);

        // Generate summary
        const llmProvider = createLLMProvider(process.env.OPENAI_API_KEY);
        let summaryText: string;
        try {
            summaryText = await llmProvider.summarizeAnalysis(
                parsed.readings,
                meals,
                workouts,
                mealAnalyses
            );
        } catch {
            // Fallback summary
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
            mealAnalyses,
            summary: {
                text: summaryText,
                generatedAt: new Date().toISOString(),
            },
            crossMealInsights: insights,
        };

        // Return with the id for the results page
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
