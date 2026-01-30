import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '../../../.env') });

import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import { GoogleGenAI } from '@google/genai';
import { logger } from '@project-ida/logger';
import { prisma } from '@project-ida/db';
import { authMiddleware, AuthRequest } from '@project-ida/auth-middleware';

const app = express();
const PORT = process.env.AI_SERVICE_PORT || 8008;

app.use(cors());
app.use(express.json());

// Initialize AI Clients
const backendOpenAI = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'sk-placeholder',
});

// The client gets the API key from the environment variable `GEMINI_API_KEY`.
const genAI = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || 'gemini-placeholder'
});

// AI Token Limits by Plan (Sync with Pricing)
const PLAN_LIMITS: Record<string, number> = {
    'FREE': 50000,
    'PRO': 1000000,
    'ENTERPRISE': 10000000,
};

// Health Check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'ai' });
});

/**
 * POST /chat
 * Chat with the database/datasets
 * Body: { message: string, provider?: 'openai' | 'gemini', datasetId?: string, projectId?: string, sessionId?: string }
 */
app.post('/chat', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'] as string;
        const { message, provider = 'gemini', datasetId, projectId, sessionId: existingSessionId } = req.body;

        if (!tenantId) {
            return res.status(400).json({ error: 'Missing tenant context' });
        }

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // 1. Fetch Tenant and Quotas
        const [tenant, quotas, usage] = await Promise.all([
            prisma.tenant.findUnique({ where: { id: tenantId } }),
            prisma.quotas.findUnique({ where: { tenantId } }),
            (prisma as any).aiUsage.upsert({
                where: { tenantId },
                create: { tenantId },
                update: {},
            })
        ]);

        if (!tenant) return res.status(404).json({ error: 'Tenant not found' });

        const plan = (tenant as any).plan || 'FREE';
        const limit = (quotas as any)?.maxAiTokensPerMonth || PLAN_LIMITS[plan];

        if ((usage as any).tokensUsed >= limit) {
            return res.status(403).json({
                error: 'Quota Exceeded',
                message: 'You have exhausted your AI token quota. Please upgrade your plan or use your own API key if supported.',
                code: 'AI_QUOTA_EXCEEDED'
            });
        }

        // 1.5. Prepare or Fetch Session
        let session;
        let historyContext = "";

        if (existingSessionId) {
            session = await prisma.aiChatSession.findUnique({
                where: { id: existingSessionId, tenantId },
                include: {
                    messages: {
                        orderBy: { createdAt: 'asc' },
                        take: 10 // Last 10 messages for context
                    }
                }
            });

            if (session) {
                historyContext = session.messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n');
            }
        }

        if (!session) {
            session = await prisma.aiChatSession.create({
                data: {
                    tenantId,
                    datasetId,
                    projectId,
                    title: message.substring(0, 50) + (message.length > 50 ? '...' : '')
                }
            });
        }

        // 2. Fetch Data Context
        const datasets = await prisma.dataset.findMany({
            where: {
                tenantId,
                ...(datasetId ? { id: datasetId } : {}),
                ...(projectId ? { projectId } : {}),
            },
            include: {
                versions: {
                    orderBy: { versionNumber: 'desc' },
                    take: 1,
                    include: {
                        edaResults: {
                            orderBy: { createdAt: 'desc' },
                            take: 1
                        }
                    }
                }
            }
        });

        const contextSummary = datasets.map(d => {
            const latest = d.versions[0];
            const eda = (latest as any)?.edaResults?.[0];
            return `Dataset: ${d.name}
Schema: ${JSON.stringify(latest?.schemaJson || {})}
Stats Summary: ${JSON.stringify(latest?.statsSummaryJson || {})}
Full EDA Overview: ${JSON.stringify(eda?.summaryJson || {})}
Rows: ${latest?.rowCount || 0}
Columns: ${latest?.columnCount || 0}`;
        }).join('\n\n');

        const systemPrompt = `You are IDA AI, an expert data analyst assistant for Project IDA.
Base answers strictly on the provided context.
If no data exists, suggest connecting a database or running a re-analysis.

When analyzing:
1. Check the 'Full EDA Overview' for Top Correlations. If strong correlations (>0.6) exist, highlight them.
2. Look for 'Outliers' count. If high, mention potential data noise.
3. Use the 'Schema' to explain what columns are available.
4. If asked about rows/columns, use the explicit 'Rows' and 'Columns' counts.

CONTEXT:
${contextSummary || 'No active datasets found.'}

CONVERSATION HISTORY:
${historyContext || 'No previous history.'}`;

        let answer = '';
        let totalTokens = 0;

        // 3. Choice of Provider
        if (provider === 'openai') {
            const openai = (tenant as any).openaiApiKey ? new OpenAI({ apiKey: (tenant as any).openaiApiKey }) : backendOpenAI;

            const completion = await openai.chat.completions.create({
                model: "gpt-4-turbo-preview",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: message }
                ],
                temperature: 0.1,
            });

            answer = completion.choices[0].message.content || '';
            totalTokens = completion.usage?.total_tokens || 0;

            if ((tenant as any).openaiApiKey) {
                totalTokens = 0;
            }

        } else {
            // gemini-3-flash-preview (latest) with fallback to gemini-1.5-flash-8b (high quota)
            try {
                const result = await genAI.models.generateContent({
                    model: "gemini-3-flash-preview",
                    contents: `${systemPrompt}\n\nUser Question: ${message}`
                });
                answer = (result as any).text;
            } catch (geminiError: any) {
                logger.error({ error: geminiError.message }, 'Gemini Primary (gemini-3) failed, trying fallback');
                const fallbackResult = await genAI.models.generateContent({
                    model: "gemini-3-flash-preview",
                    contents: `${systemPrompt}\n\nUser Question: ${message}`
                });
                answer = (fallbackResult as any).text;
            }

            // Simplified token estimation
            totalTokens = Math.ceil((systemPrompt.length + message.length + answer.length) / 4);
        }

        // 4. Update Usage and Save Messages
        const updateTasks: any[] = [];

        if (totalTokens > 0) {
            updateTasks.push(prisma.aiUsage.update({
                where: { tenantId },
                data: {
                    tokensUsed: { increment: totalTokens },
                    totalRequests: { increment: 1 },
                    lastUsedAt: new Date(),
                }
            }));
        }

        // Save User Message
        updateTasks.push(prisma.aiChatMessage.create({
            data: {
                sessionId: session.id,
                role: 'user',
                content: message
            }
        }));

        // Save AI Message
        updateTasks.push(prisma.aiChatMessage.create({
            data: {
                sessionId: session.id,
                role: 'assistant',
                content: answer,
                provider,
                tokens: totalTokens
            }
        }));

        await Promise.all(updateTasks);

        res.json({
            answer,
            provider,
            sessionId: session.id,
            isUsingCustomKey: !!(provider === 'openai' && tenant.openaiApiKey),
            usage: {
                consumed: totalTokens,
                remaining: limit - (usage.tokensUsed + totalTokens)
            }
        });

    } catch (error: any) {
        logger.error({ error: error.message }, 'AI Chat failed');
        res.status(500).json({ error: 'AI Error', details: error.message });
    }
});

