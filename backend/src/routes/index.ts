/**
 * Routes index
 * Centralized route configuration and exports
 */

import { Hono } from 'hono';
import type { Env, Variables } from '../types/index';

// Import all route modules
import { auth } from './auth.routes';
import { users } from './user.routes';
import { products } from './product.routes';
import { categories } from './category.routes';
import { sales } from './sales.routes';
import { contacts } from './contact.routes';
import { expenses } from './expense.routes';
// Temporarily disabled due to TypeScript issues
// import { folders } from './folder.routes';
// import { files } from './file.routes';
import { stockAdditions } from './stock-additions.routes';
import { stockCorrections } from './stock-corrections.routes';
import { stockMovements } from './stock-movements.routes';
import salesAuditRoutes from './salesAudit.routes';
 

/**
 * Create main API router
 */
export function createApiRoutes() {
  const api = new Hono<{ Bindings: Env; Variables: Variables }>();

  // Mount route modules
  api.route('/auth', auth);
  api.route('/users', users);
  api.route('/products', products);
  api.route('/categories', categories);
  api.route('/sales', sales);
  api.route('/contacts', contacts);
  api.route('/expenses', expenses);
  // Temporarily disabled due to TypeScript issues
  // api.route('/folders', folders);
  // api.route('/files', files);
  api.route('/stock-additions', stockAdditions);
  api.route('/stock-corrections', stockCorrections);
  api.route('/stock-movements', stockMovements);
  api.route('/sales-audit', salesAuditRoutes);

  return api;
}

/**
 * Create health check routes
 */
export function createHealthRoutes() {
  const health = new Hono<{ Bindings: Env; Variables: Variables }>();

  // GET /health - Basic health check
  health.get('/health', (c) => {
    return c.json({
      success: true,
      message: 'LocalFishing Backend is running',
      timestamp: new Date().toISOString(),
      requestId: c.get('requestId'),
      version: '1.0.0',
      environment: c.env.ENVIRONMENT || 'development',
    });
  });

  // GET / - Root endpoint
  health.get('/', (c) => {
    return c.json({
      success: true,
      message: 'LocalFishing Backend API',
      timestamp: new Date().toISOString(),
      requestId: c.get('requestId'),
      version: '1.0.0',
      documentation: '/api',
    });
  });

  return health;
}

/**
 * Create debug routes (development only)
 */
export function createDebugRoutes() {
  const debug = new Hono<{ Bindings: Env; Variables: Variables }>();

  // GET /debug/env - Environment info (sanitized)
  debug.get('/env', (c) => {
    const env = c.env;
    return c.json({
      success: true,
      data: {
        environment: env.ENVIRONMENT,
        logLevel: env.LOG_LEVEL,
        hasSupabaseUrl: !!env.SUPABASE_URL,
        hasSupabaseAnonKey: !!env.SUPABASE_ANON_KEY,
        hasSupabaseServiceKey: !!env.SUPABASE_SERVICE_ROLE_KEY,
        corsOrigin: env.CORS_ORIGIN,
        jwtExpiresIn: env.JWT_EXPIRES_IN,
      },
      timestamp: new Date().toISOString(),
      requestId: c.get('requestId'),
    });
  });

  // GET /debug/supabase - Test Supabase connection
  debug.get('/supabase', async (c) => {
    try {
      const supabase = c.get('supabase');

      // Test basic connection
      const { error } = await supabase
        .from('users')
        .select('count(*)')
        .limit(1);

      if (error) {
        return c.json({
          success: false,
          error: 'Supabase connection failed',
          details: error.message,
          timestamp: new Date().toISOString(),
          requestId: c.get('requestId'),
        }, 500);
      }

      return c.json({
        success: true,
        message: 'Supabase connection successful',
        data: { connectionTest: 'passed' },
        timestamp: new Date().toISOString(),
        requestId: c.get('requestId'),
      });
    } catch (error) {
      return c.json({
        success: false,
        error: 'Supabase connection test failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        requestId: c.get('requestId'),
      }, 500);
    }
  });

  return debug;
}

// Export individual route modules for flexibility
export { auth, users, products, categories, sales, contacts, expenses, stockAdditions, stockCorrections, stockMovements };
// Temporarily disabled: folders, files
