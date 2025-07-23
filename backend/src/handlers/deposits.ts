/**
 * Deposits handlers for managing cash deposits through independent deposits table
 * Complete CRUD operations for deposits management system
 */

import { z } from 'zod';
import type { HonoContext } from '../types/index';
import {
  createSuccessResponse,
  createErrorResponse,
  createValidationErrorResponse,
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
  validateFileType,
  validateFileSize,
  generateUniqueFilename,
} from '../utils/cloudinary';

// Validation schemas
const getDepositsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  sortBy: z.enum(['date_time', 'total_amount', 'deposit_type']).default('date_time'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().optional(),
  deposit_type: z.enum(['momo', 'bank', 'boss']).optional(),
});

const createDepositSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  deposit_type: z.enum(['momo', 'bank', 'boss'], {
    required_error: 'Deposit type is required',
  }),
  account_name: z.string().min(1, 'Account name is required').max(255),
  account_number: z.string().max(50).nullable().optional(),
  to_recipient: z.string().max(100).nullable().optional(),
});

const updateDepositSchema = z.object({
  amount: z.number().positive('Amount must be positive').optional(),
  deposit_type: z.enum(['momo', 'bank', 'boss']).optional(),
  account_name: z.string().min(1, 'Account name is required').max(255).optional(),
  account_number: z.string().max(50).optional(),
  to_recipient: z.string().max(100).optional(),
  approval: z.enum(['pending', 'approved', 'rejected']).optional(),
});

/**
 * Get all deposits with pagination and filtering
 */
