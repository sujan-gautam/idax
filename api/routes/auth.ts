import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '@project-ida/db';

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-change-in-production';
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

interface TokenPayload {
    userId: string;
    tenantId: string;
    email: string;
    role: string;
}

// Generate tokens
function generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
}

function generateRefreshToken(payload: TokenPayload): string {
    return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });
}

// Register
router.post('/register', async (req, res) => {
    try {
        const { email, password, name, tenantName } = req.body;

        if (!email || !password || !tenantName) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return res.status(409).json({ error: 'User already exists' });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const result = await prisma.$transaction(async (tx: any) => {
            const tenant = await tx.tenant.create({
                data: {
                    name: tenantName,
                    plan: 'FREE',
                    status: 'ACTIVE'
                }
            });

            const user = await tx.user.create({
                data: {
                    email,
                    passwordHash,
                    name: name || email.split('@')[0],
                    tenantId: tenant.id,
                    role: 'OWNER',
                    status: 'ACTIVE'
                }
            });

            return { tenant, user };
        });

        const accessToken = generateAccessToken({
            userId: result.user.id,
            tenantId: result.tenant.id,
            email: result.user.email,
            role: result.user.role
        });

        const refreshToken = generateRefreshToken({
            userId: result.user.id,
            tenantId: result.tenant.id,
            email: result.user.email,
            role: result.user.role
        });

        res.status(201).json({
            user: {
                id: result.user.id,
                email: result.user.email,
                name: result.user.name,
                role: result.user.role,
                tenantId: result.tenant.id
            },
            tenant: {
                id: result.tenant.id,
                name: result.tenant.name,
                plan: result.tenant.plan
            },
            accessToken,
            refreshToken
        });

    } catch (error) {
        console.error('[AUTH_REGISTER_ERROR]', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Missing credentials' });
        }

        const user = await prisma.user.findUnique({
            where: { email },
            include: { tenant: true }
        });

        if (!user || !user.passwordHash) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        if (user.status !== 'ACTIVE') {
            return res.status(403).json({ error: 'Account is not active' });
        }

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const accessToken = generateAccessToken({
            userId: user.id,
            tenantId: user.tenantId,
            email: user.email,
            role: user.role
        });

        const refreshToken = generateRefreshToken({
            userId: user.id,
            tenantId: user.tenantId,
            email: user.email,
            role: user.role
        });

        res.json({
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                tenantId: user.tenantId
            },
            tenant: {
                id: user.tenant.id,
                name: user.tenant.name,
                plan: user.tenant.plan
            },
            accessToken,
            refreshToken
        });

    } catch (error) {
        console.error('[AUTH_LOGIN_ERROR]', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Refresh Token
router.post('/refresh', async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({ error: 'Refresh token required' });
        }

        const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as TokenPayload;

        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            include: { tenant: true }
        });

        if (!user || user.status !== 'ACTIVE' || user.tenant.status !== 'ACTIVE') {
            return res.status(401).json({ error: 'Invalid refresh token' });
        }

        const newAccessToken = generateAccessToken({
            userId: user.id,
            tenantId: user.tenantId,
            email: user.email,
            role: user.role
        });

        res.json({
            accessToken: newAccessToken,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                tenantId: user.tenantId
            },
            tenant: {
                id: user.tenant.id,
                name: user.tenant.name,
                plan: user.tenant.plan
            }
        });

    } catch (error) {
        res.status(401).json({ error: 'Invalid refresh token' });
    }
});

export default router;
