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

// CORS configuration
const allowedOrigins = [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:5173',
    'http://localhost:3000',
];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
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
// HEALTH CHECK
// ============================================================================

app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
    });
});

app.get('/', (req, res) => {
    res.json({
        name: 'Project IDA - Unified API',
        version: '1.0.0',
        status: 'running',
        endpoints: {
            auth: '/api/v1/auth',
            admin: '/api/v1/admin',
            projects: '/api/v1/projects',
            datasets: '/api/v1/datasets',
            jobs: '/api/v1/jobs',
            ai: '/api/v1/ai',
            billing: '/api/v1/billing',
            upload: '/api/v1/upload',
        },
    });
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
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/projects', projectRoutes);
app.use('/api/v1/datasets', datasetRoutes);
app.use('/api/v1/jobs', jobRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/billing', billingRoutes);
app.use('/api/v1/upload', uploadRoutes);
app.use('/api/v1/tenant', tenantRoutes);
app.use('/api/v1/eda', edaRoutes);

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
