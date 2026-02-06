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

        // Fetch dataset context if applicable
        let systemContext = `You are IDA, an expert AI data analyst. You help users analyze their datasets.
        
        Guidelines:
        - Be concise and helpful.
        - If the user asks about specific data, refer to the provided schema/stats.
        - If you don't have the data to answer, explain what you know and what you're missing.
        - You can write SQL or Python pandas code if helpful.
        `;

        if (datasetId) {
            const dataset = await prisma.dataset.findUnique({
                where: { id: datasetId, tenantId },
                include: {
                    versions: {
                        take: 1,
                        orderBy: { versionNumber: 'desc' },
                        where: { id: (await prisma.dataset.findUnique({ where: { id: datasetId } }))?.activeVersionId || undefined }
                    }
                }
            });

            if (dataset && dataset.versions.length > 0) {
                const version = dataset.versions[0];
                const stats = version.statsSummaryJson as any;
                const schema = version.schemaJson as any;

                systemContext += `
                
                Current Dataset Context:
                - Name: ${dataset.name}
                - Rows: ${version.rowCount || 'Unknown'}
                - Columns: ${version.columnCount || 'Unknown'}
                
                Schema/Columns:
                ${JSON.stringify(schema || {}, null, 2)}
                
                Statistical Summary (first few):
                ${JSON.stringify(stats || {}, null, 2).substring(0, 1000)}...
                `;
            }
        }

        // Use v1beta for preview models like gemini-2.5-flash
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            systemInstruction: systemContext
        }, { apiVersion: 'v1beta' });

        let chatHistory: any[] = [];
        if (session) {
            // Load previous messages for context
            const history = await prisma.aiChatMessage.findMany({
                where: { sessionId: session.id },
                orderBy: { createdAt: 'asc' },
                take: 20
            });

            chatHistory = history.map(m => ({
                role: m.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: m.content }]
            }));
        }

        const chat = model.startChat({
            history: chatHistory
        });

        const result = await chat.sendMessage(message);
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

        res.json({
            answer,
            sessionId: session.id,
            usage: { consumed: totalTokens }
        });
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

// GET /sessions
router.get('/sessions', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const tenantId = req.user?.tenantId;
        const { datasetId, projectId } = req.query;

        const where: any = { tenantId };
        if (datasetId) where.datasetId = datasetId as string;
        if (projectId) where.projectId = projectId as string;

        const sessions = await prisma.aiChatSession.findMany({
            where,
            include: {
                _count: { select: { messages: true } }
            },
            orderBy: { updatedAt: 'desc' }
        });

        res.json(sessions);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch sessions' });
    }
});

// GET /sessions/:id
router.get('/sessions/:id', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const tenantId = req.user?.tenantId;
        const session = await prisma.aiChatSession.findFirst({
            where: { id: req.params.id, tenantId },
            include: {
                messages: { orderBy: { createdAt: 'asc' } }
            }
        });

        if (!session) return res.status(404).json({ error: 'Session not found' });
        res.json(session);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch session details' });
    }
});

// DELETE /sessions/:id
router.delete('/sessions/:id', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const tenantId = req.user?.tenantId;
        await prisma.aiChatSession.delete({
            where: { id: req.params.id, tenantId }
        });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete session' });
    }
});

export default router;
