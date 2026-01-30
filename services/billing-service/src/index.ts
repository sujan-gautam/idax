/**
 * BILLING SERVICE
 * Handles Stripe integration, subscriptions, payments, and usage tracking
 */

import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '../../../.env') });

import express from 'express';
import Stripe from 'stripe';
import { logger } from '@project-ida/logger';
import { prisma, Plan } from '@project-ida/db';
import { authMiddleware, AuthRequest } from '@project-ida/auth-middleware';

const app = express();
const PORT = process.env.PORT || 8007;

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2023-10-16',
});

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'billing' });
});

/**
 * GET /subscription
 * Get current subscription details for the tenant
 */
app.get('/subscription', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'] as string;

        if (!tenantId) {
            return res.status(400).json({ error: 'Tenant ID required' });
        }

        const subscription = await prisma.subscription.findUnique({
            where: { tenantId },
            include: {
                tenant: {
                    select: {
                        name: true,
                        plan: true,
                        status: true
                    }
                }
            }
        });

        if (!subscription) {
            return res.json({
                plan: 'FREE',
                status: 'ACTIVE',
                billingInterval: 'MONTH',
                currentPeriodEnd: null
            });
        }

        res.json({
            plan: subscription.plan,
            status: subscription.status,
            billingInterval: subscription.billingInterval,
            currentPeriodStart: subscription.currentPeriodStart,
            currentPeriodEnd: subscription.currentPeriodEnd,
            cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
            trialEnd: subscription.trialEnd
        });
    } catch (error: any) {
        logger.error({ error: error.message }, 'Failed to fetch subscription');
        res.status(500).json({ error: 'Failed to fetch subscription' });
    }
});

/**
 * GET /usage
 * Get current usage statistics for the tenant
 */
app.get('/usage', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'] as string;

        if (!tenantId) {
            return res.status(400).json({ error: 'Tenant ID required' });
        }

        // Get tenant's plan limits
        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { plan: true }
        });

        if (!tenant) {
            return res.status(404).json({ error: 'Tenant not found' });
        }

        // Define plan limits
        const planLimits = {
            FREE: {
                datasets: 5,
                storage: 1, // GB
                users: 1,
                apiCalls: 1000
            },
            PRO: {
                datasets: 100,
                storage: 50,
                users: 5,
                apiCalls: 50000
            },
            ENTERPRISE: {
                datasets: 'unlimited',
                storage: 'unlimited',
                users: 'unlimited',
                apiCalls: 'unlimited'
            }
        };

        const limits = planLimits[tenant.plan];

        // Get actual usage
        const [datasetCount, userCount] = await Promise.all([
            prisma.dataset.count({ where: { tenantId } }),
            prisma.user.count({ where: { tenantId } })
        ]);

        // Calculate storage (simplified - Dataset model doesn't have sizeBytes yet)
        // TODO: Add sizeBytes field to Dataset model or calculate from DatasetVersion
        const totalStorageGB = 0;

        // Get API calls from usage records (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const subscription = await prisma.subscription.findUnique({
            where: { tenantId },
            include: {
                usageRecords: {
                    where: {
                        metricType: 'api_calls',
                        timestamp: { gte: thirtyDaysAgo }
                    }
                }
            }
        });

        const apiCalls = subscription?.usageRecords.reduce((sum, record) => sum + record.quantity, 0) || 0;

        res.json({
            datasets: {
                current: datasetCount,
                limit: limits.datasets
            },
            storage: {
                current: parseFloat(totalStorageGB.toFixed(2)),
                limit: limits.storage,
                unit: 'GB'
            },
            users: {
                current: userCount,
                limit: limits.users
            },
            apiCalls: {
                current: apiCalls,
                limit: limits.apiCalls
            }
        });
    } catch (error: any) {
        logger.error({ error: error.message }, 'Failed to fetch usage');
        res.status(500).json({ error: 'Failed to fetch usage' });
    }
});

/**
 * GET /payment-methods
 * Get payment methods for the tenant
 */
app.get('/payment-methods', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'] as string;

        if (!tenantId) {
            return res.status(400).json({ error: 'Tenant ID required' });
        }

        const paymentMethods = await prisma.paymentMethod.findMany({
            where: { tenantId },
            orderBy: { createdAt: 'desc' }
        });

        res.json(paymentMethods.map(pm => ({
            id: pm.id,
            type: pm.type,
            brand: pm.brand,
            last4: pm.last4,
            expiryMonth: pm.expiryMonth,
            expiryYear: pm.expiryYear,
            isDefault: pm.isDefault
        })));
    } catch (error: any) {
        logger.error({ error: error.message }, 'Failed to fetch payment methods');
        res.status(500).json({ error: 'Failed to fetch payment methods' });
    }
});

