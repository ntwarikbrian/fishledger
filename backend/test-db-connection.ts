/**
 * Database connection test script
 * Tests the database connection and schema compatibility
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from './src/config/supabase';

// Environment variables from wrangler.toml
const SUPABASE_URL = "https://hebdlpduohlfhdgvugla.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlYmRscGR1b2hsZmhkZ3Z1Z2xhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQ1MTc2MSwiZXhwIjoyMDY3MDI3NzYxfQ.dkyr-RpF64ETKgDLG_yiHT9UE11UvHVcqovjmT30kmQ";

async function testDatabaseConnection() {
  console.log('🔧 Testing database connection...');
  
  try {
    // Create Supabase client
    const supabase = createClient<Database>(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
        },
      }
    );

    console.log('✅ Supabase client created');

    // Test 1: Basic connection test
    console.log('\n📋 Test 1: Basic connection test');
    const { data: version, error: versionError } = await supabase.rpc('version');
    if (versionError) {
      console.error('❌ Version test failed:', versionError);
    } else {
      console.log('✅ Database version:', version);
    }

    // Test 2: Check if users table exists and has correct structure
    console.log('\n📋 Test 2: Users table structure');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('user_id, email_address, business_name, owner_name, phone_number, created_at, last_login')
      .limit(1);
    
    if (usersError) {
      console.error('❌ Users table test failed:', usersError);
    } else {
      console.log('✅ Users table accessible, sample data:', users);
    }

    // Test 3: Check if products table exists and has correct structure
    console.log('\n📋 Test 3: Products table structure');
    const { data: products, error: productsError } = await supabase
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
        updated_at
      `)
      .limit(1);
    
    if (productsError) {
      console.error('❌ Products table test failed:', productsError);
    } else {
      console.log('✅ Products table accessible, sample data:', products);
    }

    // Test 4: Check if product_categories table exists
    console.log('\n📋 Test 4: Product categories table structure');
    const { data: categories, error: categoriesError } = await supabase
      .from('product_categories')
      .select('category_id, name, description, created_at, updated_at')
      .limit(1);
    
    if (categoriesError) {
      console.error('❌ Product categories table test failed:', categoriesError);
    } else {
      console.log('✅ Product categories table accessible, sample data:', categories);
    }

    // Test 5: Check if sales table exists
    console.log('\n📋 Test 5: Sales table structure');
    const { data: sales, error: salesError } = await supabase
      .from('sales')
      .select(`
        sales_id,
        product_id,
        selling_method,
        quantity_boxes,
        quantity_kg,
        quantity,
        box_price,
        kg_price,
        boxes_total,
        kg_total,
        total_amount,
        date_time,
        payment_status,
        payment_method,
        client_name,
        client_email,
        client_phone_number,
        client_address
      `)
      .limit(1);
    
    if (salesError) {
      console.error('❌ Sales table test failed:', salesError);
    } else {
      console.log('✅ Sales table accessible, sample data:', sales);
    }

    // Test 6: Test creating a sample product category
    console.log('\n📋 Test 6: Create sample product category');
    const { data: newCategory, error: createCategoryError } = await supabase
      .from('product_categories')
      .insert({
        name: 'Test Category',
        description: 'Test category for database connection test',
      })
      .select()
      .single();
    
    if (createCategoryError) {
      console.error('❌ Create category test failed:', createCategoryError);
    } else {
      console.log('✅ Category created successfully:', newCategory);
      
      // Clean up - delete the test category
      const { error: deleteError } = await supabase
        .from('product_categories')
        .delete()
        .eq('category_id', newCategory.category_id);
      
      if (deleteError) {
        console.warn('⚠️ Failed to clean up test category:', deleteError);
      } else {
        console.log('✅ Test category cleaned up');
      }
    }

    console.log('\n🎉 Database connection tests completed!');
    
  } catch (error) {
    console.error('💥 Database connection test failed:', error);
  }
}

// Run the test
testDatabaseConnection();
