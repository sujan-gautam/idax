import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '@project-ida/db';
import { authMiddleware, AuthRequest } from '@project-ida/auth';
import { logger } from '@project-ida/logger';
import { generatePresignedUploadUrl } from '../utils/s3';

const router = express.Router();

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
            where: { id: uploadId, tenantId }
        });

        if (!upload) return res.status(404).json({ error: 'Upload not found' });

        const updatedUpload = await prisma.upload.update({
            where: { id: uploadId },
            data: { status: 'COMPLETED' }
        });

        // Trigger Parser (Logic to be integrated or call external service)
        // For now, we'll just log it. In a full integration, this would trigger the parser logic.

        res.json({ status: 'ok', upload: updatedUpload });
    } catch (error) {
        logger.error(error, 'Failed to finalize upload');
        res.status(500).json({ error: 'Internal error' });
    }
});

export default router;
