import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type {
    AnalysisRun,
    GlucoseReading,
    MealEvent,
    WorkoutEvent,
    MealAnalysisResult,
    GeneratedSummary,
} from '@glucose/types';

// ─── Client ────────────────────────────────────────────────

let supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
    if (supabaseClient) return supabaseClient;

    const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
        console.warn('Supabase not configured — running in memory-only mode');
        return null;
    }

    supabaseClient = createClient(url, key);
    return supabaseClient;
}

// ─── DB Helpers ────────────────────────────────────────────

export async function saveAnalysisRun(run: AnalysisRun): Promise<void> {
    const client = getSupabaseClient();
    if (!client) return;

    await client.from('analysis_runs').upsert({
        id: run.id,
        mode: run.mode,
        created_at: run.createdAt,
        status: run.status,
    });
}

export async function saveGlucoseReadings(
    runId: string,
    readings: GlucoseReading[],
): Promise<void> {
    const client = getSupabaseClient();
    if (!client) return;

    const rows = readings.map((r) => ({
        run_id: runId,
        timestamp: r.timestamp,
        raw_timestamp: r.rawTimestamp,
        value: r.value,
        source: r.source,
    }));

    // Insert in batches of 500
    for (let i = 0; i < rows.length; i += 500) {
        await client.from('glucose_readings').insert(rows.slice(i, i + 500));
    }
}

export async function saveMealEvents(
    runId: string,
    meals: MealEvent[],
): Promise<void> {
    const client = getSupabaseClient();
    if (!client) return;

    const rows = meals.map((m) => ({
        id: m.id,
        run_id: runId,
        timestamp: m.timestamp,
        raw_timestamp: m.rawTimestamp,
        name: m.name,
        ingredients: m.ingredients,
        carbs_grams: m.carbsGrams,
        carbs_source: m.carbsSource,
        notes: m.notes,
        source: m.source,
    }));

    await client.from('meal_events').insert(rows);
}

export async function saveWorkoutEvents(
    runId: string,
    workouts: WorkoutEvent[],
): Promise<void> {
    const client = getSupabaseClient();
    if (!client) return;

    const rows = workouts.map((w) => ({
        id: w.id,
        run_id: runId,
        timestamp: w.timestamp,
        raw_timestamp: w.rawTimestamp,
        type: w.type,
        duration_minutes: w.durationMinutes,
        notes: w.notes,
        source: w.source,
    }));

    await client.from('workout_events').insert(rows);
}

export async function saveMealAnalyses(
    runId: string,
    analyses: MealAnalysisResult[],
): Promise<void> {
    const client = getSupabaseClient();
    if (!client) return;

    const rows = analyses.map((a) => ({
        run_id: runId,
        meal_id: a.mealId,
        baseline: a.baseline,
        peak: a.peak,
        peak_delta: a.peakDelta,
        peak_timing_minutes: a.peakTimingMinutes,
        duration_above_baseline_20: a.durationAboveBaseline20,
        is_spike: a.isSpike,
        impact_label: a.impactLabel,
        flags: a.flags,
    }));

    await client.from('meal_analysis_results').insert(rows);
}

export async function saveSummary(
    runId: string,
    summary: GeneratedSummary,
): Promise<void> {
    const client = getSupabaseClient();
    if (!client) return;

    await client.from('generated_summaries').insert({
        run_id: runId,
        text: summary.text,
        generated_at: summary.generatedAt,
    });
}

// ─── SQL Migration (for reference) ────────────────────────

export const MIGRATION_SQL = `
-- Glucose Response Explorer V1 Schema

CREATE TABLE IF NOT EXISTS analysis_runs (
  id TEXT PRIMARY KEY,
  mode TEXT NOT NULL CHECK (mode IN ('csv-food', 'document-food')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'pending'
);

CREATE TABLE IF NOT EXISTS glucose_readings (
  id SERIAL PRIMARY KEY,
  run_id TEXT NOT NULL REFERENCES analysis_runs(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ NOT NULL,
  raw_timestamp TEXT NOT NULL,
  value NUMERIC NOT NULL,
  source TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS meal_events (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL REFERENCES analysis_runs(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ NOT NULL,
  raw_timestamp TEXT NOT NULL,
  name TEXT,
  ingredients JSONB,
  carbs_grams NUMERIC,
  carbs_source TEXT,
  notes TEXT,
  source TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS workout_events (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL REFERENCES analysis_runs(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ NOT NULL,
  raw_timestamp TEXT NOT NULL,
  type TEXT NOT NULL,
  duration_minutes INTEGER,
  notes TEXT,
  source TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS meal_analysis_results (
  id SERIAL PRIMARY KEY,
  run_id TEXT NOT NULL REFERENCES analysis_runs(id) ON DELETE CASCADE,
  meal_id TEXT NOT NULL,
  baseline NUMERIC,
  peak NUMERIC,
  peak_delta NUMERIC,
  peak_timing_minutes INTEGER,
  duration_above_baseline_20 INTEGER,
  is_spike BOOLEAN,
  impact_label TEXT,
  flags JSONB DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS generated_summaries (
  id SERIAL PRIMARY KEY,
  run_id TEXT NOT NULL REFERENCES analysis_runs(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for retention cleanup
CREATE INDEX IF NOT EXISTS idx_analysis_runs_created_at ON analysis_runs(created_at);

-- RLS policies (enable when auth is added)
-- ALTER TABLE analysis_runs ENABLE ROW LEVEL SECURITY;
`;
