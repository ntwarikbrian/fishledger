/**
 * Database utilities for Supabase operations
 * Provides common database operations, query helpers, and enhanced error handling
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../config/supabase';
import type { PaginationParams, FilterParams } from '../types/index';
import { createSupabaseClientWithFallback, getSupabaseClientSingleton } from '../config/supabase';
import type { Environment } from '../config/environment';

// Type aliases for convenience
type Tables = Database['public']['Tables'];
type UsersTable = Tables['users'];
type ProductsTable = Tables['products'];
type SalesTable = Tables['sales'];
type StockMovementsTable = Tables['stock_movements'];

/**
 * Generic pagination helper for Supabase queries
 * @param query - Supabase query builder
 * @param params - Pagination parameters
 * @returns Modified query with pagination applied
 */
export function applyPagination<T>(
  query: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  params: PaginationParams,
): any { // eslint-disable-line @typescript-eslint/no-explicit-any
  const { page = 1, limit = 20, sortBy = 'created_at', sortOrder = 'desc' } = params;
  
  // Calculate offset
  const offset = (page - 1) * limit;
  
  return query
    .order(sortBy, { ascending: sortOrder === 'asc' })
    .range(offset, offset + limit - 1);
}

/**
 * Applies search filter to a query
 * @param query - Supabase query builder
 * @param searchTerm - Search term
 * @param searchFields - Fields to search in
 * @returns Modified query with search applied
 */
export function applySearch<T>(
  query: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  searchTerm: string,
  searchFields: string[],
): any { // eslint-disable-line @typescript-eslint/no-explicit-any
  if (!searchTerm.trim()) {
    return query;
  }

  // Create OR condition for multiple fields
  const searchConditions = searchFields
    .map(field => `${field}.ilike.%${searchTerm}%`)
    .join(',');

  return query.or(searchConditions);
}

/**
 * Applies date range filter to a query
 * @param query - Supabase query builder
 * @param dateField - Date field name
 * @param dateFrom - Start date (ISO string)
 * @param dateTo - End date (ISO string)
 * @returns Modified query with date filter applied
 */
export function applyDateFilter<T>(
  query: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  dateField: string,
  dateFrom?: string,
  dateTo?: string,
): any { // eslint-disable-line @typescript-eslint/no-explicit-any
  if (dateFrom) {
    query = query.gte(dateField, dateFrom);
  }
  
  if (dateTo) {
    query = query.lte(dateField, dateTo);
  }
  
  return query;
}

/**
 * Gets total count for a query (for pagination)
 * @param supabase - Supabase client
 * @param tableName - Table name
 * @param filters - Optional filters to apply
 * @returns Promise resolving to total count
 */
export async function getTotalCount(
  supabase: SupabaseClient<Database>,
  tableName: keyof Tables,
  filters?: Record<string, unknown>,
): Promise<number> {
  let query = supabase
    .from(tableName)
    .select('*', { count: 'exact', head: true });

  // Apply filters if provided
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query = query.eq(key, value);
      }
    });
  }

  const { count, error } = await query;

  if (error) {
    throw new Error(`Failed to get count for ${tableName}: ${error.message}`);
  }

  return count || 0;
}

/**
 * Checks if a record exists by ID
 * @param supabase - Supabase client
 * @param tableName - Table name
 * @param id - Record ID
 * @param idColumn - ID column name (defaults based on table)
 * @returns Promise resolving to boolean
 */
export async function recordExists(
  supabase: SupabaseClient<Database>,
  tableName: keyof Tables,
  id: string,
  idColumn?: string,
): Promise<boolean> {
  try {
    // Determine the correct ID column based on table name
    const getIdColumn = (table: string): string => {
      switch (table) {
        case 'users': return 'user_id';
        case 'workers': return 'worker_id';
        case 'products': return 'product_id';
        case 'product_categories': return 'category_id';
        case 'sales': return 'sales_id';
        case 'contacts': return 'contact_id';
        case 'stock_movements': return 'movement_id';
        case 'expenses': return 'expense_id';
        case 'expense_categories': return 'category_id';
        default: return 'id'; // fallback
      }
    };

    const columnName = idColumn || getIdColumn(tableName);

    const { data, error } = await supabase
      .from(tableName)
      .select(columnName)
      .eq(columnName, id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error(`Failed to check if record exists in ${tableName}:`, error);
      throw new Error(`Failed to check if record exists: ${error.message}`);
    }

    return !!data;
  } catch (error) {
    console.error(`Error checking record existence in ${tableName}:`, error);
    return false; // Return false on error to prevent crashes
  }
}

