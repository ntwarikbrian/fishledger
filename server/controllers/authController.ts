/**
 * Authentication Controller
 * Handles user authentication, registration, and token management
 */

import { Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { query } from '../config/database.js';
import { jwtConfig } from '../config/environment.js';
import { AuthenticatedRequest, AuthResponse } from '../types/api.js';
import { createError, asyncHandler } from '../middleware/errorHandler.js';

/**
 * Validation schemas using Zod
 */
const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
  remember_me: z.boolean().optional(),
});

const registerSchema = z.object({
  business_name: z.string().min(2, 'Business name must be at least 2 characters'),
  owner_name: z.string().min(2, 'Owner name must be at least 2 characters'),
  email_address: z.string().email('Invalid email format'),
  phone_number: z.string().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm_password: z.string(),
}).refine((data) => data.password === data.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"],
});

const passwordChangeSchema = z.object({
  current_password: z.string().min(1, 'Current password is required'),
  new_password: z.string().min(8, 'New password must be at least 8 characters'),
  confirm_password: z.string(),
}).refine((data) => data.new_password === data.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"],
});

/**
 * Generate JWT tokens
 */
const generateTokens = (user: any, role: 'admin' | 'worker' = 'admin', workerId?: string) => {
  const payload = {
    user_id: user.user_id,
    email: user.email_address || user.email,
    business_name: user.business_name,
    owner_name: user.owner_name || user.full_name,
    role,
    ...(workerId && { worker_id: workerId }),
  };

  const token = jwt.sign(payload, jwtConfig.secret, {
    expiresIn: jwtConfig.expiresIn,
  } as jwt.SignOptions);

  const refreshToken = jwt.sign(payload, jwtConfig.refreshSecret, {
    expiresIn: jwtConfig.refreshExpiresIn,
  } as jwt.SignOptions);

  return { token, refreshToken };
};

/**
 * Hash password using bcrypt
 */
const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
};

/**
 * Compare password with hash
 */
const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

/**
 * Register new user (business owner) - Re-enabled with enhanced validation
 */
export const register = asyncHandler(async (
  req: AuthenticatedRequest,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  // Validate request body
  const validatedData = registerSchema.parse(req.body);

  // Check if user already exists with detailed error message
  const existingUser = await query(
    'SELECT user_id, email_address, business_name FROM users WHERE email_address = $1',
    [validatedData.email_address]
  );

  if (existingUser.rows.length > 0) {
    const existingUserData = existingUser.rows[0];
    throw createError.conflict(
      `This email address is already registered to ${existingUserData.business_name}. Please use a different email or try logging in instead.`,
      {
        field: 'email_address',
        value: validatedData.email_address,
        existing_business: existingUserData.business_name
      }
    );
  }

  // Check if business name already exists (optional validation)
  const existingBusiness = await query(
    'SELECT user_id, business_name, email_address FROM users WHERE LOWER(business_name) = LOWER($1)',
    [validatedData.business_name]
  );

  if (existingBusiness.rows.length > 0) {
    const existingBusinessData = existingBusiness.rows[0];
    throw createError.conflict(
      `A business with the name "${validatedData.business_name}" is already registered. Please choose a different business name.`,
      {
        field: 'business_name',
        value: validatedData.business_name,
        existing_email: existingBusinessData.email_address
      }
    );
  }

  // Hash password
  const hashedPassword = await hashPassword(validatedData.password);

  // Create new user
  const result = await query(
    `INSERT INTO users (business_name, owner_name, email_address, phone_number, password)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING user_id, business_name, owner_name, email_address, phone_number, created_at`,
    [
      validatedData.business_name,
      validatedData.owner_name,
      validatedData.email_address,
      validatedData.phone_number,
      hashedPassword,
    ]
  );

  const newUser = result.rows[0];

  // Generate tokens
  const { token, refreshToken } = generateTokens(newUser);

  // Prepare response
  const { password: _, ...userWithoutPassword } = newUser;
  const authResponse: AuthResponse = {
    user: {
      ...userWithoutPassword,
      last_login: undefined,
    },
    token,
    refresh_token: refreshToken,
    expires_in: jwtConfig.expiresIn,
  };

  res.status(201).json({
    success: true,
    message: 'Account created successfully! Welcome to Fish Management System.',
    data: authResponse,
    timestamp: new Date(),
  });
});

