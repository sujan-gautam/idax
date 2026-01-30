import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '../../../.env') });

import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import cors from 'cors';
import helmet from 'helmet';
import { logger } from '@project-ida/logger';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = process.env.PORT || 8000;

// Security middleware
app.use(cors());
app.use(helmet());
// app.use(express.json()); // Global JSON parsing can cause proxy hangs

// Correlation ID middleware - MUST be first
app.use((req, res, next) => {
    req.headers['x-correlation-id'] = req.headers['x-correlation-id'] || uuidv4();
    res.setHeader('x-correlation-id', req.headers['x-correlation-id'] as string);
    next();
});

// Request logging
app.use((req, res, next) => {
    logger.info({
        correlationId: req.headers['x-correlation-id'],
        method: req.method,
        path: req.path,
        ip: req.ip
    }, 'Incoming request');
    next();
});

// Health Check (public)
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'gateway' });
});

// Service URLs
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:8006';
const TENANT_SERVICE_URL = process.env.TENANT_SERVICE_URL || 'http://localhost:8001';
const UPLOAD_SERVICE_URL = process.env.UPLOAD_SERVICE_URL || 'http://localhost:8002';
const PARSER_SERVICE_URL = process.env.PARSER_SERVICE_URL || 'http://localhost:8003';
const EDA_SERVICE_URL = process.env.EDA_SERVICE_URL || 'http://localhost:8004';
const JOB_ORCHESTRATOR_SERVICE_URL = process.env.JOB_ORCHESTRATOR_SERVICE_URL || 'http://localhost:8005';
const BILLING_SERVICE_URL = process.env.BILLING_SERVICE_URL || 'http://localhost:8007';
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8008';

// Auth routes (public - no middleware)
app.use('/api/v1/auth', createProxyMiddleware({
    target: AUTH_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { '^/api/v1/auth': '' },
    onProxyReq: (proxyReq, req) => {
        proxyReq.setHeader('x-correlation-id', req.headers['x-correlation-id'] as string);
    },
    onError: (err, req, res) => {
        logger.error({
            correlationId: req.headers['x-correlation-id'],
            error: err.message,
            service: 'auth'
        }, 'Proxy error');
        (res as any).status(503).json({
            error: 'Service Unavailable',
            message: 'Auth service is temporarily unavailable',
            correlationId: req.headers['x-correlation-id']
        });
    }
}));

// Protected routes - all require auth
// Note: Individual services will validate tokens and enforce tenant isolation

app.use('/api/v1/tenants', createProxyMiddleware({
    target: TENANT_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { '^/api/v1/tenants': '/tenants' },
    onProxyReq: (proxyReq, req) => {
        proxyReq.setHeader('x-correlation-id', req.headers['x-correlation-id'] as string);
        // Forward auth header
        if (req.headers.authorization) {
            proxyReq.setHeader('authorization', req.headers.authorization);
        }
    },
    onError: handleProxyError('tenant')
}));

app.use('/api/v1/uploads', createProxyMiddleware({
    target: UPLOAD_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { '^/api/v1/uploads': '/uploads' },
    onProxyReq: (proxyReq, req) => {
        proxyReq.setHeader('x-correlation-id', req.headers['x-correlation-id'] as string);
        if (req.headers.authorization) {
            proxyReq.setHeader('authorization', req.headers.authorization);
        }
    },
    onError: handleProxyError('upload')
}));

app.use('/api/v1/datasets', createProxyMiddleware({
    target: TENANT_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { '^/api/v1/datasets': '/datasets' },
    onProxyReq: (proxyReq, req) => {
        proxyReq.setHeader('x-correlation-id', req.headers['x-correlation-id'] as string);
        if (req.headers.authorization) {
            proxyReq.setHeader('authorization', req.headers.authorization);
        }
    },
    onError: handleProxyError('tenant')
}));

app.use('/api/v1/projects', createProxyMiddleware({
    target: TENANT_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { '^/api/v1/projects': '/projects' },
    onProxyReq: (proxyReq, req) => {
        proxyReq.setHeader('x-correlation-id', req.headers['x-correlation-id'] as string);
        if (req.headers.authorization) {
            proxyReq.setHeader('authorization', req.headers.authorization);
        }
    },
    onError: handleProxyError('tenant')
}));

app.use('/api/v1/jobs', createProxyMiddleware({
    target: JOB_ORCHESTRATOR_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { '^/api/v1/jobs': '/jobs' },
    onProxyReq: (proxyReq, req) => {
        proxyReq.setHeader('x-correlation-id', req.headers['x-correlation-id'] as string);
        if (req.headers.authorization) {
            proxyReq.setHeader('authorization', req.headers.authorization);
        }
        // Forward tenant ID for multi-tenancy
        if (req.headers['x-tenant-id']) {
            proxyReq.setHeader('x-tenant-id', req.headers['x-tenant-id'] as string);
        }
    },
    onError: handleProxyError('job-orchestrator')
}));

app.use('/api/v1/eda', createProxyMiddleware({
    target: EDA_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { '^/api/v1/eda': '/eda' },
    onProxyReq: (proxyReq, req) => {
        proxyReq.setHeader('x-correlation-id', req.headers['x-correlation-id'] as string);
        if (req.headers.authorization) {
            proxyReq.setHeader('authorization', req.headers.authorization);
        }
    },
    onError: handleProxyError('eda')
}));

app.use('/api/v1/billing', createProxyMiddleware({
    target: BILLING_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { '^/api/v1/billing': '' },
    onProxyReq: (proxyReq, req) => {
        proxyReq.setHeader('x-correlation-id', req.headers['x-correlation-id'] as string);
        if (req.headers.authorization) {
            proxyReq.setHeader('authorization', req.headers.authorization);
        }
        if (req.headers['x-tenant-id']) {
            proxyReq.setHeader('x-tenant-id', req.headers['x-tenant-id'] as string);
        }
    },
    onError: handleProxyError('billing')
}));

app.use('/api/v1/ai', createProxyMiddleware({
    target: AI_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { '^/api/v1/ai': '' },
    onProxyReq: (proxyReq, req) => {
        proxyReq.setHeader('x-correlation-id', req.headers['x-correlation-id'] as string);
        if (req.headers.authorization) {
            proxyReq.setHeader('authorization', req.headers.authorization);
        }
        if (req.headers['x-tenant-id']) {
            proxyReq.setHeader('x-tenant-id', req.headers['x-tenant-id'] as string);
        }
    },
    onError: handleProxyError('ai')
}));

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.path} not found`,
        correlationId: req.headers['x-correlation-id']
    });
});

// Error handler
app.use((err: any, req: any, res: any, next: any) => {
    logger.error({
        correlationId: req.headers['x-correlation-id'],
        error: err.message,
        stack: err.stack
    }, 'Unhandled error');

    res.status(500).json({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
        correlationId: req.headers['x-correlation-id']
    });
});

function handleProxyError(serviceName: string) {
    return (err: any, req: any, res: any) => {
        logger.error({
            correlationId: req.headers['x-correlation-id'],
            error: err.message,
            service: serviceName
        }, 'Proxy error');
        res.status(503).json({
            error: 'Service Unavailable',
            message: `${serviceName} service is temporarily unavailable`,
            correlationId: req.headers['x-correlation-id']
        });
    };
}

app.listen(PORT, () => {
    logger.info(`Gateway Service running on port ${PORT}`);
});
