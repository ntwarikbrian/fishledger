/**
 * File Upload Middleware
 * Configures multer for handling file uploads with validation
 */

import multer from 'multer';
import { Request } from 'express';
import { uploadConfig } from '../config/environment.js';

/**
 * File filter function for multer
 * Validates file types and sizes
 */
const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
): void => {
  // Allowed file types
  const allowedMimeTypes = [
    // Images
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    
    // Archives
    'application/zip',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
    
    // Videos (optional)
    'video/mp4',
    'video/mpeg',
    'video/quicktime',
    'video/x-msvideo',
  ];

  // Check file type
  if (!allowedMimeTypes.includes(file.mimetype)) {
    const error = new Error(`File type ${file.mimetype} is not allowed`);
    error.name = 'INVALID_FILE_TYPE';
    return cb(error);
  }

  // File is valid
  cb(null, true);
};

/**
 * Multer configuration for memory storage
 * Files are stored in memory for direct upload to Cloudinary
 */
const multerConfig = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: uploadConfig.maxFileSize, // Max file size from config
    files: 10, // Maximum number of files per request
    fields: 20, // Maximum number of non-file fields
  },
  fileFilter,
});

/**
 * Single file upload middleware
 * Handles single file upload with field name 'file'
 */
export const uploadSingle = multerConfig.single('file');

/**
 * Multiple files upload middleware
 * Handles multiple files upload with field name 'files'
 * Maximum 10 files per request
 */
export const uploadMultiple = multerConfig.array('files', 10);

/**
 * Image-only file filter for receipts and images
 * More restrictive filter that only allows common image formats
 */
const imageOnlyFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
): void => {
  // Allowed image types only
  const allowedImageTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/bmp',
    'image/tiff',
    'image/svg+xml'
  ];

  // Check if file type is an allowed image format
  if (!allowedImageTypes.includes(file.mimetype.toLowerCase())) {
    const error = new Error(`Only image files are allowed. Received: ${file.mimetype}`);
    error.name = 'INVALID_IMAGE_TYPE';
    return cb(error);
  }

  // File is valid
  cb(null, true);
};

/**
 * Multer configuration for image-only uploads (receipts, etc.)
 * More restrictive configuration for image uploads only
 */
const imageOnlyMulterConfig = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: uploadConfig.maxFileSize, // Max file size from config
    files: 5, // Maximum number of image files per request
    fields: 10, // Maximum number of non-file fields
  },
  fileFilter: imageOnlyFilter,
});

/**
 * Single image upload middleware
 * Handles single image upload with field name 'file'
 * Only allows image formats
 */
export const uploadSingleImage = imageOnlyMulterConfig.single('file');

/**
 * Receipt-specific file filter for expense receipts
 * Only allows JPEG, GIF, PNG, and WebP formats
 */
const receiptOnlyFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
): void => {
  // Allowed receipt image types only (JPEG, GIF, PNG, WebP)
  const allowedReceiptTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif'
  ];

  // Check if file type is an allowed receipt format
  if (!allowedReceiptTypes.includes(file.mimetype.toLowerCase())) {
    const error = new Error(`Upload required image format. Only JPEG, GIF, PNG, and WebP are allowed. Received: ${file.mimetype}`);
    error.name = 'INVALID_RECEIPT_FORMAT';
    return cb(error);
  }

  // File is valid
  cb(null, true);
};

/**
 * Multer configuration for receipt-only uploads
 * Restricted to JPEG, GIF, PNG, and WebP formats only
 */
const receiptOnlyMulterConfig = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: uploadConfig.maxFileSize, // Max file size from config
    files: 1, // Only one receipt file per request
    fields: 5, // Maximum number of non-file fields
  },
  fileFilter: receiptOnlyFilter,
});

/**
 * Single receipt upload middleware
 * Handles single receipt upload with field name 'file'
 * Only allows JPEG, GIF, PNG, and WebP formats
 */
export const uploadSingleReceipt = receiptOnlyMulterConfig.single('file');

/**
 * Mixed fields upload middleware
 * Handles multiple file fields with different names
 */
export const uploadFields = multerConfig.fields([
  { name: 'documents', maxCount: 5 },
  { name: 'images', maxCount: 10 },
  { name: 'attachments', maxCount: 3 },
]);

/**
 * File validation middleware
 * Additional validation after multer processing
 */
