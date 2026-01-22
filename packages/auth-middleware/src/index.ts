import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '@project-ida/logger';
import { prisma } from '@project-ida/db';
import { v4 as uuidv4 } from 'uuid';

export interface AuthRequest extends Request {
    user?: {
        userId: string;
        tenantId: string;
        email: string;
        role: string;
    };
    tenantId?: string;
    correlationId?: string;
}

// Permission definitions
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

    // API permissions
    API_KEYS_MANAGE = 'api_keys:manage',
    API_KEYS_CREATE = 'api_keys:create',

    // Billing permissions
    BILLING_VIEW = 'billing:view',
    BILLING_MANAGE = 'billing:manage'
}

// Role to permissions mapping
const ROLE_PERMISSIONS: Record<string, Permission[]> = {
    OWNER: Object.values(Permission), // All permissions
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

/**
 * Core authentication middleware - validates JWT and attaches user context
 */
export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
    // Add correlation ID for request tracing
    req.correlationId = req.headers['x-correlation-id'] as string || uuidv4();

    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        logger.warn({ correlationId: req.correlationId, path: req.path }, 'No token provided');
        return res.status(401).json({ error: 'Authentication required' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production') as any;

        req.user = {
            userId: decoded.userId,
            tenantId: decoded.tenantId,
            email: decoded.email,
            role: decoded.role
        };
        req.tenantId = decoded.tenantId;

        logger.debug({
            correlationId: req.correlationId,
            userId: req.user.userId,
            tenantId: req.user.tenantId,
            path: req.path
        }, 'Request authenticated');

        next();
    } catch (error) {
        logger.error({ err: error, correlationId: req.correlationId }, 'Auth token validation failed');
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};

/**
 * Optional auth middleware - doesn't fail if no token, but validates if present
 */
export const optionalAuthMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
    req.correlationId = req.headers['x-correlation-id'] as string || uuidv4();

    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return next();
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production') as any;
        req.user = {
            userId: decoded.userId,
            tenantId: decoded.tenantId,
            email: decoded.email,
            role: decoded.role
        };
        req.tenantId = decoded.tenantId;
    } catch (error) {
        // Invalid token, but we don't fail - just continue without user context
        logger.debug({ correlationId: req.correlationId }, 'Optional auth: invalid token ignored');
    }

    next();
};

/**
 * Tenant isolation middleware - ensures all queries are scoped to the user's tenant
 */
export const tenantIsolationMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.tenantId) {
        logger.error({ correlationId: req.correlationId }, 'Tenant isolation: no tenantId in request');
        return res.status(403).json({ error: 'Tenant context required' });
    }

    // Validate that any tenantId in request body/params matches the authenticated user's tenant
    const bodyTenantId = req.body?.tenantId;
    const paramsTenantId = req.params?.tenantId;
    const queryTenantId = req.query?.tenantId;

    if (bodyTenantId && bodyTenantId !== req.tenantId) {
        logger.warn({
            correlationId: req.correlationId,
            userTenantId: req.tenantId,
            requestedTenantId: bodyTenantId
        }, 'Tenant isolation violation attempt');
        return res.status(403).json({ error: 'Access denied: tenant mismatch' });
    }

    if (paramsTenantId && paramsTenantId !== req.tenantId) {
        logger.warn({
            correlationId: req.correlationId,
            userTenantId: req.tenantId,
            requestedTenantId: paramsTenantId
        }, 'Tenant isolation violation attempt');
        return res.status(403).json({ error: 'Access denied: tenant mismatch' });
    }

    if (queryTenantId && queryTenantId !== req.tenantId) {
        logger.warn({
            correlationId: req.correlationId,
            userTenantId: req.tenantId,
            requestedTenantId: queryTenantId
        }, 'Tenant isolation violation attempt');
        return res.status(403).json({ error: 'Access denied: tenant mismatch' });
    }

    next();
};

/**
 * Permission check middleware factory
 */
