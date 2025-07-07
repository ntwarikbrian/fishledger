import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables
dotenv.config();

/**
 * Environment validation schema using Zod
 * Ensures all required environment variables are present and valid
 */
const envSchema = z.object({
  // Server Configuration
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('5000'),

  // Database Mode Configuration
  DATABASE_MODE: z.enum(['local', 'supabase']).default('local'),

  // Local Database Configuration
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.string().transform(Number).default('5432'),
  DB_NAME: z.string().default('fish_management'),
  DB_USER: z.string().default('postgres'),
  DB_PASSWORD: z.string().optional(),

  // Supabase Configuration
  SUPABASE_URL: z.string().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  SUPABASE_DB_HOST: z.string().optional(),
  SUPABASE_DB_PORT: z.string().transform(Number).optional(),
  SUPABASE_DB_NAME: z.string().optional(),
  SUPABASE_DB_USER: z.string().optional(),
  SUPABASE_DB_PASSWORD: z.string().optional(),
  
  // JWT Configuration
  JWT_SECRET: z.string().min(10, 'JWT secret must be at least 10 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  JWT_REFRESH_SECRET: z.string().min(10, 'JWT refresh secret must be at least 10 characters'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),
  
  // CORS Configuration
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  
  // File Upload Configuration
  MAX_FILE_SIZE: z.string().transform(Number).default('10485760'), // 10MB
  UPLOAD_PATH: z.string().default('./uploads'),
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('900000'), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('1000'), // Increased for development
  
  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  
  // Email Configuration (Required for messaging)
  EMAIL_HOST: z.string().optional(),
  EMAIL_PORT: z.string().transform(Number).optional(),
  EMAIL_USER: z.string().optional(),
  EMAIL_PASSWORD: z.string().optional(),
  EMAIL_FROM: z.string().optional(),

  // Cloudinary Configuration
  CLOUDINARY_CLOUD_NAME: z.string().default('dji23iymw'),
  CLOUDINARY_API_KEY: z.string().default('162843632338622'),
  CLOUDINARY_API_SECRET: z.string().default('pB_7QOUVorneWKAer1aErW-yNe0'),
});

/**
 * Parse and validate environment variables
 * Throws an error if validation fails
 */
const parseEnv = (): z.infer<typeof envSchema> => {
  try {
    return envSchema.parse({
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
      DATABASE_MODE: process.env.DATABASE_MODE,
      DB_HOST: process.env.DB_HOST,
      DB_PORT: process.env.DB_PORT,
      DB_NAME: process.env.DB_NAME,
      DB_USER: process.env.DB_USER,
      DB_PASSWORD: process.env.DB_PASSWORD,
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      SUPABASE_DB_HOST: process.env.SUPABASE_DB_HOST,
      SUPABASE_DB_PORT: process.env.SUPABASE_DB_PORT,
      SUPABASE_DB_NAME: process.env.SUPABASE_DB_NAME,
      SUPABASE_DB_USER: process.env.SUPABASE_DB_USER,
      SUPABASE_DB_PASSWORD: process.env.SUPABASE_DB_PASSWORD,
      JWT_SECRET: process.env.JWT_SECRET,
      JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
      JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
      JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN,
      CORS_ORIGIN: process.env.CORS_ORIGIN,
      MAX_FILE_SIZE: process.env.MAX_FILE_SIZE,
      UPLOAD_PATH: process.env.UPLOAD_PATH,
      RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS,
      RATE_LIMIT_MAX_REQUESTS: process.env.RATE_LIMIT_MAX_REQUESTS,
      LOG_LEVEL: process.env.LOG_LEVEL,
      EMAIL_HOST: process.env.EMAIL_HOST,
      EMAIL_PORT: process.env.EMAIL_PORT,
      EMAIL_USER: process.env.EMAIL_USER,
      EMAIL_PASSWORD: process.env.EMAIL_PASSWORD,
      EMAIL_FROM: process.env.EMAIL_FROM,
      CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
      CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
      CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
    });
  } catch (error) {
    console.error('❌ Environment validation failed:', error);
    process.exit(1);
  }
};

/**
 * Validated environment configuration
 * Export the parsed and validated environment variables
 */
export const env = parseEnv();

/**
 * Database configuration object
 * Dynamically selects between local PostgreSQL and Supabase based on DATABASE_MODE
 */
export const dbConfig = env.DATABASE_MODE === 'supabase' ? {
  host: env.SUPABASE_DB_HOST || 'db.hebdlpduohlfhdgvugla.supabase.co',
  port: env.SUPABASE_DB_PORT || 5432,
  database: env.SUPABASE_DB_NAME || 'postgres',
  user: env.SUPABASE_DB_USER || 'postgres',
  password: env.SUPABASE_DB_PASSWORD || '',
} : {
  host: env.DB_HOST,
  port: env.DB_PORT,
  database: env.DB_NAME,
  user: env.DB_USER,
  password: env.DB_PASSWORD || '',
};

/**
 * Supabase configuration object
 * Contains Supabase-specific settings for client-side usage
 */
export const supabaseConfig = {
  url: env.SUPABASE_URL || '',
  anonKey: env.SUPABASE_ANON_KEY || '',
  serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY || '',
};

/**
 * JWT configuration object
 * Extracted JWT-specific configuration
 */
export const jwtConfig = {
  secret: env.JWT_SECRET,
  expiresIn: env.JWT_EXPIRES_IN,
  refreshSecret: env.JWT_REFRESH_SECRET,
  refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
};

/**
 * Server configuration object
 * Extracted server-specific configuration
 */
export const serverConfig = {
  port: env.PORT,
  nodeEnv: env.NODE_ENV,
  corsOrigin: env.CORS_ORIGIN,
  logLevel: env.LOG_LEVEL,
};

/**
 * File upload configuration object
 * Extracted file upload-specific configuration
 */
export const uploadConfig = {
  maxFileSize: env.MAX_FILE_SIZE,
  uploadPath: env.UPLOAD_PATH,
};

/**
 * Rate limiting configuration object
 * Extracted rate limiting-specific configuration
 */
export const rateLimitConfig = {
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
};

/**
 * Email configuration object
 * Extracted email-specific configuration
 */
export const emailConfig = {
  host: env.EMAIL_HOST,
  port: env.EMAIL_PORT,
  user: env.EMAIL_USER,
  password: env.EMAIL_PASSWORD,
  from: env.EMAIL_FROM,
};

/**
 * Cloudinary configuration object
 * Extracted Cloudinary-specific configuration for image/file uploads
 */
export const cloudinaryConfig = {
  cloudName: env.CLOUDINARY_CLOUD_NAME,
  apiKey: env.CLOUDINARY_API_KEY,
  apiSecret: env.CLOUDINARY_API_SECRET,
};

export default env;