export const getDepositsHandler = async (c: HonoContext) => {
  try {
    const queryParams = c.req.query();

    const validation = getDepositsQuerySchema.safeParse(queryParams);
    if (!validation.success) {
      const errors = validation.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return c.json(createValidationErrorResponse(errors, c.get('requestId')), 400);
    }

    const { page, limit, sortBy, sortOrder, search, deposit_type } = validation.data;
    const user = c.get('user');

    if (!user) {
      return c.json(createErrorResponse('User not authenticated', 401, undefined, c.get('requestId')), 401);
    }

    // Build query for deposits from the independent deposits table
    let query = c.get('supabase')
      .from('deposits')
      .select(`
        deposit_id,
        date_time,
        amount,
        deposit_type,
        account_name,
        account_number,
        to_recipient,
        deposit_image_url,
        approval,
        created_at,
        updated_at,
        created_by
      `)
      .eq('user_id', user.id);

    // Apply deposit type filter
    if (deposit_type) {
      query = query.eq('deposit_type', deposit_type);
    }

    // Apply search if provided
    if (search) {
      query = applySearch(query, search, ['account_name', 'account_number']);
    }

    // Get total count for pagination
    const { count: totalCount, error: countError } = await c.get('supabase')
      .from('deposits')
      .select('deposit_id', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (countError) {
      throw new Error(`Failed to get deposit count: ${countError.message}`);
    }

    // Apply pagination
    query = applyPagination(query, { page, limit, sortBy, sortOrder });

    const { data: deposits, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch deposits: ${error.message}`);
    }

    const pagination = calculatePagination(page, limit, totalCount || 0);

    return createPaginatedResponse(
      deposits || [],
      pagination,
      c.get('requestId')
    );

  } catch (error) {
    console.error('Get deposits error:', error);
    return c.json(createErrorResponse('Failed to retrieve deposits', 500, { error: error instanceof Error ? error.message : 'Unknown error' }, c.get('requestId')), 500);
  }
};

/**
 * Get a single deposit by ID
 */
export const getDepositHandler = async (c: HonoContext) => {
  try {
    const id = c.req.param('id');

    if (!id) {
      return c.json(createErrorResponse('Deposit ID is required', 400, undefined, c.get('requestId')), 400);
    }

    const user = c.get('user');
    if (!user) {
      return c.json(createErrorResponse('User not authenticated', 401, undefined, c.get('requestId')), 401);
    }

    // Get deposit from deposits table
    const { data: deposit, error } = await c.get('supabase')
      .from('deposits')
      .select(`
        deposit_id,
        date_time,
        amount,
        deposit_type,
        account_name,
        account_number,
        to_recipient,
        deposit_image_url,
        approval,
        created_at,
        updated_at,
        created_by
      `)
      .eq('deposit_id', id)
      .eq('user_id', user.id)
      .single();

    if (error && error.code === 'PGRST116') {
      return c.json(createErrorResponse('Deposit not found', 404, undefined, c.get('requestId')), 404);
    }

    if (error) {
      throw new Error(`Failed to fetch deposit: ${error.message}`);
    }

    return c.json(createSuccessResponse(deposit, 'Deposit retrieved successfully', c.get('requestId')));

  } catch (error) {
    console.error('Get deposit error:', error);
    return c.json(createErrorResponse('Failed to retrieve deposit', 500, { error: error instanceof Error ? error.message : 'Unknown error' }, c.get('requestId')), 500);
  }
};

/**
 * Create a new deposit
 */
export const createDepositHandler = async (c: HonoContext) => {
  try {
    const body = await c.req.json();

    const validation = createDepositSchema.safeParse(body);
    if (!validation.success) {
      const errors = validation.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return c.json(createValidationErrorResponse(errors, c.get('requestId')), 400);
    }

    const depositData = validation.data;
    const user = c.get('user');

    if (!user) {
      return c.json(createErrorResponse('User not authenticated', 401, undefined, c.get('requestId')), 401);
    }

    // Create deposit in the deposits table
    const { data: newDeposit, error } = await c.get('supabase')
      .from('deposits')
      .insert({
        user_id: user.id, // Data isolation
        date_time: new Date().toISOString(),
        deposit_type: depositData.deposit_type,
        account_name: depositData.account_name,
        account_number: depositData.account_number || null,
        to_recipient: depositData.to_recipient || null,
        amount: depositData.amount,
        deposit_image_url: null, // Will be set if image is uploaded
        approval: 'pending', // Default approval status
        created_by: user.id,
        updated_by: user.id,
      })
      .select(`
        deposit_id,
        date_time,
        amount,
        deposit_type,
        account_name,
        account_number,
        to_recipient,
        deposit_image_url,
        approval,
        created_at,
        updated_at,
        created_by
      `)
      .single();

    if (error) {
      throw new Error(`Failed to create deposit: ${error.message}`);
    }

    return c.json({
      success: true,
      message: 'Deposit created successfully',
      data: newDeposit,
      timestamp: new Date().toISOString(),
      requestId: c.get('requestId'),
    }, 201);

  } catch (error) {
    console.error('Create deposit error:', error);
    return c.json(createErrorResponse('Failed to create deposit', 500, { error: error instanceof Error ? error.message : 'Unknown error' }, c.get('requestId')), 500);
  }
};

/**
 * Create deposit with image upload (receipt/proof)
 */
export const createDepositWithImageHandler = async (c: HonoContext) => {
  try {
    console.log('🏦 createDepositWithImageHandler started');
    const user = c.get('user');
    if (!user) {
      console.log('❌ User not authenticated');
      return c.json(createErrorResponse('User not authenticated', 401, undefined, c.get('requestId')), 401);
    }

    console.log('👤 User authenticated:', user.id);

    // Parse form data
    console.log('📝 Parsing form data...');
    const formData = await c.req.formData();

    // Log all form data entries for debugging
    console.log('📋 Form data entries:');
    for (const [key, value] of formData.entries()) {
      // Type guard for File objects
      if (value && typeof value === 'object' && 'name' in value && 'size' in value && 'type' in value) {
        const file = value as File;
        console.log(`  ${key}: File(${file.name}, ${file.size} bytes, ${file.type})`);
      } else {
        console.log(`  ${key}: ${value}`);
      }
    }

    const amount = parseFloat(formData.get('amount') as string);
    const deposit_type = formData.get('deposit_type') as string;
    const account_name = formData.get('account_name') as string;
    const account_number = formData.get('account_number') as string || null;
    const to_recipient = formData.get('to_recipient') as string || null;
    const image = formData.get('image') as File | null;

    console.log('📊 Parsed data:', {
      amount,
      deposit_type,
      account_name,
      account_number,
      to_recipient,
      hasImage: !!image,
      imageSize: image?.size,
      imageType: image?.type
    });

    // Validate required fields
    console.log('🔍 Validating deposit data...');
    const validation = createDepositSchema.safeParse({
      amount,
      deposit_type,
      account_name,
      account_number,
      to_recipient,
    });

    if (!validation.success) {
      console.log('❌ Validation failed:', validation.error.errors);
      const errors = validation.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return c.json(createValidationErrorResponse(errors, c.get('requestId')), 400);
    }

    console.log('✅ Validation passed');

    const depositData = validation.data;

    let imageUrl = null;

    // Handle image upload if provided
    console.log('🖼️ Checking for image upload...');
    if (image && image.size > 0) {
      console.log('📸 Image found, validating...');

      // Validate file
      console.log('🔍 Validating file type:', image.type);
      if (!validateFileType(image.type)) {
        console.log('❌ Invalid file type:', image.type);
        return c.json(createErrorResponse('Invalid file type', 400, { error: 'Image file type not supported' }, c.get('requestId')), 400);
      }

      console.log('📏 Validating file size:', image.size);
      if (!validateFileSize(image.size)) {
        console.log('❌ File too large:', image.size);
        return c.json(createErrorResponse('File too large', 400, { error: 'Image file size exceeds 10MB limit' }, c.get('requestId')), 400);
      }

      console.log('✅ File validation passed');

      // Check if Cloudinary is configured
      if (c.env.CLOUDINARY_CLOUD_NAME && c.env.CLOUDINARY_API_KEY && c.env.CLOUDINARY_API_SECRET) {
        try {
          // Initialize Cloudinary
          initializeCloudinary({
            cloud_name: c.env.CLOUDINARY_CLOUD_NAME,
            api_key: c.env.CLOUDINARY_API_KEY,
            api_secret: c.env.CLOUDINARY_API_SECRET,
          });

          // Upload image to Cloudinary
          const fileBuffer = await image.arrayBuffer();
          const uniqueFilename = generateUniqueFilename(image.name, 'deposit_proof');

          const cloudinaryResult = await uploadToCloudinary(fileBuffer, {
            folder: 'local-fishing/deposits',
            public_id: uniqueFilename,
            resource_type: 'auto',
            tags: ['deposit', 'proof', 'local-fishing'],
          });

          imageUrl = cloudinaryResult.secure_url;
        } catch (uploadError) {
          console.error('Image upload error:', uploadError);
          return c.json(createErrorResponse('Failed to upload image', 500, { error: 'Image upload failed' }, c.get('requestId')), 500);
        }
      }
    }

    // Create deposit in the deposits table with image
    console.log('💾 Creating deposit in database...');
    const depositInsertData = {
      user_id: user.id, // Data isolation
      date_time: new Date().toISOString(),
      deposit_type: depositData.deposit_type,
      account_name: depositData.account_name,
      account_number: depositData.account_number || null,
      to_recipient: depositData.to_recipient || null,
      amount: depositData.amount,
      deposit_image_url: imageUrl,
      approval: 'pending', // Default approval status
      created_by: user.id,
      updated_by: user.id,
    };

    console.log('📊 Deposit insert data:', depositInsertData);

    const { data: newDeposit, error } = await c.get('supabase')
      .from('deposits')
      .insert(depositInsertData)
      .select(`
        deposit_id,
        date_time,
        amount,
        deposit_type,
        account_name,
        account_number,
        to_recipient,
        deposit_image_url,
        approval,
        created_at,
        updated_at,
        created_by
      `)
      .single();

    console.log('📊 Database result:', { newDeposit, error });

    if (error) {
      console.log('❌ Database error:', error);
      throw new Error(`Failed to create deposit: ${error.message}`);
    }

    console.log('✅ Deposit created successfully');
    return c.json({
      success: true,
      message: 'Deposit created successfully',
      data: newDeposit,
      timestamp: new Date().toISOString(),
      requestId: c.get('requestId'),
    }, 201);

  } catch (error) {
    console.error('💥 Create deposit with image error:', error);
    return c.json(createErrorResponse('Failed to create deposit', 500, { error: error instanceof Error ? error.message : 'Unknown error' }, c.get('requestId')), 500);
  }
};

/**
 * Get deposit statistics
 */
export const getDepositStatsHandler = async (c: HonoContext) => {
  try {
    const user = c.get('user');
    if (!user) {
      return c.json(createErrorResponse('User not authenticated', 401, undefined, c.get('requestId')), 401);
    }

    // Get deposit statistics
    const { data: stats, error } = await c.get('supabase')
      .from('deposits')
      .select('amount, deposit_type, approval')
      .eq('created_by', user.id);

    if (error) {
      throw new Error(`Failed to fetch deposit stats: ${error.message}`);
    }

    // Calculate statistics
    const totalDeposits = stats?.length || 0;
    const totalAmount = stats?.reduce((sum, deposit) => sum + deposit.amount, 0) || 0;

    const depositsByType = stats?.reduce((acc, deposit) => {
      acc[deposit.deposit_type] = (acc[deposit.deposit_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    const amountByType = stats?.reduce((acc, deposit) => {
      acc[deposit.deposit_type] = (acc[deposit.deposit_type] || 0) + deposit.amount;
      return acc;
    }, {} as Record<string, number>) || {};

    const depositsByApproval = stats?.reduce((acc, deposit) => {
      acc[deposit.approval] = (acc[deposit.approval] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    return c.json(createSuccessResponse({
      totalDeposits,
      totalAmount,
      depositsByType,
      amountByType,
      depositsByApproval,
    }, 'Deposit statistics retrieved successfully', c.get('requestId')));

  } catch (error) {
    console.error('Get deposit stats error:', error);
    return c.json(createErrorResponse('Failed to retrieve deposit statistics', 500, { error: error instanceof Error ? error.message : 'Unknown error' }, c.get('requestId')), 500);
  }
};

/**
 * Update a deposit
 */
export const updateDepositHandler = async (c: HonoContext) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();

    if (!id) {
      return c.json(createErrorResponse('Deposit ID is required', 400, undefined, c.get('requestId')), 400);
    }

    const validation = updateDepositSchema.safeParse(body);
    if (!validation.success) {
      const errors = validation.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return c.json(createValidationErrorResponse(errors, c.get('requestId')), 400);
    }

    const updateData = validation.data;
    const user = c.get('user');

    if (!user) {
      return c.json(createErrorResponse('User not authenticated', 401, undefined, c.get('requestId')), 401);
    }

    // Update deposit in the deposits table
    const { data: updatedDeposit, error } = await c.get('supabase')
      .from('deposits')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
        updated_by: user.id,
      })
      .eq('deposit_id', id)
      .eq('created_by', user.id) // Ensure user can only update their own deposits
      .select(`
        deposit_id,
        date_time,
        amount,
        deposit_type,
        account_name,
        account_number,
        deposit_image_url,
        approval,
        created_at,
        updated_at,
        created_by
      `)
      .single();

    if (error && error.code === 'PGRST116') {
      return c.json(createErrorResponse('Deposit not found', 404, undefined, c.get('requestId')), 404);
    }

    if (error) {
      throw new Error(`Failed to update deposit: ${error.message}`);
    }

    return c.json(createSuccessResponse(updatedDeposit, 'Deposit updated successfully', c.get('requestId')));

  } catch (error) {
    console.error('Update deposit error:', error);
    return c.json(createErrorResponse('Failed to update deposit', 500, { error: error instanceof Error ? error.message : 'Unknown error' }, c.get('requestId')), 500);
  }
};

/**
 * Delete a deposit
 */
export const deleteDepositHandler = async (c: HonoContext) => {
  try {
    const id = c.req.param('id');

    if (!id) {
      return c.json(createErrorResponse('Deposit ID is required', 400, undefined, c.get('requestId')), 400);
    }

    const user = c.get('user');
    if (!user) {
      return c.json(createErrorResponse('User not authenticated', 401, undefined, c.get('requestId')), 401);
    }

    // Delete deposit from the deposits table
    const { data: deletedDeposit, error } = await c.get('supabase')
      .from('deposits')
      .delete()
      .eq('deposit_id', id)
      .eq('created_by', user.id) // Ensure user can only delete their own deposits
      .select(`
        deposit_id,
        date_time,
        amount,
        deposit_type,
        account_name,
        account_number,
        deposit_image_url,
        approval,
        created_at,
        updated_at,
        created_by
      `)
      .single();

    if (error && error.code === 'PGRST116') {
      return c.json(createErrorResponse('Deposit not found', 404, undefined, c.get('requestId')), 404);
    }

    if (error) {
      throw new Error(`Failed to delete deposit: ${error.message}`);
    }

    return c.json(createSuccessResponse(deletedDeposit, 'Deposit deleted successfully', c.get('requestId')));

  } catch (error) {
    console.error('Delete deposit error:', error);
    return c.json(createErrorResponse('Failed to delete deposit', 500, { error: error instanceof Error ? error.message : 'Unknown error' }, c.get('requestId')), 500);
  }
};
