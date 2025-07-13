/**
 * Main entry point for Local Fishing Backend
 * Cloudflare Workers application with Hono framework
 */

import { Hono } from 'hono';
import type { Env, Variables } from './types/index';
import { validateEnvironment, validateSupabaseConfig, isDevelopment } from './config/environment';

// Import middleware
import {
  requestId,
  requestTiming,
  database,
  createProductionCors,
  developmentCors,
  productionLogger,
  developmentLogger,
  apiRateLimit,
  errorHandler,
} from './middleware';

// Import routes
import { createApiRoutes, createHealthRoutes, createDebugRoutes } from './routes';

/**
 * Create and configure the main Hono application
 */
function createApp() {
  const app = new Hono<{ Bindings: Env; Variables: Variables }>();

  // Global middleware (applied to all routes)
  app.use('*', errorHandler);
  app.use('*', requestId);
  app.use('*', requestTiming);
  app.use('*', database);

  // CORS middleware - apply directly based on environment
  app.use('*', async (c, next) => {
    const isDev = isDevelopment(c.env);

    if (isDev) {
      return await developmentCors(c, next);
    } else {
      const corsMiddleware = createProductionCors(c.env.CORS_ORIGIN || '*');
      return await corsMiddleware(c, next);
    }
  });

  // Logging middleware
  app.use('*', async (c, next) => {
    const isDev = isDevelopment(c.env);
    const logger = isDev ? developmentLogger : productionLogger;
    await logger(c, next);
  });

  // Rate limiting middleware
  app.use('*', apiRateLimit());

  return app;
}

/**
 * Main Cloudflare Workers export
 */
export default {
  /**
   * Fetch handler for HTTP requests
   */
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    try {
      // Validate environment variables
      const validatedEnv = validateEnvironment(env);

      // Validate Supabase configuration
      const supabaseValidation = validateSupabaseConfig(validatedEnv);
      if (!supabaseValidation.valid) {
        console.error('❌ Supabase configuration errors:', supabaseValidation.errors);
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Configuration error',
            details: supabaseValidation.errors,
            timestamp: new Date().toISOString(),
          }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          },
        );
      }

      if (supabaseValidation.warnings.length > 0) {
        console.warn('⚠️ Supabase configuration warnings:', supabaseValidation.warnings);
      }

      // Create and configure the Hono app
      const app = createApp();

      // Mount route groups
      app.route('/api', createApiRoutes());
      app.route('/', createHealthRoutes());

      // Mount debug routes in development
      if (isDevelopment(validatedEnv)) {
        app.route('/debug', createDebugRoutes());
      }

      // Handle 404 for unmatched routes
      app.notFound((c) => {
        return c.json({
          success: false,
          error: 'Route not found',
          path: new URL(c.req.url).pathname,
          method: c.req.method,
          timestamp: new Date().toISOString(),
          requestId: c.get('requestId'),
        }, 404);
      });

      // Global error handler
      app.onError((error, c) => {
        console.error('Application error:', error);

        const isDev = isDevelopment(c.env);
        const errorResponse: any = {
          success: false,
          error: 'Internal server error',
          timestamp: new Date().toISOString(),
          requestId: c.get('requestId'),
        };

        // Include stack trace in development
        if (isDev) {
          errorResponse.stack = error.stack;
          errorResponse.message = error.message;
        }

        return c.json(errorResponse, 500);
      });

      // Handle the request with Hono
      return await app.fetch(request, validatedEnv, ctx);
    } catch (error) {
      console.error('Fatal application error:', error);

      return new Response(
        JSON.stringify({
          success: false,
          error: 'Fatal server error',
          timestamp: new Date().toISOString(),
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }
  },

  /**
   * Scheduled event handler (for cron jobs)
   * @param event - Scheduled event
   * @param env - Environment variables
   * @param ctx - Execution context
   */
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    try {
      console.log('Scheduled event triggered:', event.cron);

      // Add scheduled tasks here, such as:
      // - Cleanup old logs
      // - Send low stock alerts
      // - Generate reports
      // - Backup data

      // Example: Log low stock products
      const validatedEnv = validateEnvironment(env);
      // This line is no longer needed as database connection is handled by middleware
      
      // This is just an example - implement actual scheduled tasks as needed
      console.log('Scheduled task completed successfully');
    } catch (error) {
      console.error('Scheduled event error:', error);
    }
  },
};
