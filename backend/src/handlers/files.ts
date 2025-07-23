/**
 * Files handlers for file management
 * Provides endpoints for uploading, managing, and organizing files with Cloudinary integration
 */

import { z } from 'zod';
import type { HonoContext, PaginationParams } from '../types/index';
import {
  createSuccessResponse,
  createErrorResponse,
  createValidationErrorResponse,
  createNotFoundResponse,
  createPaginatedResponse,
  calculatePagination,
} from '../utils/response';
import {
  applyPagination,
  applySearch,
} from '../utils/db';
import {
  initializeCloudinary,
  uploadToCloudinary,
  deleteFromCloudinary,
  validateFileType,
  validateFileSize,
  generateUniqueFilename,
} from '../utils/cloudinary';
import {
  getUserIdFromContext,
  createUserFilteredQuery,
  addUserIdToInsertData,
  validateUserIdInUpdateData,
} from '../middleware/data-isolation';

// Validation schemas - Updated to match database schema
const getFilesQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sortBy: z.enum(['file_name', 'upload_date', 'file_size']).default('upload_date'), // upload_date exists in schema
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().optional(),
  folder_id: z.string().uuid().optional(),
});

const uploadFileSchema = z.object({
  folder_id: z.string().uuid('Invalid folder ID'),
  description: z.string().max(500, 'Description too long').optional(),
});

const updateFileSchema = z.object({
  file_name: z.string().min(1).max(255).optional(),
  description: z.string().max(500).optional(),
  folder_id: z.string().uuid().optional(),
});

/**
 * Get all files with pagination and search
 */
