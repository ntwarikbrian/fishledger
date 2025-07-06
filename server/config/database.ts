import dotenv from 'dotenv';
import { env } from './environment.js';
import { supabaseClient, testSupabaseClient } from './supabase-client.js';

// Load environment variables
dotenv.config();

/**
 * Supabase-only Database Configuration
 * Uses Supabase client exclusively for all database operations
 */

console.log(`✅ Database configured for Supabase-only mode`);
console.log(`📍 Supabase URL: ${env.SUPABASE_URL}`);
console.log(`📍 Database mode: ${env.DATABASE_MODE}`);

/**
 * Test Supabase database connection
 * Uses Supabase client exclusively for database connectivity
 */
export const testConnection = async (): Promise<boolean> => {
  try {
    console.log('🔄 Testing Supabase database connection...');
    const isConnected = await testSupabaseClient();

    if (isConnected) {
      console.log('✅ Supabase database connection successful');
      return true;
    } else {
      console.error('❌ Supabase database connection failed');
      return false;
    }
  } catch (error) {
    console.error('❌ Supabase database connection error:', error);
    return false;
  }
};

/**
 * Execute a database query using Supabase client fallback method
 * Uses direct Supabase client operations for better reliability
 */
export const query = async (text: string, params?: any[]): Promise<any> => {
  try {
    console.log('🔄 Executing query via Supabase client fallback...');
    console.log('📝 Query:', text);
    console.log('📝 Params:', params);

    // Parse the SQL query to determine the operation
    const trimmedQuery = text.trim().toUpperCase();

    if (trimmedQuery.startsWith('SELECT')) {
      return await handleSelectQuery(text, params);
    } else if (trimmedQuery.startsWith('INSERT')) {
      return await handleInsertQuery(text, params);
    } else if (trimmedQuery.startsWith('UPDATE')) {
      return await handleUpdateQuery(text, params);
    } else if (trimmedQuery.startsWith('DELETE')) {
      return await handleDeleteQuery(text, params);
    } else {
      throw new Error(`Unsupported query type: ${trimmedQuery.split(' ')[0]}`);
    }

  } catch (error) {
    console.error('❌ Supabase client query error:', { text, params, error });
    throw error;
  }
};

/**
 * Handle SELECT queries
 */
async function handleSelectQuery(text: string, params?: any[]): Promise<any> {
  try {
    // For now, let's handle the most common queries used in auth
    if (text.includes('FROM users WHERE email_address = $1')) {
      const email = params?.[0];
      const { data, error } = await supabaseClient
        .from('users')
        .select('*')
        .eq('email_address', email);

      if (error) {
        console.error('❌ SELECT by email error:', error);
        throw error;
      }
      return { rows: data || [], rowCount: data?.length || 0, command: 'SELECT' };
    }

    if (text.includes('FROM users WHERE user_id = $1')) {
      const userId = params?.[0];
      const { data, error } = await supabaseClient
        .from('users')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        console.error('❌ SELECT by user_id error:', error);
        throw error;
      }
      return { rows: data || [], rowCount: data?.length || 0, command: 'SELECT' };
    }

    if (text.includes('FROM users WHERE LOWER(business_name) = LOWER($1)')) {
      const businessName = params?.[0];
      const { data, error } = await supabaseClient
        .from('users')
        .select('*')
        .ilike('business_name', businessName);

      if (error) {
        console.error('❌ SELECT by business_name error:', error);
        throw error;
      }
      return { rows: data || [], rowCount: data?.length || 0, command: 'SELECT' };
    }

    if (text.includes('FROM users ORDER BY created_at DESC')) {
      const { data, error } = await supabaseClient
        .from('users')
        .select('user_id, business_name, owner_name, email_address, phone_number, created_at, last_login')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ SELECT users list error:', error);
        throw error;
      }
      return { rows: data || [], rowCount: data?.length || 0, command: 'SELECT' };
    }

    // Handle contacts queries
    if (text.includes('FROM contacts')) {
      // Get all contacts
      if (text.includes('SELECT * FROM contacts') || text.includes('SELECT contact_id, company_name, contact_name')) {
        const { data, error } = await supabaseClient
          .from('contacts')
          .select('*')
          .order('contact_name', { ascending: true });

        if (error) {
          console.error('❌ SELECT contacts error:', error);
          throw error;
        }
        return { rows: data || [], rowCount: data?.length || 0, command: 'SELECT' };
      }

      // Get contact by ID
      if (text.includes('WHERE contact_id = $1')) {
        const contactId = params?.[0];
        const { data, error } = await supabaseClient
          .from('contacts')
          .select('*')
          .eq('contact_id', contactId)
          .single();

        if (error) {
          console.error('❌ SELECT contact by ID error:', error);
          throw error;
        }
        return { rows: data ? [data] : [], rowCount: data ? 1 : 0, command: 'SELECT' };
      }

      // Get contacts by type
      if (text.includes('WHERE contact_type = $1')) {
        const contactType = params?.[0];
        const { data, error } = await supabaseClient
          .from('contacts')
          .select('*')
          .eq('contact_type', contactType)
          .order('contact_name', { ascending: true });

        if (error) {
          console.error('❌ SELECT contacts by type error:', error);
          throw error;
        }
        return { rows: data || [], rowCount: data?.length || 0, command: 'SELECT' };
      }
    }

    // Default fallback for other SELECT queries
    console.error('❌ Unsupported SELECT query:', text);
    throw new Error(`Unsupported SELECT query: ${text}`);
  } catch (error) {
    console.error('❌ handleSelectQuery error:', error);
    throw error;
  }
}

