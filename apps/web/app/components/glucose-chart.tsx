"use client";

import { useMemo, useState } from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
    ReferenceArea,
} from "recharts";
import type {
    GlucoseReading,
    MealEvent,
    WorkoutEvent,
    MealAnalysisResult,
} from "@glucose/types";
import { Utensils, Footprints } from "lucide-react";

type TimeRange = "1d" | "7d" | "14d";

interface GlucoseChartProps {
    readings: GlucoseReading[];
    meals: MealEvent[];
    workouts: WorkoutEvent[];
    analyses: MealAnalysisResult[];
    onMealSelect?: (mealId: string) => void;
    selectedMealId?: string | null;
}

function formatTime(ts: string): string {
    const d = new Date(ts);
    return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

function formatDate(ts: string): string {
    const d = new Date(ts);
    return `${d.getDate()}/${d.getMonth() + 1}`;
}

function formatDateTime(ts: string): string {
    return `${formatDate(ts)} ${formatTime(ts)}`;
}

export function GlucoseChart({
    readings,
    meals,
    workouts,
    analyses,
    onMealSelect,
    selectedMealId,
}: GlucoseChartProps) {
    const [timeRange, setTimeRange] = useState<TimeRange>("7d");

    const analysisMap = useMemo(
        () => new Map(analyses.map((a) => [a.mealId, a])),
        [analyses]
    );

    const { filteredReadings, filteredMeals, filteredWorkouts } = useMemo(() => {
        if (readings.length === 0)
            return { filteredReadings: [], filteredMeals: [], filteredWorkouts: [] };

        const sortedReadings = [...readings].sort((a, b) =>
            a.timestamp.localeCompare(b.timestamp)
        );
        const lastTs = new Date(sortedReadings[sortedReadings.length - 1].timestamp);
        const days = timeRange === "1d" ? 1 : timeRange === "7d" ? 7 : 14;
        const cutoff = new Date(lastTs.getTime() - days * 24 * 60 * 60 * 1000);
        const cutoffStr = cutoff.toISOString();

        return {
            filteredReadings: sortedReadings.filter((r) => r.timestamp >= cutoffStr),
            filteredMeals: meals.filter((m) => m.timestamp >= cutoffStr),
            filteredWorkouts: workouts.filter((w) => w.timestamp >= cutoffStr),
        };
    }, [readings, meals, workouts, timeRange]);

    const chartData = useMemo(
        () =>
            filteredReadings.map((r) => ({
                timestamp: r.timestamp,
                glucose: r.value,
                label: timeRange === "1d" ? formatTime(r.timestamp) : formatDateTime(r.timestamp),
            })),
        [filteredReadings, timeRange]
    );

    // Find indices closest to meal/workout times for markers
    const mealMarkerIndices = useMemo(() => {
        return filteredMeals.map((meal) => {
            let closest = 0;
            let minDiff = Infinity;
            chartData.forEach((d, i) => {
                const diff = Math.abs(
                    new Date(d.timestamp).getTime() - new Date(meal.timestamp).getTime()
                );
                if (diff < minDiff) {
                    minDiff = diff;
                    closest = i;
                }
            });
            return { meal, index: closest, glucose: chartData[closest]?.glucose ?? 0 };
        });
    }, [filteredMeals, chartData]);

    const workoutMarkerPositions = useMemo(() => {
        return filteredWorkouts.map((w) => {
            let closest = 0;
            let minDiff = Infinity;
            chartData.forEach((d, i) => {
                const diff = Math.abs(
                    new Date(d.timestamp).getTime() - new Date(w.timestamp).getTime()
                );
                if (diff < minDiff) {
                    minDiff = diff;
                    closest = i;
                }
            });
            return { workout: w, index: closest, glucose: chartData[closest]?.glucose ?? 0 };
        });
    }, [filteredWorkouts, chartData]);

    // Custom tick showing fewer labels for 7d/14d
    const tickInterval = timeRange === "1d" ? 4 : timeRange === "7d" ? 16 : 32;

    return (
        <div className="space-y-4">
            {/* Time range tabs */}
            <div className="flex items-center gap-2">
                {(["1d", "7d", "14d"] as TimeRange[]).map((range) => (
                    <button
                        key={range}
                        onClick={() => setTimeRange(range)}
                        className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${timeRange === range
                                ? "bg-[var(--color-accent)] text-white"
                                : "bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                            }`}
                    >
                        {range.toUpperCase()}
                    </button>
                ))}
                <span className="text-xs text-[var(--color-text-muted)] ml-2">
                    {filteredReadings.length} readings
                </span>
            </div>

            {/* Chart */}
            <div className="card p-4" style={{ height: 360 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 20, right: 20, bottom: 5, left: 0 }}>
                        <defs>
                            <linearGradient id="glucoseGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.3} />
                                <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e1e3a" />
                        <XAxis
                            dataKey="label"
                            tick={{ fill: "#6868a0", fontSize: 10 }}
                            interval={tickInterval}
                            axisLine={{ stroke: "#2a2a3e" }}
                        />
                        <YAxis
                            domain={[60, 200]}
                            tick={{ fill: "#6868a0", fontSize: 10 }}
                            axisLine={{ stroke: "#2a2a3e" }}
                            label={{
                                value: "mg/dL",
                                angle: -90,
                                position: "insideLeft",
                                style: { fill: "#6868a0", fontSize: 10 },
                            }}
                        />
                        <Tooltip
                            contentStyle={{
                                background: "#12121a",
                                border: "1px solid #2a2a3e",
                                borderRadius: "8px",
                                color: "#e8e8f0",
                                fontSize: 12,
                            }}
                            labelFormatter={(label) => `Time: ${label}`}
                            formatter={(value: number) => [`${value} mg/dL`, "Glucose"]}
                        />

                        {/* Normal range band */}
                        <ReferenceArea
                            y1={70}
                            y2={180}
                            fill="#22c55e"
                            fillOpacity={0.03}
                        />
                        <ReferenceLine
                            y={70}
                            stroke="#22c55e"
                            strokeDasharray="3 3"
                            strokeOpacity={0.3}
                        />
                        <ReferenceLine
                            y={180}
                            stroke="#ef4444"
                            strokeDasharray="3 3"
                            strokeOpacity={0.3}
                        />

                        {/* Meal markers as reference lines */}
                        {mealMarkerIndices.map(({ meal }) => {
                            const analysis = analysisMap.get(meal.id);
                            const color =
                                analysis?.impactLabel === "high"
                                    ? "#ef4444"
                                    : analysis?.impactLabel === "moderate"
                                        ? "#f59e0b"
                                        : "#22c55e";
                            return (
                                <ReferenceLine
                                    key={meal.id}
                                    x={
                                        timeRange === "1d"
                                            ? formatTime(meal.timestamp)
                                            : formatDateTime(meal.timestamp)
                                    }
                                    stroke={color}
                                    strokeDasharray="4 4"
                                    strokeOpacity={0.7}
                                />
                            );
                        })}

                        {/* Workout markers */}
                        {workoutMarkerPositions.map(({ workout }) => (
                            <ReferenceLine
                                key={workout.id}
                                x={
                                    timeRange === "1d"
                                        ? formatTime(workout.timestamp)
                                        : formatDateTime(workout.timestamp)
                                }
                                stroke="#10b981"
                                strokeDasharray="2 6"
                                strokeOpacity={0.5}
                            />
                        ))}

                        <Line
                            type="monotone"
                            dataKey="glucose"
                            stroke="#22d3ee"
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 4, fill: "#22d3ee", stroke: "#0a0a0f", strokeWidth: 2 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Event Legend */}
            <div className="flex flex-wrap gap-4 text-xs text-[var(--color-text-secondary)]">
                {filteredMeals.map((meal) => {
                    const analysis = analysisMap.get(meal.id);
                    const impactClass =
                        analysis?.impactLabel === "high"
                            ? "impact-high"
                            : analysis?.impactLabel === "moderate"
                                ? "impact-moderate"
                                : "impact-low";
                    return (
                        <button
                            key={meal.id}
                            onClick={() => onMealSelect?.(meal.id)}
                            className={`flex items-center gap-1.5 badge ${impactClass} cursor-pointer transition-transform hover:scale-105 ${selectedMealId === meal.id ? "ring-2 ring-[var(--color-accent)]" : ""
                                }`}
                        >
                            <Utensils className="w-3 h-3" />
                            {meal.name ?? "Meal"}
                        </button>
                    );
                })}
                {filteredWorkouts.map((w) => (
                    <span
                        key={w.id}
                        className="flex items-center gap-1.5 badge bg-[var(--color-workout-bg)] text-[var(--color-workout)]"
                    >
                        <Footprints className="w-3 h-3" />
                        {w.type} {w.durationMinutes ? `(${w.durationMinutes}m)` : ""}
                    </span>
                ))}
            </div>
        </div>
    );
}
