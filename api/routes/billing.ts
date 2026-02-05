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

// GET /usage - Get current usage stats
router.get('/usage', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const tenantId = req.user?.tenantId;
        const [usage, quotas, tenant] = await Promise.all([
            prisma.aiUsage.findUnique({ where: { tenantId: tenantId! } }),
            prisma.quotas.findUnique({ where: { tenantId: tenantId! } }),
            prisma.tenant.findUnique({ where: { id: tenantId! } })
        ]);

        res.json({
            storage: {
                used: 0, // Storage usage not currently tracked in AiUsage
                limit: quotas?.maxStorageBytes ? Number(quotas.maxStorageBytes) : (tenant?.plan === 'PRO' ? 10737418240 : 1073741824) // 10GB or 1GB
            },
            ai_tokens: {
                used: usage?.tokensUsed || 0,
                limit: quotas?.maxAiTokensPerMonth || (tenant?.plan === 'PRO' ? 1000000 : 50000)
            },
            datasets: {
                used: await prisma.dataset.count({ where: { tenantId } }),
                // maxDatasets not in schema, using fallback based on plan
                limit: tenant?.plan === 'PRO' ? 100 : 5
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch usage' });
    }
});

// GET /invoices - List invoices
router.get('/invoices', authMiddleware, async (req: AuthRequest, res) => {
    try {
        // Mock invoices for now, or fetch from Stripe/DB if implemented
        res.json([]);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch invoices' });
    }
});

// GET /payment-methods
router.get('/payment-methods', authMiddleware, async (req: AuthRequest, res) => {
    try {
        // Mock payment methods or fetch from Stripe
        res.json([]);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch payment methods' });
    }
});

// GET /subscription - Get current subscription
router.get('/subscription', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const tenantId = req.user?.tenantId;
        const subscription = await prisma.subscription.findUnique({
            where: { tenantId: tenantId! }
        });

        if (!subscription) {
            return res.json({
                plan: 'FREE',
                status: 'active',
                billingInterval: 'month'
            });
        }

        res.json(subscription);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch subscription' });
    }
});

// POST /create-checkout-session
router.post('/create-checkout-session', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const { priceId } = req.body;
        const tenantId = req.user?.tenantId;

        // Mock success for development if no Stripe key is set
        if (!process.env.STRIPE_SECRET_KEY) {
            return res.json({
                url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/billing?success=true&session_id=mock_session_123`
            });
        }

        // Stripe Logic would go here (placeholder if key IS present but logic missing)
        // In a real implementation:
        // const session = await stripe.checkout.sessions.create({ ... })
        // res.json({ url: session.url })

        res.status(501).json({ error: 'Stripe integration pending implementation' });

    } catch (error) {
        res.status(500).json({ error: 'Failed to create checkout session' });
    }
});

export default router;
