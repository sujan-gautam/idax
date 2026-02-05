import express from 'express';
import { prisma } from '@project-ida/db';
import { authMiddleware, AuthRequest } from '@project-ida/auth';
import Stripe from 'stripe';

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
            datasets: {
                current: await prisma.dataset.count({ where: { tenantId } }),
                limit: tenant?.plan === 'PRO' ? 100 : 5
            },
            storage: {
                current: 0, // usage?.storageUsed || 0,
                limit: quotas?.maxStorageBytes ? Number(quotas.maxStorageBytes) / (1024 * 1024 * 1024) : (tenant?.plan === 'PRO' ? 10 : 1), // in GB
                unit: 'GB'
            },
            apiCalls: {
                current: usage?.totalRequests || 0,
                limit: quotas?.maxApiCallsPerMonth || (tenant?.plan === 'PRO' ? 100000 : 1000)
            },
            users: {
                current: 1, // Default to 1 (owner) for now
                limit: 5 // Default limit
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

        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
            apiVersion: '2023-10-16', // Use a pinned version for stability
        });

        // Map internal plan IDs to Stripe Price IDs from env
        let targetPriceId = priceId;

        // Default to monthly if no interval specified
        // In the future, we can extract { interval } = req.body
        if (priceId === 'pro') targetPriceId = process.env.STRIPE_PRICE_PRO_MONTHLY;
        if (priceId === 'enterprise') targetPriceId = process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY;

        if (!targetPriceId) {
            console.error(`Price ID not found for plan: ${priceId}. Checked env vars: STRIPE_PRICE_PRO_MONTHLY, STRIPE_PRICE_ENTERPRISE_MONTHLY`);
            return res.status(400).json({ error: 'Price ID not configured for this plan. Please check server .env configuration.' });
        }

        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            payment_method_types: ['card'],
            customer_email: req.user?.email, // Pre-fill email
            line_items: [
                {
                    price: targetPriceId,
                    quantity: 1,
                },
            ],
            success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/billing?canceled=true`,
            metadata: {
                tenantId: tenantId!,
            },
        });

        res.json({ url: session.url });

    } catch (error: any) {
        console.error('Stripe Checkout Error:', error);
        res.status(500).json({ error: error.message || 'Failed to create checkout session' });
    }
});

export default router;
