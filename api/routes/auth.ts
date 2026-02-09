import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
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

import { sendVerificationEmail } from '../utils/email';

// ...

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
        const verificationToken = crypto.randomBytes(32).toString('hex');

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
                    status: 'INACTIVE', // Enforce inactive until verified
                    verificationToken
                }
            });

            return { tenant, user };
        });

        // Send Email (Real or Ethereal)
        try {
            await sendVerificationEmail(email, verificationToken);
        } catch (emailError) {
            console.error('[AUTH_REGISTER_EMAIL_ERROR]', emailError);
            // Don't fail registration if email fails, but log it.
            // In strict prod, you might want to rollback.
        }

        res.status(201).json({
            message: 'Registration successful. Please check your email to verify account.',
            requireVerification: true
        });

    } catch (error) {
        console.error('[AUTH_REGISTER_ERROR]', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Verify Email Endpoint
router.post('/verify', async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) return res.status(400).json({ error: 'Token required' });

        const user = await prisma.user.findFirst({
            where: { verificationToken: token }
        });

        if (!user) {
            return res.status(400).json({ error: 'Invalid or expired verification token' });
        }

        await prisma.user.update({
            where: { id: user.id },
            data: {
                status: 'ACTIVE',
                verificationToken: null
            }
        });

        res.json({ success: true, message: 'Email verified successfully. You can now login.' });
    } catch (error) {
        res.status(500).json({ error: 'Verification failed' });
    }
});

// Resend Verification Email Endpoint
router.post('/start-verification', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: 'Email required' });

        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            // Check security best practices: should we tell if user exists?
            // For now, let's say "If an account exists, email sent" to prevent enumeration.
            // But for detailed UX requested by user, I will be explicit for now as it's an MVP context.
            return res.status(404).json({ error: 'User not found' });
        }

        if (user.status === 'ACTIVE') {
            return res.status(400).json({ error: 'Account already verified' });
        }

        // Generate new token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        await prisma.user.update({
            where: { id: user.id },
            data: { verificationToken }
        });

        await sendVerificationEmail(email, verificationToken);

        res.json({ success: true, message: 'Verification email sent' });
    } catch (error) {
        console.error('[AUTH_RESEND_ERROR]', error);
        res.status(500).json({ error: 'Failed to send verification email' });
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
            return res.status(403).json({ error: 'Account is not active. Please verify your email.', requireVerification: true });
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
