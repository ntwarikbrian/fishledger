/**
 * Environment configuration for Cloudflare Workers
 * Handles all environment variables and provides type-safe access
 */

import { z } from 'zod';

// Environment variables schema for validation
const envSchema = z.object({
  // Environment
  ENVIRONMENT: z.enum(['development', 'staging', 'production']).default('development'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),

  // Supabase Configuration
  SUPABASE_URL: z.string().url('Invalid Supabase URL'),
  SUPABASE_ANON_KEY: z.string().min(1, 'Supabase anon key is required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'Supabase service role key is required'),

  // JWT Configuration
  JWT_SECRET: z.string().min(32, 'JWT secret must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT refresh secret must be at least 32 characters'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),

  // CORS Configuration
  CORS_ORIGIN: z.string().default('*'),

  // File Upload Configuration
  MAX_FILE_SIZE: z.union([z.string(), z.number()]).transform(val => typeof val === 'string' ? Number(val) : val).default(10485760), // 10MB
  UPLOAD_PATH: z.string().default('./uploads'),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.union([z.string(), z.number()]).transform(val => typeof val === 'string' ? Number(val) : val).default(900000), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.union([z.string(), z.number()]).transform(val => typeof val === 'string' ? Number(val) : val).default(100),

  // Email Configuration (optional for basic functionality)
  EMAIL_HOST: z.string().default('smtp.gmail.com'),
  EMAIL_PORT: z.union([z.string(), z.number()]).transform(val => typeof val === 'string' ? Number(val) : val).default(587),
  EMAIL_USER: z.string().email('Invalid email user').optional(),
  EMAIL_PASSWORD: z.string().min(1, 'Email password is required').optional(),
  EMAIL_FROM: z.string().email('Invalid from email').optional(),

  // Cloudinary Configuration (optional for basic functionality)
  CLOUDINARY_CLOUD_NAME: z.string().min(1, 'Cloudinary cloud name is required').optional(),
  CLOUDINARY_API_KEY: z.string().min(1, 'Cloudinary API key is required').optional(),
  CLOUDINARY_API_SECRET: z.string().min(1, 'Cloudinary API secret is required').optional(),

  // Google OAuth Configuration (required for admin authentication)
  GOOGLE_CLIENT_ID: z.string().min(1, 'Google Client ID is required'),
  GOOGLE_CLIENT_SECRET: z.string().min(1, 'Google Client Secret is required'),
  GOOGLE_REDIRECT_URI: z.string().url('Invalid Google Redirect URI'),
});

// Type for validated environment variables
export type Environment = z.infer<typeof envSchema>;

/**
 * Validates and returns environment variables
 * @param env - Raw environment object from Cloudflare Workers
 * @returns Validated environment configuration
 * @throws Error if validation fails
 */
export function validateEnvironment(env: Record<string, unknown>): Environment {
  try {
    return envSchema.parse(env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(
        (err) => `${err.path.join('.')}: ${err.message}`,
      );
      throw new Error(`Environment validation failed:\n${errorMessages.join('\n')}`);
    }
    throw error;
  }
}

/**
 * Gets CORS origins as an array
 * @param corsOrigin - Comma-separated string of origins
 * @returns Array of origin URLs
 */
export function getCorsOrigins(corsOrigin: string): string[] {
  if (corsOrigin === '*') {
    return ['*'];
  }
  return corsOrigin.split(',').map(origin => origin.trim());
}

/**
 * Checks if the current environment is development
 * @param env - Environment configuration
 * @returns True if development environment
 */
export function isDevelopment(env: Environment): boolean {
  return env.ENVIRONMENT === 'development';
}

/**
 * Checks if the current environment is production
 * @param env - Environment configuration
 * @returns True if production environment
 */
export function isProduction(env: Environment): boolean {
  return env.ENVIRONMENT === 'production';
}

/**
 * Gets the appropriate log level for console output
 * @param env - Environment configuration
 * @returns Log level configuration
 */
export function getLogConfig(env: Environment): {
  level: string;
  enableDebug: boolean;
  enableInfo: boolean;
  enableWarn: boolean;
  enableError: boolean;
} {
  const level = env.LOG_LEVEL;
  return {
    level,
    enableDebug: level === 'debug',
    enableInfo: ['debug', 'info'].includes(level),
    enableWarn: ['debug', 'info', 'warn'].includes(level),
    enableError: true, // Always enable error logging
  };
}

/**
 * Validates Supabase-specific environment variables
 * @param env - Environment configuration
 * @returns Validation result with details
 */
export function validateSupabaseConfig(env: Environment): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required Supabase fields
  if (!env.SUPABASE_URL) {
    errors.push('SUPABASE_URL is required');
  } else if (!env.SUPABASE_URL.startsWith('https://')) {
    warnings.push('SUPABASE_URL should use HTTPS');
  }

  if (!env.SUPABASE_ANON_KEY) {
    errors.push('SUPABASE_ANON_KEY is required');
  }

  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    warnings.push('SUPABASE_SERVICE_ROLE_KEY is recommended for full functionality');
  }

  // Check JWT configuration
  if (!env.JWT_SECRET || env.JWT_SECRET.length < 32) {
    errors.push('JWT_SECRET must be at least 32 characters long');
  }

  if (!env.JWT_REFRESH_SECRET || env.JWT_REFRESH_SECRET.length < 32) {
    errors.push('JWT_REFRESH_SECRET must be at least 32 characters long');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Default environment configuration for development
 * Used as fallback when environment variables are not available
 */
export const defaultEnvironment: Partial<Environment> = {
  ENVIRONMENT: 'development',
  LOG_LEVEL: 'debug',
  JWT_EXPIRES_IN: '7d',
  JWT_REFRESH_EXPIRES_IN: '30d',
  CORS_ORIGIN: 'http://localhost:8080,http://localhost:5173,http://localhost:3000',
  MAX_FILE_SIZE: 10485760,
  UPLOAD_PATH: './uploads',
  RATE_LIMIT_WINDOW_MS: 900000,
  RATE_LIMIT_MAX_REQUESTS: 100,
  EMAIL_HOST: 'smtp.gmail.com',
  EMAIL_PORT: 587,
};
