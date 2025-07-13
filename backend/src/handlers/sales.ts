/**
 * Sales management handlers for individual product sales
 * Redesigned for simplified sales transactions
 */

import { z } from 'zod';
import type { HonoContext } from '../types/index';
import {
  createErrorResponse,
  createValidationErrorResponse,
  createPaginatedResponse,
  createNotFoundResponse,
  calculatePagination,
} from '../utils/response';
import { createAuditRecord } from './salesAudit';
import {
  applyPagination,
  applySearch,
  getTotalCount,
  recordExists,
} from '../utils/db';

// Validation schemas
const createSaleSchema = z.object({
  product_id: z.string().uuid('Invalid product ID'),
  boxes_quantity: z.number().int().min(0, 'Boxes quantity must be non-negative').default(0),
  kg_quantity: z.number().min(0, 'KG quantity must be non-negative').default(0),
  box_price: z.number().min(0, 'Box price must be non-negative'),
  kg_price: z.number().min(0, 'KG price must be non-negative'),
  payment_method: z.enum(['momo_pay', 'cash', 'bank_transfer']),
  payment_status: z.enum(['paid', 'pending', 'partial']).default('pending'),
  amount_paid: z.number().min(0, 'Amount paid must be non-negative').default(0),
  client_id: z.string().uuid('Invalid client ID').optional(),
  client_name: z.string().optional(),
  email_address: z.string().email('Invalid email format').max(150, 'Email too long').optional(),
  phone: z.string().max(15, 'Phone number too long').optional(),
}).refine(
  (data) => data.boxes_quantity > 0 || data.kg_quantity > 0,
  {
    message: 'At least one of boxes_quantity or kg_quantity must be greater than 0',
    path: ['boxes_quantity'],
  }
).refine(
  (data) => {
    // If payment status is pending or partial, client info is required (not needed for paid)
    if (data.payment_status === 'pending' || data.payment_status === 'partial') {
      return data.client_name && data.client_name.trim().length > 0;
    }
    return true; // For paid status, client info is optional
  },
  {
    message: 'Client name is required for pending or partial payments (not needed for paid)',
    path: ['client_name']
  }
).transform((data) => {
  // Clean up client fields for paid transactions
  if (data.payment_status === 'paid') {
    return {
      ...data,
      client_name: data.client_name?.trim() || undefined,
      email_address: data.email_address?.trim() || undefined,
      phone: data.phone?.trim() || undefined,
    };
  }
  return data;
});

const updateSaleSchema = z.object({
  boxes_quantity: z.number().int().min(0, 'Boxes quantity must be non-negative').optional(),
  kg_quantity: z.number().min(0, 'KG quantity must be non-negative').optional(),
  payment_status: z.enum(['paid', 'pending', 'partial']).optional(),
  payment_method: z.enum(['momo_pay', 'cash', 'bank_transfer']).optional(),
  amount_paid: z.number().min(0, 'Amount paid must be non-negative').optional(),
  total_amount: z.number().min(0, 'Total amount must be non-negative').optional(),
  remaining_amount: z.number().min(0, 'Remaining amount must be non-negative').optional(),
  client_name: z.string().min(1, 'Client name is required').max(100, 'Client name too long').optional(),
  email_address: z.string().email('Invalid email format').max(150, 'Email too long').optional(),
  phone: z.string().max(15, 'Phone number too long').optional(),
});

const getSalesQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  sortBy: z.enum(['date_time', 'total_amount', 'client_name']).default('date_time'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().optional(),
  paymentMethod: z.enum(['momo_pay', 'cash', 'bank_transfer']).optional(),
  paymentStatus: z.enum(['paid', 'pending', 'partial']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  minAmount: z.coerce.number().optional(),
  maxAmount: z.coerce.number().optional(),
  productId: z.string().uuid('Invalid product ID').optional(),
});

/**
 * Get all sales with pagination and filtering
 */