export const getFilesHandler = async (c: HonoContext) => {
  try {
    const queryParams = c.req.query();

    const validation = getFilesQuerySchema.safeParse(queryParams);
    if (!validation.success) {
      const errors = validation.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return c.json(createValidationErrorResponse(errors, c.get('requestId')), 400);
    }

    const { page, limit, sortBy, sortOrder, search, folder_id } = validation.data;

    // Build query with data isolation - Get files for the authenticated user
    let query = createUserFilteredQuery(c, 'files', `
      *,
      folders!inner (
        folder_id,
        folder_name,
        user_id
      )
    `);

    // Filter by folder if specified
    if (folder_id) {
      query = query.eq('folder_id', folder_id);
    }

    // Apply search if specified
    if (search) {
      query = applySearch(query, search, ['file_name', 'description']);
    }

    // Get total count for pagination using data isolation
    const userId = getUserIdFromContext(c);
    const countQuery = c.get('supabase')
      .from('files')
      .select('file_id', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (folder_id) {
      countQuery.eq('folder_id', folder_id);
    }

    const { count: totalCount, error: countError } = await countQuery;

    if (countError) {
      throw new Error(`Failed to get file count: ${countError.message}`);
    }

    // Apply pagination
    query = applyPagination(query, { page, limit, sortBy, sortOrder });

    const { data: files, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch files: ${error.message}`);
    }

    const pagination = calculatePagination(page, limit, totalCount || 0);

    return createPaginatedResponse(
      files || [],
      pagination,
      c.get('requestId')
    );

  } catch (error) {
    console.error('Get files error:', error);
    return c.json(createErrorResponse('Failed to retrieve files', 500, { error: error instanceof Error ? error.message : 'Unknown error' }, c.get('requestId')), 500);
  }
};

/**
 * Get files by folder ID
 */
export const getFilesByFolderHandler = async (c: HonoContext) => {
  try {
    const folderId = c.req.query('folder_id');

    if (!folderId) {
      return c.json(createErrorResponse('Folder ID is required', 400, undefined, c.get('requestId')), 400);
    }

    // Get files from the specified folder with data isolation
    const { data: files, error } = await createUserFilteredQuery(c, 'files', `
      *,
      folders!inner (
        folder_id,
        folder_name,
        user_id
      )
    `)
      .eq('folder_id', folderId);

    if (error) {
      throw new Error(`Failed to fetch files: ${error.message}`);
    }

    return c.json(createSuccessResponse(files || [], 'Files retrieved successfully', c.get('requestId')));

  } catch (error) {
    console.error('Get files by folder error:', error);
    return c.json(createErrorResponse('Failed to retrieve files', 500, { error: error instanceof Error ? error.message : 'Unknown error' }, c.get('requestId')), 500);
  }
};

/**
 * Get a specific file by ID
 */
export const getFileHandler = async (c: HonoContext) => {
  try {
    const id = c.req.param('id');

    if (!id) {
      return c.json(createErrorResponse('File ID is required', 400, undefined, c.get('requestId')), 400);
    }

    // Get file from database with data isolation
    const { data: file, error } = await createUserFilteredQuery(c, 'files', `
      *,
      folders!inner (
        folder_id,
        folder_name,
        user_id
      )
    `)
      .eq('file_id', id)
      .single();

    if (error && error.code === 'PGRST116') {
      return c.json(createNotFoundResponse('File', c.get('requestId')), 404);
    }

    if (error) {
      throw new Error(`Failed to fetch file: ${error.message}`);
    }

    return c.json(createSuccessResponse(file, 'File retrieved successfully', c.get('requestId')));

  } catch (error) {
    console.error('Get file error:', error);
    return c.json(createErrorResponse('Failed to retrieve file', 500, { error: error instanceof Error ? error.message : 'Unknown error' }, c.get('requestId')), 500);
  }
};

/**
 * Upload a single file with Cloudinary integration
 */
export const uploadSingleFileHandler = async (c: HonoContext) => {
  try {
    const user = c.get('user');
    if (!user) {
      return c.json(createErrorResponse('User not authenticated', 401, undefined, c.get('requestId')), 401);
    }

    // Parse form data
    const formData = await c.req.formData();
    const file = formData.get('file') as File | null;
    const folderId = formData.get('folder_id') as string | null;
    const description = formData.get('description') as string | null;

    if (!file) {
      return c.json(createErrorResponse('No file provided', 400, undefined, c.get('requestId')), 400);
    }

    if (!folderId) {
      return c.json(createErrorResponse('Folder ID is required', 400, undefined, c.get('requestId')), 400);
    }

    // Validate folder exists and belongs to user using data isolation
    const { data: folder, error: folderError } = await createUserFilteredQuery(c, 'folders', 'folder_id, file_count, total_size')
      .eq('folder_id', folderId)
      .single();

    if (folderError && folderError.code === 'PGRST116') {
      return c.json(createErrorResponse('Folder not found', 404, undefined, c.get('requestId')), 404);
    }

    if (folderError) {
      throw new Error(`Failed to validate folder: ${folderError.message}`);
    }

    // Validate file type and size
    if (!validateFileType(file.type)) {
      return c.json(createErrorResponse('Invalid file type', 400, { error: 'File type not supported' }, c.get('requestId')), 400);
    }

    if (!validateFileSize(file.size)) {
      return c.json(createErrorResponse('File too large', 400, { error: 'File size exceeds 10MB limit' }, c.get('requestId')), 400);
    }

    // Check if Cloudinary credentials are available
    if (!c.env.CLOUDINARY_CLOUD_NAME || !c.env.CLOUDINARY_API_KEY || !c.env.CLOUDINARY_API_SECRET) {
      return c.json(createErrorResponse('Cloudinary not configured', 500, { error: 'File upload service not available' }, c.get('requestId')), 500);
    }

    // Initialize Cloudinary
    initializeCloudinary({
      cloud_name: c.env.CLOUDINARY_CLOUD_NAME,
      api_key: c.env.CLOUDINARY_API_KEY,
      api_secret: c.env.CLOUDINARY_API_SECRET,
    });

    // Upload to Cloudinary
    const fileBuffer = await file.arrayBuffer();
    const uniqueFilename = generateUniqueFilename(file.name, 'document');

    const cloudinaryResult = await uploadToCloudinary(fileBuffer, {
      folder: 'local-fishing/documents',
      public_id: uniqueFilename,
      resource_type: 'auto',
      tags: ['document', 'local-fishing'],
    });

    // Insert file record into database with data isolation
    const userId = getUserIdFromContext(c);
    const fileData = addUserIdToInsertData(c, {
      file_name: file.name,
      file_url: cloudinaryResult.secure_url, // Use Cloudinary secure URL
      cloudinary_public_id: cloudinaryResult.public_id,
      cloudinary_url: cloudinaryResult.url,
      cloudinary_secure_url: cloudinaryResult.secure_url,
      cloudinary_resource_type: cloudinaryResult.resource_type,
      file_type: file.type,
      file_size: file.size,
      folder_id: folderId,
      description: description || null,
      upload_date: new Date().toISOString(),
      added_by: userId,
    });

    const { data: newFile, error: insertError } = await c.get('supabase')
      .from('files')
      .insert(fileData)
      .select('*')
      .single();

    if (insertError) {
      throw new Error(`Failed to save file record: ${insertError.message}`);
    }

    // Update folder file count with data isolation
    await c.get('supabase')
      .from('folders')
      .update({
        file_count: folder.file_count + 1,
        total_size: folder.total_size + file.size
      })
      .eq('folder_id', folderId)
      .eq('user_id', userId);

    return c.json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        file: newFile,
        metadata: {
          size: file.size,
          type: file.type,
          originalName: file.name,
        }
      },
      timestamp: new Date().toISOString(),
      requestId: c.get('requestId'),
    }, 201);

  } catch (error) {
    console.error('Upload file error:', error);
    return c.json(createErrorResponse('Failed to upload file', 500, { error: error instanceof Error ? error.message : 'Unknown error' }, c.get('requestId')), 500);
  }
};

/**
 * Upload multiple files
 */
export const uploadMultipleFilesHandler = async (c: HonoContext) => {
  try {
    // TODO: Implement actual multiple file upload
    return c.json(createErrorResponse('Multiple file upload not implemented yet', 501, undefined, c.get('requestId')), 501);
  } catch (error) {
    console.error('Upload multiple files error:', error);
    return c.json(createErrorResponse('Failed to upload files', 500, { error: error instanceof Error ? error.message : 'Unknown error' }, c.get('requestId')), 500);
  }
};

/**
 * Delete a file
 */
export const deleteFileHandler = async (c: HonoContext) => {
  try {
    const id = c.req.param('id');
    console.log('🗑️ deleteFileHandler called for file ID:', id);

    if (!id) {
      console.log('❌ No file ID provided');
      return c.json(createErrorResponse('File ID is required', 400, undefined, c.get('requestId')), 400);
    }

    const user = c.get('user');
    console.log('👤 User attempting deletion:', user ? { id: user.id, email: user.email } : 'NO USER');

    // First, get the file details to get Cloudinary public_id using data isolation
    console.log('🔍 Fetching file details for deletion...');
    const { data: file, error: fetchError } = await createUserFilteredQuery(c, 'files', `
      file_id,
      cloudinary_public_id,
      cloudinary_resource_type,
      file_size,
      folder_id,
      folders!inner (
        user_id
      )
    `)
      .eq('file_id', id)
      .single();

    console.log('📊 File fetch result:', {
      file: file ? { file_id: file.file_id, has_cloudinary_id: !!file.cloudinary_public_id } : null,
      error: fetchError ? { code: fetchError.code, message: fetchError.message } : null
    });

    if (fetchError && fetchError.code === 'PGRST116') {
      console.log('❌ File not found (404)');
      return c.json(createNotFoundResponse('File', c.get('requestId')), 404);
    }

    if (fetchError) {
      console.error('💥 Failed to fetch file:', fetchError);
      throw new Error(`Failed to fetch file: ${fetchError.message}`);
    }

    // Delete from Cloudinary if public_id exists
    if (file.cloudinary_public_id && c.env.CLOUDINARY_CLOUD_NAME) {
      try {
        initializeCloudinary({
          cloud_name: c.env.CLOUDINARY_CLOUD_NAME,
          api_key: c.env.CLOUDINARY_API_KEY!,
          api_secret: c.env.CLOUDINARY_API_SECRET!,
        });

        await deleteFromCloudinary(
          file.cloudinary_public_id,
          file.cloudinary_resource_type as 'image' | 'video' | 'raw' || 'image'
        );
      } catch (cloudinaryError) {
        console.warn('Failed to delete from Cloudinary:', cloudinaryError);
        // Continue with database deletion even if Cloudinary deletion fails
      }
    }

    // Delete file from database with data isolation
    console.log('🗑️ Deleting file from database...');
    const userId = getUserIdFromContext(c);
    const { error: deleteError } = await c.get('supabase')
      .from('files')
      .delete()
      .eq('file_id', id)
      .eq('user_id', userId);

    if (deleteError) {
      console.error('💥 Database deletion failed:', deleteError);
      throw new Error(`Failed to delete file from database: ${deleteError.message}`);
    }

    console.log('✅ File deleted successfully from database');
    return c.json(createSuccessResponse(
      { message: 'File deleted successfully', file_id: id },
      'File deleted successfully',
      c.get('requestId')
    ));

  } catch (error) {
    console.error('Delete file error:', error);
    return c.json(createErrorResponse('Failed to delete file', 500, { error: error instanceof Error ? error.message : 'Unknown error' }, c.get('requestId')), 500);
  }
};

/**
 * Upload file handler (alias for uploadSingleFileHandler)
 */
export const uploadFileHandler = uploadSingleFileHandler;

/**
 * Update file metadata
 */
export const updateFileHandler = async (c: HonoContext) => {
  try {
    const id = c.req.param('id');

    if (!id) {
      return c.json(createValidationErrorResponse(
        [{ field: 'id', message: 'File ID is required' }],
        c.get('requestId')
      ), 400);
    }

    const body = await c.req.json();

    const validation = updateFileSchema.safeParse(body);
    if (!validation.success) {
      const errors = validation.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return c.json(createValidationErrorResponse(errors, c.get('requestId')), 400);
    }

    // Validate user_id in update data for data isolation
    const validatedUpdateData = validateUserIdInUpdateData(c, validation.data);

    // Update file metadata in database with data isolation
    const userId = getUserIdFromContext(c);
    const { data: updatedFile, error } = await c.get('supabase')
      .from('files')
      .update(validatedUpdateData)
      .eq('file_id', id)
      .eq('user_id', userId) // Ensure user owns the file
      .select('*')
      .single();

    if (error) {
      throw new Error(`Failed to update file: ${error.message}`);
    }

    return c.json(createSuccessResponse(
      updatedFile,
      'File metadata updated successfully',
      c.get('requestId')
    ));

  } catch (error) {
    console.error('Update file error:', error);
    return c.json(createErrorResponse(
      'Failed to update file metadata',
      500,
      { error: error instanceof Error ? error.message : 'Unknown error' },
      c.get('requestId')
    ), 500);
  }
};
