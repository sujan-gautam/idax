import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '../../../.env') });

import express from 'express';
import { logger } from '@project-ida/logger';
import { prisma } from '@project-ida/db';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import edaRoutes from './routes';
import { runEDA } from './eda_logic';

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

        // Download parsed data from S3 with local fallback
        let content: string | undefined;
        try {
            const getCommand = new GetObjectCommand({
                Bucket: BUCKET,
                Key: version.artifactS3Key
            });
            const s3Response = await s3Client.send(getCommand);
            content = await s3Response.Body?.transformToString();
            logger.info({ s3Key: version.artifactS3Key }, 'Downloaded from S3');
        } catch (s3Err: any) {
            logger.warn({ s3Key: version.artifactS3Key, error: s3Err.message }, 'S3 download failed, trying local fallback');
            try {
                const uploadUrl = process.env.UPLOAD_SERVICE_URL || 'http://localhost:8002';
                const localRes = await fetch(`${uploadUrl}/local-s3/${version.artifactS3Key}`);
                if (!localRes.ok) throw new Error(`Local fallback failed: ${localRes.statusText}`);
                content = await localRes.text();
                logger.info({ s3Key: version.artifactS3Key }, 'Downloaded from local storage fallback');
            } catch (fallbackErr: any) {
                logger.error({ fallbackErr }, 'Local fallback also failed');
                throw new Error(`S3 download and local fallback failed: ${s3Err.message}`);
            }
        }

        if (!content) {
            throw new Error('Failed to download data: Content is empty');
        }

        const data = JSON.parse(content);

        // Run EDA algorithms
        const edaResults = runEDA(data, version.schemaJson);

        logger.info({
            versionId,
            rowCount: edaResults.overview.rowCount,
            columnCount: edaResults.overview.columnCount
        }, 'EDA completed');

        // Store full results in S3 with local fallback
        const resultKey = `tenants/${version.dataset.tenantId}/eda/${versionId}/${Date.now()}.json`;

        try {
            const putCommand = new PutObjectCommand({
                Bucket: BUCKET,
                Key: resultKey,
                Body: JSON.stringify(edaResults),
                ContentType: 'application/json'
            });
            await s3Client.send(putCommand);
            logger.info({ resultKey }, 'EDA results stored in S3');
        } catch (putErr: any) {
            logger.warn({ resultKey, error: putErr.message }, 'S3 store failed, trying local fallback');
            try {
                const uploadUrl = process.env.UPLOAD_SERVICE_URL || 'http://localhost:8002';
                const localRes = await fetch(`${uploadUrl}/local-s3/${resultKey}`, {
                    method: 'PUT',
                    body: JSON.stringify(edaResults)
                });
                if (!localRes.ok) throw new Error(`Local store failed: ${localRes.statusText}`);
                logger.info({ resultKey }, 'EDA results stored in local storage fallback');
            } catch (fallbackErr: any) {
                logger.error({ fallbackErr }, 'Local store fallback failed');
                // We'll still try to store in DB even if file store fails (not ideal but better than nothing)
            }
        }

        // Check if EDA result already exists
        const existingEDA = await prisma.eDAResult.findFirst({
            where: { datasetVersionId: versionId }
        });

        if (existingEDA) {
            await prisma.eDAResult.update({
                where: { id: existingEDA.id },
                data: {
                    resultS3Key: resultKey,
                    summaryJson: {
                        overview: edaResults.overview,
                        qualitySummary: edaResults.dataQuality.summary,
                        correlations: edaResults.correlations.correlations.slice(0, 5), // Top 5 correlations
                        outliers: Object.entries(edaResults.outliers).map(([col, data]: [string, any]) => ({
                            column: col,
                            count: data.count
                        }))
                    } as any
                }
            });
            logger.info({ versionId }, 'EDA results entry updated in database');
        } else {
            await prisma.eDAResult.create({
                data: {
                    tenantId: version.dataset.tenantId,
                    datasetVersionId: versionId,
                    resultS3Key: resultKey,
                    summaryJson: {
                        overview: edaResults.overview,
                        qualitySummary: edaResults.dataQuality.summary,
                        correlations: edaResults.correlations.correlations.slice(0, 5),
                        outliers: Object.entries(edaResults.outliers).map(([col, data]: [string, any]) => ({
                            column: col,
                            count: data.count
                        }))
                    } as any
                }
            });
            logger.info({ versionId }, 'EDA results entry created in database');
        }

        res.json({ success: true, versionId });

    } catch (error: any) {
        logger.error({ error: error.message, versionId: req.body.versionId }, 'EDA job failed');
        res.status(500).json({ error: 'EDA failed', message: error.message });
    }
});

// ============================================================================
// EDA ALGORITHMS - REAL MATHEMATICS
// ============================================================================

app.listen(PORT, () => {
    logger.info(`EDA Service running on port ${PORT}`);
});