export const getSalesHandler = async (c: HonoContext) => {
  try {
    const queryParams = c.req.query();

    const validation = getSalesQuerySchema.safeParse(queryParams);
    if (!validation.success) {
      const errors = validation.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return c.json(createValidationErrorResponse(errors, c.get('requestId')), 400);
    }

    const { page, limit, sortBy, sortOrder, search, paymentMethod, paymentStatus, startDate, endDate, minAmount, maxAmount, productId } = validation.data;

    // Build query with product information
    let query = c.get('supabase')
      .from('sales')
      .select(`
        id,
        product_id,
        boxes_quantity,
        kg_quantity,
        box_price,
        kg_price,
        total_amount,
        amount_paid,
        remaining_amount,
        date_time,
        payment_status,
        payment_method,
        performed_by,
        client_id,
        client_name,
        email_address,
        phone,
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
    if (paymentMethod) {
      query = query.eq('payment_method', paymentMethod);
    }

    if (paymentStatus) {
      query = query.eq('payment_status', paymentStatus);
    }

    if (productId) {
      query = query.eq('product_id', productId);
    }

    if (startDate) {
      query = query.gte('date_time', startDate);
    }

    if (endDate) {
      query = query.lte('date_time', endDate);
    }

    if (minAmount) {
      query = query.gte('total_amount', minAmount);
    }

    if (maxAmount) {
      query = query.lte('total_amount', maxAmount);
    }

    // Apply search
    if (search) {
      query = applySearch(query, search, ['client_name', 'email_address']);
    }

    // Get total count for pagination
    const totalCount = await getTotalCount(c.get('supabase'), 'sales', {
      paymentMethod,
      paymentStatus,
      productId,
      startDate,
      endDate,
      minAmount,
      maxAmount,
    });

    // Apply pagination
    query = applyPagination(query, { page, limit, sortBy, sortOrder });

    const { data: sales, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch sales: ${error.message}`);
    }

    const pagination = calculatePagination(page, limit, totalCount);

    return createPaginatedResponse(
      sales || [],
      pagination,
      c.get('requestId'),
    );

  } catch (error) {
    console.error('Get sales error:', error);
    return createErrorResponse('Failed to retrieve sales', 500, { error: error instanceof Error ? error.message : 'Unknown error' }, c.get('requestId'));
  }
};

/**
 * Get a single sale by ID
 */
