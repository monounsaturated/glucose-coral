"use client";

import { useState, useMemo } from "react";
import { GlucoseChart } from "./glucose-chart";
import { EventDetailPanel } from "./event-detail-panel";
import { getDemoAnalysis } from "../../lib/demo-data";
import type { AnalysisOutput } from "@glucose/types";

export function DemoPreview() {
    const data: AnalysisOutput = useMemo(() => getDemoAnalysis(), []);
    const [selectedMealId, setSelectedMealId] = useState<string | null>(null);

    const selectedMeal = data.mealEvents.find((m) => m.id === selectedMealId);
    const selectedAnalysis = data.mealAnalyses.find(
        (a) => a.mealId === selectedMealId
    );

    return (
        <div className="card glow-accent p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-xs text-[var(--color-text-muted)] mb-1">DEMO DATA</p>
                    <p className="text-sm text-[var(--color-text-secondary)]">
                        3 days · {data.glucoseReadings.length} readings · {data.mealEvents.length} meals · {data.workoutEvents.length} workouts
                    </p>
                </div>
                <span className="badge bg-[var(--color-accent-subtle)] text-[var(--color-accent-hover)] text-xs">
                    Sample Data
                </span>
            </div>

            <GlucoseChart
                readings={data.glucoseReadings}
                meals={data.mealEvents}
                workouts={data.workoutEvents}
                analyses={data.mealAnalyses}
                onMealSelect={setSelectedMealId}
                selectedMealId={selectedMealId}
            />

            {selectedMeal && (
                <EventDetailPanel
                    meal={selectedMeal}
                    analysis={selectedAnalysis}
                    onClose={() => setSelectedMealId(null)}
                />
            )}
        </div>
    );
}
