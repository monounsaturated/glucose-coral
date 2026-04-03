"use client";

import { useState, useMemo } from "react";
import { Activity, Utensils, Footprints, Sparkles } from "lucide-react";
import { GlucoseChart } from "./glucose-chart";
import { EventDetailPanel } from "./event-detail-panel";
import { getDemoAnalysis } from "../../lib/demo-data";
import type { AnalysisOutput } from "@glucose/types";

interface DemoPreviewProps {
    /** Tighter layout for dense embeds (smaller chart, hides badge rows). */
    compact?: boolean;
}

export function DemoPreview({ compact = false }: DemoPreviewProps) {
    const data: AnalysisOutput = useMemo(() => getDemoAnalysis(), []);
    const [selectedMealId, setSelectedMealId] = useState<string | null>(null);

    const selectedMeal = data.mealEvents.find((m) => m.id === selectedMealId);
    const selectedAnalysis = data.mealAnalyses.find(
        (a) => a.mealId === selectedMealId
    );

    const stats = useMemo(() => {
        const n = data.glucoseReadings.length;
        const avg =
            n > 0
                ? Math.round(
                      data.glucoseReadings.reduce((s, r) => s + r.value, 0) / n
                  )
                : 0;
        const tir = Math.round(
            (data.glucoseReadings.filter((r) => r.value >= 70 && r.value <= 180)
                .length /
                Math.max(n, 1)) *
                100
        );
        return { avg, tir };
    }, [data.glucoseReadings]);

    const mealPreview = useMemo(
        () => data.mealEvents.slice(0, 10),
        [data.mealEvents]
    );

    return (
        <div
            className={`relative overflow-hidden rounded-2xl border border-[var(--color-accent)]/25 ${
                compact ? "" : "shadow-[0_0_60px_-12px_var(--color-accent)]"
            }`}
        >
            {!compact && (
                <div
                    className="pointer-events-none absolute inset-0 opacity-[0.12]"
                    style={{
                        background:
                            "radial-gradient(ellipse 80% 60% at 20% 0%, var(--color-accent) 0%, transparent 55%), radial-gradient(ellipse 60% 50% at 100% 100%, var(--color-meal) 0%, transparent 50%)",
                    }}
                />
            )}
            <div
                className={`relative bg-[var(--color-surface)]/95 backdrop-blur-sm ${
                    compact ? "p-4 space-y-3" : "p-6 md:p-8 space-y-6"
                }`}
            >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="w-4 h-4 text-[var(--color-accent)]" />
                            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-accent-hover)]">
                                Demo data
                            </p>
                        </div>
                        <h3
                            className="text-xl md:text-2xl font-bold mb-1"
                            style={{ fontFamily: "var(--font-display)" }}
                        >
                            A full week on the chart
                        </h3>
                        <p className="text-sm text-[var(--color-text-secondary)] max-w-xl">
                            7 days of sample CGM readings with logged meals and
                            workouts — tap meals on the chart or in the timeline
                            below.
                        </p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 self-start rounded-full border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)]">
                        <Activity className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                        7 days · interactive
                    </span>
                </div>

                <div className="flex flex-wrap gap-2 md:gap-3">
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-glucose)]/10 px-3 py-1.5 text-xs font-medium text-[var(--color-text-primary)]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-glucose)]" />
                        {data.glucoseReadings.length} readings
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-meal-bg)] px-3 py-1.5 text-xs font-medium text-[var(--color-meal)]">
                        <Utensils className="w-3.5 h-3.5" />
                        {data.mealEvents.length} meals
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-workout-bg)] px-3 py-1.5 text-xs font-medium text-[var(--color-workout)]">
                        <Footprints className="w-3.5 h-3.5" />
                        {data.workoutEvents.length} workouts
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-accent-subtle)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-primary)]">
                        Avg {stats.avg} mg/dL
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs text-[var(--color-text-secondary)]">
                        {stats.tir}% in range
                    </span>
                </div>

                {!compact && mealPreview.length > 0 && (
                    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)]/50 p-3">
                        <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] mb-2">
                            Logged meals (sample)
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                            {mealPreview.map((m) => (
                                <button
                                    key={m.id}
                                    type="button"
                                    onClick={() => setSelectedMealId(m.id)}
                                    className={`max-w-full truncate rounded-md border px-2 py-1 text-left text-[11px] transition-colors hover:border-[var(--color-accent)]/50 ${
                                        selectedMealId === m.id
                                            ? "border-[var(--color-accent)] bg-[var(--color-accent-subtle)] text-[var(--color-text-primary)]"
                                            : "border-transparent bg-[var(--color-surface)] text-[var(--color-text-secondary)]"
                                    }`}
                                >
                                    {m.name}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <GlucoseChart
                    readings={data.glucoseReadings}
                    meals={data.mealEvents}
                    workouts={data.workoutEvents}
                    analyses={data.mealAnalyses}
                    onMealSelect={setSelectedMealId}
                    selectedMealId={selectedMealId}
                    chartHeight={compact ? 200 : 400}
                    compact={compact}
                    defaultTimeRange="7d"
                />

                {selectedMeal && (
                    <EventDetailPanel
                        meal={selectedMeal}
                        analysis={selectedAnalysis}
                        onClose={() => setSelectedMealId(null)}
                    />
                )}
            </div>
        </div>
    );
}