export const requirePermission = (...permissions: Permission[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
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
                error: 'Insufficient permissions',
                required: permissions
            });
        }

        next();
    };
};

/**
 * Role check middleware factory
 */
export const requireRole = (...roles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        if (!roles.includes(req.user.role)) {
            logger.warn({
                correlationId: req.correlationId,
                userId: req.user.userId,
                userRole: req.user.role,
                requiredRoles: roles,
                path: req.path
            }, 'Role check failed');

            return res.status(403).json({
                error: 'Insufficient role',
                required: roles
            });
        }

        next();
    };
};

/**
 * Feature flag check middleware factory
 */
export const requireFeature = (featureName: string) => {
    return async (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.tenantId) {
            return res.status(403).json({ error: 'Tenant context required' });
        }

        try {
            const featureFlags = await prisma.featureFlags.findUnique({
                where: { tenantId: req.tenantId }
            });

            const flags = (featureFlags?.flagsJson as any) || {};

            if (!flags[featureName]) {
                logger.info({
                    correlationId: req.correlationId,
                    tenantId: req.tenantId,
                    feature: featureName
                }, 'Feature not enabled for tenant');

                return res.status(403).json({
                    error: 'Feature not available',
                    feature: featureName,
                    message: 'This feature is not enabled for your plan. Please upgrade or contact support.'
                });
            }

            next();
        } catch (error) {
            logger.error({ err: error, correlationId: req.correlationId }, 'Feature flag check failed');
            return res.status(500).json({ error: 'Feature check failed' });
        }
    };
};

/**
 * Quota enforcement middleware factory
 */
export const enforceQuota = (quotaType: 'maxProjects' | 'maxStorageBytes' | 'maxUploadsPerMonth' | 'maxApiCallsPerMonth') => {
    return async (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.tenantId) {
            return res.status(403).json({ error: 'Tenant context required' });
        }

        try {
            const quotas = await prisma.quotas.findUnique({
                where: { tenantId: req.tenantId }
            });

            if (!quotas) {
                // No quotas set, allow (or set defaults)
                return next();
            }

            // Check specific quota (implementation depends on quota type)
            // This is a placeholder - actual implementation would check current usage
            const limit = quotas[quotaType];

            // TODO: Implement actual usage tracking and comparison
            // For now, just pass through
            next();

        } catch (error) {
            logger.error({ err: error, correlationId: req.correlationId }, 'Quota check failed');
            return res.status(500).json({ error: 'Quota check failed' });
        }
    };
};

/**
 * Audit logging middleware - logs all state-changing operations
 */
export const auditLog = (action: string, entityType: string) => {
    return async (req: AuthRequest, res: Response, next: NextFunction) => {
        const originalSend = res.json.bind(res);

        res.json = function (body: any) {
            // Log after successful response
            if (res.statusCode < 400) {
                const entityId = body?.id || req.params?.id || req.body?.id;

                prisma.auditLog.create({
                    data: {
                        tenantId: req.tenantId!,
                        actorUserId: req.user?.userId,
                        action,
                        entityType,
                        entityId,
                        ip: req.ip || req.socket.remoteAddress,
                        userAgent: req.headers['user-agent'],
                        diffJson: {
                            method: req.method,
                            path: req.path,
                            body: req.body,
                            response: body
                        },
                        correlationId: req.correlationId
                    }
                }).catch(err => {
                    logger.error({ err, correlationId: req.correlationId }, 'Audit log creation failed');
                });
            }

            return originalSend(body);
        };

        next();
    };
};

// Export helper to check permissions programmatically
export const hasPermission = (role: string, permission: Permission): boolean => {
    const permissions = ROLE_PERMISSIONS[role] || [];
    return permissions.includes(permission);
};

// Export helper to get all permissions for a role
export const getPermissionsForRole = (role: string): Permission[] => {
    return ROLE_PERMISSIONS[role] || [];
};
