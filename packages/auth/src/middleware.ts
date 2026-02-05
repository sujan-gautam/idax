/**
 * AUTHENTICATION MIDDLEWARE
 * Validates JWT tokens and enforces authentication on all routes
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '@project-ida/logger';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key-change-in-production';

export interface AuthRequest extends Request {
    user?: {
        userId: string;
        email: string;
        role: string;
        tenantId: string;
    };
}

/**
 * Verify JWT token and attach user to request
 */
export const authMiddleware = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            logger.warn({
                path: req.path,
                ip: req.ip
            }, 'Missing or invalid authorization header');

            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Authentication required. Please provide a valid token.'
            });
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        // Verify token
        const decoded = jwt.verify(token, JWT_SECRET) as any;

        // Attach user info to request
        req.user = {
            userId: decoded.userId,
            email: decoded.email,
            role: decoded.role,
            tenantId: decoded.tenantId
        };

        // Verify tenant ID matches header if provided
        const tenantIdHeader = req.headers['x-tenant-id'];
        if (tenantIdHeader && tenantIdHeader !== req.user.tenantId) {
            logger.warn({
                userId: req.user.userId,
                requestedTenant: tenantIdHeader,
                userTenant: req.user.tenantId
            }, 'Tenant ID mismatch');

            return res.status(403).json({
                error: 'Forbidden',
                message: 'Access denied to this tenant'
            });
        }

        logger.debug({
            userId: req.user.userId,
            path: req.path,
            method: req.method
        }, 'Request authenticated');

        next();
    } catch (error: any) {
        logger.error({ error: error.message }, 'Authentication failed');

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: 'TokenExpired',
                message: 'Your session has expired. Please login again.'
            });
        }

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                error: 'InvalidToken',
                message: 'Invalid authentication token'
            });
        }

        return res.status(401).json({
            error: 'Unauthorized',
            message: 'Authentication failed'
        });
    }
};

/**
 * Require specific role(s)
 */
export const requireRole = (...roles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Authentication required'
            });
        }

        if (!roles.includes(req.user.role)) {
            logger.warn({
                userId: req.user.userId,
                userRole: req.user.role,
                requiredRoles: roles,
                path: req.path
            }, 'Insufficient permissions');

            return res.status(403).json({
                error: 'Forbidden',
                message: `This action requires one of the following roles: ${roles.join(', ')}`
            });
        }

        next();
    };
};

/**
 * Require admin access (ADMIN or OWNER)
 */
export const requireAdmin = requireRole('ADMIN', 'OWNER');

/**
 * Verify refresh token
 */
export const verifyRefreshToken = (token: string) => {
    try {
        return jwt.verify(token, JWT_REFRESH_SECRET);
    } catch (error) {
        throw new Error('Invalid refresh token');
    }
};

/**
 * Generate access token
 */
export const generateAccessToken = (payload: {
    userId: string;
    email: string;
    role: string;
    tenantId: string;
}) => {
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: '1h' // Access token expires in 1 hour
    });
};

/**
 * Generate refresh token
 */
export const generateRefreshToken = (payload: {
    userId: string;
    email: string;
}) => {
    return jwt.sign(payload, JWT_REFRESH_SECRET, {
        expiresIn: '7d' // Refresh token expires in 7 days
    });
};

/**
 * Optional auth - doesn't fail if no token, but attaches user if present
 */
export const optionalAuth = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            const decoded = jwt.verify(token, JWT_SECRET) as any;

            req.user = {
                userId: decoded.userId,
                email: decoded.email,
                role: decoded.role,
                tenantId: decoded.tenantId
            };
        }
    } catch (error) {
        // Silently fail for optional auth
    }

    next();
};
