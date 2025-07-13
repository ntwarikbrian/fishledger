/**
 * CORS middleware for Hono framework
 * Handles Cross-Origin Resource Sharing configuration
 */

import { cors } from 'hono/cors';
import { createMiddleware } from 'hono/factory';

/**
 * CORS configuration interface
 */
export interface CorsOptions {
  origins: string[];
  credentials?: boolean;
  methods?: string[];
  allowedHeaders?: string[];
  exposedHeaders?: string[];
  maxAge?: number;
}

/**
 * Creates CORS middleware with custom configuration
 * @param options - CORS configuration options
 */
export const createCorsMiddleware = (options: CorsOptions) => {
  return cors({
    origin: (origin) => {
      // Allow requests without origin (e.g., mobile apps, Postman)
      if (!origin) {
return origin;
}

      // Check if origin is in allowed list
      if (options.origins.includes(origin) || options.origins.includes('*')) {
        return origin;
      }

      return null;
    },
    credentials: options.credentials ?? true,
    allowMethods: options.methods ?? [
      'GET',
      'POST',
      'PUT',
      'PATCH',
      'DELETE',
      'OPTIONS',
      'HEAD',
    ],
    allowHeaders: options.allowedHeaders ?? [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      'X-Request-ID',
    ],
    exposeHeaders: options.exposedHeaders ?? [
      'X-Request-ID',
      'X-RateLimit-Limit',
      'X-RateLimit-Remaining',
      'X-RateLimit-Reset',
    ],
    maxAge: options.maxAge ?? 86400, // 24 hours
  });
};

/**
 * Default CORS middleware for development
 * Allows all origins - use only in development
 */
export const developmentCors = createCorsMiddleware({
  origins: ['*'],
  credentials: true,
});

/**
 * Production CORS middleware factory
 * Creates CORS middleware from environment variables
 */
export const createProductionCors = (corsOrigins: string) => {
  const origins = corsOrigins.split(',').map(origin => origin.trim());
  
  return createCorsMiddleware({
    origins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      'X-Request-ID',
    ],
  });
};

/**
 * Preflight handler for complex CORS requests
 * Handles OPTIONS requests manually if needed
 */
export const handlePreflight = createMiddleware<{ Bindings: any; Variables: any }>(
  async (c, next) => {
    // Check if this is a preflight request
    if (c.req.method === 'OPTIONS') {
      const origin = c.req.header('Origin');
      const requestMethod = c.req.header('Access-Control-Request-Method');
      const requestHeaders = c.req.header('Access-Control-Request-Headers');

      // Set CORS headers for preflight response
      const headers = new Headers();
      
      if (origin) {
        headers.set('Access-Control-Allow-Origin', origin);
      }
      
      headers.set('Access-Control-Allow-Credentials', 'true');
      
      if (requestMethod) {
        headers.set('Access-Control-Allow-Methods', requestMethod);
      }
      
      if (requestHeaders) {
        headers.set('Access-Control-Allow-Headers', requestHeaders);
      }
      
      headers.set('Access-Control-Max-Age', '86400');

      return new Response(null, {
        status: 204,
        headers,
      });
    }

    return await next();
  },
);
