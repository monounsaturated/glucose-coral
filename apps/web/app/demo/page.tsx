"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { GlucoseChart } from "../components/glucose-chart";
import { EventDetailPanel } from "../components/event-detail-panel";
import { SummaryBlock } from "../components/summary-block";
import { Brand } from "../components/brand";
import { getDemoAnalysis } from "../../lib/demo-data";
import { ArrowLeft, Upload } from "lucide-react";
import type { AnalysisOutput } from "@glucose/types";

export default function DemoPage() {
    const data: AnalysisOutput = useMemo(() => getDemoAnalysis(), []);
    const [selectedMealId, setSelectedMealId] = useState<string | null>(null);

    const selectedMeal = data.mealEvents.find((m) => m.id === selectedMealId);
    const selectedAnalysis = data.mealAnalyses.find(
        (a) => a.mealId === selectedMealId
    );

    const avgGlucose = useMemo(
        () =>
            Math.round(
                data.glucoseReadings.reduce((s, r) => s + r.value, 0) /
                data.glucoseReadings.length
            ),
        [data.glucoseReadings]
    );

    const timeInRange = useMemo(
        () =>
            Math.round(
                (data.glucoseReadings.filter((r) => r.value >= 70 && r.value <= 180)
                    .length /
                    data.glucoseReadings.length) *
                100
            ),
        [data.glucoseReadings]
    );

    const spikeCount = data.mealAnalyses.filter((a) => a.isSpike).length;

    return (
        <main className="min-h-screen">
            {/* Nav */}
            <nav className="fixed top-0 w-full z-50 glass">
                <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <Brand />
                    </Link>
                    <Link href="/upload" className="btn-primary text-xs py-2 px-4">
                        <Upload className="w-3 h-3" />
                        Upload Your Data
                    </Link>
                </div>
            </nav>

            <div className="pt-24 pb-20 px-6 max-w-5xl mx-auto space-y-8">
                {/* Header */}
                <div>
                    <Link
                        href="/"
                        className="flex items-center gap-1 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] mb-4 transition-colors"
                    >
                        <ArrowLeft className="w-3 h-3" />
                        Back to home
                    </Link>
                    <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>Demo Analysis</h1>
                        <span className="badge bg-[var(--color-accent-subtle)] text-[var(--color-accent-hover)] text-xs">
                            Sample Data
                        </span>
                    </div>
                    <p className="text-sm text-[var(--color-text-secondary)]">
                        Explore 3 days of glucose data with 9 meals and 2 workouts
                    </p>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="card text-center">
                        <p className="text-xs text-[var(--color-text-muted)] mb-1">Avg Glucose</p>
                        <p className="text-2xl font-bold gradient-text">{avgGlucose}</p>
                        <p className="text-xs text-[var(--color-text-muted)]">mg/dL</p>
                    </div>
                    <div className="card text-center">
                        <p className="text-xs text-[var(--color-text-muted)] mb-1">Time in Range</p>
                        <p className="text-2xl font-bold text-[var(--color-spike-low)]">{timeInRange}%</p>
                        <p className="text-xs text-[var(--color-text-muted)]">70-180 mg/dL</p>
                    </div>
                    <div className="card text-center">
                        <p className="text-xs text-[var(--color-text-muted)] mb-1">Meals Tracked</p>
                        <p className="text-2xl font-bold text-[var(--color-meal)]">{data.mealEvents.length}</p>
                        <p className="text-xs text-[var(--color-text-muted)]">events</p>
                    </div>
                    <div className="card text-center">
                        <p className="text-xs text-[var(--color-text-muted)] mb-1">Spikes Detected</p>
                        <p className="text-2xl font-bold text-[var(--color-spike-high)]">{spikeCount}</p>
                        <p className="text-xs text-[var(--color-text-muted)]">≥30 mg/dL rise</p>
                    </div>
                </div>

                {/* Chart */}
                <GlucoseChart
                    readings={data.glucoseReadings}
                    meals={data.mealEvents}
                    workouts={data.workoutEvents}
                    analyses={data.mealAnalyses}
                    onMealSelect={setSelectedMealId}
                    selectedMealId={selectedMealId}
                />

                {/* Event Detail */}
                {selectedMeal && (
                    <EventDetailPanel
                        meal={selectedMeal}
                        analysis={selectedAnalysis}
                        onClose={() => setSelectedMealId(null)}
                    />
                )}

                {/* Meal Analysis Grid */}
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
                                    className={`card text-left transition-all hover:border-[var(--color-border-hover)] ${selectedMealId === meal.id
                                            ? "ring-2 ring-[var(--color-accent)]"
                                            : ""
                                        }`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-sm font-medium truncate">
                                            {meal.name ?? "Meal"}
                                        </h3>
                                        {analysis?.impactLabel && (
                                            <span className={`badge ${impactClass} text-xs`}>
                                                {analysis.impactLabel}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-[var(--color-text-muted)] mb-2">
                                        {new Date(meal.timestamp).toLocaleString()}
                                    </p>
                                    <div className="flex gap-4 text-xs">
                                        {analysis?.peakDelta !== null && analysis?.peakDelta !== undefined && (
                                            <span className="text-[var(--color-text-secondary)]">
                                                Δ {analysis.peakDelta} mg/dL
                                            </span>
                                        )}
                                        {meal.carbsGrams !== null && meal.carbsGrams !== undefined && (
                                            <span className="text-[var(--color-text-secondary)]">
                                                {meal.carbsGrams}g carbs
                                            </span>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Summary */}
                {data.summary && (
                    <SummaryBlock
                        summary={data.summary}
                        insights={data.crossMealInsights}
                    />
                )}

                {/* CTA */}
                <div className="text-center pt-8">
                    <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                        Ready to analyze your own data?
                    </p>
                    <Link href="/upload" className="btn-primary">
                        <Upload className="w-4 h-4" />
                        Upload Your FreeStyle Libre CSV
                    </Link>
                </div>
            </div>
        </main>
    );
}