/**
 * Get all existing users (for admin reference)
 */
export const getExistingUsers = asyncHandler(async (
  _req: AuthenticatedRequest,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  try {
    // Get all users from database (excluding passwords)
    const result = await query(
      'SELECT user_id, business_name, owner_name, email_address, phone_number, created_at, last_login FROM users ORDER BY created_at DESC'
    );

    res.json({
      success: true,
      message: 'Existing users retrieved successfully',
      data: {
        users: result.rows,
        total: result.rows.length,
      },
      timestamp: new Date(),
    });
  } catch (error) {
    throw createError.internal('Failed to retrieve existing users');
  }
});

/**
 * Login user with enhanced validation and error messages
 */
export const login = asyncHandler(async (
  req: AuthenticatedRequest,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  // Validate request body
  const validatedData = loginSchema.parse(req.body);

  // Find user by email with detailed error handling
  const userResult = await query(
    'SELECT * FROM users WHERE email_address = $1',
    [validatedData.email]
  );

  if (userResult.rows.length === 0) {
    throw createError.unauthorized(
      'No account found with this email address. Please check your email or create a new account.',
      {
        field: 'email',
        value: validatedData.email,
        suggestion: 'Check your email spelling or register a new account'
      }
    );
  }

  const user = userResult.rows[0];

  // Enhanced password verification with better error messages
  if (user.password && user.password.length > 0) {
    // User has a hashed password - verify it
    const isPasswordValid = await comparePassword(validatedData.password, user.password);
    if (!isPasswordValid) {
      throw createError.unauthorized(
        'Incorrect password. Please check your password and try again.',
        {
          field: 'password',
          suggestion: 'Make sure Caps Lock is off and try again'
        }
      );
    }
  } else {
    // User doesn't have a hashed password - this is an existing user
    console.log('🔓 Logging in existing user without password verification');

    // Hash and store the password for future use
    const hashedPassword = await hashPassword(validatedData.password);
    await query(
      'UPDATE users SET password = $1 WHERE user_id = $2',
      [hashedPassword, user.user_id]
    );
    console.log('🔐 Password hashed and stored for future logins');
  }

  // Update last login
  await query(
    'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE user_id = $1',
    [user.user_id]
  );

  // Generate tokens
  const { token, refreshToken } = generateTokens(user);

  // Prepare response (exclude password)
  const { password, ...userWithoutPassword } = user;
  const authResponse: AuthResponse = {
    user: userWithoutPassword,
    token,
    refresh_token: refreshToken,
    expires_in: jwtConfig.expiresIn,
  };

  res.json({
    success: true,
    message: `Welcome back, ${user.owner_name}! You have successfully logged in to ${user.business_name}.`,
    data: authResponse,
    timestamp: new Date(),
  });
});

/**
 * Worker login
 */
