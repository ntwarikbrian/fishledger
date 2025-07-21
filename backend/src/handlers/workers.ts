/**
 * Workers Handler
 * Handles worker management operations including creation, authentication, and permissions
 */

import { Context } from 'hono';
import { createSupabaseClient } from '../config/supabase';
import { initializeCloudinary, uploadToCloudinary, generateUniqueFilename, deleteFromCloudinary } from '../utils/cloudinary';
import { createSuccessResponse, createErrorResponse } from '../utils/response';
import type { Environment } from '../config/environment';
import bcrypt from 'bcryptjs';

// File validation utilities
function validateFileType(filename: string, allowedTypes: string[]): boolean {
  const extension = filename.split('.').pop()?.toLowerCase();
  return extension ? allowedTypes.includes(extension) : false;
}

function validateFileSize(size: number, maxSize: number): boolean {
  return size <= maxSize;
}

function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}



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
  password?: string; // Optional for responses (never send password in responses)
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

    // Initialize Cloudinary for Workers
    if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
      return createErrorResponse('Cloudinary configuration is missing', 500);
    }

    initializeCloudinary({
      cloud_name: env.CLOUDINARY_CLOUD_NAME,
      api_key: env.CLOUDINARY_API_KEY,
      api_secret: env.CLOUDINARY_API_SECRET,
    });

    // Parse form data
    const formData = await c.req.formData();
    
    // Extract worker data
    const full_name = formData.get('full_name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const phone_number = formData.get('phone_number') as string;
    const monthly_salary = formData.get('monthly_salary') ? parseFloat(formData.get('monthly_salary') as string) : null;
    
    // Extract ID card files (optional)
    const id_card_front = formData.get('id_card_front') as File | null;
    const id_card_back = formData.get('id_card_back') as File | null;

    // Validate required fields
    if (!full_name || !email || !password) {
      return createErrorResponse('Missing required fields: full_name, email, password', 400);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return createErrorResponse('Invalid email format', 400);
    }

    // Validate ID card files if provided
    const maxFileSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['jpg', 'jpeg', 'png', 'webp'];

    // Validate front ID card if provided
    if (id_card_front && id_card_front instanceof File) {
      if (!validateFileType(id_card_front.name, allowedTypes)) {
        return createErrorResponse('Invalid front ID card file type. Only JPG, PNG, and WebP files are allowed', 400);
      }
      if (!validateFileSize(id_card_front.size, maxFileSize)) {
        return createErrorResponse('Front ID card file size too large. Maximum size is 5MB', 400);
      }
    }

    // Validate back ID card if provided
    if (id_card_back && id_card_back instanceof File) {
      if (!validateFileType(id_card_back.name, allowedTypes)) {
        return createErrorResponse('Invalid back ID card file type. Only JPG, PNG, and WebP files are allowed', 400);
      }
      if (!validateFileSize(id_card_back.size, maxFileSize)) {
        return createErrorResponse('Back ID card file size too large. Maximum size is 5MB', 400);
      }
    }

    // Check if worker email already exists
    const { data: existingWorker } = await supabase
      .from('workers')
      .select('email')
      .eq('email', email)
      .single();

    if (existingWorker) {
      return createErrorResponse('Worker with this email already exists', 409);
    }

    // Hash the password before storing
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Upload ID card images to Cloudinary (optional)
    let id_card_front_url: string | null = null;
    let id_card_back_url: string | null = null;
    let frontUpload: any = null;
    let backUpload: any = null;

    try {
      // Upload front ID card if provided
      if (id_card_front && id_card_front instanceof File) {
        console.log('📤 Uploading front ID card...');
        const frontBuffer = await id_card_front.arrayBuffer();
        const frontFilename = generateUniqueFilename(id_card_front.name, 'worker_id_front');

        frontUpload = await uploadToCloudinary(frontBuffer, {
          folder: 'local-fishing/workers/id-cards',
          public_id: frontFilename,
          resource_type: 'image',
          tags: ['worker', 'id-card', 'front']
        });

        id_card_front_url = frontUpload.secure_url;
        console.log('✅ Front ID card uploaded successfully');
      }

      // Upload back ID card if provided
      if (id_card_back && id_card_back instanceof File) {
        console.log('📤 Uploading back ID card...');
        const backBuffer = await id_card_back.arrayBuffer();
        const backFilename = generateUniqueFilename(id_card_back.name, 'worker_id_back');

        backUpload = await uploadToCloudinary(backBuffer, {
          folder: 'local-fishing/workers/id-cards',
          public_id: backFilename,
          resource_type: 'image',
          tags: ['worker', 'id-card', 'back']
        });

        id_card_back_url = backUpload.secure_url;
        console.log('✅ Back ID card uploaded successfully');
      }

    } catch (uploadError) {
      console.error('Cloudinary upload error:', uploadError);

      // Clean up any successfully uploaded files
      try {
        if (frontUpload?.public_id) {
          await deleteFromCloudinary(frontUpload.public_id, 'image');
        }
        if (backUpload?.public_id) {
          await deleteFromCloudinary(backUpload.public_id, 'image');
        }
      } catch (cleanupError) {
        console.error('Failed to cleanup uploaded images:', cleanupError);
      }

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
        password: hashedPassword,
        monthly_salary,
        total_revenue_generated: 0
      })
      .select()
      .single();

    if (insertError) {
      console.error('Database insert error:', insertError);
      
      // Clean up uploaded images if database insert fails
      try {
        if (frontUpload?.public_id) {
          await deleteFromCloudinary(frontUpload.public_id, 'image');
        }
        if (backUpload?.public_id) {
          await deleteFromCloudinary(backUpload.public_id, 'image');
        }
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
    const { password: _, ...workerResponse } = newWorker;

    return createSuccessResponse({
      message: 'Worker account created successfully',
      worker: workerResponse
    }, '201');

  } catch (error) {
    console.error('Create worker error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

/**
 * Get all workers
 */
export async function getAllWorkers(c: Context): Promise<Response> {
  const startTime = Date.now();

  try {
    const env = c.env as Environment;
    console.log('🔍 Creating Supabase client...');
    const supabase = createSupabaseClient(env);

    console.log('🔍 Executing workers query...');
    const queryStart = Date.now();

    // Optimized query - exclude JSONB field for better performance but include ID card URLs
    const { data: workers, error } = await supabase
      .from('workers')
      .select('worker_id, full_name, email, phone_number, id_card_front_url, id_card_back_url, monthly_salary, total_revenue_generated, created_at')
      .order('created_at', { ascending: false })
      .limit(100); // Add reasonable limit to prevent large result sets

    const queryTime = Date.now() - queryStart;
    console.log(`📊 Workers query completed in ${queryTime}ms`);

    if (error) {
      console.error('Database query error:', error);
      return createErrorResponse('Failed to fetch workers', 500);
    }

    console.log(`📊 Retrieved ${workers?.length || 0} workers`);

    const totalTime = Date.now() - startTime;
    console.log(`⏱️ Total getAllWorkers execution time: ${totalTime}ms`);

    return createSuccessResponse({
      workers: workers || [],
      meta: {
        count: workers?.length || 0,
        executionTime: totalTime
      }
    });

  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`❌ Get workers error after ${totalTime}ms:`, error);
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
      .select('worker_id, full_name, email, phone_number, id_card_front_url, id_card_back_url, monthly_salary, total_revenue_generated, recent_login_history, created_at')
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
 * Authenticate worker with email and password
 */
export async function authenticateWorker(c: Context): Promise<Response> {
  try {
    const env = c.env as Environment;
    const supabase = createSupabaseClient(env);

    // Parse request body
    const body = await c.req.json();
    const { email, password } = body;

    // Validate required fields
    if (!email || !password) {
      return createErrorResponse('Email and password are required', 400);
    }

    // Get worker by email (including password for verification)
    const { data: worker, error } = await supabase
      .from('workers')
      .select('worker_id, full_name, email, phone_number, id_card_front_url, id_card_back_url, password, monthly_salary, total_revenue_generated, recent_login_history, created_at')
      .eq('email', email)
      .single();

    if (error || !worker) {
      return createErrorResponse('Invalid email or password', 401);
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, worker.password);
    if (!isValidPassword) {
      return createErrorResponse('Invalid email or password', 401);
    }

    // Remove password from response
    const { password: _, ...workerResponse } = worker;

    // Update recent login history
    const currentTime = new Date().toISOString();
    const loginHistory = worker.recent_login_history || [];
    const updatedHistory = [currentTime, ...loginHistory.slice(0, 9)]; // Keep last 10 logins

    await supabase
      .from('workers')
      .update({ recent_login_history: updatedHistory })
      .eq('worker_id', worker.worker_id);

    return createSuccessResponse({
      message: 'Authentication successful',
      worker: workerResponse
    });

  } catch (error) {
    console.error('Worker authentication error:', error);
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

    // Initialize Cloudinary for Workers
    if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
      return createErrorResponse('Cloudinary configuration is missing', 500);
    }

    initializeCloudinary({
      cloud_name: env.CLOUDINARY_CLOUD_NAME,
      api_key: env.CLOUDINARY_API_KEY,
      api_secret: env.CLOUDINARY_API_SECRET,
    });

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
          await deleteFromCloudinary(frontPublicId, 'image');
        }
      }

      if (worker.id_card_back_url) {
        const backPublicId = worker.id_card_back_url.split('/').pop()?.split('.')[0];
        if (backPublicId) {
          await deleteFromCloudinary(backPublicId, 'image');
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

    if (permissions) {
      permissions.forEach(perm => {
        if (perm.permission_category && perm.permission_name) {
          const category = perm.permission_category;
          const permissionName = perm.permission_name;

          if (!groupedPermissions[category]) {
            groupedPermissions[category] = {};
          }
          groupedPermissions[category][permissionName] = perm.is_granted;
        }
      });
    }

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

/**
 * Update worker ID card (front or back)
 * Allows step-by-step upload of ID cards
 */
export async function updateWorkerIdCard(c: Context): Promise<Response> {
  try {
    const env = c.env as Environment;
    const supabase = createSupabaseClient(env);
    const workerId = c.req.param('id');

    // Initialize Cloudinary for Workers
    if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
      return createErrorResponse('Cloudinary configuration is missing', 500);
    }

    initializeCloudinary({
      cloud_name: env.CLOUDINARY_CLOUD_NAME,
      api_key: env.CLOUDINARY_API_KEY,
      api_secret: env.CLOUDINARY_API_SECRET,
    });

    if (!workerId) {
      return createErrorResponse('Worker ID is required', 400);
    }

    // Parse form data
    const formData = await c.req.formData();
    const cardType = formData.get('card_type') as string; // 'front' or 'back'
    const idCardFile = formData.get('id_card_file') as File | null;

    // Validate required fields
    if (!cardType || !['front', 'back'].includes(cardType)) {
      return createErrorResponse('Card type must be either "front" or "back"', 400);
    }

    if (!idCardFile || !(idCardFile instanceof File)) {
      return createErrorResponse('ID card file is required', 400);
    }

    // Validate file type and size
    const maxFileSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['jpg', 'jpeg', 'png', 'webp'];

    if (!validateFileType(idCardFile.name, allowedTypes)) {
      return createErrorResponse('Invalid file type. Only JPG, PNG, and WebP files are allowed', 400);
    }

    if (!validateFileSize(idCardFile.size, maxFileSize)) {
      return createErrorResponse('File size too large. Maximum size is 5MB', 400);
    }

    // Check if worker exists
    const { data: worker, error: fetchError } = await supabase
      .from('workers')
      .select('worker_id, id_card_front_url, id_card_back_url')
      .eq('worker_id', workerId)
      .single();

    if (fetchError || !worker) {
      return createErrorResponse('Worker not found', 404);
    }

    // Upload new ID card image
    let uploadResult: any = null;
    try {
      console.log(`📤 Uploading ${cardType} ID card for worker ${workerId}...`);
      const fileBuffer = await idCardFile.arrayBuffer();
      const filename = generateUniqueFilename(idCardFile.name, `worker_id_${cardType}`);

      uploadResult = await uploadToCloudinary(fileBuffer, {
        folder: 'local-fishing/workers/id-cards',
        public_id: filename,
        resource_type: 'image',
        tags: ['worker', 'id-card', cardType]
      });

      console.log(`✅ ${cardType} ID card uploaded successfully`);
    } catch (uploadError) {
      console.error('Cloudinary upload error:', uploadError);
      return createErrorResponse('Failed to upload ID card image', 500);
    }

    // Delete old image if it exists
    const oldImageUrl = cardType === 'front' ? worker.id_card_front_url : worker.id_card_back_url;
    if (oldImageUrl) {
      try {
        const oldPublicId = oldImageUrl.split('/').pop()?.split('.')[0];
        if (oldPublicId) {
          await deleteFromCloudinary(oldPublicId, 'image');
          console.log(`🗑️ Deleted old ${cardType} ID card image`);
        }
      } catch (deleteError) {
        console.warn(`Failed to delete old ${cardType} ID card:`, deleteError);
        // Don't fail the request if old image deletion fails
      }
    }

    // Update worker record with new image URL
    const updateField = cardType === 'front' ? 'id_card_front_url' : 'id_card_back_url';
    const { error: updateError } = await supabase
      .from('workers')
      .update({ [updateField]: uploadResult.secure_url })
      .eq('worker_id', workerId);

    if (updateError) {
      console.error('Database update error:', updateError);

      // Clean up uploaded image if database update fails
      try {
        await deleteFromCloudinary(uploadResult.public_id, 'image');
      } catch (cleanupError) {
        console.error('Failed to cleanup uploaded image:', cleanupError);
      }

      return createErrorResponse('Failed to update worker ID card', 500);
    }

    return createSuccessResponse({
      message: `Worker ${cardType} ID card updated successfully`,
      [updateField]: uploadResult.secure_url
    });

  } catch (error) {
    console.error('Update worker ID card error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}
