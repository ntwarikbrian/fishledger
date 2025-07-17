/**
 * File upload middleware for Hono framework
 * Handles multipart form data parsing and file validation
 */

import { Context, Next } from 'hono';
import { FileUploadService, createFileUploadService } from '../utils/fileUpload';
import type { FileUploadOptions, UploadedFile } from '../utils/fileUpload';
import type { Environment } from '../config/environment';

// Extended context interface for file uploads
export interface FileUploadContext extends Context {
  files?: UploadedFile[];
  fileUploadService?: FileUploadService;
}

/**
 * File upload middleware configuration
 */
export interface FileUploadMiddlewareOptions extends FileUploadOptions {
  required?: boolean;
  fieldNames?: string[];
  maxFiles?: number;
}

/**
 * Create file upload middleware
 * @param options - Middleware configuration options
 * @returns Hono middleware function
 */
export function fileUploadMiddleware(options: FileUploadMiddlewareOptions = {}) {
  return async (c: FileUploadContext, next: Next) => {
    try {
      // Get environment from context
      const env = c.env as Environment;
      
      // Create file upload service
      const fileUploadService = createFileUploadService(env);
      c.fileUploadService = fileUploadService;

      // Check if Cloudinary is configured
      if (!fileUploadService.isReady()) {
        console.warn('Cloudinary not configured, file upload features disabled');
        if (options.required) {
          return c.json({
            success: false,
            error: 'File upload service not available',
            message: 'Cloudinary configuration is missing',
            timestamp: new Date().toISOString(),
          }, 503);
        }
        return await next();
      }

      // Check if request has multipart data
      const contentType = c.req.header('content-type');
      if (!contentType || !contentType.includes('multipart/form-data')) {
        if (options.required) {
          return c.json({
            success: false,
            error: 'Invalid content type',
            message: 'Multipart form data required for file upload',
            timestamp: new Date().toISOString(),
          }, 400);
        }
        return await next();
      }

      // Parse multipart data
      const files = await fileUploadService.parseMultipartData(c.req.raw);
      
      // Filter files by field names if specified
      const filteredFiles = options.fieldNames 
        ? files.filter(file => options.fieldNames!.includes(file.fieldName))
        : files;

      // Check file count limits
      if (options.maxFiles && filteredFiles.length > options.maxFiles) {
        return c.json({
          success: false,
          error: 'Too many files',
          message: `Maximum ${options.maxFiles} files allowed`,
          timestamp: new Date().toISOString(),
        }, 400);
      }

      // Check if files are required
      if (options.required && filteredFiles.length === 0) {
        return c.json({
          success: false,
          error: 'No files provided',
          message: 'At least one file is required',
          timestamp: new Date().toISOString(),
        }, 400);
      }

      // Validate files
      const validationErrors: string[] = [];
      for (const file of filteredFiles) {
        const errors = fileUploadService.validateFile(file, options);
        validationErrors.push(...errors.map(err => `${file.filename}: ${err}`));
      }

      if (validationErrors.length > 0) {
        return c.json({
          success: false,
          error: 'File validation failed',
          message: 'One or more files failed validation',
          validationErrors,
          timestamp: new Date().toISOString(),
        }, 400);
      }

      // Attach files to context
      c.files = filteredFiles;

      await next();
    } catch (error) {
      console.error('File upload middleware error:', error);
      return c.json({
        success: false,
        error: 'File upload processing failed',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date().toISOString(),
      }, 500);
    }
  };
}

/**
 * Single file upload middleware
 * @param fieldName - Name of the file field
 * @param options - Upload options
 * @returns Hono middleware function
 */
export function singleFileUpload(fieldName: string, options: FileUploadOptions = {}) {
  return fileUploadMiddleware({
    ...options,
    fieldNames: [fieldName],
    maxFiles: 1,
    required: true,
  });
}

/**
 * Multiple file upload middleware
 * @param fieldNames - Array of file field names
 * @param options - Upload options with max files limit
 * @returns Hono middleware function
 */
export function multipleFileUpload(
  fieldNames: string[],
  options: FileUploadMiddlewareOptions = {}
) {
  return fileUploadMiddleware({
    ...options,
    fieldNames,
    maxFiles: options.maxFiles || 10,
    required: options.required || false,
  });
}

/**
 * Optional file upload middleware
 * @param options - Upload options
 * @returns Hono middleware function
 */
