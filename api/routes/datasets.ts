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
