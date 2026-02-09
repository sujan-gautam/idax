import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '../../../.env') });

import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { logger } from '@project-ida/logger';
import { prisma } from '@project-ida/db';

const app = express();
const PORT = process.env.AUTH_SERVICE_PORT || 8006;

app.use(express.json());

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

// Extend Express Request type
declare global {
    namespace Express {
        interface Request {
            user?: TokenPayload;
        }
    }
}

// Health Check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'auth' });
});

// Register (creates tenant + admin user)
app.post('/register', async (req, res) => {
    try {
        const { email, password, name, tenantName } = req.body;

        if (!email || !password || !tenantName) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Check if user exists
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return res.status(409).json({ error: 'User already exists' });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Create tenant + user in transaction (PostgreSQL supports transactions natively)
        const result = await prisma.$transaction(async (tx) => {
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

        logger.info({ userId: result.user.id, tenantId: result.tenant.id }, 'User registered');

        // Generate tokens
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
        logger.error(error, 'Registration failed');
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Login
app.post('/login', async (req, res) => {
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

        if (user.tenant.status !== 'ACTIVE') {
            return res.status(403).json({ error: 'Tenant account is suspended' });
        }

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Update last login
        await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() }
        });

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

        logger.info({ userId: user.id }, 'User logged in');

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
        logger.error(error, 'Login failed');
        res.status(500).json({ error: 'Login failed' });
    }
});

// Refresh Token
app.post('/refresh', async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({ error: 'Refresh token required' });
        }

        const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as TokenPayload;

        // Verify user still exists and is active
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
        logger.error(error, 'Token refresh failed');
        res.status(401).json({ error: 'Invalid refresh token' });
    }
});

// Verify Token (for other services)
app.post('/verify', async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({ error: 'Token required' });
        }

        const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;

        res.json({
            valid: true,
            payload: decoded
        });

    } catch (error) {
        res.status(401).json({ valid: false, error: 'Invalid token' });
    }
});

// Get Current User
app.get('/me', authenticateToken, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user!.userId },
            include: { tenant: true }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

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
            }
        });

    } catch (error) {
        logger.error(error, 'Failed to get user');
        res.status(500).json({ error: 'Failed to get user' });
    }
});

// Update Profile
app.put('/me', authenticateToken, async (req, res) => {
    try {
        const { name } = req.body;
        const userId = req.user!.userId;

        const user = await prisma.user.update({
            where: { id: userId },
            data: { name }
        });

        logger.info({ userId }, 'User profile updated');

        res.json({
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                tenantId: user.tenantId
            }
        });
    } catch (error) {
        logger.error(error, 'Failed to update user profile');
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

// Change Password
app.post('/change-password', authenticateToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user!.userId;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Missing fields' });
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || !user.passwordHash) {
            return res.status(404).json({ error: 'User not found' });
        }

        const valid = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!valid) {
            return res.status(401).json({ error: 'Invalid current password' });
        }

        const passwordHash = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({
            where: { id: userId },
            data: { passwordHash }
        });

        logger.info({ userId }, 'Password changed');
        res.json({ message: 'Password updated successfully' });

    } catch (error) {
        logger.error(error, 'Failed to change password');
        res.status(500).json({ error: 'Failed to change password' });
    }
});

// Middleware to authenticate requests
function authenticateToken(req: any, res: any, next: any) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
}

function generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
}

function generateRefreshToken(payload: TokenPayload): string {
    return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });
}

app.listen(PORT, () => {
    logger.info(`Auth Service running on port ${PORT}`);
});