export const workerLogin = asyncHandler(async (
  req: AuthenticatedRequest,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  // Validate request body
  const validatedData = loginSchema.parse(req.body);

  // Find worker by email
  const workerResult = await query(
    'SELECT * FROM workers WHERE email = $1',
    [validatedData.email]
  );

  if (workerResult.rows.length === 0) {
    throw createError.unauthorized('Invalid email or password');
  }

  const worker = workerResult.rows[0];

  // For workers, we need to get the business owner's information
  // This assumes workers are associated with a business owner
  // You might need to adjust this based on your business logic
  const userResult = await query(
    'SELECT * FROM users LIMIT 1' // Simplified - you might want to link workers to specific users
  );

  if (userResult.rows.length === 0) {
    throw createError.unauthorized('Business owner not found');
  }

  const user = userResult.rows[0];

  // For demo purposes, we'll use a simple password check
  // In production, workers should have their own password field
  const isPasswordValid = await comparePassword(validatedData.password, user.password);
  if (!isPasswordValid) {
    throw createError.unauthorized('Invalid email or password');
  }

  // Update worker login history
  const loginHistory = worker.recent_login_history || {};
  loginHistory[new Date().toISOString()] = {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  };

  await query(
    'UPDATE workers SET recent_login_history = $1 WHERE worker_id = $2',
    [JSON.stringify(loginHistory), worker.worker_id]
  );

  // Generate tokens for worker
  const { token, refreshToken } = generateTokens(user, 'worker', worker.worker_id);

  // Get worker permissions
  const permissionsResult = await query(
    'SELECT permission_name FROM worker_permissions WHERE worker_id = $1 AND is_granted = true',
    [worker.worker_id]
  );

  const permissions = permissionsResult.rows.map((row: any) => row.permission_name);

  // Prepare response
  const authResponse = {
    user: {
      user_id: user.user_id,
      business_name: user.business_name,
      owner_name: user.owner_name,
      email_address: user.email_address,
      phone_number: user.phone_number,
      created_at: user.created_at,
      last_login: user.last_login,
    },
    worker: {
      worker_id: worker.worker_id,
      full_name: worker.full_name,
      email: worker.email,
      permissions,
    },
    token,
    refresh_token: refreshToken,
    expires_in: jwtConfig.expiresIn,
  };

  res.json({
    success: true,
    message: 'Worker login successful',
    data: authResponse,
    timestamp: new Date(),
  });
});

/**
 * Refresh access token
 */
export const refreshToken = asyncHandler(async (
  req: AuthenticatedRequest,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  const { refresh_token } = req.body;

  if (!refresh_token) {
    throw createError.badRequest('Refresh token is required');
  }

  try {
    // Verify refresh token
    const payload = jwt.verify(refresh_token, jwtConfig.refreshSecret) as any;

    // Get updated user information
    const userResult = await query(
      'SELECT * FROM users WHERE user_id = $1',
      [payload.user_id]
    );

    if (userResult.rows.length === 0) {
      throw createError.unauthorized('User not found');
    }

    const user = userResult.rows[0];

    // Generate new tokens
    const { token, refreshToken: newRefreshToken } = generateTokens(
      user,
      payload.role,
      payload.worker_id
    );

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        token,
        refresh_token: newRefreshToken,
        expires_in: jwtConfig.expiresIn,
      },
      timestamp: new Date(),
    });
  } catch (error) {
    throw createError.unauthorized('Invalid refresh token');
  }
});

/**
 * Logout user
 */
export const logout = asyncHandler(async (
  _req: AuthenticatedRequest,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  // In a production environment, you might want to:
  // 1. Add the token to a blacklist
  // 2. Store tokens in Redis and remove them on logout
  // 3. Use shorter token expiration times

  res.json({
    success: true,
    message: 'Logout successful',
    timestamp: new Date(),
  });
});

/**
 * Get current user profile
 */
export const getProfile = asyncHandler(async (
  req: AuthenticatedRequest,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  if (!req.user) {
    throw createError.unauthorized('Authentication required');
  }

  // Get updated user information
  const userResult = await query(
    'SELECT user_id, business_name, owner_name, email_address, phone_number, created_at, last_login FROM users WHERE user_id = $1',
    [req.user.user_id]
  );

  if (userResult.rows.length === 0) {
    throw createError.notFound('User not found');
  }

  const user = userResult.rows[0];
  let responseData: any = { user };

  // If this is a worker, include worker information
  if (req.worker) {
    const workerResult = await query(
      'SELECT worker_id, full_name, email, phone_number, monthly_salary, total_revenue_generated, created_at FROM workers WHERE worker_id = $1',
      [req.worker.worker_id]
    );

    if (workerResult.rows.length > 0) {
      responseData.worker = {
        ...workerResult.rows[0],
        permissions: req.worker.permissions,
      };
    }
  }

  res.json({
    success: true,
    message: 'Profile retrieved successfully',
    data: responseData,
    timestamp: new Date(),
  });
});