export const validateUpload = (
  req: Request,
  res: any,
  next: any
): void => {
  try {
    // Check if files were uploaded
    const files = req.files as Express.Multer.File[] | undefined;
    const file = req.file as Express.Multer.File | undefined;

    if (!files && !file) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded',
        error: 'NO_FILES_UPLOADED',
        timestamp: new Date(),
      });
    }

    // Validate individual files
    const filesToValidate = files || (file ? [file] : []);
    
    for (const uploadedFile of filesToValidate) {
      // Check file size (additional check)
      if (uploadedFile.size > uploadConfig.maxFileSize) {
        return res.status(400).json({
          success: false,
          message: `File ${uploadedFile.originalname} exceeds maximum size limit`,
          error: 'FILE_TOO_LARGE',
          timestamp: new Date(),
        });
      }

      // Check if file has content
      if (!uploadedFile.buffer || uploadedFile.buffer.length === 0) {
        return res.status(400).json({
          success: false,
          message: `File ${uploadedFile.originalname} is empty`,
          error: 'EMPTY_FILE',
          timestamp: new Date(),
        });
      }

      // Validate filename
      if (!uploadedFile.originalname || uploadedFile.originalname.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'File must have a valid filename',
          error: 'INVALID_FILENAME',
          timestamp: new Date(),
        });
      }

      // Check for potentially dangerous file extensions
      const dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.com'];
      const fileExtension = uploadedFile.originalname.toLowerCase().split('.').pop();
      
      if (fileExtension && dangerousExtensions.includes(`.${fileExtension}`)) {
        return res.status(400).json({
          success: false,
          message: `File type .${fileExtension} is not allowed for security reasons`,
          error: 'DANGEROUS_FILE_TYPE',
          timestamp: new Date(),
        });
      }
    }

    next();
  } catch (error) {
    console.error('File validation error:', error);
    res.status(500).json({
      success: false,
      message: 'File validation failed',
      error: 'VALIDATION_ERROR',
      timestamp: new Date(),
    });
  }
};

/**
 * Error handler for multer errors
 */
export const handleUploadError = (
  error: any,
  _req: Request,
  res: any,
  next: any
): void => {
  if (error instanceof multer.MulterError) {
    let message = 'File upload error';
    let errorCode = 'UPLOAD_ERROR';

    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        message = `File too large. Maximum size is ${uploadConfig.maxFileSize / (1024 * 1024)}MB`;
        errorCode = 'FILE_TOO_LARGE';
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Too many files. Maximum 10 files allowed';
        errorCode = 'TOO_MANY_FILES';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = 'Unexpected file field';
        errorCode = 'UNEXPECTED_FILE_FIELD';
        break;
      case 'LIMIT_PART_COUNT':
        message = 'Too many parts in the request';
        errorCode = 'TOO_MANY_PARTS';
        break;
      case 'LIMIT_FIELD_KEY':
        message = 'Field name too long';
        errorCode = 'FIELD_NAME_TOO_LONG';
        break;
      case 'LIMIT_FIELD_VALUE':
        message = 'Field value too long';
        errorCode = 'FIELD_VALUE_TOO_LONG';
        break;
      case 'LIMIT_FIELD_COUNT':
        message = 'Too many fields';
        errorCode = 'TOO_MANY_FIELDS';
        break;
      default:
        message = error.message || 'Unknown upload error';
    }

    return res.status(400).json({
      success: false,
      message,
      error: errorCode,
      timestamp: new Date(),
    });
  }

  // Handle custom file filter errors
  if (error.name === 'INVALID_FILE_TYPE') {
    return res.status(400).json({
      success: false,
      message: error.message,
      error: 'INVALID_FILE_TYPE',
      timestamp: new Date(),
    });
  }

  // Handle receipt format errors
  if (error.name === 'INVALID_RECEIPT_FORMAT') {
    return res.status(400).json({
      success: false,
      message: error.message,
      error: 'INVALID_RECEIPT_FORMAT',
      timestamp: new Date(),
    });
  }

  // Pass other errors to the next error handler
  next(error);
};

/**
 * Get file size in human readable format
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Get file type category from MIME type
 */
export const getFileCategory = (mimeType: string): string => {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType.includes('document') || mimeType.includes('word')) return 'document';
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'spreadsheet';
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'presentation';
  if (mimeType.startsWith('text/')) return 'text';
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z')) return 'archive';
  
  return 'other';
};
