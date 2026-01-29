import express from 'express';
import { logger } from '@project-ida/logger';
import { prisma } from '@project-ida/db';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { authMiddleware, AuthRequest } from '@project-ida/auth-middleware';
import { runEDA } from './eda_logic';

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
// Helper function to get EDA results for a dataset
// ============================================================================
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

    if (edaResult && edaResult.resultS3Key && edaResult.resultS3Key !== 'pending' && edaResult.resultS3Key !== 'running' && edaResult.resultS3Key !== 'failed') {
        // Fetch from S3 with local fallback
        try {
            const getCommand = new GetObjectCommand({
                Bucket: BUCKET,
                Key: edaResult.resultS3Key
            });

            const s3Response = await s3Client.send(getCommand);
            const content = await s3Response.Body?.transformToString();

            if (content) {
                const results = JSON.parse(content);
                // Check if old format (missing flat list or columns)
                if (results.correlations && (!results.correlations.correlations || !results.correlations.columns)) {
                    logger.info({ datasetId: version.datasetId }, 'Old EDA format detected in S3, will regenerate');
                } else {
                    return results;
                }
            }
        } catch (error) {
            logger.warn({ error, key: edaResult.resultS3Key }, 'Failed to fetch EDA from S3, trying local fallback');
            try {
                const uploadUrl = process.env.UPLOAD_SERVICE_URL || 'http://localhost:8002';
                const localRes = await fetch(`${uploadUrl}/local-s3/${edaResult.resultS3Key}`);
                if (localRes.ok) {
                    const content = await localRes.text();
                    const results = JSON.parse(content);
                    // Check if old format
                    if (results.correlations && (!results.correlations.correlations || !results.correlations.columns)) {
                        logger.info({ datasetId: version.datasetId }, 'Old EDA format detected in local storage, will regenerate');
                    } else {
                        return results;
                    }
                }
            } catch (fallbackErr) {
                logger.error({ fallbackErr }, 'Local fallback for EDA results failed');
            }
        }
    }

    // If no stored results or S3 failed, generate on-the-fly
    try {
        let content: string | undefined;
        try {
            const getCommand = new GetObjectCommand({
                Bucket: BUCKET,
                Key: version.artifactS3Key
            });

            const s3Response = await s3Client.send(getCommand);
            content = await s3Response.Body?.transformToString();
        } catch (s3Err) {
            logger.warn({ key: version.artifactS3Key }, 'S3 artifact fetch failed, trying local fallback');
            try {
                const uploadUrl = process.env.UPLOAD_SERVICE_URL || 'http://localhost:8002';
                const localRes = await fetch(`${uploadUrl}/local-s3/${version.artifactS3Key}`);
                if (localRes.ok) {
                    content = await localRes.text();
                }
            } catch (fallbackErr) {
                logger.error({ fallbackErr }, 'Local fallback for artifact failed');
            }
        }

        if (!content) {
            logger.warn({ versionId: version.id }, 'Artifact content is empty or not found');
            return null;
        }

        const data = JSON.parse(content);
        const edaResults = runEDA(data, version.schemaJson as any);

        logger.info({ datasetId, rowCount: data.length }, 'Generated EDA on-the-fly');

        return edaResults;
    } catch (error: any) {
        logger.error({ error: error.message }, 'Failed to generate EDA on-the-fly');
        throw error;
    }
}

// ============================================================================
// ROUTES
// ============================================================================

router.get('/overview', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const datasetId = req.query.datasetId as string;
        const tenantId = req.user?.tenantId;

        if (!datasetId || !tenantId) {
            return res.status(400).json({ error: 'DatasetId and tenant session required' });
        }

        const edaResults = await getEDAResults(datasetId, tenantId);

        if (!edaResults) {
            return res.status(404).json({ error: 'EDA results not found' });
        }

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
            completeness: 100 - (edaResults.overview.missingRatio || 0),
            column_types: edaResults.overview.columnTypes || {},
            columns: columns.map((col: any) => ({
                name: col.name,
                type: col.type,
                missing: edaResults.distributions[col.name]?.missingCount || 0,
                unique: edaResults.distributions[col.name]?.uniqueCount || 0
            }))
        };

        res.json(overview);
    } catch (error: any) {
        logger.error({ error: error.message }, 'Failed to get overview');
        res.status(500).json({ error: 'Failed to get overview', message: error.message });
    }
});

router.get('/distributions', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const datasetId = req.query.datasetId as string;
        const tenantId = req.user?.tenantId;

        if (!datasetId || !tenantId) {
            return res.status(400).json({ error: 'DatasetId required' });
        }

        const edaResults = await getEDAResults(datasetId, tenantId!);
        if (!edaResults) return res.status(404).json({ error: 'Not found' });

        res.json({ distributions: edaResults.distributions });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/correlations', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const datasetId = req.query.datasetId as string;
        const tenantId = req.user?.tenantId;

        const edaResults = await getEDAResults(datasetId, tenantId!);
        if (!edaResults) return res.status(404).json({ error: 'Not found' });

        res.json(edaResults.correlations);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/outliers', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const datasetId = req.query.datasetId as string;
        const tenantId = req.user?.tenantId;

        const edaResults = await getEDAResults(datasetId, tenantId!);
        if (!edaResults) return res.status(404).json({ error: 'Not found' });

        res.json(edaResults.outliers);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/quality', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const datasetId = req.query.datasetId as string;
        const tenantId = req.user?.tenantId;

        const edaResults = await getEDAResults(datasetId, tenantId!);
        if (!edaResults) return res.status(404).json({ error: 'Not found' });

        res.json(edaResults.dataQuality);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
