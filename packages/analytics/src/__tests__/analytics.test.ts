import { describe, it, expect } from 'vitest';
import { analyzeMeal, analyzeAllMeals, getImpactLabel, generateCrossMealInsights } from '../index';
import type { GlucoseReading, MealEvent, WorkoutEvent } from '@glucose/types';

function makeReading(ts: string, value: number): GlucoseReading {
    return { timestamp: ts, rawTimestamp: '', value, source: 'historic' };
}

function makeMeal(id: string, ts: string, name: string): MealEvent {
    return {
        id,
        timestamp: ts,
        rawTimestamp: '',
        name,
        carbsGrams: null,
        carbsSource: 'unknown',
        source: 'csv',
    };
}

describe('getImpactLabel', () => {
    it('returns low for delta < 20', () => {
        expect(getImpactLabel(15)).toBe('low');
    });
    it('returns moderate for delta 20-39', () => {
        expect(getImpactLabel(25)).toBe('moderate');
    });
    it('returns high for delta >= 40', () => {
        expect(getImpactLabel(45)).toBe('high');
    });
});

describe('analyzeMeal', () => {
    // Readings every 15 min from 07:00 to 10:00
    const readings: GlucoseReading[] = [
        makeReading('2026-03-20T07:00:00', 90),
        makeReading('2026-03-20T07:15:00', 88),
        makeReading('2026-03-20T07:30:00', 91),
        makeReading('2026-03-20T07:45:00', 89),  // meal time
        makeReading('2026-03-20T08:00:00', 100),
        makeReading('2026-03-20T08:15:00', 115),
        makeReading('2026-03-20T08:30:00', 130),
        makeReading('2026-03-20T08:45:00', 140),
        makeReading('2026-03-20T09:00:00', 135),
        makeReading('2026-03-20T09:15:00', 120),
        makeReading('2026-03-20T09:30:00', 105),
        makeReading('2026-03-20T09:45:00', 95),
    ];

    const meal = makeMeal('m1', '2026-03-20T07:45:00', 'Test meal');

    it('computes baseline as median of pre-meal window', () => {
        const result = analyzeMeal(meal, readings, [meal], []);
        // Baseline window: 07:15 to 07:45 → readings 90, 88, 91, 89 → sorted: 88,89,90,91 → median = 89.5
        expect(result.baseline).toBe(89.5);
    });

    it('finds peak in post-meal window', () => {
        const result = analyzeMeal(meal, readings, [meal], []);
        expect(result.peak).toBe(140);
    });

    it('computes peak delta correctly', () => {
        const result = analyzeMeal(meal, readings, [meal], []);
        expect(result.peakDelta).toBe(50.5);  // 140 - 89.5
    });

    it('classifies as spike when delta >= 30', () => {
        const result = analyzeMeal(meal, readings, [meal], []);
        expect(result.isSpike).toBe(true);
    });

    it('classifies impact label correctly', () => {
        const result = analyzeMeal(meal, readings, [meal], []);
        expect(result.impactLabel).toBe('high');  // delta 51 >= 40
    });

    it('computes peak timing', () => {
        const result = analyzeMeal(meal, readings, [meal], []);
        expect(result.peakTimingMinutes).toBe(60);  // 07:45 to 08:45
    });

    it('flags insufficient baseline data', () => {
        const earlyMeal = makeMeal('m-early', '2026-03-20T06:00:00', 'Too early');
        const result = analyzeMeal(earlyMeal, readings, [earlyMeal], []);
        expect(result.flags).toContain('insufficient-baseline-data');
        expect(result.baseline).toBeNull();
    });

    it('flags overlapping meal window', () => {
        const closeMeal = makeMeal('m2', '2026-03-20T08:30:00', 'Close meal');
        const result = analyzeMeal(meal, readings, [meal, closeMeal], []);
        expect(result.flags).toContain('overlapping-meal-window');
    });

    it('flags workout in window', () => {
        const workout: WorkoutEvent = {
            id: 'w1',
            timestamp: '2026-03-20T08:15:00',
            rawTimestamp: '',
            type: 'walk',
            durationMinutes: 20,
            source: 'csv',
        };
        const result = analyzeMeal(meal, readings, [meal], [workout]);
        expect(result.flags).toContain('workout-in-window');
    });
});

describe('analyzeMeal - low impact', () => {
    const readings: GlucoseReading[] = [
        makeReading('2026-03-20T12:00:00', 88),
        makeReading('2026-03-20T12:15:00', 90),
        makeReading('2026-03-20T12:30:00', 89), // meal
        makeReading('2026-03-20T12:45:00', 92),
        makeReading('2026-03-20T13:00:00', 96),
        makeReading('2026-03-20T13:15:00', 100),
        makeReading('2026-03-20T13:30:00', 98),
        makeReading('2026-03-20T13:45:00', 94),
        makeReading('2026-03-20T14:00:00', 91),
        makeReading('2026-03-20T14:15:00', 89),
        makeReading('2026-03-20T14:30:00', 88),
    ];

    const meal = makeMeal('m-low', '2026-03-20T12:30:00', 'Salad');

    it('classifies non-spike correctly', () => {
        const result = analyzeMeal(meal, readings, [meal], []);
        expect(result.isSpike).toBe(false);
        expect(result.impactLabel).toBe('low');
        expect(result.peakDelta).toBeLessThan(20);
    });
});

describe('analyzeAllMeals', () => {
    it('returns results for all meals', () => {
        const readings = [
            makeReading('2026-03-20T07:00:00', 90),
            makeReading('2026-03-20T07:15:00', 88),
            makeReading('2026-03-20T07:30:00', 89),
            makeReading('2026-03-20T08:00:00', 120),
            makeReading('2026-03-20T08:30:00', 100),
        ];
        const meals = [
            makeMeal('m1', '2026-03-20T07:30:00', 'Meal 1'),
        ];
        const results = analyzeAllMeals(readings, meals, []);
        expect(results.length).toBe(1);
        expect(results[0].mealId).toBe('m1');
    });
});
