/**
 * Stock movement handlers for inventory tracking
 * Provides endpoints for managing stock movements and adjustments
 */

import { z } from 'zod';
import type { HonoContext } from '../types/index';
import {
  asyncHandler,
  throwValidationError,
  throwNotFoundError,
} from '../middleware/error-handler';

// Validation schemas
const stockMovementFiltersSchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('50'),
  sortBy: z.string().default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  product_id: z.string().uuid().optional(),
  movement_type: z.enum(['damaged', 'new_stock', 'stock_correction']).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

const createStockMovementSchema = z.object({
  product_id: z.string().uuid('Invalid product ID'),
  movement_type: z.enum(['damaged', 'new_stock', 'stock_correction']),
  box_change: z.number().int(),
  kg_change: z.number(),
  reason: z.string().optional(),
  damaged_id: z.string().uuid().optional(),
  stock_addition_id: z.string().uuid().optional(),
  correction_id: z.string().uuid().optional(),
});

/**
 * Get all stock movements with pagination and filtering
 */
export const getStockMovementsHandler = asyncHandler(async (c: HonoContext) => {
  // Parse and validate query parameters
  const queryParams = Object.fromEntries(
    Object.entries(c.req.queries()).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value])
  );
  const validation = stockMovementFiltersSchema.safeParse(queryParams);

  if (!validation.success) {
    throwValidationError('Invalid query parameters', {
      errors: validation.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }))
    });
  }

  const { page, limit, sortBy, sortOrder, product_id, movement_type, dateFrom, dateTo } = validation.data!;

  // Build query
  let query = c.get('supabase')
    .from('stock_movements')
    .select(`
      movement_id,
      product_id,
      movement_type,
      box_change,
      kg_change,
      reason,
      status,
      created_at,
      products (
        product_id,
        name,
        category_id,
        product_categories (
          category_id,
          name
        )
      ),
      users (
        user_id,
        owner_name,
        business_name
      )
    `);

  // Apply filters
  if (product_id) {
    query = query.eq('product_id', product_id);
  }
  
  if (movement_type) {
    query = query.eq('movement_type', movement_type);
  }

  if (dateFrom) {
    query = query.gte('created_at', dateFrom);
  }

  if (dateTo) {
    query = query.lte('created_at', dateTo);
  }

  // Apply sorting and pagination
  query = query.order(sortBy, { ascending: sortOrder === 'asc' });
  
  const offset = (page - 1) * limit;
  query = query.range(offset, offset + limit - 1);

  // Execute query
  const { data: movements, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch stock movements: ${error.message}`);
  }

  // Get total count for pagination
  let countQuery = c.get('supabase')
    .from('stock_movements')
    .select('*', { count: 'exact', head: true });

  if (product_id) {
    countQuery = countQuery.eq('product_id', product_id);
  }
  
  if (movement_type) {
    countQuery = countQuery.eq('movement_type', movement_type);
  }

  if (dateFrom) {
    countQuery = countQuery.gte('created_at', dateFrom);
  }

  if (dateTo) {
    countQuery = countQuery.lte('created_at', dateTo);
  }

  const { count: totalCount, error: countError } = await countQuery;

  if (countError) {
    console.error('Failed to get count:', countError);
  }

  return c.json({
    success: true,
    data: movements || [],
    pagination: {
      page,
      limit,
      total: totalCount || 0,
      totalPages: Math.ceil((totalCount || 0) / limit),
    },
    message: 'Stock movements retrieved successfully',
    timestamp: new Date().toISOString(),
    requestId: c.get('requestId'),
  });
});

/**
 * Create a new stock movement
 */
export const createStockMovementHandler = asyncHandler(async (c: HonoContext) => {
  const body = await c.req.json();

  // Validate request body
  const validation = createStockMovementSchema.safeParse(body);
  if (!validation.success) {
    throwValidationError('Invalid stock movement data', {
      errors: validation.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }))
    });
  }

  const { product_id, movement_type, box_change, kg_change, reason, damaged_id, stock_addition_id, correction_id } = validation.data!;

  // Check if product exists
  const { data: product, error: productError } = await c.get('supabase')
    .from('products')
    .select('product_id, name, quantity_box, quantity_kg')
    .eq('product_id', product_id)
    .single();

  if (productError || !product) {
    throwNotFoundError('Product');
  }

  // Create stock movement record
  const { data: stockMovement, error: movementError } = await c.get('supabase')
    .from('stock_movements')
    .insert({
      product_id,
      movement_type,
      box_change,
      kg_change,
      reason,
      damaged_id,
      stock_addition_id,
      correction_id,
      performed_by: c.get('user')?.id,
    })
    .select()
    .single();

  if (movementError) {
    throw new Error(`Failed to create stock movement: ${movementError.message}`);
  }

  return c.json({
    success: true,
    data: stockMovement,
    message: 'Stock movement created successfully',
    timestamp: new Date().toISOString(),
    requestId: c.get('requestId'),
  });
});

/**
 * Get stock movements for a specific product
 */
export const getProductStockMovementsHandler = asyncHandler(async (c: HonoContext) => {
  const productId = c.req.param('productId');

  if (!productId) {
    throwValidationError('Product ID is required');
  }

  // Check if product exists
  const { data: product, error: productError } = await c.get('supabase')
    .from('products')
    .select('product_id, name')
    .eq('product_id', productId)
    .single();

  if (productError || !product) {
    throwNotFoundError('Product');
  }

  const { data: movements, error } = await c.get('supabase')
    .from('stock_movements')
    .select(`
      movement_id,
      product_id,
      movement_type,
      box_change,
      kg_change,
      reason,
      status,
      created_at,
      users (
        user_id,
        owner_name,
        business_name
      )
    `)
    .eq('product_id', productId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch stock movements for product: ${error.message}`);
  }

  return c.json({
    success: true,
    data: movements || [],
    message: 'Product stock movements retrieved successfully',
    timestamp: new Date().toISOString(),
    requestId: c.get('requestId'),
  });
});

