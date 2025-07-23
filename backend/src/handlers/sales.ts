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
import {
  getUserIdFromContext,
  createUserFilteredQuery,
  addUserIdToInsertData,
  validateUserIdInUpdateData
} from '../middleware/data-isolation';

// Validation schemas
const createSaleSchema = z.object({
  product_id: z.string().uuid('Invalid product ID'),
  // Updated to support the new fish sales algorithm - customer requests kg, system handles conversion
  requested_kg: z.number().min(0.1, 'Requested kg must be at least 0.1').max(10000, 'Requested kg too large'),
  payment_method: z.enum(['momo_pay', 'cash', 'bank_transfer']),
  payment_status: z.enum(['paid', 'pending', 'partial']).default('pending'),
  amount_paid: z.number().min(0, 'Amount paid must be non-negative').default(0),
  client_id: z.string().uuid('Invalid client ID').optional(),
  client_name: z.string().optional(),
  email_address: z.string().email('Invalid email format').max(150, 'Email too long').optional(),
  phone: z.string().max(15, 'Phone number too long').optional(),
}).refine(
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
  payment_method: z.enum(['momo_pay', 'cash', 'bank_transfer']).optional(),
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

    // Build query with product information using data isolation
    let query = createUserFilteredQuery(c, 'sales', `
      id,
      product_id,
      boxes_quantity,
      kg_quantity,
      box_price,
      kg_price,
      profit_per_box,
      profit_per_kg,
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
      users!performed_by (
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

    const { data: sale, error } = await createUserFilteredQuery(c, 'sales', `
      id,
      product_id,
      boxes_quantity,
      kg_quantity,
      box_price,
      kg_price,
      profit_per_box,
      profit_per_kg,
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
      users!performed_by (
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
 * Create a new sale using the fish sales algorithm
 * Customer buys in kg, system automatically converts boxes when needed
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

    const { product_id, requested_kg, payment_method, payment_status, amount_paid, client_id, client_name, email_address, phone } = validation.data;

    // Fetch product with current stock and pricing information
    const { data: product, error: productError } = await c.get('supabase')
      .from('products')
      .select('product_id, name, quantity_box, quantity_kg, box_to_kg_ratio, price_per_box, price_per_kg, cost_per_box, cost_per_kg')
      .eq('product_id', product_id)
      .single();

    if (productError || !product) {
      return c.json(createErrorResponse('Product not found', 404, { error: 'The specified product does not exist' }, c.get('requestId')), 404);
    }

    // 🎯 Fish Sales Algorithm Implementation
    // Customer requests kg, system prioritizes kg stock first, then converts boxes if needed

    let availableKg = parseFloat(product.quantity_kg.toString());
    let availableBoxes = parseInt(product.quantity_box.toString());
    const boxToKgRatio = parseFloat(product.box_to_kg_ratio.toString()); // 1 box = X kg (e.g., 10kg)

    let neededKg = parseFloat(requested_kg.toString());
    let usedKg = 0;
    let usedBoxes = 0;
    const deductionDetails = [];

    // Step 1: First use from available kg stock
    if (availableKg >= neededKg) {
      // We have enough kg stock - simple deduction
      usedKg = neededKg;
      availableKg -= neededKg;
      neededKg = 0;
      deductionDetails.push(`Used ${usedKg}kg from loose stock`);
    } else {
      // Use all available kg stock first
      usedKg = availableKg;
      neededKg -= availableKg;
      availableKg = 0;
      if (usedKg > 0) {
        deductionDetails.push(`Used ${usedKg}kg from loose stock`);
      }
    }

    // Step 2: Convert boxes to kg if needed
    if (neededKg > 0) {
      const boxesNeeded = Math.ceil(neededKg / boxToKgRatio);

      if (availableBoxes >= boxesNeeded) {
        // Convert boxes to fulfill remaining kg requirement
        usedBoxes = boxesNeeded;
        availableBoxes -= boxesNeeded;

        // Add the kg from converted boxes to our used kg total
        const kgFromBoxes = boxesNeeded * boxToKgRatio;
        usedKg += kgFromBoxes;

        // If we converted more kg than needed, add the excess back to loose stock
        const excessKg = kgFromBoxes - neededKg;
        if (excessKg > 0) {
          availableKg += excessKg;
          deductionDetails.push(`Converted ${boxesNeeded} box(es) to ${kgFromBoxes}kg, used ${neededKg}kg, added ${excessKg}kg back to loose stock`);
        } else {
          deductionDetails.push(`Converted ${boxesNeeded} box(es) to ${kgFromBoxes}kg`);
        }

        neededKg = 0; // All requirements fulfilled
      } else {
        // Not enough stock available
        const totalAvailableKg = availableKg + (availableBoxes * boxToKgRatio);
        return c.json(createErrorResponse(
          'Not enough stock available',
          400,
          {
            requested: requested_kg,
            available: totalAvailableKg,
            shortage: requested_kg - totalAvailableKg,
            currentStock: {
              boxes: product.quantity_box,
              kg: product.quantity_kg,
              boxToKgRatio: boxToKgRatio
            }
          },
          c.get('requestId')
        ), 400);
      }
    }

    // Calculate pricing and totals
    const totalKgSold = parseFloat(requested_kg.toString()); // What the customer actually bought
    const finalBoxQty = usedBoxes; // Boxes used in the conversion
    const kg_price = parseFloat(product.price_per_kg.toString());
    const box_price = parseFloat(product.price_per_box.toString());

    // Total amount is based on what customer requested (all in kg pricing)
    const total_amount = totalKgSold * kg_price;

    // Calculate remaining amount for partial payments
    const amountPaid = amount_paid || 0;
    const remainingAmount = payment_status === 'paid' ? 0 : total_amount - amountPaid;

    // Calculate profit per unit (selling price - cost price)
    const profitPerBox = box_price - (product.cost_per_box || 0);
    const profitPerKg = kg_price - (product.cost_per_kg || 0);

    // Record the sale in the database with data isolation
    const saleData = addUserIdToInsertData(c, {
      product_id: product_id,
      boxes_quantity: finalBoxQty, // Boxes used in conversion (for audit trail)
      kg_quantity: totalKgSold, // Total kg sold to customer
      box_price: box_price, // Price per box at time of sale
      kg_price: kg_price, // Price per kg at time of sale
      profit_per_box: profitPerBox,
      profit_per_kg: profitPerKg,
      total_amount: total_amount,
      amount_paid: amountPaid,
      remaining_amount: remainingAmount,
      payment_status: payment_status,
      payment_method: payment_method,
      performed_by: c.get('user')?.id || 'system', // Get from authenticated user
      client_id: client_id,
      client_name: client_name,
      email_address: email_address,
      phone: phone,
      date_time: new Date().toISOString(),
    });

    const { data: newSale, error: saleError } = await c.get('supabase')
      .from('sales')
      .insert(saleData)
      .select()
      .single();

    if (saleError) {
      throw new Error(`Failed to create sale: ${saleError.message}`);
    }

    // Update product stock with new quantities
    const { error: stockUpdateError } = await c.get('supabase')
      .from('products')
      .update({
        quantity_box: availableBoxes, // Updated box quantity after conversion
        quantity_kg: availableKg, // Updated kg quantity (includes any excess from box conversion)
        updated_at: new Date().toISOString(),
      })
      .eq('product_id', product_id);

    if (stockUpdateError) {
      throw new Error(`Failed to update product stock: ${stockUpdateError.message}`);
    }

    // Create detailed success response with algorithm information
    const successMessage = `Fish sale completed successfully: ${totalKgSold}kg sold for ${total_amount.toFixed(2)}`;
    const finalStockMessage = `After sale: ${availableBoxes} boxes, ${availableKg.toFixed(2)}kg remaining`;

    return c.json({
      success: true,
      data: newSale,
      message: successMessage,
      saleInfo: {
        sold_kg: totalKgSold,
        used_boxes: finalBoxQty,
        total_amount: total_amount,
        deductionDetails: deductionDetails,
        algorithm: 'fish_sales_kg_priority'
      },
      stockInfo: {
        finalStock: {
          boxes: availableBoxes,
          kg: parseFloat(availableKg.toFixed(2))
        },
        originalStock: {
          boxes: product.quantity_box,
          kg: product.quantity_kg
        }
      },
      finalStockMessage,
      timestamp: new Date().toISOString(),
      requestId: c.get('requestId'),
    }, 201);

  } catch (error) {
    console.error('Fish sale creation error:', error);
    return c.json(createErrorResponse('Failed to create fish sale', 500, { error: error instanceof Error ? error.message : 'Unknown error' }, c.get('requestId')), 500);
  }
};

/**
 * Create a fish sale using the new algorithm (dedicated endpoint)
 * This is the main endpoint for the fish sales system
 */
export const createFishSaleHandler = async (c: HonoContext) => {
  try {
    console.log('🐟 Fish sale handler called');
    console.log('🐟 User from context:', c.get('user'));
    const body = await c.req.json();
    console.log('🐟 Fish sale request body:', JSON.stringify(body, null, 2));

    // Validate the fish sale request
    const fishSaleSchema = z.object({
      product_id: z.string().uuid('Invalid product ID'),
      requested_kg: z.coerce.number().min(0, 'Requested kg must be non-negative').max(10000, 'Requested kg too large').default(0),
      requested_boxes: z.coerce.number().min(0, 'Requested boxes must be non-negative').max(1000, 'Requested boxes too large').default(0).optional(),
      payment_method: z.enum(['momo_pay', 'cash', 'bank_transfer']),
      payment_status: z.enum(['paid', 'pending', 'partial']).default('paid'),
      amount_paid: z.coerce.number().min(0, 'Amount paid must be non-negative').default(0),
      client_id: z.string().uuid('Invalid client ID').optional(),
      client_name: z.string().optional().or(z.literal('')),
      email_address: z.string().max(150, 'Email too long').optional().refine(
        (val) => !val || val === '' || z.string().email().safeParse(val).success,
        { message: 'Invalid email format' }
      ),
      phone: z.string().max(15, 'Phone number too long').optional().or(z.literal('')),
    }).refine(
      (data) => {
        // At least one quantity (kg or boxes) must be specified
        const kg = data.requested_kg || 0;
        const boxes = data.requested_boxes || 0;
        if (kg <= 0 && boxes <= 0) {
          return false;
        }
        return true;
      },
      {
        message: 'Either requested kg or requested boxes must be greater than 0',
        path: ['requested_kg', 'requested_boxes']
      }
    ).refine(
      (data) => {
        // If payment status is pending or partial, client info is required
        if (data.payment_status === 'pending' || data.payment_status === 'partial') {
          return data.client_name && data.client_name.trim().length > 0;
        }
        return true;
      },
      {
        message: 'Client name is required for pending or partial payments',
        path: ['client_name']
      }
    );

    const validation = fishSaleSchema.safeParse(body);
    if (!validation.success) {
      console.log('🐟 Fish sale validation failed:', JSON.stringify(validation.error.errors, null, 2));
      const errors = validation.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      console.log('🐟 Formatted validation errors:', JSON.stringify(errors, null, 2));
      return c.json(createValidationErrorResponse(errors, c.get('requestId')), 400);
    }

    const { product_id, requested_kg, requested_boxes = 0, payment_method, payment_status, amount_paid, client_id, client_name, email_address, phone } = validation.data;

    // Fetch product information
    const { data: product, error: productError } = await c.get('supabase')
      .from('products')
      .select('product_id, name, quantity_box, quantity_kg, box_to_kg_ratio, price_per_box, price_per_kg, cost_per_box, cost_per_kg')
      .eq('product_id', product_id)
      .single();

    if (productError || !product) {
      return c.json(createErrorResponse('Product not found', 404, { error: 'The specified product does not exist' }, c.get('requestId')), 404);
    }

    // 🐟 Enhanced Fish Sales Algorithm Implementation
    let availableKg = parseFloat(product.quantity_kg.toString());
    let availableBoxes = parseInt(product.quantity_box.toString());
    const boxToKgRatio = parseFloat(product.box_to_kg_ratio.toString());

    let neededKg = parseFloat(requested_kg.toString()) || 0;
    let neededBoxes = parseInt(requested_boxes.toString()) || 0;
    let usedKgFromLooseStock = 0;  // Track kg actually consumed from loose stock
    let usedBoxes = 0;
    const algorithmSteps = [];

    // Calculate total needed kg (including boxes converted to kg)
    const totalNeededKg = neededKg + (neededBoxes * boxToKgRatio);

    // Check if we have enough total stock
    const totalAvailable = availableKg + (availableBoxes * boxToKgRatio);
    if (totalNeededKg > totalAvailable) {
      return c.json(createErrorResponse(
        'Not enough stock available',
        400,
        {
          requested_kg: requested_kg,
          requested_boxes: requested_boxes,
          total_needed_kg: totalNeededKg,
          available: totalAvailable,
          shortage: totalNeededKg - totalAvailable,
          currentStock: { boxes: product.quantity_box, kg: product.quantity_kg, boxToKgRatio }
        },
        c.get('requestId')
      ), 400);
    }

    // Step 1: Handle direct box requests first (if any)
    if (neededBoxes > 0) {
      if (availableBoxes >= neededBoxes) {
        usedBoxes += neededBoxes;
        availableBoxes -= neededBoxes;
        algorithmSteps.push(`📦 Used ${neededBoxes} box(es) directly`);
      } else {
        return c.json(createErrorResponse(
          'Not enough box stock available',
          400,
          {
            requested_boxes: requested_boxes,
            available_boxes: availableBoxes,
            shortage: requested_boxes - availableBoxes
          },
          c.get('requestId')
        ), 400);
      }
    }

    // Step 2: Handle kg requests
    if (neededKg > 0) {
      // First, use available loose kg
      if (availableKg >= neededKg) {
        // We have enough loose kg to fulfill the entire request
        usedKgFromLooseStock = neededKg;
        availableKg -= neededKg;
        neededKg = 0;
        algorithmSteps.push(`⚖️ Used ${usedKgFromLooseStock}kg from loose stock`);
      } else {
        // Use all available loose kg first
        usedKgFromLooseStock = availableKg;
        neededKg -= availableKg;
        availableKg = 0;
        if (usedKgFromLooseStock > 0) {
          algorithmSteps.push(`⚖️ Used ${usedKgFromLooseStock}kg from loose stock`);
        }

        // Convert boxes to kg for remaining needed kg
        if (neededKg > 0) {
          const boxesNeeded = Math.ceil(neededKg / boxToKgRatio);

          if (availableBoxes >= boxesNeeded) {
            usedBoxes += boxesNeeded;
            availableBoxes -= boxesNeeded;
            const kgFromBoxes = boxesNeeded * boxToKgRatio;

            // Add ALL converted kg to loose stock first
            availableKg += kgFromBoxes;

            // Then subtract only what the customer actually needs
            availableKg -= neededKg;
            usedKgFromLooseStock += neededKg;  // Track total kg consumed by customer

            const excessKg = kgFromBoxes - neededKg;
            algorithmSteps.push(`📦➡️⚖️ Converted ${boxesNeeded} box(es) to ${kgFromBoxes}kg, used ${neededKg}kg from conversion, ${excessKg.toFixed(2)}kg remains in loose stock`);

            neededKg = 0; // Request fulfilled
          }
        }
      }
    }

    // Calculate pricing
    const kg_price = parseFloat(product.price_per_kg.toString());
    const box_price = parseFloat(product.price_per_box.toString());

    // Calculate total amount based on what was actually requested
    let total_amount = 0;
    if (requested_kg > 0) {
      total_amount += parseFloat(requested_kg.toString()) * kg_price;
    }
    if (requested_boxes > 0) {
      total_amount += parseInt(requested_boxes.toString()) * box_price;
    }

    const amountPaid = amount_paid || 0;
    const remainingAmount = payment_status === 'paid' ? 0 : total_amount - amountPaid;

    // Calculate profit per unit (selling price - cost price)
    const profitPerBox = box_price - (product.cost_per_box || 0);
    const profitPerKg = kg_price - (product.cost_per_kg || 0);

    // Record the sale with data isolation
    const saleData = addUserIdToInsertData(c, {
      product_id,
      boxes_quantity: parseInt(requested_boxes.toString()) || 0, // Record the originally requested boxes
      kg_quantity: parseFloat(requested_kg.toString()) || 0, // Record the originally requested kg
      box_price,
      kg_price,
      profit_per_box: profitPerBox,
      profit_per_kg: profitPerKg,
      total_amount,
      amount_paid: amountPaid,
      remaining_amount: remainingAmount,
      payment_status,
      payment_method,
      performed_by: c.get('user')?.id || 'system',
      client_id,
      client_name,
      email_address,
      phone,
      date_time: new Date().toISOString(),
    });

    const { data: newSale, error: saleError } = await c.get('supabase')
      .from('sales')
      .insert(saleData)
      .select()
      .single();

    if (saleError) {
      throw new Error(`Failed to create sale: ${saleError.message}`);
    }

    // Update product stock
    const { error: stockUpdateError } = await c.get('supabase')
      .from('products')
      .update({
        quantity_box: availableBoxes,
        quantity_kg: parseFloat(availableKg.toFixed(2)),
        updated_at: new Date().toISOString(),
      })
      .eq('product_id', product_id);

    if (stockUpdateError) {
      throw new Error(`Failed to update product stock: ${stockUpdateError.message}`);
    }

    // Create descriptive message
    let saleDescription = '🐟 Fish sale completed: ';
    const saleItems = [];
    if (requested_kg > 0) saleItems.push(`${requested_kg}kg`);
    if (requested_boxes > 0) saleItems.push(`${requested_boxes} box(es)`);
    saleDescription += saleItems.join(' + ') + ` sold for ${total_amount.toFixed(2)}`;

    return c.json({
      success: true,
      data: newSale,
      message: saleDescription,
      algorithm: {
        name: 'Enhanced Fish Sales Algorithm',
        description: 'Handles both kg and box requests with intelligent stock management',
        steps: algorithmSteps,
        result: {
          sold_kg: parseFloat(requested_kg.toString()) || 0,
          sold_boxes: parseInt(requested_boxes.toString()) || 0,
          used_boxes: usedBoxes, // Total boxes used (including conversions)
          total_amount: parseFloat(total_amount.toFixed(2))
        }
      },
      stockInfo: {
        before: { boxes: product.quantity_box, kg: product.quantity_kg },
        after: { boxes: availableBoxes, kg: parseFloat(availableKg.toFixed(2)) }
      },
      timestamp: new Date().toISOString(),
      requestId: c.get('requestId'),
    }, 201);

  } catch (error) {
    console.error('Fish sale creation error:', error);
    return c.json(createErrorResponse('Failed to create fish sale', 500, { error: error instanceof Error ? error.message : 'Unknown error' }, c.get('requestId')), 500);
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
    let auditType: 'quantity_change' | 'payment_method_change' = 'payment_method_change';
    let boxesChange = 0;
    let kgChange = 0;

    // Calculate quantity changes first
    const newBoxesQuantity = updateData.boxes_quantity ?? originalSale.boxes_quantity;
    const newKgQuantity = updateData.kg_quantity ?? originalSale.kg_quantity;
    boxesChange = newBoxesQuantity - originalSale.boxes_quantity;
    kgChange = newKgQuantity - originalSale.kg_quantity;

    // Check if quantities are actually being changed (not just provided)
    const quantityChanged = boxesChange !== 0 || kgChange !== 0;
    const paymentMethodChanged = updateData.payment_method !== undefined && updateData.payment_method !== originalSale.payment_method;

    // Determine audit type based on actual changes
    if (quantityChanged && paymentMethodChanged) {
      // Both quantities and payment method changed - prioritize quantity change
      auditType = 'quantity_change';
    } else if (quantityChanged) {
      auditType = 'quantity_change';
    } else if (paymentMethodChanged) {
      auditType = 'payment_method_change';
      // Reset quantity changes for payment method only changes
      boxesChange = 0;
      kgChange = 0;
    } else {
      // No meaningful changes detected
      return c.json(createErrorResponse(
        'No changes detected. Please modify quantities or payment method.',
        400,
        undefined,
        c.get('requestId')
      ), 400);
    }

    // Get user ID for audit record
    const userId = c.get('user')?.id;
    if (!userId) {
      return c.json(createErrorResponse('User not authenticated', 401, undefined, c.get('requestId')), 401);
    }

    // Log audit details for debugging
    console.log('Creating audit record:', {
      saleId: id,
      auditType,
      boxesChange,
      kgChange,
      quantityChanged,
      paymentMethodChanged,
      originalQuantities: {
        boxes: originalSale.boxes_quantity,
        kg: originalSale.kg_quantity
      },
      newQuantities: {
        boxes: newBoxesQuantity,
        kg: newKgQuantity
      }
    });

    // Create audit record instead of direct update
    const currentUserId = getUserIdFromContext(c);
    const auditResult = await createAuditRecord(
      c.get('supabase'),
      id,
      auditType,
      reason,
      userId,
      currentUserId, // Add userId parameter for data isolation
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
    const currentUserId = getUserIdFromContext(c);
    const auditResult = await createAuditRecord(
      c.get('supabase'),
      id,
      'deletion',
      reason,
      userId,
      currentUserId, // Add userId parameter for data isolation
      {
        boxesChange: 0, // Deletion audits should not have quantity changes
        kgChange: 0,    // Deletion audits should not have quantity changes
        oldValues: sale, // Store original sale data for restoration when approved
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
