import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { logger } from '@project-ida/logger';

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:8006';

export interface AuthenticatedRequest extends Request {
    user: {
        userId: string;
        tenantId: string;
        email: string;
        role: string;
    };
    correlationId: string;
}

/**
 * PRODUCTION TENANT ISOLATION MIDDLEWARE
 * Enforces strict tenant context on EVERY request
 * NO EXCEPTIONS - All queries must be tenant-scoped
 */
export const tenantIsolationMiddleware = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) => {
    const correlationId = req.correlationId;

    if (!req.user || !req.user.tenantId) {
        logger.error({ correlationId }, 'SECURITY VIOLATION: Request missing tenant context');
        return res.status(403).json({
            error: 'Forbidden',
            message: 'Tenant context required',
            correlationId
        });
    }

    // Validate any tenantId in request body/params/query matches authenticated tenant
    const bodyTenantId = req.body?.tenantId;
    const paramsTenantId = req.params?.tenantId;
    const queryTenantId = req.query?.tenantId as string;

    if (bodyTenantId && bodyTenantId !== req.user.tenantId) {
        logger.warn({
            correlationId,
            userId: req.user.userId,
            authenticatedTenant: req.user.tenantId,
            requestedTenant: bodyTenantId,
            path: req.path
        }, 'SECURITY VIOLATION: Cross-tenant access attempt blocked');

        return res.status(403).json({
            error: 'Forbidden',
            message: 'Access denied: tenant mismatch',
            correlationId
        });
    }

    if (paramsTenantId && paramsTenantId !== req.user.tenantId) {
        logger.warn({
            correlationId,
            userId: req.user.userId,
            authenticatedTenant: req.user.tenantId,
            requestedTenant: paramsTenantId,
            path: req.path
        }, 'SECURITY VIOLATION: Cross-tenant access attempt blocked');

        return res.status(403).json({
            error: 'Forbidden',
            message: 'Access denied: tenant mismatch',
            correlationId
        });
    }

    if (queryTenantId && queryTenantId !== req.user.tenantId) {
        logger.warn({
            correlationId,
            userId: req.user.userId,
            authenticatedTenant: req.user.tenantId,
            requestedTenant: queryTenantId,
            path: req.path
        }, 'SECURITY VIOLATION: Cross-tenant access attempt blocked');

        return res.status(403).json({
            error: 'Forbidden',
            message: 'Access denied: tenant mismatch',
            correlationId
        });
    }

    next();
};

/**
 * PRODUCTION AUTH MIDDLEWARE
 * Validates JWT token via auth-service
 * Attaches user context to request
 */
export const authMiddleware = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) => {
    // Generate or extract correlation ID
    req.correlationId = (req.headers['x-correlation-id'] as string) || generateCorrelationId();

    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];

    if (!token) {
        logger.warn({ correlationId: req.correlationId, path: req.path }, 'Missing auth token');
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'Authentication required',
            correlationId: req.correlationId
        });
    }

    try {
        // Verify token with auth service
        const response = await axios.post(
            `${AUTH_SERVICE_URL}/verify`,
            { token },
            {
                headers: { 'x-correlation-id': req.correlationId },
                timeout: 5000
            }
        );

        if (!response.data.valid) {
            throw new Error('Invalid token');
        }

        const payload = response.data.payload;

        // Attach user context
        req.user = {
            userId: payload.userId,
            tenantId: payload.tenantId,
            email: payload.email,
            role: payload.role
        };

        logger.debug({
            correlationId: req.correlationId,
            userId: req.user.userId,
            tenantId: req.user.tenantId,
            role: req.user.role,
            path: req.path
        }, 'Request authenticated');

        next();
    } catch (error: any) {
        logger.error({
            correlationId: req.correlationId,
            error: error.message,
            path: req.path
        }, 'Auth verification failed');

        return res.status(401).json({
            error: 'Unauthorized',
            message: 'Invalid or expired token',
            correlationId: req.correlationId
        });
    }
};

/**
 * RBAC Permission Check Middleware Factory
 */
export enum Permission {
    // Dataset permissions
    DATASET_CREATE = 'dataset:create',
    DATASET_READ = 'dataset:read',
    DATASET_UPDATE = 'dataset:update',
    DATASET_DELETE = 'dataset:delete',
    DATASET_EXPORT = 'dataset:export',