/**
 * GET /invoices
 * Get billing history (invoices) for the tenant
 */
app.get('/invoices', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'] as string;

        if (!tenantId) {
            return res.status(400).json({ error: 'Tenant ID required' });
        }

        const subscription = await prisma.subscription.findUnique({
            where: { tenantId },
            include: {
                invoices: {
                    orderBy: { createdAt: 'desc' },
                    take: 12 // Last 12 invoices
                }
            }
        });

        if (!subscription) {
            return res.json([]);
        }

        res.json(subscription.invoices.map(inv => ({
            id: inv.id,
            invoiceNumber: inv.invoiceNumber,
            status: inv.status,
            amount: inv.amountDue / 100, // Convert cents to dollars
            currency: inv.currency,
            periodStart: inv.periodStart,
            periodEnd: inv.periodEnd,
            paidAt: inv.paidAt,
            hostedInvoiceUrl: inv.hostedInvoiceUrl,
            invoicePdf: inv.invoicePdf
        })));
    } catch (error: any) {
        logger.error({ error: error.message }, 'Failed to fetch invoices');
        res.status(500).json({ error: 'Failed to fetch invoices' });
    }
});

/**
 * POST /create-checkout-session
 * Create a Stripe checkout session for upgrading/downgrading plans
 */
app.post('/create-checkout-session', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'] as string;
        const { plan, billingInterval } = req.body;

        if (!tenantId) {
            return res.status(400).json({ error: 'Tenant ID required' });
        }

        if (!plan || !billingInterval) {
            return res.status(400).json({ error: 'Plan and billing interval required' });
        }

        // Get or create Stripe customer
        let subscription = await prisma.subscription.findUnique({
            where: { tenantId }
        });

        let customerId: string;

        if (!subscription) {
            // Create new Stripe customer
            const tenant = await prisma.tenant.findUnique({
                where: { id: tenantId },
                include: { users: { take: 1 } }
            });

            const customer = await stripe.customers.create({
                email: tenant?.users[0]?.email,
                metadata: { tenantId }
            });

            customerId = customer.id;

            // Create subscription record
            subscription = await prisma.subscription.create({
                data: {
                    tenantId,
                    stripeCustomerId: customerId,
                    plan: 'FREE', // Start as FREE, webhook will update to PRO/ENTERPRISE
                    billingInterval: billingInterval.toUpperCase()
                }
            });
        } else {
            customerId = subscription.stripeCustomerId;
        }

        // Map plans to Stripe price IDs (these should be in environment variables)
        const priceIds: Record<string, Record<string, string>> = {
            PRO: {
                MONTH: process.env.STRIPE_PRICE_PRO_MONTHLY || 'price_pro_monthly',
                YEAR: process.env.STRIPE_PRICE_PRO_YEARLY || 'price_pro_yearly'
            },
            ENTERPRISE: {
                MONTH: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY || 'price_enterprise_monthly',
                YEAR: process.env.STRIPE_PRICE_ENTERPRISE_YEARLY || 'price_enterprise_yearly'
            }
        };

        const priceId = priceIds[plan]?.[billingInterval.toUpperCase()];

        if (!priceId) {
            return res.status(400).json({ error: 'Invalid plan or billing interval' });
        }

        // Create Stripe checkout session
        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [
                {
                    price: priceId,
                    quantity: 1
                }
            ],
            success_url: `${process.env.FRONTEND_URL}/billing?success=true`,
            cancel_url: `${process.env.FRONTEND_URL}/billing?canceled=true`,
            metadata: {
                tenantId,
                plan,
                billingInterval
            }
        });

        res.json({ url: session.url });
    } catch (error: any) {
        logger.error({ error: error.message }, 'Failed to create checkout session');
        res.status(500).json({ error: 'Failed to create checkout session' });
    }
});

/**
 * POST /create-portal-session
 * Create a Stripe customer portal session for managing subscription
 */
app.post('/create-portal-session', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'] as string;

        if (!tenantId) {
            return res.status(400).json({ error: 'Tenant ID required' });
        }

        const subscription = await prisma.subscription.findUnique({
            where: { tenantId }
        });

        if (!subscription) {
            return res.status(404).json({ error: 'No subscription found' });
        }

        const session = await stripe.billingPortal.sessions.create({
            customer: subscription.stripeCustomerId,
            return_url: `${process.env.FRONTEND_URL}/billing`
        });

        res.json({ url: session.url });
    } catch (error: any) {
        logger.error({ error: error.message }, 'Failed to create portal session');
        res.status(500).json({ error: 'Failed to create portal session' });
    }
});

