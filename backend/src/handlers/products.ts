/**
 * Product handlers for product management endpoints
 * Provides endpoints for managing product catalog using Hono framework
 */

import { z } from 'zod';
import type { HonoContext, PaginationParams } from '../types/index';
import { recordExists } from '../utils/db';
import { calculatePagination } from '../utils/response';

// Request interfaces - Updated to match LocalFishing database schema
export interface CreateProductRequest {
  name: string;
  category_id: string; // Required in schema
  quantity_box?: number;
  box_to_kg_ratio?: number;
  quantity_kg?: number;
  cost_per_box: number; // Required in schema
  cost_per_kg: number; // Required in schema
  price_per_box: number; // Required in schema
  price_per_kg: number; // Required in schema
  boxed_low_stock_threshold?: number;
  expiry_date?: string; // DATE format
}

export interface UpdateProductRequest {
  name?: string;
  category_id?: string;
  quantity_box?: number;
  box_to_kg_ratio?: number;
  quantity_kg?: number;
  cost_per_box?: number;
  cost_per_kg?: number;
  price_per_box?: number;
  price_per_kg?: number;
  boxed_low_stock_threshold?: number;
  expiry_date?: string; // DATE format
}

export interface ProductFilters {
  search?: string;
  category_id?: string;
  low_stock?: boolean;
  expired?: boolean;
  price_min?: number;
  price_max?: number;
}

// Validation schemas - Updated to match LocalFishing database schema
const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(200, 'Product name too long'),
  category_id: z.string().uuid('Invalid category ID'),
  quantity_box: z.number().int().min(0, 'Box quantity must be non-negative').default(0),
  box_to_kg_ratio: z.number().min(0, 'Box to kg ratio must be positive').default(20),
  quantity_kg: z.number().min(0, 'Kg quantity must be non-negative').default(0),
  cost_per_box: z.number().min(0, 'Cost per box must be non-negative'),
  cost_per_kg: z.number().min(0, 'Cost per kg must be non-negative'),
  price_per_box: z.number().min(0, 'Price per box must be non-negative'),
  price_per_kg: z.number().min(0, 'Price per kg must be non-negative'),
  boxed_low_stock_threshold: z.number().int().min(0, 'Low stock threshold must be non-negative').default(10),
  expiry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional(),
});

const updateProductSchema = createProductSchema.partial();

const queryParamsSchema = z.object({
  page: z.string().transform(val => parseInt(val, 10)).optional(),
  limit: z.string().transform(val => parseInt(val, 10)).optional(),
  search: z.string().optional(),
  category_id: z.string().uuid('Invalid category ID').optional(),
  low_stock: z.string().transform(val => val === 'true').optional(),
  expired: z.string().transform(val => val === 'true').optional(),
  price_min: z.string().transform(val => parseFloat(val)).optional(),
  price_max: z.string().transform(val => parseFloat(val)).optional(),
});

/**
 * Get all products handler
 */
