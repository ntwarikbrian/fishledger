/**
 * Expenses handlers for CRUD operations
 * Provides endpoints for managing business expenses and expense categories
 */

import { z } from 'zod';
import type { HonoContext } from '../types/index';
import {
  createSuccessResponse,
  createErrorResponse,
  createValidationErrorResponse,
  createPaginatedResponse,
  createNotFoundResponse,
  calculatePagination,
} from '../utils/response';
import {
  applyPagination,
  applySearch,
  getTotalCount,
  recordExists,
} from '../utils/db';
import {
  initializeCloudinary,
  uploadToCloudinary,
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

// Validation schemas
const getExpensesQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  sortBy: z.enum(['created_at', 'amount', 'date', 'title']).default('created_at'), // Updated to match database columns
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().optional(),
  category_id: z.string().uuid().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  min_amount: z.coerce.number().optional(),
  max_amount: z.coerce.number().optional(),
});

const createExpenseSchema = z.object({
  title: z.string().min(1).max(255), // Changed from description to title
  amount: z.number().positive(),
  date: z.string(), // Changed from expense_date to date
  category_id: z.string().uuid(),
  receipt_url: z.string().url().optional(),
  status: z.enum(['pending', 'paid']).default('pending'), // Updated to match database schema
});

// Schema for expense with receipt upload
const createExpenseWithReceiptSchema = z.object({
  title: z.string().min(1).max(255),
  amount: z.number().positive(),
  date: z.string(),
  category_id: z.string().uuid(),
  status: z.enum(['pending', 'paid']).default('pending'),
});

const updateExpenseSchema = createExpenseSchema.partial();

const createExpenseCategorySchema = z.object({
  category_name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  budget: z.number().min(0).default(0), // Added budget field from database schema
});

const updateExpenseCategorySchema = createExpenseCategorySchema.partial();

/**
 * Get all expenses with pagination and filtering
 */