/**
 * Handle INSERT queries
 */
async function handleInsertQuery(text: string, params?: any[]): Promise<any> {
  try {
    if (text.includes('INSERT INTO users')) {
      const [businessName, ownerName, emailAddress, phoneNumber, password] = params || [];

      console.log('📝 Inserting user:', { businessName, ownerName, emailAddress, phoneNumber });

      const { data, error } = await supabaseClient
        .from('users')
        .insert({
          business_name: businessName,
          owner_name: ownerName,
          email_address: emailAddress,
          phone_number: phoneNumber,
          password: password
        })
        .select()
        .single();

      if (error) {
        console.error('❌ INSERT user error:', error);
        throw error;
      }

      console.log('✅ User inserted successfully:', data);
      return { rows: [data], rowCount: 1, command: 'INSERT' };
    }

    // Handle contact insertion
    if (text.includes('INSERT INTO contacts')) {
      const [companyName, contactName, email, phoneNumber, contactType, address, addedBy] = params || [];

      console.log('📝 Inserting contact:', { companyName, contactName, email, phoneNumber, contactType, address, addedBy });

      const { data, error } = await supabaseClient
        .from('contacts')
        .insert({
          company_name: companyName,
          contact_name: contactName,
          email: email,
          phone_number: phoneNumber,
          contact_type: contactType,
          address: address,
          added_by: addedBy
        })
        .select()
        .single();

      if (error) {
        console.error('❌ INSERT contact error:', error);
        throw error;
      }

      console.log('✅ Contact inserted successfully:', data);
      return { rows: [data], rowCount: 1, command: 'INSERT' };
    }

    console.error('❌ Unsupported INSERT query:', text);
    throw new Error(`Unsupported INSERT query: ${text}`);
  } catch (error) {
    console.error('❌ handleInsertQuery error:', error);
    throw error;
  }
}

/**
 * Handle UPDATE queries
 */
async function handleUpdateQuery(text: string, params?: any[]): Promise<any> {
  if (text.includes('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE user_id = $1')) {
    const userId = params?.[0];

    const { data, error } = await supabaseClient
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('user_id', userId)
      .select();

    if (error) throw error;
    return { rows: data || [], rowCount: data?.length || 0, command: 'UPDATE' };
  }

  if (text.includes('UPDATE users SET password = $1 WHERE user_id = $2')) {
    const [password, userId] = params || [];

    const { data, error } = await supabaseClient
      .from('users')
      .update({ password })
      .eq('user_id', userId)
      .select();

    if (error) throw error;
    return { rows: data || [], rowCount: data?.length || 0, command: 'UPDATE' };
  }

  // Handle contact updates (handled directly in routes)
  if (text.includes('UPDATE contacts SET')) {
    console.log('📝 Contact update query detected, handled by route');
    return { rows: [], rowCount: 0, command: 'UPDATE' };
  }

  throw new Error(`Unsupported UPDATE query: ${text}`);
}

/**
 * Handle DELETE queries
 */
async function handleDeleteQuery(text: string, params?: any[]): Promise<any> {
  try {
    // Handle contact deletion
    if (text.includes('DELETE FROM contacts WHERE contact_id = $1')) {
      const contactId = params?.[0];

      console.log('📝 Deleting contact:', contactId);

      const { data, error } = await supabaseClient
        .from('contacts')
        .delete()
        .eq('contact_id', contactId)
        .select();

      if (error) {
        console.error('❌ DELETE contact error:', error);
        throw error;
      }

      console.log('✅ Contact deleted successfully:', contactId);
      return { rows: data || [], rowCount: data?.length || 0, command: 'DELETE' };
    }

    // Default fallback for other DELETE queries
    console.error('❌ Unsupported DELETE query:', text);
    throw new Error(`DELETE queries not implemented yet: ${text}`);
  } catch (error) {
    console.error('❌ handleDeleteQuery error:', error);
    throw error;
  }
}

/**
 * Close Supabase connection
 * Gracefully shuts down Supabase client (no-op for Supabase client)
 */
export const closePool = async (): Promise<void> => {
  try {
    // Supabase client doesn't need explicit closing
    console.log('✅ Supabase client connection closed successfully');
  } catch (error) {
    console.error('❌ Error closing Supabase client:', error);
  }
};

/**
 * Export Supabase client for direct usage
 */
export { supabaseClient as pool };
export default supabaseClient;
