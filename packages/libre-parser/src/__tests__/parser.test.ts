import { describe, it, expect } from 'vitest';
import { parseLibreCsv, parseLibreTimestamp } from '../index';

describe('parseLibreTimestamp', () => {
    it('parses DD-MM-YYYY HH:mm format', () => {
        expect(parseLibreTimestamp('23-03-2026 10:34')).toBe('2026-03-23T10:34:00');
    });

    it('parses single-digit day/month', () => {
        expect(parseLibreTimestamp('1-3-2026 09:05')).toBe('2026-03-01T09:05:00');
    });

    it('returns null for invalid format', () => {
        expect(parseLibreTimestamp('not-a-date')).toBeNull();
        expect(parseLibreTimestamp('')).toBeNull();
    });

    it('returns null for invalid month', () => {
        expect(parseLibreTimestamp('01-13-2026 10:00')).toBeNull();
    });

    it('returns null for invalid hour', () => {
        expect(parseLibreTimestamp('01-01-2026 25:00')).toBeNull();
    });
});

const SAMPLE_CSV = `FreeStyle Libre Report
Generated: 20-03-2026 08:00

Device,Serial Number,Device Timestamp,Record Type,Historic Glucose mg/dL,Scan Glucose mg/dL,Non-numeric Rapid-Acting Insulin,Rapid-Acting Insulin (units),Non-numeric Food,Carbohydrates (grams),Carbohydrates (servings),Non-numeric Long-Acting Insulin,Long-Acting Insulin (units),Notes,Strip Glucose mg/dL,Ketone mmol/L,Meal Insulin (units),Correction Insulin (units),User Change Insulin (units)
FreeStyleLibre,ABC123,20-03-2026 06:00,0,92,,,,,,,,,,,,,,
FreeStyleLibre,ABC123,20-03-2026 06:15,0,90,,,,,,,,,,,,,,
FreeStyleLibre,ABC123,20-03-2026 07:45,0,88,,,,Oatmeal with banana,45,,,,,Breakfast,,,,
FreeStyleLibre,ABC123,20-03-2026 08:00,0,,95,,,,,,,,,,,,,`;

describe('parseLibreCsv', () => {
    it('skips metadata rows and finds header', () => {
        const result = parseLibreCsv(SAMPLE_CSV);
        expect(result.skippedMetadataRows).toBe(2);
        expect(result.headers.length).toBeGreaterThan(5);
    });

    it('extracts glucose readings', () => {
        const result = parseLibreCsv(SAMPLE_CSV);
        expect(result.readings.length).toBe(4);
    });

    it('prefers historic glucose over scan glucose', () => {
        const result = parseLibreCsv(SAMPLE_CSV);
        // Row with historic = 92
        expect(result.readings[0].value).toBe(92);
        expect(result.readings[0].source).toBe('historic');
    });

    it('falls back to scan glucose when historic is empty', () => {
        const result = parseLibreCsv(SAMPLE_CSV);
        // Last row has scan = 95, no historic
        const scanReading = result.readings.find((r) => r.source === 'scan');
        expect(scanReading).toBeDefined();
        expect(scanReading!.value).toBe(95);
    });

    it('extracts meal data from food columns', () => {
        const result = parseLibreCsv(SAMPLE_CSV);
        expect(result.meals.length).toBe(1);
        expect(result.meals[0].name).toBe('Oatmeal with banana');
        expect(result.meals[0].carbsGrams).toBe(45);
        expect(result.meals[0].carbsSource).toBe('csv-provided');
    });

    it('sorts readings by timestamp', () => {
        const result = parseLibreCsv(SAMPLE_CSV);
        for (let i = 1; i < result.readings.length; i++) {
            expect(
                result.readings[i].timestamp >= result.readings[i - 1].timestamp
            ).toBe(true);
        }
    });

    it('handles empty CSV', () => {
        const result = parseLibreCsv('');
        expect(result.readings.length).toBe(0);
        expect(result.meals.length).toBe(0);
    });

    it('preserves raw rows', () => {
        const result = parseLibreCsv(SAMPLE_CSV);
        expect(result.rawRows.length).toBe(4);
    });
});
