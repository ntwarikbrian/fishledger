/**
 * Expenses handlers for CRUD operations
 * Provides endpoints for managing business expenses and expense categories
 */

import { z } from 'zod';
import type { HonoContext, PaginationParams } from '../types/index';
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

// Validation schemas
const getExpensesQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  sortBy: z.enum(['created_at', 'amount', 'expense_date', 'description']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().optional(),
  category_id: z.string().uuid().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  min_amount: z.coerce.number().optional(),
  max_amount: z.coerce.number().optional(),
});

const createExpenseSchema = z.object({
  description: z.string().min(1).max(255),
  amount: z.number().positive(),
  expense_date: z.string(),
  category_id: z.string().uuid(),
  receipt_url: z.string().url().optional(),
  notes: z.string().max(1000).optional(),
  payment_method: z.enum(['cash', 'card', 'bank_transfer', 'check']).default('cash'),
  vendor_name: z.string().max(255).optional(),
  is_recurring: z.boolean().default(false),
  recurring_frequency: z.enum(['weekly', 'monthly', 'quarterly', 'yearly']).optional(),
});

const updateExpenseSchema = createExpenseSchema.partial();

const createExpenseCategorySchema = z.object({
  category_name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  is_active: z.boolean().default(true),
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

    // Build query
    let query = c.get('supabase')
      .from('expenses')
      .select(`
        expense_id,
        description,
        amount,
        expense_date,
        receipt_url,
        notes,
        payment_method,
        vendor_name,
        is_recurring,
        recurring_frequency,
        created_at,
        updated_at,
        expense_categories (
          category_id,
          category_name,
          color
        )
      `);

    // Apply filters
    if (category_id) {
      query = query.eq('category_id', category_id);
    }

    if (start_date) {
      query = query.gte('expense_date', start_date);
    }

    if (end_date) {
      query = query.lte('expense_date', end_date);
    }

    if (min_amount) {
      query = query.gte('amount', min_amount);
    }

    if (max_amount) {
      query = query.lte('amount', max_amount);
    }

    // Apply search
    if (search) {
      query = applySearch(query, search, ['description', 'vendor_name', 'notes']);
    }

    // Get total count for pagination
    const totalCount = await getTotalCount(c.get('supabase'), 'expenses', {
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

    const { data: expense, error } = await c.get('supabase')
      .from('expenses')
      .select(`
        *,
        expense_categories (
          category_id,
          category_name,
          description,
          color
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
    const body = await c.req.json();

    const validation = createExpenseSchema.safeParse(body);
    if (!validation.success) {
      const errors = validation.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return c.json(createValidationErrorResponse(errors, c.get('requestId')), 400);
    }

    const expenseData = validation.data;

    // Verify category exists
    const categoryExists = await recordExists(c.get('supabase'), 'expense_categories', expenseData.category_id, 'category_id');
    if (!categoryExists) {
      return c.json(createErrorResponse('Invalid category ID', 400, { error: 'The specified expense category does not exist' }, c.get('requestId')), 400);
    }

    // Create expense
    const { data: newExpense, error } = await c.get('supabase')
      .from('expenses')
      .insert({
        ...expenseData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select(`
        *,
        expense_categories (
          category_id,
          category_name,
          color
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
    return c.json(createErrorResponse('Failed to create expense', 500, { error: error instanceof Error ? error.message : 'Unknown error' }, c.get('requestId')), 500);
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

    // Check if expense exists
    const expenseExists = await recordExists(c.get('supabase'), 'expenses', id, 'expense_id');
    if (!expenseExists) {
      return c.json(createNotFoundResponse('Expense', c.get('requestId')), 404);
    }

    // Verify category exists if being updated
    if (updateData.category_id) {
      const categoryExists = await recordExists(c.get('supabase'), 'expense_categories', updateData.category_id, 'category_id');
      if (!categoryExists) {
        return c.json(createErrorResponse('Invalid category ID', 400, { error: 'The specified expense category does not exist' }, c.get('requestId')), 400);
      }
    }

    // Update expense
    const { data: updatedExpense, error } = await c.get('supabase')
      .from('expenses')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('expense_id', id)
      .select(`
        *,
        expense_categories (
          category_id,
          category_name,
          color
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

    // Check if expense exists
    const expenseExists = await recordExists(c.get('supabase'), 'expenses', id, 'expense_id');
    if (!expenseExists) {
      return c.json(createNotFoundResponse('Expense', c.get('requestId')), 404);
    }

    // Delete expense
    const { error } = await c.get('supabase')
      .from('expenses')
      .delete()
      .eq('expense_id', id);

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
    const { data: categories, error } = await c.get('supabase')
      .from('expense_categories')
      .select('*')
      .order('category_name', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch expense categories: ${error.message}`);
    }

    return c.json(createSuccessResponse(categories || [], 'Expense categories retrieved successfully', c.get('requestId')));

  } catch (error) {
    console.error('Get expense categories error:', error);
    return c.json(createErrorResponse('Failed to retrieve expense categories', 500, { error: error instanceof Error ? error.message : 'Unknown error' }, c.get('requestId')), 500);
  }
};

/**
 * Get a single expense category by ID
 */
export const getExpenseCategoryHandler = async (c: HonoContext) => {
  try {
    const id = c.req.param('id');

    if (!id) {
      return c.json(createErrorResponse('Category ID is required', 400, undefined, c.get('requestId')), 400);
    }

    const { data: category, error } = await c.get('supabase')
      .from('expense_categories')
      .select('*')
      .eq('category_id', id)
      .single();

    if (error && error.code === 'PGRST116') {
      return c.json(createNotFoundResponse('Expense Category', c.get('requestId')), 404);
    }

    if (error) {
      throw new Error(`Failed to fetch expense category: ${error.message}`);
    }

    return c.json(createSuccessResponse(category, 'Expense category retrieved successfully', c.get('requestId')));

  } catch (error) {
    console.error('Get expense category error:', error);
    return c.json(createErrorResponse('Failed to retrieve expense category', 500, { error: error instanceof Error ? error.message : 'Unknown error' }, c.get('requestId')), 500);
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

    // Check if category name already exists
    const { data: existingCategory } = await c.get('supabase')
      .from('expense_categories')
      .select('category_id')
      .eq('category_name', categoryData.category_name)
      .single();

    if (existingCategory) {
      return c.json(createErrorResponse('Category name already exists', 409, { error: 'An expense category with this name already exists' }, c.get('requestId')), 409);
    }

    // Create category
    const { data: newCategory, error } = await c.get('supabase')
      .from('expense_categories')
      .insert({
        ...categoryData,
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
    return c.json(createErrorResponse('Failed to create expense category', 500, { error: error instanceof Error ? error.message : 'Unknown error' }, c.get('requestId')), 500);
  }
};

/**
 * Update an existing expense category
 */
export const updateExpenseCategoryHandler = async (c: HonoContext) => {
  try {
    const id = c.req.param('id');

    if (!id) {
      return c.json(createErrorResponse('Category ID is required', 400, undefined, c.get('requestId')), 400);
    }

    const body = await c.req.json();

    const validation = updateExpenseCategorySchema.safeParse(body);
    if (!validation.success) {
      const errors = validation.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return c.json(createValidationErrorResponse(errors, c.get('requestId')), 400);
    }

    const updateData = validation.data;

    // Check if category exists
    const categoryExists = await recordExists(c.get('supabase'), 'expense_categories', id, 'category_id');
    if (!categoryExists) {
      return c.json(createNotFoundResponse('Expense Category', c.get('requestId')), 404);
    }

    // Check if new name conflicts with existing category (if name is being updated)
    if (updateData.category_name) {
      const { data: existingCategory } = await c.get('supabase')
        .from('expense_categories')
        .select('category_id')
        .eq('category_name', updateData.category_name)
        .neq('category_id', id)
        .single();

      if (existingCategory) {
        return c.json(createErrorResponse('Category name already exists', 409, { error: 'An expense category with this name already exists' }, c.get('requestId')), 409);
      }
    }

    // Update category
    const { data: updatedCategory, error } = await c.get('supabase')
      .from('expense_categories')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('category_id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update expense category: ${error.message}`);
    }

    return c.json(createSuccessResponse(updatedCategory, 'Expense category updated successfully', c.get('requestId')));

  } catch (error) {
    console.error('Update expense category error:', error);
    return c.json(createErrorResponse('Failed to update expense category', 500, { error: error instanceof Error ? error.message : 'Unknown error' }, c.get('requestId')), 500);
  }
};

/**
 * Delete an expense category
 */
export const deleteExpenseCategoryHandler = async (c: HonoContext) => {
  try {
    const id = c.req.param('id');

    if (!id) {
      return c.json(createErrorResponse('Category ID is required', 400, undefined, c.get('requestId')), 400);
    }

    // Check if category exists
    const categoryExists = await recordExists(c.get('supabase'), 'expense_categories', id, 'category_id');
    if (!categoryExists) {
      return c.json(createNotFoundResponse('Expense Category', c.get('requestId')), 404);
    }

    // Check if category is being used by any expenses
    const { data: expensesUsingCategory, error: checkError } = await c.get('supabase')
      .from('expenses')
      .select('expense_id')
      .eq('category_id', id)
      .limit(1);

    if (checkError) {
      throw new Error(`Failed to check category usage: ${checkError.message}`);
    }

    if (expensesUsingCategory && expensesUsingCategory.length > 0) {
      return c.json(createErrorResponse('Cannot delete category', 409, { error: 'This category is being used by one or more expenses' }, c.get('requestId')), 409);
    }

    // Delete category
    const { error } = await c.get('supabase')
      .from('expense_categories')
      .delete()
      .eq('category_id', id);

    if (error) {
      throw new Error(`Failed to delete expense category: ${error.message}`);
    }

    return c.json(createSuccessResponse(
      { deleted: true, category_id: id },
      'Expense category deleted successfully',
      c.get('requestId'),
    ));

  } catch (error) {
    console.error('Delete expense category error:', error);
    return c.json(createErrorResponse('Failed to delete expense category', 500, { error: error instanceof Error ? error.message : 'Unknown error' }, c.get('requestId')), 500);
  }
};
