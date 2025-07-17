/**
 * Cloudinary integration utility for Cloudflare Workers
 * Custom implementation using fetch API instead of Node.js SDK
 * Works with Cloudflare Workers environment
 */

// Cloudinary configuration interface
interface CloudinaryConfig {
  cloud_name: string;
  api_key: string;
  api_secret: string;
}

// Upload result interface
export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  url: string;
  resource_type: string;
  format: string;
  bytes: number;
  width?: number;
  height?: number;
  created_at: string;
}

// Upload options interface
export interface CloudinaryUploadOptions {
  folder?: string;
  resource_type?: 'image' | 'video' | 'raw' | 'auto';
  public_id?: string;
  overwrite?: boolean;
  transformation?: any[];
  tags?: string[];
}

// Global configuration storage
let cloudinaryConfig: CloudinaryConfig | null = null;

/**
 * Initialize Cloudinary configuration for Workers
 */
export function initializeCloudinary(config: CloudinaryConfig): void {
  cloudinaryConfig = config;
}

/**
 * Generate signature for Cloudinary API using SHA-1 HMAC
 * Following Cloudinary's exact signature specification
 */
async function generateSignature(params: Record<string, any>, apiSecret: string): Promise<string> {
  // Filter out empty values and sort parameters
  const filteredParams: Record<string, any> = {};
  Object.keys(params).forEach(key => {
    if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
      filteredParams[key] = params[key];
    }
  });

  // Sort parameters and create query string (Cloudinary format)
  const sortedParams = Object.keys(filteredParams)
    .sort()
    .map(key => `${key}=${filteredParams[key]}`)
    .join('&');

  // Append API secret to the string (this is how Cloudinary does it)
  const stringToSign = sortedParams + apiSecret;

  console.log('🔐 String to sign:', stringToSign);

  // Create SHA-1 hash using Web Crypto API (Cloudinary uses SHA-1, not HMAC)
  const encoder = new TextEncoder();
  const messageData = encoder.encode(stringToSign);

  const hashBuffer = await crypto.subtle.digest('SHA-1', messageData);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  console.log('🔐 Generated signature:', hashHex);

  return hashHex;
}

/**
 * Upload file to Cloudinary using fetch API (Workers compatible)
 * @param fileBuffer - File buffer to upload
 * @param options - Upload options
 * @returns Promise with upload result
 */
