import express from 'express';
import { logger } from '@project-ida/logger';
import { prisma } from '@project-ida/db';
import { authMiddleware, AuthRequest } from '@project-ida/auth';
import bcrypt from 'bcrypt';

const router = express.Router();

// ============================================================================
// MIDDLEWARE - Admin Only
// ============================================================================

const adminOnly = async (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
    if (req.user?.role !== 'ADMIN' && req.user?.role !== 'OWNER') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

// ============================================================================
// USER MANAGEMENT
// ============================================================================

// Get all users in tenant
router.get('/users', authMiddleware, adminOnly, async (req: AuthRequest, res) => {
    try {
        const tenantId = req.user?.tenantId;
        const { page = 1, limit = 20, search, role, status } = req.query;

        const skip = (Number(page) - 1) * Number(limit);
        const where: any = { tenantId };

        if (search) {
            where.OR = [
                { email: { contains: search as string, mode: 'insensitive' } },
                { name: { contains: search as string, mode: 'insensitive' } }
            ];
        }

        if (role) where.role = role;
        if (status) where.status = status;

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                skip,
                take: Number(limit),
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    role: true,
                    status: true,
                    createdAt: true,
                    lastLoginAt: true
                }
            }),
            prisma.user.count({ where })
        ]);

        res.json({
            users,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / Number(limit))
            }
        });
    } catch (error: any) {
        logger.error({ error: error.message }, 'Failed to fetch users');
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Get user by ID
router.get('/users/:userId', authMiddleware, adminOnly, async (req: AuthRequest, res) => {
    try {
        const { userId } = req.params;
        const tenantId = req.user?.tenantId;

        const user = await prisma.user.findFirst({
            where: { id: userId, tenantId },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                status: true,
                createdAt: true,
                lastLoginAt: true,
                auditLogs: {
                    take: 10,
                    orderBy: { createdAt: 'desc' },
                    select: {
                        id: true,
                        action: true,
                        entityType: true,
                        createdAt: true
                    }
                }
            }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user);
    } catch (error: any) {
        logger.error({ error: error.message }, 'Failed to fetch user');
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

// Create user
router.post('/users', authMiddleware, adminOnly, async (req: AuthRequest, res) => {
    try {
        const tenantId = req.user?.tenantId;
        const { email, name, password, role = 'MEMBER' } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required' });
        }

        // Check if user already exists
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                email,
                name,
                passwordHash,
                role,
                tenantId: tenantId!,
                status: 'ACTIVE'
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                status: true,
                createdAt: true
            }
        });

        // Audit log
        await prisma.auditLog.create({
            data: {
                tenantId: tenantId!,
                actorUserId: req.user?.userId,
                action: 'USER_CREATED',
                entityType: 'User',
                entityId: user.id,
                diffJson: { email, role }
            }
        });

        res.status(201).json(user);
    } catch (error: any) {
        logger.error({ error: error.message }, 'Failed to create user');
        res.status(500).json({ error: 'Failed to create user' });
    }
});

