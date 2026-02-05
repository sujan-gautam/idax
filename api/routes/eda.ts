import express from 'express';
import { prisma } from '@project-ida/db';
import { authMiddleware, AuthRequest } from '@project-ida/auth';

const router = express.Router();

router.get('/overview', authMiddleware, async (req: AuthRequest, res) => {
    res.json({ message: 'EDA overview placeholder' });
});

export default router;
