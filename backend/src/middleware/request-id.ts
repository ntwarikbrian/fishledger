/**
 * Request ID middleware for Hono framework
 * Generates unique request IDs for tracking and logging
 */

import { createMiddleware } from 'hono/factory';
import { generateRequestId } from '../utils/response';

/**
 * Request ID middleware that generates or extracts request IDs
 * Sets requestId in context variables and response headers
 */
export const requestId = createMiddleware<{ Bindings: any; Variables: any }>(
  async (c, next) => {
    // Try to get request ID from header first
    let reqId = c.req.header('X-Request-ID');
    
    // Generate new request ID if not provided
    if (!reqId) {
      reqId = generateRequestId();
    }

    // Set request ID in context variables
    c.set('requestId', reqId);
    c.set('startTime', Date.now());

    // Continue to next middleware/handler
    await next();

    // Add request ID to response headers
    c.res.headers.set('X-Request-ID', reqId);
  },
);

/**
 * Request timing middleware that adds timing information
 */
export const requestTiming = createMiddleware<{ Bindings: any; Variables: any }>(
  async (c, next) => {
    const startTime = Date.now();
    
    await next();
    
    const duration = Date.now() - startTime;
    c.res.headers.set('X-Response-Time', `${duration}ms`);
  },
);
