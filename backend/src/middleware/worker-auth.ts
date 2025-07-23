/**
 * Worker Authentication Middleware
 * Provides authentication and authorization middleware specifically for workers
 * Ensures proper data isolation and security for worker access
 */

import { createMiddleware } from 'hono/factory';
import type { HonoContext, AuthenticatedWorker, WorkerRole } from '../types/index';
import { verifyWorkerAccessToken } from '../utils/auth';

/**
 * Worker authentication middleware
 * Verifies worker JWT tokens and sets authenticated worker in context
 */
export const authenticateWorker = createMiddleware<{ Bindings: any; Variables: any }>(
  async (c, next) => {
    try {
      // Extract token from Authorization header
      const authHeader = c.req.header('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.warn('🚨 Worker authentication: No valid Authorization header found');
        return c.json(
          {
            success: false,
            error: 'Worker authentication required',
            message: 'Please provide a valid worker access token',
            timestamp: new Date().toISOString(),
            requestId: c.get('requestId'),
          },
          401,
        );
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      
      // Verify and decode the worker token
      const payload = verifyWorkerAccessToken(token, c.env);

      // Enhanced security: Validate worker exists and has active session
      const supabase = c.get('supabase');
      const { data: dbWorker, error: dbError } = await supabase
        .from('workers')
        .select('worker_id, full_name, email, phone_number, user_id, is_session_active, session_expires_at, token_version, created_at')
        .eq('worker_id', payload.workerId)
        .eq('user_id', payload.businessId) // Ensure worker belongs to the business
        .single();

      if (dbError || !dbWorker) {
        console.warn('🚨 Worker not found in database for JWT:', payload.workerId);
        return c.json(
          {
            success: false,
            error: 'Worker account not found',
            timestamp: new Date().toISOString(),
            requestId: c.get('requestId'),
          },
          401,
        );
      }

      // Enhanced security: Validate session is active and not expired
      if (!dbWorker.is_session_active) {
        console.warn('🚨 Worker session not active:', payload.workerId);
        return c.json(
          {
            success: false,
            error: 'Worker session expired',
            message: 'Please login again',
            timestamp: new Date().toISOString(),
            requestId: c.get('requestId'),
          },
          401,
        );
      }

      if (dbWorker.session_expires_at && new Date(dbWorker.session_expires_at) < new Date()) {
        console.warn('🚨 Worker session expired:', payload.workerId);
        return c.json(
          {
            success: false,
            error: 'Worker session expired',
            message: 'Please login again',
            timestamp: new Date().toISOString(),
            requestId: c.get('requestId'),
          },
          401,
        );
      }

      // Enhanced security: Verify email matches
      if (dbWorker.email !== payload.email) {
        console.warn('🚨 Worker email mismatch in JWT vs database:', { 
          jwt: payload.email, 
          db: dbWorker.email 
        });
        return c.json(
          {
            success: false,
            error: 'Worker authentication data mismatch',
            timestamp: new Date().toISOString(),
            requestId: c.get('requestId'),
          },
          401,
        );
      }

      // Create authenticated worker object with validated data
      const authenticatedWorker: AuthenticatedWorker = {
        id: payload.workerId,
        email: payload.email,
        fullName: payload.fullName,
        role: payload.role,
        businessId: payload.businessId,
        isActive: true, // Confirmed active from database
      };

      // Set worker in context variables
      c.set('worker', authenticatedWorker);

      // Continue to next middleware/handler
      return await next();
    } catch (error) {
      console.error('🚨 Worker authentication error:', error);

      // Handle specific JWT errors
      if (error instanceof Error) {
        if (error.message.includes('expired')) {
          return c.json(
            {
              success: false,
              error: 'Worker token expired',
              message: 'Please refresh your worker session',
              timestamp: new Date().toISOString(),
              requestId: c.get('requestId'),
            },
            401,
          );
        }
        
        if (error.message.includes('invalid') || error.message.includes('malformed')) {
          return c.json(
            {
              success: false,
              error: 'Invalid worker token',
              message: 'Please login again',
              timestamp: new Date().toISOString(),
              requestId: c.get('requestId'),
            },
            401,
          );
        }
      }

      // Generic authentication error
      return c.json(
        {
          success: false,
          error: 'Worker authentication failed',
          message: 'Unable to verify worker credentials',
          timestamp: new Date().toISOString(),
          requestId: c.get('requestId'),
        },
        401,
      );
    }
  },
);

/**
 * Optional worker authentication middleware
 * Similar to authenticateWorker but doesn't fail if no token is provided
 */
export const optionalWorkerAuth = createMiddleware<{ Bindings: any; Variables: any }>(
  async (c, next) => {
    try {
      // Extract token from Authorization header
      const authHeader = c.req.header('Authorization');
      const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

      if (token) {
        // Verify and decode the token
        const payload = verifyWorkerAccessToken(token, c.env);

        // Create authenticated worker object directly from JWT payload
        const authenticatedWorker: AuthenticatedWorker = {
          id: payload.workerId,
          email: payload.email,
          fullName: payload.fullName,
          role: payload.role,
          businessId: payload.businessId,
          isActive: true, // Assume active if token is valid
        };

        // Set worker in context variables
        c.set('worker', authenticatedWorker);
      }

      // Continue regardless of authentication status
      return await next();
    } catch (error) {
      console.warn('Optional worker authentication failed:', error);

      // Continue without authentication
      return await next();
    }
  },
);

/**
 * Worker role-based authorization middleware
 * Requires specific worker roles to access the endpoint
 */
export function requireWorkerRole(allowedRoles: WorkerRole[]) {
  return createMiddleware<{ Bindings: any; Variables: any }>(
    async (c, next) => {
      const worker = c.get('worker') as AuthenticatedWorker | undefined;

      if (!worker) {
        console.warn('🚨 Worker role check: No authenticated worker found');
        return c.json(
          {
            success: false,
            error: 'Worker authentication required',
            timestamp: new Date().toISOString(),
            requestId: c.get('requestId'),
          },
          401,
        );
      }

      if (!allowedRoles.includes(worker.role)) {
        console.warn(`🚨 Worker role check failed: ${worker.role} not in ${allowedRoles.join(', ')}`);
        return c.json(
          {
            success: false,
            error: 'Insufficient worker permissions',
            message: `This action requires one of the following roles: ${allowedRoles.join(', ')}`,
            timestamp: new Date().toISOString(),
            requestId: c.get('requestId'),
          },
          403,
        );
      }

      return await next();
    },
  );
}

/**
 * Worker data isolation middleware
 * Ensures workers can only access data belonging to their business
 */
export const enforceWorkerDataIsolation = createMiddleware<{ Bindings: any; Variables: any }>(
  async (c, next) => {
    try {
      // Get authenticated worker from context
      const worker = c.get('worker') as AuthenticatedWorker | undefined;

      if (!worker) {
        console.warn('🚨 Worker data isolation middleware: No authenticated worker found');
        return c.json(
          {
            success: false,
            error: 'Worker authentication required for data access',
            timestamp: new Date().toISOString(),
            requestId: c.get('requestId'),
          },
          401,
        );
      }

      // Enhanced security: Validate business ID exists
      if (!worker.businessId) {
        console.error('🚨 Worker data isolation: Worker missing business ID');
        return c.json(
          {
            success: false,
            error: 'Invalid worker account configuration',
            timestamp: new Date().toISOString(),
            requestId: c.get('requestId'),
          },
          403,
        );
      }

      // Store business ID for use in database queries
      c.set('businessId', worker.businessId);

      return await next();
    } catch (error) {
      console.error('🚨 Worker data isolation error:', error);
      return c.json(
        {
          success: false,
          error: 'Data isolation check failed',
          timestamp: new Date().toISOString(),
          requestId: c.get('requestId'),
        },
        500,
      );
    }
  },
);

/**
 * Helper function to get worker ID from context
 */
export function getWorkerIdFromContext(c: HonoContext): string {
  const worker = c.get('worker') as AuthenticatedWorker | undefined;
  if (!worker) {
    throw new Error('No authenticated worker found in context');
  }
  return worker.id;
}

/**
 * Helper function to get business ID from worker context
 */
export function getBusinessIdFromWorkerContext(c: HonoContext): string {
  const worker = c.get('worker') as AuthenticatedWorker | undefined;
  if (!worker || !worker.businessId) {
    throw new Error('No authenticated worker or business ID found in context');
  }
  return worker.businessId;
}

/**
 * Helper function to create worker-filtered Supabase query
 * This ensures all queries are automatically filtered by business ID (user_id)
 */
export function createWorkerFilteredQuery(
  c: HonoContext,
  tableName: string,
  selectColumns?: string
) {
  const businessId = getBusinessIdFromWorkerContext(c);
  const supabase = c.get('supabase');

  // Enhanced security: Validate table name to prevent injection
  const allowedTables = [
    'products', 'product_categories', 'sales', 'expenses', 'expense_categories',
    'contacts', 'folders', 'files', 'deposits', 'stock_movements',
    'sales_audit', 'transactions', 'damaged_products', 'workers',
    'user_settings', 'stock_additions', 'stock_corrections'
  ];

  if (!allowedTables.includes(tableName)) {
    throw new Error(`Table ${tableName} is not allowed for worker queries`);
  }

  // Create query with automatic business ID filtering
  const query = selectColumns 
    ? supabase.from(tableName).select(selectColumns)
    : supabase.from(tableName).select('*');

  // Apply business ID filter for data isolation
  return query.eq('user_id', businessId);
}
