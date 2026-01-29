import { logger } from '@project-ida/logger';

export function runEDA(data: any[], schema: any): any {
    const columns = schema.columns || [];

    return {
        overview: computeOverview(data, columns),
        distributions: computeDistributions(data, columns),
        correlations: computeCorrelations(data, columns),
        outliers: computeOutliers(data, columns),
        dataQuality: computeDataQuality(data, columns)
    };
}

/**
 * OVERVIEW STATISTICS
 */
function computeOverview(data: any[], columns: any[]): any {
    const rowCount = data.length;
    const columnCount = columns.length;

    // Duplicate detection
    const uniqueRows = new Set(data.map(row => JSON.stringify(row)));
    const duplicateCount = rowCount - uniqueRows.size;

    // Overall missingness
    let totalCells = rowCount * columnCount;
    let missingCells = 0;

    for (const row of data) {
        for (const col of columns) {
            const value = row[col.name];
            if (value === null || value === undefined || value === '') {
                missingCells++;
            }
        }
    }

    const missingRatio = totalCells > 0 ? (missingCells / totalCells) : 0;

    return {
        rowCount,
        columnCount,
        duplicateRows: duplicateCount,
        duplicateRatio: Math.round((duplicateCount / Math.max(rowCount, 1)) * 10000) / 100,
        totalCells,
        missingCells,
        missingRatio: Math.round(missingRatio * 10000) / 100,
        columnTypes: columns.reduce((acc: any, col: any) => {
            acc[col.type] = (acc[col.type] || 0) + 1;
            return acc;
        }, {})
    };
}

/**
 * DISTRIBUTIONS - Numeric and Categorical
 */
function computeDistributions(data: any[], columns: any[]): any {
    const distributions: any = {};
    const rowCount = data.length;

    for (const col of columns) {
        const rawValues = data.map(row => row[col.name]);
        const nonNullValues = rawValues.filter(v => v !== null && v !== undefined && v !== '');
        const missing = rowCount - nonNullValues.length;
        const uniqueValues = new Set(nonNullValues);

        let distData: any = {
            missingCount: missing,
            missingRatio: Math.round((missing / Math.max(rowCount, 1)) * 10000) / 100,
            uniqueCount: uniqueValues.size,
            uniqueRatio: Math.round((uniqueValues.size / Math.max(nonNullValues.length, 1)) * 10000) / 100
        };

        if (col.type === 'number' || col.type === 'integer' || col.type === 'float') {
            const numbers = nonNullValues.map(Number).filter(n => !isNaN(n));
            if (numbers.length > 0) {
                numbers.sort((a, b) => a - b);
                const min = numbers[0];
                const max = numbers[numbers.length - 1];
                const mean = numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
                const variance = numbers.reduce((sum, n) => sum + Math.pow(n - mean, 2), 0) / numbers.length;
                const std = Math.sqrt(variance);
                const q1 = numbers[Math.floor(numbers.length * 0.25)];
                const median = numbers[Math.floor(numbers.length * 0.5)];
                const q3 = numbers[Math.floor(numbers.length * 0.75)];
                const skewness = numbers.length > 2 ?
                    numbers.reduce((sum, n) => sum + Math.pow((n - mean) / Math.max(std, 0.0001), 3), 0) / numbers.length : 0;

                // Kurtosis
                const kurtosis = numbers.length > 3 ?
                    (numbers.reduce((sum, n) => sum + Math.pow((n - mean) / Math.max(std, 0.0001), 4), 0) / numbers.length) - 3 : 0;

                const iqr = q3 - q1;
                const binWidth = iqr > 0 ? 2 * iqr / Math.pow(numbers.length, 1 / 3) : (max - min) / 10;
                const binCount = Math.min(Math.max(Math.ceil((max - min) / Math.max(binWidth, 0.0001)), 5), 50);

                const binEdges: number[] = [];
                const counts: number[] = Array(binCount).fill(0);
                const step = (max - min) / binCount;

                for (let i = 0; i <= binCount; i++) {
                    binEdges.push(min + i * step);
                }

                for (const num of numbers) {
                    const binIndex = Math.min(Math.floor((num - min) / Math.max(step, 0.0001)), binCount - 1);
                    if (binIndex >= 0) counts[binIndex]++;
                }

                distData.histogram = { counts, bin_edges: binEdges };
                distData.statistics = {
                    min: Math.round(min * 100) / 100,
                    max: Math.round(max * 100) / 100,
                    mean: Math.round(mean * 100) / 100,
                    median: Math.round(median * 100) / 100,
                    std: Math.round(std * 100) / 100,
                    q1: Math.round(q1 * 100) / 100,
                    q3: Math.round(q3 * 100) / 100,
                    skewness: Math.round(skewness * 1000) / 1000,
                    kurtosis: Math.round(kurtosis * 1000) / 1000
                };
            }
        } else {
            const frequencies: Record<string, number> = {};
            for (const val of nonNullValues) {
                const key = String(val);
                frequencies[key] = (frequencies[key] || 0) + 1;
            }

            distData.value_counts = frequencies;

            const total = nonNullValues.length;
            const sortedCounts = Object.values(frequencies).sort((a, b) => b - a);
            const entropy = total > 0 ? -sortedCounts.reduce((sum, count) => {
                const p = count / total;
                return sum + (p * Math.log2(p));
            }, 0) : 0;

            distData.entropy = Math.round(entropy * 1000) / 1000;
        }

        distributions[col.name] = distData;
    }

    return distributions;
}

