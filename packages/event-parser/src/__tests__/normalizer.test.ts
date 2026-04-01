import { describe, it, expect } from 'vitest';
import { extractEventsFromTextBasic, parseDocumentTimestamp } from '../index';

describe('parseDocumentTimestamp', () => {
    it('parses DD-MM-YYYY HH:mm', () => {
        expect(parseDocumentTimestamp('20-03-2026 12:30')).toBe('2026-03-20T12:30:00');
    });

    it('returns null for invalid timestamp', () => {
        expect(parseDocumentTimestamp('invalid')).toBeNull();
    });
});

describe('extractEventsFromTextBasic', () => {
    it('extracts meals from document text', () => {
        const text = `20-03-2026 07:45 Breakfast: Oatmeal with banana
20-03-2026 12:30 Lunch: Chicken salad`;

        const result = extractEventsFromTextBasic(text);
        expect(result.meals.length).toBe(2);
        expect(result.meals[0].timestamp).toBe('2026-03-20T07:45:00');
    });

    it('extracts workouts from document text', () => {
        const text = `21-03-2026 13:00 Walked for 20 minutes after lunch`;

        const result = extractEventsFromTextBasic(text);
        expect(result.workouts.length).toBe(1);
        expect(result.workouts[0].type).toBe('walk');
        expect(result.workouts[0].durationMinutes).toBe(20);
    });

    it('identifies jogging workouts', () => {
        const text = `21-03-2026 18:00 Jogging for 30 minutes`;

        const result = extractEventsFromTextBasic(text);
        expect(result.workouts.length).toBe(1);
        expect(result.workouts[0].type).toBe('jogging');
    });

    it('handles empty text', () => {
        const result = extractEventsFromTextBasic('');
        expect(result.meals.length).toBe(0);
        expect(result.workouts.length).toBe(0);
    });

    it('extracts meals and workouts from french bullet-style notes', () => {
        const text = `Mardi 31/03/2026:
- 9h17: 1 carotte crue
- 13h (restaurant japonais):
- Soupe miso
- Salade de choux
- (13h25) 16 California crevette avocat
- Fini à 13h35
- marche de 13h35 à 13h45
- 18h58:
- 500g patate bouillie
- 210g poulet blanc
- 4 cac miel
- Fini à 20h01`;

        const result = extractEventsFromTextBasic(text);
        expect(result.meals.length).toBeGreaterThanOrEqual(3);
        expect(result.workouts.length).toBeGreaterThanOrEqual(1);
        expect(result.meals.some((m) => m.notes?.toLowerCase().includes('carotte'))).toBe(true);
        expect(result.meals.some((m) => m.notes?.toLowerCase().includes('california'))).toBe(true);
    });
});
