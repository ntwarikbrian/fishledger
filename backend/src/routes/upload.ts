/**
 * File upload routes for handling image and document uploads
 * Integrates with Cloudinary for cloud storage
 */

import { Hono } from 'hono';
import { 
  fileUploadMiddleware,
  singleFileUpload,
  multipleFileUpload,
  imageUploadMiddleware,
  documentUploadMiddleware,
  avatarUploadMiddleware,
  productImageUploadMiddleware,
  receiptUploadMiddleware,
  getUploadedFiles,
  getUploadedFile,
  getFileUploadService,
  fileUploadError,
  fileUploadSuccess,
  type FileUploadContext
} from '../middleware/fileUpload';
import { authenticate } from '../middleware/auth-hono';
import { enforceDataIsolation } from '../middleware/data-isolation';
import { CLOUDINARY_FOLDERS, IMAGE_PRESETS } from '../config/cloudinary';
import type { Environment } from '../config/environment';

// Create upload router
const upload = new Hono<{ Bindings: Environment }>();

/**
 * Upload single image
 * POST /upload/image
 */
upload.post('/image',
  authenticate,
  enforceDataIsolation,
  imageUploadMiddleware('image'),
  async (c: FileUploadContext) => {
    try {
      const file = getUploadedFile(c);
      const uploadService = getFileUploadService(c);

      if (!file || !uploadService) {
        return fileUploadError(c, 'No file or upload service available');
      }

      // Upload to Cloudinary
      const result = await uploadService.uploadSingleFile(file, {
        folder: CLOUDINARY_FOLDERS.TEMP,
        quality: 'auto:good',
        width: 800,
        height: 800,
      });

      if (!result.success) {
        return fileUploadError(c, result.error || 'Upload failed');
      }

      // Generate responsive URLs
      const responsiveUrls = uploadService.generateResponsiveUrls(result.file!.public_id, [
        { name: 'thumbnail', width: 150, height: 150 },
        { name: 'small', width: 300, height: 300 },
        { name: 'medium', width: 600, height: 600 },
        { name: 'large', width: 1200, height: 1200 },
      ]);

      return fileUploadSuccess(c, {
        file: result.file,
        urls: responsiveUrls,
      }, 'Image uploaded successfully');
    } catch (error) {
      console.error('Image upload error:', error);
      return fileUploadError(c, 'Failed to upload image', 500);
    }
  }
);

/**
 * Upload multiple images
 * POST /upload/images
 */
upload.post('/images',
  authenticate,
  enforceDataIsolation,
  multipleFileUpload(['images'], {
    maxFiles: 5,
    allowedTypes: ['jpg', 'jpeg', 'png', 'webp'],
    maxSize: 5242880, // 5MB
  }),
  async (c: FileUploadContext) => {
    try {
      const files = getUploadedFiles(c);
      const uploadService = getFileUploadService(c);

      if (!files.length || !uploadService) {
        return fileUploadError(c, 'No files or upload service available');
      }

      // Upload multiple files
      const result = await uploadService.uploadMultipleFiles(files, {
        folder: CLOUDINARY_FOLDERS.TEMP,
        quality: 'auto:good',
        width: 800,
        height: 800,
      });

      if (!result.success && result.files.length === 0) {
        return fileUploadError(c, result.errors.join(', ') || 'Upload failed');
      }

      // Generate responsive URLs for each uploaded file
      const filesWithUrls = result.files.map(file => ({
        file,
        urls: uploadService.generateResponsiveUrls(file.public_id, [
          { name: 'thumbnail', width: 150, height: 150 },
          { name: 'small', width: 300, height: 300 },
          { name: 'medium', width: 600, height: 600 },
        ]),
      }));

      return fileUploadSuccess(c, {
        files: filesWithUrls,
        errors: result.errors,
        validationErrors: result.validationErrors,
      }, `${result.files.length} images uploaded successfully`);
    } catch (error) {
      console.error('Multiple image upload error:', error);
      return fileUploadError(c, 'Failed to upload images', 500);
    }
  }
);

/**
 * Upload avatar/profile image
 * POST /upload/avatar
 */
upload.post('/avatar',
  authenticate,
  enforceDataIsolation,
  avatarUploadMiddleware(),
  async (c: FileUploadContext) => {
    try {
      const file = getUploadedFile(c);
      const uploadService = getFileUploadService(c);

      if (!file || !uploadService) {
        return fileUploadError(c, 'No file or upload service available');
      }

      // Upload avatar with specific settings
      const result = await uploadService.uploadSingleFile(file, {
        folder: CLOUDINARY_FOLDERS.USERS,
        quality: 'auto:good',
        width: 200,
        height: 200,
        prefix: 'avatar',
      });

      if (!result.success) {
        return fileUploadError(c, result.error || 'Avatar upload failed');
      }

      // Generate avatar URLs
      const avatarUrls = uploadService.generateResponsiveUrls(result.file!.public_id, [
        { name: 'small', width: 50, height: 50 },
        { name: 'medium', width: 100, height: 100 },
        { name: 'large', width: 200, height: 200 },
      ]);

      return fileUploadSuccess(c, {
        file: result.file,
        urls: avatarUrls,
      }, 'Avatar uploaded successfully');
    } catch (error) {
      console.error('Avatar upload error:', error);
      return fileUploadError(c, 'Failed to upload avatar', 500);
    }
  }
);

/**
 * Upload product image
 * POST /upload/product
 */
