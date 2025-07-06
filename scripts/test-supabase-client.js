#!/usr/bin/env node

/**
 * Test Supabase Client Connection
 */

import { testSupabaseClient, getTableData, supabaseClient } from '../server/config/supabase-client.js';
import { env } from '../server/config/environment.js';

async function testSupabaseClientConnection() {
  console.log('🔄 Testing Supabase client connection...');
  console.log(`📍 Database mode: ${env.DATABASE_MODE}`);
  console.log(`📍 Supabase URL: ${env.SUPABASE_URL || 'Not set'}`);
  
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log('❌ Supabase configuration is incomplete');
    console.log('💡 Please check your .env file for SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    return;
  }
  
  try {
    // Test basic connection
    const isConnected = await testSupabaseClient();
    
    if (isConnected) {
      console.log('✅ Supabase client connection successful');
      
      // List all tables
      console.log('\n📋 Testing table access...');
      
      const tables = [
        'users', 'workers', 'product_categories', 'products',
        'contacts', 'expenses', 'sales', 'folders', 'files'
      ];
      
      for (const table of tables) {
        try {
          const { count } = await supabaseClient
            .from(table)
            .select('*', { count: 'exact', head: true });
          
          console.log(`  ✅ ${table}: ${count || 0} rows`);
        } catch (error) {
          console.log(`  ❌ ${table}: ${error.message}`);
        }
      }
      
      console.log('\n🎉 Supabase client test completed successfully!');
      console.log('💡 Your backend can now use Supabase client for database operations');
      
      // Test a simple insert and delete
      console.log('\n🧪 Testing basic CRUD operations...');
      
      try {
        // Test insert into product_categories
        const testCategory = {
          name: 'Test Category ' + Date.now(),
          description: 'Test category for connection verification'
        };
        
        const { data: insertResult, error: insertError } = await supabaseClient
          .from('product_categories')
          .insert(testCategory)
          .select();
        
        if (insertError) {
          console.log('⚠️  Insert test failed:', insertError.message);
        } else {
          console.log('✅ Insert test successful');
          
          // Clean up - delete the test record
          const { error: deleteError } = await supabaseClient
            .from('product_categories')
            .delete()
            .eq('category_id', insertResult[0].category_id);
          
          if (deleteError) {
            console.log('⚠️  Cleanup failed:', deleteError.message);
          } else {
            console.log('✅ Cleanup successful');
          }
        }
        
      } catch (error) {
        console.log('⚠️  CRUD test failed:', error.message);
      }
      
    } else {
      console.log('❌ Supabase client connection failed');
    }
    
  } catch (error) {
    console.error('❌ Supabase client test error:', error.message);
    console.log('\n💡 Troubleshooting:');
    console.log('   - Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env');
    console.log('   - Verify your Supabase project is active');
    console.log('   - Ensure network connectivity');
  }
}

testSupabaseClientConnection();
