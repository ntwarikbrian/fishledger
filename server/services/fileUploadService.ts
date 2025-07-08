/**
 * File Upload Service
 * Handles file uploads to Cloudinary and database operations
 */

import { supabaseClient } from '../config/supabase-client.js';
import {
  uploadToCloudinary,
  deleteFromCloudinary,
  CloudinaryUploadOptions
} from '../config/cloudinary.js';
import {
  parseFileError,
  logFileError
} from '../utils/fileErrorHandler.js';
import type {
  CreateFileInput,
  File as FileRecord,
  CloudinaryUploadResponse
} from '../types/database.js';

/**
 * File upload result interface
 */
export interface FileUploadResult {
  success: boolean;
  file?: FileRecord;
  error?: string;
  cloudinaryResult?: CloudinaryUploadResponse;
}

/**
 * File upload input interface
 */
export interface FileUploadInput {
  file: Express.Multer.File;
  folderId: string;
  userId: string;
  description?: string;
  customOptions?: Partial<CloudinaryUploadOptions>;
}

/**
 * Upload file to Cloudinary and save to database
 * @param input - File upload input data
 * @returns Promise with upload result
 */
export const uploadFile = async (input: FileUploadInput): Promise<FileUploadResult> => {
  const { file, folderId, userId, description, customOptions = {} } = input;

  try {
    // Validate file
    if (!file || !file.buffer) {
      return {
        success: false,
        error: 'No file provided or file buffer is empty',
      };
    }

    // Validate folder exists
    const { data: folder, error: folderError } = await supabaseClient
      .from('folders')
      .select('folder_id, folder_name')
      .eq('folder_id', folderId)
      .single();

    if (folderError || !folder) {
      return {
        success: false,
        error: 'Invalid folder ID or folder does not exist',
      };
    }

    // Use simple, reliable upload options to avoid Cloudinary transformation errors
    const uploadOptions: CloudinaryUploadOptions = {
      folder: `documents/${folder.folder_name.toLowerCase().replace(/\s+/g, '_')}`,
      resource_type: file.mimetype.startsWith('image/') ? 'image' : 'raw',
      tags: ['document', folder.folder_name.toLowerCase()],
      overwrite: false,
      unique_filename: true,
      use_filename: true,
      // Remove any problematic transformation or format options
      ...customOptions,
    };

    // Upload to Cloudinary with fallback for transformation errors
    let cloudinaryResult;
    try {
      cloudinaryResult = await uploadToCloudinary(file.buffer, uploadOptions);
    } catch (error: any) {
      // If upload fails due to transformation error, try with minimal options
      if (error.message && error.message.includes('transformation')) {
        console.log('Retrying upload with minimal options due to transformation error');
        const minimalOptions: CloudinaryUploadOptions = {
          folder: `documents/${folder.folder_name.toLowerCase().replace(/\s+/g, '_')}`,
          resource_type: file.mimetype.startsWith('image/') ? 'image' : 'raw',
          overwrite: false,
          unique_filename: true,
        };
        cloudinaryResult = await uploadToCloudinary(file.buffer, minimalOptions);
      } else {
        throw error; // Re-throw if it's not a transformation error
      }
    }

    if (!cloudinaryResult) {
      return {
        success: false,
        error: 'Failed to upload file to Cloudinary',
      };
    }

    // Prepare file data for database
    const fileData: CreateFileInput = {
      file_name: file.originalname,
      file_url: cloudinaryResult.secure_url,
      cloudinary_public_id: cloudinaryResult.public_id,
      cloudinary_url: cloudinaryResult.url,
      cloudinary_secure_url: cloudinaryResult.secure_url,
      file_type: file.mimetype,
      cloudinary_resource_type: cloudinaryResult.resource_type,
      folder_id: folderId,
      file_size: cloudinaryResult.bytes,
      added_by: userId,
    };

    // Add description only if provided
    if (description && description.trim()) {
      fileData.description = description.trim();
    }

    // Save to database
    const { data: savedFile, error: dbError } = await supabaseClient
      .from('files')
      .insert(fileData)
      .select('*')
      .single();

    if (dbError) {
      // If database save fails, try to delete from Cloudinary
      try {
        await deleteFromCloudinary(
          cloudinaryResult.public_id, 
          cloudinaryResult.resource_type
        );
      } catch (cleanupError) {
        console.error('Failed to cleanup Cloudinary file after database error:', cleanupError);
      }

      return {
        success: false,
        error: `Database error: ${dbError.message}`,
      };
    }

    return {
      success: true,
      file: savedFile,
      cloudinaryResult,
    };

  } catch (error) {
    const fileError = parseFileError(error);
    logFileError('upload', fileError, { folderId, userId, fileName: file.originalname });

    return {
      success: false,
      error: fileError.userMessage,
    };
  }
};

