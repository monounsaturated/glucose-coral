"use client";

import { useMemo, useState } from "react";
import type { ComponentType } from "react";
import {
    LineChart as RechartsLineChart,
    Line as RechartsLine,
    XAxis as RechartsXAxis,
    YAxis as RechartsYAxis,
    CartesianGrid as RechartsCartesianGrid,
    Tooltip as RechartsTooltip,
    ResponsiveContainer as RechartsResponsiveContainer,
    ReferenceLine as RechartsReferenceLine,
    ReferenceArea as RechartsReferenceArea,
    Scatter as RechartsScatter,
} from "recharts";
import type {
    GlucoseReading,
    MealEvent,
    WorkoutEvent,
    MealAnalysisResult,
} from "@glucose/types";
import { Utensils, Footprints } from "lucide-react";

const XAxisComponent = RechartsXAxis as unknown as ComponentType<Record<string, unknown>>;
const YAxisComponent = RechartsYAxis as unknown as ComponentType<Record<string, unknown>>;
const TooltipComponent = RechartsTooltip as unknown as ComponentType<Record<string, unknown>>;
const LineChartComponent = RechartsLineChart as unknown as ComponentType<Record<string, unknown>>;
const LineComponent = RechartsLine as unknown as ComponentType<Record<string, unknown>>;
const CartesianGridComponent = RechartsCartesianGrid as unknown as ComponentType<Record<string, unknown>>;
const ResponsiveContainerComponent =
    RechartsResponsiveContainer as unknown as ComponentType<Record<string, unknown>>;
const ReferenceLineComponent = RechartsReferenceLine as unknown as ComponentType<Record<string, unknown>>;
const ReferenceAreaComponent = RechartsReferenceArea as unknown as ComponentType<Record<string, unknown>>;
const ScatterComponent = RechartsScatter as unknown as ComponentType<Record<string, unknown>>;

type TimeRange = "1d" | "3d" | "7d";

