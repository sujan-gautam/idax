import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '../../../.env') });

import express from 'express';
import { logger } from '@project-ida/logger';
import { prisma } from '@project-ida/db';
import { authMiddleware, AuthRequest } from '@project-ida/auth-middleware';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

const app = express();
const PORT = process.env.PORT || 8001;

app.use(express.json());

const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    endpoint: process.env.AWS_S3_ENDPOINT,
    forcePathStyle: true,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'password'
    }
});

// Health Check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'tenant' });
});

// ============================================================================
// PROJECTS CRUD
// ============================================================================

// List all projects for tenant
app.get('/projects', async (req, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'] as string;

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
        logger.error(error, 'Failed to list projects');
        res.status(500).json({ error: 'Failed to list projects' });
    }
});

// Get single project
app.get('/projects/:id', async (req, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'] as string;

        if (!tenantId) {
            return res.status(400).json({ error: 'Missing tenant context' });
        }

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
        logger.error(error, 'Failed to get project');
        res.status(500).json({ error: 'Failed to get project' });
    }
});

// Create project
app.post('/projects', async (req, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'] as string;
        const { name, description } = req.body;

        if (!tenantId) {
            return res.status(400).json({ error: 'Missing tenant context' });
        }

        if (!name) {
            return res.status(400).json({ error: 'Project name is required' });
        }

        const project = await prisma.project.create({
            data: {
                tenantId,
                name,
                description
            }
        });

        logger.info({ projectId: project.id, tenantId }, 'Project created');
        res.status(201).json(project);
    } catch (error) {
        logger.error(error, 'Failed to create project');
        res.status(500).json({ error: 'Failed to create project' });
    }
});

// Update project
app.put('/projects/:id', async (req, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'] as string;
        const { name, description } = req.body;

        if (!tenantId) {
            return res.status(400).json({ error: 'Missing tenant context' });
        }

        // Verify ownership
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

        logger.info({ projectId: project.id, tenantId }, 'Project updated');
        res.json(project);
    } catch (error) {
        logger.error(error, 'Failed to update project');
        res.status(500).json({ error: 'Failed to update project' });
    }
});

// Delete project
app.delete('/projects/:id', async (req, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'] as string;

        if (!tenantId) {
            return res.status(400).json({ error: 'Missing tenant context' });
        }

        // Verify ownership
        const existing = await prisma.project.findFirst({
            where: {
                id: req.params.id,
                tenantId
            }
        });

        if (!existing) {
            return res.status(404).json({ error: 'Project not found' });
        }

        // Delete project (cascade will handle datasets)
        await prisma.project.delete({
            where: { id: req.params.id }
        });

        logger.info({ projectId: req.params.id, tenantId }, 'Project deleted');
        res.json({ success: true });
    } catch (error) {
        logger.error(error, 'Failed to delete project');
        res.status(500).json({ error: 'Failed to delete project' });
    }
});

// ============================================================================
// DATASETS
// ============================================================================

// List datasets (optionally filtered by project)
app.get('/datasets', async (req, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'] as string;
        const projectId = req.query.projectId as string;

        if (!tenantId) {
            return res.status(400).json({ error: 'Missing tenant context' });
        }

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
        logger.error(error, 'Failed to list datasets');
        res.status(500).json({ error: 'Failed to list datasets' });
    }
});

// Get dataset details
app.get('/datasets/:id', async (req, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'] as string;

        if (!tenantId) {
            return res.status(400).json({ error: 'Missing tenant context' });
        }

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
        logger.error(error, 'Failed to get dataset');
        res.status(500).json({ error: 'Failed to get dataset' });
    }
});

// Get dataset versions
app.get('/datasets/:id/versions', async (req, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'] as string;

        if (!tenantId) {
            return res.status(400).json({ error: 'Missing tenant context' });
        }

        // Verify dataset ownership
        const dataset = await prisma.dataset.findFirst({
            where: {
                id: req.params.id,
                tenantId
            }
        });

        if (!dataset) {
            return res.status(404).json({ error: 'Dataset not found' });
        }

        const versions = await prisma.datasetVersion.findMany({
            where: { datasetId: req.params.id },
            orderBy: { versionNumber: 'desc' }
        });

        res.json(versions);
    } catch (error) {
        logger.error(error, 'Failed to get versions');
        res.status(500).json({ error: 'Failed to get versions' });
    }
});

