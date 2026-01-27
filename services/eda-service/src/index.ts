import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { logger } from '@project-ida/logger';
import { prisma } from '@project-ida/db';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import edaRoutes from './routes';

const app = express();
const PORT = process.env.PORT || 8004;

app.use(express.json());

const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    endpoint: process.env.AWS_S3_ENDPOINT,
    forcePathStyle: true,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'password'
    }
});
const BUCKET = process.env.S3_BUCKET_NAME || 'project-ida-uploads';

// Health Check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'eda' });
});

// Mount EDA API routes
app.use('/eda', edaRoutes);

// ============================================================================
// EDA JOB - REAL STATISTICAL ALGORITHMS
// ============================================================================

app.post('/jobs/eda', async (req, res) => {
    try {
        const { versionId } = req.body;

        if (!versionId) {
            return res.status(400).json({ error: 'Version ID required' });
        }

        // Get dataset version
        const version = await prisma.datasetVersion.findUnique({
            where: { id: versionId },
            include: { dataset: true }
        });

        if (!version) {
            return res.status(404).json({ error: 'Version not found' });
        }

        logger.info({ versionId, s3Key: version.artifactS3Key }, 'Starting EDA job');

        // Download parsed data from S3
        const getCommand = new GetObjectCommand({
            Bucket: BUCKET,
            Key: version.artifactS3Key
        });

        const s3Response = await s3Client.send(getCommand);
        const content = await s3Response.Body?.transformToString();

        if (!content) {
            throw new Error('Failed to download data from S3');
        }

        const data = JSON.parse(content);

        // Run EDA algorithms
        const edaResults = runEDA(data, version.schemaJson);

        logger.info({
            versionId,
            rowCount: edaResults.overview.rowCount,
            columnCount: edaResults.overview.columnCount
        }, 'EDA completed');

        // Store full results in S3
        const resultKey = `tenants/${version.dataset.tenantId}/eda/${versionId}/${Date.now()}.json`;

        const putCommand = new PutObjectCommand({
            Bucket: BUCKET,
            Key: resultKey,
            Body: JSON.stringify(edaResults),
            ContentType: 'application/json'
        });

        await s3Client.send(putCommand);

        // Store summary in database
        await prisma.eDAResult.create({
            data: {
                tenantId: version.dataset.tenantId,
                datasetVersionId: versionId,
                resultS3Key: resultKey,
                summaryJson: {
                    overview: edaResults.overview,
                    qualitySummary: edaResults.dataQuality.summary
                }
            }
        });

        logger.info({ versionId }, 'EDA results stored');

        res.json({ success: true, versionId });

    } catch (error: any) {
        logger.error({ error: error.message, versionId: req.body.versionId }, 'EDA job failed');
        res.status(500).json({ error: 'EDA failed', message: error.message });
    }
});

// ============================================================================
// EDA ALGORITHMS - REAL MATHEMATICS
// ============================================================================

