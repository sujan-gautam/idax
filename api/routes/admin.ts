import express from 'express';
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
        res.status(500).json({ error: 'Failed to fetch users' });
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
            }
        });

        res.status(201).json(user);
    } catch (error: any) {
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
            }
        });

        res.json(updated);
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to update user' });
    }
});

// Delete user
router.delete('/users/:userId', authMiddleware, adminOnly, async (req: AuthRequest, res) => {
    try {
        const { userId } = req.params;
        const tenantId = req.user?.tenantId;

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
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

// ============================================================================
// FEATURE FLAGS MANAGEMENT
// ============================================================================

router.get('/feature-flags', authMiddleware, adminOnly, async (req: AuthRequest, res) => {
    try {
        const tenantId = req.user?.tenantId;
        let flags = await prisma.featureFlags.findUnique({
            where: { tenantId: tenantId! }
        });

        if (!flags) {
            flags = await prisma.featureFlags.create({
                data: {
                    tenantId: tenantId!,
                    flagsJson: {
                        autoEDA: true,
                        aiAssistant: true,
                        auditLogs: true,
                        dataExport: true
                    }
                }
            });
        }

        res.json(flags);
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to fetch feature flags' });
    }
});

router.put('/feature-flags', authMiddleware, adminOnly, async (req: AuthRequest, res) => {
    try {
        const tenantId = req.user?.tenantId;
        const { flags } = req.body;

        const updated = await prisma.featureFlags.upsert({
            where: { tenantId: tenantId! },
            update: { flagsJson: flags },
            create: { tenantId: tenantId!, flagsJson: flags }
        });

        res.json(updated);
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to update feature flags' });
    }
});

// ============================================================================
// QUOTAS MANAGEMENT
// ============================================================================

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
        res.status(500).json({ error: 'Failed to fetch quotas' });
    }
});

router.put('/quotas', authMiddleware, adminOnly, async (req: AuthRequest, res) => {
    try {
        const tenantId = req.user?.tenantId;
        const { maxProjects, maxUploadsPerMonth } = req.body;

        const updated = await prisma.quotas.upsert({
            where: { tenantId: tenantId! },
            update: {
                ...(maxProjects !== undefined && { maxProjects }),
                ...(maxUploadsPerMonth !== undefined && { maxUploadsPerMonth })
            },
            create: {
                tenantId: tenantId!,
                maxProjects: maxProjects || 5,
                maxUploadsPerMonth: maxUploadsPerMonth || 50
            }
        });

        res.json(updated);
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to update quotas' });
    }
});

// ============================================================================
// AUDIT LOGS
// ============================================================================

router.get('/audit-logs', authMiddleware, adminOnly, async (req: AuthRequest, res) => {
    try {
        const tenantId = req.user?.tenantId;
        const { page = 1, limit = 50 } = req.query;

        const skip = (Number(page) - 1) * Number(limit);
        const [logs, total] = await Promise.all([
            prisma.auditLog.findMany({
                where: { tenantId },
                skip,
                take: Number(limit),
                orderBy: { createdAt: 'desc' },
                include: {
                    actorUser: {
                        select: { id: true, email: true, name: true }
                    }
                }
            }),
            prisma.auditLog.count({ where: { tenantId } })
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
        res.status(500).json({ error: 'Failed to fetch audit logs' });
    }
});

// ============================================================================
// SYSTEM STATISTICS
// ============================================================================

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

        res.json({
            users: { total: totalUsers, active: activeUsers, inactive: totalUsers - activeUsers },
            resources: { projects: totalProjects, datasets: totalDatasets, uploads: totalUploads },
            jobs: { total: totalJobs, completed: completedJobs, failed: failedJobs },
            ai: { tokensUsed: aiUsage?.tokensUsed || 0, totalRequests: aiUsage?.totalRequests || 0 }
        });
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

export default router;
