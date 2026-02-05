import express from 'express';
import { prisma } from '@project-ida/db';
import { authMiddleware, AuthRequest } from '@project-ida/auth';

const router = express.Router();

// Get tenant metadata (flags, quotas)
router.get('/:id/metadata', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const tenantId = req.params.id;
        const [tenant, flags, quotas] = await Promise.all([
            prisma.tenant.findUnique({ where: { id: tenantId } }),
            prisma.featureFlags.findUnique({ where: { tenantId } }),
            prisma.quotas.findUnique({ where: { tenantId } })
        ]);

        if (!tenant) {
            return res.status(404).json({ error: 'Tenant not found' });
        }

        // Get current project count for quota check
        const projectCount = await prisma.project.count({ where: { tenantId } });

        // Default flags
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
        res.status(500).json({ error: 'Internal error' });
    }
});

// Update tenant settings
router.patch('/:id', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const { openaiApiKey } = req.body;
        const tenantId = req.params.id;

        // Verify user is in this tenant or is global admin
        if (req.user?.tenantId !== tenantId && req.user?.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Forbidden' });
        }

        await prisma.tenant.update({
            where: { id: tenantId },
            data: { openaiApiKey }
        });

        res.json({ message: 'Tenant updated successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update tenant' });
    }
});

router.get('/settings', authMiddleware, async (req: AuthRequest, res) => {
    const tenantId = req.user?.tenantId;
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    res.json(tenant);
});

export default router;
