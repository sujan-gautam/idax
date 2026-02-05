import express from 'express';
import { prisma } from '@project-ida/db';
import { authMiddleware, AuthRequest } from '@project-ida/auth';

const router = express.Router();

// List datasets
router.get('/', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const tenantId = req.user?.tenantId;
        const projectId = req.query.projectId as string;

        const where: any = { tenantId };
        if (projectId) {
            where.projectId = projectId;
        }

        const datasets = await prisma.dataset.findMany({
            where,
            include: {
                project: {
                    select: { id: true, name: true }
                },
                _count: {
                    select: { versions: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(datasets);
    } catch (error) {
        res.status(500).json({ error: 'Failed to list datasets' });
    }
});

// Get dataset details
router.get('/:id', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const tenantId = req.user?.tenantId;

        const dataset = await prisma.dataset.findFirst({
            where: {
                id: req.params.id,
                tenantId
            },
            include: {
                project: true,
                versions: {
                    orderBy: { versionNumber: 'desc' },
                    take: 10
                }
            }
        });

        if (!dataset) {
            return res.status(404).json({ error: 'Dataset not found' });
        }

        res.json(dataset);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get dataset' });
    }
});

// Get dataset status
router.get('/:id/status', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const tenantId = req.user?.tenantId;

        const dataset = await prisma.dataset.findFirst({
            where: { id: req.params.id, tenantId },
            include: {
                versions: {
                    orderBy: { versionNumber: 'desc' },
                    take: 1
                },
                uploads: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            }
        });

        if (!dataset) return res.status(404).json({ error: 'Dataset not found' });

        const latestUpload = dataset.uploads[0];
        const latestVersion = dataset.versions[0];

        // Check EDA status
        let hasEDA = false;
        if (latestVersion) {
            const eda = await prisma.eDAResult.findFirst({
                where: { datasetVersionId: latestVersion.id }
            });
            hasEDA = !!eda;
        }

        res.json({
            id: dataset.id,
            isParsed: !!dataset.activeVersionId,
            hasEDA,
            uploadStatus: latestUpload?.status || 'NONE',
            versionCount: dataset.versions.length,
            latestVersionId: latestVersion?.id
        });
    } catch (error) {
        res.status(500).json({ error: 'Status check failed' });
    }
});

// Get dataset preview
router.get('/:id/preview', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const tenantId = req.user?.tenantId;

        const dataset = await prisma.dataset.findFirst({
            where: {
                id: req.params.id,
                tenantId
            },
            include: {
                versions: {
                    where: { id: req.query.versionId as string || undefined },
                    orderBy: { versionNumber: 'desc' },
                    take: 1
                }
            }
        });

        if (!dataset) {
            return res.status(404).json({ error: 'Dataset not found' });
        }

        const version = dataset.versions[0];
        if (!version) {
            return res.json([]);
        }

        // Logic to fetch from local storage or S3 would go here.
        // For now, we return empty as a placeholder to avoid 404.
        res.json([]);
    } catch (error) {
        res.status(500).json({ error: 'Preview failed' });
    }
});

// Get EDA results
router.get('/:id/eda', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const tenantId = req.user?.tenantId;

        const dataset = await prisma.dataset.findFirst({
            where: {
                id: req.params.id,
                tenantId
            }
        });

        if (!dataset || !dataset.activeVersionId) {
            return res.status(404).json({ error: 'No active version' });
        }

        const versionId = (req.query.versionId as string) || dataset.activeVersionId;

        const result = await prisma.eDAResult.findFirst({
            where: {
                datasetVersionId: versionId,
                tenantId
            }
        });

        if (!result) {
            return res.status(404).json({ error: 'EDA not found' });
        }

        if (result.summaryJson) {
            return res.json(result.summaryJson);
        }

        res.status(404).json({ error: 'EDA result not available' });
    } catch (error) {
        res.status(500).json({ error: 'EDA fetch failed' });
    }
});

// Delete dataset
router.delete('/:id', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const tenantId = req.user?.tenantId;

        const existing = await prisma.dataset.findFirst({
            where: {
                id: req.params.id,
                tenantId
            }
        });

        if (!existing) {
            return res.status(404).json({ error: 'Dataset not found' });
        }

        await prisma.dataset.delete({
            where: { id: req.params.id }
        });

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete dataset' });
    }
});

export default router;
