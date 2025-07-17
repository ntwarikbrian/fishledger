/**
 * Authentication middleware for Hono framework
 * Handles JWT token validation and user authentication
 */

import { createMiddleware } from 'hono/factory';
import type { AuthenticatedUser } from '../types/index';
import { verifyAccessToken, extractBearerToken } from '../utils/auth';
import { getUserByEmail } from '../utils/db';

/**
 * Authentication middleware that validates JWT tokens
 * Sets user in context variables if authentication succeeds
 */
export const authenticate = createMiddleware<{ Bindings: any; Variables: any }>(
  async (c, next) => {
    try {
      // Extract token from Authorization header
      const authHeader = c.req.header('Authorization');
      const token = extractBearerToken(authHeader || null);

      if (!token) {
        return c.json(
          {
            success: false,
            error: 'Missing authorization token',
            timestamp: new Date().toISOString(),
            requestId: c.get('requestId'),
          },
          401,
        );
      }

      // Verify and decode the token
      const payload = verifyAccessToken(token, c.env);

      // Get user from database to ensure they still exist and are active
      const user = await getUserByEmail(c.get('supabase'), payload.email);

      if (!user) {
        return c.json(
          {
            success: false,
            error: 'User not found',
            timestamp: new Date().toISOString(),
            requestId: c.get('requestId'),
          },
          401,
        );
      }

      // Create authenticated user object
      const authenticatedUser: AuthenticatedUser = {
        id: user.user_id,
        email: user.email_address,
        username: user.owner_name, // Using owner_name as username
        role: 'admin', // Default role for business owners
        isActive: true, // Assume active if user exists
      };

      // Set user in context variables
      c.set('user', authenticatedUser);

      // Continue to next middleware/handler
      return await next();
    } catch (error) {
      console.error('Authentication error:', error);

      const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
      return c.json(
        {
          success: false,
          error: errorMessage,
          timestamp: new Date().toISOString(),
          requestId: c.get('requestId'),
        },
        401,
      );
    }
  },
);

/**
 * Authorization middleware that checks user roles
 * @param allowedRoles - Array of roles that are allowed to access the route
 */
export const requireRole = (allowedRoles: string[]) =>
  createMiddleware<{ Bindings: any; Variables: any }>(async (c, next) => {
    console.log(`🔐 requireRole middleware called for roles: ${allowedRoles.join(', ')}`);

    const user = c.get('user') as AuthenticatedUser | undefined;
    console.log('👤 User in requireRole:', user ? { id: user.id, role: user.role } : 'NO USER');

    // Check if user is authenticated
    if (!user) {
      console.log('❌ No user found, returning 401');
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

    // Check if user has required role
    if (!allowedRoles.includes(user.role)) {
      console.log(`❌ User role '${user.role}' not in allowed roles: ${allowedRoles.join(', ')}`);
      return c.json(
        {
          success: false,
          error: `Access denied. Required roles: ${allowedRoles.join(', ')}`,
          timestamp: new Date().toISOString(),
          requestId: c.get('requestId'),
        },
        403,
      );
    }

    console.log('✅ User authorized, continuing to handler');
    // User is authorized, continue
    return await next();
  });

/**
 * Optional authentication middleware that doesn't fail if no token is provided
 * Useful for routes that work for both authenticated and anonymous users
 */
export const optionalAuth = createMiddleware<{ Bindings: any; Variables: any }>(
  async (c, next) => {
    try {
      // Extract token from Authorization header
      const authHeader = c.req.header('Authorization');
      const token = extractBearerToken(authHeader || null);

      if (token) {
        // Verify and decode the token
        const payload = verifyAccessToken(token, c.env);

        // Get user from database
        const user = await getUserByEmail(c.get('supabase'), payload.email);

        if (user) {
          // Create authenticated user object
          const authenticatedUser: AuthenticatedUser = {
            id: user.user_id,
            email: user.email_address,
            username: user.owner_name, // Using owner_name as username
            role: 'admin', // Default role for business owners
            isActive: true, // Assume active if user exists
          };

          // Set user in context variables
          c.set('user', authenticatedUser);
        }
      }

      // Continue regardless of authentication status
      return await next();
    } catch (error) {
      console.warn('Optional authentication failed:', error);

      // Continue without authentication
      return await next();
    }
  },
);

/**
 * Admin-only middleware (shorthand for admin authorization)
 */
export const requireAdmin = requireRole(['admin']);

/**
 * Manager or admin middleware
 */
export const requireManager = requireRole(['admin', 'manager']);

/**
 * Employee, manager, or admin middleware (any authenticated user)
 */
export const requireEmployee = requireRole(['admin', 'manager', 'employee']);

/**
 * Self-access middleware that allows users to access their own resources
 * @param getUserIdFromPath - Function to extract user ID from request path
 */
export const requireSelfOrAdmin = (getUserIdFromPath: (c: any) => string | null) =>
  createMiddleware<{ Bindings: any; Variables: any }>(async (c, next) => {
    const user = c.get('user') as AuthenticatedUser | undefined;

    // Check if user is authenticated
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

    // Extract target user ID from request
    const targetUserId = getUserIdFromPath(c);

    if (!targetUserId) {
      return c.json(
        {
          success: false,
          error: 'Invalid user ID',
          timestamp: new Date().toISOString(),
          requestId: c.get('requestId'),
        },
        400,
      );
    }

    // Allow access if user is admin or accessing their own resource
    if (user.role === 'admin' || user.id === targetUserId) {
      return await next();
    }

    return c.json(
      {
        success: false,
        error: 'Access denied',
        timestamp: new Date().toISOString(),
        requestId: c.get('requestId'),
      },
      403,
    );
  });
