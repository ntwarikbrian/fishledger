/**
 * Authentication utilities for JWT token management and password hashing
 * Provides secure authentication and authorization functionality
 */

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import type {
  JWTPayload,
  WorkerJWTPayload,
  RefreshTokenPayload,
  WorkerRefreshTokenPayload,
  AuthenticatedUser,
  AuthenticatedWorker,
  Environment,
} from '../types/index';

/**
 * Hashes a password using bcrypt
 * @param password - Plain text password
 * @param saltRounds - Number of salt rounds (default: 12)
 * @returns Promise resolving to hashed password
 */
export async function hashPassword(password: string, saltRounds = 12): Promise<string> {
  try {
    return await bcrypt.hash(password, saltRounds);
  } catch (error) {
    throw new Error(`Failed to hash password: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Verifies a password against its hash with enhanced security
 * @param password - Plain text password
 * @param hash - Hashed password
 * @returns Promise resolving to boolean indicating if password is valid
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    // Enhanced security: Input validation
    if (!password || !hash) {
      console.warn('🚨 Password verification called with empty password or hash');
      return false;
    }

    // Enhanced security: Validate hash format (bcrypt hashes start with $2a$, $2b$, or $2y$)
    if (!hash.match(/^\$2[aby]\$\d{2}\$.{53}$/)) {
      console.warn('🚨 Invalid hash format detected in password verification');
      return false;
    }

    // Enhanced security: Limit password length to prevent DoS attacks
    if (password.length > 1000) {
      console.warn('🚨 Excessively long password detected in verification');
      return false;
    }

    // Perform the actual password verification
    const isValid = await bcrypt.compare(password, hash);

    // Enhanced security: Log verification attempts (without sensitive data)
    if (!isValid) {
      console.warn('🚨 Password verification failed - invalid password provided');
    }

    return isValid;
  } catch (error) {
    console.error('🚨 Password verification error:', error);
    throw new Error(`Failed to verify password: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generates a JWT access token
 * @param user - Authenticated user data
 * @param env - Environment configuration
 * @returns Signed JWT token
 */
export function generateAccessToken(user: AuthenticatedUser, env: Environment): string {
  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + parseExpirationTime(env.JWT_EXPIRES_IN),
  };

  try {
    // Don't use expiresIn option since we manually set exp in payload
    return jwt.sign(payload, env.JWT_SECRET, {
      algorithm: 'HS256',
    });
  } catch (error) {
    throw new Error(`Failed to generate access token: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generates a JWT refresh token
 * @param userId - User ID
 * @param tokenVersion - Token version for invalidation
 * @param env - Environment configuration
 * @returns Signed refresh token
 */
export function generateRefreshToken(
  userId: string,
  tokenVersion: number,
  env: Environment,
): string {
  const payload: RefreshTokenPayload = {
    userId,
    tokenVersion,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + parseExpirationTime(env.JWT_REFRESH_EXPIRES_IN),
  };

  try {
    // Don't use expiresIn option since we manually set exp in payload
    return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
      algorithm: 'HS256',
    });
  } catch (error) {
    throw new Error(`Failed to generate refresh token: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Verifies and decodes a JWT access token
 * @param token - JWT token to verify
 * @param env - Environment configuration
 * @returns Decoded JWT payload
 * @throws Error if token is invalid or expired
 */
export function verifyAccessToken(token: string, env: Environment): JWTPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET, {
      algorithms: ['HS256'],
    }) as JWTPayload;

    // Additional validation
    if (!decoded.userId || !decoded.email || !decoded.role) {
      throw new Error('Invalid token payload');
    }

    return decoded;
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    }
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token expired');
    }
    throw new Error(`Token verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Verifies and decodes a JWT refresh token
 * @param token - Refresh token to verify
 * @param env - Environment configuration
 * @returns Decoded refresh token payload
 * @throws Error if token is invalid or expired
 */
export function verifyRefreshToken(token: string, env: Environment): RefreshTokenPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET, {
      algorithms: ['HS256'],
    }) as RefreshTokenPayload;

    // Additional validation
    if (!decoded.userId || typeof decoded.tokenVersion !== 'number') {
      throw new Error('Invalid refresh token payload');
    }

    return decoded;
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid refresh token');
    }
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Refresh token expired');
    }
    throw new Error(`Refresh token verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extracts bearer token from Authorization header
 * @param authHeader - Authorization header value
 * @returns Token string or null if not found
 */
export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1] || null;
}

/**
 * Validates password strength
 * @param password - Password to validate
 * @returns Object with validation result and error messages
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Basic length validation
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (password.length > 128) {
    errors.push('Password must be less than 128 characters long');
  }

  // Require at least one letter (either case)
  if (!/[a-zA-Z]/.test(password)) {
    errors.push('Password must contain at least one letter');
  }

  // Require at least one number
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  // Enhanced security: Require uppercase letter for stronger passwords
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  // Enhanced security: Require special character for stronger passwords
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  // Enhanced security: Check for common weak patterns
  const commonPatterns = [
    /123456/,
    /password/i,
    /admin/i,
    /qwerty/i,
    /abc123/i,
    /(.)\1{2,}/, // Repeated characters (aaa, 111, etc.)
  ];

  for (const pattern of commonPatterns) {
    if (pattern.test(password)) {
      errors.push('Password contains common weak patterns');
      break;
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Generates a secure random token for password reset, etc.
 * @param length - Token length (default: 32)
 * @returns Random token string
 */
export function generateSecureToken(length = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}

/**
 * Parses expiration time string to seconds
 * @param expirationTime - Time string (e.g., '7d', '24h', '60m', '3600s')
 * @returns Expiration time in seconds
 */
function parseExpirationTime(expirationTime: string): number {
  const match = expirationTime.match(/^(\d+)([dhms])$/);
  
  if (!match) {
    throw new Error(`Invalid expiration time format: ${expirationTime}`);
  }

  const value = parseInt(match[1]!, 10);
  const unit = match[2];

  switch (unit) {
    case 'd':
      return value * 24 * 60 * 60; // days to seconds
    case 'h':
      return value * 60 * 60; // hours to seconds
    case 'm':
      return value * 60; // minutes to seconds
    case 's':
      return value; // seconds
    default:
      throw new Error(`Invalid time unit: ${unit}`);
  }
}

/**
 * Checks if a token is close to expiration
 * @param exp - Token expiration timestamp
 * @param thresholdMinutes - Minutes before expiration to consider "close" (default: 5)
 * @returns True if token expires within threshold
 */
export function isTokenCloseToExpiration(exp: number, thresholdMinutes = 5): boolean {
  const now = Math.floor(Date.now() / 1000);
  const threshold = thresholdMinutes * 60;
  return (exp - now) <= threshold;
}

// ============================================================================
// WORKER AUTHENTICATION UTILITIES
// ============================================================================

/**
 * Generates a JWT access token for a worker
 * @param worker - Authenticated worker data
 * @param env - Environment configuration
 * @returns Signed JWT token
 */
export function generateWorkerAccessToken(worker: AuthenticatedWorker, env: Environment): string {
  const payload: WorkerJWTPayload = {
    workerId: worker.id,
    email: worker.email,
    fullName: worker.fullName,
    role: worker.role,
    businessId: worker.businessId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + parseExpirationTime(env.JWT_EXPIRES_IN),
  };

  try {
    return jwt.sign(payload, env.JWT_SECRET, {
      algorithm: 'HS256',
    });
  } catch (error) {
    throw new Error(`Failed to generate worker access token: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generates a refresh token for a worker
 * @param worker - Authenticated worker data
 * @param env - Environment configuration
 * @param tokenVersion - Token version for invalidation (default: 1)
 * @returns Signed refresh token
 */
export function generateWorkerRefreshToken(
  worker: AuthenticatedWorker,
  env: Environment,
  tokenVersion = 1
): string {
  const payload: WorkerRefreshTokenPayload = {
    workerId: worker.id,
    businessId: worker.businessId,
    tokenVersion,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + parseExpirationTime(env.JWT_REFRESH_EXPIRES_IN || '7d'),
  };

  try {
    return jwt.sign(payload, env.JWT_REFRESH_SECRET || env.JWT_SECRET, {
      algorithm: 'HS256',
    });
  } catch (error) {
    throw new Error(`Failed to generate worker refresh token: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Verifies and decodes a worker JWT access token
 * @param token - JWT token to verify
 * @param env - Environment configuration
 * @returns Decoded worker JWT payload
 * @throws Error if token is invalid or expired
 */
export function verifyWorkerAccessToken(token: string, env: Environment): WorkerJWTPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET, {
      algorithms: ['HS256'],
    }) as WorkerJWTPayload;

    // Additional validation for worker tokens
    if (!decoded.workerId || !decoded.email || !decoded.role || !decoded.businessId) {
      throw new Error('Invalid worker token payload');
    }

    return decoded;
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid worker token');
    }
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Worker token expired');
    }
    throw new Error(`Worker token verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Verifies and decodes a worker refresh token
 * @param token - Refresh token to verify
 * @param env - Environment configuration
 * @returns Decoded worker refresh token payload
 * @throws Error if token is invalid or expired
 */
export function verifyWorkerRefreshToken(token: string, env: Environment): WorkerRefreshTokenPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET || env.JWT_SECRET, {
      algorithms: ['HS256'],
    }) as WorkerRefreshTokenPayload;

    // Additional validation for worker refresh tokens
    if (!decoded.workerId || !decoded.businessId || typeof decoded.tokenVersion !== 'number') {
      throw new Error('Invalid worker refresh token payload');
    }

    return decoded;
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid worker refresh token');
    }
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Worker refresh token expired');
    }
    throw new Error(`Worker refresh token verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