export function optionalFileUpload(options: FileUploadOptions = {}) {
  return fileUploadMiddleware({
    ...options,
    required: false,
  });
}

/**
 * Image upload middleware with image-specific validation
 * @param fieldName - Name of the image field
 * @param options - Upload options
 * @returns Hono middleware function
 */
export function imageUploadMiddleware(fieldName: string, options: FileUploadOptions = {}) {
  return fileUploadMiddleware({
    ...options,
    fieldNames: [fieldName],
    maxFiles: 1,
    required: true,
    allowedTypes: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    maxSize: options.maxSize || 5242880, // 5MB default for images
  });
}

/**
 * Document upload middleware with document-specific validation
 * @param fieldName - Name of the document field
 * @param options - Upload options
 * @returns Hono middleware function
 */
export function documentUploadMiddleware(fieldName: string, options: FileUploadOptions = {}) {
  return fileUploadMiddleware({
    ...options,
    fieldNames: [fieldName],
    maxFiles: 1,
    required: true,
    allowedTypes: ['pdf', 'doc', 'docx', 'txt', 'jpg', 'jpeg', 'png'],
    maxSize: options.maxSize || 10485760, // 10MB default for documents
  });
}

/**
 * Avatar upload middleware with specific constraints
 * @param options - Upload options
 * @returns Hono middleware function
 */
export function avatarUploadMiddleware(options: FileUploadOptions = {}) {
  return fileUploadMiddleware({
    ...options,
    fieldNames: ['avatar', 'profile_image'],
    maxFiles: 1,
    required: false,
    allowedTypes: ['jpg', 'jpeg', 'png', 'webp'],
    maxSize: options.maxSize || 2097152, // 2MB default for avatars
    width: 500,
    height: 500,
    quality: 'auto:good',
  });
}

/**
 * Product image upload middleware
 * @param options - Upload options
 * @returns Hono middleware function
 */
export function productImageUploadMiddleware(options: FileUploadOptions = {}) {
  return fileUploadMiddleware({
    ...options,
    fieldNames: ['product_image', 'image'],
    maxFiles: 5, // Allow multiple product images
    required: false,
    allowedTypes: ['jpg', 'jpeg', 'png', 'webp'],
    maxSize: options.maxSize || 5242880, // 5MB default
    width: 800,
    height: 800,
    quality: 'auto:good',
  });
}

/**
 * Receipt/document image upload middleware
 * @param options - Upload options
 * @returns Hono middleware function
 */
export function receiptUploadMiddleware(options: FileUploadOptions = {}) {
  return fileUploadMiddleware({
    ...options,
    fieldNames: ['receipt', 'receipt_image', 'document'],
    maxFiles: 3,
    required: false,
    allowedTypes: ['jpg', 'jpeg', 'png', 'pdf'],
    maxSize: options.maxSize || 10485760, // 10MB default
    quality: 'auto:good',
  });
}

/**
 * Helper function to get uploaded files from context
 * @param c - Hono context
 * @returns Array of uploaded files
 */
export function getUploadedFiles(c: FileUploadContext): UploadedFile[] {
  return c.files || [];
}

/**
 * Helper function to get first uploaded file from context
 * @param c - Hono context
 * @returns First uploaded file or undefined
 */
export function getUploadedFile(c: FileUploadContext): UploadedFile | undefined {
  const files = getUploadedFiles(c);
  return files.length > 0 ? files[0] : undefined;
}

/**
 * Helper function to get file upload service from context
 * @param c - Hono context
 * @returns File upload service instance
 */
export function getFileUploadService(c: FileUploadContext): FileUploadService | undefined {
  return c.fileUploadService;
}

/**
 * Error response helper for file upload failures
 * @param c - Hono context
 * @param error - Error message
 * @param statusCode - HTTP status code
 * @returns JSON error response
 */
export function fileUploadError(c: Context, error: string, statusCode: number = 400) {
  return c.json({
    success: false,
    error: 'File upload error',
    message: error,
    timestamp: new Date().toISOString(),
  }, statusCode as any);
}

/**
 * Success response helper for file uploads
 * @param c - Hono context
 * @param data - Response data
 * @param message - Success message
 * @returns JSON success response
 */
export function fileUploadSuccess(c: Context, data: any, message: string = 'File uploaded successfully') {
  return c.json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  });
}
