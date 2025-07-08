/**
 * Folder Routes
 * Handles folder management endpoints for document organization
 */

import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/auth.js';
import { supabaseClient } from '../config/supabase-client.js';
import type { CreateFolderInput } from '../types/database.js';
import type { AuthenticatedRequest } from '../types/api.js';

const router = Router();

/**
 * @route   GET /api/folders
 * @desc    Get all folders for the authenticated user
 * @access  Private
 */
router.get('/', authenticate, requirePermission('view_files'), async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.user_id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
        error: 'AUTHENTICATION_ERROR',
        timestamp: new Date(),
      });
    }

    // Fetch folders from database
    const { data: folders, error } = await supabaseClient
      .from('folders')
      .select('folder_id, folder_name, description, color, icon, file_count, total_size, created_by')
      .eq('created_by', userId)
      .order('folder_name', { ascending: true });

    if (error) {
      console.error('Database error fetching folders:', error);
      throw error;
    }

    return res.json({
      success: true,
      message: 'Folders retrieved successfully',
      data: folders || [],
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error fetching folders:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch folders',
      error: 'FETCH_FOLDERS_ERROR',
      timestamp: new Date(),
    });
  }
});

/**
 * @route   POST /api/folders
 * @desc    Create a new folder
 * @access  Private
 */
router.post('/', authenticate, requirePermission('upload_files'), async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.user_id;
    const { folder_name, description, color, icon }: CreateFolderInput = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
        error: 'AUTHENTICATION_ERROR',
        timestamp: new Date(),
      });
    }

    // Validate required fields
    if (!folder_name || folder_name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Folder name is required',
        error: 'VALIDATION_ERROR',
        timestamp: new Date(),
      });
    }

    // Check if folder with same name already exists for this user
    const { data: existingFolder } = await supabaseClient
      .from('folders')
      .select('folder_id')
      .eq('folder_name', folder_name.trim())
      .eq('created_by', userId)
      .single();

    if (existingFolder) {
      return res.status(409).json({
        success: false,
        message: 'A folder with this name already exists',
        error: 'FOLDER_EXISTS',
        timestamp: new Date(),
      });
    }

    // Create new folder
    const folderData: CreateFolderInput = {
      folder_name: folder_name.trim(),
      ...(description?.trim() && { description: description.trim() }),
      color: color || '#3B82F6', // Default blue color
      icon: icon || 'folder', // Default folder icon
      created_by: userId,
    };

    const { data: newFolder, error } = await supabaseClient
      .from('folders')
      .insert(folderData)
      .select('folder_id, folder_name, description, color, icon, file_count, total_size, created_by')
      .single();

    if (error) {
      console.error('Database error creating folder:', error);
      throw error;
    }

    return res.status(201).json({
      success: true,
      message: 'Folder created successfully',
      data: newFolder,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error creating folder:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create folder',
      error: 'CREATE_FOLDER_ERROR',
      timestamp: new Date(),
    });
  }
});

/**
 * @route   PUT /api/folders/:id
 * @desc    Update an existing folder
 * @access  Private
 */
