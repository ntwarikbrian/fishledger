/**
 * Error Handling Middleware
 * Centralized error handling for the Fish Management System API
 */

import { Request, Response, NextFunction } from 'express';
import { env } from '../config/environment.js';
import { ApiError, ValidationErrorResponse } from '../types/api.js';

/**
 * Custom error class for API errors
 * Extends the built-in Error class with additional properties
 */
export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public isOperational: boolean;
  public details?: any;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    details?: any
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    this.details = details;

    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Database error handler
 * Handles PostgreSQL specific errors and converts them to user-friendly messages
 */
const handleDatabaseError = (error: any): AppError => {
  // PostgreSQL error codes
  switch (error.code) {
    case '23505': // Unique violation
      return new AppError(
        'A record with this information already exists',
        409,
        'DUPLICATE_ENTRY',
        { field: error.detail }
      );
    
    case '23503': // Foreign key violation
      return new AppError(
        'Referenced record does not exist',
        400,
        'FOREIGN_KEY_VIOLATION',
        { constraint: error.constraint }
      );
    
    case '23502': // Not null violation
      return new AppError(
        'Required field is missing',
        400,
        'MISSING_REQUIRED_FIELD',
        { field: error.column }
      );
    
    case '22001': // String data too long
      return new AppError(
        'Input data is too long',
        400,
        'DATA_TOO_LONG',
        { field: error.column }
      );
    
    case '08006': // Connection failure
      return new AppError(
        'Database connection failed',
        503,
        'DATABASE_CONNECTION_ERROR'
      );
    
    default:
      return new AppError(
        'Database operation failed',
        500,
        'DATABASE_ERROR',
        env.NODE_ENV === 'development' ? error : undefined
      );
  }
};

/**
 * JWT error handler
 * Handles JSON Web Token related errors
 */
const handleJWTError = (error: any): AppError => {
  if (error.name === 'JsonWebTokenError') {
    return new AppError('Invalid token', 401, 'INVALID_TOKEN');
  }
  
  if (error.name === 'TokenExpiredError') {
    return new AppError('Token has expired', 401, 'TOKEN_EXPIRED');
  }
  
  if (error.name === 'NotBeforeError') {
    return new AppError('Token not active', 401, 'TOKEN_NOT_ACTIVE');
  }
  
  return new AppError('Authentication failed', 401, 'AUTH_ERROR');
};

/**
 * Validation error handler
 * Handles Zod validation errors and formats them consistently
 */
const handleValidationError = (error: any): ValidationErrorResponse => {
  const errors = error.errors?.map((err: any) => ({
    field: err.path?.join('.') || 'unknown',
    message: err.message,
    value: err.received,
  })) || [];

  return {
    success: false,
    message: 'Validation failed',
    errors,
    timestamp: new Date(),
  };
};

/**
 * Send error response
 * Formats and sends error responses to the client
 */
const sendErrorResponse = (error: AppError, res: Response): void => {
  const errorResponse: ApiError = {
    code: error.code,
    message: error.message,
    timestamp: new Date(),
    ...(error.details && { details: error.details }),
  };

  // Include stack trace in development
  if (env.NODE_ENV === 'development' && error.stack) {
    (errorResponse as any).stack = error.stack;
  }

  res.status(error.statusCode).json({
    success: false,
    error: errorResponse,
  });
};

/**
 * Main error handling middleware
 * Processes all errors and sends appropriate responses
 */
export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Log the error for monitoring
  console.error('❌ Error occurred:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date(),
  });

  let processedError: AppError;

  // Handle different types of errors
  if (error instanceof AppError) {
    processedError = error;
  } else if (error.name === 'ZodError') {
    const validationError = handleValidationError(error);
    res.status(400).json(validationError);
    return;
  } else if (error.code && typeof error.code === 'string') {
    // Database errors
    processedError = handleDatabaseError(error);
  } else if (error.name && error.name.includes('JWT')) {
    // JWT errors
    processedError = handleJWTError(error);
  } else if (error.type === 'entity.parse.failed') {
    // JSON parsing errors
    processedError = new AppError(
      'Invalid JSON format',
      400,
      'INVALID_JSON'
    );
  } else if (error.type === 'entity.too.large') {
    // Request too large
    processedError = new AppError(
      'Request payload too large',
      413,
      'PAYLOAD_TOO_LARGE'
    );
  } else {
    // Generic server error
    processedError = new AppError(
      env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      500,
      'INTERNAL_ERROR',
      env.NODE_ENV === 'development' ? error : undefined
    );
  }

  sendErrorResponse(processedError, res);
};

/**
 * Async error wrapper
 * Wraps async route handlers to catch and forward errors
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Create error helper functions
 * Utility functions for creating specific types of errors
 */
export const createError = {
  badRequest: (message: string, details?: any) => 
    new AppError(message, 400, 'BAD_REQUEST', details),
  
  unauthorized: (message: string = 'Unauthorized', details?: any) =>
    new AppError(message, 401, 'UNAUTHORIZED', details),
  
  forbidden: (message: string = 'Forbidden') => 
    new AppError(message, 403, 'FORBIDDEN'),
  
  notFound: (message: string = 'Resource not found') => 
    new AppError(message, 404, 'NOT_FOUND'),
  
  conflict: (message: string, details?: any) => 
    new AppError(message, 409, 'CONFLICT', details),
  
  internal: (message: string = 'Internal server error', details?: any) => 
    new AppError(message, 500, 'INTERNAL_ERROR', details),
};