export const getSaleHandler = async (c: HonoContext) => {
  try {
    const id = c.req.param('id');

    if (!id) {
      return c.json(createErrorResponse('Sale ID is required', 400, undefined, c.get('requestId')), 400);
    }

    const { data: sale, error } = await c.get('supabase')
      .from('sales')
      .select(`
        id,
        product_id,
        boxes_quantity,
        kg_quantity,
        box_price,
        kg_price,
        total_amount,
        amount_paid,
        remaining_amount,
        date_time,
        payment_status,
        payment_method,
        performed_by,
        client_id,
        client_name,
        email_address,
        phone,
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
      .eq('id', id)
      .single();

    if (error && error.code === 'PGRST116') {
      return c.json(createNotFoundResponse('Sale', c.get('requestId')), 404);
    }

    if (error) {
      throw new Error(`Failed to fetch sale: ${error.message}`);
    }

    return c.json({
      success: true,
      data: sale,
      message: 'Sale retrieved successfully',
      timestamp: new Date().toISOString(),
      requestId: c.get('requestId'),
    });

  } catch (error) {
    console.error('Get sale error:', error);
    return createErrorResponse('Failed to retrieve sale', 500, { error: error instanceof Error ? error.message : 'Unknown error' }, c.get('requestId'));
  }
};

/**
 * Create a new sale
 */
export const createSaleHandler = async (c: HonoContext) => {
  try {
    const body = await c.req.json();

    const validation = createSaleSchema.safeParse(body);
    if (!validation.success) {
      const errors = validation.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return c.json(createValidationErrorResponse(errors, c.get('requestId')), 400);
    }

    const saleData = validation.data;

    // Validate product exists and get current stock with box-to-kg ratio
    const { data: product, error: productError } = await c.get('supabase')
      .from('products')
      .select('product_id, name, quantity_box, quantity_kg, box_to_kg_ratio, price_per_box, price_per_kg')
      .eq('product_id', saleData.product_id)
      .single();

    if (productError || !product) {
      return c.json(createErrorResponse('Product not found', 404, { error: 'The specified product does not exist' }, c.get('requestId')), 404);
    }

    // Smart inventory deduction logic with detailed tracking
    // Calculate total kg needed (convert boxes to kg + direct kg)
    const totalKgNeeded = (saleData.boxes_quantity * product.box_to_kg_ratio) + saleData.kg_quantity;

    // Calculate total available kg (loose kg + boxes converted to kg)
    const totalAvailableKg = product.quantity_kg + (product.quantity_box * product.box_to_kg_ratio);

    // Check if we have enough total stock
    if (totalAvailableKg < totalKgNeeded) {
      return c.json(createErrorResponse(
        `Insufficient stock: need ${totalKgNeeded}kg, have ${totalAvailableKg}kg available`,
        400,
        {
          needed: totalKgNeeded,
          available: totalAvailableKg,
          shortage: totalKgNeeded - totalAvailableKg,
          currentStock: {
            boxes: product.quantity_box,
            kg: product.quantity_kg,
            boxToKgRatio: product.box_to_kg_ratio
          }
        },
        c.get('requestId')
      ), 400);
    }

    // Initialize deduction tracking
    let actualKgDeducted = 0;
    let actualBoxesDeducted = 0;
    let boxesUnboxed = 0; // Track how many boxes were converted to kg
    let kgFromUnboxing = 0; // Track kg gained from unboxing
    let remainingKgFromUnboxing = 0; // Track leftover kg after unboxing
    const deductionDetails = [];

    // First, handle direct kg sales with smart deduction
    if (saleData.kg_quantity > 0) {
      const kgNeeded = saleData.kg_quantity;

      if (product.quantity_kg >= kgNeeded) {
        // We have enough loose kg - simple deduction
        actualKgDeducted = kgNeeded;
        deductionDetails.push(`Used ${kgNeeded}kg from loose stock`);
      } else {
        // Need to convert boxes to kg
        const availableLooseKg = product.quantity_kg;
        const remainingKgNeeded = kgNeeded - availableLooseKg;
        const boxesNeededForKg = Math.ceil(remainingKgNeeded / product.box_to_kg_ratio);

        if (product.quantity_box >= boxesNeededForKg) {
          // Use all available loose kg first
          actualKgDeducted = availableLooseKg;
          if (availableLooseKg > 0) {
            deductionDetails.push(`Used ${availableLooseKg}kg from loose stock`);
          }

          // Convert boxes to fulfill remaining kg requirement
          actualBoxesDeducted += boxesNeededForKg;
          boxesUnboxed = boxesNeededForKg;
          kgFromUnboxing = boxesNeededForKg * product.box_to_kg_ratio;
          remainingKgFromUnboxing = kgFromUnboxing - remainingKgNeeded;

          deductionDetails.push(`Unboxed ${boxesUnboxed} box(es) to get ${kgFromUnboxing}kg`);
          deductionDetails.push(`Used ${remainingKgNeeded}kg from unboxed stock`);
          if (remainingKgFromUnboxing > 0) {
            deductionDetails.push(`${remainingKgFromUnboxing}kg remaining from unboxing added to loose stock`);
          }
        } else {
          return c.json(createErrorResponse(
            `Insufficient stock for kg requirement: need ${boxesNeededForKg} box(es) to convert, have ${product.quantity_box} box(es)`,
            400,
            {
              kgNeeded: kgNeeded,
              availableLooseKg: availableLooseKg,
              remainingKgNeeded: remainingKgNeeded,
              boxesNeededForConversion: boxesNeededForKg,
              availableBoxes: product.quantity_box
            },
            c.get('requestId')
          ), 400);
        }
      }
    }

    // Then handle box sales
    if (saleData.boxes_quantity > 0) {
      const remainingBoxes = product.quantity_box - actualBoxesDeducted;
      if (remainingBoxes >= saleData.boxes_quantity) {
        actualBoxesDeducted += saleData.boxes_quantity;
        deductionDetails.push(`Used ${saleData.boxes_quantity} box(es) from stock`);
      } else {
        return c.json(createErrorResponse(
          `Insufficient box stock: need ${saleData.boxes_quantity} box(es), have ${remainingBoxes} box(es) remaining after kg conversion`,
          400,
          {
            boxesNeeded: saleData.boxes_quantity,
            boxesAvailable: remainingBoxes,
            boxesUsedForKgConversion: actualBoxesDeducted - saleData.boxes_quantity
          },
          c.get('requestId')
        ), 400);
      }
    }

    // Calculate total amount
    const totalAmount = (saleData.boxes_quantity * saleData.box_price) + (saleData.kg_quantity * saleData.kg_price);

    // Calculate remaining amount for partial payments
    const amountPaid = saleData.amount_paid || 0;
    const remainingAmount = saleData.payment_status === 'paid' ? 0 : totalAmount - amountPaid;

    // Create sale transaction
    const { data: newSale, error: saleError } = await c.get('supabase')
      .from('sales')
      .insert({
        product_id: saleData.product_id,
        boxes_quantity: saleData.boxes_quantity,
        kg_quantity: saleData.kg_quantity,
        box_price: saleData.box_price,
        kg_price: saleData.kg_price,
        total_amount: totalAmount,
        amount_paid: amountPaid,
        remaining_amount: remainingAmount,
        payment_method: saleData.payment_method,
        payment_status: saleData.payment_status,
        performed_by: c.get('user')?.id || 'system', // Get from authenticated user
        client_id: saleData.client_id,
        client_name: saleData.client_name,
        email_address: saleData.email_address,
        phone: saleData.phone,
        date_time: new Date().toISOString(),
      })
      .select()
      .single();

    if (saleError) {
      throw new Error(`Failed to create sale: ${saleError.message}`);
    }

    // Update product stock using smart deduction with unboxing logic
    const newBoxQuantity = product.quantity_box - actualBoxesDeducted;
    // Calculate new kg quantity: subtract used kg, add remaining kg from unboxing
    const newKgQuantity = Math.max(0, product.quantity_kg - actualKgDeducted + remainingKgFromUnboxing);

    const { error: stockUpdateError } = await c.get('supabase')
      .from('products')
      .update({
        quantity_box: newBoxQuantity,
        quantity_kg: newKgQuantity,
        updated_at: new Date().toISOString(),
      })
      .eq('product_id', saleData.product_id);

    if (stockUpdateError) {
      throw new Error(`Failed to update product stock: ${stockUpdateError.message}`);
    }

    // Create detailed success message with deduction information
    let successMessage = 'Sale created successfully';
    if (deductionDetails.length > 0) {
      successMessage += `. Stock deduction: ${deductionDetails.join(', ')}`;
    }

    // Add final stock status
    const finalStockMessage = `After sale: ${newBoxQuantity} boxes, ${newKgQuantity}kg remaining`;

    return c.json({
      success: true,
      data: newSale,
      message: successMessage,
      stockInfo: {
        deductionDetails,
        finalStock: {
          boxes: newBoxQuantity,
          kg: newKgQuantity
        },
        unboxingInfo: boxesUnboxed > 0 ? {
          boxesUnboxed,
          kgFromUnboxing,
          remainingKgFromUnboxing
        } : null
      },
      finalStockMessage,
      timestamp: new Date().toISOString(),
      requestId: c.get('requestId'),
    }, 201);

  } catch (error) {
    console.error('Create sale error:', error);
    return c.json(createErrorResponse('Failed to create sale', 500, { error: error instanceof Error ? error.message : 'Unknown error' }, c.get('requestId')), 500);
  }
};

/**
 * Update an existing sale - Creates audit record for admin approval instead of direct update
 */
export const updateSaleHandler = async (c: HonoContext) => {
  try {
    const id = c.req.param('id');

    if (!id) {
      return c.json(createErrorResponse('Sale ID is required', 400, undefined, c.get('requestId')), 400);
    }

    const body = await c.req.json();

    // Add reason to the validation schema
    const updateSaleWithReasonSchema = updateSaleSchema.extend({
      reason: z.string().min(1, 'Reason is required').max(500, 'Reason too long'),
    });

    const validation = updateSaleWithReasonSchema.safeParse(body);
    if (!validation.success) {
      const errors = validation.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return c.json(createValidationErrorResponse(errors, c.get('requestId')), 400);
    }

    const { reason, ...updateData } = validation.data;

    // Get original sale data for validation and audit trail
    const { data: originalSale, error: fetchError } = await c.get('supabase')
      .from('sales')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !originalSale) {
      return c.json(createNotFoundResponse('Sale', c.get('requestId')), 404);
    }

    // Get product data for stock validation
    const { data: product, error: productError } = await c.get('supabase')
      .from('products')
      .select('product_id, name, quantity_box, quantity_kg, box_to_kg_ratio, price_per_box, price_per_kg')
      .eq('product_id', originalSale.product_id)
      .single();

    if (productError || !product) {
      return c.json(createErrorResponse('Product not found', 404, { error: 'The specified product does not exist' }, c.get('requestId')), 404);
    }

    // Validate stock availability if quantities are being changed
    if (updateData.boxes_quantity !== undefined || updateData.kg_quantity !== undefined) {
      const newBoxes = updateData.boxes_quantity ?? originalSale.boxes_quantity;
      const newKg = updateData.kg_quantity ?? originalSale.kg_quantity;

      // Restore original stock first to calculate available stock
      const restoredBoxQuantity = product.quantity_box + originalSale.boxes_quantity;
      const restoredKgQuantity = product.quantity_kg + originalSale.kg_quantity;

      // Check if we have enough stock for the new quantities
      const totalKgNeeded = (newBoxes * product.box_to_kg_ratio) + newKg;
      const totalAvailableKg = restoredKgQuantity + (restoredBoxQuantity * product.box_to_kg_ratio);

      if (totalAvailableKg < totalKgNeeded) {
        return c.json(createErrorResponse(
          `Insufficient stock for update: need ${totalKgNeeded}kg, have ${totalAvailableKg}kg available`,
          400,
          {
            needed: totalKgNeeded,
            available: totalAvailableKg,
            shortage: totalKgNeeded - totalAvailableKg,
            currentStock: {
              boxes: restoredBoxQuantity,
              kg: restoredKgQuantity,
              boxToKgRatio: product.box_to_kg_ratio
            }
          },
          c.get('requestId')
        ), 400);
      }
    }

    // Determine audit type based on what's being changed
    let auditType: 'quantity_change' | 'payment_update' = 'payment_update';
    let boxesChange = 0;
    let kgChange = 0;

    if (updateData.boxes_quantity !== undefined || updateData.kg_quantity !== undefined) {
      auditType = 'quantity_change';
      boxesChange = (updateData.boxes_quantity ?? originalSale.boxes_quantity) - originalSale.boxes_quantity;
      kgChange = (updateData.kg_quantity ?? originalSale.kg_quantity) - originalSale.kg_quantity;
    }

    // Get user ID for audit record
    const userId = c.get('user')?.id;
    if (!userId) {
      return c.json(createErrorResponse('User not authenticated', 401, undefined, c.get('requestId')), 401);
    }

    // Create audit record instead of direct update
    const auditResult = await createAuditRecord(
      c.get('supabase'),
      id,
      auditType,
      reason,
      userId,
      {
        boxesChange,
        kgChange,
        oldValues: originalSale,
        newValues: updateData,
      }
    );

    if (!auditResult) {
      return c.json(createErrorResponse('Failed to create audit record', 500, undefined, c.get('requestId')), 500);
    }

    return c.json({
      success: true,
      data: {
        audit_created: true,
        sale_id: id,
        status: 'pending_approval',
        message: 'Edit request submitted for admin approval'
      },
      message: 'Sale edit request submitted successfully. Changes will be applied after admin approval.',
      timestamp: new Date().toISOString(),
      requestId: c.get('requestId'),
    });

  } catch (error) {
    console.error('Update sale error:', error);
    return c.json(createErrorResponse('Failed to update sale', 500, { error: error instanceof Error ? error.message : 'Unknown error' }, c.get('requestId')), 500);
  }
};

/**
 * Delete a sale - Creates audit record for admin approval instead of direct deletion
 */
export const deleteSaleHandler = async (c: HonoContext) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();

    if (!id) {
      return c.json(createErrorResponse('Sale ID is required', 400, undefined, c.get('requestId')), 400);
    }

    // Validate reason for deletion
    const deleteReasonSchema = z.object({
      reason: z.string().min(1, 'Reason for deletion is required').max(500, 'Reason too long'),
    });

    const validation = deleteReasonSchema.safeParse(body);
    if (!validation.success) {
      const errors = validation.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return c.json(createValidationErrorResponse(errors, c.get('requestId')), 400);
    }

    const { reason } = validation.data;

    // Get sale details for audit record
    const { data: sale, error: saleError } = await c.get('supabase')
      .from('sales')
      .select('*')
      .eq('id', id)
      .single();

    if (saleError || !sale) {
      return c.json(createNotFoundResponse('Sale', c.get('requestId')), 404);
    }

    // Get user ID for audit record
    const userId = c.get('user')?.id;
    if (!userId) {
      return c.json(createErrorResponse('User not authenticated', 401, undefined, c.get('requestId')), 401);
    }

    // Create audit record for deletion request
    const auditResult = await createAuditRecord(
      c.get('supabase'),
      id,
      'deletion',
      reason,
      userId,
      {
        boxesChange: sale.boxes_quantity, // Will be restored when approved
        kgChange: sale.kg_quantity,
        oldValues: sale,
      }
    );

    if (!auditResult) {
      return c.json(createErrorResponse('Failed to create audit record', 500, undefined, c.get('requestId')), 500);
    }

    return c.json({
      success: true,
      data: {
        audit_created: true,
        sale_id: id,
        status: 'pending_approval',
        message: 'Delete request submitted for admin approval'
      },
      message: 'Sale deletion request submitted successfully. Sale will be deleted after admin approval.',
      timestamp: new Date().toISOString(),
      requestId: c.get('requestId'),
    });

  } catch (error) {
    console.error('Delete sale error:', error);
    return c.json(createErrorResponse('Failed to submit delete request', 500, { error: error instanceof Error ? error.message : 'Unknown error' }, c.get('requestId')), 500);
  }
};
