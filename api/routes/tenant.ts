import express from 'express';
import { prisma } from '@project-ida/db';
import { authMiddleware, AuthRequest } from '@project-ida/auth';

const router = express.Router();

router.get('/settings', authMiddleware, async (req: AuthRequest, res) => {
    const tenantId = req.user?.tenantId;
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    res.json(tenant);
});

export default router;
