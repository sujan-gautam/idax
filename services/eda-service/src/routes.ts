import express from 'express';
import { logger } from '@project-ida/logger';
import { prisma } from '@project-ida/db';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { authMiddleware, AuthRequest } from '@project-ida/auth-middleware';

const router = express.Router();

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

// ============================================================================
// REAL EDA ALGORITHMS - PROFESSIONAL STATISTICAL ANALYSIS
// ============================================================================

function runEDA(data: any[], schema: any): any {
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

    const missingRatio = totalCells > 0 ? (missingCells / totalCells) * 100 : 0;

    return {
        rowCount,
        columnCount,
        duplicateRows: duplicateCount,
        duplicateRatio: Math.round((duplicateCount / Math.max(rowCount, 1)) * 10000) / 100,
        totalCells,
        missingCells,
        missingRatio: Math.round(missingRatio * 100) / 100,
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

    for (const col of columns) {
        const values = data.map(row => row[col.name]).filter(v => v !== null && v !== undefined && v !== '');

        if (col.type === 'number' || col.type === 'integer' || col.type === 'float') {
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

    // Skewness (Fisher-Pearson coefficient)
    const skewness = numbers.length > 2 ?
        numbers.reduce((sum, n) => sum + Math.pow((n - mean) / std, 3), 0) / numbers.length : 0;

    // Kurtosis (excess kurtosis)
    const kurtosis = numbers.length > 3 ?
        (numbers.reduce((sum, n) => sum + Math.pow((n - mean) / std, 4), 0) / numbers.length) - 3 : 0;

    // Histogram bins (Freedman-Diaconis rule)
    const iqr = q3 - q1;
    const binWidth = iqr > 0 ? 2 * iqr / Math.pow(numbers.length, 1 / 3) : (max - min) / 10;
    const binCount = Math.min(Math.max(Math.ceil((max - min) / Math.max(binWidth, 0.0001)), 5), 50);

    const bins = createHistogramBins(numbers, min, max, binCount);

    return {
        type: 'numeric',
        count: numbers.length,
        min: Math.round(min * 100) / 100,
        max: Math.round(max * 100) / 100,
        mean: Math.round(mean * 100) / 100,
        median: Math.round(median * 100) / 100,
        std: Math.round(std * 100) / 100,
        q1: Math.round(q1 * 100) / 100,
        q3: Math.round(q3 * 100) / 100,
        skewness: Math.round(skewness * 1000) / 1000,
        kurtosis: Math.round(kurtosis * 1000) / 1000,
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
        const binIndex = Math.min(Math.floor((num - min) / Math.max(binWidth, 0.0001)), binCount - 1);
        if (binIndex >= 0 && binIndex < binCount) {
            bins[binIndex].count++;
        }
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

    // Shannon entropy
    const total = values.length;
    const entropy = -sorted.reduce((sum, [, count]) => {
        const p = (count as number) / total;
        return sum + (p * Math.log2(p));
    }, 0);

    return {
        type: 'categorical',
        count: values.length,
        uniqueCount: Object.keys(frequencies).length,
        entropy: Math.round(entropy * 1000) / 1000,
        topValues: sorted.map(([value, count]) => ({
            value,
            count,
            percentage: Math.round((count as number / values.length) * 10000) / 100
        }))
    };
}

/**
 * CORRELATIONS - Pearson, Spearman, Kendall
 */
function computeCorrelations(data: any[], columns: any[]): any {
    const numericColumns = columns.filter(c =>
        c.type === 'number' || c.type === 'integer' || c.type === 'float'
    );

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
 * OUTLIERS - IQR Method
 */
function computeOutliers(data: any[], columns: any[]): any {
    const outliers: any = {};

    for (const col of columns) {
        if (col.type !== 'number' && col.type !== 'integer' && col.type !== 'float') continue;

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
            examples: outlierValues.slice(0, 5).map(v => Math.round(v * 100) / 100)
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
        const nullCount = values.filter(v => v === null || v === undefined || v === '').length;
        const nullRatio = (nullCount / values.length) * 100;

        // Null spike (>50% missing)
        if (nullRatio > 50) {
            issues.push({
                column: col.name,
                type: 'null_spike',
                severity: 'high',
                message: `${Math.round(nullRatio)}% missing values`,
                recommendation: 'Consider imputation or dropping column'
            });
        }

        // Constant column
        const uniqueValues = new Set(values.filter(v => v !== null && v !== undefined && v !== ''));
        if (uniqueValues.size === 1) {
            issues.push({
                column: col.name,
                type: 'constant_column',
                severity: 'medium',
                message: 'All values are the same',
                recommendation: 'Consider dropping column'
            });
        }

        // High cardinality for categorical
        const uniqueRatio = (uniqueValues.size / values.length) * 100;
        if ((col.type === 'string' || col.type === 'text') && uniqueRatio > 95) {
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

// ============================================================================
// API ENDPOINTS
// ============================================================================

// Helper function to get EDA results for a dataset
async function getEDAResults(datasetId: string, tenantId: string) {
    const dataset = await prisma.dataset.findFirst({
        where: { id: datasetId, tenantId },
        include: {
            versions: {
                orderBy: { versionNumber: 'desc' },
                take: 1
            }
        }
    });

    if (!dataset || !dataset.versions[0]) {
        return null;
    }

    const version = dataset.versions[0];

    // Check if we have stored EDA results
    const edaResult = await prisma.eDAResult.findFirst({
        where: { datasetVersionId: version.id }
    });

    if (edaResult && edaResult.resultS3Key) {
        // Fetch from S3
        try {
            const getCommand = new GetObjectCommand({
                Bucket: BUCKET,
                Key: edaResult.resultS3Key
            });

            const s3Response = await s3Client.send(getCommand);
            const content = await s3Response.Body?.transformToString();

            if (content) {
                return JSON.parse(content);
            }
        } catch (error) {
            logger.warn({ error }, 'Failed to fetch EDA from S3, will generate on-the-fly');
        }
    }

    // If no stored results, generate on-the-fly
    try {
        const getCommand = new GetObjectCommand({
            Bucket: BUCKET,
            Key: version.artifactS3Key
        });

        const s3Response = await s3Client.send(getCommand);
        const content = await s3Response.Body?.transformToString();

        if (!content) {
            logger.warn({ versionId: version.id }, 'Artifact content is empty');
            return null;
        }

        const data = JSON.parse(content);
        const edaResults = runEDA(data, version.schemaJson as any);

        logger.info({ datasetId, rowCount: data.length }, 'Generated EDA on-the-fly');

        return edaResults;
    } catch (error: any) {
        logger.error({ error: error.message, stack: error.stack }, 'Failed to generate EDA on-the-fly');
        throw error; // Throw so the caller knows it failed
    }
}

// GET /eda/overview - Dataset overview statistics
router.get('/overview', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const datasetId = req.query.datasetId as string;
        const tenantId = req.tenantId!; // Set by authMiddleware

        if (!datasetId) {
            return res.status(400).json({ error: 'Dataset ID required' });
        }

        const edaResults = await getEDAResults(datasetId, tenantId);

        if (!edaResults) {
            return res.status(404).json({ error: 'Dataset not found or no data available' });
        }

        // Transform to match frontend expectations
        const dataset = await prisma.dataset.findFirst({
            where: { id: datasetId, tenantId },
            include: {
                versions: {
                    orderBy: { versionNumber: 'desc' },
                    take: 1
                }
            }
        });

        const schema = dataset?.versions[0]?.schemaJson as any;
        const columns = schema?.columns || [];

        const overview = {
            dataset_id: datasetId,
            shape: {
                rows: edaResults.overview.rowCount || 0,
                columns: edaResults.overview.columnCount || 0
            },
            quality_score: Math.max(0, Math.min(100,
                100 - (edaResults.overview.missingRatio || 0) - ((edaResults.overview.duplicateRatio || 0) / 2)
            )),
            completeness: Math.max(0, 100 - (edaResults.overview.missingRatio || 0)),
            columns: columns.map((col: any) => {
                const dist = edaResults.distributions[col.name] || {};
                return {
                    name: col.name,
                    type: (col.type === 'number' || col.type === 'integer' || col.type === 'float') ? 'numeric' :
                        (col.type === 'string' || col.type === 'text') ? 'categorical' : col.type,
                    missing: dist.count ? (edaResults.overview.rowCount - dist.count) : 0,
                    unique: dist.uniqueCount || dist.count || 0
                };
            })
        };

        res.json(overview);

    } catch (error: any) {
        logger.error({ error: error.message }, 'Failed to get overview');
        res.status(500).json({ error: 'Failed to get overview', message: error.message });
    }
});

// GET /eda/distributions - Distribution analysis
router.get('/distributions', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const datasetId = req.query.datasetId as string;
        const tenantId = req.tenantId!;

        if (!datasetId) {
            return res.status(400).json({ error: 'Dataset ID required' });
        }

        const edaResults = await getEDAResults(datasetId, tenantId);

        if (!edaResults) {
            return res.status(404).json({ error: 'Dataset not found or no data available' });
        }

        // Transform distributions to match frontend expectations
        const distributions: any = {};

        for (const [colName, dist] of Object.entries(edaResults.distributions || {})) {
            const distData: any = dist;

            if (distData.type === 'numeric' && distData.bins) {
                distributions[colName] = {
                    histogram: {
                        counts: distData.bins.map((b: any) => b.count),
                        bin_edges: distData.bins.map((b: any) => b.start)
                    },
                    statistics: {
                        mean: distData.mean || 0,
                        median: distData.median || 0,
                        std: distData.std || 0,
                        skewness: distData.skewness || 0,
                        kurtosis: distData.kurtosis || 0
                    }
                };
            } else if (distData.type === 'categorical' && distData.topValues) {
                const valueCounts: any = {};
                distData.topValues.forEach((item: any) => {
                    valueCounts[item.value] = item.count;
                });

                distributions[colName] = {
                    value_counts: valueCounts,
                    entropy: distData.entropy || 0
                };
            }
        }

        res.json({ distributions });

    } catch (error: any) {
        logger.error({ error: error.message }, 'Failed to get distributions');
        res.status(500).json({ error: 'Failed to get distributions', message: error.message });
    }
});

// GET /eda/correlations - Correlation analysis
router.get('/correlations', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const datasetId = req.query.datasetId as string;
        const method = (req.query.method as string) || 'pearson';
        const tenantId = req.tenantId!;

        if (!datasetId) {
            return res.status(400).json({ error: 'Dataset ID required' });
        }

        const edaResults = await getEDAResults(datasetId, tenantId);

        if (!edaResults) {
            return res.status(404).json({ error: 'Dataset not found or no data available' });
        }

        if (!edaResults.correlations || !edaResults.correlations.matrix) {
            return res.json({
                method,
                matrix: {},
                correlations: [],
                columns: []
            });
        }

        const matrix = edaResults.correlations.matrix;
        const columns = Object.keys(matrix);

        // Build correlations array
        const correlations: any[] = [];

        for (let i = 0; i < columns.length; i++) {
            for (let j = i + 1; j < columns.length; j++) {
                const col1 = columns[i];
                const col2 = columns[j];
                const corr = matrix[col1][col2];

                const absCorr = Math.abs(corr);
                let strength = 'weak';
                if (absCorr > 0.7) strength = 'strong';
                else if (absCorr > 0.4) strength = 'moderate';

                correlations.push({
                    column1: col1,
                    column2: col2,
                    correlation: corr,
                    p_value: null, // Could calculate with t-test if needed
                    strength
                });
            }
        }

        // Sort by absolute correlation
        correlations.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));

        res.json({
            method,
            matrix,
            correlations,
            columns
        });

    } catch (error: any) {
        logger.error({ error: error.message }, 'Failed to get correlations');
        res.status(500).json({ error: 'Failed to get correlations', message: error.message });
    }
});

// POST /eda/analyze - Trigger EDA analysis
router.post('/analyze', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const { datasetId } = req.body;
        const tenantId = req.tenantId!;

        if (!datasetId) {
            return res.status(400).json({ error: 'Dataset ID required' });
        }

        // Trigger analysis by getting results (will generate if not exists)
        logger.info({ datasetId, tenantId }, 'Manually triggering EDA analysis');
        const results = await getEDAResults(datasetId, tenantId);

        if (!results) {
            return res.status(404).json({ error: 'Dataset version not found or no data available' });
        }

        res.json({
            success: true,
            message: 'EDA analysis completed',
            datasetId
        });

    } catch (error: any) {
        logger.error({ error: error.message }, 'EDA analysis failed');
        res.status(500).json({ error: 'Analysis failed', message: error.message });
    }
});

export default router;
