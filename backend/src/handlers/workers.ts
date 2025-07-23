/**
 * Workers Handler
 * Handles worker management operations including creation, authentication, and permissions
 */

import { Context } from 'hono';
import { createSupabaseClient } from '../config/supabase';
import { initializeCloudinary, uploadToCloudinary, generateUniqueFilename, deleteFromCloudinary } from '../utils/cloudinary';
import { createSuccessResponse, createErrorResponse } from '../utils/response';
import {
  verifyPassword,
  generateWorkerAccessToken,
  generateWorkerRefreshToken,
  verifyWorkerRefreshToken
} from '../utils/auth';
import type { Environment } from '../config/environment';
import type {
  AuthenticatedWorker,
  WorkerLoginRequest,
  WorkerLoginResponse,
  WorkerRefreshTokenRequest
} from '../types/index';
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

    // Get current user ID from authenticated context
    const authHeader = c.req.header('Authorization');
    let currentUserId = null;

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      try {
        // Use our custom JWT verification instead of Supabase auth
        const { verifyAccessToken } = await import('../utils/auth');
        const payload = verifyAccessToken(token, env);
        currentUserId = payload.userId;
      } catch (error) {
        console.error('Token verification failed:', error);
        return createErrorResponse('Invalid authentication token', 401);
      }
    }

    if (!currentUserId) {
      return createErrorResponse('Authentication required', 401);
    }

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

    // Create worker record in database with user_id for data isolation
    const { data: newWorker, error: insertError } = await supabase
      .from('workers')
      .insert({
        user_id: currentUserId, // Add user_id for data isolation
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

    // Get current user ID for data isolation
    const authHeader = c.req.header('Authorization');
    let currentUserId = null;

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      try {
        // Use our custom JWT verification
        const { verifyAccessToken } = await import('../utils/auth');
        const payload = verifyAccessToken(token, env);
        currentUserId = payload.userId;
      } catch (error) {
        console.error('Token verification failed:', error);
        return createErrorResponse('Invalid authentication token', 401);
      }
    }

    if (!currentUserId) {
      return createErrorResponse('Authentication required', 401);
    }

    console.log('🔍 Executing workers query...');
    const queryStart = Date.now();

    // Optimized query with data isolation - only get workers for the authenticated user
    const { data: workers, error } = await supabase
      .from('workers')
      .select('worker_id, full_name, email, phone_number, id_card_front_url, id_card_back_url, monthly_salary, total_revenue_generated, created_at')
      .eq('user_id', currentUserId) // Add data isolation filter
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

    // Get current user ID for data isolation
    const authHeader = c.req.header('Authorization');
    let currentUserId = null;

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      try {
        // Use our custom JWT verification
        const { verifyAccessToken } = await import('../utils/auth');
        const payload = verifyAccessToken(token, env);
        currentUserId = payload.userId;
      } catch (error) {
        console.error('Token verification failed:', error);
        return createErrorResponse('Invalid authentication token', 401);
      }
    }

    if (!currentUserId) {
      return createErrorResponse('Authentication required', 401);
    }

    const { data: worker, error } = await supabase
      .from('workers')
      .select('worker_id, full_name, email, phone_number, id_card_front_url, id_card_back_url, monthly_salary, total_revenue_generated, recent_login_history, created_at')
      .eq('worker_id', workerId)
      .eq('user_id', currentUserId) // Add data isolation filter
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
 * Enhanced with JWT token generation and proper data isolation
 */
