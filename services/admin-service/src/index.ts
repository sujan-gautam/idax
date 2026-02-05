import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '../../../.env') });

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { logger } from '@project-ida/logger';
import { adminRateLimit } from '@project-ida/auth';
import adminRoutes from './routes/admin';

const app = express();
const PORT = process.env.ADMIN_SERVICE_PORT || 8009;

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
}));

// CORS - only allow specific origins
const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, etc)
        if (!origin) return callback(null, true);

        if (allowedOrigins.indexOf(origin) === -1) {
            logger.warn({ origin }, 'Blocked CORS request from unauthorized origin');
            return callback(new Error('CORS policy: Origin not allowed'), false);
        }
        return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant-id', 'x-correlation-id']
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
app.use(adminRateLimit);

// Request logging
app.use((req, res, next) => {
    logger.info({
        method: req.method,
        path: req.path,
        ip: req.ip,
        userAgent: req.get('user-agent')
    }, 'Admin API request');
    next();
});

// Health check (no auth required)
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'admin',
        timestamp: new Date().toISOString()
    });
});

// Admin routes (all require authentication)
app.use('/admin', adminRoutes);

// 404 handler
app.use((req, res) => {
    logger.warn({ path: req.path, method: req.method }, 'Route not found');
    res.status(404).json({
        error: 'NotFound',
        message: `Route ${req.method} ${req.path} not found`
    });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    logger.error({
        error: err.message,
        stack: err.stack,
        path: req.path
    }, 'Admin service error');

    res.status(err.status || 500).json({
        error: err.name || 'InternalServerError',
        message: err.message || 'An unexpected error occurred'
    });
});

app.listen(PORT, () => {
    logger.info(`🔒 Admin Service (SECURED) running on port ${PORT}`);
    logger.info(`🛡️  Security features: Helmet, CORS, Rate Limiting, JWT Auth`);
});
