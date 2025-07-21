/**
 * Data Isolation Middleware for Hono framework
 * Ensures complete data isolation between users by automatically filtering database queries
 */

import { createMiddleware } from 'hono/factory';
import type { HonoContext, AuthenticatedUser } from '../types/index';

/**
 * Enhanced data isolation middleware that ensures users can only access their own data
 * This middleware should be applied to all routes that access business data
 */
export const enforceDataIsolation = createMiddleware<{ Bindings: any; Variables: any }>(
  async (c, next) => {
    try {
      // Get authenticated user from context
      const user = c.get('user') as AuthenticatedUser | undefined;

      if (!user) {
        console.warn('🚨 Data isolation middleware: No authenticated user found');
        return c.json(
          {
            success: false,
            error: 'Authentication required for data access',
            timestamp: new Date().toISOString(),
            requestId: c.get('requestId'),
          },
          401,
        );
      }

      // Enhanced security: Validate user ID format
      if (!user.id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.id)) {
        console.error('🚨 Data isolation middleware: Invalid user ID format:', user.id);
        return c.json(
          {
            success: false,
            error: 'Invalid user authentication data',
            timestamp: new Date().toISOString(),
            requestId: c.get('requestId'),
          },
          401,
        );
      }

      // Enhanced security: Validate user role
      if (!user.role || user.role !== 'admin') {
        console.warn('🚨 Data isolation middleware: Invalid user role:', user.role);
        return c.json(
          {
            success: false,
            error: 'Invalid user role for data access',
            timestamp: new Date().toISOString(),
            requestId: c.get('requestId'),
          },
          403,
        );
      }

      // Store user ID in context for easy access in handlers
      c.set('userId', user.id);

      // Enhanced security: Log data access for audit trail
      console.log(`🔒 Data access granted to user: ${user.id} for path: ${c.req.path}`);

      // Continue to next middleware/handler
      return await next();
    } catch (error) {
      console.error('🚨 Data isolation middleware error:', error);

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
 * Helper function to get user ID from context
 * This should be used in all handlers that need to filter data by user
 */
export function getUserIdFromContext(c: HonoContext): string {
  const userId = c.get('userId') as string;
  
  if (!userId) {
    throw new Error('User ID not found in context. Ensure enforceDataIsolation middleware is applied.');
  }
  
  return userId;
}

/**
 * Helper function to validate that a resource belongs to the authenticated user
 * @param c - Hono context
 * @param resourceUserId - The user_id from the resource being accessed
 * @returns boolean indicating if access is allowed
 */
export function validateResourceOwnership(c: HonoContext, resourceUserId: string): boolean {
  const authenticatedUserId = getUserIdFromContext(c);
  return authenticatedUserId === resourceUserId;
}

/**
 * Enhanced helper function to create user-filtered Supabase query
 * This ensures all queries are automatically filtered by user_id with additional security
 */
export function createUserFilteredQuery<T>(
  c: HonoContext,
  tableName: string,
  selectColumns?: string
) {
  const userId = getUserIdFromContext(c);
  const supabase = c.get('supabase');

  // Enhanced security: Validate table name to prevent injection
  const allowedTables = [
    'products', 'product_categories', 'sales', 'expenses', 'expense_categories',
    'contacts', 'folders', 'files', 'deposits', 'stock_movements',
    'sales_audit', 'transactions', 'damaged_products', 'workers',
    'user_settings', 'stock_additions', 'stock_corrections'
  ];

  if (!allowedTables.includes(tableName)) {
    console.error(`🚨 Attempted access to unauthorized table: ${tableName} by user: ${userId}`);
    throw new Error(`Access to table '${tableName}' is not allowed`);
  }

  // Enhanced security: Validate select columns to prevent injection
  if (selectColumns && selectColumns.includes(';')) {
    console.error(`🚨 Potential SQL injection attempt in select columns: ${selectColumns} by user: ${userId}`);
    throw new Error('Invalid select columns format');
  }

  // Enhanced security: Log data access for audit trail
  console.log(`🔒 Creating filtered query for user: ${userId}, table: ${tableName}, columns: ${selectColumns || '*'}`);

  return supabase
    .from(tableName)
    .select(selectColumns || '*')
    .eq('user_id', userId);
}

/**
 * Middleware specifically for admin-only operations
 * Ensures only admin users can access certain endpoints
 */
export const requireAdminAccess = createMiddleware<{ Bindings: any; Variables: any }>(
  async (c, next) => {
    try {
      const user = c.get('user') as AuthenticatedUser | undefined;

      if (!user) {
        return c.json(
          {
            success: false,
            error: 'Authentication required',
            timestamp: new Date().toISOString(),
            requestId: c.get('requestId'),
          },
          401,
        );
      }

      // In this system, all users are admins of their own data
      // But we can add additional role checks here if needed
      if (user.role !== 'admin') {
        return c.json(
          {
            success: false,
            error: 'Admin access required',
            timestamp: new Date().toISOString(),
            requestId: c.get('requestId'),
          },
          403,
        );
      }

      return await next();
    } catch (error) {
      console.error('Admin access middleware error:', error);

      return c.json(
        {
          success: false,
          error: 'Admin access check failed',
          timestamp: new Date().toISOString(),
          requestId: c.get('requestId'),
        },
        500,
      );
    }
  },
);

/**
 * Helper function to ensure data isolation in create operations
 * Automatically adds user_id to insert data
 */
export function addUserIdToInsertData<T extends Record<string, any>>(
  c: HonoContext,
  data: T
): T & { user_id: string } {
  const userId = getUserIdFromContext(c);
  
  return {
    ...data,
    user_id: userId,
  };
}

/**
 * Helper function to validate user_id in update operations
 * Ensures users can only update their own data
 */
export function validateUserIdInUpdateData(
  c: HonoContext,
  data: Record<string, any>
): void {
  const userId = getUserIdFromContext(c);
  
  // If user_id is provided in update data, ensure it matches authenticated user
  if (data.user_id && data.user_id !== userId) {
    throw new Error('Cannot update data with different user_id');
  }
  
  // Ensure user_id is set to authenticated user
  data.user_id = userId;
}
