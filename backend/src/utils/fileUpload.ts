/**
 * File upload utilities for handling multipart form data and file processing
 * Integrates with Cloudinary for cloud storage in Cloudflare Workers environment
 */

import { CloudinaryService, validateFileType, validateFileSize, generateUniqueFilename, CLOUDINARY_FOLDERS } from '../config/cloudinary';
import type { CloudinaryUploadOptions, CloudinaryUploadResult } from '../config/cloudinary';
import type { Environment } from '../config/environment';

// File upload interfaces
export interface FileUploadOptions {
  folder?: string;
  allowedTypes?: string[];
  maxSize?: number;
  generateUniqueName?: boolean;
  prefix?: string;
  quality?: string | number;
  width?: number;
  height?: number;
}

export interface UploadedFile {
  fieldName: string;
  filename: string;
  originalName: string;
  mimeType: string | undefined;
  size: number;
  buffer: Buffer;
}

export interface FileUploadResult {
  success: boolean;
  file?: CloudinaryUploadResult;
  error?: string;
  validationErrors?: string[];
}

export interface MultipleFileUploadResult {
  success: boolean;
  files: CloudinaryUploadResult[];
  errors: string[];
  validationErrors: string[];
}

/**
 * File upload service class
 */
export class FileUploadService {
  private cloudinaryService: CloudinaryService;
  private env: Environment;

  constructor(env: Environment) {
    this.env = env;
    this.cloudinaryService = new CloudinaryService(env);
  }

  /**
   * Check if file upload service is ready
   * @returns True if Cloudinary is configured
   */
  public isReady(): boolean {
    return this.cloudinaryService.isReady();
  }