export const getExpensesHandler = async (c: HonoContext) => {
  try {
    const queryParams = c.req.query();

    const validation = getExpensesQuerySchema.safeParse(queryParams);
    if (!validation.success) {
      const errors = validation.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return c.json(createValidationErrorResponse(errors, c.get('requestId')), 400);
    }

    const { page, limit, sortBy, sortOrder, search, category_id, start_date, end_date, min_amount, max_amount } = validation.data;

    // Build query with data isolation - only get expenses for the authenticated user
    let query = createUserFilteredQuery(c, 'expenses', `
      expense_id,
      title,
      amount,
      category_id,
      date,
      receipt_url,
      status,
      added_by,
      created_at,
      updated_at,
      expense_categories (
        category_id,
        category_name,
        description,
        budget
      ),
      added_by_user:users!added_by (
        user_id,
        owner_name,
        business_name
      )
    `);

    // Apply filters
    if (category_id) {
      query = query.eq('category_id', category_id);
    }

    if (start_date) {
      query = query.gte('date', start_date); // Updated column name
    }

    if (end_date) {
      query = query.lte('date', end_date); // Updated column name
    }

    if (min_amount) {
      query = query.gte('amount', min_amount);
    }

    if (max_amount) {
      query = query.lte('amount', max_amount);
    }

    // Apply search - Updated to match database columns
    if (search) {
      query = applySearch(query, search, ['title']); // Only search in title field as per database schema
    }

    // Get total count for pagination with user isolation
    const userId = getUserIdFromContext(c);
    const totalCount = await getTotalCount(c.get('supabase'), 'expenses', {
      user_id: userId,
      category_id,
      start_date,
      end_date,
      min_amount,
      max_amount,
    });

    // Apply pagination
    query = applyPagination(query, { page, limit, sortBy, sortOrder });

    const { data: expenses, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch expenses: ${error.message}`);
    }

    const pagination = calculatePagination(page, limit, totalCount);

    return createPaginatedResponse(
      expenses || [],
      pagination,
      c.get('requestId'),
    );

  } catch (error) {
    console.error('Get expenses error:', error);
    return c.json(createErrorResponse('Failed to retrieve expenses', 500, { error: error instanceof Error ? error.message : 'Unknown error' }, c.get('requestId')), 500);
  }
};

/**
 * Get a single expense by ID
 */
export const getExpenseHandler = async (c: HonoContext) => {
  try {
    const id = c.req.param('id');

    if (!id) {
      return c.json(createErrorResponse('Expense ID is required', 400, undefined, c.get('requestId')), 400);
    }

    // Use data isolation to ensure user can only access their own expenses
    const { data: expense, error } = await createUserFilteredQuery(c, 'expenses', `
      *,
      expense_categories (
        category_id,
        category_name,
        description,
        budget
      ),
      added_by_user:users!added_by (
        user_id,
        owner_name,
        business_name
      )
    `)
      .eq('expense_id', id)
      .single();

    if (error && error.code === 'PGRST116') {
      return c.json(createNotFoundResponse('Expense', c.get('requestId')), 404);
    }

    if (error) {
      throw new Error(`Failed to fetch expense: ${error.message}`);
    }

    return c.json(createSuccessResponse(expense, 'Expense retrieved successfully', c.get('requestId')));

  } catch (error) {
    console.error('Get expense error:', error);
    return c.json(createErrorResponse('Failed to retrieve expense', 500, { error: error instanceof Error ? error.message : 'Unknown error' }, c.get('requestId')), 500);
  }
};

/**
 * Create a new expense
 */
export const createExpenseHandler = async (c: HonoContext) => {
  try {
    let body;
    try {
      body = await c.req.json();
    } catch (jsonError) {
      console.error('JSON parsing error:', jsonError);
      return c.json({
        success: false,
        error: 'Invalid JSON in request body',
        details: { error: jsonError instanceof Error ? jsonError.message : 'Invalid JSON format' },
        timestamp: new Date().toISOString(),
        requestId: c.get('requestId'),
      }, 400);
    }

    const validation = createExpenseSchema.safeParse(body);
    if (!validation.success) {
      const errors = validation.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return c.json({
        success: false,
        error: 'Validation failed',
        details: { errors },
        timestamp: new Date().toISOString(),
        requestId: c.get('requestId'),
      }, 400);
    }

    const expenseData = validation.data;

    // Verify category exists and belongs to the user
    const userId = getUserIdFromContext(c);
    const { data: category } = await createUserFilteredQuery(c, 'expense_categories')
      .eq('category_id', expenseData.category_id)
      .single();

    if (!category) {
      return c.json({
        success: false,
        error: 'Invalid category ID',
        details: { error: 'The specified expense category does not exist or does not belong to you' },
        timestamp: new Date().toISOString(),
        requestId: c.get('requestId'),
      }, 400);
    }

    // Create expense with data isolation - automatically adds user_id and added_by
    const expenseDataWithUser = addUserIdToInsertData(c, {
      ...expenseData,
      added_by: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    const { data: newExpense, error } = await c.get('supabase')
      .from('expenses')
      .insert(expenseDataWithUser)
      .select(`
        *,
        expense_categories (
          category_id,
          category_name,
          description,
          budget
        )
      `)
      .single();

    if (error) {
      throw new Error(`Failed to create expense: ${error.message}`);
    }

    return c.json({
      success: true,
      message: 'Expense created successfully',
      data: newExpense,
      requestId: c.get('requestId'),
    }, 201);

  } catch (error) {
    console.error('Create expense error:', error);
    return c.json({
      success: false,
      error: 'Failed to create expense',
      details: { error: error instanceof Error ? error.message : 'Unknown error' },
      timestamp: new Date().toISOString(),
      requestId: c.get('requestId'),
    }, 500);
  }
};

/**
 * Update an existing expense
 */
export const updateExpenseHandler = async (c: HonoContext) => {
  try {
    const id = c.req.param('id');

    if (!id) {
      return c.json(createErrorResponse('Expense ID is required', 400, undefined, c.get('requestId')), 400);
    }

    const body = await c.req.json();

    const validation = updateExpenseSchema.safeParse(body);
    if (!validation.success) {
      const errors = validation.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return c.json(createValidationErrorResponse(errors, c.get('requestId')), 400);
    }

    const updateData = validation.data;

    // Check if expense exists and belongs to the user
    const { data: existingExpense } = await createUserFilteredQuery(c, 'expenses')
      .eq('expense_id', id)
      .single();

    if (!existingExpense) {
      return c.json(createNotFoundResponse('Expense', c.get('requestId')), 404);
    }

    // Verify category exists and belongs to the user if being updated
    if (updateData.category_id) {
      const { data: category } = await createUserFilteredQuery(c, 'expense_categories')
        .eq('category_id', updateData.category_id)
        .single();

      if (!category) {
        return c.json(createErrorResponse('Invalid category ID', 400, { error: 'The specified expense category does not exist or does not belong to you' }, c.get('requestId')), 400);
      }
    }

    // Validate and prepare update data with user isolation
    validateUserIdInUpdateData(c, updateData);

    // Update expense with data isolation
    const userId = getUserIdFromContext(c);
    const { data: updatedExpense, error } = await c.get('supabase')
      .from('expenses')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('expense_id', id)
      .eq('user_id', userId)
      .select(`
        *,
        expense_categories (
          category_id,
          category_name,
          description,
          budget
        )
      `)
      .select(`
        *,
        expense_categories (
          category_id,
          category_name,
          description,
          budget
        )
      `)
      .single();

    if (error) {
      throw new Error(`Failed to update expense: ${error.message}`);
    }

    return c.json(createSuccessResponse(updatedExpense, 'Expense updated successfully', c.get('requestId')));

  } catch (error) {
    console.error('Update expense error:', error);
    return c.json(createErrorResponse('Failed to update expense', 500, { error: error instanceof Error ? error.message : 'Unknown error' }, c.get('requestId')), 500);
  }
};

/**
 * Delete an expense
 */
export const deleteExpenseHandler = async (c: HonoContext) => {
  try {
    const id = c.req.param('id');

    if (!id) {
      return c.json(createErrorResponse('Expense ID is required', 400, undefined, c.get('requestId')), 400);
    }

    // Check if expense exists and belongs to the user
    const { data: existingExpense } = await createUserFilteredQuery(c, 'expenses')
      .eq('expense_id', id)
      .single();

    if (!existingExpense) {
      return c.json(createNotFoundResponse('Expense', c.get('requestId')), 404);
    }

    // Delete expense with data isolation
    const userId = getUserIdFromContext(c);
    const { error } = await c.get('supabase')
      .from('expenses')
      .delete()
      .eq('expense_id', id)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to delete expense: ${error.message}`);
    }

    return c.json(createSuccessResponse(
      { deleted: true, expense_id: id },
      'Expense deleted successfully',
      c.get('requestId'),
    ));

  } catch (error) {
    console.error('Delete expense error:', error);
    return c.json(createErrorResponse('Failed to delete expense', 500, { error: error instanceof Error ? error.message : 'Unknown error' }, c.get('requestId')), 500);
  }
};

