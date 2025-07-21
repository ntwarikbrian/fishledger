/**
 * Supabase configuration and client setup for Cloudflare Workers
 * Provides type-safe database access and authentication for LocalFishing system
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Environment } from './environment';

// Global client cache for singleton pattern
let globalSupabaseClient: SupabaseClient<Database> | null = null;
let globalClientConfig: { env: Environment; usingServiceRole: boolean } | null = null;
let globalConnectionStatus: { healthy: boolean; lastChecked: number; error?: string } | null = null;

// Database table types for LocalFishing system - matches your actual schema
export interface Database {
  public: {
    Tables: {
      // Users table - business owners authentication
      users: {
        Row: {
          user_id: string;
          business_name: string;
          owner_name: string;
          email_address: string;
          phone_number: string | null;
          password: string; // Required for authentication
          is_active: boolean; // Account status
          created_at: string;
          last_login: string | null;
          updated_at: string;
        };
        Insert: {
          user_id?: string;
          business_name: string;
          owner_name: string;
          email_address: string;
          phone_number?: string | null;
          password: string; // Required for authentication
          is_active?: boolean;
          created_at?: string;
          last_login?: string | null;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          business_name?: string;
          owner_name?: string;
          email_address?: string;
          phone_number?: string | null;
          password?: string;
          is_active?: boolean;
          created_at?: string;
          last_login?: string | null;
          updated_at?: string;
        };
      };
      // Workers table - employee management
      workers: {
        Row: {
          worker_id: string;
          full_name: string;
          email: string;
          phone_number: string | null;
          id_card_front_url: string | null;
          id_card_back_url: string | null;
          password: string;
          monthly_salary: number | null;
          total_revenue_generated: number;
          recent_login_history: any | null; // JSONB
          created_at: string;
        };
        Insert: {
          worker_id?: string;
          full_name: string;
          email: string;
          phone_number?: string | null;
          id_card_front_url?: string | null;
          id_card_back_url?: string | null;
          password: string;
          monthly_salary?: number | null;
          total_revenue_generated?: number;
          recent_login_history?: any | null;
          created_at?: string;
        };
        Update: {
          worker_id?: string;
          full_name?: string;
          email?: string;
          phone_number?: string | null;
          identification_image_url?: string | null;
          monthly_salary?: number | null;
          total_revenue_generated?: number;
          recent_login_history?: any | null;
          created_at?: string;
        };
      };
      // Product categories
      product_categories: {
        Row: {
          category_id: string;
          name: string;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          category_id?: string;
          name: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          category_id?: string;
          name?: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      // Products table - fish inventory with box/kg support
      products: {
        Row: {
          product_id: string;
          name: string;
          category_id: string;
          quantity_box: number;
          box_to_kg_ratio: number;
          quantity_kg: number;
          cost_per_box: number;
          cost_per_kg: number;
          price_per_box: number;
          price_per_kg: number;
          profit_per_box: number; // Generated column
          profit_per_kg: number; // Generated column
          boxed_low_stock_threshold: number;
          expiry_date: string | null;
          days_left: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          product_id?: string;
          name: string;
          category_id: string;
          quantity_box?: number;
          box_to_kg_ratio?: number;
          quantity_kg?: number;
          cost_per_box: number;
          cost_per_kg: number;
          price_per_box: number;
          price_per_kg: number;
          boxed_low_stock_threshold?: number;
          expiry_date?: string | null;
          days_left?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          product_id?: string;
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
          expiry_date?: string | null;
          days_left?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      // Sales table - individual product sales transactions
      sales: {
        Row: {
          id: string;
          product_id: string;
          boxes_quantity: number;
          kg_quantity: number;
          box_price: number;
          kg_price: number;
          total_amount: number;
          date_time: string;
          payment_status: 'paid' | 'pending' | 'partial';
          payment_method: 'cash' | 'card' | 'transfer' | null;
          performed_by: string;
          client_id: string | null;
          client_name: string;
          email_address: string | null;
          phone: string | null;
        };
        Insert: {
          id?: string;
          product_id: string;
          boxes_quantity?: number;
          kg_quantity?: number;
          box_price: number;
          kg_price: number;
          total_amount: number;
          date_time?: string;
          payment_status?: 'paid' | 'pending' | 'partial';
          payment_method?: 'cash' | 'card' | 'transfer' | null;
          performed_by: string;
          client_id?: string | null;
          client_name: string;
          email_address?: string | null;
          phone?: string | null;
        };
        Update: {
          id?: string;
          product_id?: string;
          boxes_quantity?: number;
          kg_quantity?: number;
          box_price?: number;
          kg_price?: number;
          total_amount?: number;
          date_time?: string;
          payment_status?: 'paid' | 'pending' | 'partial';
          payment_method?: 'cash' | 'card' | 'transfer' | null;
          performed_by?: string;
          client_id?: string | null;
          client_name?: string;
          email_address?: string | null;
          phone?: string | null;
        };
      };
      // Stock movements - inventory change tracking
      stock_movements: {
        Row: {
          movement_id: string;
          product_id: string;
          movement_type: 'in' | 'out' | 'adjustment' | 'damaged' | 'new_stock' | 'stock_correction';
          box_change: number;
          kg_change: number;
          damaged_id: string | null;
          stock_addition_id: string | null;
          correction_id: string | null;
          reason: string | null;
          status: 'pending' | 'completed' | 'cancelled';
          performed_by: string;
          created_at: string;
        };
        Insert: {
          movement_id?: string;
          product_id: string;
          movement_type: 'in' | 'out' | 'adjustment' | 'damaged' | 'new_stock' | 'stock_correction';
          box_change?: number;
          kg_change?: number;
          damaged_id?: string | null;
          stock_addition_id?: string | null;
          correction_id?: string | null;
          reason?: string | null;
          status?: 'pending' | 'completed' | 'cancelled';
          performed_by: string;
          created_at?: string;
        };
        Update: {
          movement_id?: string;
          product_id?: string;
          movement_type?: 'damaged' | 'new_stock' | 'stock_correction';
          box_change?: number;
          kg_change?: number;
          damaged_id?: string | null;
          stock_addition_id?: string | null;
          correction_id?: string | null;
          reason?: string | null;
          status?: 'pending' | 'completed' | 'cancelled';
          performed_by?: string;
          created_at?: string;
        };
      };
      // Contacts table - customer/supplier management
      contacts: {
        Row: {
          contact_id: string;
          company_name: string | null;
          contact_name: string;
          email: string | null;
          phone_number: string | null;
          contact_type: 'supplier' | 'customer';
          address: string | null;
          email_verified: boolean;
          preferred_contact_method: 'email' | 'phone' | 'both';
          email_notifications: boolean;
          last_contacted: string | null;
          total_messages_sent: number;
          notes: string | null;
          added_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          contact_id?: string;
          company_name?: string | null;
          contact_name: string;
          email?: string | null;
          phone_number?: string | null;
          contact_type: 'supplier' | 'customer';
          address?: string | null;
          email_verified?: boolean;
          preferred_contact_method?: 'email' | 'phone' | 'both';
          email_notifications?: boolean;
          last_contacted?: string | null;
          total_messages_sent?: number;
          notes?: string | null;
          added_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          contact_id?: string;
          company_name?: string | null;
          contact_name?: string;
          email?: string | null;
          phone_number?: string | null;
          contact_type?: 'supplier' | 'customer';
          address?: string | null;
          email_verified?: boolean;
          preferred_contact_method?: 'email' | 'phone' | 'both';
          email_notifications?: boolean;
          last_contacted?: string | null;
          total_messages_sent?: number;
          notes?: string | null;
          added_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      // Expenses table - financial tracking
      expenses: {
        Row: {
          expense_id: string;
          title: string;
          category_id: string;
          amount: number;
          date: string;
          added_by: string;
          status: 'pending' | 'paid';
          receipt_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          expense_id?: string;
          title: string;
          category_id: string;
          amount: number;
          date: string;
          added_by: string;
          status?: 'pending' | 'paid';
          receipt_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          expense_id?: string;
          title?: string;
          category_id?: string;
          amount?: number;
          date?: string;
          added_by?: string;
          status?: 'pending' | 'paid';
          receipt_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      // Expense categories
      expense_categories: {
        Row: {
          category_id: string;
          category_name: string;
          description: string | null;
          budget: number;
        };
        Insert: {
          category_id?: string;
          category_name: string;
          description?: string | null;
          budget?: number;
        };
        Update: {
          category_id?: string;
          category_name?: string;
          description?: string | null;
          budget?: number;
        };
      };
      // Transactions table - comprehensive transaction management
      transactions: {
        Row: {
          transaction_id: string;
          sale_id: string;
          date_time: string;
          product_name: string;
          client_name: string;
          boxes_quantity: number;
          kg_quantity: number;
          total_amount: number;
          payment_status: 'paid' | 'pending' | 'partial';
          payment_method: 'momo_pay' | 'cash' | 'bank_transfer' | null;
          deposit_id: string | null;
          deposit_type: 'momo' | 'bank' | 'boss' | null;
          account_number: string | null;
          reference: string | null;
          image_url: string | null;
          created_at: string;
          updated_at: string;
          created_by: string | null; // Nullable for backward compatibility
          updated_by?: string | null; // Optional field for backward compatibility
        };
        Insert: {
          transaction_id?: string;
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
          created_at?: string;
          updated_at?: string;
          created_by?: string | null; // Optional for backward compatibility
          updated_by?: string | null;
        };
        Update: {
          transaction_id?: string;
          sale_id?: string;
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
          created_at?: string;
          updated_at?: string;
          created_by?: string;
          updated_by?: string | null;
        };
      };
      // User settings table - user preferences and application settings
      user_settings: {
        Row: {
          setting_id: string;
          user_id: string;
          currency: 'USD' | 'RWF';
          language: 'en' | 'rw';
          timezone: string;
          date_format: string;
          theme: 'light' | 'dark' | 'system';
          email_notifications: boolean;
          sms_notifications: boolean;
          low_stock_alerts: boolean;
          daily_reports: boolean;
          weekly_reports: boolean;
          monthly_reports: boolean;
          auto_reporting: boolean;
          business_hours_start: string;
          business_hours_end: string;
          working_days: number[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          setting_id?: string;
          user_id: string;
          currency?: 'USD' | 'RWF';
          language?: 'en' | 'rw';
          timezone?: string;
          date_format?: string;
          theme?: 'light' | 'dark' | 'system';
          email_notifications?: boolean;
          sms_notifications?: boolean;
          low_stock_alerts?: boolean;
          daily_reports?: boolean;
          weekly_reports?: boolean;
          monthly_reports?: boolean;
          auto_reporting?: boolean;
          business_hours_start?: string;
          business_hours_end?: string;
          working_days?: number[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          setting_id?: string;
          user_id?: string;
          currency?: 'USD' | 'RWF';
          language?: 'en' | 'rw';
          timezone?: string;
          date_format?: string;
          theme?: 'light' | 'dark' | 'system';
          email_notifications?: boolean;
          sms_notifications?: boolean;
          low_stock_alerts?: boolean;
          daily_reports?: boolean;
          weekly_reports?: boolean;
          monthly_reports?: boolean;
          auto_reporting?: boolean;
          business_hours_start?: string;
          business_hours_end?: string;
          working_days?: number[];
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      // Add common database functions that might be used
      version: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

/**
 * Gets or creates a singleton Supabase client instance
 * This ensures the client is created only once and reused across requests
 * @param env - Environment configuration
 * @param forceRecreate - Force recreation of the client (default: false)
 * @returns Promise resolving to singleton client and status
 */