// Rollback dataset to specific version
app.post('/datasets/:id/rollback', async (req, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'] as string;
        const { versionId } = req.body;

        if (!tenantId) {
            return res.status(400).json({ error: 'Missing tenant context' });
        }

        if (!versionId) {
            return res.status(400).json({ error: 'Version ID is required' });
        }

        // Verify dataset ownership
        const dataset = await prisma.dataset.findFirst({
            where: {
                id: req.params.id,
                tenantId
            }
        });

        if (!dataset) {
            return res.status(404).json({ error: 'Dataset not found' });
        }

        // Verify version exists
        const version = await prisma.datasetVersion.findFirst({
            where: {
                id: versionId,
                datasetId: req.params.id
            }
        });

        if (!version) {
            return res.status(404).json({ error: 'Version not found' });
        }

        // Update active version
        const updated = await prisma.dataset.update({
            where: { id: req.params.id },
            data: { activeVersionId: versionId }
        });

        logger.info({
            datasetId: req.params.id,
            versionId,
            tenantId
        }, 'Dataset rolled back');

        res.json(updated);
    } catch (error) {
        logger.error(error, 'Failed to rollback dataset');
        res.status(500).json({ error: 'Failed to rollback dataset' });
    }
});

// Get dataset preview
app.get('/datasets/:id/preview', async (req, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'] as string;

        if (!tenantId) {
            return res.status(400).json({ error: 'Missing tenant context' });
        }

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

        // Fetch S3 artifact with local fallback
        let str: string | undefined;
        try {
            const command = new GetObjectCommand({
                Bucket: process.env.S3_BUCKET_NAME || 'project-ida-uploads',
                Key: version.artifactS3Key
            });
            const response = await s3Client.send(command);
            str = await response.Body?.transformToString();
            logger.info({ s3Key: version.artifactS3Key }, 'Preview data fetched from S3');
        } catch (s3Err: any) {
            logger.warn({ s3Key: version.artifactS3Key }, 'S3 preview fetch failed, trying local fallback');
            try {
                const uploadUrl = process.env.UPLOAD_SERVICE_URL || 'http://localhost:8002';
                const localRes = await fetch(`${uploadUrl}/local-s3/${version.artifactS3Key}`);
                if (!localRes.ok) throw new Error(`Local fallback failed: ${localRes.statusText}`);
                str = await localRes.text();
                logger.info({ s3Key: version.artifactS3Key }, 'Preview data fetched from local storage');
            } catch (fallbackErr: any) {
                logger.error({ fallbackErr }, 'Preview fallback failed');
                return res.json([]);
            }
        }

        if (!str) {
            return res.json([]);
        }

        const data = JSON.parse(str);
        const preview = Array.isArray(data) ? data.slice(0, 100) : data;

        res.json(preview);
    } catch (error) {
        logger.error(error, 'Failed to get preview');
        res.status(500).json({ error: 'Preview failed' });
    }
});

// Get dataset processing status
app.get('/datasets/:id/status', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const tenantId = req.tenantId!;

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
        logger.error(error, 'Failed to get dataset status');
        res.status(500).json({ error: 'Status check failed' });
    }
});

// Get EDA results
app.get('/datasets/:id/eda', async (req, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'] as string;

        if (!tenantId) {
            return res.status(400).json({ error: 'Missing tenant context' });
        }

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

        // Check if S3 key exists
        if (!result.resultS3Key) {
            return res.status(404).json({ error: 'EDA result not available' });
        }

        // Fetch from S3 with local fallback
        let str: string | undefined;
        try {
            const command = new GetObjectCommand({
                Bucket: process.env.S3_BUCKET_NAME || 'project-ida-uploads',
                Key: result.resultS3Key
            });
            const response = await s3Client.send(command);
            str = await response.Body?.transformToString();
            logger.info({ s3Key: result.resultS3Key }, 'EDA data fetched from S3');
        } catch (s3Err: any) {
            logger.warn({ s3Key: result.resultS3Key }, 'S3 EDA fetch failed, trying local fallback');
            try {
                const uploadUrl = process.env.UPLOAD_SERVICE_URL || 'http://localhost:8002';
                const localRes = await fetch(`${uploadUrl}/local-s3/${result.resultS3Key}`);
                if (!localRes.ok) throw new Error(`Local fallback failed: ${localRes.statusText}`);
                str = await localRes.text();
                logger.info({ s3Key: result.resultS3Key }, 'EDA data fetched from local storage');
            } catch (fallbackErr: any) {
                logger.error({ fallbackErr }, 'EDA fallback failed');
                return res.status(500).json({ error: 'Failed to fetch EDA data' });
            }
        }

        res.send(str);
    } catch (error) {
        logger.error(error, 'Failed to get EDA');
        res.status(500).json({ error: 'EDA fetch failed' });
    }
});

// Forward EDA overview to EDA service
app.get('/datasets/:id/eda/overview', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const tenantId = req.tenantId!;
        const edaServiceUrl = process.env.EDA_SERVICE_URL || 'http://localhost:8004';
        const response = await fetch(`${edaServiceUrl}/eda/overview?datasetId=${req.params.id}`, {
            headers: {
                'x-tenant-id': tenantId,
                'Authorization': req.headers.authorization!
            }
        });

        const data = await response.json();
        res.json(data);
    } catch (error) {
        logger.error(error, 'Failed to get EDA overview');
        res.status(500).json({ error: 'Failed to get overview' });
    }
});