/**
 * Soft delete a record (Note: Your schema doesn't have is_active field)
 * This function is kept for compatibility but may not work with current schema
 * @param supabase - Supabase client
 * @param tableName - Table name
 * @param id - Record ID
 * @param userId - User performing the action
 * @returns Promise resolving to updated record
 */
export async function softDelete(
  _supabase: SupabaseClient<Database>, // eslint-disable-line @typescript-eslint/no-unused-vars
  tableName: 'users' | 'products',
  _id: string, // eslint-disable-line @typescript-eslint/no-unused-vars
  _userId: string, // eslint-disable-line @typescript-eslint/no-unused-vars
): Promise<any> { // eslint-disable-line @typescript-eslint/no-explicit-any
  // Note: Your current schema doesn't have is_active fields
  // This function may need to be updated based on your actual soft delete strategy
  throw new Error(`Soft delete not implemented for current schema. Table ${tableName} doesn't have is_active field.`);
}

/**
 * Creates a new user record
 * @param supabase - Supabase client
 * @param userData - User data to insert
 * @returns Promise resolving to created user
 */
export async function createUser(
  supabase: SupabaseClient<Database>,
  userData: UsersTable['Insert'],
): Promise<UsersTable['Row']> {
  const { data, error } = await supabase
    .from('users')
    .insert({
      ...userData,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create user: ${error.message}`);
  }

  return data;
}

/**
 * Updates a user record
 * @param supabase - Supabase client
 * @param userId - User ID
 * @param userData - User data to update
 * @returns Promise resolving to updated user
 */
export async function updateUser(
  supabase: SupabaseClient<Database>,
  userId: string,
  userData: UsersTable['Update'],
): Promise<UsersTable['Row']> {
  const { data, error } = await supabase
    .from('users')
    .update(userData)
    .eq('user_id', userId) // Fixed: use user_id instead of id
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update user: ${error.message}`);
  }

  return data;
}

/**
 * Gets a user by email
 * @param supabase - Supabase client
 * @param email - User email
 * @returns Promise resolving to user or null
 */
export async function getUserByEmail(
  supabase: SupabaseClient<Database>,
  email: string,
): Promise<UsersTable['Row'] | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email_address', email) // Fixed: use email_address instead of email
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to get user by email: ${error.message}`);
  }

  return data;
}

/**
 * Gets a user by business name (closest equivalent to username in your schema)
 * @param supabase - Supabase client
 * @param businessName - Business name
 * @returns Promise resolving to user or null
 */
export async function getUserByBusinessName(
  supabase: SupabaseClient<Database>,
  businessName: string,
): Promise<UsersTable['Row'] | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('business_name', businessName) // Fixed: use business_name instead of username
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to get user by business name: ${error.message}`);
  }

  return data;
}

/**
 * Updates user's last login timestamp
 * @param supabase - Supabase client
 * @param userId - User ID
 * @returns Promise resolving to void
 */
export async function updateLastLogin(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<void> {
  const { error } = await supabase
    .from('users')
    .update({
      last_login: new Date().toISOString(),
    })
    .eq('user_id', userId); // Fixed: use user_id instead of id

  if (error) {
    throw new Error(`Failed to update last login: ${error.message}`);
  }
}

/**
 * Gets products with low stock (below threshold)
 * @param supabase - Supabase client
 * @returns Promise resolving to array of low stock products
 */
export async function getLowStockProducts(
  supabase: SupabaseClient<Database>,
): Promise<ProductsTable['Row'][]> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .lt('quantity_box', 'boxed_low_stock_threshold') // Use actual schema columns
      .order('quantity_box', { ascending: true });

    if (error) {
      console.error('Failed to get low stock products:', error);
      throw new Error(`Failed to get low stock products: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('Error getting low stock products:', error);
    return []; // Return empty array on error to prevent crashes
  }
}

/**
 * Updates product stock quantity (boxes)
 * @param supabase - Supabase client
 * @param productId - Product ID
 * @param newBoxQuantity - New box quantity
 * @param newKgQuantity - New kg quantity (optional)
 * @returns Promise resolving to updated product
 */
export async function updateProductStock(
  supabase: SupabaseClient<Database>,
  productId: string,
  newBoxQuantity: number,
  newKgQuantity?: number,
): Promise<ProductsTable['Row']> {
  const updateData: any = {
    quantity_box: newBoxQuantity, // Fixed: use your actual schema columns
    updated_at: new Date().toISOString(),
  };

  if (newKgQuantity !== undefined) {
    updateData.quantity_kg = newKgQuantity;
  }

  const { data, error } = await supabase
    .from('products')
    .update(updateData)
    .eq('product_id', productId) // Fixed: use product_id instead of id
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update product stock: ${error.message}`);
  }

  return data;
}

