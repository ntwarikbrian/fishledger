/**
 * Cloudinary configuration for image and file upload management
 * Handles image uploads, transformations, and URL generation for Cloudflare Workers
 */

import { v2 as cloudinary } from 'cloudinary';
import type { Environment } from './environment';

// Cloudinary upload options interface
export interface CloudinaryUploadOptions {
  folder?: string;
  public_id?: string | undefined;
  resource_type?: 'image' | 'video' | 'raw' | 'auto';
  format?: string;
  quality?: string | number;
  width?: number;
  height?: number;
  crop?: 'scale' | 'fit' | 'fill' | 'crop' | 'thumb' | 'limit' | 'mfit' | 'mpad';
  gravity?: 'auto' | 'face' | 'center' | 'north' | 'south' | 'east' | 'west';
  tags?: string[];
  overwrite?: boolean;
  unique_filename?: boolean;
  use_filename?: boolean;
}

// Cloudinary response interface
export interface CloudinaryUploadResult {
  public_id: string;
  version: number;
  signature: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
  created_at: string;
  tags: string[];
  bytes: number;
  type: string;
  etag: string;
  placeholder: boolean;
  url: string;
  secure_url: string;
  folder?: string;
  original_filename?: string;
}

// Cloudinary transformation options
export interface CloudinaryTransformOptions {
  width?: number;
  height?: number;
  crop?: string;
  quality?: string | number;
  format?: string;
  gravity?: string;
  effect?: string;
  overlay?: string;
  underlay?: string;
  border?: string;
  radius?: string | number;
  angle?: number;
  opacity?: number;
  background?: string;
}

/**
 * Cloudinary service class for handling image operations
 */
export class CloudinaryService {
  private isConfigured: boolean = false;
  private env: Environment;

  constructor(env: Environment) {
    this.env = env;
    this.configure();
  }

  /**
   * Configure Cloudinary with environment variables
   * @private
   */
  private configure(): void {
    try {
      // Check if all required Cloudinary environment variables are present
      if (!this.env.CLOUDINARY_CLOUD_NAME || 
          !this.env.CLOUDINARY_API_KEY || 
          !this.env.CLOUDINARY_API_SECRET) {
        console.warn('Cloudinary configuration incomplete. Some features may not work.');
        this.isConfigured = false;
        return;
      }

      // Configure Cloudinary
      cloudinary.config({
        cloud_name: this.env.CLOUDINARY_CLOUD_NAME,
        api_key: this.env.CLOUDINARY_API_KEY,
        api_secret: this.env.CLOUDINARY_API_SECRET,
        secure: true, // Always use HTTPS
      });

      this.isConfigured = true;
      console.log('Cloudinary configured successfully');
    } catch (error) {
      console.error('Failed to configure Cloudinary:', error);
      this.isConfigured = false;
    }
  }

  /**
   * Check if Cloudinary is properly configured
   * @returns True if configured, false otherwise
   */
  public isReady(): boolean {
    return this.isConfigured;
  }

