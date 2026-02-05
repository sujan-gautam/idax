import express from 'express';
import { prisma } from '@project-ida/db';
import { authMiddleware, AuthRequest } from '@project-ida/auth';

const router = express.Router();

router.post('/', authMiddleware, async (req: AuthRequest, res) => {
    res.json({ message: 'Upload functionality placeholder' });
});

export default router;
