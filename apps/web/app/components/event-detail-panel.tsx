"use client";

import type { MealEvent, MealAnalysisResult } from "@glucose/types";
import { Utensils, AlertTriangle, TrendingUp, Clock, X, Wheat } from "lucide-react";

interface EventDetailPanelProps {
    meal: MealEvent;
    analysis: MealAnalysisResult | undefined;
    onClose: () => void;
}

function MacroBar({ label, value, total, color }: {
    label: string;
    value: number;
    total: number;
    color: string;
}) {
    const pct = total > 0 ? Math.round((value / total) * 100) : 0;
    return (
        <div>
            <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-[var(--color-text-muted)]">{label}</span>
                <span className="font-medium text-[var(--color-text-primary)]">{value}g</span>
            </div>
            <div className="h-1.5 rounded-full bg-[var(--color-surface-elevated)] overflow-hidden">
                <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, background: color }}
                />
            </div>
        </div>
    );
}

export function EventDetailPanel({ meal, analysis, onClose }: EventDetailPanelProps) {
    const impactClass =
        analysis?.impactLabel === "high"
            ? "impact-high"
            : analysis?.impactLabel === "moderate"
                ? "impact-moderate"
                : "impact-low";

    const hasMacros =
        meal.proteinGrams != null ||
        meal.fatGrams != null ||
        meal.fiberGrams != null;

    const totalMacroKcal = (
        (meal.carbsGrams ?? 0) * 4 +
        (meal.proteinGrams ?? 0) * 4 +
        (meal.fatGrams ?? 0) * 9
    );

    const hasCarbBreakdown =
        meal.carbBreakdown != null &&
        (meal.carbBreakdown.starchGrams != null ||
            meal.carbBreakdown.sugarGrams != null);

    return (
        <div className="card animate-slide-up relative">
            <button
                onClick={onClose}
                className="absolute top-4 right-4 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
            >
                <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-[var(--color-meal-bg)] flex items-center justify-center flex-shrink-0">
                    <Utensils className="w-5 h-5 text-[var(--color-meal)]" />
                </div>
                <div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-sm">{meal.name ?? "Unknown Meal"}</h3>
                        {meal.mealLabel && (
                            <span className="badge bg-[var(--color-accent-subtle)] text-[var(--color-accent-hover)]"
                                style={{ fontSize: "0.65rem", padding: "0.1rem 0.5rem" }}>
                                {meal.mealLabel}
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-[var(--color-text-muted)]">
                        {new Date(meal.timestamp).toLocaleString()}
                    </p>
                </div>
            </div>

            {/* Ingredients */}
            {meal.ingredients && meal.ingredients.length > 0 && (
                <div className="mb-4">
                    <p className="text-xs text-[var(--color-text-muted)] mb-1.5">Ingredients</p>
                    <ul className="space-y-0.5">
                        {meal.ingredients.map((ing, i) => (
                            <li key={i} className="flex items-start gap-1.5 text-sm">
                                <span className="mt-1.5 w-1 h-1 rounded-full bg-[var(--color-meal)] flex-shrink-0" />
                                {ing}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Macros */}
            {(meal.carbsGrams != null || hasMacros) && (
                <div className="mb-4 border-t border-[var(--color-border)] pt-4">
                    <div className="flex items-center gap-2 mb-3">
                        <Wheat className="w-4 h-4 text-[var(--color-accent)]" />
                        <h4 className="text-xs font-semibold text-[var(--color-text-secondary)]">
                            NUTRITION
                        </h4>
                        {meal.macroSource === "llm-estimated" && (
                            <span className="badge bg-[var(--color-accent-subtle)] text-[var(--color-accent-hover)]"
                                style={{ fontSize: "0.6rem", padding: "0.1rem 0.4rem" }}>
                                AI estimated
                            </span>
                        )}
                        {meal.carbsSource === "csv-provided" && (
                            <span className="badge bg-[var(--color-glucose-glow)] text-[var(--color-glucose)]"
                                style={{ fontSize: "0.6rem", padding: "0.1rem 0.4rem" }}>
                                from CSV
                            </span>
                        )}
                        {totalMacroKcal > 0 && (
                            <span className="ml-auto text-xs text-[var(--color-text-muted)]">
                                ~{totalMacroKcal} kcal
                            </span>
                        )}
                    </div>

                    <div className="space-y-2">
                        {meal.carbsGrams != null && (
                            <MacroBar label="Carbs" value={meal.carbsGrams} total={meal.carbsGrams + (meal.proteinGrams ?? 0) + (meal.fatGrams ?? 0)} color="var(--color-accent)" />
                        )}
                        {meal.proteinGrams != null && (
                            <MacroBar label="Protein" value={meal.proteinGrams} total={(meal.carbsGrams ?? 0) + meal.proteinGrams + (meal.fatGrams ?? 0)} color="var(--color-glucose)" />
                        )}
                        {meal.fatGrams != null && (
                            <MacroBar label="Fat" value={meal.fatGrams} total={(meal.carbsGrams ?? 0) + (meal.proteinGrams ?? 0) + meal.fatGrams} color="var(--color-workout)" />
                        )}
                        {meal.fiberGrams != null && (
                            <div className="flex justify-between text-xs pt-1 border-t border-[var(--color-border)]">
                                <span className="text-[var(--color-text-muted)]">Fiber</span>
                                <span className="font-medium">{meal.fiberGrams}g</span>
                            </div>
                        )}
                    </div>

                    {/* Carb Breakdown */}
                    {hasCarbBreakdown && (
                        <div className="mt-3 rounded-lg bg-[var(--color-surface-elevated)] p-3">
                            <p className="text-xs font-semibold text-[var(--color-text-secondary)] mb-2">
                                CARB BREAKDOWN
                            </p>
                            <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
                                {meal.carbBreakdown?.starchGrams != null && (
                                    <>
                                        <span className="text-[var(--color-text-muted)]">Starch</span>
                                        <span className="font-medium text-right">{meal.carbBreakdown.starchGrams}g</span>
                                    </>
                                )}
                                {meal.carbBreakdown?.sugarGrams != null && (
                                    <>
                                        <span className="text-[var(--color-text-muted)]">Total sugars</span>
                                        <span className="font-medium text-right">{meal.carbBreakdown.sugarGrams}g</span>
                                    </>
                                )}
                                {meal.carbBreakdown?.fructoseGrams != null && (
                                    <>
                                        <span className="text-[var(--color-text-muted)] pl-3">↳ Fructose</span>
                                        <span className="text-right text-[var(--color-text-muted)]">{meal.carbBreakdown.fructoseGrams}g</span>
                                    </>
                                )}
                                {meal.carbBreakdown?.glucoseGrams != null && (
                                    <>
                                        <span className="text-[var(--color-text-muted)] pl-3">↳ Glucose</span>
                                        <span className="text-right text-[var(--color-text-muted)]">{meal.carbBreakdown.glucoseGrams}g</span>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Notes */}
            {meal.notes && (
                <div className="mb-4">
                    <p className="text-xs text-[var(--color-text-muted)] mb-1">Notes</p>
                    <p className="text-sm">{meal.notes}</p>
                </div>
            )}

            {/* Glucose Response */}
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