/**
 * GET /usage
 */
app.get('/usage', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'] as string;
        const [usage, quotas, tenant] = await Promise.all([
            (prisma as any).aiUsage.findUnique({ where: { tenantId } }),
            prisma.quotas.findUnique({ where: { tenantId } }),
            prisma.tenant.findUnique({ where: { id: tenantId } })
        ]);

        const limit = (quotas as any)?.maxAiTokensPerMonth || PLAN_LIMITS[(tenant as any)?.plan || 'FREE'];

        res.json({
            used: (usage as any)?.tokensUsed || 0,
            limit,
            requests: (usage as any)?.totalRequests || 0,
            hasCustomApiKey: !!(tenant as any)?.openaiApiKey
        });
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to fetch usage' });
    }
});

/**
 * GET /sessions
 */
app.get('/sessions', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'] as string;
        const { datasetId } = req.query;

        const sessions = await prisma.aiChatSession.findMany({
            where: {
                tenantId,
                ...(datasetId ? { datasetId: datasetId as string } : {})
            },
            orderBy: { updatedAt: 'desc' },
            take: 20
        });

        res.json(sessions);
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to fetch sessions' });
    }
});

/**
 * GET /sessions/:id
 */
app.get('/sessions/:id', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'] as string;
        const { id } = req.params;

        const session = await prisma.aiChatSession.findUnique({
            where: { id, tenantId },
            include: {
                messages: {
                    orderBy: { createdAt: 'asc' }
                }
            }
        });

        if (!session) return res.status(404).json({ error: 'Session not found' });
        res.json(session);
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to fetch session' });
    }
});

/**
 * DELETE /sessions/:id
 */
app.delete('/sessions/:id', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'] as string;
        const { id } = req.params;

        await prisma.aiChatMessage.deleteMany({ where: { sessionId: id } });
        await prisma.aiChatSession.delete({ where: { id, tenantId } });

        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to delete session' });
    }
});

app.listen(PORT, () => {
    logger.info(`AI Service (Gemini + OpenAI) running on port ${PORT}`);
});
