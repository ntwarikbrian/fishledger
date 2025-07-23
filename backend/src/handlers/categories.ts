/**
 * Product categories handlers for CRUD operations
 * Provides endpoints for managing product categories
 */

import { z } from 'zod';
import type { HonoContext, PaginationParams } from '../types/index';
import {
  calculatePagination,
} from '../utils/response';
import {
  applyPagination,
  applySearch,
  getTotalCount,
  recordExists,
} from '../utils/db';
import {
  getUserIdFromContext,
  createUserFilteredQuery,
  addUserIdToInsertData,
  validateUserIdInUpdateData
} from '../middleware/data-isolation';
import {
  asyncHandler,
  DatabaseError,
  throwValidationError,
  throwNotFoundError,
  throwConflictError,
} from '../middleware/error-handler';

// Validation schemas
const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100, 'Category name too long'),
  description: z.string().max(500, 'Description too long').optional(),
});

const updateCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100, 'Category name too long').optional(),
  description: z.string().max(500, 'Description too long').optional(),
});

const getCategoriesQuerySchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('10'),
  sortBy: z.string().default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  search: z.string().optional(),
});

/**
 * Get all product categories with pagination and search
 * @param request - HTTP request
 * @param context - Request context
 * @returns Paginated list of categories
 */
export const getCategoriesHandler = asyncHandler(async (c: HonoContext) => {
  const queryParams = c.req.query();

  // Validate query parameters
  const validation = getCategoriesQuerySchema.safeParse(queryParams);
  if (!validation.success) {
    throwValidationError('Invalid query parameters', {
      errors: validation.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      })),
    });
  }

  const { page, limit, sortBy, sortOrder, search } = validation.data!;

  // Build query with data isolation
  let query = createUserFilteredQuery(c, 'product_categories', 'category_id, name, description, created_at, updated_at');

  // Apply search
  if (search) {
    query = applySearch(query, search, ['name', 'description']);
  }

  // Get total count for pagination with data isolation
  const userId = getUserIdFromContext(c);
  const totalCount = await getTotalCount(c.get('supabase'), 'product_categories', { user_id: userId });

  // Apply pagination
  query = applyPagination(query, { page, limit, sortBy, sortOrder });

  // Execute query
  const { data: categories, error } = await query;

  if (error) {
    throw new DatabaseError(`Failed to fetch categories: ${error.message}`, error);
  }

  // Calculate pagination info
  const pagination = calculatePagination(totalCount, page, limit);

  return c.json({
    success: true,
    data: categories || [],
    pagination,
    timestamp: new Date().toISOString(),
    requestId: c.get('requestId'),
  });
});

/**
 * Get a single category by ID
 */
export const getCategoryHandler = asyncHandler(async (c: HonoContext) => {
  const id = c.req.param('id');

  if (!id) {
    throwValidationError('Category ID is required');
  }

  // Get category from database with data isolation
  const { data: category, error } = await createUserFilteredQuery(c, 'product_categories', '*')
    .eq('category_id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throwNotFoundError('Category');
    }
    throw new DatabaseError(`Failed to fetch category: ${error.message}`, error);
  }

  return c.json({
    success: true,
    data: category,
    message: 'Category retrieved successfully',
    timestamp: new Date().toISOString(),
    requestId: c.get('requestId'),
  });
});

/**
 * Create a new product category
 * @param request - HTTP request
 * @param context - Request context
 * @returns Created category
 */
