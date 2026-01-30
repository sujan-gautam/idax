import { logger } from '@project-ida/logger';

export interface CleanOptions {
    dropDuplicates?: boolean;
    fillMissing?: boolean;
    removeOutliers?: boolean;
    standardizeText?: boolean;
    protectedColumns?: string[];
    validateSchema?: boolean;
    detectIntent?: boolean;
}

export interface CleanLog {
    timestamp: string;
    action: string;
    reason: string;
    count: number;
    affectedColumns?: string[];
}

export interface CleanSummary {
    originalRows: number;
    finalRows: number;
    droppedDuplicates: number;
    filledMissing: number;
    outliersCapped: number;
    textStandardized: number;
    beforeQualityScore: number;
    afterQualityScore: number;
    logs: CleanLog[];
    intents: Record<string, string>;
    schemaValidation: {
        isValid: boolean;
        errors: string[];
    };
}

export function calculateQualityScore(data: any[], schema: any): number {
    if (!data.length) return 0;
    const columns = schema.columns || [];
    const totalCells = data.length * columns.length;

    // Missingness
    let missingCount = 0;
    for (const row of data) {
        for (const col of columns) {
            const val = row[col.name];
            if (val === null || val === undefined || val === '') missingCount++;
        }
    }
    const missingPenalty = (missingCount / totalCells) * 100;

    // Duplicates
    const uniqueRows = new Set(data.map(row => JSON.stringify(row)));
    const duplicateCount = data.length - uniqueRows.size;
    const duplicatePenalty = (duplicateCount / data.length) * 50;

    // Outliers (simple estimate)
    let outlierCount = 0;
    for (const col of columns) {
        if (col.type === 'number' || col.type === 'integer' || col.type === 'float') {
            const values = data.map(row => Number(row[col.name])).filter(n => !isNaN(n)).sort((a, b) => a - b);
            if (values.length > 4) {
                const q1 = values[Math.floor(values.length * 0.25)];
                const q3 = values[Math.floor(values.length * 0.75)];
                const iqr = q3 - q1;
                const lb = q1 - 1.5 * iqr;
                const ub = q3 + 1.5 * iqr;
                outlierCount += values.filter(v => v < lb || v > ub).length;
            }
        }
    }
    const outlierPenalty = (outlierCount / totalCells) * 20;

    const score = 100 - missingPenalty - duplicatePenalty - outlierPenalty;
    return Math.max(0, Math.min(100, Math.round(score * 10) / 10));
}

function detectColumnIntent(columnName: string, values: any[], type: string): string {
    const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '');
    if (nonNullValues.length === 0) return 'unknown';

    const lowerName = columnName.toLowerCase();

    // 1. DATE detection
    if (lowerName.includes('date') || lowerName.includes('time') || lowerName.includes('created') || lowerName.includes('updated')) {
        return 'temporal';
    }

    // 2. ID detection
    if (lowerName === 'id' || lowerName.endsWith('_id') || lowerName.endsWith('id')) {
        const uniqueRatio = new Set(nonNullValues).size / nonNullValues.length;
        if (uniqueRatio > 0.9) return 'identifier';
    }

    // 3. BOOLEAN detection
    if (type === 'boolean') return 'binary_flag';
    const uniqueValues = Array.from(new Set(nonNullValues));
    if (uniqueValues.length === 2) {
        const vals = uniqueValues.map(v => String(v).toLowerCase());
        if (vals.includes('true') || vals.includes('false') || vals.includes('yes') || vals.includes('no') || vals.includes('1') || vals.includes('0')) {
            return 'binary_flag';
        }
    }

    // 4. CATEGORICAL detection
    const uniqueCount = uniqueValues.length;
    const uniqueRatio = uniqueCount / nonNullValues.length;
    if (type === 'string' && (uniqueRatio < 0.1 || uniqueCount < 20)) {
        return 'categorical';
    }

    // 5. QUANTITATIVE
    if (type === 'number' || type === 'integer' || type === 'float') {
        return 'quantitative';
    }

    // 6. TEXT
    if (type === 'string' && uniqueRatio > 0.5) {
        return 'text_analysis';
    }

    return 'descriptive';
}