/**
 * Get stock summary for a product
 */
export const getStockSummaryHandler = asyncHandler(async (c: HonoContext) => {
  const productId = c.req.param('productId');

  if (!productId) {
    throwValidationError('Product ID is required');
  }

  // Check if product exists and get current stock
  const { data: product, error: productError } = await c.get('supabase')
    .from('products')
    .select('product_id, name, quantity_box, quantity_kg, boxed_low_stock_threshold')
    .eq('product_id', productId)
    .single();

  if (productError || !product) {
    throwNotFoundError('Product');
    return; // This line will never be reached, but helps TypeScript understand
  }

  // Get stock movement summary
  const { data: movements, error: movementsError } = await c.get('supabase')
    .from('stock_movements')
    .select('movement_type, box_change, kg_change')
    .eq('product_id', productId);

  if (movementsError) {
    throw new Error(`Failed to fetch stock movements: ${movementsError.message}`);
  }

  // Calculate totals - product is guaranteed to be non-null here
  const summary = {
    currentStock: {
      boxes: product.quantity_box,
      kg: product.quantity_kg,
    },
    lowStockThreshold: product.boxed_low_stock_threshold,
    isLowStock: product.quantity_box <= product.boxed_low_stock_threshold,
    movements: {
      totalIn: 0,
      totalOut: 0,
      totalDamaged: 0,
    },
  };

  movements?.forEach(movement => {
    if (movement.movement_type === 'new_stock') {
      summary.movements.totalIn += movement.box_change;
    } else if (movement.movement_type === 'damaged') {
      summary.movements.totalDamaged += Math.abs(movement.box_change);
    }
  });

  return c.json({
    success: true,
    data: summary,
    message: 'Stock summary retrieved successfully',
    timestamp: new Date().toISOString(),
    requestId: c.get('requestId'),
  });
});