export const getProductsHandler = async (c: HonoContext) => {
  try {
    // Parse and validate query parameters
    const queryParams = Object.fromEntries(
      Object.entries(c.req.queries()).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value])
    );
    const validation = queryParamsSchema.safeParse(queryParams);

    if (!validation.success) {
      const errors = validation.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      return c.json({
        success: false,
        error: 'Invalid query parameters',
        details: errors,
        timestamp: new Date().toISOString(),
        requestId: c.get('requestId'),
      }, 400);
    }

    const {
      page = 1,
      limit = 10,
      search,
      category_id,
      low_stock,
      expired,
      price_min,
      price_max
    } = validation.data;

    let query = c.get('supabase')
      .from('products')
      .select(`
        product_id,
        name,
        category_id,
        quantity_box,
        box_to_kg_ratio,
        quantity_kg,
        cost_per_box,
        cost_per_kg,
        price_per_box,
        price_per_kg,
        profit_per_box,
        profit_per_kg,
        boxed_low_stock_threshold,
        expiry_date,
        days_left,
        created_at,
        updated_at,
        product_categories (
          category_id,
          name
        )
      `);

    // Apply search filter - only search by name since other fields don't exist
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    // Apply specific filters
    if (category_id) {
      query = query.eq('category_id', category_id);
    }

    if (low_stock) {
      query = query.lt('quantity_box', 'boxed_low_stock_threshold');
    }

    if (expired) {
      query = query.lt('expiry_date', new Date().toISOString().split('T')[0]); // DATE format
    }

    if (price_min !== undefined) {
      query = query.gte('price_per_box', price_min);
    }

    if (price_max !== undefined) {
      query = query.lte('price_per_box', price_max);
    }

    // Get total count for pagination
    const { count: totalCount } = await c.get('supabase')
      .from('products')
      .select('*', { count: 'exact', head: true });

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    // Execute query
    const { data: products, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch products: ${error.message}`);
    }

    // Calculate pagination metadata
    const pagination = calculatePagination(page, limit, totalCount || 0);

    return c.json({
      success: true,
      message: 'Products retrieved successfully',
      data: products || [],
      pagination,
      timestamp: new Date().toISOString(),
      requestId: c.get('requestId'),
    });
  } catch (error) {
    console.error('Get products error:', error);

    return c.json({
      success: false,
      error: 'Failed to retrieve products',
      timestamp: new Date().toISOString(),
      requestId: c.get('requestId'),
    }, 500);
  }
};

/**
 * Get product by ID handler
 */
export const getProductHandler = async (c: HonoContext) => {
  try {
    const productId = c.req.param('id');

    if (!productId) {
      return c.json({
        success: false,
        error: 'Product ID is required',
        timestamp: new Date().toISOString(),
        requestId: c.get('requestId'),
      }, 400);
    }

    const { data: product, error } = await c.get('supabase')
      .from('products')
      .select(`
        product_id,
        name,
        category_id,
        quantity_box,
        box_to_kg_ratio,
        quantity_kg,
        cost_per_box,
        cost_per_kg,
        price_per_box,
        price_per_kg,
        profit_per_box,
        profit_per_kg,
        boxed_low_stock_threshold,
        expiry_date,
        days_left,
        created_at,
        updated_at,
        product_categories (
          category_id,
          name
        )
      `)
      .eq('product_id', productId)
      .single();

    if (error) {
      throw new Error(`Failed to fetch product: ${error.message}`);
    }

    if (!product) {
      throw new Error('Product not found');
    }

    return c.json({
      success: true,
      message: 'Product retrieved successfully',
      data: product,
      timestamp: new Date().toISOString(),
      requestId: c.get('requestId'),
    });
  } catch (error) {
    console.error('Get product error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Failed to retrieve product';
    const statusCode = errorMessage.includes('not found') ? 404 : 500;

    return c.json({
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString(),
      requestId: c.get('requestId'),
    }, statusCode as any);
  }
};

/**
 * Create product handler - Direct creation without approval workflow
 */
export const createProductHandler = async (c: HonoContext) => {
  try {
    // Parse request body
    const body = await c.req.json() as CreateProductRequest;

    // Validate input
    const validation = createProductSchema.safeParse(body);
    if (!validation.success) {
      const errors = validation.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      return c.json({
        success: false,
        error: 'Validation failed',
        details: errors,
        timestamp: new Date().toISOString(),
        requestId: c.get('requestId'),
      }, 400);
    }

    // Check if category exists
    const { data: categoryExists } = await c.get('supabase')
      .from('product_categories')
      .select('category_id')
      .eq('category_id', validation.data.category_id)
      .single();

    if (!categoryExists) {
      return c.json({
        success: false,
        error: 'Category not found',
        timestamp: new Date().toISOString(),
        requestId: c.get('requestId'),
      }, 400);
    }

    // Create product directly in the products table
    const { data: newProduct, error: createError } = await c.get('supabase')
      .from('products')
      .insert([validation.data])
      .select(`
        product_id,
        name,
        category_id,
        quantity_box,
        box_to_kg_ratio,
        quantity_kg,
        cost_per_box,
        cost_per_kg,
        price_per_box,
        price_per_kg,
        profit_per_box,
        profit_per_kg,
        boxed_low_stock_threshold,
        expiry_date,
        created_at,
        updated_at,
        product_categories (
          category_id,
          name
        )
      `)
      .single();

    if (createError) {
      throw new Error(`Failed to create product: ${createError.message}`);
    }

    return c.json({
      success: true,
      message: 'Product created successfully',
      data: newProduct,
      timestamp: new Date().toISOString(),
      requestId: c.get('requestId'),
    }, 201);
  } catch (error) {
    console.error('Create product error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Failed to create product';

    if (errorMessage.includes('not found')) {
      return c.json({
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString(),
        requestId: c.get('requestId'),
      }, 404);
    } else if (errorMessage.includes('Validation failed')) {
      return c.json({
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString(),
        requestId: c.get('requestId'),
      }, 400);
    }

    return c.json({
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString(),
      requestId: c.get('requestId'),
    }, 500);
  }
};

/**
 * Helper function to create pending product edit requests
 */
const createPendingProductEditRequests = async (
  supabase: any,
  productId: string,
  oldProduct: any,
  newData: any,
  userId: string,
  reason?: string
) => {
  const pendingRequests: Promise<any>[] = [];

  // Define trackable fields with their display names
  const trackableFields = {
    name: 'Product Name',
    box_to_kg_ratio: 'Box to KG Ratio',
    cost_per_box: 'Cost per Box',
    cost_per_kg: 'Cost per KG',
    price_per_box: 'Price per Box',
    price_per_kg: 'Price per KG',
    boxed_low_stock_threshold: 'Low Stock Threshold',
    expiry_date: 'Expiry Date'
  };

  // Compare old and new values for each trackable field
  for (const [field, displayName] of Object.entries(trackableFields)) {
    if (newData.hasOwnProperty(field)) {
      const oldValue = oldProduct[field];
      const newValue = newData[field];

      // Only create pending request if value actually changed
      if (oldValue !== newValue) {
        const pendingRequest = supabase
          .from('stock_movements')
          .insert({
            product_id: productId,
            movement_type: 'product_edit',
            box_change: 0,
            kg_change: 0,
            field_changed: field,
            old_value: oldValue?.toString() || '',
            new_value: newValue?.toString() || '',
            reason: reason || `${displayName} update request`,
            performed_by: userId,
            status: 'pending' // Set status to pending for approval
          });

        pendingRequests.push(pendingRequest);
      }
    }
  }

  // Execute all pending request insertions
  if (pendingRequests.length > 0) {
    try {
      await Promise.all(pendingRequests);
      console.log(`Created ${pendingRequests.length} pending product edit requests for product ${productId}`);
      return pendingRequests.length;
    } catch (error) {
      console.error('Failed to create pending product edit requests:', error);
      throw error;
    }
  }

  return 0;
};

/**
 * Update product handler
 */
export const updateProductHandler = async (c: HonoContext) => {
  try {
    const productId = c.req.param('id');

    if (!productId) {
      return c.json({
        success: false,
        error: 'Product ID is required',
        timestamp: new Date().toISOString(),
        requestId: c.get('requestId'),
      }, 400);
    }

    // Parse request body
    const body = await c.req.json() as UpdateProductRequest;

    // Validate input
    const validation = updateProductSchema.safeParse(body);
    if (!validation.success) {
      const errors = validation.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      return c.json({
        success: false,
        error: 'Validation failed',
        details: errors,
        timestamp: new Date().toISOString(),
        requestId: c.get('requestId'),
      }, 400);
    }

    // Get current product data for audit trail
    const { data: currentProduct, error: fetchError } = await c.get('supabase')
      .from('products')
      .select('*')
      .eq('product_id', productId)
      .single();

    if (fetchError || !currentProduct) {
      return c.json({
        success: false,
        error: 'Product not found',
        timestamp: new Date().toISOString(),
        requestId: c.get('requestId'),
      }, 404);
    }

    // Create pending edit requests instead of applying changes immediately
    const pendingRequestsCount = await createPendingProductEditRequests(
      c.get('supabase'),
      productId,
      currentProduct,
      validation.data,
      c.get('user')?.id,
      body.reason // Optional reason from request body
    );

    if (pendingRequestsCount === 0) {
      return c.json({
        success: true,
        message: 'No changes detected',
        data: currentProduct,
        timestamp: new Date().toISOString(),
        requestId: c.get('requestId'),
      });
    }

    return c.json({
      success: true,
      message: `Product edit request submitted successfully. ${pendingRequestsCount} change(s) pending approval.`,
      data: {
        product_id: productId,
        pending_changes: pendingRequestsCount,
        status: 'pending_approval'
      },
      timestamp: new Date().toISOString(),
      requestId: c.get('requestId'),
    });
  } catch (error) {
    console.error('Update product error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Failed to update product';
    let statusCode = 500;

    if (errorMessage.includes('not found')) {
      statusCode = 404;
    } else if (errorMessage.includes('already exists')) {
      statusCode = 409;
    }

    return c.json({
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString(),
      requestId: c.get('requestId'),
    }, statusCode as any);
  }
};

// Validation schema for delete product request
const deleteProductSchema = z.object({
  reason: z.string().min(1, 'Reason for deletion is required'),
});

/**
 * Delete product handler with cascading delete
 * This will automatically delete all related records when a product is deleted
 */
export const deleteProductHandler = async (c: HonoContext) => {
  try {
    const productId = c.req.param('id');

    if (!productId) {
      return c.json({
        success: false,
        error: 'Product ID is required',
        timestamp: new Date().toISOString(),
        requestId: c.get('requestId'),
      }, 400);
    }

    // Parse and validate request body for deletion reason
    const body = await c.req.json().catch(() => ({}));
    const validation = deleteProductSchema.safeParse(body);

    if (!validation.success) {
      const errors = validation.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      return c.json({
        success: false,
        error: 'Validation failed',
        details: errors,
        timestamp: new Date().toISOString(),
        requestId: c.get('requestId'),
      }, 400);
    }

    const { reason } = validation.data;

    // Get product details before deletion for audit trail
    const { data: product, error: fetchError } = await c.get('supabase')
      .from('products')
      .select('*')
      .eq('product_id', productId)
      .single();

    if (fetchError || !product) {
      return c.json({
        success: false,
        error: 'Product not found',
        timestamp: new Date().toISOString(),
        requestId: c.get('requestId'),
      }, 404);
    }

    // Create pending delete request instead of immediately deleting
    const { error: insertError } = await c.get('supabase')
      .from('stock_movements')
      .insert({
        product_id: productId,
        movement_type: 'product_delete',
        box_change: 0,
        kg_change: 0,
        field_changed: 'product_deletion',
        old_value: `Product: ${product.name} (ID: ${product.product_id})`,
        new_value: 'PENDING_DELETION',
        reason: `Product deletion request: ${reason}`,
        performed_by: c.get('user')?.id,
        status: 'pending' // Set status to pending for approval
      });

    if (insertError) {
      throw new Error(`Failed to create delete request: ${insertError.message}`);
    }

    console.log(`Created pending delete request for product ${productId}`);

    return c.json({
      success: true,
      message: 'Product deletion request submitted successfully! Awaiting approval.',
      timestamp: new Date().toISOString(),
      requestId: c.get('requestId'),
    });
  } catch (error) {
    console.error('Delete product error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Failed to delete product';
    const statusCode = errorMessage.includes('not found') ? 404 : 500;

    return c.json({
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString(),
      requestId: c.get('requestId'),
    }, statusCode as any);
  }
};

/**
 * Get low stock products handler
 */
export const getLowStockHandler = async (c: HonoContext) => {
  try {
    const { data: products, error } = await c.get('supabase')
      .from('products')
      .select(`
        product_id,
        name,
        quantity_box,
        boxed_low_stock_threshold
      `)
      .lt('quantity_box', 'boxed_low_stock_threshold');

    if (error) {
      throw new Error(`Failed to fetch low stock products: ${error.message}`);
    }

    return c.json({
      success: true,
      message: 'Low stock products retrieved successfully',
      data: products || [],
      timestamp: new Date().toISOString(),
      requestId: c.get('requestId'),
    });
  } catch (error) {
    console.error('Get low stock products error:', error);

    return c.json({
      success: false,
      error: 'Failed to retrieve low stock products',
      timestamp: new Date().toISOString(),
      requestId: c.get('requestId'),
    }, 500);
  }
};

/**
 * Get damaged product handler
 */
export const getDamagedProductHandler = async (c: HonoContext) => {
  try {
    // Get all damaged products from the damaged_products table with product details
    const { data: damagedProducts, error } = await c.get('supabase')
      .from('damaged_products')
      .select(`
        damage_id,
        product_id,
        damaged_boxes,
        damaged_kg,
        damaged_reason,
        description,
        damaged_date,
        loss_value,
        damaged_approval,
        approved_date,
        created_at,
        updated_at,
        products (
          product_id,
          name,
          category_id,
          quantity_box,
          quantity_kg,
          price_per_box,
          price_per_kg,
          product_categories (
            category_id,
            name
          )
        ),
        reported_by_user:users!reported_by (
          user_id,
          owner_name,
          business_name
        ),
        approved_by_user:users!approved_by (
          user_id,
          owner_name,
          business_name
        )
      `)
      .order('damaged_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch damaged products: ${error.message}`);
    }

    return c.json({
      success: true,
      message: 'Damaged products retrieved successfully',
      data: damagedProducts || [],
      timestamp: new Date().toISOString(),
      requestId: c.get('requestId'),
    });
  } catch (error) {
    console.error('Get damaged products error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Failed to retrieve damaged products';
    return c.json({
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString(),
      requestId: c.get('requestId'),
    }, 500);
  }
};

