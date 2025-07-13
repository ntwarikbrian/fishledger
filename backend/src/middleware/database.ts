/**
 * Database middleware for Hono framework
 * Initializes Supabase client and sets it in context variables
 */

import { createMiddleware } from 'hono/factory';
import { getSupabaseClientSingleton } from '../config/supabase';
import { validateEnvironment } from '../config/environment';

/**
 * Database middleware that initializes Supabase client
 * Sets supabase client in context variables
 */
export const database = createMiddleware<{ Bindings: any; Variables: any }>(
  async (c, next) => {
    try {
      // Validate environment variables
      const validatedEnv = validateEnvironment(c.env);

      // Get or create singleton database connection
      const {
        client: supabase,
        usingServiceRole,
        connectionHealthy,
        isNewConnection,
        error: dbError,
      } = await getSupabaseClientSingleton(validatedEnv);

      // Log connection status for new connections
      if (isNewConnection && connectionHealthy) {
        console.log('✅ Database connection established');
      } else if (isNewConnection && !connectionHealthy) {
        console.warn(`⚠️ Database client created but connection test failed: ${dbError}`);
        console.warn('⚠️ Continuing with database client (tables may not exist yet)');
      }

      // Set Supabase client in context variables (even if connection test failed)
      c.set('supabase', supabase);
      c.set('databaseHealthy', connectionHealthy);

      // Continue to next middleware/handler
      return await next();
    } catch (error) {
      console.error('Database middleware error:', error);
      
      return c.json(
        {
          success: false,
          error: 'Database connection failed',
          timestamp: new Date().toISOString(),
          requestId: c.get('requestId'),
        },
        500,
      );
    }
  },
);
