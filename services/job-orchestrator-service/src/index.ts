import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '../../../.env') });

import express from 'express';
import { logger } from '@project-ida/logger';
import { prisma, JobStatus } from '@project-ida/db';

const app = express();
const PORT = process.env.PORT || 8005;

app.use(express.json());

// GET /jobs - List all EDA jobs
app.get('/jobs', async (req, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'] as string;

        if (!tenantId) {
            return res.status(400).json({ error: 'Tenant ID required' });
        }

        // Fetch EDA results with dataset info
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
            let status = 'pending';

            if (eda.status === 'completed') status = 'completed';
            else if (eda.status === 'failed') status = 'failed';
            else if (eda.status === 'running') status = 'running';

            return {
                id: eda.id,
                type: 'EDA Analysis',
                dataset_name: dataset?.name || 'Unknown',
                dataset_id: dataset?.id || '',
                status,
                created_at: eda.createdAt,
                duration: 'N/A'
            };
        });

        res.json(jobs);
    } catch (error: any) {
        logger.error({ error: error.message }, 'Failed to fetch jobs');
        res.status(500).json({ error: 'Failed to fetch jobs' });
    }
});

// Simple polling or webhook receiver for job updates
// In a real system, this would listen to EventBridge or SQS

app.post('/jobs/update-status', async (req, res) => {
    const { jobId, status, progress, error } = req.body;

    try {
        await prisma.job.update({
            where: { id: jobId },
            data: {
                status,
                progress,
                errorJson: error ? { message: error } : undefined,
                finishedAt: status === JobStatus.COMPLETED || status === JobStatus.FAILED ? new Date() : undefined
            }
        });

        // If Parse Completed -> Trigger EDA automatically?
        // Logic for pipeline orchestration goes here.

        res.json({ status: 'ok' });
    } catch (e) {
        logger.error(e, 'Failed to update job');
        res.status(500).json({ error: 'Internal error' });
    }
});

app.listen(PORT, () => {
    logger.info(`Job Orchestrator running on port ${PORT}`);
});
