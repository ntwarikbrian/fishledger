/**
 * Rate limiting middleware for Hono framework
 * Provides request rate limiting to prevent abuse
 */

import { createMiddleware } from 'hono/factory';
import type { AuthenticatedUser } from '../types/index';

/**
 * Rate limiting configuration interface
 */
export interface RateLimitOptions {
  maxRequests: number;
  windowMs: number;
  keyGenerator?: (c: any) => string;
  message?: string;
}

/**
 * In-memory rate limit store
 */
interface RateLimitInfo {
  count: number;
  resetTime: number;
}

const store = new Map<string, RateLimitInfo>();

/**
 * Default key generator function
 */
const defaultKeyGenerator = (c: any): string => {
  const user = c.get('user') as AuthenticatedUser | undefined;
  
  if (user) {
    return `user:${user.id}`;
  }
  
  return `ip:${
    c.req.header('CF-Connecting-IP') ||
    c.req.header('X-Forwarded-For') ||
    c.req.header('X-Real-IP') ||
    'unknown'
  }`;
};

/**
 * Creates rate limiting middleware
 */
export const rateLimit = (options: RateLimitOptions) =>
  createMiddleware<{ Bindings: any; Variables: any }>(async (c, next) => {
    const {
      maxRequests,
      windowMs,
      keyGenerator = defaultKeyGenerator,
      message = 'Too many requests',
    } = options;

    const key = keyGenerator(c);
    const now = Date.now();
    const requestId = c.get('requestId');

    // Cleanup expired entries occasionally
    if (Math.random() < 0.01) { // 1% chance to cleanup on each request
      cleanupExpiredEntries();
    }

    // Get or create rate limit info
    let info = store.get(key);

    if (!info || now > info.resetTime) {
      info = {
        count: 1,
        resetTime: now + windowMs,
      };
      store.set(key, info);
    } else {
      info.count++;
    }

    // Check if rate limit exceeded
    if (info.count > maxRequests) {
      const retryAfter = Math.ceil((info.resetTime - now) / 1000);
      
      return c.json(
        {
          success: false,
          error: message,
          timestamp: new Date().toISOString(),
          requestId,
        },
        429,
        {
          'X-RateLimit-Limit': maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': Math.ceil(info.resetTime / 1000).toString(),
          'Retry-After': retryAfter.toString(),
        },
      );
    }

    // Add rate limit headers
    const remaining = Math.max(0, maxRequests - info.count);
    c.res.headers.set('X-RateLimit-Limit', maxRequests.toString());
    c.res.headers.set('X-RateLimit-Remaining', remaining.toString());
    c.res.headers.set('X-RateLimit-Reset', Math.ceil(info.resetTime / 1000).toString());

    return await next();
  });

/**
 * Enhanced auth rate limiting middleware
 * Lenient limits with short window for better user experience
 */
export const authRateLimit = rateLimit({
  maxRequests: 5, // Allow 5 attempts per window
  windowMs: 10 * 1000, // 10 seconds window (much shorter for better UX)
  message: 'Too many authentication attempts. Please try again in 10 seconds.',
  keyGenerator: (c) => {
    // Enhanced security: Use multiple IP headers for better tracking
    const ip = c.req.header('CF-Connecting-IP') ||
              c.req.header('X-Forwarded-For')?.split(',')[0]?.trim() ||
              c.req.header('X-Real-IP') ||
              c.req.header('X-Client-IP') ||
              'unknown';

    // Enhanced security: Log authentication attempts
    console.log(`🔐 Auth rate limit check for IP: ${ip}`);

    return `auth:${ip}`;
  },
});

/**
 * API rate limiting middleware
 */
export const apiRateLimit = (maxRequests: number = 100, windowMs: number = 60 * 1000) =>
  rateLimit({
    maxRequests,
    windowMs,
    message: 'API rate limit exceeded',
  });

/**
 * User rate limiting middleware
 */
export const userRateLimit = (maxRequests: number = 1000, windowMs: number = 60 * 60 * 1000) =>
  rateLimit({
    maxRequests,
    windowMs,
    message: 'User rate limit exceeded',
    keyGenerator: (c) => {
      const user = c.get('user') as AuthenticatedUser | undefined;
      return user ? `user:${user.id}` : defaultKeyGenerator(c);
    },
  });

/**
 * IP rate limiting middleware
 */
export const ipRateLimit = (maxRequests: number = 100, windowMs: number = 60 * 1000) =>
  rateLimit({
    maxRequests,
    windowMs,
    message: 'IP rate limit exceeded',
    keyGenerator: (c) => {
      return `ip:${
        c.req.header('CF-Connecting-IP') ||
        c.req.header('X-Forwarded-For') ||
        c.req.header('X-Real-IP') ||
        'unknown'
      }`;
    },
  });

/**
 * Admin rate limiting middleware
 */
export const adminRateLimit = rateLimit({
  maxRequests: 500,
  windowMs: 60 * 1000, // 1 minute
  message: 'Admin rate limit exceeded',
  keyGenerator: (c) => {
    const user = c.get('user') as AuthenticatedUser | undefined;
    if (user?.role === 'admin') {
      return `admin:${user.id}`;
    }
    return defaultKeyGenerator(c);
  },
});

// Cleanup function for expired entries (called manually when needed)
function cleanupExpiredEntries() {
  const now = Date.now();
  for (const [key, info] of store.entries()) {
    if (now > info.resetTime) {
      store.delete(key);
    }
  }
}

/**
 * Clear all rate limit entries (for development)
 */
export function clearRateLimitStore() {
  store.clear();
  console.log('🧹 Rate limit store cleared');
}