  /**
   * Upload a file to Cloudinary
   * @param fileBuffer - File buffer or base64 string
   * @param options - Upload options
   * @returns Promise with upload result
   */
  public async uploadFile(
    fileBuffer: Buffer | string,
    options: CloudinaryUploadOptions = {}
  ): Promise<CloudinaryUploadResult> {
    if (!this.isConfigured) {
      throw new Error('Cloudinary is not configured. Please check environment variables.');
    }

    try {
      // Default upload options
      const defaultOptions = {
        resource_type: 'auto' as const,
        folder: 'local-fishing',
        quality: 'auto:good',
        format: 'auto',
        unique_filename: true,
        overwrite: false,
        ...options,
      };

      // Remove undefined values to avoid Cloudinary API issues
      const cleanOptions = Object.fromEntries(
        Object.entries(defaultOptions).filter(([_, value]) => value !== undefined)
      );

      // Convert buffer to base64 if needed
      const fileData = Buffer.isBuffer(fileBuffer)
        ? `data:image/jpeg;base64,${fileBuffer.toString('base64')}`
        : fileBuffer;

      // Upload to Cloudinary
      const result = await cloudinary.uploader.upload(fileData, cleanOptions as any);

      return result as CloudinaryUploadResult;
    } catch (error) {
      console.error('Cloudinary upload failed:', error);
      throw new Error(`Failed to upload file to Cloudinary: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Upload multiple files to Cloudinary
   * @param files - Array of file buffers with metadata
   * @param options - Upload options
   * @returns Promise with array of upload results
   */
  public async uploadMultipleFiles(
    files: Array<{ buffer: Buffer | string; filename?: string }>,
    options: CloudinaryUploadOptions = {}
  ): Promise<CloudinaryUploadResult[]> {
    if (!this.isConfigured) {
      throw new Error('Cloudinary is not configured. Please check environment variables.');
    }

    try {
      const uploadPromises = files.map(async (file, index) => {
        const fileOptions: CloudinaryUploadOptions = {
          ...options,
          public_id: file.filename ? file.filename.split('.')[0] : `file_${index}`,
        };
        return this.uploadFile(file.buffer, fileOptions);
      });

      return await Promise.all(uploadPromises);
    } catch (error) {
      console.error('Multiple file upload failed:', error);
      throw new Error(`Failed to upload multiple files: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete a file from Cloudinary
   * @param publicId - Public ID of the file to delete
   * @param resourceType - Type of resource (image, video, raw)
   * @returns Promise with deletion result
   */
  public async deleteFile(
    publicId: string,
    resourceType: 'image' | 'video' | 'raw' = 'image'
  ): Promise<{ result: string }> {
    if (!this.isConfigured) {
      throw new Error('Cloudinary is not configured. Please check environment variables.');
    }

    try {
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
      });

      return result;
    } catch (error) {
      console.error('Cloudinary deletion failed:', error);
      throw new Error(`Failed to delete file from Cloudinary: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate a transformed image URL
   * @param publicId - Public ID of the image
   * @param transformations - Transformation options
   * @returns Transformed image URL
   */
  public generateUrl(
    publicId: string,
    transformations: CloudinaryTransformOptions = {}
  ): string {
    if (!this.isConfigured) {
      throw new Error('Cloudinary is not configured. Please check environment variables.');
    }

    try {
      return cloudinary.url(publicId, {
        secure: true,
        ...transformations,
      });
    } catch (error) {
      console.error('URL generation failed:', error);
      throw new Error(`Failed to generate Cloudinary URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate multiple image sizes for responsive design
   * @param publicId - Public ID of the image
   * @param sizes - Array of size configurations
   * @returns Object with different sized URLs
   */
  public generateResponsiveUrls(
    publicId: string,
    sizes: Array<{ name: string; width: number; height?: number; quality?: string }>
  ): Record<string, string> {
    if (!this.isConfigured) {
      throw new Error('Cloudinary is not configured. Please check environment variables.');
    }

    const urls: Record<string, string> = {};

    try {
      sizes.forEach(size => {
        const transformOptions: CloudinaryTransformOptions = {
          width: size.width,
          quality: size.quality || 'auto:good',
          crop: 'fill',
          gravity: 'auto',
        };

        if (size.height !== undefined) {
          transformOptions.height = size.height;
        }

        urls[size.name] = this.generateUrl(publicId, transformOptions);
      });

      return urls;
    } catch (error) {
      console.error('Responsive URL generation failed:', error);
      throw new Error(`Failed to generate responsive URLs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get file information from Cloudinary
   * @param publicId - Public ID of the file
   * @param resourceType - Type of resource
   * @returns Promise with file information
   */
  public async getFileInfo(
    publicId: string,
    resourceType: 'image' | 'video' | 'raw' = 'image'
  ): Promise<any> {
    if (!this.isConfigured) {
      throw new Error('Cloudinary is not configured. Please check environment variables.');
    }

    try {
      const result = await cloudinary.api.resource(publicId, {
        resource_type: resourceType,
      });

      return result;
    } catch (error) {
      console.error('Failed to get file info:', error);
      throw new Error(`Failed to get file information: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * List files in a specific folder
   * @param folder - Folder name
   * @param resourceType - Type of resource
   * @param maxResults - Maximum number of results
   * @returns Promise with list of files
   */
  public async listFiles(
    folder: string = 'local-fishing',
    resourceType: 'image' | 'video' | 'raw' = 'image',
    maxResults: number = 50
  ): Promise<any> {
    if (!this.isConfigured) {
      throw new Error('Cloudinary is not configured. Please check environment variables.');
    }

    try {
      const result = await cloudinary.api.resources({
        type: 'upload',
        resource_type: resourceType,
        prefix: folder,
        max_results: maxResults,
      });

      return result;
    } catch (error) {
      console.error('Failed to list files:', error);
      throw new Error(`Failed to list files: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

/**
 * Create and return a configured Cloudinary service instance
 * @param env - Environment configuration
 * @returns Configured CloudinaryService instance
 */
export function createCloudinaryService(env: Environment): CloudinaryService {
  return new CloudinaryService(env);
}

/**
 * Validate file type for upload
 * @param filename - Name of the file
 * @param allowedTypes - Array of allowed file extensions
 * @returns True if file type is allowed
 */
export function validateFileType(
  filename: string,
  allowedTypes: string[] = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg']
): boolean {
  const extension = filename.toLowerCase().split('.').pop();
  return extension ? allowedTypes.includes(extension) : false;
}

/**
 * Validate file size
 * @param fileSize - Size of the file in bytes
 * @param maxSize - Maximum allowed size in bytes
 * @returns True if file size is within limits
 */
export function validateFileSize(fileSize: number, maxSize: number): boolean {
  return fileSize <= maxSize;
}

/**
 * Generate a unique filename
 * @param originalName - Original filename
 * @param prefix - Optional prefix
 * @returns Unique filename
 */
export function generateUniqueFilename(originalName: string, prefix?: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  const extension = originalName.split('.').pop();
  const baseName = originalName.split('.').slice(0, -1).join('.');

  const cleanBaseName = baseName.replace(/[^a-zA-Z0-9]/g, '_');
  const prefixPart = prefix ? `${prefix}_` : '';

  return `${prefixPart}${cleanBaseName}_${timestamp}_${random}.${extension}`;
}

/**
 * Default Cloudinary folders for different file types
 */
export const CLOUDINARY_FOLDERS = {
  PRODUCTS: 'local-fishing/products',
  USERS: 'local-fishing/users',
  RECEIPTS: 'local-fishing/receipts',
  DOCUMENTS: 'local-fishing/documents',
  TEMP: 'local-fishing/temp',
} as const;

/**
 * Default image transformation presets
 */
export const IMAGE_PRESETS = {
  THUMBNAIL: { width: 150, height: 150, crop: 'fill', quality: 'auto:good' },
  SMALL: { width: 300, height: 300, crop: 'fit', quality: 'auto:good' },
  MEDIUM: { width: 600, height: 600, crop: 'fit', quality: 'auto:good' },
  LARGE: { width: 1200, height: 1200, crop: 'fit', quality: 'auto:best' },
  AVATAR: { width: 100, height: 100, crop: 'fill', gravity: 'face', quality: 'auto:good' },
  PRODUCT: { width: 400, height: 400, crop: 'fit', quality: 'auto:good' },
} as const;
