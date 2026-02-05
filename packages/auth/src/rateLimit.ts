/**
 * RATE LIMITING MIDDLEWARE
 * Prevents abuse and DDoS attacks
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '@project-ida/logger';

interface RateLimitStore {
    [key: string]: {
        count: number;
        resetTime: number;
    };
}

const store: RateLimitStore = {};

// Cleanup old entries every 5 minutes
setInterval(() => {
    const now = Date.now();
    Object.keys(store).forEach(key => {
        if (store[key].resetTime < now) {
            delete store[key];
        }
    });
}, 5 * 60 * 1000);

export interface RateLimitOptions {
    windowMs?: number;  // Time window in milliseconds
    max?: number;       // Max requests per window
    message?: string;   // Custom error message
    keyGenerator?: (req: Request) => string; // Custom key generator
}

/**
 * Rate limiting middleware
 */
export const rateLimit = (options: RateLimitOptions = {}) => {
    const {
        windowMs = 15 * 60 * 1000, // 15 minutes default
        max = 100,                  // 100 requests default
        message = 'Too many requests, please try again later',
        keyGenerator = (req) => req.ip || 'unknown'
    } = options;

    return (req: Request, res: Response, next: NextFunction) => {
        const key = keyGenerator(req);
        const now = Date.now();

        if (!store[key] || store[key].resetTime < now) {
            store[key] = {
                count: 1,
                resetTime: now + windowMs
            };
            return next();
        }

        store[key].count++;

        if (store[key].count > max) {
            const resetIn = Math.ceil((store[key].resetTime - now) / 1000);

            logger.warn({
                key,
                count: store[key].count,
                max,
                path: req.path,
                ip: req.ip
            }, 'Rate limit exceeded');

            res.setHeader('X-RateLimit-Limit', max.toString());
            res.setHeader('X-RateLimit-Remaining', '0');
            res.setHeader('X-RateLimit-Reset', store[key].resetTime.toString());
            res.setHeader('Retry-After', resetIn.toString());

            return res.status(429).json({
                error: 'TooManyRequests',
                message,
                retryAfter: resetIn
            });
        }

        res.setHeader('X-RateLimit-Limit', max.toString());
        res.setHeader('X-RateLimit-Remaining', (max - store[key].count).toString());
        res.setHeader('X-RateLimit-Reset', store[key].resetTime.toString());

        next();
    };
};

/**
 * Strict rate limit for auth endpoints
 */
export const authRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,                    // 5 attempts
    message: 'Too many login attempts. Please try again in 15 minutes.'
});

/**
 * API rate limit
 */
export const apiRateLimit = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 60,             // 60 requests per minute
    message: 'API rate limit exceeded. Please slow down your requests.'
});

/**
 * Admin rate limit (more lenient)
 */
export const adminRateLimit = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 120,            // 120 requests per minute
    message: 'Admin API rate limit exceeded.'
});

/**
 * Upload rate limit
 */
export const uploadRateLimit = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 50,                   // 50 uploads per hour
    message: 'Upload limit exceeded. Please try again later.'
});