export async function authenticateWorker(c: Context): Promise<Response> {
  try {
    const env = c.env as Environment;
    const supabase = createSupabaseClient(env);

    // Parse and validate request body
    const body = await c.req.json() as WorkerLoginRequest;
    const { email, password } = body;
    if (!email || !password) {
      return createErrorResponse('Email and password are required', 400);
    }
    if (typeof email !== 'string' || typeof password !== 'string') {
      return createErrorResponse('Invalid email or password format', 400);
    }
    // Enhanced security: Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return createErrorResponse('Invalid email format', 400);
    }
    // Enhanced security: Rate limiting check (basic implementation)
    const clientIp = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown';
    console.log(`🔐 Worker login attempt from IP: ${clientIp} for email: ${email}`);

    // Get worker by email with enhanced security checks
    const { data: worker, error } = await supabase
      .from('workers')
      .select('worker_id, user_id, full_name, email, password, monthly_salary, total_revenue_generated, recent_login_history, created_at, token_version')
      .eq('email', email)
      .single();

    if (error || !worker) {
      console.warn(`🚨 Worker login failed: Worker not found for email ${email}`);
      return createErrorResponse('Invalid email or password', 401);
    }

    // Enhanced security: Verify password using secure utility
    const isValidPassword = await verifyPassword(password, worker.password);
    if (!isValidPassword) {
      console.warn(`🚨 Worker login failed: Invalid password for email ${email}`);
      return createErrorResponse('Invalid email or password', 401);
    }

    // Enhanced security: Verify business owner exists and is active
    const { data: businessOwner, error: businessError } = await supabase
      .from('users')
      .select('user_id, business_name, is_active')
      .eq('user_id', worker.user_id)
      .single();

    if (businessError || !businessOwner || !businessOwner.is_active) {
      console.warn(`🚨 Worker login failed: Business owner not found or inactive for worker ${worker.worker_id}`);
      return createErrorResponse('Business account is not active', 403);
    }

    // Create authenticated worker object
    const authenticatedWorker: AuthenticatedWorker = {
      id: worker.worker_id,
      email: worker.email,
      fullName: worker.full_name,
      role: 'employee', // Default role, can be enhanced with role management
      businessId: worker.user_id,
      isActive: true,
    };

    // Generate JWT tokens
    const accessToken = generateWorkerAccessToken(authenticatedWorker, env);
    const refreshToken = generateWorkerRefreshToken(authenticatedWorker, env);

    // Hash the refresh token for secure storage
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

    // Update worker session and login history with enhanced tracking
    const currentTime = new Date().toISOString();
    const sessionExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

    const loginHistory = worker.recent_login_history || [];
    const updatedHistory = [
      {
        timestamp: currentTime,
        ip: clientIp,
        userAgent: c.req.header('User-Agent') || 'unknown',
        success: true
      },
      ...loginHistory.slice(0, 9) // Keep last 10 logins
    ];

    // Update worker with session information and login history
    await supabase
      .from('workers')
      .update({
        recent_login_history: updatedHistory,
        refresh_token_hash: refreshTokenHash,
        session_expires_at: sessionExpiresAt,
        last_login_at: currentTime,
        last_login_ip: clientIp,
        last_login_user_agent: c.req.header('User-Agent') || 'unknown',
        is_session_active: true,
        token_version: worker.token_version || 1
      })
      .eq('worker_id', worker.worker_id);

    // Create response following the defined interface
    const response: WorkerLoginResponse = {
      success: true,
      message: 'Worker authentication successful',
      data: {
        worker: {
          id: authenticatedWorker.id,
          email: authenticatedWorker.email,
          fullName: authenticatedWorker.fullName,
          role: authenticatedWorker.role,
          businessId: authenticatedWorker.businessId,
        },
        accessToken,
        refreshToken,
        expiresIn: 3600, // 1 hour in seconds
      },
      timestamp: new Date().toISOString(),
      requestId: c.get('requestId') || 'unknown',
    };

    console.log(`✅ Worker login successful for ${email} (${worker.worker_id})`);
    return c.json(response, 200);

  } catch (error) {
    console.error('🚨 Worker authentication error:', error);
    return createErrorResponse(
      'Internal server error during authentication',
      500,
      { details: error instanceof Error ? error.message : 'Unknown error' }
    );
  }
}

/**
 * Refresh worker access token using refresh token
 */
