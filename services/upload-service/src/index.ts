import express from 'express';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '@project-ida/logger';
import { prisma } from '@project-ida/db';
import { authMiddleware, AuthRequest } from '@project-ida/auth-middleware';
import { generatePresignedUploadUrl } from './s3';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8002;

app.use(express.json());

// Initialize S3 Bucket
import { initS3 } from './s3';
initS3();

// Health Check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'upload' });
});

app.post('/uploads/presigned', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const { filename, contentType, datasetId } = req.body;
        const tenantId = req.tenantId!; // Enforced by authMiddleware

        // Basic validation
        if (!filename || !contentType) {
            return res.status(400).json({ error: 'Missing filename or contentType' });
        }

        // Generate Key: tenants/{tenantId}/raw/{random}/{filename}
        const fileKey = `tenants/${tenantId}/raw/${uuidv4()}/${filename}`;

        // Create Presigned URL
        const url = await generatePresignedUploadUrl(fileKey, contentType);

        // Ensure Dataset exists
        let targetDatasetId = datasetId;
        if (!targetDatasetId) {
            let project = await prisma.project.findFirst({ where: { tenantId, name: 'Default' } });
            if (!project) {
                project = await prisma.project.create({
                    data: { name: 'Default', tenantId }
                });
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

        // Update status
        await prisma.upload.update({
            where: { id: uploadId },
            data: { status: 'COMPLETED' } // Realistically verify S3 existence here
        });

        // Trigger Parser Job
        const parserUrl = process.env.PARSER_SERVICE_URL || 'http://localhost:8003';

        // Fire and forget (don't await response to unblock client)
        fetch(`${parserUrl}/jobs/parse`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uploadId })
        }).catch(err => logger.error({ err }, 'Failed to trigger parser service'));

        logger.info({ uploadId }, 'Upload finalized, trigger sent to parser');

        res.json({ status: 'ok', upload });
    } catch (error) {
        logger.error(error, 'Failed to finalize upload');
        res.status(500).json({ error: 'Internal error' });
    }
});

app.listen(PORT, () => {
    logger.info(`Upload Service running on port ${PORT}`);
});
