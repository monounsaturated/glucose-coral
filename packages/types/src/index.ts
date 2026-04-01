import { z } from 'zod';

// ─── Timestamps ────────────────────────────────────────────
export const TIMESTAMP_FORMAT = 'DD-MM-YYYY HH:mm';

/** Internal normalized timestamp (ISO 8601 string) */
export type NormalizedTimestamp = string;

// ─── Glucose Readings ──────────────────────────────────────
export const GlucoseSourceSchema = z.enum(['historic', 'scan', 'strip']);
export type GlucoseSource = z.infer<typeof GlucoseSourceSchema>;

export const GlucoseReadingSchema = z.object({
    timestamp: z.string(),
    rawTimestamp: z.string(),
    value: z.number(),
    source: GlucoseSourceSchema,
});
export type GlucoseReading = z.infer<typeof GlucoseReadingSchema>;

// ─── Carbs ─────────────────────────────────────────────────
export const CarbsSourceSchema = z.enum(['csv-provided', 'llm-estimated', 'unknown']);
export type CarbsSource = z.infer<typeof CarbsSourceSchema>;

// ─── Macros ────────────────────────────────────────────────
export const MacroSourceSchema = z.enum(['llm-estimated', 'provided', 'unknown']);
export type MacroSource = z.infer<typeof MacroSourceSchema>;

export const MealLabelSchema = z.enum(['Breakfast', 'Lunch', 'Dinner', 'Snack']);
export type MealLabel = z.infer<typeof MealLabelSchema>;

export const CarbBreakdownSchema = z.object({
    starchGrams: z.number().nullable(),
    sugarGrams: z.number().nullable(),
    fructoseGrams: z.number().nullable(),
    glucoseGrams: z.number().nullable(),
});
export type CarbBreakdown = z.infer<typeof CarbBreakdownSchema>;

// ─── Meal Events ───────────────────────────────────────────
export const MealEventSchema = z.object({
    id: z.string(),
    timestamp: z.string(),
    rawTimestamp: z.string(),
    name: z.string().optional(),
    mealLabel: MealLabelSchema.nullable().optional(),
    ingredients: z.array(z.string()).optional(),
    carbsGrams: z.number().nullable(),
    carbsSource: CarbsSourceSchema,
    proteinGrams: z.number().nullable().optional(),
    fatGrams: z.number().nullable().optional(),
    fiberGrams: z.number().nullable().optional(),
    carbBreakdown: CarbBreakdownSchema.nullable().optional(),
    macroSource: MacroSourceSchema.optional(),
    mealCommentary: z.string().optional(),
    notes: z.string().optional(),
    source: z.enum(['csv', 'document']),
});
export type MealEvent = z.infer<typeof MealEventSchema>;

// ─── Workout Events ────────────────────────────────────────
export const WorkoutTypeSchema = z.enum(['walk', 'jogging', 'resistance']);
export type WorkoutType = z.infer<typeof WorkoutTypeSchema>;

export const WorkoutEventSchema = z.object({
    id: z.string(),
    timestamp: z.string(),
    rawTimestamp: z.string(),
    type: WorkoutTypeSchema,
    durationMinutes: z.number().nullable(),
    notes: z.string().optional(),
    source: z.enum(['csv', 'document']),
});
export type WorkoutEvent = z.infer<typeof WorkoutEventSchema>;

// ─── Sleep Events ──────────────────────────────────────────
export const SleepEventSchema = z.object({
    id: z.string(),
    sleepStart: z.string(),
    sleepEnd: z.string(),
    durationMinutes: z.number().nullable(),
    notes: z.string().optional(),
    source: z.literal('document'),
});
export type SleepEvent = z.infer<typeof SleepEventSchema>;

// ─── LLM Full-Analysis Output ──────────────────────────────
export const MealEnrichmentSchema = z.object({
    mealId: z.string(),
    carbsGrams: z.number().nullable().optional(),
    proteinGrams: z.number().nullable().optional(),
    fatGrams: z.number().nullable().optional(),
    fiberGrams: z.number().nullable().optional(),
    carbBreakdown: CarbBreakdownSchema.nullable().optional(),
    macroSource: z.literal('llm-estimated').optional(),
    carbsSource: z.enum(['llm-estimated', 'csv-provided', 'unknown']).optional(),
    mealCommentary: z.string().optional(),
    keyIngredientInsight: z.string().optional(),
});
export type MealEnrichment = z.infer<typeof MealEnrichmentSchema>;

export const LLMInsightOutputSchema = z.object({
    mealEnrichments: z.array(MealEnrichmentSchema),
    overallPatterns: z.array(z.string()),
    sleepGlucoseInsight: z.string().nullable(),
    keyRecommendations: z.array(z.string()),
    summaryText: z.string(),
});
export type LLMInsightOutput = z.infer<typeof LLMInsightOutputSchema>;

// ─── Input type for the single analysis call ───────────────
export interface MealForAnalysis {
    id: string;
    name?: string;
    mealLabel?: MealLabel | null;
    timestamp: string;
    ingredients?: string[];
    notes?: string;
    carbsGrams: number | null;
    glucoseCurve: Array<{ minutesOffset: number; value: number }>;
    analytics: {
        baseline: number | null;
        peak: number | null;
        peakDelta: number | null;
        peakTimingMinutes: number | null;
        isSpike: boolean | null;
        impactLabel: string | null;
    };
    nearbyWorkouts: Array<{
        type: string;
        durationMinutes: number | null;
        minutesAfterMeal: number;
    }>;
}

