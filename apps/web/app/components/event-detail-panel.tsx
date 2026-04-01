"use client";

import type { MealEvent, MealAnalysisResult } from "@glucose/types";
import { Utensils, AlertTriangle, TrendingUp, Clock, X } from "lucide-react";

interface EventDetailPanelProps {
    meal: MealEvent;
    analysis: MealAnalysisResult | undefined;
    onClose: () => void;
}

export function EventDetailPanel({ meal, analysis, onClose }: EventDetailPanelProps) {
    const impactClass =
        analysis?.impactLabel === "high"
            ? "impact-high"
            : analysis?.impactLabel === "moderate"
                ? "impact-moderate"
                : "impact-low";

    return (
        <div className="card animate-slide-up relative">
            <button
                onClick={onClose}
                className="absolute top-4 right-4 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
            >
                <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-[var(--color-meal-bg)] flex items-center justify-center flex-shrink-0">
                    <Utensils className="w-5 h-5 text-[var(--color-meal)]" />
                </div>
                <div>
                    <h3 className="font-semibold text-sm">{meal.name ?? "Unknown Meal"}</h3>
                    <p className="text-xs text-[var(--color-text-muted)]">
                        {new Date(meal.timestamp).toLocaleString()}
                    </p>
                </div>
            </div>

            {/* Meal details */}
            <div className="space-y-3 mb-4">
                {meal.ingredients && meal.ingredients.length > 0 && (
                    <div>
                        <p className="text-xs text-[var(--color-text-muted)] mb-1">Ingredients</p>
                        <p className="text-sm">{meal.ingredients.join(", ")}</p>
                    </div>
                )}
                {meal.carbsGrams !== null && meal.carbsGrams !== undefined && (
                    <div>
                        <p className="text-xs text-[var(--color-text-muted)] mb-1 flex items-center gap-1.5">
                            Carbohydrates
                            {meal.carbsSource === "csv-provided" ? (
                                <span className="badge bg-[var(--color-glucose-glow)] text-[var(--color-glucose)]" style={{ fontSize: "0.65rem", padding: "0.1rem 0.4rem" }}>
                                    from CSV
                                </span>
                            ) : meal.carbsSource === "llm-estimated" ? (
                                <span className="badge bg-[var(--color-accent-subtle)] text-[var(--color-accent-hover)]" style={{ fontSize: "0.65rem", padding: "0.1rem 0.4rem" }}>
                                    AI estimated
                                </span>
                            ) : null}
                        </p>
                        <p className="text-sm font-medium">{meal.carbsGrams}g</p>
                    </div>
                )}
                {meal.notes && (
                    <div>
                        <p className="text-xs text-[var(--color-text-muted)] mb-1">Notes</p>
                        <p className="text-sm">{meal.notes}</p>
                    </div>
                )}
            </div>

            {/* Analytics results */}
            {analysis && (
                <div className="border-t border-[var(--color-border)] pt-4">
                    <div className="flex items-center gap-2 mb-3">
                        <TrendingUp className="w-4 h-4 text-[var(--color-accent)]" />
                        <h4 className="text-xs font-semibold text-[var(--color-text-secondary)]">
                            GLUCOSE RESPONSE
                        </h4>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-3">
                        {analysis.baseline !== null && (
                            <div className="bg-[var(--color-surface-elevated)] rounded-lg p-3">
                                <p className="text-xs text-[var(--color-text-muted)]">Baseline</p>
                                <p className="text-lg font-bold">{analysis.baseline} <span className="text-xs font-normal text-[var(--color-text-muted)]">mg/dL</span></p>
                            </div>
                        )}
                        {analysis.peak !== null && (
                            <div className="bg-[var(--color-surface-elevated)] rounded-lg p-3">
                                <p className="text-xs text-[var(--color-text-muted)]">Peak</p>
                                <p className="text-lg font-bold">{analysis.peak} <span className="text-xs font-normal text-[var(--color-text-muted)]">mg/dL</span></p>
                            </div>
                        )}
                        {analysis.peakDelta !== null && (
                            <div className="bg-[var(--color-surface-elevated)] rounded-lg p-3">
                                <p className="text-xs text-[var(--color-text-muted)]">Peak Delta</p>
                                <p className="text-lg font-bold">+{analysis.peakDelta} <span className="text-xs font-normal text-[var(--color-text-muted)]">mg/dL</span></p>
                            </div>
                        )}
                        {analysis.peakTimingMinutes !== null && (
                            <div className="bg-[var(--color-surface-elevated)] rounded-lg p-3">
                                <p className="text-xs text-[var(--color-text-muted)]">Time to Peak</p>
                                <p className="text-lg font-bold flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> {analysis.peakTimingMinutes} <span className="text-xs font-normal text-[var(--color-text-muted)]">min</span>
                                </p>
                            </div>
                        )}
                    </div>

                    {analysis.durationAboveBaseline20 !== null && analysis.durationAboveBaseline20 > 0 && (
                        <div className="bg-[var(--color-surface-elevated)] rounded-lg p-3 mb-3">
                            <p className="text-xs text-[var(--color-text-muted)]">Duration above baseline+20</p>
                            <p className="text-sm font-medium">{analysis.durationAboveBaseline20} min</p>
                        </div>
                    )}

                    {/* Impact & Spike badges */}
                    <div className="flex flex-wrap gap-2">
                        {analysis.impactLabel && (
                            <span className={`badge ${impactClass} text-xs`}>
                                {analysis.impactLabel} impact
                            </span>
                        )}
                        {analysis.isSpike && (
                            <span className="badge impact-high text-xs">
                                spike detected
                            </span>
                        )}
                    </div>

                    {/* Flags */}
                    {analysis.flags.length > 0 && (
                        <div className="mt-3 space-y-1.5">
                            {analysis.flags.map((flag) => (
                                <div
                                    key={flag}
                                    className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]"
                                >
                                    <AlertTriangle className="w-3 h-3 text-[var(--color-spike-moderate)]" />
                                    {flag === "overlapping-meal-window"
                                        ? "Another meal within 90 minutes — comparison may be unreliable"
                                        : flag === "workout-in-window"
                                            ? "Exercise near this meal may have influenced glucose response"
                                            : "Insufficient baseline data before this meal"}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