// =====================================================
// EXPENSE CATEGORIES HANDLERS
// =====================================================

/**
 * Get all expense categories
 */
export const getExpenseCategoriesHandler = async (c: HonoContext) => {
  try {
    // Use data isolation to ensure user can only access their own categories
    const { data: categories, error } = await createUserFilteredQuery(c, 'expense_categories', '*')
      .order('category_name', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch expense categories: ${error.message}`);
    }

    return c.json({
      success: true,
      data: categories || [],
      message: 'Expense categories retrieved successfully',
      timestamp: new Date().toISOString(),
      requestId: c.get('requestId'),
    });

  } catch (error) {
    console.error('Get expense categories error:', error);
    return c.json({
      success: false,
      error: 'Failed to retrieve expense categories',
      details: { error: error instanceof Error ? error.message : 'Unknown error' },
      timestamp: new Date().toISOString(),
      requestId: c.get('requestId'),
    }, 500);
  }
};

/**
 * Get a single expense category by ID
 */
export const getExpenseCategoryHandler = async (c: HonoContext) => {
  try {
    const id = c.req.param('id');

    if (!id) {
      return c.json({
        success: false,
        error: 'Category ID is required',
        timestamp: new Date().toISOString(),
        requestId: c.get('requestId'),
      }, 400);
    }

    // Use data isolation to ensure user can only access their own categories
    const { data: category, error } = await createUserFilteredQuery(c, 'expense_categories', '*')
      .eq('category_id', id)
      .single();

    if (error && error.code === 'PGRST116') {
      return c.json({
        success: false,
        error: 'Expense Category not found',
        timestamp: new Date().toISOString(),
        requestId: c.get('requestId'),
      }, 404);
    }

    if (error) {
      throw new Error(`Failed to fetch expense category: ${error.message}`);
    }

    return c.json({
      success: true,
      data: category,
      message: 'Expense category retrieved successfully',
      timestamp: new Date().toISOString(),
      requestId: c.get('requestId'),
    });

  } catch (error) {
    console.error('Get expense category error:', error);
    return c.json({
      success: false,
      error: 'Failed to retrieve expense category',
      details: { error: error instanceof Error ? error.message : 'Unknown error' },
      timestamp: new Date().toISOString(),
      requestId: c.get('requestId'),
    }, 500);
  }
};

/**
 * Create a new expense category
 */
export const createExpenseCategoryHandler = async (c: HonoContext) => {
  try {
    const body = await c.req.json();

    const validation = createExpenseCategorySchema.safeParse(body);
    if (!validation.success) {
      const errors = validation.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return c.json(createValidationErrorResponse(errors, c.get('requestId')), 400);
    }

    const categoryData = validation.data;

    // Get user ID from context (set by data isolation middleware)
    const userId = getUserIdFromContext(c);

    // Check if category name already exists for this user (with data isolation)
    const { data: existingCategory } = await createUserFilteredQuery(c, 'expense_categories', 'category_id')
      .eq('category_name', categoryData.category_name)
      .single();

    if (existingCategory) {
      return c.json(createErrorResponse('Category name already exists', 409, { error: 'An expense category with this name already exists' }, c.get('requestId')), 409);
    }

    // Create category with user ID
    const { data: newCategory, error } = await c.get('supabase')
      .from('expense_categories')
      .insert({
        ...categoryData,
        user_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create expense category: ${error.message}`);
    }

    return c.json({
      success: true,
      message: 'Expense category created successfully',
      data: newCategory,
      requestId: c.get('requestId'),
    }, 201);

  } catch (error) {
    console.error('Create expense category error:', error);
    return c.json({
      success: false,
      error: 'Failed to create expense category',
      details: { error: error instanceof Error ? error.message : 'Unknown error' },
      timestamp: new Date().toISOString(),
      requestId: c.get('requestId'),
    }, 500);
  }
};

