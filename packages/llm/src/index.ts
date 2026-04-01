import type {
    LLMProvider,
    GlucoseReading,
    MealEvent,
    WorkoutEvent,
    MealAnalysisResult,
    SleepEvent,
    FullAnalysisInput,
    LLMInsightOutput,
} from '@glucose/types';
import { MEAL_PARSING_PROMPT, FULL_ANALYSIS_PROMPT } from './prompts';

// ─── OpenAI Implementation ────────────────────────────────

export class OpenAIProvider implements LLMProvider {
    private apiKey: string;
    private model: string;

    constructor(apiKey: string, model = 'gpt-4o-mini') {
        this.apiKey = apiKey;
        this.model = model;
    }

    private async chat(
        systemPrompt: string,
        userMessage: string,
        opts?: { model?: string; maxTokens?: number },
    ): Promise<string> {
        const { default: OpenAI } = await import('openai');
        const client = new OpenAI({ apiKey: this.apiKey });

        const response = await client.chat.completions.create({
            model: opts?.model ?? this.model,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userMessage },
            ],
            temperature: 0.2,
            max_tokens: opts?.maxTokens ?? 4000,
        });

        return response.choices[0]?.message?.content ?? '';
    }

    private parseJson<T>(raw: string): T | null {
        try {
            const cleaned = raw
                .replace(/^```(?:json)?\s*/i, '')
                .replace(/\s*```$/i, '')
                .trim();
            return JSON.parse(cleaned) as T;
        } catch {
            return null;
        }
    }

    async extractStructuredEvents(text: string, dateHint?: string): Promise<{
        meals: MealEvent[];
        workouts: WorkoutEvent[];
        sleepEvents: SleepEvent[];
    }> {
        const userMessage = dateHint
            ? `Date hint (use if no date in notes): ${dateHint}\n\n${text}`
            : text;

        const response = await this.chat(MEAL_PARSING_PROMPT, userMessage);
        const parsed = this.parseJson<{
            meals?: MealEvent[];
            workouts?: WorkoutEvent[];
            sleepEvents?: SleepEvent[];
        }>(response);

        if (!parsed) {
            console.error('Failed to parse LLM response for event extraction:', response.slice(0, 200));
            return { meals: [], workouts: [], sleepEvents: [] };
        }

        return {
            meals: parsed.meals ?? [],
            workouts: parsed.workouts ?? [],
            sleepEvents: parsed.sleepEvents ?? [],
        };
    }

    async estimateMealCarbs(mealDescription: string): Promise<number | null> {
        const systemPrompt = `You are a nutrition estimation assistant. Estimate the total carbohydrates in grams for the described meal.
Return ONLY a JSON object: { "carbsGrams": <number or null>, "confidence": "low|medium|high" }
If you cannot estimate, return { "carbsGrams": null, "confidence": "low" }.
Be conservative. This is a rough estimate only.`;

        const response = await this.chat(systemPrompt, mealDescription);
        const parsed = this.parseJson<{ carbsGrams?: number | null }>(response);
        return parsed?.carbsGrams ?? null;
    }

    async generateFullAnalysis(input: FullAnalysisInput): Promise<LLMInsightOutput> {
        const userMessage = JSON.stringify(input, null, 2);

        const response = await this.chat(FULL_ANALYSIS_PROMPT, userMessage, {
            model: 'gpt-4o',
            maxTokens: 6000,
        });

        const parsed = this.parseJson<LLMInsightOutput>(response);
        if (!parsed) {
            console.error('Failed to parse LLM full analysis response:', response.slice(0, 400));
            return {
                mealEnrichments: [],
                overallPatterns: [],
                sleepGlucoseInsight: null,
                keyRecommendations: [],
                summaryText: 'Analysis complete. Enable an OpenAI API key for detailed insights.',
            };
        }

        return parsed;
    }

    async summarizeAnalysis(
        readings: GlucoseReading[],
        meals: MealEvent[],
        workouts: WorkoutEvent[],
        analyses: MealAnalysisResult[],
        sleepEvents?: SleepEvent[],
    ): Promise<string> {
        const systemPrompt = `You are a glucose data analysis assistant. Summarize the analysis results in a clear, friendly, and insightful way.
IMPORTANT: Use careful language ("appears associated with", "seems correlated with"). NEVER say "caused" or "proved".
Keep to 3-5 short paragraphs. Be encouraging and mention specific foods and patterns.`;

        const summaryData = {
            totalReadings: readings.length,
            totalMeals: meals.length,
            totalWorkouts: workouts.length,
            totalSleepEvents: sleepEvents?.length ?? 0,
            mealAnalyses: analyses.map((a) => {
                const meal = meals.find((m) => m.id === a.mealId);
                return {
                    mealName: meal?.name,
                    mealLabel: meal?.mealLabel,
                    ingredients: meal?.ingredients,
                    carbsGrams: meal?.carbsGrams,
                    proteinGrams: meal?.proteinGrams,
                    fatGrams: meal?.fatGrams,
                    ...a,
                };
            }),
            avgGlucose: readings.length > 0
                ? Math.round(readings.reduce((s, r) => s + r.value, 0) / readings.length)
                : 0,
            timeInRange: readings.length > 0
                ? Math.round(
                    (readings.filter((r) => r.value >= 70 && r.value <= 180).length /
                        readings.length) * 100,
                )
                : 0,
        };

        return this.chat(systemPrompt, JSON.stringify(summaryData, null, 2));
    }
}

