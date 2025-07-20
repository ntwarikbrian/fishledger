/**
 * Transaction handlers for comprehensive transaction management
 * Provides endpoints for managing financial transactions using Hono framework
 */

import { z } from 'zod';
import type { HonoContext, PaginationParams, ValidationError } from '../types/index';
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

/**
 * Helper function to convert ZodError to ValidationError[]
 */
function zodErrorToValidationErrors(zodError: z.ZodError): ValidationError[] {
  return zodError.errors.map((error) => ({
    field: error.path.join('.'),
    message: error.message,
    value: error.code,
  }));
}

// Validation schemas for transaction operations
const createTransactionSchema = z.object({
  sale_id: z.string().uuid('Sale ID must be a valid UUID'),
  date_time: z.string().datetime('Date time must be a valid ISO datetime'),
  product_name: z.string().min(1, 'Product name is required').max(255, 'Product name too long'),
  client_name: z.string().min(1, 'Client name is required').max(255, 'Client name too long'),
  boxes_quantity: z.number().int().min(0, 'Boxes quantity must be non-negative').default(0),
  kg_quantity: z.number().min(0, 'KG quantity must be non-negative').default(0),
  total_amount: z.number().min(0, 'Total amount must be non-negative'),
  payment_status: z.enum(['paid', 'pending', 'partial']).default('pending'),
  payment_method: z.enum(['momo_pay', 'cash', 'bank_transfer']).nullable().optional(),
  deposit_id: z.string().max(100, 'Deposit ID too long').nullable().optional(),
  deposit_type: z.enum(['momo', 'bank', 'boss']).nullable().optional(),
  account_number: z.string().max(50, 'Account number too long').nullable().optional(),
  reference: z.string().max(255, 'Reference too long').nullable().optional(),
  image_url: z.string().url('Image URL must be valid').nullable().optional(),
});

const updateTransactionSchema = createTransactionSchema.partial().omit({ sale_id: true });

const transactionFiltersSchema = z.object({
  payment_status: z.enum(['paid', 'pending', 'partial']).optional(),
  payment_method: z.enum(['momo_pay', 'cash', 'bank_transfer']).optional(),
  deposit_type: z.enum(['momo', 'bank', 'boss']).optional(),
  client_name: z.string().optional(),
  product_name: z.string().optional(),
  date_from: z.string().datetime().optional(),
  date_to: z.string().datetime().optional(),
  search: z.string().optional(),
});

const markAsPaidSchema = z.object({
  client_name: z.string().min(1, 'Client name is required').max(255, 'Client name too long'),
  amount_paid: z.number().min(0.01, 'Amount paid must be greater than 0'),
  payment_method: z.enum(['momo_pay', 'cash', 'bank_transfer']).optional().default('cash'),
  reference: z.string().max(255, 'Reference too long').optional(),
});

// Request interfaces
export interface CreateTransactionRequest {
  sale_id: string;
  date_time: string;
  product_name: string;
  client_name: string;
  boxes_quantity?: number;
  kg_quantity?: number;
  total_amount: number;
  payment_status?: 'paid' | 'pending' | 'partial';
  payment_method?: 'momo_pay' | 'cash' | 'bank_transfer' | null;
  deposit_id?: string | null;
  deposit_type?: 'momo' | 'bank' | 'boss' | null;
  account_number?: string | null;
  reference?: string | null;
  image_url?: string | null;
}

export interface UpdateTransactionRequest {
  date_time?: string;
  product_name?: string;
  client_name?: string;
  boxes_quantity?: number;
  kg_quantity?: number;
  total_amount?: number;
  payment_status?: 'paid' | 'pending' | 'partial';
  payment_method?: 'momo_pay' | 'cash' | 'bank_transfer' | null;
  deposit_id?: string | null;
  deposit_type?: 'momo' | 'bank' | 'boss' | null;
  account_number?: string | null;
  reference?: string | null;
  image_url?: string | null;
}

export interface TransactionFilters {
  payment_status?: 'paid' | 'pending' | 'partial';
  payment_method?: 'momo_pay' | 'cash' | 'bank_transfer';
  deposit_type?: 'momo' | 'bank' | 'boss';
  client_name?: string;
  product_name?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}

export interface MarkAsPaidRequest {
  client_name: string;
  amount_paid: number;
  payment_method?: 'momo_pay' | 'cash' | 'bank_transfer';
  reference?: string;
}

/**
 * Get all transactions with filtering, searching, and pagination
 */