/**
 * Upload multiple files
 * @param files - Array of file upload inputs
 * @returns Promise with array of upload results
 */
export const uploadMultipleFiles = async (
  files: FileUploadInput[]
): Promise<FileUploadResult[]> => {
  const results: FileUploadResult[] = [];

  for (const fileInput of files) {
    const result = await uploadFile(fileInput);
    results.push(result);
  }

  return results;
};

/**
 * Delete file from both Cloudinary and database
 * @param fileId - Database file ID
 * @param userId - User ID for authorization
 * @returns Promise with deletion result
 */
export const deleteFile = async (
  fileId: string, 
  userId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Get file from database
    const { data: file, error: fetchError } = await supabaseClient
      .from('files')
      .select('*')
      .eq('file_id', fileId)
      .eq('added_by', userId) // Ensure user owns the file
      .single();

    if (fetchError || !file) {
      return {
        success: false,
        error: 'File not found or access denied',
      };
    }

    // Delete from Cloudinary if public_id exists
    if (file.cloudinary_public_id) {
      try {
        await deleteFromCloudinary(
          file.cloudinary_public_id,
          file.cloudinary_resource_type || 'auto'
        );
      } catch (cloudinaryError) {
        console.error('Failed to delete from Cloudinary:', cloudinaryError);
        // Continue with database deletion even if Cloudinary fails
      }
    }

    // Delete from database
    const { error: deleteError } = await supabaseClient
      .from('files')
      .delete()
      .eq('file_id', fileId)
      .eq('added_by', userId);

    if (deleteError) {
      return {
        success: false,
        error: `Database deletion error: ${deleteError.message}`,
      };
    }

    return { success: true };

  } catch (error) {
    const fileError = parseFileError(error);
    logFileError('delete', fileError, { fileId, userId });

    return {
      success: false,
      error: fileError.userMessage,
    };
  }
};

/**
 * Get files by folder
 * @param folderId - Folder ID
 * @param userId - User ID for authorization
 * @returns Promise with files array
 */
export const getFilesByFolder = async (
  folderId: string,
  userId: string
): Promise<{ success: boolean; files?: FileRecord[]; error?: string }> => {
  try {
    const { data: files, error } = await supabaseClient
      .from('files')
      .select('*')
      .eq('folder_id', folderId)
      .eq('added_by', userId)
      .order('upload_date', { ascending: false });

    if (error) {
      return {
        success: false,
        error: `Database error: ${error.message}`,
      };
    }

    return {
      success: true,
      files: files || [],
    };

  } catch (error) {
    console.error('Get files error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Get file by ID
 * @param fileId - File ID
 * @param userId - User ID for authorization
 * @returns Promise with file data
 */
export const getFileById = async (
  fileId: string,
  userId: string
): Promise<{ success: boolean; file?: FileRecord; error?: string }> => {
  try {
    const { data: file, error } = await supabaseClient
      .from('files')
      .select('*')
      .eq('file_id', fileId)
      .eq('added_by', userId)
      .single();

    if (error) {
      return {
        success: false,
        error: error.code === 'PGRST116' ? 'File not found' : `Database error: ${error.message}`,
      };
    }

    return {
      success: true,
      file,
    };

  } catch (error) {
    console.error('Get file error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