interface GlucoseChartProps {
    readings: GlucoseReading[];
    meals: MealEvent[];
    workouts: WorkoutEvent[];
    analyses: MealAnalysisResult[];
    onMealSelect?: (mealId: string) => void;
    selectedMealId?: string | null;
    /** Shorter chart area for dense layouts (e.g. landing preview). */
    chartHeight?: number;
    /** Hides per-day meal/workout badge rows below the chart. */
    compact?: boolean;
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

function formatDayHeading(ts: string): string {
    return new Date(ts).toLocaleDateString("en-US", {
        weekday: "long",
        day: "numeric",
        month: "long",
    });
}

export function GlucoseChart({
    readings,
    meals,
    workouts,
    analyses,
    onMealSelect,
    selectedMealId,
    chartHeight = 360,
    compact = false,
}: GlucoseChartProps) {
    const [timeRange, setTimeRange] = useState<TimeRange>("3d");

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
        const days = timeRange === "1d" ? 1 : timeRange === "3d" ? 3 : 7;
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

    const yDomain = useMemo((): [number, number] => {
        if (chartData.length === 0) return [60, 200];
        const values = chartData.map((d) => d.glucose as number);
        const min = Math.min(...values);
        const max = Math.max(...values);
        return [Math.max(40, Math.floor((min - 20) / 10) * 10), Math.ceil((max + 20) / 10) * 10];
    }, [chartData]);

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

    const workoutMarkerIndices = useMemo(() => {
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

    const groupedBadges = useMemo(() => {
        const mealsSorted = [...filteredMeals].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
        const workoutsSorted = [...filteredWorkouts].sort((a, b) => a.timestamp.localeCompare(b.timestamp));

        const mealCountsByDay = new Map<string, number>();
        const workoutCountsByDay = new Map<string, number>();
        const grouped = new Map<
            string,
            {
                heading: string;
                items: Array<
                    | { id: string; type: "meal"; label: string; mealId: string; impactClass: string; timestamp: string }
                    | { id: string; type: "workout"; label: string; workoutId: string; workoutType: string; duration: number | null; timestamp: string }
                >;
            }
        >();

        for (const meal of mealsSorted) {
            const dayKey = meal.timestamp.slice(0, 10);
            const mealCount = (mealCountsByDay.get(dayKey) ?? 0) + 1;
            mealCountsByDay.set(dayKey, mealCount);
            const impact = analysisMap.get(meal.id)?.impactLabel;
            const impactClass =
                impact === "high" ? "impact-high" : impact === "moderate" ? "impact-moderate" : "impact-low";

            const group = grouped.get(dayKey) ?? {
                heading: formatDayHeading(meal.timestamp),
                items: [],
            };
            group.items.push({
                id: meal.id,
                type: "meal",
                label: `Meal ${mealCount}`,
                mealId: meal.id,
                impactClass,
                timestamp: meal.timestamp,
            });
            grouped.set(dayKey, group);
        }

        for (const workout of workoutsSorted) {
            const dayKey = workout.timestamp.slice(0, 10);
            const workoutCount = (workoutCountsByDay.get(dayKey) ?? 0) + 1;
            workoutCountsByDay.set(dayKey, workoutCount);

            const group = grouped.get(dayKey) ?? {
                heading: formatDayHeading(workout.timestamp),
                items: [],
            };
            group.items.push({
                id: workout.id,
                type: "workout",
                label: `Workout ${workoutCount}`,
                workoutId: workout.id,
                workoutType: workout.type,
                duration: workout.durationMinutes ?? null,
                timestamp: workout.timestamp,
            });
            grouped.set(dayKey, group);
        }

        return [...grouped.entries()]
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([, value]) => ({
                heading: value.heading,
                items: value.items.sort((a, b) => a.timestamp.localeCompare(b.timestamp)),
            }));
    }, [filteredMeals, filteredWorkouts, analysisMap]);

    // Custom tick showing fewer labels for 3d/7d
    const tickInterval = timeRange === "1d" ? 4 : timeRange === "3d" ? 10 : 16;

    return (
        <div className={compact ? "space-y-2" : "space-y-4"}>
            {/* Time range tabs + legend */}
            <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                    {(["1d", "3d", "7d"] as TimeRange[]).map((range) => (
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
                {/* Chart legend */}
                <div className="flex items-center gap-4 text-xs text-[var(--color-text-muted)]">
                    <span className="flex items-center gap-1.5">
                        <span className="inline-block w-6 h-0.5 rounded" style={{ background: "#22d3ee" }} />
                        Glucose
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span
                            className="inline-block w-0.5 h-3.5"
                            style={{ background: "var(--color-meal-marker)", borderRadius: 2 }}
                        />
                        <span className="w-1 h-1 rounded-full" style={{ background: "var(--color-meal-marker)" }} />
                        Meal
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span
                            className="inline-block w-0.5 h-3.5"
                            style={{ background: "var(--color-workout-marker)", borderRadius: 2 }}
                        />
                        <span
                            className="inline-block"
                            style={{
                                width: 0,
                                height: 0,
                                borderLeft: "4px solid transparent",
                                borderRight: "4px solid transparent",
                                borderBottom: `7px solid var(--color-workout-marker)`,
                            }}
                        />
                        Workout
                    </span>
                </div>
            </div>

            {/* Chart */}
            <div className="card p-4" style={{ height: chartHeight }}>
                <ResponsiveContainerComponent width="100%" height="100%">
                    <LineChartComponent data={chartData} margin={{ top: 20, right: 20, bottom: 5, left: 0 }}>
                        <defs>
                            <linearGradient id="glucoseGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.3} />
                                <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGridComponent strokeDasharray="3 3" stroke="var(--color-border)" />
                        <XAxisComponent
                            dataKey="label"
                            tick={{ fill: "var(--color-text-muted)", fontSize: 10 }}
                            interval={tickInterval}
                            axisLine={{ stroke: "var(--color-border)" }}
                        />
                        <YAxisComponent
                            domain={yDomain}
                            tick={{ fill: "var(--color-text-muted)", fontSize: 10 }}
                            axisLine={{ stroke: "var(--color-border)" }}
                            label={{
                                value: "mg/dL",
                                angle: -90,
                                position: "insideLeft",
                                style: { fill: "var(--color-text-muted)", fontSize: 10 },
                            }}
                        />
                        <TooltipComponent
                            contentStyle={{
                                background: "var(--color-surface)",
                                border: "1px solid var(--color-border)",
                                borderRadius: "8px",
                                color: "var(--color-text-primary)",
                                fontSize: 12,
                            }}
                            labelFormatter={(label: string | number) => `Time: ${label}`}
                            formatter={(value: string | number) => [`${value} mg/dL`, "Glucose"]}
                        />

                        {/* Normal range band */}
                        <ReferenceAreaComponent
                            y1={70}
                            y2={180}
                            fill="#22c55e"
                            fillOpacity={0.03}
                        />
                        <ReferenceLineComponent
                            y={70}
                            stroke="#22c55e"
                            strokeDasharray="3 3"
                            strokeOpacity={0.3}
                        />
                        <ReferenceLineComponent
                            y={180}
                            stroke="#ef4444"
                            strokeDasharray="3 3"
                            strokeOpacity={0.3}
                        />

                        {/* Meal markers as reference lines */}
                        {mealMarkerIndices.map(({ meal }) => {
                            return (
                                <ReferenceLineComponent
                                    key={meal.id}
                                    x={
                                        timeRange === "1d"
                                            ? formatTime(meal.timestamp)
                                            : formatDateTime(meal.timestamp)
                                    }
                                    stroke="var(--color-meal-marker)"
                                    strokeDasharray="4 4"
                                    strokeOpacity={0.7}
                                />
                            );
                        })}

                        {/* Workout markers */}
                        {workoutMarkerIndices.map(({ workout }) => (
                            <ReferenceLineComponent
                                key={workout.id}
                                x={
                                    timeRange === "1d"
                                        ? formatTime(workout.timestamp)
                                        : formatDateTime(workout.timestamp)
                                }
                                stroke="var(--color-workout-marker)"
                                strokeDasharray="2 6"
                                strokeOpacity={0.5}
                            />
                        ))}

                        <ScatterComponent
                            data={mealMarkerIndices.map(({ meal, glucose }) => ({
                                label: timeRange === "1d" ? formatTime(meal.timestamp) : formatDateTime(meal.timestamp),
                                glucose,
                                mealId: meal.id,
                            }))}
                            dataKey="glucose"
                            fill="var(--color-meal-marker)"
                            shape="circle"
                            onClick={(point: { payload?: { mealId?: string }; mealId?: string }) => {
                                const mealId = point?.payload?.mealId ?? point?.mealId;
                                if (mealId) onMealSelect?.(mealId);
                            }}
                        />

                        <ScatterComponent
                            data={workoutMarkerIndices.map(({ workout, glucose }) => ({
                                label: timeRange === "1d" ? formatTime(workout.timestamp) : formatDateTime(workout.timestamp),
                                glucose,
                            }))}
                            dataKey="glucose"
                            fill="var(--color-workout-marker)"
                            shape="triangle"
                        />

                        <LineComponent
                            type="monotone"
                            dataKey="glucose"
                            stroke="#22d3ee"
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 4, fill: "#22d3ee", stroke: "#0a0a0f", strokeWidth: 2 }}
                        />
                    </LineChartComponent>
                </ResponsiveContainerComponent>
            </div>

            {/* Event badges grouped by day */}
            {!compact && (
            <div className="space-y-3">
                {groupedBadges.map((group) => (
                    <div key={group.heading} className="space-y-2">
                        <p className="text-xs font-medium text-[var(--color-text-secondary)]">{group.heading}</p>
                        <div className="flex flex-wrap gap-2 text-xs text-[var(--color-text-secondary)]">
                            {group.items.map((item) =>
                                item.type === "meal" ? (
                                    <button
                                        key={item.id}
                                        onClick={() => onMealSelect?.(item.mealId)}
                                        className={`flex items-center gap-1.5 badge ${item.impactClass} cursor-pointer transition-transform hover:scale-105 ${selectedMealId === item.mealId ? "ring-2 ring-[var(--color-accent)]" : ""
                                            }`}
                                    >
                                        <Utensils className="w-3 h-3" />
                                        {item.label}
                                    </button>
                                ) : (
                                    <span
                                        key={item.id}
                                        className="flex items-center gap-1.5 badge bg-[var(--color-workout-bg)] text-[var(--color-workout)]"
                                    >
                                        <Footprints className="w-3 h-3" />
                                        {item.label}
                                        {item.duration ? ` (${item.duration}m)` : ""}
                                    </span>
                                )
                            )}
                        </div>
                    </div>
                ))}
            </div>
            )}
        </div>
    );
}