export const getTransactionsHandler = async (c: HonoContext) => {
  try {
    console.log('🔄 getTransactionsHandler called');

    // Parse query parameters
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '10');
    const search = c.req.query('search') || '';

    console.log('📊 Query params:', { page, limit, search });
    
    // Parse filters
    const filters: TransactionFilters = {};

    const paymentStatus = c.req.query('payment_status');
    if (paymentStatus) filters.payment_status = paymentStatus as any;

    const paymentMethod = c.req.query('payment_method');
    if (paymentMethod) filters.payment_method = paymentMethod as any;

    const depositType = c.req.query('deposit_type');
    if (depositType) filters.deposit_type = depositType as any;

    const clientName = c.req.query('client_name');
    if (clientName) filters.client_name = clientName;

    const productName = c.req.query('product_name');
    if (productName) filters.product_name = productName;

    const dateFrom = c.req.query('date_from');
    if (dateFrom) filters.date_from = dateFrom;

    const dateTo = c.req.query('date_to');
    if (dateTo) filters.date_to = dateTo;

    if (search) filters.search = search;

    // Validate filters
    const filterValidation = transactionFiltersSchema.safeParse(filters);
    if (!filterValidation.success) {
      return c.json(
        createValidationErrorResponse(
          zodErrorToValidationErrors(filterValidation.error),
          c.get('requestId')
        ),
        400
      );
    }

    // Build query with filters - Query from sales table since that's where the actual data is
    // Use actual column names from sales table
    let query = c.get('supabase')
      .from('sales')
      .select(`
        id,
        product_id,
        boxes_quantity,
        kg_quantity,
        total_amount,
        date_time,
        payment_status,
        payment_method,
        client_name,
        email_address,
        phone,
        performed_by
      `);

    // Apply filters - adapted for sales table structure (simplified)
    if (filters.payment_status) {
      query = query.eq('payment_status', filters.payment_status);
    }
    if (filters.payment_method) {
      query = query.eq('payment_method', filters.payment_method);
    }
    // Note: deposit_type and product_name filters not available without joins, skip for now
    if (filters.client_name) {
      query = query.ilike('client_name', `%${filters.client_name}%`);
    }
    if (filters.date_from) {
      query = query.gte('date_time', filters.date_from);
    }
    if (filters.date_to) {
      query = query.lte('date_time', filters.date_to);
    }

    // Apply search across available fields - simplified
    if (search) {
      query = query.or(`client_name.ilike.%${search}%,email_address.ilike.%${search}%`);
    }

    // Get total count for pagination - create a separate query for counting from sales table
    let countQuery = c.get('supabase')
      .from('sales')
      .select('*', { count: 'exact', head: true });

    // Apply the same filters to count query (simplified)
    if (filters.payment_status) {
      countQuery = countQuery.eq('payment_status', filters.payment_status);
    }
    if (filters.payment_method) {
      countQuery = countQuery.eq('payment_method', filters.payment_method);
    }
    // Note: deposit_type and product_name filters not available without joins, skip for now
    if (filters.client_name) {
      countQuery = countQuery.ilike('client_name', `%${filters.client_name}%`);
    }
    if (filters.date_from) {
      countQuery = countQuery.gte('date_time', filters.date_from);
    }
    if (filters.date_to) {
      countQuery = countQuery.lte('date_time', filters.date_to);
    }
    if (search) {
      countQuery = countQuery.or(`client_name.ilike.%${search}%,email_address.ilike.%${search}%`);
    }

    console.log('🔍 Executing count query...');
    const { count: totalCount, error: countError } = await countQuery;

    console.log('📊 Count query result:', { totalCount, countError: countError?.message || 'NO ERROR' });

    if (countError) {
      console.error('❌ Count query error:', countError);
      throw new Error(`Failed to count transactions: ${countError.message}`);
    }

    console.log('🔍 Executing main query...');
    // Apply pagination and ordering
    const { data: transactions, error } = await query
      .order('date_time', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    console.log('📊 Main query result:', {
      transactionCount: transactions?.length || 0,
      error: error?.message || 'NO ERROR',
      sampleData: transactions?.slice(0, 1) || 'NO DATA'
    });

    if (error) {
      console.error('❌ Main query error:', error);
      throw new Error(`Failed to fetch transactions: ${error.message}`);
    }

    // Transform sales data to transaction format (using actual sales table columns)
    const transformedTransactions = (transactions || []).map((sale: any) => ({
      transaction_id: sale.id, // Use sale ID as transaction ID
      sale_id: sale.id,
      date_time: sale.date_time,
      product_name: 'Product', // Will need to fetch product name separately if needed
      client_name: sale.client_name || 'Unknown Client',
      boxes_quantity: sale.boxes_quantity || 0,
      kg_quantity: sale.kg_quantity || 0,
      total_amount: sale.total_amount || 0,
      payment_status: sale.payment_status || 'pending',
      payment_method: sale.payment_method || null,
      deposit_id: null, // Not available in sales table
      deposit_type: null, // Not available in sales table
      account_number: null, // Not available in sales table
      reference: null, // Not available in sales table
      image_url: null, // Not available in sales table
      created_at: sale.date_time, // Use date_time as created_at
      updated_at: sale.date_time, // Use date_time as updated_at
      created_by: sale.performed_by,
    }));

    // Calculate pagination info
    const pagination = calculatePagination(page, limit, totalCount || 0);

    // Use Hono's c.json() directly to avoid Response object issues
    const responseData = {
      success: true,
      data: transformedTransactions,
      pagination,
      timestamp: new Date().toISOString(),
      requestId: c.get('requestId') || 'unknown'
    };

    return c.json(responseData);
  } catch (error) {
    console.error('❌ Error in getTransactionsHandler:', error);
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');

    // Use direct JSON response to avoid createErrorResponse issues
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch transactions',
      timestamp: new Date().toISOString(),
      requestId: c.get('requestId') || 'unknown'
    }, 500);
  }
};

