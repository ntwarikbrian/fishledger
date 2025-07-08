/**
 * File Routes
 * Handles file management endpoints with Cloudinary integration
 */

import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticate, requirePermission } from '../middleware/auth.js';
import {
  uploadSingle,
  uploadMultiple,
  validateUpload,
  handleUploadError,
  formatFileSize,
  getFileCategory
} from '../middleware/upload.js';
import {
  uploadFile,
  uploadMultipleFiles,
  deleteFile,
  getFilesByFolder,
  getFileById
} from '../services/fileUploadService.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import type { AuthenticatedRequest } from '../types/api.js';

const router = Router();

/**
 * File upload rate limiter - more lenient for file operations
 * Allows more requests for file uploads since they're typically larger operations
 */
const fileUploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Allow 50 file uploads per 15 minutes per IP
  message: {
    success: false,
    message: 'Too many file upload requests. Please wait before uploading more files.',
    error: 'UPLOAD_RATE_LIMIT_EXCEEDED',
    timestamp: new Date(),
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for successful requests to be more lenient
  skipSuccessfulRequests: false,
  // Custom key generator to be more lenient for authenticated users
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise fall back to IP
    const user = (req as AuthenticatedRequest).user;
    return user?.user_id || req.ip || 'unknown';
  },
});

/**
 * @route   GET /api/files
 * @desc    Get all files for the authenticated user
 * @access  Private
 */
router.get('/', authenticate, requirePermission('view_files'), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.user_id;
  const { folder_id } = req.query;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'User not authenticated',
      error: 'AUTHENTICATION_ERROR',
      timestamp: new Date(),
    });
  }

  if (folder_id) {
    // Get files by folder
    const result = await getFilesByFolder(folder_id as string, userId);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error || 'Failed to fetch files',
        error: 'FETCH_FILES_ERROR',
        timestamp: new Date(),
      });
    }

    return res.json({
      success: true,
      message: 'Files retrieved successfully',
      data: result.files,
      timestamp: new Date(),
    });
  }

  // If no folder_id, return error (require folder specification)
  return res.status(400).json({
    success: false,
    message: 'Folder ID is required',
    error: 'MISSING_FOLDER_ID',
    timestamp: new Date(),
  });
}));

/**
 * @route   POST /api/files/upload
 * @desc    Upload a single file to Cloudinary and save to database
 * @access  Private
 */
router.post('/upload',
  fileUploadLimiter,
  authenticate,
  requirePermission('upload_files'),
  uploadSingle,
  handleUploadError,
  validateUpload,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.user_id;
    const { folder_id, description } = req.body;
    const file = req.file;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
        error: 'AUTHENTICATION_ERROR',
        timestamp: new Date(),
      });
    }

    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
        error: 'NO_FILE_UPLOADED',
        timestamp: new Date(),
      });
    }

    if (!folder_id) {
      return res.status(400).json({
        success: false,
        message: 'Folder ID is required',
        error: 'MISSING_FOLDER_ID',
        timestamp: new Date(),
      });
    }

    // Upload file
    const result = await uploadFile({
      file,
      folderId: folder_id,
      userId,
      description,
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error || 'File upload failed',
        error: 'UPLOAD_FAILED',
        timestamp: new Date(),
      });
    }

    return res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        file: result.file,
        cloudinary: {
          public_id: result.cloudinaryResult?.public_id,
          secure_url: result.cloudinaryResult?.secure_url,
          resource_type: result.cloudinaryResult?.resource_type,
          format: result.cloudinaryResult?.format,
          bytes: result.cloudinaryResult?.bytes,
        },
        metadata: {
          size: formatFileSize(file.size),
          category: getFileCategory(file.mimetype),
          mime_type: file.mimetype,
        },
      },
      timestamp: new Date(),
    });
  })
);

/**
 * @route   POST /api/files/upload-multiple
 * @desc    Upload multiple files to Cloudinary and save to database
 * @access  Private
 */
