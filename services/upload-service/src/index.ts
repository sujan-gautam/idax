import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '../../../.env') });

import express from 'express';
import cors from 'cors';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '@project-ida/logger';
import { prisma } from '@project-ida/db';
import { authMiddleware, AuthRequest } from '@project-ida/auth-middleware';
import { generatePresignedUploadUrl, s3Available } from './s3';

const app = express();
const PORT = process.env.PORT || 8002;

app.use(cors());

// Local storage directory if S3 is down
const LOCAL_STORAGE_DIR = path.join(__dirname, '../../../.local-storage');
if (!fs.existsSync(LOCAL_STORAGE_DIR)) {
    fs.mkdirSync(LOCAL_STORAGE_DIR, { recursive: true });
}

// Mock S3 endpoint for local development without Docker
// MUST be defined BEFORE express.json() to handle raw binary uploads of JSON files
app.put('/local-s3/*', express.raw({ type: '*/*', limit: '100mb' }), (req, res) => {
    const fileKey = (req.params as any)[0];
    const filePath = path.join(LOCAL_STORAGE_DIR, fileKey);
    const dirPath = path.dirname(filePath);

    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }

    // req.body is now a Buffer thanks to express.raw()
    fs.writeFileSync(filePath, req.body);
    logger.info({ fileKey, filePath }, 'Stored file in local storage fallback');
    res.status(200).send('OK');
});

app.use(express.json());

// GET endpoint to serve local files to parser-service
app.get('/local-s3/*', (req, res) => {
    const fileKey = (req.params as any)[0];
    const filePath = path.join(LOCAL_STORAGE_DIR, fileKey);
    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.status(404).send('Not Found');
    }
});

// Initialize S3 Bucket
import { initS3 } from './s3';

// Health Check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'upload' });
});

app.post('/uploads/presigned', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const { filename, contentType, datasetId, projectId } = req.body;
        const tenantId = req.tenantId!; // Enforced by authMiddleware

        // --- ENFORCE PLAN LIMITS ---
        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { plan: true }
        });

        if (tenant) {
            const datasetsCount = await prisma.dataset.count({
                where: { tenantId }
            });

            // Define limits locally (should be shared, but hardcoding for safety now)
            const limits: Record<string, number> = {
                'FREE': 5,
                'PRO': 100,
                'ENTERPRISE': 999999999
            };

            const limit = limits[tenant.plan] || 5;

            if (datasetsCount >= limit) {
                logger.warn({ tenantId, plan: tenant.plan, current: datasetsCount, limit }, 'Upload rejected: Plan limit reached');
                return res.status(403).json({
                    error: 'Plan Limit Reached',
                    message: `You have reached the limit of ${limit} datasets for your ${tenant.plan} plan. Please upgrade to upload more.`,
                    code: 'PLAN_LIMIT_EXCEEDED'
                });
            }
        }
        // ---------------------------

        // Basic validation
        if (!filename || !contentType) {
            return res.status(400).json({ error: 'Missing filename or contentType' });
        }

        // SANITIZE FILENAME for S3 Key to avoid 403 Signature Mismatch
        // Spaces and special characters in keys often cause signing issues in browsers
        const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
        const fileKey = `tenants/${tenantId}/raw/${uuidv4()}/${sanitizedFilename}`;

        // Create Presigned URL
        const finalContentType = contentType || 'application/octet-stream';
        const url = await generatePresignedUploadUrl(fileKey, finalContentType);

        logger.info({ fileKey, contentType: finalContentType }, 'Generated presigned upload URL');

        // Ensure Dataset exists
        let targetDatasetId = datasetId;
        if (!targetDatasetId) {
            // Determine Project
            let project;
            if (projectId) {
                project = await prisma.project.findFirst({
                    where: { id: projectId, tenantId }
                });
            }

            // Fallback to "Default" if no project specified or found
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
                    // activeVersionId is null initially
                }
            });
            targetDatasetId = dataset.id;
        }

        // Create DB Record
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

app.post('/uploads/finalize', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const { uploadId } = req.body;
        const tenantId = req.tenantId!;

        const upload = await prisma.upload.findFirst({
            where: { id: uploadId, tenantId }
        });

        if (!upload) return res.status(404).json({ error: 'Upload not found' });

        // Update status and return updated upload
        const updatedUpload = await prisma.upload.update({
            where: { id: uploadId },
            data: { status: 'COMPLETED' }
        });

        // Trigger Parser Job
        const parserUrl = process.env.PARSER_SERVICE_URL || 'http://localhost:8003';

        logger.info({ uploadId, parserUrl }, 'Triggering parser service');

        // Fire and forget (don't await response to unblock client)
        fetch(`${parserUrl}/jobs/parse`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uploadId })
        }).catch(err => logger.error({ err, uploadId }, 'Failed to trigger parser service'));

        res.json({ status: 'ok', upload: updatedUpload });
    } catch (error) {
        logger.error(error, 'Failed to finalize upload');
        res.status(500).json({ error: 'Internal error' });
    }
});

const startServer = async () => {
    await initS3();
    app.listen(PORT, () => {
        logger.info(`Upload Service running on port ${PORT}`);
    });
};

startServer();
