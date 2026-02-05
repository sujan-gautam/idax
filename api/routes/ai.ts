import express from 'express';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from '@project-ida/db';
import { authMiddleware, AuthRequest } from '@project-ida/auth';

const router = express.Router();

// Initialize AI Clients
const backendOpenAI = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'sk-placeholder',
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'gemini-placeholder');

const PLAN_LIMITS: Record<string, number> = {
    'FREE': 50000,
    'PRO': 1000000,
    'ENTERPRISE': 10000000,
};

// POST /chat
router.post('/chat', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const tenantId = req.user?.tenantId;
        const { message, provider = 'gemini', datasetId, projectId, sessionId: existingSessionId } = req.body;

        if (!tenantId) return res.status(400).json({ error: 'Missing tenant context' });
        if (!message) return res.status(400).json({ error: 'Message is required' });

        const [tenant, quotas, usage] = await Promise.all([
            prisma.tenant.findUnique({ where: { id: tenantId } }),
            prisma.quotas.findUnique({ where: { tenantId } }),
            prisma.aiUsage.upsert({
                where: { tenantId },
                create: { tenantId },
                update: {},
            })
        ]);

        if (!tenant) return res.status(404).json({ error: 'Tenant not found' });

        const plan = tenant.plan || 'FREE';
        const limit = quotas?.maxAiTokensPerMonth || PLAN_LIMITS[plan];

        if (usage.tokensUsed >= limit) {
            return res.status(403).json({
                error: 'Quota Exceeded',
                message: 'You have exhausted your AI token quota.'
            });
        }

        let session;
        if (existingSessionId) {
            session = await prisma.aiChatSession.findUnique({
                where: { id: existingSessionId, tenantId },
                include: { messages: { orderBy: { createdAt: 'asc' }, take: 10 } }
            });
        }

        if (!session) {
            session = await prisma.aiChatSession.create({
                data: {
                    tenantId,
                    datasetId,
                    projectId,
                    title: message.substring(0, 50)
                }
            });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent(message);
        const answer = result.response.text();

        const totalTokens = Math.ceil((message.length + answer.length) / 4);

        await Promise.all([
            prisma.aiUsage.update({
                where: { tenantId },
                data: { tokensUsed: { increment: totalTokens }, totalRequests: { increment: 1 } }
            }),
            prisma.aiChatMessage.create({
                data: { sessionId: session.id, role: 'user', content: message }
            }),
            prisma.aiChatMessage.create({
                data: { sessionId: session.id, role: 'assistant', content: answer, provider, tokens: totalTokens }
            })
        ]);

        res.json({ answer, sessionId: session.id });
    } catch (error: any) {
        res.status(500).json({ error: 'AI Chat failed', details: error.message });
    }
});

// GET /usage
router.get('/usage', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const tenantId = req.user?.tenantId;
        const [usage, quotas, tenant] = await Promise.all([
            prisma.aiUsage.findUnique({ where: { tenantId: tenantId! } }),
            prisma.quotas.findUnique({ where: { tenantId: tenantId! } }),
            prisma.tenant.findUnique({ where: { id: tenantId! } })
        ]);

        const limit = quotas?.maxAiTokensPerMonth || PLAN_LIMITS[tenant?.plan || 'FREE'];

        res.json({
            used: usage?.tokensUsed || 0,
            limit,
            requests: usage?.totalRequests || 0
        });
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to fetch usage' });
    }
});

export default router;
