/**
 * UNIFIED API SERVER
 * Consolidates all microservices into a single deployable API
 * Compatible with Vercel, Railway, and other serverless platforms
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { initS3 } from './utils/s3';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================================================
// MIDDLEWARE
// ============================================================================

// Security headers
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
}));

// Body parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Logging
app.use(morgan('combined'));

// Request ID middleware
app.use((req, res, next) => {
    req.headers['x-correlation-id'] = req.headers['x-correlation-id'] ||
        `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    next();
});

// ============================================================================
// SERVE FRONTEND (High Priority)
// ============================================================================

const publicPaths = [
    path.join(__dirname, 'public'),
    path.join(__dirname, '../public'),
    path.join(process.cwd(), 'api/public'),
    path.join(process.cwd(), 'public'),
];

let publicPath = '';
for (const p of publicPaths) {
    if (fs.existsSync(p) && fs.readdirSync(p).length > 0) {
        publicPath = p;
        break;
    }
}

if (publicPath) {
    console.log(`[INFO] Serving static files from ${publicPath}`);
    app.use(express.static(publicPath));
}

// ============================================================================
// API CORS CONFIGURATION
// ============================================================================

const allowedOrigins = [
    process.env.FRONTEND_URL,
    'http://localhost:5173',
    'http://localhost:3000',
].filter(Boolean) as string[];

const corsOptions: cors.CorsOptions = {
    origin: (origin, callback) => {
        // Allow same-origin, localhost, railway domains, vercel domains, and projectida.org
        if (
            !origin ||
            allowedOrigins.includes(origin) ||
            origin.includes('railway.app') ||
            origin.includes('vercel.app') ||
            origin.includes('projectida.org')
        ) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
};

// Health Check
app.get('/api/v1/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// ============================================================================
// API ROUTES - All services consolidated
// ============================================================================

// Import route handlers (we'll create these)
import authRoutes from './routes/auth';
import adminRoutes from './routes/admin';
import projectRoutes from './routes/projects';
import datasetRoutes from './routes/datasets';
import jobRoutes from './routes/jobs';
import aiRoutes from './routes/ai';
import billingRoutes from './routes/billing';
import uploadRoutes from './routes/upload';
import tenantRoutes from './routes/tenant';
import edaRoutes from './routes/eda';

// Mount routes
// Mount routes with CORS
app.use('/api/v1', cors(corsOptions));
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/projects', projectRoutes);
app.use('/api/v1/datasets', datasetRoutes);
app.use('/api/v1/jobs', jobRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/billing', billingRoutes);
app.use('/api/v1/upload', uploadRoutes);
app.use('/api/v1/uploads', uploadRoutes);
app.use('/api/v1/tenant', tenantRoutes);
app.use('/api/v1/tenants', tenantRoutes);
app.use('/api/v1/eda', edaRoutes);

// ============================================================================
// SPA ROUTING FALLBACK
// ============================================================================

if (publicPath) {
    app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api/') || req.path.startsWith('/health')) {
            return next();
        }
        res.sendFile(path.join(publicPath, 'index.html'));
    });
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Cannot ${req.method} ${req.path}`,
        timestamp: new Date().toISOString(),
    });
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('[ERROR]', {
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        correlationId: req.headers['x-correlation-id'],
    });

    const statusCode = err.statusCode || err.status || 500;
    const message = err.message || 'Internal Server Error';

    res.status(statusCode).json({
        error: err.name || 'Error',
        message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
        timestamp: new Date().toISOString(),
        correlationId: req.headers['x-correlation-id'],
    });
});

// ============================================================================
// SERVER START
// ============================================================================

// For Vercel serverless functions
export default app;

// For traditional hosting (Railway, etc.)
if (require.main === module) {
    // Initialize S3
    initS3().catch(err => console.error('[S3_INIT_ERROR]', err));

    app.listen(PORT, () => {
        console.log('='.repeat(60));
        console.log('🚀 Project IDA - Unified API Server');
        console.log('='.repeat(60));
        console.log(`📡 Server running on port ${PORT}`);
        console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`🔗 API Base URL: http://localhost:${PORT}/api/v1`);
        console.log(`💚 Health Check: http://localhost:${PORT}/health`);
        console.log('='.repeat(60));
        console.log('\n📚 Available Endpoints:');
        console.log('  - POST   /api/v1/auth/login');
        console.log('  - POST   /api/v1/auth/register');
        console.log('  - GET    /api/v1/admin/users');
        console.log('  - GET    /api/v1/projects');
        console.log('  - GET    /api/v1/datasets');
        console.log('  - POST   /api/v1/ai/chat');
        console.log('  - GET    /api/v1/billing/plans');
        console.log('  - POST   /api/v1/upload');
        console.log('\n✨ Server ready to accept requests!\n');
    });
}
