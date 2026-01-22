import express from 'express';
import dotenv from 'dotenv';
import { logger } from '@project-ida/logger';
import { prisma, JobStatus } from '@project-ida/db';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8005;

app.use(express.json());

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
