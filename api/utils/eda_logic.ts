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

function computeOverview(data: any[], columns: any[]): any {
    const rowCount = data.length;
    const columnCount = columns.length;
    const uniqueRows = new Set(data.map(row => JSON.stringify(row)));
    const duplicateCount = rowCount - uniqueRows.size;

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

        if (col.type === 'number') {
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

                const binCount = 10;
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
                };
            }
        } else {
            const frequencies: Record<string, number> = {};
            for (const val of nonNullValues.slice(0, 1000)) { // Sample for performance
                const key = String(val);
                frequencies[key] = (frequencies[key] || 0) + 1;
            }
            distData.value_counts = frequencies;
        }
        distributions[col.name] = distData;
    }
    return distributions;
}

function computeCorrelations(data: any[], columns: any[]): any {
    const numericColumns = columns.filter(c => c.type === 'number');
    if (numericColumns.length < 2) return { correlations: [] };

    const correlations: any[] = [];
    for (let i = 0; i < Math.min(numericColumns.length, 10); i++) {
        for (let j = i + 1; j < Math.min(numericColumns.length, 10); j++) {
            const col1 = numericColumns[i];
            const col2 = numericColumns[j];
            const v1 = data.map(r => Number(r[col1.name])).filter(n => !isNaN(n));
            const v2 = data.map(r => Number(r[col2.name])).filter(n => !isNaN(n));

            const corr = pearsonCorrelation(v1, v2);
            correlations.push({
                column1: col1.name,
                column2: col2.name,
                correlation: Math.round(corr * 1000) / 1000,
                strength: Math.abs(corr) > 0.7 ? 'strong' : Math.abs(corr) > 0.4 ? 'moderate' : 'weak'
            });
        }
    }
    return { correlations: correlations.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation)) };
}

function pearsonCorrelation(x: number[], y: number[]): number {
    const n = Math.min(x.length, y.length);
    if (n === 0) return 0;
    const meanX = x.slice(0, n).reduce((s, v) => s + v, 0) / n;
    const meanY = y.slice(0, n).reduce((s, v) => s + v, 0) / n;
    let num = 0, den1 = 0, den2 = 0;
    for (let i = 0; i < n; i++) {
        const dx = x[i] - meanX, dy = y[i] - meanY;
        num += dx * dy; den1 += dx * dx; den2 += dy * dy;
    }
    const den = Math.sqrt(den1 * den2);
    return den === 0 ? 0 : num / den;
}

function computeOutliers(data: any[], columns: any[]): any {
    const outliers: any = {};
    for (const col of columns) {
        if (col.type !== 'number') continue;
        const values = data.map(row => Number(row[col.name])).filter(n => !isNaN(n)).sort((a, b) => a - b);
        if (values.length < 4) continue;
        const q1 = values[Math.floor(values.length * 0.25)];
        const q3 = values[Math.floor(values.length * 0.75)];
        const iqr = q3 - q1;
        const lower = q1 - 1.5 * iqr, upper = q3 + 1.5 * iqr;
        const out = values.filter(v => v < lower || v > upper);
        outliers[col.name] = { count: out.length, percentage: Math.round((out.length / values.length) * 100) };
    }
    return outliers;
}

function computeDataQuality(data: any[], columns: any[]): any {
    const issues: any[] = [];
    for (const col of columns) {
        const values = data.map(row => row[col.name]);
        const nulls = values.filter(v => v === null || v === undefined || v === '').length;
        const ratio = (nulls / values.length) * 100;
        if (ratio > 50) issues.push({ column: col.name, severity: 'high', message: `${Math.round(ratio)}% missing` });
    }
    return { summary: { high: issues.filter(i => i.severity === 'high').length, medium: 0, low: 0 }, issues };
}
