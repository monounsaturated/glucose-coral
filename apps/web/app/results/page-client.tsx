"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { GlucoseChart } from "../components/glucose-chart";
import { EventDetailPanel } from "../components/event-detail-panel";
import { SummaryBlock } from "../components/summary-block";
import { Brand } from "../components/brand";
import { ArrowLeft, Upload, Loader2 } from "lucide-react";
import type { AnalysisOutput } from "@glucose/types";

export default function ResultsPage() {
    const searchParams = useSearchParams();
    const id = searchParams.get("id");
    const [data, setData] = useState<AnalysisOutput | null>(null);
    const [selectedMealId, setSelectedMealId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) {
            setLoading(false);
            return;
        }

        const cached = sessionStorage.getItem(`analysis-${id}`);
        if (cached) {
            try {
                setData(JSON.parse(cached));
            } catch {
                // ignore
            }
        }
        setLoading(false);
    }, [id]);

    const selectedMeal = data?.mealEvents.find((m) => m.id === selectedMealId);
    const selectedAnalysis = data?.mealAnalyses.find(
        (a) => a.mealId === selectedMealId
    );

    const stats = useMemo(() => {
        if (!data) return null;
        const readings = data.glucoseReadings;
        return {
            avgGlucose: Math.round(
                readings.reduce((s, r) => s + r.value, 0) / readings.length
            ),
            timeInRange: Math.round(
                (readings.filter((r) => r.value >= 70 && r.value <= 180).length /
                    readings.length) *
                100
            ),
            totalMeals: data.mealEvents.length,
            spikeCount: data.mealAnalyses.filter((a) => a.isSpike).length,
        };
    }, [data]);

    if (loading) {
        return (
            <main className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--color-accent)]" />
            </main>
        );
    }

    if (!data) {
        return (
            <main className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-[var(--color-text-secondary)] mb-4">
                        No analysis data found
                    </p>
                    <Link href="/upload" className="btn-primary">
                        <Upload className="w-4 h-4" />
                        Upload Data
                    </Link>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen">
            <nav className="fixed top-0 w-full z-50 glass">
                <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <Brand />
                    </Link>
                    <Link href="/upload" className="btn-primary text-xs py-2 px-4">
                        <Upload className="w-3 h-3" />
                        New Analysis
                    </Link>
                </div>
            </nav>

            <div className="pt-24 pb-20 px-6 max-w-5xl mx-auto space-y-8">
                <div>
                    <Link
                        href="/upload"
                        className="flex items-center gap-1 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] mb-4 transition-colors"
                    >
                        <ArrowLeft className="w-3 h-3" />
                        Back to upload
                    </Link>
                    <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: "var(--font-display)" }}>Analysis Results</h1>
                    <p className="text-sm text-[var(--color-text-secondary)]">
                        Mode: {data.run.mode === "csv-food" ? "Meals from CSV" : "Meals from document"}
                    </p>
                </div>

                {stats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="card text-center">
                            <p className="text-xs text-[var(--color-text-muted)] mb-1">Avg Glucose</p>
                            <p className="text-2xl font-bold gradient-text">{stats.avgGlucose}</p>
                            <p className="text-xs text-[var(--color-text-muted)]">mg/dL</p>
                        </div>
                        <div className="card text-center">
                            <p className="text-xs text-[var(--color-text-muted)] mb-1">Time in Range</p>
                            <p className="text-2xl font-bold text-[var(--color-spike-low)]">{stats.timeInRange}%</p>
                            <p className="text-xs text-[var(--color-text-muted)]">70-180 mg/dL</p>
                        </div>
                        <div className="card text-center">
                            <p className="text-xs text-[var(--color-text-muted)] mb-1">Meals</p>
                            <p className="text-2xl font-bold text-[var(--color-meal)]">{stats.totalMeals}</p>
                            <p className="text-xs text-[var(--color-text-muted)]">tracked</p>
                        </div>
                        <div className="card text-center">
                            <p className="text-xs text-[var(--color-text-muted)] mb-1">Spikes</p>
                            <p className="text-2xl font-bold text-[var(--color-spike-high)]">{stats.spikeCount}</p>
                            <p className="text-xs text-[var(--color-text-muted)]">detected</p>
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
                />

                {selectedMeal && (
                    <EventDetailPanel
                        meal={selectedMeal}
                        analysis={selectedAnalysis}
                        onClose={() => setSelectedMealId(null)}
                    />
                )}

                <div>
                    <h2 className="text-lg font-semibold mb-4">Per-Meal Breakdown</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {data.mealEvents.map((meal) => {
                            const analysis = data.mealAnalyses.find(
                                (a) => a.mealId === meal.id
                            );
                            const impactClass =
                                analysis?.impactLabel === "high"
                                    ? "impact-high"
                                    : analysis?.impactLabel === "moderate"
                                        ? "impact-moderate"
                                        : "impact-low";

                            return (
                                <button
                                    key={meal.id}
                                    onClick={() => setSelectedMealId(meal.id)}
                                    className={`card text-left transition-all hover:border-[var(--color-border-hover)] ${selectedMealId === meal.id ? "ring-2 ring-[var(--color-accent)]" : ""
                                        }`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-sm font-medium truncate">{meal.name ?? "Meal"}</h3>
                                        {analysis?.impactLabel && (
                                            <span className={`badge ${impactClass} text-xs`}>
                                                {analysis.impactLabel}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-[var(--color-text-muted)] mb-2">
                                        {new Date(meal.timestamp).toLocaleString()}
                                    </p>
                                    <div className="flex flex-wrap gap-3 text-xs mb-2">
                                        {analysis?.peakDelta !== null && analysis?.peakDelta !== undefined && (
                                            <span className="text-[var(--color-text-secondary)]">
                                                Δ {analysis.peakDelta} mg/dL
                                            </span>
                                        )}
                                        {meal.mealLabel && (
                                            <span className="badge bg-[var(--color-accent-subtle)] text-[var(--color-accent-hover)]"
                                                style={{ fontSize: "0.6rem", padding: "0.1rem 0.4rem" }}>
                                                {meal.mealLabel}
                                            </span>
                                        )}
                                        {meal.carbsGrams !== null && meal.carbsGrams !== undefined && (
                                            <span className="flex items-center gap-1 text-[var(--color-text-secondary)]">
                                                {meal.carbsGrams}g carbs
                                                {meal.carbsSource === "llm-estimated" && (
                                                    <span className="text-[var(--color-accent-hover)] opacity-70">·AI</span>
                                                )}
                                            </span>
                                        )}
                                    </div>
                                    {meal.mealCommentary && (
                                        <p className="text-xs text-[var(--color-text-muted)] leading-relaxed line-clamp-2">
                                            {meal.mealCommentary}
                                        </p>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {data.summary && (
                    <SummaryBlock
                        summary={data.summary}
                        insights={data.crossMealInsights}
                        llmInsights={data.llmInsights}
                    />
                )}
            </div>
        </main>
    );
}