function runEDA(data: any[], schema: any): any {
    const columns = schema.columns;

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

    const missingRatio = missingCells / totalCells;

    return {
        rowCount,
        columnCount,
        duplicateRows: duplicateCount,
        duplicateRatio: Math.round((duplicateCount / rowCount) * 10000) / 100,
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
 * DISTRIBUTIONS
 */
function computeDistributions(data: any[], columns: any[]): any {
    const distributions: any = {};

    for (const col of columns) {
        const values = data.map(row => row[col.name]).filter(v => v !== null && v !== undefined && v !== '');

        if (col.type === 'number') {
            distributions[col.name] = computeNumericDistribution(values);
        } else {
            distributions[col.name] = computeCategoricalDistribution(values);
        }
    }

    return distributions;
}

function computeNumericDistribution(values: any[]): any {
    const numbers = values.map(Number).filter(n => !isNaN(n));

    if (numbers.length === 0) {
        return { type: 'numeric', count: 0 };
    }

    numbers.sort((a, b) => a - b);

    const min = numbers[0];
    const max = numbers[numbers.length - 1];
    const mean = numbers.reduce((sum, n) => sum + n, 0) / numbers.length;

    // Standard deviation
    const variance = numbers.reduce((sum, n) => sum + Math.pow(n - mean, 2), 0) / numbers.length;
    const std = Math.sqrt(variance);

    // Quartiles
    const q1 = numbers[Math.floor(numbers.length * 0.25)];
    const median = numbers[Math.floor(numbers.length * 0.5)];
    const q3 = numbers[Math.floor(numbers.length * 0.75)];

    // Histogram bins (Freedman-Diaconis rule)
    const iqr = q3 - q1;
    const binWidth = 2 * iqr / Math.pow(numbers.length, 1 / 3);
    const binCount = Math.min(Math.ceil((max - min) / binWidth), 50);

    const bins = createHistogramBins(numbers, min, max, binCount);

    return {
        type: 'numeric',
        count: numbers.length,
        min,
        max,
        mean: Math.round(mean * 100) / 100,
        median,
        std: Math.round(std * 100) / 100,
        q1,
        q3,
        bins
    };
}

function createHistogramBins(numbers: number[], min: number, max: number, binCount: number): any[] {
    const binWidth = (max - min) / binCount;
    const bins = Array(binCount).fill(0).map((_, i) => ({
        start: min + i * binWidth,
        end: min + (i + 1) * binWidth,
        count: 0
    }));

    for (const num of numbers) {
        const binIndex = Math.min(Math.floor((num - min) / binWidth), binCount - 1);
        bins[binIndex].count++;
    }

    return bins;
}

function computeCategoricalDistribution(values: any[]): any {
    const frequencies: any = {};

    for (const value of values) {
        const key = String(value);
        frequencies[key] = (frequencies[key] || 0) + 1;
    }

    const sorted = Object.entries(frequencies)
        .sort(([, a]: any, [, b]: any) => b - a)
        .slice(0, 20); // Top 20

    return {
        type: 'categorical',
        count: values.length,
        uniqueCount: Object.keys(frequencies).length,
        topValues: sorted.map(([value, count]) => ({
            value,
            count,
            percentage: Math.round((count as number / values.length) * 10000) / 100
        }))
    };
}

/**
 * CORRELATIONS - Pearson & Spearman
 */
function computeCorrelations(data: any[], columns: any[]): any {
    const numericColumns = columns.filter(c => c.type === 'number');

    if (numericColumns.length < 2) {
        return { message: 'Need at least 2 numeric columns for correlation' };
    }

    const matrix: any = {};

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
                matrix[col1.name][col2.name] = Math.round(correlation * 1000) / 1000;
            }
        }
    }

    return {
        method: 'pearson',
        matrix
    };
}

function pearsonCorrelation(x: number[], y: number[]): number {
    const n = Math.min(x.length, y.length);

    if (n === 0) return 0;

    const meanX = x.reduce((sum, val) => sum + val, 0) / n;
    const meanY = y.reduce((sum, val) => sum + val, 0) / n;

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
 * OUTLIERS - IQR Method
 */
function computeOutliers(data: any[], columns: any[]): any {
    const outliers: any = {};

    for (const col of columns) {
        if (col.type !== 'number') continue;

        const values = data.map(row => Number(row[col.name])).filter(n => !isNaN(n));

        if (values.length === 0) continue;

        values.sort((a, b) => a - b);

        const q1 = values[Math.floor(values.length * 0.25)];
        const q3 = values[Math.floor(values.length * 0.75)];
        const iqr = q3 - q1;

        const lowerBound = q1 - 1.5 * iqr;
        const upperBound = q3 + 1.5 * iqr;

        const outlierValues = values.filter(v => v < lowerBound || v > upperBound);

        outliers[col.name] = {
            method: 'IQR',
            count: outlierValues.length,
            percentage: Math.round((outlierValues.length / values.length) * 10000) / 100,
            lowerBound: Math.round(lowerBound * 100) / 100,
            upperBound: Math.round(upperBound * 100) / 100,
            examples: outlierValues.slice(0, 5)
        };
    }

    return outliers;
}

/**
 * DATA QUALITY CHECKS
 */
function computeDataQuality(data: any[], columns: any[]): any {
    const issues: any[] = [];

    for (const col of columns) {
        const values = data.map(row => row[col.name]);

        // Null spike (>50% missing)
        if (col.nullRatio > 50) {
            issues.push({
                column: col.name,
                type: 'null_spike',
                severity: 'high',
                message: `${col.nullRatio}% missing values`,
                recommendation: 'Consider imputation or dropping column'
            });
        }

        // Constant column
        if (col.cardinality === 1) {
            issues.push({
                column: col.name,
                type: 'constant_column',
                severity: 'medium',
                message: 'All values are the same',
                recommendation: 'Consider dropping column'
            });
        }

        // High cardinality for categorical
        if (col.type === 'string' && col.uniqueRatio > 95) {
            issues.push({
                column: col.name,
                type: 'high_cardinality',
                severity: 'low',
                message: `${col.uniqueRatio}% unique values`,
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

app.listen(PORT, () => {
    logger.info(`EDA Service running on port ${PORT}`);
});
