/**
 * File Error Handler Utility
 * Provides comprehensive error handling for file operations
 */

/**
 * File operation error types
 */
export enum FileErrorType {
  UPLOAD_FAILED = 'UPLOAD_FAILED',
  CLOUDINARY_ERROR = 'CLOUDINARY_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  ACCESS_DENIED = 'ACCESS_DENIED',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * File operation error interface
 */
export interface FileError {
  type: FileErrorType;
  message: string;
  details?: any;
  statusCode: number;
  userMessage: string;
  retryable: boolean;
}

/**
 * Create a standardized file error
 */
export const createFileError = (
  type: FileErrorType,
  message: string,
  details?: any,
  statusCode: number = 500,
  userMessage?: string,
  retryable: boolean = false
): FileError => {
  return {
    type,
    message,
    details,
    statusCode,
    userMessage: userMessage || getDefaultUserMessage(type),
    retryable,
  };
};

/**
 * Get default user-friendly message for error types
 */
const getDefaultUserMessage = (type: FileErrorType): string => {
  switch (type) {
    case FileErrorType.UPLOAD_FAILED:
      return 'File upload failed. Please try again.';
    case FileErrorType.CLOUDINARY_ERROR:
      return 'There was an issue with the file storage service. Please try again later.';
    case FileErrorType.DATABASE_ERROR:
      return 'There was an issue saving your file information. Please try again.';
    case FileErrorType.VALIDATION_ERROR:
      return 'The file you uploaded is not valid. Please check the file and try again.';
    case FileErrorType.FILE_NOT_FOUND:
      return 'The requested file could not be found.';
    case FileErrorType.ACCESS_DENIED:
      return 'You do not have permission to access this file.';
    case FileErrorType.FILE_TOO_LARGE:
      return 'The file is too large. Please choose a smaller file.';
    case FileErrorType.INVALID_FILE_TYPE:
      return 'This file type is not supported. Please choose a different file.';
    case FileErrorType.QUOTA_EXCEEDED:
      return 'Storage quota exceeded. Please delete some files or contact support.';
    case FileErrorType.NETWORK_ERROR:
      return 'Network error occurred. Please check your connection and try again.';
    default:
      return 'An unexpected error occurred. Please try again.';
  }
};

/**
 * Parse and categorize errors from different sources
 */
export const parseFileError = (error: any): FileError => {
  // Cloudinary errors
  if (error.http_code || error.error?.http_code) {
    const httpCode = error.http_code || error.error.http_code;
    const message = error.message || error.error?.message || 'Cloudinary error';
    
    switch (httpCode) {
      case 400:
        // Check for specific transformation errors
        if (message.includes('Invalid extension in transformation') || message.includes('transformation')) {
          return createFileError(
            FileErrorType.VALIDATION_ERROR,
            `Cloudinary transformation error: ${message}`,
            error,
            400,
            'File processing configuration error. Please try again.',
            true // This is retryable as we can fix the configuration
          );
        }
        return createFileError(
          FileErrorType.VALIDATION_ERROR,
          `Cloudinary validation error: ${message}`,
          error,
          400,
          'The file format or content is not valid.',
          false
        );
      case 401:
        return createFileError(
          FileErrorType.CLOUDINARY_ERROR,
          'Cloudinary authentication failed',
          error,
          500,
          'File storage service authentication failed.',
          false
        );
      case 413:
        return createFileError(
          FileErrorType.FILE_TOO_LARGE,
          'File too large for Cloudinary',
          error,
          413,
          'The file is too large for upload.',
          false
        );
      case 420:
        return createFileError(
          FileErrorType.QUOTA_EXCEEDED,
          'Cloudinary quota exceeded',
          error,
          429,
          'Storage quota has been exceeded.',
          false
        );
      default:
        return createFileError(
          FileErrorType.CLOUDINARY_ERROR,
          `Cloudinary error: ${message}`,
          error,
          500,
          'File storage service error.',
          true
        );
    }
  }

  // Database errors (Supabase/PostgreSQL)
  if (error.code || error.error?.code) {
    const code = error.code || error.error.code;
    const message = error.message || error.error?.message || 'Database error';
    
    switch (code) {
      case 'PGRST116': // Not found
        return createFileError(
          FileErrorType.FILE_NOT_FOUND,
          'File not found in database',
          error,
          404,
          'The requested file could not be found.',
          false
        );
      case '23505': // Unique violation
        return createFileError(
          FileErrorType.DATABASE_ERROR,
          'File already exists',
          error,
          409,
          'A file with this name already exists.',
          false
        );
      case '23503': // Foreign key violation
        return createFileError(
          FileErrorType.VALIDATION_ERROR,
          'Invalid folder reference',
          error,
          400,
          'The specified folder does not exist.',
          false
        );
      default:
        return createFileError(
          FileErrorType.DATABASE_ERROR,
          `Database error: ${message}`,
          error,
          500,
          'There was an issue saving your file.',
          true
        );
    }
  }

  // Multer errors
  if (error.code && error.code.startsWith('LIMIT_')) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return createFileError(
          FileErrorType.FILE_TOO_LARGE,
          'File exceeds size limit',
          error,
          413,
          'The file is too large. Please choose a smaller file.',
          false
        );
      case 'LIMIT_FILE_COUNT':
        return createFileError(
          FileErrorType.VALIDATION_ERROR,
          'Too many files uploaded',
          error,
          400,
          'Too many files selected. Please choose fewer files.',
          false
        );
      default:
        return createFileError(
          FileErrorType.VALIDATION_ERROR,
          `Upload limit exceeded: ${error.message}`,
          error,
          400,
          'Upload limit exceeded. Please adjust your selection.',
          false
        );
    }
  }

  // Network errors
  if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
    return createFileError(
      FileErrorType.NETWORK_ERROR,
      `Network error: ${error.message}`,
      error,
      503,
      'Network connection error. Please try again.',
      true
    );
  }

  // File type validation errors
  if (error.name === 'INVALID_FILE_TYPE') {
    return createFileError(
      FileErrorType.INVALID_FILE_TYPE,
      error.message,
      error,
      400,
      'This file type is not supported.',
      false
    );
  }

  // Generic error fallback
  return createFileError(
    FileErrorType.UNKNOWN_ERROR,
    error.message || 'Unknown error occurred',
    error,
    500,
    'An unexpected error occurred. Please try again.',
    true
  );
};

/**
 * Format error for API response
 */
export const formatErrorResponse = (error: FileError) => {
  return {
    success: false,
    message: error.userMessage,
    error: error.type,
    details: process.env.NODE_ENV === 'development' ? error.details : undefined,
    retryable: error.retryable,
    timestamp: new Date(),
  };
};

/**
 * Log file operation error
 */
export const logFileError = (
  operation: string,
  error: FileError,
  context?: any
): void => {
  console.error(`File ${operation} error:`, {
    type: error.type,
    message: error.message,
    statusCode: error.statusCode,
    retryable: error.retryable,
    context,
    timestamp: new Date().toISOString(),
  });
};
