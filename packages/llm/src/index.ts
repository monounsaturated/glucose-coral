import type {
    LLMProvider,
    GlucoseReading,
    MealEvent,
    WorkoutEvent,
    MealAnalysisResult,
} from '@glucose/types';

// ─── OpenAI Implementation ────────────────────────────────

export class OpenAIProvider implements LLMProvider {
    private apiKey: string;
    private model: string;

    constructor(apiKey: string, model = 'gpt-4o-mini') {
        this.apiKey = apiKey;
        this.model = model;
    }

    private async chat(systemPrompt: string, userMessage: string): Promise<string> {
        const { default: OpenAI } = await import('openai');
        const client = new OpenAI({ apiKey: this.apiKey });

        const response = await client.chat.completions.create({
            model: this.model,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userMessage },
            ],
            temperature: 0.3,
            max_tokens: 2000,
        });

        return response.choices[0]?.message?.content ?? '';
    }

    async extractStructuredEvents(text: string): Promise<{
        meals: MealEvent[];
        workouts: WorkoutEvent[];
    }> {
        const systemPrompt = `You are a structured data extraction assistant. Extract meal and workout events from the provided text.

    Return ONLY valid JSON in this exact format:
    {
      "meals": [
        {
          "id": "doc-meal-1",
          "timestamp": "YYYY-MM-DDTHH:mm:00",
          "rawTimestamp": "original timestamp from text",
          "name": "short meal description",
          "ingredients": ["ingredient1", "ingredient2"],
          "carbsGrams": null,
          "carbsSource": "unknown",
          "notes": "any additional notes",
          "source": "document"
        }
      ],
      "workouts": [
        {
          "id": "doc-workout-1",
          "timestamp": "YYYY-MM-DDTHH:mm:00",
          "rawTimestamp": "original timestamp from text",
          "type": "walk|jogging|resistance",
          "durationMinutes": 30,
          "notes": "description",
          "source": "document"
        }
      ]
    }

    Expect timestamps in DD-MM-YYYY HH:mm format. Convert them to ISO format.
    For workout type, use only: walk, jogging, resistance.
    If carbs are mentioned, include them. Otherwise set carbsGrams to null.`;

        const response = await this.chat(systemPrompt, text);

        try {
            // Extract JSON from response (handle markdown code blocks)
            const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, response];
            const parsed = JSON.parse(jsonMatch[1] ?? response);
            return {
                meals: parsed.meals ?? [],
                workouts: parsed.workouts ?? [],
            };
        } catch {
            console.error('Failed to parse LLM response for event extraction');
            return { meals: [], workouts: [] };
        }
    }

    async estimateMealCarbs(mealDescription: string): Promise<number | null> {
        const systemPrompt = `You are a nutrition estimation assistant. Estimate the total carbohydrates in grams for the described meal.
    Return ONLY a JSON object: { "carbsGrams": <number or null>, "confidence": "low|medium|high" }
    If you cannot estimate, return { "carbsGrams": null, "confidence": "low" }.
    Be conservative. This is a rough estimate only.`;

        const response = await this.chat(systemPrompt, mealDescription);

        try {
            const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, response];
            const parsed = JSON.parse(jsonMatch[1] ?? response);
            return parsed.carbsGrams ?? null;
        } catch {
            return null;
        }
    }

    async summarizeAnalysis(
        readings: GlucoseReading[],
        meals: MealEvent[],
        workouts: WorkoutEvent[],
        analyses: MealAnalysisResult[],
    ): Promise<string> {
        const systemPrompt = `You are a glucose data analysis assistant. Summarize the analysis results in a clear, friendly, and insightful way.

    IMPORTANT RULES:
    - This is NOT a medical device or diagnostic tool
    - Use careful language: "appears associated with", "seems correlated with", "may be linked to"
    - NEVER say: "caused", "proved", "definitively improves"
    - Keep the summary to 3-5 short paragraphs
    - Highlight interesting patterns
    - Mention specific foods and their apparent effects
    - Mention any workout benefits observed
    - Be encouraging and helpful`;

        const summaryData = {
            totalReadings: readings.length,
            totalMeals: meals.length,
            totalWorkouts: workouts.length,
            mealAnalyses: analyses.map((a) => {
                const meal = meals.find((m) => m.id === a.mealId);
                return {
                    mealName: meal?.name,
                    ingredients: meal?.ingredients,
                    ...a,
                };
            }),
            avgGlucose: Math.round(
                readings.reduce((s, r) => s + r.value, 0) / readings.length,
            ),
            timeInRange: Math.round(
                (readings.filter((r) => r.value >= 70 && r.value <= 180).length /
                    readings.length) *
                100,
            ),
        };

        return this.chat(systemPrompt, JSON.stringify(summaryData, null, 2));
    }
}

// ─── Stub Provider (for demo / no API key) ─────────────────

export class StubLLMProvider implements LLMProvider {
    async extractStructuredEvents(_text: string): Promise<{
        meals: MealEvent[];
        workouts: WorkoutEvent[];
    }> {
        return { meals: [], workouts: [] };
    }

    async estimateMealCarbs(_desc: string): Promise<number | null> {
        return null;
    }

    async summarizeAnalysis(
        readings: GlucoseReading[],
        meals: MealEvent[],
        _workouts: WorkoutEvent[],
        analyses: MealAnalysisResult[],
    ): Promise<string> {
        const avgGlucose = Math.round(
            readings.reduce((s, r) => s + r.value, 0) / readings.length,
        );
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