/**
 * Update user profile validation schema
 */
const updateProfileSchema = z.object({
  business_name: z.string().min(1, 'Business name is required').max(200, 'Business name too long').optional(),
  owner_name: z.string().min(1, 'Owner name is required').max(200, 'Owner name too long').optional(),
  email_address: z.string().email('Invalid email format').optional(),
  phone_number: z.string().max(20, 'Phone number too long').optional().nullable(),
});

/**
 * Update current user profile
 */
export const updateProfile = asyncHandler(async (
  req: AuthenticatedRequest,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  if (!req.user) {
    throw createError.unauthorized('Authentication required');
  }

  // Validate request body
  const validatedData = updateProfileSchema.parse(req.body);

  // Check if email is being changed and if it's already taken
  if (validatedData.email_address && validatedData.email_address !== req.user.email_address) {
    const emailCheck = await query(
      'SELECT user_id FROM users WHERE email_address = $1 AND user_id != $2',
      [validatedData.email_address, req.user.user_id]
    );

    if (emailCheck.rows.length > 0) {
      throw createError.conflict('Email address is already in use');
    }
  }

  // Build dynamic update query
  const updateFields: string[] = [];
  const updateValues: any[] = [];
  let paramCount = 1;

  Object.entries(validatedData).forEach(([key, value]) => {
    if (value !== undefined) {
      updateFields.push(`${key} = $${paramCount}`);
      updateValues.push(value);
      paramCount++;
    }
  });

  if (updateFields.length === 0) {
    throw createError.badRequest('No fields to update');
  }

  // Add user_id to the end
  updateValues.push(req.user.user_id);

  // Execute update query
  const updateQuery = `
    UPDATE users
    SET ${updateFields.join(', ')}
    WHERE user_id = $${paramCount}
    RETURNING user_id, business_name, owner_name, email_address, phone_number, created_at, last_login
  `;

  const result = await query(updateQuery, updateValues);

  if (result.rows.length === 0) {
    throw createError.notFound('User not found');
  }

  const updatedUser = result.rows[0];

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: { user: updatedUser },
    timestamp: new Date(),
  });
});

/**
 * Change password
 */
export const changePassword = asyncHandler(async (
  req: AuthenticatedRequest,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  if (!req.user) {
    throw createError.unauthorized('Authentication required');
  }

  // Validate request body
  const validatedData = passwordChangeSchema.parse(req.body);

  // Get current user with password
  const userResult = await query(
    'SELECT password FROM users WHERE user_id = $1',
    [req.user.user_id]
  );

  if (userResult.rows.length === 0) {
    throw createError.notFound('User not found');
  }

  const user = userResult.rows[0];

  // Verify current password
  const isCurrentPasswordValid = await comparePassword(
    validatedData.current_password,
    user.password
  );

  if (!isCurrentPasswordValid) {
    throw createError.badRequest('Current password is incorrect');
  }

  // Hash new password
  const hashedNewPassword = await hashPassword(validatedData.new_password);

  // Update password
  await query(
    'UPDATE users SET password = $1 WHERE user_id = $2',
    [hashedNewPassword, req.user.user_id]
  );

  res.json({
    success: true,
    message: 'Password changed successfully',
    timestamp: new Date(),
  });
});

/**
 * Request password reset (placeholder)
 */
export const requestPasswordReset = asyncHandler(async (
  req: AuthenticatedRequest,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  const { email } = req.body;

  if (!email) {
    throw createError.badRequest('Email is required');
  }

  // Check if user exists (for logging purposes, but don't reveal if user exists)
  await query(
    'SELECT user_id FROM users WHERE email_address = $1',
    [email]
  );

  // Always return success for security reasons (don't reveal if email exists)
  res.json({
    success: true,
    message: 'If an account with this email exists, a password reset link has been sent',
    timestamp: new Date(),
  });

  // In a real implementation, you would:
  // 1. Generate a secure reset token
  // 2. Store it in the database with expiration
  // 3. Send an email with the reset link
});