/**
 * Update an existing expense category
 */
export const updateExpenseCategoryHandler = async (c: HonoContext) => {
  try {
    const id = c.req.param('id');

    if (!id) {
      return c.json({
        success: false,
        error: 'Category ID is required',
        timestamp: new Date().toISOString(),
        requestId: c.get('requestId'),
      }, 400);
    }

    const body = await c.req.json();

    const validation = updateExpenseCategorySchema.safeParse(body);
    if (!validation.success) {
      const errors = validation.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return c.json({
        success: false,
        error: 'Validation failed',
        details: { errors },
        timestamp: new Date().toISOString(),
        requestId: c.get('requestId'),
      }, 400);
    }

    const updateData = validation.data;

    // Check if category exists and belongs to the user (data isolation)
    const { data: existingCategory, error: checkError } = await createUserFilteredQuery(c, 'expense_categories', 'category_id, category_name')
      .eq('category_id', id)
      .single();

    if (checkError && checkError.code === 'PGRST116') {
      return c.json(createNotFoundResponse('Expense Category', c.get('requestId')), 404);
    }

    if (checkError || !existingCategory) {
      throw new Error(`Failed to check expense category: ${checkError?.message || 'Category not found'}`);
    }

    // Check if new name conflicts with existing category (if name is being updated)
    if (updateData.category_name && updateData.category_name !== (existingCategory as any).category_name) {
      const { data: conflictingCategory } = await createUserFilteredQuery(c, 'expense_categories', 'category_id')
        .eq('category_name', updateData.category_name)
        .neq('category_id', id)
        .single();

      if (conflictingCategory) {
        return c.json({
          success: false,
          error: 'Category name already exists',
          details: { error: 'An expense category with this name already exists' },
          timestamp: new Date().toISOString(),
          requestId: c.get('requestId'),
        }, 409);
      }
    }

    // Update category with data isolation
    const userId = getUserIdFromContext(c);
    const { data: updatedCategory, error } = await c.get('supabase')
      .from('expense_categories')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('category_id', id)
      .eq('user_id', userId) // Ensure data isolation
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update expense category: ${error.message}`);
    }

    return c.json({
      success: true,
      data: updatedCategory,
      message: 'Expense category updated successfully',
      timestamp: new Date().toISOString(),
      requestId: c.get('requestId'),
    });

  } catch (error) {
    console.error('Update expense category error:', error);
    return c.json({
      success: false,
      error: 'Failed to update expense category',
      details: { error: error instanceof Error ? error.message : 'Unknown error' },
      timestamp: new Date().toISOString(),
      requestId: c.get('requestId'),
    }, 500);
  }
};

/**
 * Delete an expense category
 */
export const deleteExpenseCategoryHandler = async (c: HonoContext) => {
  try {
    const id = c.req.param('id');

    if (!id) {
      return c.json({
        success: false,
        error: 'Category ID is required',
        timestamp: new Date().toISOString(),
        requestId: c.get('requestId'),
      }, 400);
    }

    // Check if category exists and belongs to the user (data isolation)
    const { data: existingCategory, error: categoryError } = await createUserFilteredQuery(c, 'expense_categories', 'category_id')
      .eq('category_id', id)
      .single();

    if (categoryError && categoryError.code === 'PGRST116') {
      return c.json({
        success: false,
        error: 'Expense Category not found',
        timestamp: new Date().toISOString(),
        requestId: c.get('requestId'),
      }, 404);
    }

    if (categoryError || !existingCategory) {
      throw new Error(`Failed to check expense category: ${categoryError?.message || 'Category not found'}`);
    }

    // Check if category is being used by any expenses (with data isolation)
    const { data: expensesUsingCategory, error: checkError } = await createUserFilteredQuery(c, 'expenses', 'expense_id')
      .eq('category_id', id)
      .limit(1);

    if (checkError) {
      throw new Error(`Failed to check category usage: ${checkError.message}`);
    }

    if (expensesUsingCategory && expensesUsingCategory.length > 0) {
      return c.json({
        success: false,
        error: 'Cannot delete category: This category is being used by one or more expenses',
        details: {
          error: 'This category is being used by one or more expenses',
          expenseCount: expensesUsingCategory.length
        },
        timestamp: new Date().toISOString(),
        requestId: c.get('requestId'),
      }, 409);
    }

    // Delete category with data isolation
    const userId = getUserIdFromContext(c);
    const { error } = await c.get('supabase')
      .from('expense_categories')
      .delete()
      .eq('category_id', id)
      .eq('user_id', userId); // Ensure data isolation

    if (error) {
      throw new Error(`Failed to delete expense category: ${error.message}`);
    }

    return c.json({
      success: true,
      data: { deleted: true, category_id: id },
      message: 'Expense category deleted successfully',
      timestamp: new Date().toISOString(),
      requestId: c.get('requestId'),
    });

  } catch (error) {
    console.error('Delete expense category error:', error);
    return c.json({
      success: false,
      error: 'Failed to delete expense category',
      details: { error: error instanceof Error ? error.message : 'Unknown error' },
      timestamp: new Date().toISOString(),
      requestId: c.get('requestId'),
    }, 500);
  }
};

/**
 * Create expense with receipt upload
 */
export const createExpenseWithReceiptHandler = async (c: HonoContext) => {
  try {
    const user = c.get('user');
    if (!user) {
      return c.json(createErrorResponse('User not authenticated', 401, undefined, c.get('requestId')), 401);
    }

    // Parse form data
    const formData = await c.req.formData();
    const title = formData.get('title') as string;
    const amount = parseFloat(formData.get('amount') as string);
    const date = formData.get('date') as string;
    const category_id = formData.get('category_id') as string;
    const status = (formData.get('status') as string) || 'pending';
    const receipt = formData.get('receipt') as File | null;

    // Validate required fields
    const validation = createExpenseWithReceiptSchema.safeParse({
      title,
      amount,
      date,
      category_id,
      status,
    });

    if (!validation.success) {
      const errors = validation.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return c.json({
        success: false,
        error: 'Validation failed',
        details: { errors },
        timestamp: new Date().toISOString(),
        requestId: c.get('requestId'),
      }, 400);
    }

    const expenseData = validation.data;

    // Verify category exists
    const categoryExists = await recordExists(c.get('supabase'), 'expense_categories', expenseData.category_id, 'category_id');
    if (!categoryExists) {
      return c.json({
        success: false,
        error: 'Invalid category ID',
        details: { error: 'The specified expense category does not exist' },
        timestamp: new Date().toISOString(),
        requestId: c.get('requestId'),
      }, 400);
    }

    let receiptUrl = null;

    // Handle receipt upload if provided
    if (receipt && receipt.size > 0) {
      console.log('📎 Receipt file detected:');
      console.log('   Name:', receipt.name);
      console.log('   Type:', receipt.type);
      console.log('   Size:', receipt.size, 'bytes');

      // Validate file
      const isValidType = validateFileType(receipt.type);
      console.log('   Type validation:', isValidType ? '✅ Valid' : '❌ Invalid');

      if (!isValidType) {
        return c.json({
          success: false,
          error: 'Invalid file type',
          details: { error: 'Receipt file type not supported' },
          timestamp: new Date().toISOString(),
          requestId: c.get('requestId'),
        }, 400);
      }

      const isValidSize = validateFileSize(receipt.size);
      console.log('   Size validation:', isValidSize ? '✅ Valid' : '❌ Invalid');

      if (!isValidSize) {
        return c.json({
          success: false,
          error: 'File too large',
          details: { error: 'Receipt file size exceeds 10MB limit' },
          timestamp: new Date().toISOString(),
          requestId: c.get('requestId'),
        }, 400);
      }

      // Check if Cloudinary is configured
      if (c.env.CLOUDINARY_CLOUD_NAME && c.env.CLOUDINARY_API_KEY && c.env.CLOUDINARY_API_SECRET) {
        console.log('🔧 Cloudinary configuration found, attempting upload...');
        console.log('   Cloud name:', c.env.CLOUDINARY_CLOUD_NAME);
        console.log('   API key:', c.env.CLOUDINARY_API_KEY?.substring(0, 8) + '...');
        console.log('   File size:', receipt.size, 'bytes');
        console.log('   File type:', receipt.type);

        try {
          // Initialize Cloudinary
          initializeCloudinary({
            cloud_name: c.env.CLOUDINARY_CLOUD_NAME,
            api_key: c.env.CLOUDINARY_API_KEY,
            api_secret: c.env.CLOUDINARY_API_SECRET,
          });

          // Upload receipt to Cloudinary
          const fileBuffer = await receipt.arrayBuffer();
          const uniqueFilename = generateUniqueFilename(receipt.name, 'expense_receipt');

          console.log('📤 Uploading to Cloudinary with filename:', uniqueFilename);

          const cloudinaryResult = await uploadToCloudinary(fileBuffer, {
            folder: 'local-fishing/expenses',
            public_id: uniqueFilename,
            resource_type: 'auto',
            tags: ['expense', 'receipt', 'local-fishing'],
          });

          receiptUrl = cloudinaryResult.secure_url;
          console.log('✅ Cloudinary upload successful:', receiptUrl);
        } catch (uploadError) {
          console.error('❌ Receipt upload error:', uploadError);
          console.error('   Error details:', uploadError instanceof Error ? uploadError.message : 'Unknown error');
          console.error('   Stack trace:', uploadError instanceof Error ? uploadError.stack : 'No stack trace');
          return c.json({
            success: false,
            error: 'Failed to upload receipt',
            details: { error: 'Receipt upload failed' },
            timestamp: new Date().toISOString(),
            requestId: c.get('requestId'),
          }, 500);
        }
      } else {
        console.log('⚠️  Cloudinary not configured - receipt will not be uploaded');
        console.log('   Missing credentials:');
        console.log('   - CLOUDINARY_CLOUD_NAME:', !!c.env.CLOUDINARY_CLOUD_NAME);
        console.log('   - CLOUDINARY_API_KEY:', !!c.env.CLOUDINARY_API_KEY);
        console.log('   - CLOUDINARY_API_SECRET:', !!c.env.CLOUDINARY_API_SECRET);
      }
    }

    // Get user ID from context for data isolation
    const userId = getUserIdFromContext(c);

    // Create expense with receipt URL
    const { data: newExpense, error } = await c.get('supabase')
      .from('expenses')
      .insert({
        ...expenseData,
        user_id: userId,
        receipt_url: receiptUrl,
        added_by: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select(`
        *,
        expense_categories (
          category_id,
          category_name,
          description,
          budget
        )
      `)
      .single();

    if (error) {
      throw new Error(`Failed to create expense: ${error.message}`);
    }

    return c.json({
      success: true,
      message: 'Expense created successfully',
      data: newExpense,
      timestamp: new Date().toISOString(),
      requestId: c.get('requestId'),
    }, 201);

  } catch (error) {
    console.error('Create expense with receipt error:', error);
    return c.json({
      success: false,
      error: 'Failed to create expense',
      details: { error: error instanceof Error ? error.message : 'Unknown error' },
      timestamp: new Date().toISOString(),
      requestId: c.get('requestId'),
    }, 500);
  }
};
