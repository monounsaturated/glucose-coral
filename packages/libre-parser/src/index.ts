import type { GlucoseReading, MealEvent, RawCsvRow, GlucoseSource } from '@glucose/types';

// ─── Timestamp Parsing ─────────────────────────────────────

/**
 * Parse DD-MM-YYYY HH:mm timestamp to ISO string.
 * Accepts separators: - / . and space or T between date and time.
 */
export function parseLibreTimestamp(raw: string): string | null {
    const trimmed = raw.trim();
    // Match DD-MM-YYYY HH:mm (with various separators)
    const match = trimmed.match(
        /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})\s+(\d{1,2}):(\d{2})(?:\s+[A-Za-z]+)?$/,
    );
    if (!match) return null;

    const [, day, month, year, hour, minute] = match;
    const d = parseInt(day, 10);
    const m = parseInt(month, 10);
    const y = parseInt(year, 10);
    const h = parseInt(hour, 10);
    const min = parseInt(minute, 10);

    if (m < 1 || m > 12 || d < 1 || d > 31 || h > 23 || min > 59) return null;

    // Create date in local interpretation (no timezone conversion)
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${y}-${pad(m)}-${pad(d)}T${pad(h)}:${pad(min)}:00`;
}

// ─── CSV Parsing ───────────────────────────────────────────

/**
 * Split a CSV line respecting quoted fields.
 */
function splitCsvLine(line: string): string[] {
    const fields: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            fields.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    fields.push(current.trim());
    return fields;
}

/**
 * Find the header row in an Abbott Libre CSV.
 * The header row is the first row with enough columns that contains known column names.
 */
const KNOWN_COLUMNS = [
    'device timestamp',
    'historic glucose',
    'scan glucose',
    'record type',
];

function findHeaderRowIndex(lines: string[]): number {
    for (let i = 0; i < lines.length; i++) {
        const lower = lines[i].toLowerCase();
        const matchCount = KNOWN_COLUMNS.filter((col) => lower.includes(col)).length;
        if (matchCount >= 2) return i;
    }
    // Fallback: first row with many columns
    for (let i = 0; i < lines.length; i++) {
        const lower = lines[i].toLowerCase();
        if (lower.includes('device timestamp') && (lower.includes('historic glucose') || lower.includes('scan glucose'))) {
            return i;
        }
        if (splitCsvLine(lines[i]).length >= 5 && lower.includes('device')) return i;
    }
    return 0;
}

export interface LibreParseResult {
    readings: GlucoseReading[];
    meals: MealEvent[];
    rawRows: RawCsvRow[];
    headers: string[];
    skippedMetadataRows: number;
}

/**
 * Parse an Abbott FreeStyle Libre CSV file content.
 */
export function parseLibreCsv(csvContent: string): LibreParseResult {
    const sanitized = csvContent.replace(/^\uFEFF/, '');
    const lines = sanitized
        .split(/\r?\n/)
        .filter((line) => line.trim().length > 0);

    if (lines.length === 0) {
        return { readings: [], meals: [], rawRows: [], headers: [], skippedMetadataRows: 0 };
    }

    const headerIndex = findHeaderRowIndex(lines);
    const headerLine = lines[headerIndex];
    const headers = splitCsvLine(headerLine);

    // Build column index map (case-insensitive)
    const colIndex = new Map<string, number>();
    headers.forEach((h, i) => {
        colIndex.set(h.toLowerCase().trim(), i);
    });

    const getCol = (row: string[], ...candidates: string[]): string => {
        for (const name of candidates) {
            const idx = colIndex.get(name.toLowerCase());
            if (idx !== undefined && row[idx] !== undefined) {
                return row[idx].trim();
            }
        }
        return '';
    };

    const dataLines = lines.slice(headerIndex + 1);
    const readings: GlucoseReading[] = [];
    const meals: MealEvent[] = [];
    const rawRows: RawCsvRow[] = [];

    let mealCounter = 0;

    for (const line of dataLines) {
        const fields = splitCsvLine(line);
        if (fields.length < 3) continue;

        // Build raw row record
        const rawRow: RawCsvRow = {};
        headers.forEach((h, i) => {
            if (fields[i] !== undefined) rawRow[h] = fields[i];
        });
        rawRows.push(rawRow);

        // Extract timestamp
        const rawTs = getCol(fields, 'Device Timestamp');
        if (!rawTs) continue;
        const ts = parseLibreTimestamp(rawTs);
        if (!ts) continue;

        // Extract glucose reading
        const historicStr = getCol(fields, 'Historic Glucose mg/dL', 'Historic Glucose (mg/dL)');
        const scanStr = getCol(fields, 'Scan Glucose mg/dL', 'Scan Glucose (mg/dL)');
        const stripStr = getCol(fields, 'Strip Glucose mg/dL', 'Strip Glucose (mg/dL)');

        const historic = historicStr ? parseFloat(historicStr) : NaN;
        const scan = scanStr ? parseFloat(scanStr) : NaN;
        const strip = stripStr ? parseFloat(stripStr) : NaN;

        let glucoseValue: number | null = null;
        let glucoseSource: GlucoseSource = 'historic';

        if (!isNaN(historic)) {
            glucoseValue = historic;
            glucoseSource = 'historic';
        } else if (!isNaN(scan)) {
            glucoseValue = scan;
            glucoseSource = 'scan';
        } else if (!isNaN(strip)) {
            glucoseValue = strip;
            glucoseSource = 'strip';
        }

        if (glucoseValue !== null) {
            readings.push({
                timestamp: ts,
                rawTimestamp: rawTs,
                value: glucoseValue,
                source: glucoseSource,
            });
        }

        // Extract meal/food data from CSV
        const foodNotes = getCol(fields, 'Non-numeric Food');
        const carbsGramsStr = getCol(fields, 'Carbohydrates (grams)');
        const carbsServingsStr = getCol(fields, 'Carbohydrates (servings)');
        const notes = getCol(fields, 'Notes');

        const carbsGrams = carbsGramsStr ? parseFloat(carbsGramsStr) : NaN;
        const carbsServings = carbsServingsStr ? parseFloat(carbsServingsStr) : NaN;

        const hasFoodData = foodNotes || !isNaN(carbsGrams) || !isNaN(carbsServings);

        if (hasFoodData) {
            mealCounter++;
            const mealName = foodNotes || notes || `Meal ${mealCounter}`;
            const carbs = !isNaN(carbsGrams)
                ? carbsGrams
                : !isNaN(carbsServings)
                    ? carbsServings * 15  // rough estimate: 1 serving ≈ 15g carbs
                    : null;

            meals.push({
                id: `csv-meal-${mealCounter}`,
                timestamp: ts,
                rawTimestamp: rawTs,
                name: mealName,
                ingredients: foodNotes ? [foodNotes] : undefined,
                carbsGrams: carbs,
                carbsSource: carbs !== null ? 'csv-provided' : 'unknown',
                notes: notes || undefined,
                source: 'csv',
            });
        }
    }

    // Sort readings by timestamp
    readings.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    meals.sort((a, b) => a.timestamp.localeCompare(b.timestamp));

    return {
        readings,
        meals,
        rawRows,
        headers,
        skippedMetadataRows: headerIndex,
    };
}