// ─── Stub Provider (for demo / no API key) ─────────────────

export class StubLLMProvider implements LLMProvider {
    async extractStructuredEvents(_text: string, _dateHint?: string): Promise<{
        meals: MealEvent[];
        workouts: WorkoutEvent[];
        sleepEvents: SleepEvent[];
    }> {
        return { meals: [], workouts: [], sleepEvents: [] };
    }

    async estimateMealCarbs(_desc: string): Promise<number | null> {
        return null;
    }

    async generateFullAnalysis(_input: FullAnalysisInput): Promise<LLMInsightOutput> {
        return {
            mealEnrichments: [],
            overallPatterns: [],
            sleepGlucoseInsight: null,
            keyRecommendations: [],
            summaryText: 'Add an OpenAI API key (OPENAI_API_KEY) to unlock AI-powered analysis with per-meal commentary, macro estimates, and personalized recommendations.',
        };
    }

    async summarizeAnalysis(
        readings: GlucoseReading[],
        meals: MealEvent[],
        _workouts: WorkoutEvent[],
        analyses: MealAnalysisResult[],
        _sleepEvents?: SleepEvent[],
    ): Promise<string> {
        const avgGlucose = readings.length > 0
            ? Math.round(readings.reduce((s, r) => s + r.value, 0) / readings.length)
            : 0;
        const spikes = analyses.filter((a) => a.isSpike);
        const highImpact = analyses.filter((a) => a.impactLabel === 'high');

        const spikeNames = spikes
            .map((a) => meals.find((m) => m.id === a.mealId)?.name)
            .filter(Boolean)
            .join(', ');

        return [
            `Over this period, your average glucose was ${avgGlucose} mg/dL across ${readings.length} readings.`,
            spikes.length > 0
                ? `${spikes.length} of ${analyses.length} meals appear associated with glucose spikes (≥30 mg/dL rise). Foods associated with spikes include: ${spikeNames || 'various meals'}.`
                : `None of the ${analyses.length} tracked meals appear associated with significant glucose spikes — great glucose management!`,
            highImpact.length > 0
                ? `${highImpact.length} meal(s) showed high impact (≥40 mg/dL rise), which may be worth noting for future food choices.`
                : '',
            `Note: These observations show correlations, not causation. Many factors affect glucose responses including portion size, timing, stress, and sleep.`,
        ]
            .filter(Boolean)
            .join('\n\n');
    }
}

// ─── Factory ───────────────────────────────────────────────

export function createLLMProvider(apiKey?: string): LLMProvider {
    if (apiKey) {
        return new OpenAIProvider(apiKey);
    }
    return new StubLLMProvider();
}