router.post('/upload-multiple',
  fileUploadLimiter,
  authenticate,
  requirePermission('upload_files'),
  uploadMultiple,
  handleUploadError,
  validateUpload,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.user_id;
    const { folder_id, description } = req.body;
    const files = req.files as Express.Multer.File[];

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
        error: 'AUTHENTICATION_ERROR',
        timestamp: new Date(),
      });
    }

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded',
        error: 'NO_FILES_UPLOADED',
        timestamp: new Date(),
      });
    }

    if (!folder_id) {
      return res.status(400).json({
        success: false,
        message: 'Folder ID is required',
        error: 'MISSING_FOLDER_ID',
        timestamp: new Date(),
      });
    }

    // Prepare upload inputs
    const uploadInputs = files.map(file => ({
      file,
      folderId: folder_id,
      userId,
      description,
    }));

    // Upload all files
    const results = await uploadMultipleFiles(uploadInputs);

    // Separate successful and failed uploads
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    return res.status(successful.length > 0 ? 201 : 400).json({
      success: successful.length > 0,
      message: `${successful.length} files uploaded successfully${failed.length > 0 ? `, ${failed.length} failed` : ''}`,
      data: {
        successful: successful.map(r => ({
          file: r.file,
          cloudinary: {
            public_id: r.cloudinaryResult?.public_id,
            secure_url: r.cloudinaryResult?.secure_url,
            resource_type: r.cloudinaryResult?.resource_type,
          },
        })),
        failed: failed.map(r => ({
          error: r.error,
        })),
        summary: {
          total: results.length,
          successful: successful.length,
          failed: failed.length,
        },
      },
      timestamp: new Date(),
    });
  })
);

/**
 * @route   GET /api/files/:id
 * @desc    Get a specific file by ID
 * @access  Private
 */
router.get('/:id', authenticate, requirePermission('view_files'), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.user_id;
  const { id } = req.params;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'User not authenticated',
      error: 'AUTHENTICATION_ERROR',
      timestamp: new Date(),
    });
  }

  const result = await getFileById(id!, userId!);

  if (!result.success) {
    const statusCode = result.error === 'File not found' ? 404 : 400;
    return res.status(statusCode).json({
      success: false,
      message: result.error || 'Failed to fetch file',
      error: 'FETCH_FILE_ERROR',
      timestamp: new Date(),
    });
  }

  return res.json({
    success: true,
    message: 'File retrieved successfully',
    data: result.file,
    timestamp: new Date(),
  });
}));

/**
 * @route   DELETE /api/files/:id
 * @desc    Delete a file from both Cloudinary and database
 * @access  Private
 */
router.delete('/:id', authenticate, requirePermission('manage_files'), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.user_id;
  const { id } = req.params;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'User not authenticated',
      error: 'AUTHENTICATION_ERROR',
      timestamp: new Date(),
    });
  }

  const result = await deleteFile(id!, userId!);

  if (!result.success) {
    const statusCode = result.error === 'File not found or access denied' ? 404 : 400;
    return res.status(statusCode).json({
      success: false,
      message: result.error || 'Failed to delete file',
      error: 'DELETE_FILE_ERROR',
      timestamp: new Date(),
    });
  }

  return res.json({
    success: true,
    message: 'File deleted successfully',
    timestamp: new Date(),
  });
}));

/**
 * @route   POST /api/files/test-upload
 * @desc    Test Cloudinary upload with minimal configuration
 * @access  Private
 */
router.post('/test-upload',
  authenticate,
  requirePermission('upload_files'),
  uploadSingle,
  handleUploadError,
  validateUpload,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.user_id;
    const file = req.file;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
        error: 'AUTHENTICATION_ERROR',
        timestamp: new Date(),
      });
    }

    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
        error: 'NO_FILE_UPLOADED',
        timestamp: new Date(),
      });
    }

    try {
      // Test upload with minimal Cloudinary options
      const { uploadToCloudinary } = await import('../config/cloudinary.js');

      const minimalOptions = {
        folder: 'test_uploads',
        resource_type: file.mimetype.startsWith('image/') ? 'image' as const : 'raw' as const,
        overwrite: false,
        unique_filename: true,
      };

      const result = await uploadToCloudinary(file.buffer, minimalOptions);

      return res.status(200).json({
        success: true,
        message: 'Test upload successful',
        data: {
          cloudinary_result: result,
          file_info: {
            name: file.originalname,
            size: file.size,
            type: file.mimetype,
          },
        },
        timestamp: new Date(),
      });

    } catch (error) {
      console.error('Test upload error:', error);
      return res.status(500).json({
        success: false,
        message: 'Test upload failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      });
    }
  })
);

export default router;