/**
 * Get a single transaction by ID
 */
export const getTransactionHandler = async (c: HonoContext) => {
  try {
    const id = c.req.param('id');

    if (!id) {
      return c.json(
        createErrorResponse('Transaction ID is required', 400, undefined, c.get('requestId')),
        400
      );
    }

    const { data: transaction, error } = await c.get('supabase')
      .from('transactions')
      .select(`
        transaction_id,
        sale_id,
        date_time,
        product_name,
        client_name,
        boxes_quantity,
        kg_quantity,
        total_amount,
        payment_status,
        payment_method,
        deposit_id,
        deposit_type,
        account_number,
        reference,
        image_url,
        created_at,
        updated_at,
        created_by,
        sales (
          id,
          product_id,
          amount_paid,
          remaining_amount,
          products (
            product_id,
            name,
            category_id,
            product_categories (
              category_id,
              name
            )
          )
        ),
        created_by
      `)
      .eq('transaction_id', id)
      .single();

    if (error && error.code === 'PGRST116') {
      return c.json(createNotFoundResponse('Transaction', c.get('requestId')), 404);
    }

    if (error) {
      throw new Error(`Failed to fetch transaction: ${error.message}`);
    }

    return c.json(
      createSuccessResponse(transaction, 'Transaction retrieved successfully', c.get('requestId'))
    );
  } catch (error) {
    console.error('Error in getTransactionHandler:', error);
    return c.json(
      createErrorResponse(
        error instanceof Error ? error.message : 'Failed to fetch transaction',
        500,
        undefined,
        c.get('requestId')
      ),
      500
    );
  }
};

/**
 * Create a new transaction
 */
export const createTransactionHandler = async (c: HonoContext) => {
  try {
    const body = await c.req.json();

    // Validate request body
    const validation = createTransactionSchema.safeParse(body);
    if (!validation.success) {
      return c.json(
        createValidationErrorResponse(
          zodErrorToValidationErrors(validation.error),
          c.get('requestId')
        ),
        400
      );
    }

    const transactionData = validation.data;

    // Verify that the sale exists
    const { data: sale, error: saleError } = await c.get('supabase')
      .from('sales')
      .select('id, product_id')
      .eq('id', transactionData.sale_id)
      .single();

    if (saleError || !sale) {
      return c.json(
        createErrorResponse('Referenced sale not found', 404, undefined, c.get('requestId')),
        404
      );
    }

    // Get current user ID - use fallback for development
    const currentUserId = c.get('user')?.id || 'system-user';

    // Create transaction record
    const { data: newTransaction, error } = await c.get('supabase')
      .from('transactions')
      .insert({
        ...transactionData,
        created_by: currentUserId,
        // Note: updated_by field will be added when database is updated
      })
      .select(`
        transaction_id,
        sale_id,
        date_time,
        product_name,
        client_name,
        boxes_quantity,
        kg_quantity,
        total_amount,
        payment_status,
        payment_method,
        deposit_id,
        deposit_type,
        account_number,
        reference,
        image_url,
        created_at,
        updated_at,
        created_by
      `)
      .single();

    if (error) {
      throw new Error(`Failed to create transaction: ${error.message}`);
    }

    return c.json(
      createSuccessResponse(newTransaction, 'Transaction created successfully', c.get('requestId')),
      201
    );
  } catch (error) {
    console.error('Error in createTransactionHandler:', error);
    return c.json(
      createErrorResponse(
        error instanceof Error ? error.message : 'Failed to create transaction',
        500,
        undefined,
        c.get('requestId')
      ),
      500
    );
  }
};

