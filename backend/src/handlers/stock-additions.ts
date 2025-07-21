/**
 * Stock additions handlers for inventory management
 * Provides endpoints for adding stock to products
 */

import { z } from 'zod';
import type { HonoContext } from '../types/index';
import {
  asyncHandler,
  throwValidationError,
  throwNotFoundError,
} from '../middleware/error-handler';
import {
  getUserIdFromContext,
  createUserFilteredQuery,
  addUserIdToInsertData,
  validateUserIdInUpdateData
} from '../middleware/data-isolation';

// Validation schemas
const createStockAdditionSchema = z.object({
  product_id: z.string().uuid('Invalid product ID'),
  boxes_added: z.number().int().min(0, 'Boxes added must be non-negative'),
  kg_added: z.number().min(0, 'KG added must be non-negative'),
  total_cost: z.number().min(0, 'Total cost must be non-negative'),
  delivery_date: z.string().optional(),
});

/**
 * Create stock addition handler
 */
export const createStockAdditionHandler = asyncHandler(async (c: HonoContext) => {
  const body = await c.req.json();

  // Validate request body
  const validation = createStockAdditionSchema.safeParse(body);
  if (!validation.success) {
    throwValidationError('Invalid stock addition data', {
      errors: validation.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }))
    });
  }

  const { product_id, boxes_added, kg_added, total_cost, delivery_date } = validation.data!;

  // Validate that at least one quantity is provided
  if (boxes_added <= 0 && kg_added <= 0) {
    throwValidationError('At least one quantity (boxes or kg) must be greater than 0');
  }

  // Check if product exists
  const { data: product, error: productError } = await c.get('supabase')
    .from('products')
    .select('product_id, name, quantity_box, quantity_kg, box_to_kg_ratio')
    .eq('product_id', product_id)
    .single();

  if (productError || !product) {
    throwNotFoundError('Product');
  }

  // TypeScript assertion: product is guaranteed to exist after the check above
  const validProduct = product!

  // Create stock addition record with proper data isolation
  const stockAdditionData = addUserIdToInsertData(c, {
    product_id,
    boxes_added,
    kg_added,
    total_cost,
    delivery_date: delivery_date || new Date().toISOString().split('T')[0],
    performed_by: c.get('user')?.id,
  });

  const { data: stockAddition, error: additionError } = await c.get('supabase')
    .from('stock_additions')
    .insert(stockAdditionData)
    .select()
    .single();

  if (additionError) {
    throw new Error(`Failed to create stock addition: ${additionError.message}`);
  }

  // Create pending stock movement record for approval
  // Create stock movement with proper data isolation
  const stockMovementData = addUserIdToInsertData(c, {
    product_id,
    movement_type: 'new_stock',
    box_change: boxes_added,
    kg_change: kg_added,
    reason: `Stock addition request: ${boxes_added} boxes, ${kg_added} kg (Cost: $${total_cost}) - Delivery: ${delivery_date || 'Today'}`,
    stock_addition_id: stockAddition.addition_id,
    performed_by: c.get('user')?.id,
    status: 'pending' // Set status to pending for approval
  });

  const { error: movementError } = await c.get('supabase')
    .from('stock_movements')
    .insert(stockMovementData);

  if (movementError) {
    throw new Error(`Failed to create stock movement: ${movementError.message}`);
  }

  // DO NOT update product quantities immediately - wait for approval

  return c.json({
    success: true,
    data: {
      ...stockAddition,
      status: 'pending_approval'
    },
    message: 'Stock addition request submitted successfully. Pending approval from admin.',
    timestamp: new Date().toISOString(),
    requestId: c.get('requestId'),
  });
});

/**
 * Get all stock additions handler
 */
export const getStockAdditionsHandler = asyncHandler(async (c: HonoContext) => {
  const { data: stockAdditions, error } = await c.get('supabase')
    .from('stock_additions')
    .select(`
      addition_id,
      product_id,
      boxes_added,
      kg_added,
      total_cost,
      delivery_date,
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
    `)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch stock additions: ${error.message}`);
  }

  return c.json({
    success: true,
    data: stockAdditions || [],
    message: 'Stock additions retrieved successfully',
    timestamp: new Date().toISOString(),
    requestId: c.get('requestId'),
  });
});

/**
 * Get stock additions for a specific product
 */
export const getProductStockAdditionsHandler = asyncHandler(async (c: HonoContext) => {
  const productId = c.req.param('id');

  if (!productId) {
    throwValidationError('Product ID is required');
  }

  const { data: stockAdditions, error } = await c.get('supabase')
    .from('stock_additions')
    .select(`
      addition_id,
      product_id,
      boxes_added,
      kg_added,
      total_cost,
      delivery_date,
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
    throw new Error(`Failed to fetch stock additions for product: ${error.message}`);
  }

  return c.json({
    success: true,
    data: stockAdditions || [],
    message: 'Product stock additions retrieved successfully',
    timestamp: new Date().toISOString(),
    requestId: c.get('requestId'),
  });
});