export async function refreshWorkerToken(c: Context): Promise<Response> {
  try {
    const env = c.env as Environment;
    const supabase = createSupabaseClient(env);

    // Parse request body
    const body = await c.req.json() as WorkerRefreshTokenRequest;
    const { refreshToken } = body;

    if (!refreshToken) {
      return createErrorResponse('Refresh token is required', 400);
    }

    // Verify refresh token
    const payload = verifyWorkerRefreshToken(refreshToken, env);

    // Verify worker still exists and has active session
    const { data: worker, error } = await supabase
      .from('workers')
      .select('worker_id, user_id, full_name, email, refresh_token_hash, is_session_active, session_expires_at, token_version')
      .eq('worker_id', payload.workerId)
      .eq('user_id', payload.businessId)
      .single();

    if (error || !worker) {
      console.warn(`🚨 Worker refresh failed: Worker not found ${payload.workerId}`);
      return createErrorResponse('Invalid refresh token', 401);
    }

    // Verify session is still active and not expired
    if (!worker.is_session_active || !worker.session_expires_at) {
      console.warn(`🚨 Worker refresh failed: No active session ${payload.workerId}`);
      return createErrorResponse('Session expired', 401);
    }

    if (new Date(worker.session_expires_at) < new Date()) {
      console.warn(`🚨 Worker refresh failed: Session expired ${payload.workerId}`);
      return createErrorResponse('Session expired', 401);
    }

    // Verify refresh token hash matches (if stored)
    if (worker.refresh_token_hash) {
      const isValidRefreshToken = await bcrypt.compare(refreshToken, worker.refresh_token_hash);
      if (!isValidRefreshToken) {
        console.warn(`🚨 Worker refresh failed: Invalid refresh token ${payload.workerId}`);
        return createErrorResponse('Invalid refresh token', 401);
      }
    }

    // Verify business is still active
    const { data: business, error: businessError } = await supabase
      .from('users')
      .select('is_active')
      .eq('user_id', payload.businessId)
      .single();

    if (businessError || !business || !business.is_active) {
      return createErrorResponse('Business account is not active', 403);
    }

    // Create new authenticated worker object
    const authenticatedWorker: AuthenticatedWorker = {
      id: worker.worker_id,
      email: worker.email,
      fullName: worker.full_name,
      role: 'employee', // Default role
      businessId: worker.user_id,
      isActive: true,
    };

    // Generate new access token
    const newAccessToken = generateWorkerAccessToken(authenticatedWorker, env);

    return createSuccessResponse({
      message: 'Token refreshed successfully',
      accessToken: newAccessToken,
      expiresIn: 3600, // 1 hour
    });

  } catch (error) {
    console.error('🚨 Worker token refresh error:', error);

    if (error instanceof Error && error.message.includes('expired')) {
      return createErrorResponse('Refresh token expired', 401);
    }

    return createErrorResponse('Invalid refresh token', 401);
  }
}

/**
 * Get worker profile information
 */
export async function getWorkerProfile(c: Context): Promise<Response> {
  try {
    const supabase = c.get('supabase');
    const worker = c.get('worker') as AuthenticatedWorker;

    if (!worker) {
      return createErrorResponse('Worker authentication required', 401);
    }

    // Get detailed worker information
    const { data: workerData, error } = await supabase
      .from('workers')
      .select(`
        worker_id,
        full_name,
        email,
        phone_number,
        monthly_salary,
        total_revenue_generated,
        recent_login_history,
        created_at
      `)
      .eq('worker_id', worker.id)
      .eq('user_id', worker.businessId)
      .single();

    if (error || !workerData) {
      return createErrorResponse('Worker profile not found', 404);
    }

    // Get business information
    const { data: business, error: businessError } = await supabase
      .from('users')
      .select('business_name, owner_name')
      .eq('user_id', worker.businessId)
      .single();

    if (businessError || !business) {
      return createErrorResponse('Business information not found', 404);
    }

    return createSuccessResponse({
      worker: {
        id: workerData.worker_id,
        fullName: workerData.full_name,
        email: workerData.email,
        phoneNumber: workerData.phone_number,
        monthlySalary: workerData.monthly_salary,
        totalRevenueGenerated: workerData.total_revenue_generated,
        createdAt: workerData.created_at,
        role: worker.role,
      },
      business: {
        name: business.business_name,
        owner: business.owner_name,
      },
      recentLoginHistory: workerData.recent_login_history || [],
    });

  } catch (error) {
    console.error('🚨 Worker profile error:', error);
    return createErrorResponse('Failed to get worker profile', 500);
  }
}

/**
 * Worker logout (invalidate tokens and clear session)
 */