/**
 * Update an existing transaction
 */
export const updateTransactionHandler = async (c: HonoContext) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();

    if (!id) {
      return c.json(
        createErrorResponse('Transaction ID is required', 400, undefined, c.get('requestId')),
        400
      );
    }

    // Validate request body
    const validation = updateTransactionSchema.safeParse(body);
    if (!validation.success) {
      return c.json(
        createValidationErrorResponse(
          zodErrorToValidationErrors(validation.error),
          c.get('requestId')
        ),
        400
      );
    }

    const updateData = {
      ...validation.data,
      updated_at: new Date().toISOString(), // Explicitly set updated timestamp
      // Note: updated_by field will be added when database is updated
    };

    // Check if transaction exists
    const { error: checkError } = await c.get('supabase')
      .from('transactions')
      .select('transaction_id')
      .eq('transaction_id', id)
      .single();

    if (checkError && checkError.code === 'PGRST116') {
      return c.json(createNotFoundResponse('Transaction', c.get('requestId')), 404);
    }

    if (checkError) {
      throw new Error(`Failed to check transaction: ${checkError.message}`);
    }

    // Update transaction record
    const { data: updatedTransaction, error } = await c.get('supabase')
      .from('transactions')
      .update(updateData)
      .eq('transaction_id', id)
      .select(`
        transaction_id,
        sale_id,
        date_time,
        product_name,
        client_name,
        boxes_quantity,
        kg_quantity,
        total_amount,
        payment_status,
        payment_method,
        deposit_id,
        deposit_type,
        account_number,
        reference,
        image_url,
        created_at,
        updated_at,
        created_by
      `)
      .single();

    if (error) {
      throw new Error(`Failed to update transaction: ${error.message}`);
    }

    return c.json(
      createSuccessResponse(updatedTransaction, 'Transaction updated successfully', c.get('requestId'))
    );
  } catch (error) {
    console.error('Error in updateTransactionHandler:', error);
    return c.json(
      createErrorResponse(
        error instanceof Error ? error.message : 'Failed to update transaction',
        500,
        undefined,
        c.get('requestId')
      ),
      500
    );
  }
};

/**
 * Delete a transaction
 */
export const deleteTransactionHandler = async (c: HonoContext) => {
  try {
    const id = c.req.param('id');

    if (!id) {
      return c.json(
        createErrorResponse('Transaction ID is required', 400, undefined, c.get('requestId')),
        400
      );
    }

    // Check if transaction exists
    const { error: checkError } = await c.get('supabase')
      .from('transactions')
      .select('transaction_id, sale_id')
      .eq('transaction_id', id)
      .single();

    if (checkError && checkError.code === 'PGRST116') {
      return c.json(createNotFoundResponse('Transaction', c.get('requestId')), 404);
    }

    if (checkError) {
      throw new Error(`Failed to check transaction: ${checkError.message}`);
    }

    // Delete transaction record
    const { error } = await c.get('supabase')
      .from('transactions')
      .delete()
      .eq('transaction_id', id);

    if (error) {
      throw new Error(`Failed to delete transaction: ${error.message}`);
    }

    return c.json(
      createSuccessResponse(
        { transaction_id: id },
        'Transaction deleted successfully',
        c.get('requestId')
      )
    );
  } catch (error) {
    console.error('Error in deleteTransactionHandler:', error);
    return c.json(
      createErrorResponse(
        error instanceof Error ? error.message : 'Failed to delete transaction',
        500,
        undefined,
        c.get('requestId')
      ),
      500
    );
  }
};

/**
 * Get transaction statistics and summary
 */
