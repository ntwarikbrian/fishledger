/**
 * Centralized error handling middleware for Hono framework
 * Provides consistent error responses and logging across the application
 */

import type { Context, Next } from 'hono';
import type { HonoContext } from '../types/index';

// Error types for better categorization
export enum ErrorType {
  VALIDATION = 'VALIDATION_ERROR',
  AUTHENTICATION = 'AUTHENTICATION_ERROR',
  AUTHORIZATION = 'AUTHORIZATION_ERROR',
  NOT_FOUND = 'NOT_FOUND_ERROR',
  CONFLICT = 'CONFLICT_ERROR',
  DATABASE = 'DATABASE_ERROR',
  EXTERNAL_API = 'EXTERNAL_API_ERROR',
  RATE_LIMIT = 'RATE_LIMIT_ERROR',
  FILE_UPLOAD = 'FILE_UPLOAD_ERROR',
  BUSINESS_LOGIC = 'BUSINESS_LOGIC_ERROR',
  INTERNAL = 'INTERNAL_ERROR',
}

// Custom error class with additional context
export class AppError extends Error {
  public readonly type: ErrorType;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: any;
  public readonly timestamp: string;

  constructor(
    message: string,
    type: ErrorType = ErrorType.INTERNAL,
    statusCode: number = 500,
    isOperational: boolean = true,
    details?: any,
  ) {
    super(message);
    this.type = type;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.details = details;
    this.timestamp = new Date().toISOString();

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);
  }
}

// Specific error classes for common scenarios
export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, ErrorType.VALIDATION, 400, true, details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required', details?: any) {
    super(message, ErrorType.AUTHENTICATION, 401, true, details);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions', details?: any) {
    super(message, ErrorType.AUTHORIZATION, 403, true, details);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource', details?: any) {
    super(`${resource} not found`, ErrorType.NOT_FOUND, 404, true, details);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: any) {
    super(message, ErrorType.CONFLICT, 409, true, details);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, details?: any) {
    super(message, ErrorType.DATABASE, 500, true, details);
  }
}

export class BusinessLogicError extends AppError {
  constructor(message: string, statusCode: number = 400, details?: any) {
    super(message, ErrorType.BUSINESS_LOGIC, statusCode, true, details);
  }
}

// Error response interface
interface ErrorResponse {
  success: false;
  error: string;
  type: ErrorType;
  statusCode: number;
  timestamp: string;
  requestId: string;
  details?: any;
  stack?: string;
}

/**
 * Maps database error codes to user-friendly messages
 */
const mapDatabaseError = (error: any): AppError => {
  const message = error.message || 'Database operation failed';
  
  // PostgreSQL error codes
  if (error.code) {
    switch (error.code) {
      case '23505': // unique_violation
        return new ConflictError('A record with this information already exists', {
          constraint: error.constraint,
          detail: error.detail,
        });
      case '23503': // foreign_key_violation
        return new BusinessLogicError('Cannot perform this operation due to related records', 400, {
          constraint: error.constraint,
          detail: error.detail,
        });
      case '23502': // not_null_violation
        return new ValidationError('Required field is missing', {
          column: error.column,
          table: error.table,
        });
      case '23514': // check_violation
        return new ValidationError('Data validation failed', {
          constraint: error.constraint,
          detail: error.detail,
        });
      case '42P01': // undefined_table
        return new DatabaseError('Database table not found', { table: error.table });
      case '42703': // undefined_column
        return new DatabaseError('Database column not found', { column: error.column });
      default:
        return new DatabaseError(message, { code: error.code, detail: error.detail });
    }
  }

  // Supabase specific errors
  if (error.code === 'PGRST116') {
    return new NotFoundError('Record');
  }

  return new DatabaseError(message, error);
};

/**
 * Maps Zod validation errors to user-friendly format
 */
const mapValidationError = (zodError: any): ValidationError => {
  const errors = zodError.errors?.map((err: any) => ({
    field: err.path.join('.'),
    message: err.message,
    code: err.code,
  })) || [];

  return new ValidationError('Validation failed', { errors });
};

/**
 * Determines if an error is operational (expected) or programming error
 */
const isOperationalError = (error: any): boolean => {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
};

/**
 * Main error handling middleware
 */
export const errorHandler = async (c: HonoContext, next: Next) => {
  try {
    await next();
  } catch (error: any) {
    console.error('Error caught by middleware:', error);

    let appError: AppError;

    // Handle different types of errors
    if (error instanceof AppError) {
      appError = error;
    } else if (error.name === 'ZodError') {
      appError = mapValidationError(error);
    } else if (error.code || error.constraint) {
      appError = mapDatabaseError(error);
    } else if (error.message?.includes('JWT')) {
      appError = new AuthenticationError('Invalid or expired token');
    } else if (error.message?.includes('permission')) {
      appError = new AuthorizationError();
    } else if (error.message?.includes('not found')) {
      appError = new NotFoundError();
    } else if (error.message?.includes('already exists')) {
      appError = new ConflictError(error.message);
    } else {
      // Unknown error - treat as internal server error
      appError = new AppError(
        'An unexpected error occurred',
        ErrorType.INTERNAL,
        500,
        false,
        { originalMessage: error.message },
      );
    }

    // Prepare error response
    const errorResponse: ErrorResponse = {
      success: false,
      error: appError.message,
      type: appError.type,
      statusCode: appError.statusCode,
      timestamp: appError.timestamp,
      requestId: c.get('requestId') || 'unknown',
      details: appError.details,
    };

    // Include stack trace in development
    const isDevelopment = c.env?.ENVIRONMENT === 'development';
    if (isDevelopment && !isOperationalError(appError) && appError.stack) {
      errorResponse.stack = appError.stack;
    }

    // Log error for monitoring
    if (!isOperationalError(appError) || appError.statusCode >= 500) {
      console.error('Unhandled error:', {
        error: appError.message,
        type: appError.type,
        statusCode: appError.statusCode,
        requestId: errorResponse.requestId,
        stack: appError.stack,
        details: appError.details,
      });
    }

    return c.json(errorResponse, appError.statusCode as any);
  }

  // This should never be reached, but TypeScript requires a return
  return c.json({ success: false, error: 'Unknown error' }, 500);
};

/**
 * Async error wrapper for handlers
 * Catches async errors and passes them to the error middleware
 */
export const asyncHandler = (fn: Function) => {
  return async (c: HonoContext, next?: Next) => {
    try {
      return await fn(c, next);
    } catch (error) {
      throw error; // Let the error middleware handle it
    }
  };
};

/**
 * Helper function to throw validation errors
 */
export const throwValidationError = (message: string, details?: any): never => {
  throw new ValidationError(message, details);
};

/**
 * Helper function to throw not found errors
 */
export const throwNotFoundError = (resource: string = 'Resource', details?: any): never => {
  throw new NotFoundError(resource, details);
};

/**
 * Helper function to throw conflict errors
 */
export const throwConflictError = (message: string, details?: any): never => {
  throw new ConflictError(message, details);
};

/**
 * Helper function to throw business logic errors
 */
export const throwBusinessLogicError = (message: string, statusCode: number = 400, details?: any): never => {
  throw new BusinessLogicError(message, statusCode, details);
};
