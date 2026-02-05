import express from 'express';
import { prisma } from '@project-ida/db';
import { authMiddleware, AuthRequest } from '@project-ida/auth';

const router = express.Router();

// List plans
router.get('/plans', async (req, res) => {
    res.json([
        { id: 'free', name: 'Free', price: 0 },
        { id: 'pro', name: 'Pro', price: 29 },
        { id: 'enterprise', name: 'Enterprise', price: 199 }
    ]);
});

export default router;
