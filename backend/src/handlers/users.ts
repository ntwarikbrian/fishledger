/**
 * User handlers for user management endpoints
 * Provides endpoints for managing user accounts using Hono framework
 */

import { z } from 'zod';
import type { HonoContext, PaginationParams } from '../types/index';
import {
  createUser,
  updateUser,
  getUserByEmail,
  getUserByBusinessName,
  recordExists,
  softDelete,
} from '../utils/db';
import { hashPassword, validatePasswordStrength } from '../utils/auth';
import { calculatePagination } from '../utils/response';

// Request interfaces
export interface CreateUserRequest {
  email_address: string;
  business_name: string;
  owner_name: string;
  password: string;
  phone_number?: string;
}

export interface UpdateUserRequest {
  email_address?: string;
  business_name?: string;
  owner_name?: string;
  phone_number?: string;
  password?: string;
}

export interface UserFilters {
  search?: string;
  business_name?: string;
  owner_name?: string;
}

// Validation schemas
const createUserSchema = z.object({
  email_address: z.string().email('Invalid email format'),
  business_name: z.string().min(2, 'Business name must be at least 2 characters').max(100, 'Business name too long'),
  owner_name: z.string().min(2, 'Owner name must be at least 2 characters').max(100, 'Owner name too long'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone_number: z.string().optional(),
});

const updateUserSchema = z.object({
  email_address: z.string().email('Invalid email format').optional(),
  business_name: z.string().min(2, 'Business name must be at least 2 characters').max(100, 'Business name too long').optional(),
  owner_name: z.string().min(2, 'Owner name must be at least 2 characters').max(100, 'Owner name too long').optional(),
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
  phone_number: z.string().optional(),
});

const queryParamsSchema = z.object({
  page: z.string().transform(val => parseInt(val, 10)).optional(),
  limit: z.string().transform(val => parseInt(val, 10)).optional(),
  search: z.string().optional(),
  business_name: z.string().optional(),
  owner_name: z.string().optional(),
});

/**
 * Get current user profile handler (FIXED: Data isolation enforced)
 * Each admin can only see their own profile, not other users
 */
export const getUsersHandler = async (c: HonoContext) => {
  try {
    // SECURITY FIX: Get current authenticated user only
    const user = c.get('user');
    if (!user) {
      return c.json({
        success: false,
        error: 'Authentication required',
        timestamp: new Date().toISOString(),
        requestId: c.get('requestId'),
      }, 401);
    }

    // SECURITY FIX: Only return current user's data - complete data isolation
    const { data: currentUser, error } = await c.get('supabase')
      .from('users')
      .select('user_id, email_address, business_name, owner_name, phone_number, created_at, last_login')
      .eq('user_id', user.id) // CRITICAL: Only get current user's data
      .single();

    if (error) {
      console.error('Get current user error:', error);
      return c.json({
        success: false,
        error: 'Failed to retrieve user profile',
        timestamp: new Date().toISOString(),
        requestId: c.get('requestId'),
      }, 500);
    }

    if (!currentUser) {
      return c.json({
        success: false,
        error: 'User profile not found',
        timestamp: new Date().toISOString(),
        requestId: c.get('requestId'),
      }, 404);
    }

    // Return only current user's data in array format for consistency
    return c.json({
      success: true,
      message: 'User profile retrieved successfully',
      data: [currentUser], // Single user in array for API consistency
      pagination: {
        page: 1,
        limit: 1,
        total: 1,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      },
      timestamp: new Date().toISOString(),
      requestId: c.get('requestId'),
    });
  } catch (error) {
    console.error('Get user profile error:', error);

    return c.json({
      success: false,
      error: 'Failed to retrieve user profile',
      timestamp: new Date().toISOString(),
      requestId: c.get('requestId'),
    }, 500);
  }
};

/**
 * Get user by ID handler (FIXED: Data isolation enforced)
 * Users can only access their own profile data
 */
export const getUserHandler = async (c: HonoContext) => {
  try {
    const requestedUserId = c.req.param('id');
    const currentUser = c.get('user');

    if (!currentUser) {
      return c.json({
        success: false,
        error: 'Authentication required',
        timestamp: new Date().toISOString(),
        requestId: c.get('requestId'),
      }, 401);
    }

    if (!requestedUserId) {
      return c.json({
        success: false,
        error: 'User ID is required',
        timestamp: new Date().toISOString(),
        requestId: c.get('requestId'),
      }, 400);
    }

    // SECURITY FIX: Users can only access their own data
    if (requestedUserId !== currentUser.id) {
      console.warn(`🚨 User ${currentUser.id} attempted to access user ${requestedUserId}'s data`);
      return c.json({
        success: false,
        error: 'Access denied. You can only access your own profile.',
        timestamp: new Date().toISOString(),
        requestId: c.get('requestId'),
      }, 403);
    }

    // Get user data with data isolation
    const { data: user, error } = await c.get('supabase')
      .from('users')
      .select('user_id, email_address, business_name, owner_name, phone_number, created_at, last_login')
      .eq('user_id', currentUser.id) // CRITICAL: Only get current user's data
      .single();

    if (error) {
      console.error('Get user error:', error);
      return c.json({
        success: false,
        error: 'Failed to fetch user profile',
        timestamp: new Date().toISOString(),
        requestId: c.get('requestId'),
      }, 500);
    }

    if (!user) {
      return c.json({
        success: false,
        error: 'User profile not found',
        timestamp: new Date().toISOString(),
        requestId: c.get('requestId'),
      }, 404);
    }

    return c.json({
      success: true,
      message: 'User profile retrieved successfully',
      data: {
        id: user.user_id,
        email: user.email_address,
        businessName: user.business_name,
        ownerName: user.owner_name,
        phoneNumber: user.phone_number,
        createdAt: user.created_at,
        lastLogin: user.last_login,
      },
      timestamp: new Date().toISOString(),
      requestId: c.get('requestId'),
    });
  } catch (error) {
    console.error('Get user profile error:', error);

    return c.json({
      success: false,
      error: 'Failed to retrieve user profile',
      timestamp: new Date().toISOString(),
      requestId: c.get('requestId'),
    }, 500);
  }
};

/**
 * Create user handler
 */
export const createUserHandler = async (c: HonoContext) => {
  try {
    // Parse request body
    const body = await c.req.json() as CreateUserRequest;

    // Validate input
    const validation = createUserSchema.safeParse(body);
    if (!validation.success) {
      const errors = validation.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      return c.json({
        success: false,
        error: 'Validation failed',
        details: errors,
        timestamp: new Date().toISOString(),
        requestId: c.get('requestId'),
      }, 400);
    }

    const { email_address, business_name, owner_name, password, phone_number } = validation.data;

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return c.json({
        success: false,
        error: `Password validation failed: ${passwordValidation.errors.join(', ')}`,
        timestamp: new Date().toISOString(),
        requestId: c.get('requestId'),
      }, 400);
    }

    // Check if email already exists
    const existingUserByEmail = await getUserByEmail(c.get('supabase'), email_address);
    if (existingUserByEmail) {
      return c.json({
        success: false,
        error: 'Email already registered',
        timestamp: new Date().toISOString(),
        requestId: c.get('requestId'),
      }, 409);
    }

    // Check if business name already exists
    const existingUserByBusinessName = await getUserByBusinessName(c.get('supabase'), business_name);
    if (existingUserByBusinessName) {
      return c.json({
        success: false,
        error: 'Business name already taken',
        timestamp: new Date().toISOString(),
        requestId: c.get('requestId'),
      }, 409);
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const newUser = await createUser(c.get('supabase'), {
      email_address,
      business_name,
      owner_name,
      phone_number: phone_number || null,
      password: hashedPassword,
    });

    return c.json({
      success: true,
      message: 'User created successfully',
      data: {
        id: newUser.user_id,
        email: newUser.email_address,
        businessName: newUser.business_name,
        ownerName: newUser.owner_name,
        phoneNumber: newUser.phone_number,
        createdAt: newUser.created_at,
      },
      timestamp: new Date().toISOString(),
      requestId: c.get('requestId'),
    }, 201);
  } catch (error) {
    console.error('Create user error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Failed to create user';
    if (errorMessage.includes('already registered') || errorMessage.includes('already taken')) {
      return c.json({
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString(),
        requestId: c.get('requestId'),
      }, 409);
    } else if (errorMessage.includes('validation failed')) {
      return c.json({
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString(),
        requestId: c.get('requestId'),
      }, 400);
    }

    return c.json({
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString(),
      requestId: c.get('requestId'),
    }, 500);
  }
};

/**
 * Update user handler
 */
export const updateUserHandler = async (c: HonoContext) => {
  try {
    const userId = c.req.param('id');

    if (!userId) {
      return c.json({
        success: false,
        error: 'User ID is required',
        timestamp: new Date().toISOString(),
        requestId: c.get('requestId'),
      }, 400);
    }

    // Parse request body
    const body = await c.req.json() as UpdateUserRequest;

    // Validate input
    const validation = updateUserSchema.safeParse(body);
    if (!validation.success) {
      const errors = validation.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      return c.json({
        success: false,
        error: 'Validation failed',
        details: errors,
        timestamp: new Date().toISOString(),
        requestId: c.get('requestId'),
      }, 400);
    }

    // Check if user exists
    const userExists = await recordExists(c.get('supabase'), 'users', 'user_id', userId);
    if (!userExists) {
      return c.json({
        success: false,
        error: 'User not found',
        timestamp: new Date().toISOString(),
        requestId: c.get('requestId'),
      }, 404);
    }

    // Validate email uniqueness if being updated
    if (validation.data.email_address) {
      const existingUser = await getUserByEmail(c.get('supabase'), validation.data.email_address);
      if (existingUser && existingUser.user_id !== userId) {
        return c.json({
          success: false,
          error: 'Email already in use by another user',
          timestamp: new Date().toISOString(),
          requestId: c.get('requestId'),
        }, 409);
      }
    }

    // Validate business name uniqueness if being updated
    if (validation.data.business_name) {
      const existingUser = await getUserByBusinessName(c.get('supabase'), validation.data.business_name);
      if (existingUser && existingUser.user_id !== userId) {
        return c.json({
          success: false,
          error: 'Business name already in use by another user',
          timestamp: new Date().toISOString(),
          requestId: c.get('requestId'),
        }, 409);
      }
    }

    // Hash password if being updated
    const processedUpdateData = { ...validation.data };
    if (validation.data.password) {
      const passwordValidation = validatePasswordStrength(validation.data.password);
      if (!passwordValidation.isValid) {
        return c.json({
          success: false,
          error: `Password validation failed: ${passwordValidation.errors.join(', ')}`,
          timestamp: new Date().toISOString(),
          requestId: c.get('requestId'),
        }, 400);
      }

      processedUpdateData.password = await hashPassword(validation.data.password);
    }

    // Update user
    const updatedUser = await updateUser(c.get('supabase'), userId, processedUpdateData as any);

    return c.json({
      success: true,
      message: 'User updated successfully',
      data: {
        id: updatedUser.user_id,
        email: updatedUser.email_address,
        businessName: updatedUser.business_name,
        ownerName: updatedUser.owner_name,
        phoneNumber: updatedUser.phone_number,
        createdAt: updatedUser.created_at,
      },
      timestamp: new Date().toISOString(),
      requestId: c.get('requestId'),
    });
  } catch (error) {
    console.error('Update user error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Failed to update user';
    let statusCode = 500;

    if (errorMessage.includes('not found')) {
      statusCode = 404;
    } else if (errorMessage.includes('already in use')) {
      statusCode = 409;
    } else if (errorMessage.includes('validation failed')) {
      statusCode = 400;
    }

    return c.json({
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString(),
      requestId: c.get('requestId'),
    }, statusCode as any);
  }
};

/**
 * Delete user handler
 */
export const deleteUserHandler = async (c: HonoContext) => {
  try {
    const userId = c.req.param('id');

    if (!userId) {
      return c.json({
        success: false,
        error: 'User ID is required',
        timestamp: new Date().toISOString(),
        requestId: c.get('requestId'),
      }, 400);
    }

    // Check if user exists
    const userExists = await recordExists(c.get('supabase'), 'users', 'user_id', userId);
    if (!userExists) {
      return c.json({
        success: false,
        error: 'User not found',
        timestamp: new Date().toISOString(),
        requestId: c.get('requestId'),
      }, 404);
    }

    // Perform soft delete
    await softDelete(c.get('supabase'), 'users', 'user_id', userId);

    return c.json({
      success: true,
      message: 'User deleted successfully',
      timestamp: new Date().toISOString(),
      requestId: c.get('requestId'),
    });
  } catch (error) {
    console.error('Delete user error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Failed to delete user';
    const statusCode = errorMessage.includes('not found') ? 404 : 500;

    return c.json({
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString(),
      requestId: c.get('requestId'),
    }, statusCode as any);
  }
};