export async function uploadToCloudinary(
  fileBuffer: ArrayBuffer,
  options: CloudinaryUploadOptions = {}
): Promise<CloudinaryUploadResult> {
  if (!cloudinaryConfig) {
    throw new Error('Cloudinary not initialized. Call initializeCloudinary() first.');
  }

  try {
    // Prepare upload parameters (only include parameters that should be signed)
    const timestamp = Math.round(Date.now() / 1000);
    const params: Record<string, any> = {
      timestamp,
      folder: options.folder || 'local-fishing',
      overwrite: options.overwrite || false,
    };

    // Note: resource_type is not included in signature for auto uploads

    if (options.public_id) {
      params.public_id = options.public_id;
    }

    if (options.tags && options.tags.length > 0) {
      params.tags = options.tags.join(',');
    }

    // Generate signature
    console.log('📋 Upload parameters for signature:', params);
    const signature = await generateSignature(params, cloudinaryConfig.api_secret);

    // Create form data
    const formData = new FormData();

    // Add file
    const blob = new Blob([fileBuffer]);
    formData.append('file', blob);

    // Add signed parameters
    Object.keys(params).forEach(key => {
      formData.append(key, params[key].toString());
    });

    // Add additional parameters that are not signed
    formData.append('resource_type', options.resource_type || 'auto');
    formData.append('api_key', cloudinaryConfig.api_key);
    formData.append('signature', signature);

    // Upload to Cloudinary
    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloud_name}/upload`;

    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Cloudinary API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json() as any;

    if (result.error) {
      throw new Error(`Cloudinary upload error: ${result.error.message}`);
    }

    return {
      public_id: result.public_id,
      secure_url: result.secure_url,
      url: result.url,
      resource_type: result.resource_type,
      format: result.format,
      bytes: result.bytes,
      width: result.width,
      height: result.height,
      created_at: result.created_at,
    };

  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error(`Failed to upload file to Cloudinary: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Delete file from Cloudinary using fetch API (Workers compatible)
 * @param publicId - Public ID of the file to delete
 * @param resourceType - Resource type (image, video, raw)
 * @returns Promise with deletion result
 */
export async function deleteFromCloudinary(
  publicId: string,
  resourceType: 'image' | 'video' | 'raw' = 'image'
): Promise<{ result: string }> {
  if (!cloudinaryConfig) {
    throw new Error('Cloudinary not initialized. Call initializeCloudinary() first.');
  }

  try {
    const timestamp = Math.round(Date.now() / 1000);
    const params = {
      public_id: publicId,
      timestamp,
    };

    const signature = await generateSignature(params, cloudinaryConfig.api_secret);

    const formData = new FormData();
    formData.append('public_id', publicId);
    formData.append('timestamp', timestamp.toString());
    formData.append('api_key', cloudinaryConfig.api_key);
    formData.append('signature', signature);

    const deleteUrl = `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloud_name}/${resourceType}/destroy`;

    const response = await fetch(deleteUrl, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Cloudinary API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json() as any;

    return { result: result.result || 'ok' };
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw new Error(`Failed to delete file from Cloudinary: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate optimized URL for image display (Workers compatible)
 * @param publicId - Public ID of the image
 * @param options - Transformation options
 * @returns Optimized image URL
 */
export function generateOptimizedUrl(
  publicId: string,
  options: {
    width?: number;
    height?: number;
    crop?: string;
    quality?: string | number;
    format?: string;
  } = {}
): string {
  if (!cloudinaryConfig) {
    throw new Error('Cloudinary not initialized. Call initializeCloudinary() first.');
  }

  try {
    // Build transformation string
    const transformations: string[] = [];

    if (options.width) transformations.push(`w_${options.width}`);
    if (options.height) transformations.push(`h_${options.height}`);
    if (options.crop) transformations.push(`c_${options.crop}`);
    if (options.quality) transformations.push(`q_${options.quality}`);
    if (options.format) transformations.push(`f_${options.format}`);

    const transformationString = transformations.length > 0 ? `/${transformations.join(',')}` : '';

    return `https://res.cloudinary.com/${cloudinaryConfig.cloud_name}/image/upload${transformationString}/${publicId}`;
  } catch (error) {
    console.error('Error generating optimized URL:', error);
    throw new Error('Failed to generate optimized URL');
  }
}

/**
 * Generate thumbnail URL for image
 * @param publicId - Public ID of the image
 * @param size - Thumbnail size (default: 150x150)
 * @returns Thumbnail URL
 */
export function generateThumbnailUrl(
  publicId: string,
  size: number = 150
): string {
  return generateOptimizedUrl(publicId, {
    width: size,
    height: size,
    crop: 'fill',
    quality: 'auto',
  });
}

/**
 * Validate file type for upload
 * @param fileType - MIME type of the file
 * @param allowedTypes - Array of allowed MIME types
 * @returns Boolean indicating if file type is allowed
 */
export function validateFileType(
  fileType: string,
  allowedTypes: string[] = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
  ]
): boolean {
  return allowedTypes.includes(fileType);
}

/**
 * Validate file size
 * @param fileSize - Size of the file in bytes
 * @param maxSize - Maximum allowed size in bytes (default: 10MB)
 * @returns Boolean indicating if file size is allowed
 */
export function validateFileSize(
  fileSize: number,
  maxSize: number = 10 * 1024 * 1024 // 10MB
): boolean {
  return fileSize <= maxSize;
}

/**
 * Get file extension from MIME type
 * @param mimeType - MIME type of the file
 * @returns File extension
 */
export function getFileExtension(mimeType: string): string {
  const mimeToExt: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'application/pdf': 'pdf',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'text/plain': 'txt',
  };

  return mimeToExt[mimeType] || 'bin';
}

/**
 * Generate unique filename
 * @param originalName - Original filename
 * @param prefix - Optional prefix
 * @returns Unique filename
 */
export function generateUniqueFilename(
  originalName: string,
  prefix: string = ''
): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split('.').pop() || '';
  
  return `${prefix}${prefix ? '_' : ''}${timestamp}_${random}.${extension}`;
}
