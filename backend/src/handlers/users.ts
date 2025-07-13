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
 * Get all users handler
 */
export const getUsersHandler = async (c: HonoContext) => {
  try {
    // Parse and validate query parameters
    const queryParams = Object.fromEntries(
      Object.entries(c.req.queries()).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value]),
    );
    const validation = queryParamsSchema.safeParse(queryParams);

    if (!validation.success) {
      const errors = validation.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      return c.json({
        success: false,
        error: 'Invalid query parameters',
        details: errors,
        timestamp: new Date().toISOString(),
        requestId: c.get('requestId'),
      }, 400);
    }

    const { page = 1, limit = 10, search, business_name, owner_name } = validation.data;

    let query = c.get('supabase')
      .from('users')
      .select('user_id, email_address, business_name, owner_name, phone_number, created_at, last_login');

    // Apply search filter
    if (search) {
      query = query.or(`business_name.ilike.%${search}%,owner_name.ilike.%${search}%,email_address.ilike.%${search}%`);
    }

    // Apply specific filters
    if (business_name) {
      query = query.ilike('business_name', `%${business_name}%`);
    }

    if (owner_name) {
      query = query.ilike('owner_name', `%${owner_name}%`);
    }

    // Get total count for pagination
    const { count: totalCount } = await c.get('supabase')
      .from('users')
      .select('*', { count: 'exact', head: true });

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    // Execute query
    const { data: users, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch users: ${error.message}`);
    }

    // Calculate pagination metadata
    const pagination = calculatePagination(page, limit, totalCount || 0);

    return c.json({
      success: true,
      message: 'Users retrieved successfully',
      data: users || [],
      pagination,
      timestamp: new Date().toISOString(),
      requestId: c.get('requestId'),
    });
  } catch (error) {
    console.error('Get users error:', error);

    return c.json({
      success: false,
      error: 'Failed to retrieve users',
      timestamp: new Date().toISOString(),
      requestId: c.get('requestId'),
    }, 500);
  }
};

/**
 * Get user by ID handler
 */
export const getUserHandler = async (c: HonoContext) => {
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

    const { data: user, error } = await c.get('supabase')
      .from('users')
      .select('user_id, email_address, business_name, owner_name, phone_number, created_at, last_login')
      .eq('user_id', userId)
      .single();

    if (error) {
      throw new Error(`Failed to fetch user: ${error.message}`);
    }

    if (!user) {
      throw new Error('User not found');
    }

    return c.json({
      success: true,
      message: 'User retrieved successfully',
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
    console.error('Get user error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Failed to retrieve user';

    if (errorMessage.includes('not found')) {
      return c.json({
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString(),
        requestId: c.get('requestId'),
      }, 404);
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