export function runAutoClean(data: any[], schema: any, options: CleanOptions = {}): { data: any[], summary: CleanSummary } {
    const opts = {
        dropDuplicates: true,
        fillMissing: true,
        removeOutliers: true,
        standardizeText: true,
        protectedColumns: [],
        validateSchema: true,
        detectIntent: true,
        ...options
    };

    let cleanedData = [...data];
    const columns = schema.columns || [];
    const protectedCols = new Set(opts.protectedColumns);

    const logs: CleanLog[] = [];
    const intents: Record<string, string> = {};
    const schemaErrors: string[] = [];

    // 0. BEFORE QUALITY
    const beforeQualityScore = calculateQualityScore(data, schema);

    // 1. SCHEMA VALIDATION
    if (opts.validateSchema) {
        const dataKeys = data.length > 0 ? Object.keys(data[0]) : [];
        const schemaKeys = columns.map((c: any) => c.name);

        for (const sk of schemaKeys) {
            if (!dataKeys.includes(sk)) schemaErrors.push(`Missing column: ${sk}`);
        }
        for (const dk of dataKeys) {
            if (!schemaKeys.includes(dk)) schemaErrors.push(`Extra column in data: ${dk}`);
        }

        if (schemaErrors.length > 0) {
            logs.push({
                timestamp: new Date().toISOString(),
                action: 'Schema Validation',
                reason: 'Data structure does not perfectly match schema definition',
                count: schemaErrors.length
            });
        }
    }

    // 2. INTENT DETECTION
    if (opts.detectIntent) {
        for (const col of columns) {
            const values = cleanedData.map(row => row[col.name]);
            intents[col.name] = detectColumnIntent(col.name, values, col.type);
        }
        logs.push({
            timestamp: new Date().toISOString(),
            action: 'Intent Detection',
            reason: 'Analyzed semantic purpose of columns for optimized processing',
            count: columns.length,
            affectedColumns: Object.keys(intents)
        });
    }

    // 3. DROP DUPLICATES
    let droppedDuplicates = 0;
    if (opts.dropDuplicates) {
        const initialCount = cleanedData.length;
        const seen = new Set();
        cleanedData = cleanedData.filter(row => {
            const record = { ...row };
            // Ignore protected columns when checking for duplicates? Usually we check full row.
            const str = JSON.stringify(record);
            if (seen.has(str)) return false;
            seen.add(str);
            return true;
        });
        droppedDuplicates = initialCount - cleanedData.length;
        if (droppedDuplicates > 0) {
            logs.push({
                timestamp: new Date().toISOString(),
                action: 'Deduplication',
                reason: 'Removed exact duplicate rows to prevent statistical bias',
                count: droppedDuplicates
            });
        }
    }

    // 4. COLUMN-BASED CLEANING
    let filledMissing = 0;
    let outliersCapped = 0;
    let textStandardized = 0;

    for (const col of columns) {
        const colName = col.name;
        if (protectedCols.has(colName)) continue;

        const colType = col.type;
        const intent = intents[colName];

        // 4a. FILL MISSING
        if (opts.fillMissing) {
            const colValues = cleanedData.map(row => row[colName]);
            const missingInCol = colValues.filter(v => v === null || v === undefined || v === '').length;

            if (missingInCol > 0) {
                if (colType === 'number' || colType === 'integer' || colType === 'float') {
                    const numbers = colValues.filter(v => typeof v === 'number').sort((a, b) => a - b);
                    const median = numbers.length > 0 ? numbers[Math.floor(numbers.length / 2)] : 0;
                    cleanedData.forEach(row => {
                        if (row[colName] === null || row[colName] === undefined || row[colName] === '') {
                            row[colName] = median;
                            filledMissing++;
                        }
                    });
                } else {
                    const fallback = intent === 'categorical' ? 'NA' : 'Unknown';
                    cleanedData.forEach(row => {
                        if (row[colName] === null || row[colName] === undefined || row[colName] === '') {
                            row[colName] = fallback;
                            filledMissing++;
                        }
                    });
                }
            }
        }

        // 4b. STANDARDIZE TEXT
        if (opts.standardizeText && (colType === 'string' || colType === 'text')) {
            cleanedData.forEach(row => {
                if (typeof row[colName] === 'string') {
                    const original = row[colName];
                    row[colName] = row[colName].trim();
                    if (original !== row[colName]) textStandardized++;
                }
            });
        }

        // 4c. OUTLIERS (IQR)
        if (opts.removeOutliers && (colType === 'number' || colType === 'integer' || colType === 'float') && intent !== 'identifier') {
            const numbers = cleanedData.map(row => Number(row[colName])).filter(n => !isNaN(n)).sort((a, b) => a - b);
            if (numbers.length > 4) {
                const q1 = numbers[Math.floor(numbers.length * 0.25)];
                const q3 = numbers[Math.floor(numbers.length * 0.75)];
                const iqr = q3 - q1;
                const lb = q1 - 1.5 * iqr;
                const ub = q3 + 1.5 * iqr;

                cleanedData.forEach(row => {
                    const val = Number(row[colName]);
                    if (!isNaN(val)) {
                        if (val < lb) {
                            row[colName] = lb;
                            outliersCapped++;
                        } else if (val > ub) {
                            row[colName] = ub;
                            outliersCapped++;
                        }
                    }
                });
            }
        }
    }

    if (filledMissing > 0) {
        logs.push({
            timestamp: new Date().toISOString(),
            action: 'Imputation',
            reason: 'Identified missing values and applied intelligent fill strategy (Median/Unknown)',
            count: filledMissing
        });
    }
    if (outliersCapped > 0) {
        logs.push({
            timestamp: new Date().toISOString(),
            action: 'Outlier Capping',
            reason: 'Capped extreme values using Tukey\'s Fences (1.5x IQR) to stabilize distribution',
            count: outliersCapped
        });
    }
    if (textStandardized > 0) {
        logs.push({
            timestamp: new Date().toISOString(),
            action: 'Normalization',
            reason: 'Trimmed whitespace and standardized string formatting',
            count: textStandardized
        });
    }

    // 5. AFTER QUALITY
    const afterQualityScore = calculateQualityScore(cleanedData, schema);

    return {
        data: cleanedData,
        summary: {
            originalRows: data.length,
            finalRows: cleanedData.length,
            droppedDuplicates,
            filledMissing,
            outliersCapped,
            textStandardized,
            beforeQualityScore,
            afterQualityScore,
            logs,
            intents,
            schemaValidation: {
                isValid: schemaErrors.length === 0,
                errors: schemaErrors
            }
        }
    };
}
