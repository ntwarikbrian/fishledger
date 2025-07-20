/**
 * Stock corrections handlers for inventory management
 * Provides endpoints for correcting stock discrepancies
 */

import { z } from 'zod';
import type { HonoContext } from '../types/index';
import {
  asyncHandler,
  throwValidationError,
  throwNotFoundError,
} from '../middleware/error-handler';

// Validation schemas
const createStockCorrectionSchema = z.object({
  product_id: z.string().uuid('Invalid product ID'),
  box_adjustment: z.number().int('Box adjustment must be an integer'),
  kg_adjustment: z.number({ message: 'KG adjustment must be a number' }),
  correction_reason: z.string().min(3, 'Correction reason must be at least 3 characters'),
  correction_date: z.string().optional(),
});

/**
 * Create stock correction handler
 */
export const createStockCorrectionHandler = asyncHandler(async (c: HonoContext) => {
  const body = await c.req.json();

  // Validate request body
  const validation = createStockCorrectionSchema.safeParse(body);
  if (!validation.success) {
    throwValidationError('Invalid stock correction data', {
      errors: validation.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }))
    });
  }

  const { product_id, box_adjustment, kg_adjustment, correction_reason, correction_date } = validation.data!;

  // Validate that at least one adjustment is provided
  if (box_adjustment === 0 && kg_adjustment === 0) {
    throwValidationError('At least one adjustment quantity (boxes or kg) must be non-zero');
  }

  // Check if product exists
  const { data: product, error: productError } = await c.get('supabase')
    .from('products')
    .select('product_id, name, quantity_box, quantity_kg')
    .eq('product_id', product_id)
    .single();

  if (productError || !product) {
    throwNotFoundError('Product');
  }

  // Calculate new quantities (product is guaranteed to exist after the check above)
  const newBoxQuantity = product!.quantity_box + box_adjustment;
  const newKgQuantity = product!.quantity_kg + kg_adjustment;

  // Check for negative quantities
  if (newBoxQuantity < 0 || newKgQuantity < 0) {
    throwValidationError('Correction would result in negative stock quantities');
  }

  // Create stock correction record
  const { data: stockCorrection, error: correctionError } = await c.get('supabase')
    .from('stock_corrections')
    .insert({
      product_id,
      box_adjustment,
      kg_adjustment,
      correction_reason,
      correction_date: correction_date || new Date().toISOString().split('T')[0],
      performed_by: c.get('user')?.id,
    })
    .select()
    .single();

  if (correctionError) {
    throw new Error(`Failed to create stock correction: ${correctionError.message}`);
  }

  // Create pending stock movement record for approval
  const { error: movementError } = await c.get('supabase')
    .from('stock_movements')
    .insert({
      product_id,
      movement_type: 'stock_correction',
      box_change: box_adjustment,
      kg_change: kg_adjustment,
      reason: `Stock correction request: ${correction_reason} (Box: ${box_adjustment >= 0 ? '+' : ''}${box_adjustment}, KG: ${kg_adjustment >= 0 ? '+' : ''}${kg_adjustment})`,
      correction_id: stockCorrection.correction_id,
      performed_by: c.get('user')?.id,
      status: 'pending' // Set status to pending for approval
    });

  if (movementError) {
    throw new Error(`Failed to create stock movement: ${movementError.message}`);
  }

  // DO NOT update product quantities immediately - wait for approval

  return c.json({
    success: true,
    data: {
      ...stockCorrection,
      status: 'pending_approval'
    },
    message: 'Stock correction request submitted successfully. Pending approval from admin.',
    timestamp: new Date().toISOString(),
    requestId: c.get('requestId'),
  });
});

/**
 * Get all stock corrections handler
 */
export const getStockCorrectionsHandler = asyncHandler(async (c: HonoContext) => {
  const { data: stockCorrections, error } = await c.get('supabase')
    .from('stock_corrections')
    .select(`
      correction_id,
      product_id,
      box_adjustment,
      kg_adjustment,
      correction_reason,
      correction_date,
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
    `)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch stock corrections: ${error.message}`);
  }

  return c.json({
    success: true,
    data: stockCorrections || [],
    message: 'Stock corrections retrieved successfully',
    timestamp: new Date().toISOString(),
    requestId: c.get('requestId'),
  });
});

/**
 * Get stock corrections for a specific product
 */
export const getProductStockCorrectionsHandler = asyncHandler(async (c: HonoContext) => {
  const productId = c.req.param('id');

  if (!productId) {
    throwValidationError('Product ID is required');
  }

  const { data: stockCorrections, error } = await c.get('supabase')
    .from('stock_corrections')
    .select(`
      correction_id,
      product_id,
      box_adjustment,
      kg_adjustment,
      correction_reason,
      correction_date,
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
    throw new Error(`Failed to fetch stock corrections for product: ${error.message}`);
  }

  return c.json({
    success: true,
    data: stockCorrections || [],
    message: 'Product stock corrections retrieved successfully',
    timestamp: new Date().toISOString(),
    requestId: c.get('requestId'),
  });
});