export async function logoutWorker(c: Context): Promise<Response> {
  try {
    const supabase = c.get('supabase');
    const worker = c.get('worker') as AuthenticatedWorker;

    if (!worker) {
      return createErrorResponse('Worker authentication required', 401);
    }

    // Get current token version first
    const { data: currentWorker } = await supabase
      .from('workers')
      .select('token_version')
      .eq('worker_id', worker.id)
      .single();

    // Clear session data and increment token version for security
    await supabase
      .from('workers')
      .update({
        is_session_active: false,
        refresh_token_hash: null,
        session_expires_at: null,
        token_version: (currentWorker?.token_version || 1) + 1
      })
      .eq('worker_id', worker.id)
      .eq('user_id', worker.businessId);

    console.log(`✅ Worker logout successful for ${worker.email} (${worker.id})`);

    return createSuccessResponse({
      message: 'Worker logged out successfully',
    });

  } catch (error) {
    console.error('🚨 Worker logout error:', error);
    return createErrorResponse('Failed to logout worker', 500);
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

    // Get current user ID for data isolation
    const authHeader = c.req.header('Authorization');
    let currentUserId = null;

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      try {
        // Use our custom JWT verification
        const { verifyAccessToken } = await import('../utils/auth');
        const payload = verifyAccessToken(token, env);
        currentUserId = payload.userId;
      } catch (error) {
        console.error('Token verification failed:', error);
        return createErrorResponse('Invalid authentication token', 401);
      }
    }

    if (!currentUserId) {
      return createErrorResponse('Authentication required', 401);
    }

    const updateData: UpdateWorkerRequest = await c.req.json();

    // Validate email format if provided
    if (updateData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(updateData.email)) {
        return createErrorResponse('Invalid email format', 400);
      }

      // Check if email is already taken by another worker in the same user's account
      const { data: existingWorker } = await supabase
        .from('workers')
        .select('worker_id')
        .eq('email', updateData.email)
        .eq('user_id', currentUserId) // Add data isolation
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
      .eq('user_id', currentUserId) // Add data isolation
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

    // Get current user ID for data isolation
    const authHeader = c.req.header('Authorization');
    let currentUserId = null;

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      try {
        // Use our custom JWT verification
        const { verifyAccessToken } = await import('../utils/auth');
        const payload = verifyAccessToken(token, env);
        currentUserId = payload.userId;
      } catch (error) {
        console.error('Token verification failed:', error);
        return createErrorResponse('Invalid authentication token', 401);
      }
    }

    if (!currentUserId) {
      return createErrorResponse('Authentication required', 401);
    }

    // Get worker data to clean up images (with data isolation)
    const { data: worker, error: fetchError } = await supabase
      .from('workers')
      .select('id_card_front_url, id_card_back_url')
      .eq('worker_id', workerId)
      .eq('user_id', currentUserId) // Add data isolation
      .single();

    if (fetchError || !worker) {
      return createErrorResponse('Worker not found', 404);
    }

    // Delete worker from database (this will cascade delete permissions) with data isolation
    const { error: deleteError } = await supabase
      .from('workers')
      .delete()
      .eq('worker_id', workerId)
      .eq('user_id', currentUserId); // Add data isolation

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

    // Get current user ID for data isolation
    const authHeader = c.req.header('Authorization');
    let currentUserId = null;

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      try {
        // Use our custom JWT verification
        const { verifyAccessToken } = await import('../utils/auth');
        const payload = verifyAccessToken(token, env);
        currentUserId = payload.userId;
      } catch (error) {
        console.error('Token verification failed:', error);
        return createErrorResponse('Invalid authentication token', 401);
      }
    }

    if (!currentUserId) {
      return createErrorResponse('Authentication required', 401);
    }

    // Get permissions with data isolation - join with workers table to ensure user owns the worker
    const { data: permissions, error } = await supabase
      .from('worker_permissions')
      .select(`
        *,
        workers!inner (
          user_id
        )
      `)
      .eq('worker_id', workerId)
      .eq('workers.user_id', currentUserId);

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
      try {
        // Use our custom JWT verification instead of Supabase auth
        const { verifyAccessToken } = await import('../utils/auth');
        const payload = verifyAccessToken(token, env);
        currentUserId = payload.userId;
      } catch (error) {
        console.error('Token verification failed:', error);
        return createErrorResponse('Invalid authentication token', 401);
      }
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