upload.post('/product',
  authenticate,
  enforceDataIsolation,
  productImageUploadMiddleware(),
  async (c: FileUploadContext) => {
    try {
      const files = getUploadedFiles(c);
      const uploadService = getFileUploadService(c);

      if (!files.length || !uploadService) {
        return fileUploadError(c, 'No files or upload service available');
      }

      // Upload product images
      const result = await uploadService.uploadMultipleFiles(files, {
        folder: CLOUDINARY_FOLDERS.PRODUCTS,
        quality: 'auto:good',
        width: 600,
        height: 600,
        prefix: 'product',
      });

      if (!result.success && result.files.length === 0) {
        return fileUploadError(c, result.errors.join(', ') || 'Product image upload failed');
      }

      // Generate product image URLs
      const productImages = result.files.map(file => ({
        file,
        urls: uploadService.generateResponsiveUrls(file.public_id, [
          { name: 'thumbnail', width: 100, height: 100 },
          { name: 'small', width: 200, height: 200 },
          { name: 'medium', width: 400, height: 400 },
          { name: 'large', width: 800, height: 800 },
        ]),
      }));

      return fileUploadSuccess(c, {
        images: productImages,
        errors: result.errors,
        validationErrors: result.validationErrors,
      }, `${result.files.length} product images uploaded successfully`);
    } catch (error) {
      console.error('Product image upload error:', error);
      return fileUploadError(c, 'Failed to upload product images', 500);
    }
  }
);

/**
 * Upload receipt/document
 * POST /upload/receipt
 */
upload.post('/receipt',
  authenticate,
  enforceDataIsolation,
  receiptUploadMiddleware(),
  async (c: FileUploadContext) => {
    try {
      const files = getUploadedFiles(c);
      const uploadService = getFileUploadService(c);

      if (!files.length || !uploadService) {
        return fileUploadError(c, 'No files or upload service available');
      }

      // Upload receipts/documents
      const result = await uploadService.uploadMultipleFiles(files, {
        folder: CLOUDINARY_FOLDERS.RECEIPTS,
        quality: 'auto:good',
        prefix: 'receipt',
      });

      if (!result.success && result.files.length === 0) {
        return fileUploadError(c, result.errors.join(', ') || 'Receipt upload failed');
      }

      return fileUploadSuccess(c, {
        receipts: result.files,
        errors: result.errors,
        validationErrors: result.validationErrors,
      }, `${result.files.length} receipts uploaded successfully`);
    } catch (error) {
      console.error('Receipt upload error:', error);
      return fileUploadError(c, 'Failed to upload receipts', 500);
    }
  }
);

/**
 * Upload from base64 data
 * POST /upload/base64
 */
upload.post('/base64',
  authenticate,
  enforceDataIsolation,
  async (c: FileUploadContext) => {
    try {
      const body = await c.req.json();
      const { data, filename, folder = CLOUDINARY_FOLDERS.TEMP } = body;

      if (!data || !filename) {
        return fileUploadError(c, 'Base64 data and filename are required');
      }

      const env = c.env as Environment;
      const uploadService = getFileUploadService(c) || (await import('../utils/fileUpload')).createFileUploadService(env);

      // Upload from base64
      const result = await uploadService.uploadFromBase64(data, filename, {
        folder,
        quality: 'auto:good',
      });

      if (!result.success) {
        return fileUploadError(c, result.error || 'Base64 upload failed');
      }

      return fileUploadSuccess(c, {
        file: result.file,
      }, 'File uploaded from base64 successfully');
    } catch (error) {
      console.error('Base64 upload error:', error);
      return fileUploadError(c, 'Failed to upload from base64', 500);
    }
  }
);

/**
 * Delete uploaded file
 * DELETE /upload/:publicId
 */
upload.delete('/:publicId',
  authenticate,
  enforceDataIsolation,
  async (c: FileUploadContext) => {
    try {
      const publicId = c.req.param('publicId');
      const resourceType = c.req.query('type') as 'image' | 'video' | 'raw' || 'image';

      if (!publicId) {
        return fileUploadError(c, 'Public ID is required');
      }

      const env = c.env as Environment;
      const uploadService = getFileUploadService(c) || (await import('../utils/fileUpload')).createFileUploadService(env);

      // Delete file from Cloudinary
      const result = await uploadService.deleteFile(publicId, resourceType);

      if (!result.success) {
        return fileUploadError(c, result.error || 'File deletion failed');
      }

      return fileUploadSuccess(c, {
        publicId,
        deleted: true,
      }, 'File deleted successfully');
    } catch (error) {
      console.error('File deletion error:', error);
      return fileUploadError(c, 'Failed to delete file', 500);
    }
  }
);

/**
 * Get file information
 * GET /upload/info/:publicId
 */
upload.get('/info/:publicId',
  authenticate,
  enforceDataIsolation,
  async (c: FileUploadContext) => {
    try {
      const publicId = c.req.param('publicId');
      const resourceType = c.req.query('type') as 'image' | 'video' | 'raw' || 'image';

      if (!publicId) {
        return fileUploadError(c, 'Public ID is required');
      }

      const env = c.env as Environment;
      const uploadService = getFileUploadService(c) || (await import('../utils/fileUpload')).createFileUploadService(env);

      // Get file information
      const fileInfo = await uploadService.getFileInfo(publicId, resourceType);

      return fileUploadSuccess(c, {
        fileInfo,
      }, 'File information retrieved successfully');
    } catch (error) {
      console.error('File info error:', error);
      return fileUploadError(c, 'Failed to get file information', 500);
    }
  }
);

export default upload;