export const getTransactionStatsHandler = async (c: HonoContext) => {
  try {
    console.log('🔄 getTransactionStatsHandler called');

    // Check authentication
    const user = c.get('user');
    console.log('👤 User from context:', user ? { id: user.id, role: user.role } : 'NO USER');

    // Check Supabase connection
    const supabase = c.get('supabase');
    console.log('🗄️ Supabase client:', supabase ? 'AVAILABLE' : 'NOT AVAILABLE');

    // Get date range from query parameters
    const dateFrom = c.req.query('date_from');
    const dateTo = c.req.query('date_to');
    console.log('📅 Date filters:', { dateFrom, dateTo });

    // Build base query - Query from sales table since that's where the actual data is
    let query = supabase
      .from('sales')
      .select('total_amount, payment_status, payment_method, date_time');

    // Apply date filters if provided
    if (dateFrom) {
      query = query.gte('date_time', dateFrom);
    }
    if (dateTo) {
      query = query.lte('date_time', dateTo);
    }

    console.log('🔍 Executing query on sales table...');
    const { data: transactions, error } = await query;
    console.log('📊 Query result:', {
      transactionCount: transactions?.length || 0,
      error: error?.message || 'NO ERROR',
      sampleData: transactions?.slice(0, 2) || 'NO DATA'
    });

    if (error) {
      console.error('❌ Database query error:', error);
      throw new Error(`Failed to fetch transaction stats: ${error.message}`);
    }

    console.log('📈 Calculating statistics...');

    // Ensure we have valid data
    const validTransactions = transactions || [];
    console.log('📊 Valid transactions for calculation:', validTransactions.length);

    // Helper function to safely parse amounts
    const safeParseAmount = (amount: any): number => {
      if (amount === null || amount === undefined) return 0;
      const parsed = parseFloat(amount.toString());
      return isNaN(parsed) ? 0 : parsed;
    };

    // Calculate statistics with better error handling
    const stats = {
      total_transactions: validTransactions.length,
      total_amount: validTransactions.reduce((sum, t) => sum + safeParseAmount(t.total_amount), 0),
      paid_transactions: validTransactions.filter(t => t.payment_status === 'paid').length,
      pending_transactions: validTransactions.filter(t => t.payment_status === 'pending').length,
      partial_transactions: validTransactions.filter(t => t.payment_status === 'partial').length,
      paid_amount: validTransactions
        .filter(t => t.payment_status === 'paid')
        .reduce((sum, t) => sum + safeParseAmount(t.total_amount), 0),
      pending_amount: validTransactions
        .filter(t => t.payment_status === 'pending')
        .reduce((sum, t) => sum + safeParseAmount(t.total_amount), 0),
      partial_amount: validTransactions
        .filter(t => t.payment_status === 'partial')
        .reduce((sum, t) => sum + safeParseAmount(t.total_amount), 0),
      payment_methods: {
        momo_pay: validTransactions.filter(t => t.payment_method === 'momo_pay').length,
        cash: validTransactions.filter(t => t.payment_method === 'cash').length,
        bank_transfer: validTransactions.filter(t => t.payment_method === 'bank_transfer').length,
      },
      payment_method_amounts: {
        momo_pay: validTransactions
          .filter(t => t.payment_method === 'momo_pay')
          .reduce((sum, t) => sum + safeParseAmount(t.total_amount), 0),
        cash: validTransactions
          .filter(t => t.payment_method === 'cash')
          .reduce((sum, t) => sum + safeParseAmount(t.total_amount), 0),
        bank_transfer: validTransactions
          .filter(t => t.payment_method === 'bank_transfer')
          .reduce((sum, t) => sum + safeParseAmount(t.total_amount), 0),
      },
    };

    console.log('✅ Stats calculated successfully:', stats);

    // Use Hono's c.json() directly instead of createSuccessResponse to avoid Response object issues
    const responseData = {
      success: true,
      data: stats,
      message: 'Transaction statistics retrieved successfully',
      timestamp: new Date().toISOString(),
      requestId: c.get('requestId') || 'unknown'
    };

    console.log('📤 Sending response data:', JSON.stringify(responseData, null, 2));

    return c.json(responseData);
  } catch (error) {
    console.error('❌ Error in getTransactionStatsHandler:', error);
    return c.json(
      createErrorResponse(
        error instanceof Error ? error.message : 'Failed to fetch transaction statistics',
        500,
        undefined,
        c.get('requestId')
      ),
      500
    );
  }
};

/**
 * Get transactions by sale ID
 */