export const createCategoryHandler = asyncHandler(async (c: HonoContext) => {
  const body = await c.req.json();

  // Validate request body
  const validation = createCategorySchema.safeParse(body);
  if (!validation.success) {
    throwValidationError('Invalid category data', {
      errors: validation.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      })),
    });
  }

  const categoryData = validation.data!;

  // Check if category name already exists with data isolation
  const { data: existingCategory, error: checkError } = await createUserFilteredQuery(c, 'product_categories', 'category_id')
    .eq('name', categoryData.name)
    .single();

  if (checkError && checkError.code !== 'PGRST116') {
    throw new DatabaseError(`Failed to check category name uniqueness: ${checkError.message}`, checkError);
  }

  if (existingCategory) {
    throwConflictError('A category with this name already exists');
  }

  // Create category with proper data isolation
  const categoryDataWithUser = addUserIdToInsertData(c, {
    name: categoryData.name,
    description: categoryData.description || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  const { data: newCategory, error } = await c.get('supabase')
    .from('product_categories')
    .insert(categoryDataWithUser)
    .select()
    .single();

  if (error) {
    throw new DatabaseError(`Failed to create category: ${error.message}`, error);
  }

  return c.json({
    success: true,
    message: 'Category created successfully',
    data: newCategory,
    requestId: c.get('requestId'),
  }, 201);
});

/**
 * Update an existing category
 */
export const updateCategoryHandler = asyncHandler(async (c: HonoContext) => {
  const id = c.req.param('id');

  if (!id) {
    throwValidationError('Category ID is required');
  }

  const body = await c.req.json();

  // Validate request body
  const validation = updateCategorySchema.safeParse(body);
  if (!validation.success) {
    throwValidationError('Invalid category data', {
      errors: validation.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      })),
    });
  }

  const updateData = validation.data!;

  // Check if category exists
  const categoryExists = await recordExists(c.get('supabase'), 'product_categories', id, 'category_id');
  if (!categoryExists) {
    throwNotFoundError('Category');
  }

  // Check if new name conflicts with existing category (if name is being updated) with data isolation
  if (updateData.name) {
    const { data: existingCategory, error: checkError } = await createUserFilteredQuery(c, 'product_categories', 'category_id')
      .eq('name', updateData.name)
      .neq('category_id', id)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      throw new DatabaseError(`Failed to check category name uniqueness: ${checkError.message}`, checkError);
    }

    if (existingCategory) {
      throwConflictError('A category with this name already exists');
    }
  }

  // Update category with data isolation
  const userId = getUserIdFromContext(c);
  const { data: updatedCategory, error } = await c.get('supabase')
    .from('product_categories')
    .update({
      ...updateData,
      updated_at: new Date().toISOString(),
    })
    .eq('category_id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    throw new DatabaseError(`Failed to update category: ${error.message}`, error);
  }

  return c.json({
    success: true,
    data: updatedCategory,
    message: 'Category updated successfully',
    timestamp: new Date().toISOString(),
    requestId: c.get('requestId'),
  });
});

/**
 * Delete a category
 */
export const deleteCategoryHandler = asyncHandler(async (c: HonoContext) => {
  const id = c.req.param('id');

  if (!id) {
    throwValidationError('Category ID is required');
  }

  // Check if category exists
  const categoryExists = await recordExists(c.get('supabase'), 'product_categories', id, 'category_id');
  if (!categoryExists) {
    throwNotFoundError('Category');
  }

  // Check if category is being used by any products with data isolation
  const { data: productsUsingCategory, error: checkError } = await createUserFilteredQuery(c, 'products', 'product_id')
    .eq('category_id', id)
    .limit(1);

  if (checkError) {
    throw new DatabaseError(`Failed to check category usage: ${checkError.message}`, checkError);
  }

  if (productsUsingCategory && productsUsingCategory.length > 0) {
    return c.json({
      success: false,
      error: 'Cannot delete category because it is being used by one or more products. Please remove all products from this category first.',
      details: {
        productsCount: productsUsingCategory.length,
        reason: 'Category is in use by products'
      },
      timestamp: new Date().toISOString(),
      requestId: c.get('requestId'),
    }, 409);
  }

  // Delete category with data isolation
  const userId = getUserIdFromContext(c);
  const { error } = await c.get('supabase')
    .from('product_categories')
    .delete()
    .eq('category_id', id)
    .eq('user_id', userId);

  if (error) {
    throw new DatabaseError(`Failed to delete category: ${error.message}`, error);
  }

  return c.json({
    success: true,
    data: { deleted: true, category_id: id },
    message: 'Category deleted successfully',
    timestamp: new Date().toISOString(),
    requestId: c.get('requestId'),
  });
});
