import express from 'express';
import { prisma } from '@project-ida/db';
import { authMiddleware, AuthRequest } from '@project-ida/auth';

const router = express.Router();

// List jobs
router.get('/', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const tenantId = req.user?.tenantId;

        const edaResults = await prisma.eDAResult.findMany({
            where: { tenantId },
            include: {
                datasetVersion: {
                    include: {
                        dataset: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        const jobs = edaResults.map(eda => {
            const dataset = eda.datasetVersion?.dataset;
            return {
                id: eda.id,
                type: 'EDA Analysis',
                dataset_name: dataset?.name || 'Unknown',
                dataset_id: dataset?.id || '',
                status: eda.status,
                created_at: eda.createdAt,
                duration: 'N/A'
            };
        });

        res.json(jobs);
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to fetch jobs' });
    }
});

export default router;