router.put('/:id', authenticate, requirePermission('upload_files'), async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.user_id;
    const folderId = req.params.id;
    const { folder_name, description, color, icon } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
        error: 'AUTHENTICATION_ERROR',
        timestamp: new Date(),
      });
    }

    // Validate folder ID
    if (!folderId) {
      return res.status(400).json({
        success: false,
        message: 'Folder ID is required',
        error: 'VALIDATION_ERROR',
        timestamp: new Date(),
      });
    }

    // Check if folder exists and belongs to user
    const { data: existingFolder } = await supabaseClient
      .from('folders')
      .select('folder_id, created_by')
      .eq('folder_id', folderId)
      .eq('created_by', userId)
      .single();

    if (!existingFolder) {
      return res.status(404).json({
        success: false,
        message: 'Folder not found or access denied',
        error: 'FOLDER_NOT_FOUND',
        timestamp: new Date(),
      });
    }

    // Prepare update data
    const updateData: Partial<CreateFolderInput> = {};
    if (folder_name && folder_name.trim() !== '') {
      updateData.folder_name = folder_name.trim();
    }
    if (description !== undefined) {
      updateData.description = description?.trim() || null;
    }
    if (color) {
      updateData.color = color;
    }
    if (icon) {
      updateData.icon = icon;
    }

    // Update folder
    const { data: updatedFolder, error } = await supabaseClient
      .from('folders')
      .update(updateData)
      .eq('folder_id', folderId)
      .eq('created_by', userId)
      .select('folder_id, folder_name, description, color, icon, file_count, total_size, created_by')
      .single();

    if (error) {
      console.error('Database error updating folder:', error);
      throw error;
    }

    return res.json({
      success: true,
      message: 'Folder updated successfully',
      data: updatedFolder,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error updating folder:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update folder',
      error: 'UPDATE_FOLDER_ERROR',
      timestamp: new Date(),
    });
  }
});

/**
 * @route   DELETE /api/folders/:id
 * @desc    Delete a folder (only if it's empty)
 * @access  Private
 */
router.delete('/:id', authenticate, requirePermission('upload_files'), async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.user_id;
    const folderId = req.params.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
        error: 'AUTHENTICATION_ERROR',
        timestamp: new Date(),
      });
    }

    // Validate folder ID
    if (!folderId) {
      return res.status(400).json({
        success: false,
        message: 'Folder ID is required',
        error: 'VALIDATION_ERROR',
        timestamp: new Date(),
      });
    }

    // Check if folder exists and belongs to user
    const { data: existingFolder } = await supabaseClient
      .from('folders')
      .select('folder_id, file_count, created_by')
      .eq('folder_id', folderId)
      .eq('created_by', userId)
      .single();

    if (!existingFolder) {
      return res.status(404).json({
        success: false,
        message: 'Folder not found or access denied',
        error: 'FOLDER_NOT_FOUND',
        timestamp: new Date(),
      });
    }

    // Check if folder is empty
    if (existingFolder.file_count > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete folder that contains files. Please move or delete all files first.',
        error: 'FOLDER_NOT_EMPTY',
        timestamp: new Date(),
      });
    }

    // Delete folder
    const { error } = await supabaseClient
      .from('folders')
      .delete()
      .eq('folder_id', folderId)
      .eq('created_by', userId);

    if (error) {
      console.error('Database error deleting folder:', error);
      throw error;
    }

    return res.json({
      success: true,
      message: 'Folder deleted successfully',
      data: { folder_id: folderId },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error deleting folder:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete folder',
      error: 'DELETE_FOLDER_ERROR',
      timestamp: new Date(),
    });
  }
});

/**
 * @route   GET /api/folders/:id
 * @desc    Get a specific folder by ID
 * @access  Private
 */
router.get('/:id', authenticate, requirePermission('view_files'), async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.user_id;
    const folderId = req.params.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
        error: 'AUTHENTICATION_ERROR',
        timestamp: new Date(),
      });
    }

    // Validate folder ID
    if (!folderId) {
      return res.status(400).json({
        success: false,
        message: 'Folder ID is required',
        error: 'VALIDATION_ERROR',
        timestamp: new Date(),
      });
    }

    // Fetch folder from database
    const { data: folder, error } = await supabaseClient
      .from('folders')
      .select('folder_id, folder_name, description, color, icon, file_count, total_size, created_by')
      .eq('folder_id', folderId)
      .eq('created_by', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'Folder not found or access denied',
          error: 'FOLDER_NOT_FOUND',
          timestamp: new Date(),
        });
      }
      console.error('Database error fetching folder:', error);
      throw error;
    }

    return res.json({
      success: true,
      message: 'Folder retrieved successfully',
      data: folder,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error fetching folder:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch folder',
      error: 'FETCH_FOLDER_ERROR',
      timestamp: new Date(),
    });
  }
});

export default router;
