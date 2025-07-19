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
  movement_type: z.enum(['damaged', 'new_stock', 'stock_correction', 'product_edit']).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

const createStockMovementSchema = z.object({
  product_id: z.string().uuid('Invalid product ID'),
  movement_type: z.enum(['damaged', 'new_stock', 'stock_correction', 'product_edit', 'product_delete']),
  box_change: z.number().int().default(0),
  kg_change: z.number().default(0),
  reason: z.string().optional(),
  damaged_id: z.string().uuid().optional(),
  stock_addition_id: z.string().uuid().optional(),
  correction_id: z.string().uuid().optional(),
  // Product edit specific fields
  field_changed: z.string().optional(),
  old_value: z.string().optional(),
  new_value: z.string().optional(),
}).refine((data) => {
  // For product_edit movements, field_changed is required
  if (data.movement_type === 'product_edit') {
    return data.field_changed && data.old_value !== undefined && data.new_value !== undefined;
  }
  // For product_delete movements, field_changed is required
  if (data.movement_type === 'product_delete') {
    return data.field_changed && data.old_value !== undefined && data.new_value !== undefined;
  }
  // For other movements, box_change or kg_change must be non-zero
  return data.box_change !== 0 || data.kg_change !== 0;
}, {
  message: "Product edit and delete movements require field_changed, old_value, and new_value. Other movements require non-zero quantity changes.",
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
      field_changed,
      old_value,
      new_value,
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

  const { product_id, movement_type, box_change, kg_change, reason, damaged_id, stock_addition_id, correction_id, field_changed, old_value, new_value } = validation.data!;

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
      field_changed,
      old_value,
      new_value,
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

/**
 * Approve a pending product edit request
 */
export const approveProductEditHandler = asyncHandler(async (c: HonoContext) => {
  const movementId = c.req.param('movementId');

  if (!movementId) {
    throwValidationError('Movement ID is required');
  }

  // Get the pending movement
  const { data: movement, error: fetchError } = await c.get('supabase')
    .from('stock_movements')
    .select('*')
    .eq('movement_id', movementId)
    .eq('movement_type', 'product_edit')
    .eq('status', 'pending')
    .single();

  if (fetchError || !movement) {
    throwNotFoundError('Pending product edit request');
  }

  // Get current product data
  const { data: product, error: productError } = await c.get('supabase')
    .from('products')
    .select('*')
    .eq('product_id', movement.product_id)
    .single();

  if (productError || !product) {
    throwNotFoundError('Product');
  }

  // Apply the change to the product
  const updateData: any = {};
  updateData[movement.field_changed] = movement.new_value;

  // Convert numeric fields back to proper types
  const numericFields = ['box_to_kg_ratio', 'cost_per_box', 'cost_per_kg', 'price_per_box', 'price_per_kg', 'boxed_low_stock_threshold'];
  if (numericFields.includes(movement.field_changed)) {
    updateData[movement.field_changed] = parseFloat(movement.new_value) || 0;
  }

  // Update the product
  const { error: updateError } = await c.get('supabase')
    .from('products')
    .update(updateData)
    .eq('product_id', movement.product_id);

  if (updateError) {
    throw new Error(`Failed to apply product change: ${updateError.message}`);
  }

  // Update the movement status to completed
  const { error: statusError } = await c.get('supabase')
    .from('stock_movements')
    .update({
      status: 'completed'
    })
    .eq('movement_id', movementId);

  if (statusError) {
    throw new Error(`Failed to update movement status: ${statusError.message}`);
  }

  return c.json({
    success: true,
    message: 'Product edit request approved and applied successfully',
    data: {
      movement_id: movementId,
      product_id: movement.product_id,
      field_changed: movement.field_changed,
      applied_value: movement.new_value
    },
    timestamp: new Date().toISOString(),
    requestId: c.get('requestId'),
  });
});

/**
 * Reject a pending product edit request
 */
export const rejectProductEditHandler = asyncHandler(async (c: HonoContext) => {
  const movementId = c.req.param('movementId');

  if (!movementId) {
    throwValidationError('Movement ID is required');
  }

  // Parse request body for rejection reason
  const body = await c.req.json().catch(() => ({}));
  const rejectionReason = body.reason || 'No reason provided';

  // Get the pending movement
  const { data: movement, error: fetchError } = await c.get('supabase')
    .from('stock_movements')
    .select('*')
    .eq('movement_id', movementId)
    .eq('movement_type', 'product_edit')
    .eq('status', 'pending')
    .single();

  if (fetchError || !movement) {
    throwNotFoundError('Pending product edit request');
  }

  // Update the movement status to cancelled with rejection reason
  const { error: statusError } = await c.get('supabase')
    .from('stock_movements')
    .update({
      status: 'cancelled',
      reason: `${movement.reason} | REJECTED: ${rejectionReason}`
    })
    .eq('movement_id', movementId);

  if (statusError) {
    throw new Error(`Failed to reject movement: ${statusError.message}`);
  }

  return c.json({
    success: true,
    message: 'Product edit request rejected successfully',
    data: {
      movement_id: movementId,
      product_id: movement.product_id,
      field_changed: movement.field_changed,
      rejection_reason: rejectionReason
    },
    timestamp: new Date().toISOString(),
    requestId: c.get('requestId'),
  });
});

/**
 * Approve a pending product delete request
 */
export const approveProductDeleteHandler = asyncHandler(async (c: HonoContext) => {
  const movementId = c.req.param('movementId');

  if (!movementId) {
    throwValidationError('Movement ID is required');
  }

  // Get the pending delete movement
  const { data: movement, error: fetchError } = await c.get('supabase')
    .from('stock_movements')
    .select('*')
    .eq('movement_id', movementId)
    .eq('movement_type', 'product_delete')
    .eq('status', 'pending')
    .single();

  if (fetchError || !movement) {
    throwNotFoundError('Pending product delete request');
  }

  const productId = movement.product_id;

  // Get product details before deletion for final audit trail
  const { data: product, error: productFetchError } = await c.get('supabase')
    .from('products')
    .select('*')
    .eq('product_id', productId)
    .single();

  if (productFetchError || !product) {
    throwNotFoundError('Product to delete');
  }

  console.log(`Executing approved deletion for product ${productId} - removing all related records`);

  // Store the delete request details before deletion
  const deleteRequestDetails = {
    movement_id: movementId,
    product_name: product.name,
    reason: movement.reason,
    performed_by: movement.performed_by,
    requested_at: movement.created_at
  };

  // Delete all related records in the correct order to avoid foreign key constraints

  // 1. Delete sale items (these reference the product)
  const { error: saleItemsError } = await c.get('supabase')
    .from('sale_items')
    .delete()
    .eq('product_id', productId);

  if (saleItemsError) {
    console.error('Error deleting sale items:', saleItemsError);
    // Continue with deletion - don't fail the entire operation
  }

  // 2. Delete stock additions (these reference the product) - should cascade automatically
  const { error: stockAdditionsError } = await c.get('supabase')
    .from('stock_additions')
    .delete()
    .eq('product_id', productId);

  if (stockAdditionsError) {
    console.error('Error deleting stock additions:', stockAdditionsError);
    // Continue with deletion - don't fail the entire operation
  }

  // 3. Delete stock corrections (these reference the product)
  const { error: stockCorrectionsError } = await c.get('supabase')
    .from('stock_corrections')
    .delete()
    .eq('product_id', productId);

  if (stockCorrectionsError) {
    console.error('Error deleting stock corrections:', stockCorrectionsError);
    // Continue with deletion - don't fail the entire operation
  }

  // 4. Delete damaged products (these reference the product)
  const { error: damagedProductsError } = await c.get('supabase')
    .from('damaged_products')
    .delete()
    .eq('product_id', productId);

  if (damagedProductsError) {
    console.error('Error deleting damaged products:', damagedProductsError);
    // Continue with deletion - don't fail the entire operation
  }

  // 5. Delete ALL stock movements for this product (including the delete request)
  // We need to do this because the foreign key constraint prevents product deletion
  const { error: stockMovementsError } = await c.get('supabase')
    .from('stock_movements')
    .delete()
    .eq('product_id', productId);

  if (stockMovementsError) {
    throw new Error(`Failed to delete stock movements: ${stockMovementsError.message}`);
  }

  // 6. Finally, delete the product itself
  const { error: productError } = await c.get('supabase')
    .from('products')
    .delete()
    .eq('product_id', productId);

  if (productError) {
    throw new Error(`Failed to delete product: ${productError.message}`);
  }

  // 7. Create a final audit record in a different table or log the deletion
  console.log(`✅ Product deletion completed successfully:`, {
    product_id: productId,
    product_name: deleteRequestDetails.product_name,
    delete_request_id: deleteRequestDetails.movement_id,
    reason: deleteRequestDetails.reason,
    approved_by: c.get('user')?.id,
    approved_at: new Date().toISOString(),
    requested_by: deleteRequestDetails.performed_by,
    requested_at: deleteRequestDetails.requested_at
  });

  console.log(`Successfully deleted product ${productId} and all related records`);

  return c.json({
    success: true,
    message: 'Product delete request approved and executed successfully',
    data: {
      movement_id: movementId,
      product_id: productId,
      product_name: product.name
    },
    timestamp: new Date().toISOString(),
    requestId: c.get('requestId'),
  });
});

/**
 * Reject a pending product delete request
 */
export const rejectProductDeleteHandler = asyncHandler(async (c: HonoContext) => {
  const movementId = c.req.param('movementId');

  if (!movementId) {
    throwValidationError('Movement ID is required');
  }

  // Parse request body for rejection reason
  const body = await c.req.json().catch(() => ({}));
  const rejectionReason = body.reason || 'No reason provided';

  // Get the pending delete movement
  const { data: movement, error: fetchError } = await c.get('supabase')
    .from('stock_movements')
    .select('*')
    .eq('movement_id', movementId)
    .eq('movement_type', 'product_delete')
    .eq('status', 'pending')
    .single();

  if (fetchError || !movement) {
    throwNotFoundError('Pending product delete request');
  }

  // Update the movement status to rejected
  const { error: statusError } = await c.get('supabase')
    .from('stock_movements')
    .update({
      status: 'rejected',
      new_value: 'DELETION_REJECTED',
      reason: `${movement.reason} - REJECTED: ${rejectionReason}`
    })
    .eq('movement_id', movementId);

  if (statusError) {
    throw new Error(`Failed to reject delete request: ${statusError.message}`);
  }

  return c.json({
    success: true,
    message: 'Product delete request rejected successfully',
    data: {
      movement_id: movementId,
      product_id: movement.product_id,
      rejection_reason: rejectionReason
    },
    timestamp: new Date().toISOString(),
    requestId: c.get('requestId'),
  });
});
