/**
 * Cloudinary Configuration
 * Sets up Cloudinary SDK for image and file uploads
 */

import { v2 as cloudinary } from 'cloudinary';
import { cloudinaryConfig } from './environment.js';

/**
 * Configure Cloudinary with credentials
 * This initializes the Cloudinary SDK with the provided credentials
 */
cloudinary.config({
  cloud_name: cloudinaryConfig.cloudName,
  api_key: cloudinaryConfig.apiKey,
  api_secret: cloudinaryConfig.apiSecret,
  secure: true, // Force HTTPS URLs
});

/**
 * Cloudinary upload options interface
 * Defines the structure for upload configuration
 */
export interface CloudinaryUploadOptions {
  folder?: string; // Cloudinary folder to organize uploads
  public_id?: string; // Custom public ID for the file
  resource_type?: 'image' | 'video' | 'raw' | 'auto'; // Type of resource
  format?: string; // Force specific format
  transformation?: any[]; // Image transformations
  tags?: string[]; // Tags for organization
  overwrite?: boolean; // Whether to overwrite existing files
  unique_filename?: boolean; // Generate unique filename
  use_filename?: boolean; // Use original filename
}

/**
 * Default upload options for different file types
 */
export const defaultUploadOptions: Record<string, CloudinaryUploadOptions> = {
  // Image files (JPEG, PNG, GIF, etc.)
  image: {
    folder: 'documents/images',
    resource_type: 'image',
    // Remove problematic format and transformation options
    overwrite: false,
    unique_filename: true,
    use_filename: true,
  },
  
  // Document files (PDF, DOC, etc.)
  document: {
    folder: 'documents/files',
    resource_type: 'raw',
    overwrite: false,
    unique_filename: true,
    use_filename: true,
  },
  
  // Video files
  video: {
    folder: 'documents/videos',
    resource_type: 'video',
    overwrite: false,
    unique_filename: true,
    use_filename: true,
  },
  
  // Default for unknown types
  auto: {
    folder: 'documents/misc',
    resource_type: 'auto',
    overwrite: false,
    unique_filename: true,
    use_filename: true,
  },
};

/**
 * Get upload options based on file type
 * @param mimeType - MIME type of the file
 * @param customOptions - Custom options to override defaults
 * @returns Cloudinary upload options
 */
export const getUploadOptions = (
  mimeType: string,
  customOptions: Partial<CloudinaryUploadOptions> = {}
): CloudinaryUploadOptions => {
  let baseOptions: CloudinaryUploadOptions;

  if (mimeType.startsWith('image/')) {
    baseOptions = defaultUploadOptions.image!;
  } else if (mimeType.startsWith('video/')) {
    baseOptions = defaultUploadOptions.video!;
  } else if (mimeType === 'application/pdf' || mimeType.includes('document')) {
    baseOptions = defaultUploadOptions.document!;
  } else {
    baseOptions = defaultUploadOptions.auto!;
  }

  return { ...baseOptions, ...customOptions };
};

/**
 * Upload file to Cloudinary
 * @param fileBuffer - File buffer to upload
 * @param options - Upload options
 * @returns Promise with Cloudinary upload result
 */
export const uploadToCloudinary = async (
  fileBuffer: Buffer,
  options: CloudinaryUploadOptions = {}
): Promise<any> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      options,
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    uploadStream.end(fileBuffer);
  });
};

/**
 * Upload file from URL to Cloudinary
 * @param fileUrl - URL of the file to upload
 * @param options - Upload options
 * @returns Promise with Cloudinary upload result
 */
export const uploadFromUrl = async (
  fileUrl: string,
  options: CloudinaryUploadOptions = {}
): Promise<any> => {
  try {
    const result = await cloudinary.uploader.upload(fileUrl, options);
    return result;
  } catch (error) {
    throw error;
  }
};

/**
 * Delete file from Cloudinary
 * @param publicId - Public ID of the file to delete
 * @param resourceType - Type of resource to delete
 * @returns Promise with deletion result
 */
export const deleteFromCloudinary = async (
  publicId: string,
  resourceType: 'image' | 'video' | 'raw' = 'image'
): Promise<any> => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
    return result;
  } catch (error) {
    throw error;
  }
};

/**
 * Generate transformation URL for images
 * @param publicId - Public ID of the image
 * @param transformations - Array of transformations
 * @returns Transformed image URL
 */
export const generateTransformationUrl = (
  publicId: string,
  transformations: any[] = []
): string => {
  return cloudinary.url(publicId, {
    transformation: transformations,
    secure: true,
  });
};

/**
 * Get file info from Cloudinary
 * @param publicId - Public ID of the file
 * @param resourceType - Type of resource
 * @returns Promise with file information
 */
export const getFileInfo = async (
  publicId: string,
  resourceType: 'image' | 'video' | 'raw' = 'image'
): Promise<any> => {
  try {
    const result = await cloudinary.api.resource(publicId, {
      resource_type: resourceType,
    });
    return result;
  } catch (error) {
    throw error;
  }
};

/**
 * Test Cloudinary connection
 * @returns Promise with connection test result
 */
export const testCloudinaryConnection = async (): Promise<boolean> => {
  try {
    // Try to get account details to test connection
    await cloudinary.api.ping();
    return true;
  } catch (error) {
    console.error('Cloudinary connection test failed:', error);
    return false;
  }
};

// Export the configured Cloudinary instance
export default cloudinary;