    // Recipe permissions
    RECIPE_CREATE = 'recipe:create',
    RECIPE_APPLY = 'recipe:apply',
    RECIPE_APPROVE = 'recipe:approve',

    // Admin permissions
    ADMIN_USERS = 'admin:users',
    ADMIN_TENANTS = 'admin:tenants',
    ADMIN_FEATURE_FLAGS = 'admin:feature_flags',
    ADMIN_QUOTAS = 'admin:quotas',
    ADMIN_AUDIT_LOGS = 'admin:audit_logs',
    ADMIN_JOBS = 'admin:jobs',

    // API permissions
    API_KEYS_MANAGE = 'api_keys:manage',
    API_KEYS_CREATE = 'api_keys:create',

    // Billing permissions
    BILLING_VIEW = 'billing:view',
    BILLING_MANAGE = 'billing:manage'
}

const ROLE_PERMISSIONS: Record<string, Permission[]> = {
    OWNER: Object.values(Permission),
    ADMIN: [
        Permission.DATASET_CREATE,
        Permission.DATASET_READ,
        Permission.DATASET_UPDATE,
        Permission.DATASET_DELETE,
        Permission.DATASET_EXPORT,
        Permission.RECIPE_CREATE,
        Permission.RECIPE_APPLY,
        Permission.RECIPE_APPROVE,
        Permission.ADMIN_USERS,
        Permission.ADMIN_JOBS,
        Permission.API_KEYS_MANAGE,
        Permission.API_KEYS_CREATE,
        Permission.BILLING_VIEW
    ],
    MEMBER: [
        Permission.DATASET_CREATE,
        Permission.DATASET_READ,
        Permission.DATASET_UPDATE,
        Permission.RECIPE_CREATE,
        Permission.RECIPE_APPLY,
        Permission.BILLING_VIEW
    ],
    VIEWER: [
        Permission.DATASET_READ,
        Permission.BILLING_VIEW
    ]
};

export const requirePermission = (...permissions: Permission[]) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Authentication required',
                correlationId: req.correlationId
            });
        }

        const userPermissions = ROLE_PERMISSIONS[req.user.role] || [];
        const hasPermission = permissions.every(p => userPermissions.includes(p));

        if (!hasPermission) {
            logger.warn({
                correlationId: req.correlationId,
                userId: req.user.userId,
                role: req.user.role,
                requiredPermissions: permissions,
                path: req.path
            }, 'Permission denied');

            return res.status(403).json({
                error: 'Forbidden',
                message: 'Insufficient permissions',
                required: permissions,
                correlationId: req.correlationId
            });
        }

        next();
    };
};

/**
 * Feature Flag Enforcement Middleware
 */
export const requireFeature = (featureName: string) => {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        if (!req.user?.tenantId) {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'Tenant context required',
                correlationId: req.correlationId
            });
        }

        try {
            // Check feature flag via tenant service
            const response = await axios.get(
                `${process.env.TENANT_SERVICE_URL || 'http://localhost:8001'}/tenants/${req.user.tenantId}/features`,
                {
                    headers: {
                        'x-correlation-id': req.correlationId,
                        'x-internal-service': 'true'
                    },
                    timeout: 3000
                }
            );

            const features = response.data.features || {};

            if (!features[featureName]) {
                logger.info({
                    correlationId: req.correlationId,
                    tenantId: req.user.tenantId,
                    feature: featureName
                }, 'Feature not enabled for tenant');

                return res.status(403).json({
                    error: 'Forbidden',
                    message: 'Feature not available on your plan',
                    feature: featureName,
                    correlationId: req.correlationId
                });
            }

            next();
        } catch (error: any) {
            logger.error({
                correlationId: req.correlationId,
                error: error.message
            }, 'Feature flag check failed');

            return res.status(500).json({
                error: 'Internal Server Error',
                message: 'Feature check failed',
                correlationId: req.correlationId
            });
        }
    };
};

function generateCorrelationId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export const hasPermission = (role: string, permission: Permission): boolean => {
    const permissions = ROLE_PERMISSIONS[role] || [];
    return permissions.includes(permission);
};
