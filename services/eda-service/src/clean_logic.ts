import { logger } from '@project-ida/logger';

export interface CleanOptions {
    dropDuplicates?: boolean;
    fillMissing?: boolean;
    removeOutliers?: boolean;
    standardizeText?: boolean;
}

export function runAutoClean(data: any[], schema: any, options: CleanOptions = {
    dropDuplicates: true,
    fillMissing: true,
    removeOutliers: true,
    standardizeText: true
}): { data: any[], summary: any } {
    let cleanedData = [...data];
    const columns = schema.columns || [];
    const summary: any = {
        originalRows: data.length,
        droppedDuplicates: 0,
        filledMissing: 0,
        outliersCapped: 0,
        textStandardized: 0
    };

    // 1. DROP DUPLICATES
    if (options.dropDuplicates) {
        const seen = new Set();
        const initialCount = cleanedData.length;
        cleanedData = cleanedData.filter(row => {
            const str = JSON.stringify(row);
            if (seen.has(str)) return false;
            seen.add(str);
            return true;
        });
        summary.droppedDuplicates = initialCount - cleanedData.length;
    }

    // 2. COLUMN-BASED CLEANING
    for (const col of columns) {
        const colName = col.name;
        const colType = col.type;

        // Collect stats for this column if needed
        const values = cleanedData.map(row => row[colName]);
        const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '');

        // 2a. FILL MISSING VALUES
        if (options.fillMissing) {
            if (colType === 'number' || colType === 'integer' || colType === 'float') {
                const numbers = nonNullValues.map(Number).filter(n => !isNaN(n)).sort((a, b) => a - b);
                if (numbers.length > 0) {
                    const median = numbers[Math.floor(numbers.length / 2)];
                    cleanedData.forEach(row => {
                        if (row[colName] === null || row[colName] === undefined || row[colName] === '') {
                            row[colName] = median;
                            summary.filledMissing++;
                        }
                    });
                }
            } else {
                cleanedData.forEach(row => {
                    if (row[colName] === null || row[colName] === undefined || row[colName] === '') {
                        row[colName] = 'Unknown';
                        summary.filledMissing++;
                    }
                });
            }
        }

        // 2b. STANDARDIZE TEXT
        if (options.standardizeText && (colType === 'string' || colType === 'text')) {
            cleanedData.forEach(row => {
                if (typeof row[colName] === 'string') {
                    const original = row[colName];
                    row[colName] = row[colName].trim();
                    if (original !== row[colName]) {
                        summary.textStandardized++;
                    }
                }
            });
        }

        // 2c. REMOVE/CAP OUTLIERS (IQR Method)
        if (options.removeOutliers && (colType === 'number' || colType === 'integer' || colType === 'float')) {
            const numbers = cleanedData.map(row => Number(row[colName])).filter(n => !isNaN(n)).sort((a, b) => a - b);
            if (numbers.length > 4) {
                const q1 = numbers[Math.floor(numbers.length * 0.25)];
                const q3 = numbers[Math.floor(numbers.length * 0.75)];
                const iqr = q3 - q1;
                const lowerBound = q1 - 1.5 * iqr;
                const upperBound = q3 + 1.5 * iqr;

                cleanedData.forEach(row => {
                    const val = Number(row[colName]);
                    if (!isNaN(val)) {
                        if (val < lowerBound) {
                            row[colName] = lowerBound;
                            summary.outliersCapped++;
                        } else if (val > upperBound) {
                            row[colName] = upperBound;
                            summary.outliersCapped++;
                        }
                    }
                });
            }
        }
    }

    summary.finalRows = cleanedData.length;
    return { data: cleanedData, summary };
}