/**
 * Record damaged product handler
 */
export const recordDamagedProductHandler = async (c: HonoContext) => {
  try {
    const productId = c.req.param('id');
    const body = await c.req.json();

    if (!productId) {
      return c.json({
        success: false,
        error: 'Product ID is required',
        timestamp: new Date().toISOString(),
        requestId: c.get('requestId'),
      }, 400);
    }

    // Validate request body
    const { damaged_boxes, damaged_kg, damaged_reason, description } = body;

    if (!damaged_reason) {
      return c.json({
        success: false,
        error: 'Damage reason is required',
        timestamp: new Date().toISOString(),
        requestId: c.get('requestId'),
      }, 400);
    }

    if ((!damaged_boxes || damaged_boxes <= 0) && (!damaged_kg || damaged_kg <= 0)) {
      return c.json({
        success: false,
        error: 'At least one damaged quantity (boxes or kg) must be greater than 0',
        timestamp: new Date().toISOString(),
        requestId: c.get('requestId'),
      }, 400);
    }

    // Check if product exists
    const { data: product, error: productError } = await c.get('supabase')
      .from('products')
      .select('product_id, name, quantity_box, quantity_kg, price_per_box, price_per_kg')
      .eq('product_id', productId)
      .single();

    if (productError || !product) {
      return c.json({
        success: false,
        error: 'Product not found',
        timestamp: new Date().toISOString(),
        requestId: c.get('requestId'),
      }, 404);
    }

    // Check if there's enough stock
    if (damaged_boxes > product.quantity_box || damaged_kg > product.quantity_kg) {
      return c.json({
        success: false,
        error: 'Insufficient stock for the requested damage quantity',
        timestamp: new Date().toISOString(),
        requestId: c.get('requestId'),
      }, 400);
    }

    // Calculate loss value
    const lossValue = (damaged_boxes * product.price_per_box) + (damaged_kg * product.price_per_kg);

    // Create damaged product record
    const { data: damagedProduct, error: damageError } = await c.get('supabase')
      .from('damaged_products')
      .insert({
        product_id: productId,
        damaged_boxes: damaged_boxes || 0,
        damaged_kg: damaged_kg || 0,
        damaged_reason,
        description,
        loss_value: lossValue,
        reported_by: c.get('user')?.id,
        damaged_date: new Date().toISOString().split('T')[0],
      })
      .select()
      .single();

    if (damageError) {
      throw new Error(`Failed to record damaged product: ${damageError.message}`);
    }

    // Create stock movement record
    const { error: movementError } = await c.get('supabase')
      .from('stock_movements')
      .insert({
        product_id: productId,
        movement_type: 'damaged',
        box_change: -(damaged_boxes || 0),
        kg_change: -(damaged_kg || 0),
        reason: `Damaged: ${damaged_reason}`,
        damaged_id: damagedProduct.damage_id,
        performed_by: c.get('user')?.id,
      });

    if (movementError) {
      console.error('Failed to create stock movement:', movementError);
      // Don't fail the request, just log the error
    }

    // Update product quantities
    const { error: updateError } = await c.get('supabase')
      .from('products')
      .update({
        quantity_box: product.quantity_box - (damaged_boxes || 0),
        quantity_kg: product.quantity_kg - (damaged_kg || 0),
        updated_at: new Date().toISOString(),
      })
      .eq('product_id', productId);

    if (updateError) {
      throw new Error(`Failed to update product quantities: ${updateError.message}`);
    }

    return c.json({
      success: true,
      data: damagedProduct,
      message: 'Damaged product recorded successfully',
      timestamp: new Date().toISOString(),
      requestId: c.get('requestId'),
    });
  } catch (error) {
    console.error('Record damaged product error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Failed to record damaged product';
    return c.json({
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString(),
      requestId: c.get('requestId'),
    }, 500);
  }
};

/**
 * Delete damaged product handler
 */
export const deleteDamagedProductHandler = async (c: HonoContext) => {
  try {
    const damageId = c.req.param('damageId');

    if (!damageId) {
      return c.json({
        success: false,
        error: 'Damage ID is required',
        timestamp: new Date().toISOString(),
        requestId: c.get('requestId'),
      }, 400);
    }

    // Get the damaged product record first to restore stock
    const { data: damagedProduct, error: fetchError } = await c.get('supabase')
      .from('damaged_products')
      .select(`
        damage_id,
        product_id,
        damaged_boxes,
        damaged_kg,
        damaged_reason,
        loss_value,
        products (
          product_id,
          name,
          quantity_box,
          quantity_kg
        )
      `)
      .eq('damage_id', damageId)
      .single();

    if (fetchError || !damagedProduct) {
      return c.json({
        success: false,
        error: 'Damaged product record not found',
        timestamp: new Date().toISOString(),
        requestId: c.get('requestId'),
      }, 404);
    }

    // Restore the stock quantities to the product
    const { error: updateError } = await c.get('supabase')
      .from('products')
      .update({
        quantity_box: damagedProduct.products.quantity_box + (damagedProduct.damaged_boxes || 0),
        quantity_kg: damagedProduct.products.quantity_kg + (damagedProduct.damaged_kg || 0),
        updated_at: new Date().toISOString(),
      })
      .eq('product_id', damagedProduct.product_id);

    if (updateError) {
      throw new Error(`Failed to restore product quantities: ${updateError.message}`);
    }

    // Delete related stock movement record
    const { error: movementDeleteError } = await c.get('supabase')
      .from('stock_movements')
      .delete()
      .eq('damaged_id', damageId);

    if (movementDeleteError) {
      console.error('Failed to delete stock movement:', movementDeleteError);
      // Don't fail the request, just log the error
    }

    // Delete the damaged product record
    const { error: deleteError } = await c.get('supabase')
      .from('damaged_products')
      .delete()
      .eq('damage_id', damageId);

    if (deleteError) {
      throw new Error(`Failed to delete damaged product record: ${deleteError.message}`);
    }

    return c.json({
      success: true,
      message: 'Damaged product deleted and stock restored successfully',
      data: {
        damage_id: damageId,
        product_name: damagedProduct.products.name,
        restored_boxes: damagedProduct.damaged_boxes || 0,
        restored_kg: damagedProduct.damaged_kg || 0,
      },
      timestamp: new Date().toISOString(),
      requestId: c.get('requestId'),
    });
  } catch (error) {
    console.error('Delete damaged product error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Failed to delete damaged product';
    return c.json({
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString(),
      requestId: c.get('requestId'),
    }, 500);
  }
};