/**
 * CORRELATIONS
 */
function computeCorrelations(data: any[], columns: any[]): any {
    const numericColumns = columns.filter(c =>
        c.type === 'number' || c.type === 'integer' || c.type === 'float'
    );

    if (numericColumns.length < 2) {
        return {
            method: 'pearson',
            matrix: {},
            correlations: [],
            columns: [],
            message: 'Need at least 2 numeric columns for correlation'
        };
    }

    const matrix: any = {};
    const correlations: any[] = [];
    const columnNames = numericColumns.map(c => c.name);

    for (let i = 0; i < numericColumns.length; i++) {
        const col1 = numericColumns[i];
        matrix[col1.name] = {};

        for (let j = 0; j < numericColumns.length; j++) {
            const col2 = numericColumns[j];

            if (i === j) {
                matrix[col1.name][col2.name] = 1.0;
            } else {
                const values1 = data.map(row => Number(row[col1.name])).filter(n => !isNaN(n));
                const values2 = data.map(row => Number(row[col2.name])).filter(n => !isNaN(n));

                const correlation = pearsonCorrelation(values1, values2);
                const roundedCorr = Math.round(correlation * 1000) / 1000;
                matrix[col1.name][col2.name] = roundedCorr;

                if (i < j) {
                    const absCorr = Math.abs(roundedCorr);
                    let strength = 'weak';
                    if (absCorr > 0.7) strength = 'strong';
                    else if (absCorr > 0.4) strength = 'moderate';

                    correlations.push({
                        column1: col1.name,
                        column2: col2.name,
                        correlation: roundedCorr,
                        p_value: null,
                        strength
                    });
                }
            }
        }
    }

    correlations.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));

    return {
        method: 'pearson',
        matrix,
        correlations,
        columns: columnNames
    };
}

function pearsonCorrelation(x: number[], y: number[]): number {
    const n = Math.min(x.length, y.length);

    if (n === 0) return 0;

    const meanX = x.slice(0, n).reduce((sum, val) => sum + val, 0) / n;
    const meanY = y.slice(0, n).reduce((sum, val) => sum + val, 0) / n;

    let numerator = 0;
    let sumSqX = 0;
    let sumSqY = 0;

    for (let i = 0; i < n; i++) {
        const dx = x[i] - meanX;
        const dy = y[i] - meanY;
        numerator += dx * dy;
        sumSqX += dx * dx;
        sumSqY += dy * dy;
    }

    const denominator = Math.sqrt(sumSqX * sumSqY);

    return denominator === 0 ? 0 : numerator / denominator;
}

/**
 * OUTLIERS
 */
function computeOutliers(data: any[], columns: any[]): any {
    const outliers: any = {};

    for (const col of columns) {
        if (col.type !== 'number' && col.type !== 'integer' && col.type !== 'float') continue;

        const values = data.map(row => Number(row[col.name])).filter(n => !isNaN(n));

        if (values.length === 0) continue;

        const sorted = [...values].sort((a, b) => a - b);

        const q1 = sorted[Math.floor(sorted.length * 0.25)];
        const q3 = sorted[Math.floor(sorted.length * 0.75)];
        const iqr = q3 - q1;

        const lowerBound = q1 - 1.5 * iqr;
        const upperBound = q3 + 1.5 * iqr;

        const outlierValues = sorted.filter(v => v < lowerBound || v > upperBound);

        outliers[col.name] = {
            method: 'IQR',
            count: outlierValues.length,
            percentage: Math.round((outlierValues.length / values.length) * 10000) / 100,
            lowerBound: Math.round(lowerBound * 100) / 100,
            upperBound: Math.round(upperBound * 100) / 100,
            examples: outlierValues.slice(0, 10).map(v => Math.round(v * 100) / 100)
        };
    }

    return outliers;
}

/**
 * QUALITY
 */
function computeDataQuality(data: any[], columns: any[]): any {
    const issues: any[] = [];

    for (const col of columns) {
        const values = data.map(row => row[col.name]);
        const nullCount = values.filter(v => v === null || v === undefined || v === '').length;
        const nullRatio = (nullCount / values.length) * 100;

        if (nullRatio > 50) {
            issues.push({
                column: col.name,
                type: 'null_spike',
                severity: 'high',
                message: `${Math.round(nullRatio)}% missing values`,
                recommendation: 'Consider imputation or dropping column'
            });
        }

        const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '');
        const uniqueValues = new Set(nonNullValues);
        if (nonNullValues.length > 0 && uniqueValues.size === 1) {
            issues.push({
                column: col.name,
                type: 'constant_column',
                severity: 'medium',
                message: 'All values are the same',
                recommendation: 'Consider dropping column'
            });
        }

        const uniqueRatio = (uniqueValues.size / Math.max(nonNullValues.length, 1)) * 100;
        if ((col.type === 'string' || col.type === 'text') && uniqueRatio > 95 && nonNullValues.length > 10) {
            issues.push({
                column: col.name,
                type: 'high_cardinality',
                severity: 'low',
                message: `${Math.round(uniqueRatio)}% unique values`,
                recommendation: 'May need grouping or encoding'
            });
        }
    }

    return {
        totalIssues: issues.length,
        summary: {
            high: issues.filter(i => i.severity === 'high').length,
            medium: issues.filter(i => i.severity === 'medium').length,
            low: issues.filter(i => i.severity === 'low').length
        },
        issues
    };
}
