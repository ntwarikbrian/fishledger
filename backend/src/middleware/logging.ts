/**
 * Logging middleware for Hono framework
 * Provides request/response logging and performance monitoring
 */

import { createMiddleware } from 'hono/factory';
import type { AuthenticatedUser } from '../types/index';

/**
 * Request logging middleware
 */
export const requestLogger = createMiddleware<{ Bindings: any; Variables: any }>(
  async (c, next) => {
    const startTime = Date.now();
    const method = c.req.method;
    const url = c.req.url;
    const path = new URL(url).pathname;
    const userAgent = c.req.header('User-Agent') || 'Unknown';
    const ip = c.req.header('CF-Connecting-IP') || 
               c.req.header('X-Forwarded-For') || 
               c.req.header('X-Real-IP') || 
               'Unknown';
    const requestId = c.get('requestId');

    // Skip logging for health checks
    if (path === '/health') {
      await next();
      return;
    }

    console.log(`[${requestId}] ${method} ${path} - IP: ${ip} - User: ${getUserEmail(c) || 'Anonymous'}`);

    let error: Error | null = null;

    try {
      await next();
    } catch (err) {
      error = err instanceof Error ? err : new Error('Unknown error');
      throw err;
    } finally {
      const duration = Date.now() - startTime;
      const status = c.res.status;
      const user = getUserEmail(c) || 'Anonymous';

      if (error) {
        console.error(
          `[${requestId}] ${method} ${path} - ERROR - ${duration}ms - User: ${user}`,
          error,
        );
      } else {
        console.log(
          `[${requestId}] ${method} ${path} - ${status} - ${duration}ms - User: ${user}`,
        );
      }

      // Log slow requests
      if (duration > 1000) {
        console.warn(
          `[${requestId}] SLOW REQUEST: ${method} ${path} - ${duration}ms - User: ${user}`,
        );
      }
    }
  },
);

/**
 * Error logging middleware
 */
export const errorLogger = createMiddleware<{ Bindings: any; Variables: any }>(
  async (c, next) => {
    try {
      await next();
    } catch (error) {
      const requestId = c.get('requestId');
      const method = c.req.method;
      const path = new URL(c.req.url).pathname;
      const user = getUserEmail(c) || 'Anonymous';

      console.error(`[${requestId}] ERROR in ${method} ${path}:`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        user,
        timestamp: new Date().toISOString(),
      });

      throw error;
    }
  },
);

/**
 * Security logging middleware
 */
export const securityLogger = createMiddleware<{ Bindings: any; Variables: any }>(
  async (c, next) => {
    const requestId = c.get('requestId');
    const method = c.req.method;
    const path = new URL(c.req.url).pathname;
    const ip = c.req.header('CF-Connecting-IP') || 'Unknown';
    const userAgent = c.req.header('User-Agent') || 'Unknown';

    // Log authentication attempts
    if (path.includes('/auth/')) {
      console.log(`[${requestId}] AUTH_ATTEMPT: ${method} ${path} - IP: ${ip} - UA: ${userAgent}`);
    }

    // Log admin access attempts
    const user = c.get('user') as AuthenticatedUser | undefined;
    if (user?.role === 'admin') {
      console.log(`[${requestId}] ADMIN_ACCESS: ${method} ${path} - User: ${user.email} - IP: ${ip}`);
    }

    await next();
  },
);

/**
 * Development logging middleware
 */
export const developmentLogger = createMiddleware<{ Bindings: any; Variables: any }>(
  async (c, next) => {
    const startTime = Date.now();
    const method = c.req.method;
    const url = c.req.url;
    const requestId = c.get('requestId');

    console.log(`[${requestId}] 🚀 ${method} ${url}`);

    try {
      await next();
      
      const duration = Date.now() - startTime;
      const status = c.res.status;
      const statusEmoji = status >= 400 ? '❌' : status >= 300 ? '⚠️' : '✅';
      
      console.log(`[${requestId}] ${statusEmoji} ${method} ${url} - ${status} - ${duration}ms`);
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[${requestId}] 💥 ${method} ${url} - ERROR - ${duration}ms`, error);
      throw error;
    }
  },
);

/**
 * Helper function to get user email from context
 */
function getUserEmail(c: any): string | undefined {
  const user = c.get('user') as AuthenticatedUser | undefined;
  return user?.email;
}

/**
 * Creates a combined logging middleware with all logging features
 */
export const createLoggingMiddleware = () => {
  return requestLogger;
};

/**
 * Production logging middleware with minimal overhead
 */
export const productionLogger = requestLogger;
