"use client";

import type { GeneratedSummary, AnalysisOutput } from "@glucose/types";
import { Sparkles, TrendingDown, TrendingUp, Footprints } from "lucide-react";

interface SummaryBlockProps {
    summary: GeneratedSummary;
    insights?: AnalysisOutput["crossMealInsights"];
}

export function SummaryBlock({ summary, insights }: SummaryBlockProps) {
    return (
        <div className="space-y-4">
            {/* Summary text */}
            <div className="card">
                <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-[var(--color-accent)]" />
                    <h3 className="text-sm font-semibold">Analysis Summary</h3>
                </div>
                <div className="text-sm text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-line">
                    {summary.text}
                </div>
            </div>

            {/* Cross-meal insights cards */}
            {insights && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {insights.foodsAssociatedWithSpikes.length > 0 && (
                        <div className="card">
                            <div className="flex items-center gap-2 mb-2">
                                <TrendingUp className="w-4 h-4 text-[var(--color-spike-high)]" />
                                <h4 className="text-xs font-semibold text-[var(--color-text-secondary)]">
                                    ASSOCIATED WITH SPIKES
                                </h4>
                            </div>
                            <ul className="space-y-1">
                                {insights.foodsAssociatedWithSpikes.map((food) => (
                                    <li key={food} className="text-sm flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-spike-high)]" />
                                        {food}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {insights.foodsWithMildResponses.length > 0 && (
                        <div className="card">
                            <div className="flex items-center gap-2 mb-2">
                                <TrendingDown className="w-4 h-4 text-[var(--color-spike-low)]" />
                                <h4 className="text-xs font-semibold text-[var(--color-text-secondary)]">
                                    MILDER RESPONSES
                                </h4>
                            </div>
                            <ul className="space-y-1">
                                {insights.foodsWithMildResponses.map((food) => (
                                    <li key={food} className="text-sm flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-spike-low)]" />
                                        {food}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {insights.walkBenefitExamples.length > 0 && (
                        <div className="card">
                            <div className="flex items-center gap-2 mb-2">
                                <Footprints className="w-4 h-4 text-[var(--color-workout)]" />
                                <h4 className="text-xs font-semibold text-[var(--color-text-secondary)]">
                                    EXERCISE OBSERVATIONS
                                </h4>
                            </div>
                            <ul className="space-y-2">
                                {insights.walkBenefitExamples.map((example, i) => (
                                    <li key={i} className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                                        {example}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
