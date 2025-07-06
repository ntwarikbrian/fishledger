/**
 * Authentication Middleware
 * Handles JWT token verification and user authentication
 */

import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { jwtConfig } from '../config/environment.js';
import { AuthenticatedRequest } from '../types/api.js';
import { createError } from './errorHandler.js';
import { query } from '../config/database.js';

/**
 * JWT payload interface
 */
interface JWTPayload {
  user_id: string;
  email: string;
  business_name: string;
  owner_name: string;
  role: 'admin' | 'worker';
  worker_id?: string;
  iat: number;
  exp: number;
}

/**
 * Extract token from request headers
 * Supports both Authorization header and cookies
 */
const extractToken = (req: AuthenticatedRequest): string | null => {
  // Check Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Check cookies (if using cookie-based auth)
  if (req.cookies && req.cookies.token) {
    return req.cookies.token;
  }

  return null;
};

/**
 * Verify JWT token and extract user information
 */
const verifyToken = (token: string): JWTPayload => {
  try {
    const decoded = jwt.verify(token, jwtConfig.secret) as JWTPayload;
    return decoded;
  } catch (error) {
    throw createError.unauthorized('Invalid or expired token');
  }
};

/**
 * Get user information from database
 */
const getUserFromDatabase = async (userId: string): Promise<any> => {
  const result = await query(
    'SELECT user_id, business_name, owner_name, email_address FROM users WHERE user_id = $1',
    [userId]
  );

  if (result.rows.length === 0) {
    throw createError.unauthorized('User not found');
  }

  return result.rows[0];
};

/**
 * Get worker information from database
 */
const getWorkerFromDatabase = async (workerId: string): Promise<any> => {
  const result = await query(
    'SELECT worker_id, full_name, email FROM workers WHERE worker_id = $1',
    [workerId]
  );

  if (result.rows.length === 0) {
    throw createError.unauthorized('Worker not found');
  }

  return result.rows[0];
};

/**
 * Get worker permissions from database
 */
const getWorkerPermissions = async (workerId: string): Promise<string[]> => {
  const result = await query(
    'SELECT permission_name FROM worker_permissions WHERE worker_id = $1 AND is_granted = true',
    [workerId]
  );

  return result.rows.map((row: any) => row.permission_name);
};

/**
 * Authentication middleware
 * Verifies JWT token and attaches user information to request
 */
export const authenticate = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract token from request
    const token = extractToken(req);
    if (!token) {
      throw createError.unauthorized('Access token is required');
    }

    // Verify token
    const payload = verifyToken(token);

    // Get user information from database
    const user = await getUserFromDatabase(payload.user_id);

    // Attach user information to request
    req.user = {
      user_id: user.user_id,
      email: user.email_address,
      business_name: user.business_name,
      owner_name: user.owner_name,
      role: payload.role,
    };

    // If this is a worker, get worker information and permissions
    if (payload.role === 'worker' && payload.worker_id) {
      const worker = await getWorkerFromDatabase(payload.worker_id);
      const permissions = await getWorkerPermissions(payload.worker_id);

      req.worker = {
        worker_id: worker.worker_id,
        email: worker.email,
        full_name: worker.full_name,
        permissions,
      };
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Admin-only middleware
 * Ensures only admin users can access the endpoint
 */
export const requireAdmin = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    return next(createError.unauthorized('Authentication required'));
  }

  if (req.user.role !== 'admin') {
    return next(createError.forbidden('Admin access required'));
  }

  next();
};

/**
 * Permission-based middleware factory
 * Creates middleware that checks for specific permissions
 */
export const requirePermission = (permission: string) => {
  return (
    req: AuthenticatedRequest,
    _res: Response,
    next: NextFunction
  ): void => {
    if (!req.user) {
      return next(createError.unauthorized('Authentication required'));
    }

    // Admin users have all permissions
    if (req.user.role === 'admin') {
      return next();
    }

    // Check worker permissions
    if (req.worker && req.worker.permissions.includes(permission)) {
      return next();
    }

    next(createError.forbidden(`Permission '${permission}' required`));
  };
};

/**
 * Optional authentication middleware
 * Attaches user information if token is present, but doesn't require it
 */
export const optionalAuth = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractToken(req);
    if (token) {
      const payload = verifyToken(token);
      const user = await getUserFromDatabase(payload.user_id);

      req.user = {
        user_id: user.user_id,
        email: user.email_address,
        business_name: user.business_name,
        owner_name: user.owner_name,
        role: payload.role,
      };

      if (payload.role === 'worker' && payload.worker_id) {
        const worker = await getWorkerFromDatabase(payload.worker_id);
        const permissions = await getWorkerPermissions(payload.worker_id);

        req.worker = {
          worker_id: worker.worker_id,
          email: worker.email,
          full_name: worker.full_name,
          permissions,
        };
      }
    }
    next();
  } catch (error) {
    // For optional auth, we don't throw errors, just continue without user
    next();
  }
};

/**
 * Refresh token middleware
 * Handles refresh token verification for token renewal
 */
export const verifyRefreshToken = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void => {
  try {
    const { refresh_token } = req.body;
    if (!refresh_token) {
      throw createError.badRequest('Refresh token is required');
    }

    const payload = jwt.verify(refresh_token, jwtConfig.refreshSecret) as JWTPayload;
    req.user = {
      user_id: payload.user_id,
      email: payload.email,
      business_name: payload.business_name,
      owner_name: payload.owner_name,
      role: payload.role,
    };

    next();
  } catch (error) {
    next(createError.unauthorized('Invalid refresh token'));
  }
};
