/**
 * Workers Handler
 * Handles worker management operations including creation, authentication, and permissions
 */

import { Context } from 'hono';
import { createSupabaseClient } from '../config/supabase';
import { createCloudinaryService, CLOUDINARY_FOLDERS, validateFileType, validateFileSize } from '../config/cloudinary';
import { createSuccessResponse, createErrorResponse } from '../utils/response';
import type { Environment } from '../config/environment';

// Worker interfaces
export interface CreateWorkerRequest {
  full_name: string;
  email: string;
  password: string;
  phone_number?: string;
  monthly_salary?: number;
  id_card_front?: File;
  id_card_back?: File;
}

export interface UpdateWorkerRequest {
  full_name?: string;
  email?: string;
  phone_number?: string;
  monthly_salary?: number;
}

export interface WorkerPermissionRequest {
  worker_id: string;
  permissions: {
    [category: string]: {
      [permission: string]: boolean;
    };
  };
}

export interface Worker {
  worker_id: string;
  full_name: string;
  email: string;
  phone_number?: string;
  id_card_front_url?: string;
  id_card_back_url?: string;
  monthly_salary?: number;
  total_revenue_generated: number;
  recent_login_history?: any;
  created_at: string;
}

/**
 * Create a new worker account
 */
export async function createWorker(c: Context): Promise<Response> {
  try {
    const env = c.env as Environment;
    const supabase = createSupabaseClient(env);
    const cloudinary = createCloudinaryService(env);

    // Parse form data
    const formData = await c.req.formData();
    
    // Extract worker data
    const full_name = formData.get('full_name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const phone_number = formData.get('phone_number') as string;
    const monthly_salary = formData.get('monthly_salary') ? parseFloat(formData.get('monthly_salary') as string) : null;
    
    // Extract ID card files
    const id_card_front = formData.get('id_card_front') as File;
    const id_card_back = formData.get('id_card_back') as File;

    // Validate required fields
    if (!full_name || !email || !password) {
      return createErrorResponse('Missing required fields: full_name, email, password', 400);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return createErrorResponse('Invalid email format', 400);
    }

    // Validate ID card files
    if (!id_card_front || !id_card_back) {
      return createErrorResponse('Both front and back ID card images are required', 400);
    }

    // Validate file types and sizes
    const maxFileSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['jpg', 'jpeg', 'png', 'webp'];

    if (!validateFileType(id_card_front.name, allowedTypes) || !validateFileType(id_card_back.name, allowedTypes)) {
      return createErrorResponse('Invalid file type. Only JPG, PNG, and WebP files are allowed', 400);
    }

    if (!validateFileSize(id_card_front.size, maxFileSize) || !validateFileSize(id_card_back.size, maxFileSize)) {
      return createErrorResponse('File size too large. Maximum size is 5MB per file', 400);
    }

    // Check if worker email already exists
    const { data: existingWorker, error: checkError } = await supabase
      .from('workers')
      .select('email')
      .eq('email', email)
      .single();

    if (existingWorker) {
      return createErrorResponse('Worker with this email already exists', 409);
    }

    // Upload ID card images to Cloudinary
    let id_card_front_url = '';
    let id_card_back_url = '';

    try {
      // Convert files to buffers
      const frontBuffer = Buffer.from(await id_card_front.arrayBuffer());
      const backBuffer = Buffer.from(await id_card_back.arrayBuffer());

      // Upload front ID card
      const frontUpload = await cloudinary.uploadFile(frontBuffer, {
        folder: `${CLOUDINARY_FOLDERS.USERS}/id-cards`,
        public_id: `worker_${email.replace('@', '_at_')}_front_${Date.now()}`,
        resource_type: 'image',
        quality: 'auto:good',
        format: 'auto',
        tags: ['worker', 'id-card', 'front']
      });

      // Upload back ID card
      const backUpload = await cloudinary.uploadFile(backBuffer, {
        folder: `${CLOUDINARY_FOLDERS.USERS}/id-cards`,
        public_id: `worker_${email.replace('@', '_at_')}_back_${Date.now()}`,
        resource_type: 'image',
        quality: 'auto:good',
        format: 'auto',
        tags: ['worker', 'id-card', 'back']
      });

      id_card_front_url = frontUpload.secure_url;
      id_card_back_url = backUpload.secure_url;

    } catch (uploadError) {
      console.error('Cloudinary upload error:', uploadError);
      return createErrorResponse('Failed to upload ID card images', 500);
    }

    // Create worker record in database
    const { data: newWorker, error: insertError } = await supabase
      .from('workers')
      .insert({
        full_name,
        email,
        phone_number,
        id_card_front_url,
        id_card_back_url,
        monthly_salary,
        total_revenue_generated: 0
      })
      .select()
      .single();

    if (insertError) {
      console.error('Database insert error:', insertError);
      
      // Clean up uploaded images if database insert fails
      try {
        await cloudinary.deleteFile(frontUpload.public_id);
        await cloudinary.deleteFile(backUpload.public_id);
      } catch (cleanupError) {
        console.error('Failed to cleanup uploaded images:', cleanupError);
      }
      
      return createErrorResponse('Failed to create worker account', 500);
    }

    // Initialize default permissions for the worker
    const defaultPermissions = [
      { permission_name: 'view_products', permission_category: 'product_inventory', is_granted: false },
      { permission_name: 'view_sales', permission_category: 'sales', is_granted: false },
      { permission_name: 'view_transactions', permission_category: 'transactions', is_granted: false },
      { permission_name: 'view_expenses', permission_category: 'expenses', is_granted: false }
    ];

    // Get current user ID for granted_by field
    const authHeader = c.req.header('Authorization');
    let currentUserId = null;
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      currentUserId = user?.id;
    }

    if (currentUserId) {
      const permissionsToInsert = defaultPermissions.map(perm => ({
        worker_id: newWorker.worker_id,
        granted_by: currentUserId,
        ...perm
      }));

      await supabase
        .from('worker_permissions')
        .insert(permissionsToInsert);
    }

    // Remove sensitive data from response
    const { ...workerResponse } = newWorker;

    return createSuccessResponse({
      message: 'Worker account created successfully',
      worker: workerResponse
    }, 201);

  } catch (error) {
    console.error('Create worker error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

/**
 * Get all workers
 */
export async function getAllWorkers(c: Context): Promise<Response> {
  try {
    const env = c.env as Environment;
    const supabase = createSupabaseClient(env);

    const { data: workers, error } = await supabase
      .from('workers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database query error:', error);
      return createErrorResponse('Failed to fetch workers', 500);
    }

    return createSuccessResponse({
      workers: workers || []
    });

  } catch (error) {
    console.error('Get workers error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

/**
 * Get worker by ID
 */
export async function getWorkerById(c: Context): Promise<Response> {
  try {
    const env = c.env as Environment;
    const supabase = createSupabaseClient(env);
    const workerId = c.req.param('id');

    if (!workerId) {
      return createErrorResponse('Worker ID is required', 400);
    }

    const { data: worker, error } = await supabase
      .from('workers')
      .select('*')
      .eq('worker_id', workerId)
      .single();

    if (error || !worker) {
      return createErrorResponse('Worker not found', 404);
    }

    return createSuccessResponse({
      worker
    });

  } catch (error) {
    console.error('Get worker error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

/**
 * Update worker information
 */
export async function updateWorker(c: Context): Promise<Response> {
  try {
    const env = c.env as Environment;
    const supabase = createSupabaseClient(env);
    const workerId = c.req.param('id');

    if (!workerId) {
      return createErrorResponse('Worker ID is required', 400);
    }

    const updateData: UpdateWorkerRequest = await c.req.json();

    // Validate email format if provided
    if (updateData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(updateData.email)) {
        return createErrorResponse('Invalid email format', 400);
      }

      // Check if email is already taken by another worker
      const { data: existingWorker } = await supabase
        .from('workers')
        .select('worker_id')
        .eq('email', updateData.email)
        .neq('worker_id', workerId)
        .single();

      if (existingWorker) {
        return createErrorResponse('Email is already taken by another worker', 409);
      }
    }

    const { data: updatedWorker, error } = await supabase
      .from('workers')
      .update(updateData)
      .eq('worker_id', workerId)
      .select()
      .single();

    if (error) {
      console.error('Database update error:', error);
      return createErrorResponse('Failed to update worker', 500);
    }

    if (!updatedWorker) {
      return createErrorResponse('Worker not found', 404);
    }

    return createSuccessResponse({
      message: 'Worker updated successfully',
      worker: updatedWorker
    });

  } catch (error) {
    console.error('Update worker error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

/**
 * Delete worker
 */
export async function deleteWorker(c: Context): Promise<Response> {
  try {
    const env = c.env as Environment;
    const supabase = createSupabaseClient(env);
    const cloudinary = createCloudinaryService(env);
    const workerId = c.req.param('id');

    if (!workerId) {
      return createErrorResponse('Worker ID is required', 400);
    }

    // Get worker data to clean up images
    const { data: worker, error: fetchError } = await supabase
      .from('workers')
      .select('id_card_front_url, id_card_back_url')
      .eq('worker_id', workerId)
      .single();

    if (fetchError || !worker) {
      return createErrorResponse('Worker not found', 404);
    }

    // Delete worker from database (this will cascade delete permissions)
    const { error: deleteError } = await supabase
      .from('workers')
      .delete()
      .eq('worker_id', workerId);

    if (deleteError) {
      console.error('Database delete error:', deleteError);
      return createErrorResponse('Failed to delete worker', 500);
    }

    // Clean up Cloudinary images
    try {
      if (worker.id_card_front_url) {
        const frontPublicId = worker.id_card_front_url.split('/').pop()?.split('.')[0];
        if (frontPublicId) {
          await cloudinary.deleteFile(frontPublicId);
        }
      }

      if (worker.id_card_back_url) {
        const backPublicId = worker.id_card_back_url.split('/').pop()?.split('.')[0];
        if (backPublicId) {
          await cloudinary.deleteFile(backPublicId);
        }
      }
    } catch (cleanupError) {
      console.error('Failed to cleanup images:', cleanupError);
      // Don't fail the request if image cleanup fails
    }

    return createSuccessResponse({
      message: 'Worker deleted successfully'
    });

  } catch (error) {
    console.error('Delete worker error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

/**
 * Get worker permissions
 */
export async function getWorkerPermissions(c: Context): Promise<Response> {
  try {
    const env = c.env as Environment;
    const supabase = createSupabaseClient(env);
    const workerId = c.req.param('id');

    if (!workerId) {
      return createErrorResponse('Worker ID is required', 400);
    }

    const { data: permissions, error } = await supabase
      .from('worker_permissions')
      .select('*')
      .eq('worker_id', workerId);

    if (error) {
      console.error('Database query error:', error);
      return createErrorResponse('Failed to fetch worker permissions', 500);
    }

    // Group permissions by category
    const groupedPermissions: Record<string, Record<string, boolean>> = {};

    permissions?.forEach(perm => {
      if (!groupedPermissions[perm.permission_category]) {
        groupedPermissions[perm.permission_category] = {};
      }
      groupedPermissions[perm.permission_category][perm.permission_name] = perm.is_granted;
    });

    return createSuccessResponse({
      worker_id: workerId,
      permissions: groupedPermissions
    });

  } catch (error) {
    console.error('Get worker permissions error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

/**
 * Update worker permissions
 */
export async function updateWorkerPermissions(c: Context): Promise<Response> {
  try {
    const env = c.env as Environment;
    const supabase = createSupabaseClient(env);
    const workerId = c.req.param('id');

    if (!workerId) {
      return createErrorResponse('Worker ID is required', 400);
    }

    const { permissions }: WorkerPermissionRequest = await c.req.json();

    if (!permissions || typeof permissions !== 'object') {
      return createErrorResponse('Invalid permissions data', 400);
    }

    // Get current user ID for granted_by field
    const authHeader = c.req.header('Authorization');
    let currentUserId = null;

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      currentUserId = user?.id;
    }

    if (!currentUserId) {
      return createErrorResponse('Authentication required', 401);
    }

    // Prepare permission updates
    const permissionUpdates: any[] = [];

    Object.entries(permissions).forEach(([category, categoryPermissions]) => {
      Object.entries(categoryPermissions).forEach(([permission, isGranted]) => {
        permissionUpdates.push({
          worker_id: workerId,
          permission_name: permission,
          permission_category: category,
          is_granted: isGranted,
          granted_by: currentUserId
        });
      });
    });

    // Delete existing permissions for this worker
    await supabase
      .from('worker_permissions')
      .delete()
      .eq('worker_id', workerId);

    // Insert new permissions
    const { error: insertError } = await supabase
      .from('worker_permissions')
      .insert(permissionUpdates);

    if (insertError) {
      console.error('Database insert error:', insertError);
      return createErrorResponse('Failed to update worker permissions', 500);
    }

    return createSuccessResponse({
      message: 'Worker permissions updated successfully',
      worker_id: workerId,
      permissions
    });

  } catch (error) {
    console.error('Update worker permissions error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}