export const getTransactionsBySaleHandler = async (c: HonoContext) => {
  try {
    const saleId = c.req.param('saleId');

    if (!saleId) {
      return c.json(
        createErrorResponse('Sale ID is required', 400, undefined, c.get('requestId')),
        400
      );
    }

    const { data: transactions, error } = await c.get('supabase')
      .from('transactions')
      .select(`
        transaction_id,
        sale_id,
        date_time,
        product_name,
        client_name,
        boxes_quantity,
        kg_quantity,
        total_amount,
        payment_status,
        payment_method,
        deposit_id,
        deposit_type,
        account_number,
        reference,
        image_url,
        created_at,
        updated_at,
        created_by
      `)
      .eq('sale_id', saleId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch transactions for sale: ${error.message}`);
    }

    return c.json(
      createSuccessResponse(
        transactions || [],
        'Sale transactions retrieved successfully',
        c.get('requestId')
      )
    );
  } catch (error) {
    console.error('Error in getTransactionsBySaleHandler:', error);
    return c.json(
      createErrorResponse(
        error instanceof Error ? error.message : 'Failed to fetch sale transactions',
        500,
        undefined,
        c.get('requestId')
      ),
      500
    );
  }
};

/**
 * Create transaction with image upload (receipt/proof)
 */
export const createTransactionWithImageHandler = async (c: HonoContext) => {
  try {
    // Parse form data
    const formData = await c.req.formData();

    // Extract transaction data from form
    const transactionData = {
      sale_id: formData.get('sale_id') as string,
      date_time: formData.get('date_time') as string,
      product_name: formData.get('product_name') as string,
      client_name: formData.get('client_name') as string,
      boxes_quantity: parseInt(formData.get('boxes_quantity') as string) || 0,
      kg_quantity: parseFloat(formData.get('kg_quantity') as string) || 0,
      total_amount: parseFloat(formData.get('total_amount') as string),
      payment_status: formData.get('payment_status') as string,
      payment_method: formData.get('payment_method') as string,
      deposit_id: formData.get('deposit_id') as string || null,
      deposit_type: formData.get('deposit_type') as string || null,
      account_number: formData.get('account_number') as string || null,
      reference: formData.get('reference') as string || null,
    };

    const image = formData.get('image') as File | null;

    // Validate transaction data
    const validation = createTransactionSchema.safeParse(transactionData);
    if (!validation.success) {
      return c.json(
        createValidationErrorResponse(
          zodErrorToValidationErrors(validation.error),
          c.get('requestId')
        ),
        400
      );
    }

    const validatedData = validation.data;

    // Verify that the sale exists
    const { data: sale, error: saleError } = await c.get('supabase')
      .from('sales')
      .select('id, product_id')
      .eq('id', validatedData.sale_id)
      .single();

    if (saleError || !sale) {
      return c.json(
        createErrorResponse('Referenced sale not found', 404, undefined, c.get('requestId')),
        404
      );
    }

    let imageUrl = null;

    // Handle image upload if provided
    if (image && image.size > 0) {
      // Validate file
      if (!validateFileType(image.type)) {
        return c.json(createErrorResponse('Invalid file type', 400, { error: 'Image file type not supported' }, c.get('requestId')), 400);
      }

      if (!validateFileSize(image.size)) {
        return c.json(createErrorResponse('File too large', 400, { error: 'Image file size exceeds 10MB limit' }, c.get('requestId')), 400);
      }

      // Check if Cloudinary is configured
      if (c.env.CLOUDINARY_CLOUD_NAME && c.env.CLOUDINARY_API_KEY && c.env.CLOUDINARY_API_SECRET) {
        try {
          // Initialize Cloudinary
          initializeCloudinary({
            cloud_name: c.env.CLOUDINARY_CLOUD_NAME,
            api_key: c.env.CLOUDINARY_API_KEY,
            api_secret: c.env.CLOUDINARY_API_SECRET,
          });

          // Upload image to Cloudinary
          const fileBuffer = await image.arrayBuffer();
          const uniqueFilename = generateUniqueFilename(image.name, 'transaction_proof');

          const cloudinaryResult = await uploadToCloudinary(fileBuffer, {
            folder: 'local-fishing/transactions',
            public_id: uniqueFilename,
            resource_type: 'auto',
            tags: ['transaction', 'proof', 'local-fishing'],
          });

          imageUrl = cloudinaryResult.secure_url;
        } catch (uploadError) {
          console.error('Image upload error:', uploadError);
          return c.json(createErrorResponse('Failed to upload image', 500, { error: 'Image upload failed' }, c.get('requestId')), 500);
        }
      }
    }

    // Get current user ID - use fallback for development
    const currentUserId = c.get('user')?.id || 'system-user';

    // Create transaction record with image URL
    const { data: newTransaction, error } = await c.get('supabase')
      .from('transactions')
      .insert({
        ...validatedData,
        image_url: imageUrl,
        created_by: currentUserId,
      })
      .select(`
        transaction_id,
        sale_id,
        date_time,
        product_name,
        client_name,
        boxes_quantity,
        kg_quantity,
        total_amount,
        payment_status,
        payment_method,
        deposit_id,
        deposit_type,
        account_number,
        reference,
        image_url,
        created_at,
        updated_at,
        created_by
      `)
      .single();

    if (error) {
      throw new Error(`Failed to create transaction: ${error.message}`);
    }

    return c.json({
      success: true,
      message: 'Transaction created successfully',
      data: newTransaction,
      timestamp: new Date().toISOString(),
      requestId: c.get('requestId'),
    }, 201);

  } catch (error) {
    console.error('Create transaction with image error:', error);
    return c.json(createErrorResponse('Failed to create transaction', 500, { error: error instanceof Error ? error.message : 'Unknown error' }, c.get('requestId')), 500);
  }
};

/**
 * Get debtors (customers with unpaid or partially paid sales)
 */
export const getDebtorsHandler = async (c: HonoContext) => {
  try {
    // Get query parameters for filtering
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '50');
    const search = c.req.query('search') || '';
    const sortBy = c.req.query('sortBy') || 'remaining_amount';
    const sortOrder = c.req.query('sortOrder') || 'desc';

    // Build query for unpaid/partial sales
    let query = c.get('supabase')
      .from('sales')
      .select(`
        id,
        client_name,
        email_address,
        phone,
        total_amount,
        amount_paid,
        remaining_amount,
        payment_status,
        payment_method,
        date_time,
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
      .in('payment_status', ['pending', 'partial'])
      .gt('remaining_amount', 0);

    // Apply search filter
    if (search) {
      query = query.or(`client_name.ilike.%${search}%,email_address.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    // Apply sorting
    const validSortFields = ['client_name', 'remaining_amount', 'total_amount', 'date_time'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'remaining_amount';
    const order = sortOrder === 'asc' ? { ascending: true } : { ascending: false };
    query = query.order(sortField, order);

    // Get total count for pagination
    const { count: totalCount } = await c.get('supabase')
      .from('sales')
      .select('*', { count: 'exact', head: true })
      .in('payment_status', ['pending', 'partial'])
      .gt('remaining_amount', 0);

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data: sales, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch debtors: ${error.message}`);
    }

    // Group sales by client to aggregate debts
    const debtorMap = new Map();

    sales?.forEach(sale => {
      const clientKey = sale.client_name || 'Unknown Client';

      if (debtorMap.has(clientKey)) {
        const existing = debtorMap.get(clientKey);
        existing.totalOwed += sale.remaining_amount || 0;
        existing.totalAmount += sale.total_amount || 0;
        existing.totalPaid += sale.amount_paid || 0;
        existing.salesCount += 1;
        existing.sales.push(sale);
        // Update contact info if not available
        if (!existing.email && sale.email_address) existing.email = sale.email_address;
        if (!existing.phone && sale.phone) existing.phone = sale.phone;
        // Keep the most recent sale date
        if (new Date(sale.date_time) > new Date(existing.lastSaleDate)) {
          existing.lastSaleDate = sale.date_time;
        }
      } else {
        debtorMap.set(clientKey, {
          clientName: clientKey,
          email: sale.email_address || null,
          phone: sale.phone || null,
          totalOwed: sale.remaining_amount || 0,
          totalAmount: sale.total_amount || 0,
          totalPaid: sale.amount_paid || 0,
          salesCount: 1,
          lastSaleDate: sale.date_time,
          sales: [sale]
        });
      }
    });

    // Convert map to array and sort by total owed
    const debtors = Array.from(debtorMap.values()).sort((a, b) => b.totalOwed - a.totalOwed);

    // Calculate pagination info
    const totalPages = Math.ceil((totalCount || 0) / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return c.json({
      success: true,
      data: debtors,
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        totalPages,
        hasNextPage,
        hasPrevPage,
      },
      timestamp: new Date().toISOString(),
      requestId: c.get('requestId'),
    });

  } catch (error) {
    console.error('Error fetching debtors:', error);
    return c.json(createErrorResponse('Failed to fetch debtors', 500, { error: error instanceof Error ? error.message : 'Unknown error' }, c.get('requestId')), 500);
  }
};

/**
 * Mark debtor as paid - Update payment status for outstanding sales
 */
export const markAsPaidHandler = async (c: HonoContext) => {
  try {
    const body = await c.req.json();

    // Validate request body
    const validation = markAsPaidSchema.safeParse(body);
    if (!validation.success) {
      return c.json(
        createValidationErrorResponse(
          zodErrorToValidationErrors(validation.error),
          c.get('requestId')
        ),
        400
      );
    }

    const { client_name, amount_paid, payment_method, reference } = validation.data;

    // Get current user ID - use fallback for development
    const currentUserId = c.get('user')?.id || 'system-user';

    // Get all unpaid/partial sales for this client, ordered by date (oldest first)
    const { data: unpaidSales, error: salesError } = await c.get('supabase')
      .from('sales')
      .select(`
        id,
        total_amount,
        amount_paid,
        remaining_amount,
        payment_status,
        date_time
      `)
      .eq('client_name', client_name)
      .in('payment_status', ['pending', 'partial'])
      .gt('remaining_amount', 0)
      .order('date_time', { ascending: true });

    if (salesError) {
      throw new Error(`Failed to fetch unpaid sales: ${salesError.message}`);
    }

    if (!unpaidSales || unpaidSales.length === 0) {
      return c.json(
        createErrorResponse('No outstanding payments found for this customer', 404, undefined, c.get('requestId')),
        404
      );
    }

    // Calculate total outstanding amount
    const totalOutstanding = unpaidSales.reduce((sum, sale) => sum + sale.remaining_amount, 0);

    if (amount_paid > totalOutstanding) {
      return c.json(
        createErrorResponse(
          `Payment amount (${amount_paid}) exceeds total outstanding amount (${totalOutstanding})`,
          400,
          undefined,
          c.get('requestId')
        ),
        400
      );
    }

    // Process payments starting from oldest sales
    let remainingPayment = amount_paid;
    const updatedSales = [];
    const updatedTransactions = [];

    for (const sale of unpaidSales) {
      if (remainingPayment <= 0) break;

      const paymentForThisSale = Math.min(remainingPayment, sale.remaining_amount);
      const newAmountPaid = sale.amount_paid + paymentForThisSale;
      const newRemainingAmount = sale.total_amount - newAmountPaid;
      const newPaymentStatus = newRemainingAmount <= 0 ? 'paid' : 'partial';

      // Update the sale record
      const { data: updatedSale, error: updateSaleError } = await c.get('supabase')
        .from('sales')
        .update({
          amount_paid: newAmountPaid,
          remaining_amount: newRemainingAmount,
          payment_status: newPaymentStatus,
          payment_method: payment_method,
          updated_at: new Date().toISOString(),
          performed_by: currentUserId,
        })
        .eq('id', sale.id)
        .select('*')
        .single();

      if (updateSaleError) {
        throw new Error(`Failed to update sale ${sale.id}: ${updateSaleError.message}`);
      }

      updatedSales.push(updatedSale);

      // Update corresponding transaction record
      const { data: updatedTransaction, error: updateTransactionError } = await c.get('supabase')
        .from('transactions')
        .update({
          payment_status: newPaymentStatus,
          payment_method: payment_method,
          reference: reference || null,
          updated_at: new Date().toISOString(),
          updated_by: currentUserId,
        })
        .eq('sale_id', sale.id)
        .select('*')
        .single();

      if (updateTransactionError) {
        console.warn(`Failed to update transaction for sale ${sale.id}: ${updateTransactionError.message}`);
        // Don't fail the entire operation if transaction update fails
      } else {
        updatedTransactions.push(updatedTransaction);
      }

      remainingPayment -= paymentForThisSale;
    }

    return c.json(
      createSuccessResponse(
        {
          client_name,
          amount_paid,
          payment_method,
          reference,
          updated_sales: updatedSales.length,
          updated_transactions: updatedTransactions.length,
          remaining_outstanding: totalOutstanding - amount_paid,
          sales_updated: updatedSales.map(sale => ({
            sale_id: sale.id,
            new_payment_status: sale.payment_status,
            amount_paid_to_sale: sale.amount_paid,
            remaining_amount: sale.remaining_amount,
          })),
        },
        'Payment recorded successfully',
        c.get('requestId')
      )
    );

  } catch (error) {
    console.error('Error marking as paid:', error);
    return c.json(
      createErrorResponse(
        'Failed to record payment',
        500,
        { error: error instanceof Error ? error.message : 'Unknown error' },
        c.get('requestId')
      ),
      500
    );
  }
};
