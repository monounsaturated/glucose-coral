import type { GlucoseReading, MealEvent, RawCsvRow, GlucoseSource } from '@glucose/types';

// ─── Timestamp Parsing ─────────────────────────────────────

/**
 * Parse Libre timestamps to normalized local ISO-like string.
 * Accepts:
 * - DD-MM-YYYY HH:mm[:ss]
 * - YYYY-MM-DD HH:mm[:ss]
 * - Optional trailing timezone tokens (e.g. UTC)
 */
export function parseLibreTimestamp(raw: string): string | null {
    const trimmed = raw.trim();
    const pad = (n: number) => n.toString().padStart(2, '0');

    const dayFirst = trimmed.match(
        /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})[ T](\d{1,2}):(\d{2})(?::(\d{2}))?(?:\s+[A-Za-z]+)?$/,
    );
    const yearFirst = trimmed.match(
        /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})[ T](\d{1,2}):(\d{2})(?::(\d{2}))?(?:\s+[A-Za-z]+)?$/,
    );

    const pick = dayFirst
        ? {
            y: parseInt(dayFirst[3], 10),
            m: parseInt(dayFirst[2], 10),
            d: parseInt(dayFirst[1], 10),
            h: parseInt(dayFirst[4], 10),
            min: parseInt(dayFirst[5], 10),
          }
        : yearFirst
          ? {
              y: parseInt(yearFirst[1], 10),
              m: parseInt(yearFirst[2], 10),
              d: parseInt(yearFirst[3], 10),
              h: parseInt(yearFirst[4], 10),
              min: parseInt(yearFirst[5], 10),
            }
          : null;

    if (!pick) return null;
    if (pick.m < 1 || pick.m > 12 || pick.d < 1 || pick.d > 31 || pick.h > 23 || pick.min > 59) {
        return null;
    }

    return `${pick.y}-${pad(pick.m)}-${pad(pick.d)}T${pad(pick.h)}:${pad(pick.min)}:00`;
}

// ─── CSV Parsing ───────────────────────────────────────────

function countDelimiterOutsideQuotes(line: string, delimiter: ',' | ';'): number {
    let inQuotes = false;
    let count = 0;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                i++;
            } else {
                inQuotes = !inQuotes;
            }
            continue;
        }
        if (char === delimiter && !inQuotes) count++;
    }
    return count;
}

function detectDelimiter(lines: string[]): ',' | ';' {
    let commaScore = 0;
    let semicolonScore = 0;
    for (const line of lines.slice(0, 60)) {
        commaScore += countDelimiterOutsideQuotes(line, ',');
        semicolonScore += countDelimiterOutsideQuotes(line, ';');
    }
    return semicolonScore > commaScore ? ';' : ',';
}

/**
 * Split a CSV line respecting quoted fields.
 */
function splitCsvLine(line: string, delimiter: ',' | ';'): string[] {
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
        } else if (char === delimiter && !inQuotes) {
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
 * Find the header row in an Abbott Libre CSV (English export).
 */
function isGlucoseHeader(lower: string): boolean {
    const hasTimestamp = lower.includes('device timestamp') || lower.includes('timestamp');

    const hasGlucose =
        lower.includes('historic glucose') ||
        lower.includes('scan glucose') ||
        (lower.includes('glucose') && (lower.includes('mg/dl') || lower.includes('mmol')));

    return hasTimestamp || hasGlucose;
}

function findHeaderRowIndex(lines: string[]): number {
    // First pass: look for rows containing two or more known column indicators
    for (let i = 0; i < lines.length; i++) {
        const lower = lines[i].toLowerCase();
        // Must contain both a timestamp column and a glucose column
        const hasTs = lower.includes('device timestamp') || lower.includes('timestamp');
        const hasGlc = lower.includes('glucose');
        if (hasTs && hasGlc) return i;
    }

    // Second pass: any row with enough delimiters and a glucose/device indicator
    for (let i = 0; i < lines.length; i++) {
        if (isGlucoseHeader(lines[i].toLowerCase())) {
            const commas = countDelimiterOutsideQuotes(lines[i], ',');
            const semis = countDelimiterOutsideQuotes(lines[i], ';');
            if (commas >= 3 || semis >= 3) return i;
        }
    }

    // Third pass: first row with many columns
    for (let i = 0; i < lines.length; i++) {
        const commas = countDelimiterOutsideQuotes(lines[i], ',');
        const semis = countDelimiterOutsideQuotes(lines[i], ';');
        if (commas >= 5 || semis >= 5) return i;
    }

    return 0;
}

function parseLocalizedNumber(raw: string): number {
    const normalized = raw.trim().replace(',', '.');
    return parseFloat(normalized);
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

    const delimiter = detectDelimiter(lines);
    const headerIndex = findHeaderRowIndex(lines);
    const headerLine = lines[headerIndex];
    const headers = splitCsvLine(headerLine, delimiter);

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
        const fields = splitCsvLine(line, delimiter);
        if (fields.length < 3) continue;

        // Build raw row record
        const rawRow: RawCsvRow = {};
        headers.forEach((h, i) => {
            if (fields[i] !== undefined) rawRow[h] = fields[i];
        });
        rawRows.push(rawRow);

        // Extract timestamp (English export)
        const rawTs = getCol(
            fields,
            'Device Timestamp',
            'Timestamp',
        );
        if (!rawTs) continue;
        const ts = parseLibreTimestamp(rawTs);
        if (!ts) continue;

        // Extract glucose reading (English export; supports mg/dL or mmol/L headers)
        const historicStr = getCol(
            fields,
            'Historic Glucose mg/dL',
            'Historic Glucose (mg/dL)',
            'Historic Glucose mmol/L',
            'Historic Glucose (mmol/L)',
        );
        const scanStr = getCol(
            fields,
            'Scan Glucose mg/dL',
            'Scan Glucose (mg/dL)',
            'Scan Glucose mmol/L',
            'Scan Glucose (mmol/L)',
        );
        const stripStr = getCol(
            fields,
            'Strip Glucose mg/dL',
            'Strip Glucose (mg/dL)',
            'Strip Glucose mmol/L',
            'Strip Glucose (mmol/L)',
        );

        const usesMmol = headers.some((h) => {
            const lower = h.toLowerCase();
            return lower.includes('glucose') && lower.includes('mmol/l');
        });
        const toMgDl = (n: number) => (usesMmol ? Math.round(n * 18) : n);

        const historic = historicStr ? toMgDl(parseLocalizedNumber(historicStr)) : NaN;
        const scan = scanStr ? toMgDl(parseLocalizedNumber(scanStr)) : NaN;
        const strip = stripStr ? toMgDl(parseLocalizedNumber(stripStr)) : NaN;

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

        const carbsGrams = carbsGramsStr ? parseLocalizedNumber(carbsGramsStr) : NaN;
        const carbsServings = carbsServingsStr ? parseLocalizedNumber(carbsServingsStr) : NaN;

        const hasFoodData = Boolean(foodNotes) || (!isNaN(carbsGrams) && carbsGrams > 0) || (!isNaN(carbsServings) && carbsServings > 0);

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
