/**
 * Supabase Client Configuration
 * Alternative connection method using Supabase JavaScript client
 */

import { createClient } from '@supabase/supabase-js';
import { supabaseConfig } from './environment.js';

/**
 * Supabase client instance
 * Uses the service role key for backend operations
 */
export const supabaseClient = createClient(
  supabaseConfig.url,
  supabaseConfig.serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    db: {
      schema: 'public'
    }
  }
);

/**
 * Test Supabase client connection
 */
export async function testSupabaseClient(): Promise<boolean> {
  try {
    console.log('🔄 Testing Supabase client connection...');

    // Test with a simple query
    const { error } = await supabaseClient
      .from('users')
      .select('count', { count: 'exact', head: true });

    if (error) {
      console.error('❌ Supabase client test failed:', error.message);
      return false;
    }

    console.log('✅ Supabase client connection successful');
    return true;

  } catch (error) {
    console.error('❌ Supabase client connection error:', error);
    return false;
  }
}

/**
 * Execute raw SQL query using Supabase client
 */
export async function executeQuery(query: string, params?: any[]): Promise<any> {
  try {
    const { data, error } = await supabaseClient.rpc('execute_sql', {
      query: query,
      params: params || []
    });
    
    if (error) {
      throw new Error(error.message);
    }
    
    return { rows: data };
    
  } catch (error) {
    console.error('❌ Query execution error:', error);
    throw error;
  }
}

/**
 * Get table data using Supabase client
 */
export async function getTableData(tableName: string, options?: {
  select?: string;
  limit?: number;
  offset?: number;
}): Promise<any> {
  try {
    const selectFields = options?.select || '*';
    let queryBuilder = supabaseClient.from(tableName).select(selectFields);

    if (options?.limit) {
      queryBuilder = queryBuilder.limit(options.limit);
    }

    if (options?.offset) {
      const endRange = (options.offset + (options.limit || 10)) - 1;
      queryBuilder = queryBuilder.range(options.offset, endRange);
    }

    const { data, error } = await queryBuilder;

    if (error) {
      throw new Error(error.message);
    }

    return data;

  } catch (error) {
    console.error(`❌ Error fetching data from ${tableName}:`, error);
    throw error;
  }
}

/**
 * Insert data using Supabase client
 */
export async function insertData(tableName: string, data: any): Promise<any> {
  try {
    const { data: result, error } = await supabaseClient
      .from(tableName)
      .insert(data)
      .select();
    
    if (error) {
      throw new Error(error.message);
    }
    
    return result;
    
  } catch (error) {
    console.error(`❌ Error inserting data into ${tableName}:`, error);
    throw error;
  }
}

/**
 * Update data using Supabase client
 */
export async function updateData(tableName: string, data: any, condition: any): Promise<any> {
  try {
    let queryBuilder = supabaseClient.from(tableName).update(data);

    // Apply conditions
    Object.keys(condition).forEach(key => {
      queryBuilder = queryBuilder.eq(key, condition[key]);
    });

    const { data: result, error } = await queryBuilder.select();

    if (error) {
      throw new Error(error.message);
    }

    return result;

  } catch (error) {
    console.error(`❌ Error updating data in ${tableName}:`, error);
    throw error;
  }
}

/**
 * Delete data using Supabase client
 */
export async function deleteData(tableName: string, condition: any): Promise<any> {
  try {
    let queryBuilder = supabaseClient.from(tableName).delete();

    // Apply conditions
    Object.keys(condition).forEach(key => {
      queryBuilder = queryBuilder.eq(key, condition[key]);
    });

    const { data: result, error } = await queryBuilder.select();

    if (error) {
      throw new Error(error.message);
    }

    return result;

  } catch (error) {
    console.error(`❌ Error deleting data from ${tableName}:`, error);
    throw error;
  }
}