// Forward EDA distributions to EDA service
app.get('/datasets/:id/eda/distributions', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const tenantId = req.tenantId!;
        const edaServiceUrl = process.env.EDA_SERVICE_URL || 'http://localhost:8004';
        const response = await fetch(`${edaServiceUrl}/eda/distributions?datasetId=${req.params.id}`, {
            headers: {
                'x-tenant-id': tenantId,
                'Authorization': req.headers.authorization!
            }
        });

        const data = await response.json();
        res.json(data);
    } catch (error) {
        logger.error(error, 'Failed to get distributions');
        res.status(500).json({ error: 'Failed to get distributions' });
    }
});

// Forward EDA correlations to EDA service
app.get('/datasets/:id/eda/correlations', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const tenantId = req.tenantId!;
        const method = req.query.method || 'pearson';
        const edaServiceUrl = process.env.EDA_SERVICE_URL || 'http://localhost:8004';
        const response = await fetch(`${edaServiceUrl}/eda/correlations?datasetId=${req.params.id}&method=${method}`, {
            headers: {
                'x-tenant-id': tenantId,
                'Authorization': req.headers.authorization!
            }
        });

        const data = await response.json();
        res.json(data);
    } catch (error) {
        logger.error(error, 'Failed to get correlations');
        res.status(500).json({ error: 'Failed to get correlations' });
    }
});

// Forward EDA outliers to EDA service
app.get('/datasets/:id/eda/outliers', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const tenantId = req.tenantId!;
        const edaServiceUrl = process.env.EDA_SERVICE_URL || 'http://localhost:8004';
        const response = await fetch(`${edaServiceUrl}/eda/outliers?datasetId=${req.params.id}`, {
            headers: {
                'x-tenant-id': tenantId,
                'Authorization': req.headers.authorization!
            }
        });

        const data = await response.json();
        res.json(data);
    } catch (error) {
        logger.error(error, 'Failed to get outliers');
        res.status(500).json({ error: 'Failed to get outliers' });
    }
});

// Forward EDA quality to EDA service
app.get('/datasets/:id/eda/quality', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const tenantId = req.tenantId!;
        const edaServiceUrl = process.env.EDA_SERVICE_URL || 'http://localhost:8004';
        const response = await fetch(`${edaServiceUrl}/eda/quality?datasetId=${req.params.id}`, {
            headers: {
                'x-tenant-id': tenantId,
                'Authorization': req.headers.authorization!
            }
        });

        const data = await response.json();
        res.json(data);
    } catch (error) {
        logger.error(error, 'Failed to get quality');
        res.status(500).json({ error: 'Failed to get quality' });
    }
});

// ============================================================================
// TENANT MANAGEMENT (Admin)
// ============================================================================

app.post('/tenants', async (req, res) => {
    try {
        const { name, plan, userEmail } = req.body;

        const tenant = await prisma.tenant.create({
            data: {
                name,
                plan: plan || 'FREE',
                users: {
                    create: {
                        email: userEmail,
                        role: 'ADMIN',
                        name: userEmail.split('@')[0],
                    }
                }
            },
            include: {
                users: true
            }
        });

        logger.info({ tenantId: tenant.id }, 'Tenant created');
        res.json(tenant);
    } catch (error) {
        logger.error(error, 'Failed to create tenant');
        res.status(500).json({ error: 'Failed to create tenant' });
    }
});

app.get('/tenants/:id/metadata', async (req, res) => {
    try {
        const [tenant, flags, quotas] = await Promise.all([
            prisma.tenant.findUnique({ where: { id: req.params.id } }),
            prisma.featureFlags.findUnique({ where: { tenantId: req.params.id } }),
            prisma.quotas.findUnique({ where: { tenantId: req.params.id } })
        ]);

        if (!tenant) {
            return res.status(404).json({ error: 'Tenant not found' });
        }

        // Get current project count for quota check
        const projectCount = await prisma.project.count({ where: { tenantId: req.params.id } });

        // Default flags for all users
        const defaultFlags = {
            distributions: true,
            correlations: true,
            outliers: true,
            quality: true,
            advancedCleansing: false,
            exportReports: false
        };

        res.json({
            flags: { ...defaultFlags, ...(flags?.flagsJson as object || {}) },
            quotas: quotas ? {
                ...quotas,
                currentProjects: projectCount
            } : null
        });
    } catch (error) {
        logger.error(error, 'Metadata fetch failed');
        res.status(500).json({ error: 'Internal error' });
    }
});

app.listen(PORT, () => {
    logger.info(`Tenant Service running on port ${PORT}`);
});