// Update user
router.patch('/users/:userId', authMiddleware, adminOnly, async (req: AuthRequest, res) => {
    try {
        const { userId } = req.params;
        const tenantId = req.user?.tenantId;
        const { name, role, status } = req.body;

        const user = await prisma.user.findFirst({
            where: { id: userId, tenantId }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const updated = await prisma.user.update({
            where: { id: userId },
            data: {
                ...(name && { name }),
                ...(role && { role }),
                ...(status && { status })
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                status: true,
                createdAt: true,
                lastLoginAt: true
            }
        });

        // Audit log
        await prisma.auditLog.create({
            data: {
                tenantId: tenantId!,
                actorUserId: req.user?.userId,
                action: 'USER_UPDATED',
                entityType: 'User',
                entityId: userId,
                diffJson: { name, role, status }
            }
        });

        res.json(updated);
    } catch (error: any) {
        logger.error({ error: error.message }, 'Failed to update user');
        res.status(500).json({ error: 'Failed to update user' });
    }
});

// Delete user
router.delete('/users/:userId', authMiddleware, adminOnly, async (req: AuthRequest, res) => {
    try {
        const { userId } = req.params;
        const tenantId = req.user?.tenantId;

        // Prevent self-deletion
        if (userId === req.user?.userId) {
            return res.status(400).json({ error: 'Cannot delete your own account' });
        }

        const user = await prisma.user.findFirst({
            where: { id: userId, tenantId }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        await prisma.user.delete({ where: { id: userId } });

        // Audit log
        await prisma.auditLog.create({
            data: {
                tenantId: tenantId!,
                actorUserId: req.user?.userId,
                action: 'USER_DELETED',
                entityType: 'User',
                entityId: userId,
                diffJson: { email: user.email }
            }
        });

        res.json({ success: true });
    } catch (error: any) {
        logger.error({ error: error.message }, 'Failed to delete user');
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

// ============================================================================
// FEATURE FLAGS MANAGEMENT
// ============================================================================

// Get all feature flags
router.get('/feature-flags', authMiddleware, adminOnly, async (req: AuthRequest, res) => {
    try {
        const tenantId = req.user?.tenantId;

        let flags = await prisma.featureFlags.findUnique({
            where: { tenantId: tenantId! }
        });

        if (!flags) {
            // Create default flags
            flags = await prisma.featureFlags.create({
                data: {
                    tenantId: tenantId!,
                    flagsJson: {
                        autoEDA: true,
                        distributions: true,
                        correlations: true,
                        outliers: true,
                        quality: true,
                        advancedCleansing: false,
                        aiAssistant: true,
                        apiAccess: false,
                        customBranding: false,
                        ssoEnabled: false,
                        auditLogs: true,
                        dataExport: true,
                        scheduledReports: false,
                        webhooks: false,
                        advancedAnalytics: false
                    }
                }
            });
        }

        res.json(flags);
    } catch (error: any) {
        logger.error({ error: error.message }, 'Failed to fetch feature flags');
        res.status(500).json({ error: 'Failed to fetch feature flags' });
    }
});

// Update feature flags
router.put('/feature-flags', authMiddleware, adminOnly, async (req: AuthRequest, res) => {
    try {
        const tenantId = req.user?.tenantId;
        const { flags } = req.body;

        const updated = await prisma.featureFlags.upsert({
            where: { tenantId: tenantId! },
            update: { flagsJson: flags },
            create: {
                tenantId: tenantId!,
                flagsJson: flags
            }
        });

        // Audit log
        await prisma.auditLog.create({
            data: {
                tenantId: tenantId!,
                actorUserId: req.user?.userId,
                action: 'FEATURE_FLAGS_UPDATED',
                entityType: 'FeatureFlags',
                entityId: updated.id,
                diffJson: flags
            }
        });

        res.json(updated);
    } catch (error: any) {
        logger.error({ error: error.message }, 'Failed to update feature flags');
        res.status(500).json({ error: 'Failed to update feature flags' });
    }
});

// ============================================================================
// TENANT MANAGEMENT
// ============================================================================

// Get tenant details
router.get('/tenant', authMiddleware, adminOnly, async (req: AuthRequest, res) => {
    try {
        const tenantId = req.user?.tenantId;

        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            include: {
                quotas: true,
                featureFlags: true,
                subscription: true,
                aiUsage: true,
                _count: {
                    select: {
                        users: true,
                        projects: true,
                        datasets: true,
                        uploads: true,
                        jobs: true
                    }
                }
            }
        });

        res.json(tenant);
    } catch (error: any) {
        logger.error({ error: error.message }, 'Failed to fetch tenant');
        res.status(500).json({ error: 'Failed to fetch tenant' });
    }
});

// Update tenant
router.patch('/tenant', authMiddleware, adminOnly, async (req: AuthRequest, res) => {
    try {
        const tenantId = req.user?.tenantId;
        const { name, plan, status } = req.body;

        const updated = await prisma.tenant.update({
            where: { id: tenantId },
            data: {
                ...(name && { name }),
                ...(plan && { plan }),
                ...(status && { status })
            }
        });

        // Audit log
        await prisma.auditLog.create({
            data: {
                tenantId: tenantId!,
                actorUserId: req.user?.userId,
                action: 'TENANT_UPDATED',
                entityType: 'Tenant',
                entityId: tenantId!,
                diffJson: { name, plan, status }
            }
        });

        res.json(updated);
    } catch (error: any) {
        logger.error({ error: error.message }, 'Failed to update tenant');
        res.status(500).json({ error: 'Failed to update tenant' });
    }
});

// ============================================================================
// QUOTAS MANAGEMENT
// ============================================================================

// Get quotas
router.get('/quotas', authMiddleware, adminOnly, async (req: AuthRequest, res) => {
    try {
        const tenantId = req.user?.tenantId;

        let quotas = await prisma.quotas.findUnique({
            where: { tenantId: tenantId! }
        });

        if (!quotas) {
            quotas = await prisma.quotas.create({
                data: { tenantId: tenantId! }
            });
        }

        // Get current usage
        const [projectCount, uploadCount] = await Promise.all([
            prisma.project.count({ where: { tenantId } }),
            prisma.upload.count({
                where: {
                    tenantId,
                    createdAt: {
                        gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                    }
                }
            })
        ]);

        res.json({
            ...quotas,
            currentProjects: projectCount,
            currentUploads: uploadCount
        });
    } catch (error: any) {
        logger.error({ error: error.message }, 'Failed to fetch quotas');
        res.status(500).json({ error: 'Failed to fetch quotas' });
    }
});

// Update quotas
router.put('/quotas', authMiddleware, adminOnly, async (req: AuthRequest, res) => {
    try {
        const tenantId = req.user?.tenantId;
        const { maxProjects, maxStorageBytes, maxUploadsPerMonth, maxApiCallsPerMonth, maxAiTokensPerMonth } = req.body;

        const updated = await prisma.quotas.upsert({
            where: { tenantId: tenantId! },
            update: {
                ...(maxProjects !== undefined && { maxProjects }),
                ...(maxStorageBytes !== undefined && { maxStorageBytes: BigInt(maxStorageBytes) }),
                ...(maxUploadsPerMonth !== undefined && { maxUploadsPerMonth }),
                ...(maxApiCallsPerMonth !== undefined && { maxApiCallsPerMonth }),
                ...(maxAiTokensPerMonth !== undefined && { maxAiTokensPerMonth })
            },
            create: {
                tenantId: tenantId!,
                maxProjects: maxProjects || 5,
                maxStorageBytes: maxStorageBytes ? BigInt(maxStorageBytes) : BigInt(1073741824),
                maxUploadsPerMonth: maxUploadsPerMonth || 50,
                maxApiCallsPerMonth: maxApiCallsPerMonth || 1000,
                maxAiTokensPerMonth: maxAiTokensPerMonth || 50000
            }
        });

        // Audit log
        await prisma.auditLog.create({
            data: {
                tenantId: tenantId!,
                actorUserId: req.user?.userId,
                action: 'QUOTAS_UPDATED',
                entityType: 'Quotas',
                entityId: updated.id,
                diffJson: { maxProjects, maxUploadsPerMonth, maxApiCallsPerMonth, maxAiTokensPerMonth }
            }
        });

        res.json(updated);
    } catch (error: any) {
        logger.error({ error: error.message }, 'Failed to update quotas');
        res.status(500).json({ error: 'Failed to update quotas' });
    }
});

// ============================================================================
// AUDIT LOGS
// ============================================================================

// Get audit logs
router.get('/audit-logs', authMiddleware, adminOnly, async (req: AuthRequest, res) => {
    try {
        const tenantId = req.user?.tenantId;
        const { page = 1, limit = 50, action, entityType, userId } = req.query;

        const skip = (Number(page) - 1) * Number(limit);
        const where: any = { tenantId };

        if (action) where.action = action;
        if (entityType) where.entityType = entityType;
        if (userId) where.actorUserId = userId;

        const [logs, total] = await Promise.all([
            prisma.auditLog.findMany({
                where,
                skip,
                take: Number(limit),
                orderBy: { createdAt: 'desc' },
                include: {
                    actorUser: {
                        select: {
                            id: true,
                            email: true,
                            name: true
                        }
                    }
                }
            }),
            prisma.auditLog.count({ where })
        ]);

        res.json({
            logs,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / Number(limit))
            }
        });
    } catch (error: any) {
        logger.error({ error: error.message }, 'Failed to fetch audit logs');
        res.status(500).json({ error: 'Failed to fetch audit logs' });
    }
});

// ============================================================================
// SYSTEM STATISTICS
// ============================================================================

// Get system statistics
router.get('/statistics', authMiddleware, adminOnly, async (req: AuthRequest, res) => {
    try {
        const tenantId = req.user?.tenantId;

        const [
            totalUsers,
            activeUsers,
            totalProjects,
            totalDatasets,
            totalUploads,
            totalJobs,
            completedJobs,
            failedJobs,
            aiUsage
        ] = await Promise.all([
            prisma.user.count({ where: { tenantId } }),
            prisma.user.count({ where: { tenantId, status: 'ACTIVE' } }),
            prisma.project.count({ where: { tenantId } }),
            prisma.dataset.count({ where: { tenantId } }),
            prisma.upload.count({ where: { tenantId } }),
            prisma.job.count({ where: { tenantId } }),
            prisma.job.count({ where: { tenantId, status: 'COMPLETED' } }),
            prisma.job.count({ where: { tenantId, status: 'FAILED' } }),
            prisma.aiUsage.findUnique({ where: { tenantId: tenantId! } })
        ]);

        // Get activity over last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentActivity = await prisma.auditLog.groupBy({
            by: ['action'],
            where: {
                tenantId,
                createdAt: { gte: thirtyDaysAgo }
            },
            _count: true
        });

        res.json({
            users: {
                total: totalUsers,
                active: activeUsers,
                inactive: totalUsers - activeUsers
            },
            resources: {
                projects: totalProjects,
                datasets: totalDatasets,
                uploads: totalUploads
            },
            jobs: {
                total: totalJobs,
                completed: completedJobs,
                failed: failedJobs,
                successRate: totalJobs > 0 ? ((completedJobs / totalJobs) * 100).toFixed(2) : 0
            },
            ai: {
                tokensUsed: aiUsage?.tokensUsed || 0,
                promptTokens: aiUsage?.promptTokens || 0,
                completionTokens: aiUsage?.completionTokens || 0,
                totalRequests: aiUsage?.totalRequests || 0
            },
            recentActivity: recentActivity.map(a => ({
                action: a.action,
                count: a._count
            }))
        });
    } catch (error: any) {
        logger.error({ error: error.message }, 'Failed to fetch statistics');
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

// ============================================================================
// API KEYS MANAGEMENT
// ============================================================================

// Get all API keys
router.get('/api-keys', authMiddleware, adminOnly, async (req: AuthRequest, res) => {
    try {
        const tenantId = req.user?.tenantId;

        const apiKeys = await prisma.apiKey.findMany({
            where: { tenantId },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                name: true,
                scopesJson: true,
                status: true,
                createdAt: true
            }
        });

        res.json(apiKeys);
    } catch (error: any) {
        logger.error({ error: error.message }, 'Failed to fetch API keys');
        res.status(500).json({ error: 'Failed to fetch API keys' });
    }
});

// Revoke API key
router.delete('/api-keys/:keyId', authMiddleware, adminOnly, async (req: AuthRequest, res) => {
    try {
        const { keyId } = req.params;
        const tenantId = req.user?.tenantId;

        await prisma.apiKey.updateMany({
            where: { id: keyId, tenantId },
            data: { status: 'REVOKED' }
        });

        // Audit log
        await prisma.auditLog.create({
            data: {
                tenantId: tenantId!,
                actorUserId: req.user?.userId,
                action: 'API_KEY_REVOKED',
                entityType: 'ApiKey',
                entityId: keyId
            }
        });

        res.json({ success: true });
    } catch (error: any) {
        logger.error({ error: error.message }, 'Failed to revoke API key');
        res.status(500).json({ error: 'Failed to revoke API key' });
    }
});

export default router;