/**
 * Creates a stock movement record
 * @param supabase - Supabase client
 * @param movementData - Stock movement data
 * @returns Promise resolving to created movement
 */
export async function createStockMovement(
  supabase: SupabaseClient<Database>,
  movementData: StockMovementsTable['Insert'],
): Promise<StockMovementsTable['Row']> {
  const { data, error } = await supabase
    .from('stock_movements')
    .insert({
      ...movementData,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create stock movement: ${error.message}`);
  }

  return data;
}

// =====================================================
// ENHANCED DATABASE UTILITIES WITH FALLBACK SUPPORT
// =====================================================

/**
 * Enhanced database error handler with detailed error categorization
 * @param error - Database error object
 * @param operation - Description of the operation that failed
 * @returns Formatted error object with details
 */
export function handleDatabaseError(error: any, operation: string): {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
} {
  console.error(`❌ Database error during ${operation}:`, error);

  // Handle Supabase/PostgreSQL specific errors
  if (error?.code) {
    switch (error.code) {
      case '23505': // Unique violation
        return {
          message: `${operation} failed: Duplicate entry`,
          code: error.code,
          details: error.details || 'A record with this information already exists',
          hint: 'Please check for existing records or use different values',
        };
      case '23503': // Foreign key violation
        return {
          message: `${operation} failed: Referenced record not found`,
          code: error.code,
          details: error.details || 'The referenced record does not exist',
          hint: 'Please ensure all referenced records exist before creating this record',
        };
      case '42P01': // Table does not exist
        return {
          message: `${operation} failed: Table not found`,
          code: error.code,
          details: error.details || 'The requested table does not exist',
          hint: 'Please check the database schema',
        };
      case '42703': // Column does not exist
        return {
          message: `${operation} failed: Column not found`,
          code: error.code,
          details: error.details || 'The requested column does not exist',
          hint: 'Please check the table structure',
        };
      default:
        return {
          message: `${operation} failed: Database error (${error.code})`,
          code: error.code,
          details: error.details || error.message,
          hint: error.hint,
        };
    }
  }

  // Handle general errors
  if (error?.message) {
    return {
      message: `${operation} failed: ${error.message}`,
      details: error.details,
    };
  }

  return {
    message: `${operation} failed: Unknown database error`,
    details: 'An unexpected error occurred while accessing the database',
  };
}

/**
 * Execute a database query with comprehensive error handling and retry logic
 * @param queryFn - Function that executes the database query
 * @param operation - Description of the operation
 * @param retries - Number of retry attempts (default: 2)
 * @returns Promise with query result or error
 */
export async function executeQueryWithRetry<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  operation: string,
  retries: number = 2,
): Promise<{ success: boolean; data?: T; error?: any }> {
  let lastError: any;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      console.log(`🔄 Executing ${operation} (attempt ${attempt + 1}/${retries + 1})`);

      const { data, error } = await queryFn();

      if (error) {
        lastError = error;
        console.warn(`⚠️ ${operation} failed on attempt ${attempt + 1}:`, error);

        // Don't retry on certain types of errors
        if (error.code === '23505' || error.code === '23503' || error.code === '42P01') {
          break;
        }

        // Wait before retry (exponential backoff)
        if (attempt < retries) {
          const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s...
          console.log(`⏳ Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      } else {
        console.log(`✅ ${operation} completed successfully`);
        return { success: true, data: data as T };
      }
    } catch (error) {
      lastError = error;
      console.error(`💥 ${operation} threw exception on attempt ${attempt + 1}:`, error);

      if (attempt < retries) {
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
    }
  }

  const errorDetails = handleDatabaseError(lastError, operation);
  return { success: false, error: errorDetails };
}

/**
 * Create a database client with automatic fallback and connection testing
 * This function now uses the singleton pattern for better performance
 * @param env - Environment configuration
 * @returns Promise resolving to client and connection status
 */
export async function createDatabaseClientWithFallback(
  env: Environment,
): Promise<{
  client: SupabaseClient<Database>;
  usingServiceRole: boolean;
  connectionHealthy: boolean;
  error?: string;
}> {
  try {
    // Use singleton pattern for better performance
    const result = await getSupabaseClientSingleton(env);

    return {
      client: result.client,
      usingServiceRole: result.usingServiceRole,
      connectionHealthy: result.connectionHealthy,
      ...(result.error && { error: result.error }),
    };
  } catch (error) {
    console.error('❌ Failed to create database client with fallback:', error);
    throw new Error(`Database client creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