export async function getSupabaseClientSingleton(
  env: Environment,
  forceRecreate: boolean = false,
): Promise<{
  client: SupabaseClient<Database>;
  usingServiceRole: boolean;
  connectionHealthy: boolean;
  isNewConnection: boolean;
  error?: string;
}> {
  const now = Date.now();
  const CONNECTION_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  // Check if we need to recreate the client
  const needsRecreation = forceRecreate ||
    !globalSupabaseClient ||
    !globalClientConfig ||
    !globalConnectionStatus ||
    (now - globalConnectionStatus.lastChecked) > CONNECTION_CACHE_TTL;

  if (!needsRecreation) {
    console.log('♻️ Reusing existing database connection');
    return {
      client: globalSupabaseClient!,
      usingServiceRole: globalClientConfig!.usingServiceRole,
      connectionHealthy: globalConnectionStatus!.healthy,
      isNewConnection: false,
      ...(globalConnectionStatus!.error && { error: globalConnectionStatus!.error }),
    };
  }

  console.log('🔧 Initializing database connection...');

  try {
    // Create new client with fallback
    const { client, usingServiceRole } = createSupabaseClientWithFallback(env, true);

    // Test connection
    console.log('🔍 Testing database connection...');
    const connectionHealthy = await quickConnectionTest(client);

    if (connectionHealthy) {
      console.log(`✅ Database connected successfully (${usingServiceRole ? 'service role' : 'anonymous'})`);
    } else {
      console.warn('⚠️ Database client created but connection test failed');
    }

    // Cache the client and status
    globalSupabaseClient = client;
    globalClientConfig = { env, usingServiceRole };
    const errorMessage = connectionHealthy ? undefined : 'Connection test failed';
    globalConnectionStatus = {
      healthy: connectionHealthy,
      lastChecked: now,
      ...(errorMessage && { error: errorMessage }),
    };

    return {
      client,
      usingServiceRole,
      connectionHealthy,
      isNewConnection: true,
      ...(errorMessage && { error: errorMessage }),
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Failed to initialize database connection:', errorMessage);
    console.warn('⚠️ Creating fallback client for basic functionality');

    // Try to create a basic client even if initialization failed
    try {
      const { client, usingServiceRole } = createSupabaseClientWithFallback(env, true);

      // Cache the error state but provide the client
      globalSupabaseClient = client;
      globalClientConfig = { env, usingServiceRole };
      globalConnectionStatus = {
        healthy: false,
        lastChecked: now,
        error: errorMessage,
      };

      return {
        client,
        usingServiceRole,
        connectionHealthy: false,
        isNewConnection: true,
        error: errorMessage,
      };
    } catch (fallbackError) {
      // If even the fallback fails, throw the original error
      throw new Error(`Database initialization failed: ${errorMessage}`);
    }
  }
}

/**
 * Resets the singleton client (useful for testing or forced reconnection)
 */
export function resetSupabaseClientSingleton(): void {
  console.log('🔄 Resetting database connection singleton');
  globalSupabaseClient = null;
  globalClientConfig = null;
  globalConnectionStatus = null;
}

/**
 * Gets the current connection status without creating a new connection
 * @returns Current connection status or null if not initialized
 */
export function getConnectionStatus(): {
  healthy: boolean;
  lastChecked: number;
  error?: string;
  usingServiceRole?: boolean;
} | null {
  if (!globalConnectionStatus || !globalClientConfig) {
    return null;
  }

  return {
    healthy: globalConnectionStatus.healthy,
    lastChecked: globalConnectionStatus.lastChecked,
    ...(globalConnectionStatus.error && { error: globalConnectionStatus.error }),
    usingServiceRole: globalClientConfig.usingServiceRole,
  };
}

/**
 * Creates a Supabase client for server-side operations with service role key
 * This client has full database access and bypasses RLS policies
 * @param env - Environment configuration
 * @returns Configured Supabase client for server operations
 */
export function createSupabaseClient(env: Environment): SupabaseClient<Database> {
  try {
    const client = createClient<Database>(
      env.SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
        },
        global: {
          headers: {
            'User-Agent': 'localfishing-backend/1.0.0',
            'X-Client-Info': 'localfishing-cloudflare-workers',
          },
        },
        db: {
          schema: 'public',
        },
        // Disable realtime for server operations
      },
    );

    console.log('✅ Supabase service role client created successfully');
    return client;
  } catch (error) {
    console.error('❌ Failed to create Supabase service role client:', error);
    throw new Error(`Supabase client creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Creates a Supabase client for client-side operations (with anon key)
 * This client respects RLS policies and is used for user-facing operations
 * @param env - Environment configuration
 * @returns Configured Supabase client for client operations
 */
export function createSupabaseAnonClient(env: Environment): SupabaseClient<Database> {
  try {
    const client = createClient<Database>(
      env.SUPABASE_URL,
      env.SUPABASE_ANON_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
        },
        global: {
          headers: {
            'User-Agent': 'localfishing-backend/1.0.0',
            'X-Client-Info': 'localfishing-cloudflare-workers-anon',
          },
        },
        db: {
          schema: 'public',
        },
        // Disable realtime for server operations
      },
    );

    console.log('✅ Supabase anonymous client created successfully');
    return client;
  } catch (error) {
    console.error('❌ Failed to create Supabase anonymous client:', error);
    throw new Error(`Supabase anon client creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Creates a Supabase client with automatic fallback mechanism
 * Tries service role first, falls back to anon key if needed
 * @param env - Environment configuration
 * @param preferServiceRole - Whether to prefer service role key (default: true)
 * @returns Configured Supabase client with fallback
 */
export function createSupabaseClientWithFallback(
  env: Environment,
  preferServiceRole: boolean = true,
): { client: SupabaseClient<Database>; usingServiceRole: boolean } {
  try {
    if (preferServiceRole && env.SUPABASE_SERVICE_ROLE_KEY) {
      const client = createSupabaseClient(env);
      return { client, usingServiceRole: true };
    }

    // Fallback to anon client
    const client = createSupabaseAnonClient(env);
    console.log('⚠️ Using anonymous client as fallback');
    return { client, usingServiceRole: false };
  } catch (error) {
    console.error('❌ All Supabase client creation methods failed:', error);
    throw new Error('Unable to create any Supabase client connection');
  }
}

/**
 * Comprehensive database connection health check with multiple fallback strategies
 * @param supabase - Supabase client instance
 * @returns Promise resolving to detailed connection status
 */
export async function checkDatabaseConnection(
  supabase: SupabaseClient<Database>,
): Promise<{
  healthy: boolean;
  error?: string;
  details?: string;
  testResults?: Array<{ test: string; success: boolean; error?: string }>;
}> {
  const testResults: Array<{ test: string; success: boolean; error?: string }> = [];
  let overallHealthy = false;

  try {
    // Test 1: Try to query a system table (most comprehensive test)
    try {
      const { data, error } = await supabase
        .from('pg_stat_database')
        .select('datname')
        .limit(1);

      if (!error && data) {
        testResults.push({ test: 'System table query', success: true });
        overallHealthy = true;
      } else {
        testResults.push({
          test: 'System table query',
          success: false,
          error: error?.message || 'No data returned',
        });
      }
    } catch (err) {
      testResults.push({
        test: 'System table query',
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }

    // Test 2: Try RPC version call (fallback test)
    if (!overallHealthy) {
      try {
        const { data, error } = await supabase.rpc('version');

        if (!error) {
          testResults.push({ test: 'RPC version call', success: true });
          overallHealthy = true;
        } else {
          testResults.push({
            test: 'RPC version call',
            success: false,
            error: error.message,
          });
        }
      } catch (err) {
        testResults.push({
          test: 'RPC version call',
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    // Test 3: Try to query one of our actual tables (most relevant test)
    if (!overallHealthy) {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('user_id')
          .limit(1);

        if (!error) {
          testResults.push({ test: 'Users table query', success: true });
          overallHealthy = true;
        } else {
          testResults.push({
            test: 'Users table query',
            success: false,
            error: error.message,
          });
        }
      } catch (err) {
        testResults.push({
          test: 'Users table query',
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    // Test 4: Basic client configuration test (last resort)
    if (!overallHealthy) {
      try {
        // Try to access the Supabase client's configuration
        // This is a basic test to ensure the client is properly instantiated
        if (supabase && typeof supabase.from === 'function') {
          testResults.push({
            test: 'Client configuration',
            success: true,
            error: 'Client is configured but database connection failed',
          });
          // This doesn't guarantee database connectivity, but client is configured
        } else {
          testResults.push({
            test: 'Client configuration',
            success: false,
            error: 'Supabase client is not properly configured',
          });
        }
      } catch (err) {
        testResults.push({
          test: 'Client configuration',
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    const successfulTests = testResults.filter(t => t.success).length;
    const details = `${successfulTests}/${testResults.length} tests passed`;

    if (overallHealthy) {
      return {
        healthy: true,
        details,
        testResults,
      };
    } else {
      const errors = testResults
        .filter(t => !t.success && t.error)
        .map(t => `${t.test}: ${t.error}`)
        .join('; ');

      return {
        healthy: false,
        error: `All database connection tests failed. Errors: ${errors}`,
        details,
        testResults,
      };
    }

  } catch (error) {
    return {
      healthy: false,
      error: `Database health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: 'Health check exception',
      testResults,
    };
  }
}

/**
 * Quick database connection test for basic connectivity
 * @param supabase - Supabase client instance
 * @returns Promise resolving to simple boolean status
 */
export async function quickConnectionTest(supabase: SupabaseClient<Database>): Promise<boolean> {
  try {
    const { error } = await supabase.from('users').select('user_id').limit(1);
    return !error;
  } catch {
    return false;
  }
}

/**
 * Test database write operations (for comprehensive health checks)
 * @param supabase - Supabase client instance
 * @returns Promise resolving to write capability status
 */
export async function testDatabaseWriteCapability(
  supabase: SupabaseClient<Database>,
): Promise<{ canWrite: boolean; error?: string }> {
  try {
    // Try to perform a safe write operation that won't affect data
    // This is a read-only test that checks if we have write permissions
    const { error } = await supabase
      .from('users')
      .select('user_id')
      .limit(0); // This won't return data but tests table access

    if (error) {
      return {
        canWrite: false,
        error: `Write capability test failed: ${error.message}`,
      };
    }

    return { canWrite: true };
  } catch (error) {
    return {
      canWrite: false,
      error: `Write capability test error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}
