"use client";

import type { GeneratedSummary, AnalysisOutput, LLMInsightOutput } from "@glucose/types";
import { Sparkles, TrendingDown, TrendingUp, Footprints, Moon, Lightbulb } from "lucide-react";

interface SummaryBlockProps {
    summary: GeneratedSummary;
    insights?: AnalysisOutput["crossMealInsights"];
    llmInsights?: LLMInsightOutput;
}

export function SummaryBlock({ summary, insights, llmInsights }: SummaryBlockProps) {
    const hasRichInsights =
        llmInsights &&
        (llmInsights.overallPatterns.length > 0 ||
            llmInsights.keyRecommendations.length > 0 ||
            llmInsights.sleepGlucoseInsight);

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

            {/* Rich LLM insights */}
            {hasRichInsights && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Key recommendations */}
                    {llmInsights.keyRecommendations.length > 0 && (
                        <div className="card md:col-span-2">
                            <div className="flex items-center gap-2 mb-3">
                                <Lightbulb className="w-4 h-4 text-[var(--color-accent)]" />
                                <h4 className="text-xs font-semibold text-[var(--color-text-secondary)]">
                                    RECOMMENDATIONS
                                </h4>
                            </div>
                            <ul className="space-y-2.5">
                                {llmInsights.keyRecommendations.map((rec, i) => (
                                    <li key={i} className="flex items-start gap-2.5">
                                        <span
                                            className="mt-1.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                                            style={{
                                                background: "var(--color-accent-subtle)",
                                                color: "var(--color-accent-hover)",
                                            }}
                                        >
                                            {i + 1}
                                        </span>
                                        <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                                            {rec}
                                        </p>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Overall patterns */}
                    {llmInsights.overallPatterns.length > 0 && (
                        <div className="card">
                            <div className="flex items-center gap-2 mb-3">
                                <TrendingUp className="w-4 h-4 text-[var(--color-spike-moderate)]" />
                                <h4 className="text-xs font-semibold text-[var(--color-text-secondary)]">
                                    PATTERNS OBSERVED
                                </h4>
                            </div>
                            <ul className="space-y-2">
                                {llmInsights.overallPatterns.map((p, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-[var(--color-text-secondary)] leading-relaxed">
                                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "var(--color-spike-moderate)" }} />
                                        {p}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Sleep insight */}
                    {llmInsights.sleepGlucoseInsight && (
                        <div className="card">
                            <div className="flex items-center gap-2 mb-3">
                                <Moon className="w-4 h-4 text-[var(--color-glucose)]" />
                                <h4 className="text-xs font-semibold text-[var(--color-text-secondary)]">
                                    SLEEP & FASTING GLUCOSE
                                </h4>
                            </div>
                            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                                {llmInsights.sleepGlucoseInsight}
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Deterministic cross-meal insights (fallback / supplement) */}
            {insights && !hasRichInsights && (
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
