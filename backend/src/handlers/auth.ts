/**
 * Authentication handlers for user login, registration, and token management
 * Provides secure authentication endpoints using Hono framework
 */

import { z } from 'zod';
import type { HonoContext, AuthenticatedUser } from '../types/index';
import {
  hashPassword,
  verifyPassword,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  validatePasswordStrength,
} from '../utils/auth';
import {
  getUserByEmail,
  getUserByBusinessName,
  createUser,
  updateLastLogin,
} from '../utils/db';

// Request interfaces
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email_address: string;
  business_name: string;
  owner_name: string;
  password: string;
  confirm_password: string;
  phone_number?: string;
}

// Validation schemas
const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

const registerSchema = z.object({
  email_address: z.string().email('Invalid email format'),
  business_name: z.string().min(2, 'Business name must be at least 2 characters').max(100, 'Business name too long'),
  owner_name: z.string().min(2, 'Owner name must be at least 2 characters').max(100, 'Owner name too long'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm_password: z.string().min(1, 'Password confirmation is required'),
  phone_number: z.string().optional(),
}).refine((data) => data.password === data.confirm_password, {
  message: "Passwords don't match",
  path: ['confirm_password'],
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

/**
 * User login handler
 */
export const loginHandler = async (c: HonoContext) => {
  try {
    // Parse request body
    const body = await c.req.json() as LoginRequest;

    // Validate input
    const validation = loginSchema.safeParse(body);
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

    const { email, password } = validation.data;

    // Get user by email with enhanced security checks
    const user = await getUserByEmail(c.get('supabase'), email);
    if (!user) {
      // Log failed login attempt for security monitoring
      console.warn(`🚨 Failed login attempt for email: ${email} - User not found`);
      return c.json({
        success: false,
        error: 'Invalid email or password',
        timestamp: new Date().toISOString(),
        requestId: c.get('requestId'),
      }, 401);
    }

    // Enhanced security: Check if user account is active
    if (!user.is_active) {
      console.warn(`🚨 Login attempt for deactivated account: ${email}`);
      return c.json({
        success: false,
        error: 'Account is deactivated. Please contact support.',
        timestamp: new Date().toISOString(),
        requestId: c.get('requestId'),
      }, 401);
    }

    // Enhanced security: Verify password exists and is properly hashed
    if (!user.password || user.password.length < 10) {
      console.error(`🚨 Account with invalid password hash: ${email}`);
      return c.json({
        success: false,
        error: 'Account setup incomplete. Please contact support.',
        timestamp: new Date().toISOString(),
        requestId: c.get('requestId'),
      }, 401);
    }

    // Enhanced password verification with timing attack protection
    const isValidPassword = await verifyPassword(password, user.password);
    if (!isValidPassword) {
      // Log failed password attempt for security monitoring
      console.warn(`🚨 Failed password verification for user: ${email}`);
      return c.json({
        success: false,
        error: 'Invalid email or password',
        timestamp: new Date().toISOString(),
        requestId: c.get('requestId'),
      }, 401);
    }

    // Additional security: Verify user_id exists and is valid UUID
    if (!user.user_id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.user_id)) {
      console.error(`🚨 Invalid user_id format for user: ${email}`);
      return c.json({
        success: false,
        error: 'Account data corrupted. Please contact support.',
        timestamp: new Date().toISOString(),
        requestId: c.get('requestId'),
      }, 401);
    }

    // Create authenticated user object
    const authenticatedUser: AuthenticatedUser = {
      id: user.user_id,
      email: user.email_address,
      username: user.business_name,
      role: 'admin' as const,
      isActive: true,
    };

    // Generate tokens
    const accessToken = generateAccessToken(authenticatedUser, c.env);
    const refreshToken = generateRefreshToken(user.user_id, 1, c.env);

    // Update last login
    await updateLastLogin(c.get('supabase'), user.user_id);

    return c.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.user_id,
          email: user.email_address,
          businessName: user.business_name,
          ownerName: user.owner_name,
          phoneNumber: user.phone_number,
        },
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: c.env.JWT_EXPIRES_IN,
        },
      },
      timestamp: new Date().toISOString(),
      requestId: c.get('requestId'),
    });
  } catch (error) {
    console.error('Login error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Login failed';

    if (errorMessage.includes('Invalid email or password')) {
      return c.json({
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString(),
        requestId: c.get('requestId'),
      }, 401);
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
 * User registration handler
 */
export const registerHandler = async (c: HonoContext) => {
  try {
    // Parse request body
    const body = await c.req.json() as RegisterRequest;

    // Validate input
    const validation = registerSchema.safeParse(body);
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

    // Enhanced security: Check if email already exists
    const existingUserByEmail = await getUserByEmail(c.get('supabase'), email_address);
    if (existingUserByEmail) {
      console.warn(`🚨 Registration attempt with existing email: ${email_address}`);
      return c.json({
        success: false,
        error: 'Email already registered',
        timestamp: new Date().toISOString(),
        requestId: c.get('requestId'),
      }, 409);
    }

    // Enhanced security: Check if business name already exists
    const existingUserByBusinessName = await getUserByBusinessName(c.get('supabase'), business_name);
    if (existingUserByBusinessName) {
      console.warn(`🚨 Registration attempt with existing business name: ${business_name}`);
      return c.json({
        success: false,
        error: 'Business name already taken',
        timestamp: new Date().toISOString(),
        requestId: c.get('requestId'),
      }, 409);
    }

    // Enhanced security: Hash password with strong settings
    const hashedPassword = await hashPassword(password);

    // Enhanced security: Validate hashed password
    if (!hashedPassword || hashedPassword.length < 10) {
      console.error('🚨 Password hashing failed during registration');
      return c.json({
        success: false,
        error: 'Password processing failed. Please try again.',
        timestamp: new Date().toISOString(),
        requestId: c.get('requestId'),
      }, 500);
    }

    // Create user with enhanced security
    const newUser = await createUser(c.get('supabase'), {
      email_address,
      business_name,
      owner_name,
      phone_number: phone_number || null,
      password: hashedPassword,
      is_active: true, // Explicitly set active status
    });

    // Enhanced security: Verify user creation
    if (!newUser || !newUser.user_id) {
      console.error('🚨 User creation failed - no user ID returned');
      return c.json({
        success: false,
        error: 'Account creation failed. Please try again.',
        timestamp: new Date().toISOString(),
        requestId: c.get('requestId'),
      }, 500);
    }

    console.log(`✅ New user account created successfully: ${newUser.user_id} (${email_address})`);

    // Create authenticated user object
    const authenticatedUser: AuthenticatedUser = {
      id: newUser.user_id,
      email: newUser.email_address,
      username: newUser.business_name,
      role: 'admin' as const,
      isActive: true,
    };

    // Generate tokens
    const accessToken = generateAccessToken(authenticatedUser, c.env);
    const refreshToken = generateRefreshToken(newUser.user_id, 1, c.env);

    return c.json({
      success: true,
      message: 'Registration successful',
      data: {
        user: {
          id: newUser.user_id,
          email: newUser.email_address,
          businessName: newUser.business_name,
          ownerName: newUser.owner_name,
          phoneNumber: newUser.phone_number,
        },
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: c.env.JWT_EXPIRES_IN,
        },
      },
      timestamp: new Date().toISOString(),
      requestId: c.get('requestId'),
    }, 201);
  } catch (error) {
    console.error('Registration error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Registration failed';

    if (errorMessage.includes('already registered') || errorMessage.includes('already taken')) {
      return c.json({
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString(),
        requestId: c.get('requestId'),
      }, 409);
    } else if (errorMessage.includes('Password validation failed')) {
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
 * Token refresh handler
 */
export const refreshTokenHandler = async (c: HonoContext) => {
  try {
    // Parse request body
    const body = await c.req.json();

    // Validate input
    const validation = refreshTokenSchema.safeParse(body);
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

    // Verify refresh token
    const payload = verifyRefreshToken(validation.data.refreshToken, c.env);

    // Get user from database
    const { data: user, error } = await c.get('supabase')
      .from('users')
      .select('*')
      .eq('user_id', payload.userId)
      .single();

    if (error || !user) {
      return c.json({
        success: false,
        error: 'Invalid refresh token',
        timestamp: new Date().toISOString(),
        requestId: c.get('requestId'),
      }, 401);
    }

    // Generate new access token
    const authenticatedUser: AuthenticatedUser = {
      id: user.user_id,
      email: user.email_address,
      username: user.business_name,
      role: 'admin' as const,
      isActive: true,
    };

    const newAccessToken = generateAccessToken(authenticatedUser, c.env);

    return c.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken: newAccessToken,
        expiresIn: c.env.JWT_EXPIRES_IN,
      },
      timestamp: new Date().toISOString(),
      requestId: c.get('requestId'),
    });
  } catch (error) {
    console.error('Token refresh error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Token refresh failed';

    return c.json({
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString(),
      requestId: c.get('requestId'),
    }, 401);
  }
};

/**
 * User logout handler
 */
export const logoutHandler = async (c: HonoContext) => {
  try {
    const user = c.get('user');

    if (user) {
      // In a real implementation, you would:
      // 1. Add the refresh token to a blacklist
      // 2. Increment the user's token version to invalidate all tokens
      // 3. Clear any server-side sessions

      console.log(`User ${user.id} logged out`);
    }

    return c.json({
      success: true,
      message: 'Logout successful',
      timestamp: new Date().toISOString(),
      requestId: c.get('requestId'),
    });
  } catch (error) {
    console.error('Logout error:', error);

    return c.json({
      success: false,
      error: 'Logout failed',
      timestamp: new Date().toISOString(),
      requestId: c.get('requestId'),
    }, 500);
  }
};

/**
 * Get current user profile handler
 */
export const profileHandler = async (c: HonoContext) => {
  try {
    const user = c.get('user');

    if (!user) {
      return c.json({
        success: false,
        error: 'User not authenticated',
        timestamp: new Date().toISOString(),
        requestId: c.get('requestId'),
      }, 401);
    }

    // Get user profile from database
    const { data: userProfile, error } = await c.get('supabase')
      .from('users')
      .select('user_id, email_address, business_name, owner_name, phone_number, created_at, last_login')
      .eq('user_id', user.id)
      .single();

    if (error || !userProfile) {
      return c.json({
        success: false,
        error: 'User not found',
        timestamp: new Date().toISOString(),
        requestId: c.get('requestId'),
      }, 404);
    }

    return c.json({
      success: true,
      message: 'Profile retrieved successfully',
      data: {
        id: userProfile.user_id,
        email: userProfile.email_address,
        businessName: userProfile.business_name,
        ownerName: userProfile.owner_name,
        phoneNumber: userProfile.phone_number,
        createdAt: userProfile.created_at,
        lastLogin: userProfile.last_login,
      },
      timestamp: new Date().toISOString(),
      requestId: c.get('requestId'),
    });
  } catch (error) {
    console.error('Profile error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Failed to get profile';
    const statusCode = errorMessage.includes('not found') ? 404 : 500;

    return c.json({
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString(),
      requestId: c.get('requestId'),
    }, statusCode as any);
  }
};