/**
 * POST /webhook
 * Handle Stripe webhooks for subscription events
 */
app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err: any) {
        logger.error({ error: err.message }, 'Webhook signature verification failed');
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    try {
        switch (event.type) {
            case 'customer.subscription.created':
            case 'customer.subscription.updated':
                const subscription = event.data.object as Stripe.Subscription;
                await handleSubscriptionUpdate(subscription);
                break;

            case 'customer.subscription.deleted':
                const deletedSubscription = event.data.object as Stripe.Subscription;
                await handleSubscriptionCancellation(deletedSubscription);
                break;

            case 'invoice.paid':
                const invoice = event.data.object as Stripe.Invoice;
                await handleInvoicePaid(invoice);
                break;

            case 'invoice.payment_failed':
                const failedInvoice = event.data.object as Stripe.Invoice;
                await handleInvoicePaymentFailed(failedInvoice);
                break;

            default:
                logger.info({ type: event.type }, 'Unhandled webhook event');
        }

        res.json({ received: true });
    } catch (error: any) {
        logger.error({ error: error.message, type: event.type }, 'Webhook handler failed');
        res.status(500).json({ error: 'Webhook handler failed' });
    }
});

// Webhook handlers
async function handleSubscriptionUpdate(stripeSubscription: Stripe.Subscription) {
    const tenantId = stripeSubscription.metadata.tenantId;

    if (!tenantId) {
        logger.error('No tenantId in subscription metadata');
        return;
    }

    const plan = stripeSubscription.metadata.plan as Plan || 'PRO';

    await prisma.subscription.update({
        where: { tenantId },
        data: {
            stripeSubscriptionId: stripeSubscription.id,
            stripePriceId: stripeSubscription.items.data[0]?.price.id,
            plan,
            status: stripeSubscription.status.toUpperCase() as any,
            currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
            currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
            cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end
        }
    });

    // Update tenant plan
    await prisma.tenant.update({
        where: { id: tenantId },
        data: { plan }
    });

    logger.info({ tenantId, plan }, 'Subscription updated');
}

async function handleSubscriptionCancellation(stripeSubscription: Stripe.Subscription) {
    const tenantId = stripeSubscription.metadata.tenantId;

    if (!tenantId) return;

    await prisma.subscription.update({
        where: { tenantId },
        data: {
            status: 'CANCELED',
            canceledAt: new Date()
        }
    });

    // Downgrade to free plan
    await prisma.tenant.update({
        where: { id: tenantId },
        data: { plan: 'FREE' }
    });

    logger.info({ tenantId }, 'Subscription canceled');
}

async function handleInvoicePaid(stripeInvoice: Stripe.Invoice) {
    const subscription = await prisma.subscription.findUnique({
        where: { stripeCustomerId: stripeInvoice.customer as string }
    });

    if (!subscription) return;

    await prisma.invoice.upsert({
        where: { stripeInvoiceId: stripeInvoice.id },
        create: {
            subscriptionId: subscription.id,
            stripeInvoiceId: stripeInvoice.id,
            invoiceNumber: stripeInvoice.number || undefined,
            status: 'PAID',
            amountDue: stripeInvoice.amount_due,
            amountPaid: stripeInvoice.amount_paid,
            currency: stripeInvoice.currency,
            periodStart: new Date(stripeInvoice.period_start * 1000),
            periodEnd: new Date(stripeInvoice.period_end * 1000),
            paidAt: new Date(),
            hostedInvoiceUrl: stripeInvoice.hosted_invoice_url || undefined,
            invoicePdf: stripeInvoice.invoice_pdf || undefined
        },
        update: {
            status: 'PAID',
            amountPaid: stripeInvoice.amount_paid,
            paidAt: new Date()
        }
    });

    logger.info({ invoiceId: stripeInvoice.id }, 'Invoice paid');
}

async function handleInvoicePaymentFailed(stripeInvoice: Stripe.Invoice) {
    const subscription = await prisma.subscription.findUnique({
        where: { stripeCustomerId: stripeInvoice.customer as string }
    });

    if (!subscription) return;

    await prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: 'PAST_DUE' }
    });

    logger.warn({ invoiceId: stripeInvoice.id, tenantId: subscription.tenantId }, 'Invoice payment failed');
}

app.listen(PORT, () => {
    logger.info(`Billing Service running on port ${PORT}`);
});