export interface FullAnalysisInput {
    meals: MealForAnalysis[];
    workouts: Array<{ type: string; durationMinutes: number | null; timestamp: string }>;
    sleepEvents: Array<{ sleepStart: string; sleepEnd: string; durationMinutes: number | null }>;
    overallStats: {
        avgGlucose: number;
        timeInRange: number;
        totalReadings: number;
        dateRange: string;
    };
}

// ─── Meal Analysis Flags ───────────────────────────────────
export const MealFlagSchema = z.enum([
    'insufficient-baseline-data',
    'overlapping-meal-window',
    'workout-in-window',
]);
export type MealFlag = z.infer<typeof MealFlagSchema>;

// ─── Impact Labels ─────────────────────────────────────────
export const ImpactLabelSchema = z.enum(['low', 'moderate', 'high']);
export type ImpactLabel = z.infer<typeof ImpactLabelSchema>;

// ─── Meal Analysis Result ──────────────────────────────────
export const MealAnalysisResultSchema = z.object({
    mealId: z.string(),
    baseline: z.number().nullable(),
    peak: z.number().nullable(),
    peakDelta: z.number().nullable(),
    peakTimingMinutes: z.number().nullable(),
    durationAboveBaseline20: z.number().nullable(),
    isSpike: z.boolean().nullable(),
    impactLabel: ImpactLabelSchema.nullable(),
    flags: z.array(MealFlagSchema),
});
export type MealAnalysisResult = z.infer<typeof MealAnalysisResultSchema>;

// ─── Analysis Run ──────────────────────────────────────────
export const InputModeSchema = z.enum(['csv-food', 'document-food']);
export type InputMode = z.infer<typeof InputModeSchema>;

export const AnalysisRunSchema = z.object({
    id: z.string(),
    mode: InputModeSchema,
    createdAt: z.string(),
    status: z.enum(['pending', 'processing', 'complete', 'error']),
});
export type AnalysisRun = z.infer<typeof AnalysisRunSchema>;

// ─── Generated Summary (legacy) ───────────────────────────
export const GeneratedSummarySchema = z.object({
    text: z.string(),
    generatedAt: z.string(),
});
export type GeneratedSummary = z.infer<typeof GeneratedSummarySchema>;

// ─── Full Analysis Output ──────────────────────────────────
export const AnalysisOutputSchema = z.object({
    run: AnalysisRunSchema,
    glucoseReadings: z.array(GlucoseReadingSchema),
    mealEvents: z.array(MealEventSchema),
    workoutEvents: z.array(WorkoutEventSchema),
    sleepEvents: z.array(SleepEventSchema).optional(),
    mealAnalyses: z.array(MealAnalysisResultSchema),
    summary: GeneratedSummarySchema.nullable(),
    llmInsights: LLMInsightOutputSchema.optional(),
    crossMealInsights: z.object({
        highestImpactMeals: z.array(z.string()),
        foodsAssociatedWithSpikes: z.array(z.string()),
        foodsWithMildResponses: z.array(z.string()),
        walkBenefitExamples: z.array(z.string()),
    }).optional(),
});
export type AnalysisOutput = z.infer<typeof AnalysisOutputSchema>;

// ─── File Validation ───────────────────────────────────────
export const MAX_CSV_SIZE_BYTES = 10 * 1024 * 1024;
export const MAX_DOCUMENT_SIZE_BYTES = 2 * 1024 * 1024;
export const ALLOWED_DOCUMENT_EXTENSIONS = ['.txt', '.md', '.pdf'] as const;

// ─── Spike Constants ───────────────────────────────────────
export const SPIKE_THRESHOLD_MG_DL = 30;
export const BASELINE_WINDOW_MINUTES = 30;
export const POST_MEAL_WINDOW_MINUTES = 120;
export const OVERLAPPING_MEAL_WINDOW_MINUTES = 90;
export const ABOVE_BASELINE_OFFSET_MG_DL = 20;

// ─── Impact Tier Thresholds ────────────────────────────────
export const IMPACT_LOW_MAX = 20;
export const IMPACT_MODERATE_MAX = 40;

// ─── Raw CSV Row ───────────────────────────────────────────
export const RawCsvRowSchema = z.record(z.string(), z.string().optional());
export type RawCsvRow = z.infer<typeof RawCsvRowSchema>;

// ─── Document Extraction Result ────────────────────────────
export const DocumentExtractionSchema = z.object({
    text: z.string(),
    fileName: z.string(),
    fileType: z.enum(['txt', 'md', 'pdf']),
    pageCount: z.number().optional(),
});
export type DocumentExtraction = z.infer<typeof DocumentExtractionSchema>;

// ─── LLM Provider Interface ────────────────────────────────
export interface LLMProvider {
    extractStructuredEvents(text: string, dateHint?: string): Promise<{
        meals: MealEvent[];
        workouts: WorkoutEvent[];
        sleepEvents: SleepEvent[];
    }>;
    estimateMealCarbs(mealDescription: string): Promise<number | null>;
    generateFullAnalysis(input: FullAnalysisInput): Promise<LLMInsightOutput>;
    summarizeAnalysis(
        readings: GlucoseReading[],
        meals: MealEvent[],
        workouts: WorkoutEvent[],
        analyses: MealAnalysisResult[],
        sleepEvents?: SleepEvent[],
    ): Promise<string>;
}
