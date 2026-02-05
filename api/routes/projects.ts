import express from 'express';
import { prisma } from '@project-ida/db';
import { authMiddleware, AuthRequest } from '@project-ida/auth';

const router = express.Router();

// List all projects for tenant
router.get('/', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const tenantId = req.user?.tenantId;

        if (!tenantId) {
            return res.status(400).json({ error: 'Missing tenant context' });
        }

        const projects = await prisma.project.findMany({
            where: { tenantId },
            include: {
                _count: {
                    select: { datasets: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(projects);
    } catch (error) {
        res.status(500).json({ error: 'Failed to list projects' });
    }
});

// Get single project
router.get('/:id', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const tenantId = req.user?.tenantId;

        const project = await prisma.project.findFirst({
            where: {
                id: req.params.id,
                tenantId
            },
            include: {
                datasets: {
                    orderBy: { createdAt: 'desc' },
                    take: 10
                }
            }
        });

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        res.json(project);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get project' });
    }
});

// Create project
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const tenantId = req.user?.tenantId;
        const { name, description } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Project name is required' });
        }

        const project = await prisma.project.create({
            data: {
                tenantId: tenantId!,
                name,
                description
            }
        });

        res.status(201).json(project);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create project' });
    }
});

// Update project
router.put('/:id', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const tenantId = req.user?.tenantId;
        const { name, description } = req.body;

        const existing = await prisma.project.findFirst({
            where: {
                id: req.params.id,
                tenantId
            }
        });

        if (!existing) {
            return res.status(404).json({ error: 'Project not found' });
        }

        const project = await prisma.project.update({
            where: { id: req.params.id },
            data: {
                name: name || existing.name,
                description: description !== undefined ? description : existing.description
            }
        });

        res.json(project);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update project' });
    }
});

// Delete project
router.delete('/:id', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const tenantId = req.user?.tenantId;

        const existing = await prisma.project.findFirst({
            where: {
                id: req.params.id,
                tenantId
            }
        });

        if (!existing) {
            return res.status(404).json({ error: 'Project not found' });
        }

        // Cascade delete all related entities
        await prisma.$transaction(async (tx) => {
            // Find all datasets in this project
            const datasets = await tx.dataset.findMany({
                where: { projectId: req.params.id },
                select: { id: true }
            });

            const datasetIds = datasets.map(d => d.id);

            // Delete related resources for these datasets
            if (datasetIds.length > 0) {
                await tx.aiChatSession.deleteMany({ where: { datasetId: { in: datasetIds } } });
                await tx.recipe.deleteMany({ where: { datasetId: { in: datasetIds } } });

                // Find versions to find EDA results
                const versions = await tx.datasetVersion.findMany({
                    where: { datasetId: { in: datasetIds } },
                    select: { id: true }
                });
                const versionIds = versions.map(v => v.id);

                if (versionIds.length > 0) {
                    await tx.eDAResult.deleteMany({ where: { datasetVersionId: { in: versionIds } } });
                    // Delete jobs related to versions
                    await tx.job.deleteMany({ where: { datasetVersionId: { in: versionIds } } });
                }

                // Delete uploads and jobs related to datasets
                await tx.upload.deleteMany({ where: { datasetId: { in: datasetIds } } });
                await tx.job.deleteMany({ where: { datasetId: { in: datasetIds } } });

                // Finally delete versions and datasets
                await tx.datasetVersion.deleteMany({ where: { datasetId: { in: datasetIds } } });
                await tx.dataset.deleteMany({ where: { projectId: req.params.id } });
            }

            // Delete project chat sessions first
            await tx.aiChatSession.deleteMany({ where: { projectId: req.params.id } });

            // Delete the project
            await tx.project.delete({
                where: { id: req.params.id }
            });
        });

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete project' });
    }
});

export default router;
