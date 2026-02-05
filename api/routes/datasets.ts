import express from 'express';
import { prisma } from '@project-ida/db';
import { authMiddleware, AuthRequest } from '@project-ida/auth';
import fs from 'fs';
import path from 'path';

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
        if (!version || !version.artifactS3Key) {
            return res.json([]);
        }

        // Logic to fetch from local storage
        try {
            const LOCAL_STORAGE_DIR = path.join(process.cwd(), 'uploads-data');
            const filePath = path.join(LOCAL_STORAGE_DIR, version.artifactS3Key);

            if (fs.existsSync(filePath)) {
                const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
                // Return sample of first 50 rows
                return res.json(data.slice(0, 50));
            }
            res.json([]);
        } catch (err) {
            res.json([]);
        }
    } catch (error) {
        res.status(500).json({ error: 'Preview failed' });
    }
});

// Get EDA summary (general results)
router.get('/:id/eda', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const tenantId = req.user?.tenantId;
        const dataset = await prisma.dataset.findFirst({
            where: { id: req.params.id, tenantId }
        });

        if (!dataset || !dataset.activeVersionId) {
            return res.status(404).json({ error: 'No active version' });
        }

        const versionId = (req.query.versionId as string) || dataset.activeVersionId;
        const result = await prisma.eDAResult.findFirst({
            where: { datasetVersionId: versionId, tenantId }
        });

        if (!result) return res.status(404).json({ error: 'EDA not found' });
        res.json(result.summaryJson || {});
    } catch (error) {
        res.status(500).json({ error: 'EDA fetch failed' });
    }
});

// Get EDA sub-sections
router.get('/:id/eda/:tab', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const tenantId = req.user?.tenantId;
        const tab = req.params.tab; // overview, distributions, correlations, outliers, quality

        const dataset = await prisma.dataset.findFirst({
            where: { id: req.params.id, tenantId }
        });

        if (!dataset || !dataset.activeVersionId) {
            return res.status(404).json({ error: 'No active version' });
        }

        const versionId = (req.query.versionId as string) || dataset.activeVersionId;
        const result = await prisma.eDAResult.findFirst({
            where: { datasetVersionId: versionId, tenantId }
        });

        if (!result) return res.status(404).json({ error: 'EDA results not found' });

        // Note: For now, we use a mock/simplified structure from the summary or a local file.
        // In a real scenario, we'd read the full JSON from S3/local storage.
        const summary = result.summaryJson as any;

        if (tab === 'overview') {
            return res.json({
                dataset_id: dataset.id,
                shape: {
                    rows: summary.overview?.rowCount || 0,
                    columns: summary.overview?.columnCount || 0
                },
                quality_score: 85, // Mock score for now
                completeness: 100 - (summary.overview?.missingRatio || 0),
                columns: summary.overview?.columnTypes ? Object.entries(summary.overview.columnTypes).map(([name, type]) => ({
                    name,
                    type: type as string,
                    missing: 0,
                    unique: 10
                })) : []
            });
        }

        if (tab === 'distributions') {
            return res.json({ distributions: summary.distributions || {} });
        }

        if (tab === 'correlations') {
            return res.json({ correlations: summary.correlations || [] });
        }

        if (tab === 'outliers') {
            return res.json({ outliers: summary.outliers || {} });
        }

        if (tab === 'quality') {
            return res.json(summary.qualitySummary || {});
        }

        res.status(404).json({ error: 'Tab not found' });
    } catch (error) {
        res.status(500).json({ error: 'EDA tab fetch failed' });
    }
});

// Get dataset versions
router.get('/:id/versions', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const tenantId = req.user?.tenantId;
        const versions = await prisma.datasetVersion.findMany({
            where: { datasetId: req.params.id, dataset: { tenantId } },
            orderBy: { versionNumber: 'desc' }
        });
        res.json(versions);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch versions' });
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
