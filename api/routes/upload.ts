import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '@project-ida/db';
import { authMiddleware, AuthRequest } from '@project-ida/auth';
import { logger } from '@project-ida/logger';
import path from 'path';
import fs from 'fs';
import { generatePresignedUploadUrl } from '../utils/s3';
import { parseCSV, parseJSON, parseXLSX } from '../utils/parser_logic';
import { runEDA } from '../utils/eda_logic';

const router = express.Router();

// Local storage directory
const LOCAL_STORAGE_DIR = path.join(process.cwd(), 'uploads-data');
if (!fs.existsSync(LOCAL_STORAGE_DIR)) {
    fs.mkdirSync(LOCAL_STORAGE_DIR, { recursive: true });
}

// Local storage endpoint for fallback
router.put('/local-s3/*', express.raw({ type: '*/*', limit: '100mb' }), (req, res) => {
    try {
        const fileKey = (req.params as any)[0];
        const filePath = path.join(LOCAL_STORAGE_DIR, fileKey);
        const dirPath = path.dirname(filePath);

        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }

        fs.writeFileSync(filePath, req.body);
        logger.info({ fileKey, filePath }, 'Stored file in local storage fallback');
        res.status(200).send('OK');
    } catch (error) {
        logger.error(error, 'Local storage write failed');
        res.status(500).send('Failed to store file');
    }
});

// Helper for local file reading
const readLocalFile = (key: string): Buffer => {
    const filePath = path.join(LOCAL_STORAGE_DIR, key);
    return fs.readFileSync(filePath);
}

// Get Presigned URL for upload
router.post('/presigned', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const { filename, contentType, datasetId, projectId } = req.body;
        const tenantId = req.user?.tenantId;

        if (!tenantId) {
            return res.status(400).json({ error: 'Missing tenant context' });
        }

        // --- ENFORCE PLAN LIMITS ---
        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { plan: true }
        });

        if (tenant) {
            const datasetsCount = await prisma.dataset.count({
                where: { tenantId }
            });

            const limits: Record<string, number> = {
                'FREE': 5,
                'PRO': 100,
                'ENTERPRISE': 999999999
            };

            const limit = limits[tenant.plan] || 5;

            if (datasetsCount >= limit) {
                return res.status(403).json({
                    error: 'Plan Limit Reached',
                    message: `You have reached the limit of ${limit} datasets for your ${tenant.plan} plan.`,
                    code: 'PLAN_LIMIT_EXCEEDED'
                });
            }
        }

        if (!filename || !contentType) {
            return res.status(400).json({ error: 'Missing filename or contentType' });
        }

        const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
        const fileKey = `tenants/${tenantId}/raw/${uuidv4()}/${sanitizedFilename}`;

        const url = await generatePresignedUploadUrl(fileKey, contentType || 'application/octet-stream');

        // Ensure Dataset exists
        let targetDatasetId = datasetId;
        if (!targetDatasetId) {
            let project;
            if (projectId) {
                project = await prisma.project.findFirst({
                    where: { id: projectId, tenantId }
                });
            }

            if (!project) {
                project = await prisma.project.findFirst({ where: { tenantId, name: 'Default' } });
                if (!project) {
                    project = await prisma.project.create({
                        data: { name: 'Default', tenantId }
                    });
                }
            }

            const dataset = await prisma.dataset.create({
                data: {
                    tenantId,
                    projectId: project.id,
                    name: filename,
                    sourceType: 'UPLOAD',
                }
            });
            targetDatasetId = dataset.id;
        }

        const upload = await prisma.upload.create({
            data: {
                tenantId,
                datasetId: targetDatasetId,
                filename,
                contentType,
                s3Key: fileKey,
                status: 'PENDING',
            }
        });

        res.json({ uploadId: upload.id, url, key: fileKey, upload });
    } catch (error) {
        logger.error(error, 'Failed to generate presigned URL');
        res.status(500).json({ error: 'Internal error' });
    }
});

// Finalize Upload
router.post('/finalize', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const { uploadId } = req.body;
        const tenantId = req.user?.tenantId;

        const upload = await prisma.upload.findFirst({
            where: { id: uploadId, tenantId },
            include: { dataset: true }
        });

        if (!upload) return res.status(404).json({ error: 'Upload not found' });

        await prisma.upload.update({
            where: { id: uploadId },
            data: { status: 'COMPLETED' }
        });

        // --- UNIFIED PARSING LOGIC ---
        let parsedData: any[] = [];
        let schema: any = {};

        try {
            const fileBuffer = readLocalFile(upload.s3Key);

            if (upload.filename.endsWith('.csv')) {
                const result = parseCSV(fileBuffer.toString('utf-8'));
                parsedData = result.data;
                schema = result.schema;
            } else if (upload.filename.endsWith('.xlsx') || upload.filename.endsWith('.xls')) {
                const result = parseXLSX(fileBuffer);
                parsedData = result.data;
                schema = result.schema;
            } else {
                const result = parseJSON(fileBuffer.toString('utf-8'));
                parsedData = result.data;
                schema = result.schema;
            }

            // Create Dataset Version
            const artifactKey = `tenants/${tenantId}/parsed/${upload.datasetId}/${Date.now()}.json`;
            const artifactPath = path.join(LOCAL_STORAGE_DIR, artifactKey);
            const artifactDir = path.dirname(artifactPath);
            if (!fs.existsSync(artifactDir)) fs.mkdirSync(artifactDir, { recursive: true });
            fs.writeFileSync(artifactPath, JSON.stringify(parsedData));

            const version = await prisma.datasetVersion.create({
                data: {
                    datasetId: upload.datasetId!,
                    versionNumber: 1,
                    artifactS3Key: artifactKey,
                    schemaJson: schema as any,
                    rowCount: parsedData.length,
                    columnCount: schema.columns?.length || 0,
                    sourceType: 'UPLOAD',
                    sourceId: upload.id
                }
            });

            await prisma.dataset.update({
                where: { id: upload.datasetId! },
                data: { activeVersionId: version.id }
            });

            // --- RUN EDA ---
            const edaResults = runEDA(parsedData, schema);
            const edaKey = `tenants/${tenantId}/eda/${version.id}/${Date.now()}.json`;
            const edaPath = path.join(LOCAL_STORAGE_DIR, edaKey);
            const edaDir = path.dirname(edaPath);
            if (!fs.existsSync(edaDir)) fs.mkdirSync(edaDir, { recursive: true });
            fs.writeFileSync(edaPath, JSON.stringify(edaResults));

            if (!tenantId) throw new Error('Tenant context lost during processing');

            await prisma.eDAResult.create({
                data: {
                    tenantId: tenantId,
                    datasetVersionId: version.id,
                    status: 'COMPLETED',
                    resultS3Key: edaKey,
                    summaryJson: {
                        overview: edaResults.overview,
                        qualitySummary: edaResults.dataQuality,
                        correlations: edaResults.correlations.correlations,
                        distributions: edaResults.distributions,
                        outliers: edaResults.outliers
                    } as any
                }
            });

            res.json({ status: 'ok', message: 'Data processed and EDA complete' });

        } catch (processErr) {
            logger.error(processErr, 'Data processing failed');
            res.status(500).json({ error: 'Processing failed' });
        }

    } catch (error) {
        logger.error(error, 'Failed to finalize upload');
        res.status(500).json({ error: 'Internal error' });
    }
});

export default router;