  /**
   * Parse multipart form data from request
   * @param request - Incoming request with multipart data
   * @returns Promise with parsed files
   */
  public async parseMultipartData(request: Request): Promise<UploadedFile[]> {
    try {
      const formData = await request.formData();
      const files: UploadedFile[] = [];

      for (const [fieldName, value] of formData.entries()) {
        if (typeof value === 'object' && value && 'name' in value && 'type' in value && 'size' in value && 'arrayBuffer' in value) {
          const file = value as File;
          const buffer = Buffer.from(await file.arrayBuffer());

          files.push({
            fieldName,
            filename: file.name,
            originalName: file.name,
            mimeType: file.type,
            size: file.size,
            buffer,
          });
        }
      }

      return files;
    } catch (error) {
      console.error('Failed to parse multipart data:', error);
      throw new Error(`Failed to parse multipart data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate a single file
   * @param file - File to validate
   * @param options - Validation options
   * @returns Array of validation errors (empty if valid)
   */
  public validateFile(file: UploadedFile, options: FileUploadOptions = {}): string[] {
    const errors: string[] = [];
    
    // Default options
    const {
      allowedTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp'],
      maxSize = this.env.MAX_FILE_SIZE || 10485760, // 10MB default
    } = options;

    // Validate file type
    if (!validateFileType(file.filename, allowedTypes)) {
      errors.push(`File type not allowed. Allowed types: ${allowedTypes.join(', ')}`);
    }

    // Validate file size
    if (!validateFileSize(file.size, maxSize)) {
      const maxSizeMB = (maxSize / 1024 / 1024).toFixed(2);
      errors.push(`File size too large. Maximum size: ${maxSizeMB}MB`);
    }

    // Validate filename
    if (!file.filename || file.filename.trim() === '') {
      errors.push('Filename is required');
    }

    // Validate buffer
    if (!file.buffer || file.buffer.length === 0) {
      errors.push('File content is empty');
    }

    return errors;
  }

  /**
   * Upload a single file to Cloudinary
   * @param file - File to upload
   * @param options - Upload options
   * @returns Promise with upload result
   */
  public async uploadSingleFile(
    file: UploadedFile,
    options: FileUploadOptions = {}
  ): Promise<FileUploadResult> {
    try {
      // Validate file
      const validationErrors = this.validateFile(file, options);
      if (validationErrors.length > 0) {
        return {
          success: false,
          validationErrors,
        };
      }

      // Prepare upload options
      const {
        folder = CLOUDINARY_FOLDERS.TEMP,
        generateUniqueName = true,
        prefix,
        quality = 'auto:good',
        width,
        height,
      } = options;

      const filename = generateUniqueName
        ? generateUniqueFilename(file.filename, prefix)
        : file.filename;

      const publicId = filename.split('.')[0];
      const cloudinaryOptions: CloudinaryUploadOptions = {
        folder,
        public_id: publicId || undefined,
        quality,
        resource_type: 'auto',
        unique_filename: false,
        use_filename: true,
        overwrite: false,
      };

      if (width !== undefined) {
        cloudinaryOptions.width = width;
      }

      if (height !== undefined) {
        cloudinaryOptions.height = height;
      }

      // Upload to Cloudinary
      const result = await this.cloudinaryService.uploadFile(file.buffer, cloudinaryOptions);

      return {
        success: true,
        file: result,
      };
    } catch (error) {
      console.error('Single file upload failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      };
    }
  }

  /**
   * Upload multiple files to Cloudinary
   * @param files - Array of files to upload
   * @param options - Upload options
   * @returns Promise with upload results
   */
  public async uploadMultipleFiles(
    files: UploadedFile[],
    options: FileUploadOptions = {}
  ): Promise<MultipleFileUploadResult> {
    const uploadedFiles: CloudinaryUploadResult[] = [];
    const errors: string[] = [];
    const validationErrors: string[] = [];

    try {
      // Process each file
      for (const file of files) {
        const result = await this.uploadSingleFile(file, options);
        
        if (result.success && result.file) {
          uploadedFiles.push(result.file);
        } else {
          if (result.validationErrors) {
            validationErrors.push(...result.validationErrors.map(err => `${file.filename}: ${err}`));
          }
          if (result.error) {
            errors.push(`${file.filename}: ${result.error}`);
          }
        }
      }

      return {
        success: uploadedFiles.length > 0,
        files: uploadedFiles,
        errors,
        validationErrors,
      };
    } catch (error) {
      console.error('Multiple file upload failed:', error);
      return {
        success: false,
        files: uploadedFiles,
        errors: [error instanceof Error ? error.message : 'Upload failed'],
        validationErrors,
      };
    }
  }

  /**
   * Upload file from base64 string
   * @param base64Data - Base64 encoded file data
   * @param filename - Original filename
   * @param options - Upload options
   * @returns Promise with upload result
   */
  public async uploadFromBase64(
    base64Data: string,
    filename: string,
    options: FileUploadOptions = {}
  ): Promise<FileUploadResult> {
    try {
      // Parse base64 data
      const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        return {
          success: false,
          error: 'Invalid base64 data format',
        };
      }

      const mimeType = matches[1];
      const base64Content = matches[2];

      if (!base64Content) {
        return {
          success: false,
          error: 'Invalid base64 content',
        };
      }

      const buffer = Buffer.from(base64Content, 'base64');

      // Create file object
      const file: UploadedFile = {
        fieldName: 'file',
        filename,
        originalName: filename,
        mimeType,
        size: buffer.length,
        buffer,
      };

      // Upload file
      return await this.uploadSingleFile(file, options);
    } catch (error) {
      console.error('Base64 upload failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Base64 upload failed',
      };
    }
  }

  /**
   * Delete a file from Cloudinary
   * @param publicId - Public ID of the file to delete
   * @param resourceType - Type of resource
   * @returns Promise with deletion result
   */
  public async deleteFile(
    publicId: string,
    resourceType: 'image' | 'video' | 'raw' = 'image'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await this.cloudinaryService.deleteFile(publicId, resourceType);
      return { success: true };
    } catch (error) {
      console.error('File deletion failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Deletion failed',
      };
    }
  }

  /**
   * Generate responsive image URLs
   * @param publicId - Public ID of the image
   * @param sizes - Array of size configurations
   * @returns Object with different sized URLs
   */
  public generateResponsiveUrls(
    publicId: string,
    sizes: Array<{ name: string; width: number; height?: number; quality?: string }>
  ): Record<string, string> {
    return this.cloudinaryService.generateResponsiveUrls(publicId, sizes);
  }

  /**
   * Get file information
   * @param publicId - Public ID of the file
   * @param resourceType - Type of resource
   * @returns Promise with file information
   */
  public async getFileInfo(
    publicId: string,
    resourceType: 'image' | 'video' | 'raw' = 'image'
  ): Promise<any> {
    return await this.cloudinaryService.getFileInfo(publicId, resourceType);
  }
}

/**
 * Create and return a configured file upload service instance
 * @param env - Environment configuration
 * @returns Configured FileUploadService instance
 */
export function createFileUploadService(env: Environment): FileUploadService {
  return new FileUploadService(env);
}

/**
 * Extract file extension from filename
 * @param filename - Name of the file
 * @returns File extension without dot
 */
export function getFileExtension(filename: string): string {
  return filename.toLowerCase().split('.').pop() || '';
}

/**
 * Get MIME type from file extension
 * @param extension - File extension
 * @returns MIME type string
 */
export function getMimeType(extension: string): string {
  const mimeTypes: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    txt: 'text/plain',
  };

  return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
}

/**
 * Format file size for display
 * @param bytes - File size in bytes
 * @returns Formatted file size string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
