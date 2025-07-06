/**
 * Test Supabase connection and users table access
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔄 Testing Supabase connection...');
console.log('📍 Supabase URL:', supabaseUrl);
console.log('📍 Service Key:', supabaseServiceKey ? 'Present' : 'Missing');

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testConnection() {
  try {
    console.log('\n🔄 Testing basic connection...');
    
    // Test 1: Check if we can connect to Supabase
    const { data: connectionTest, error: connectionError } = await supabase
      .from('users')
      .select('count', { count: 'exact', head: true });
    
    if (connectionError) {
      console.error('❌ Connection test failed:', connectionError);
      return false;
    }
    
    console.log('✅ Basic connection successful');
    console.log('📊 Users table count:', connectionTest);
    
    // Test 2: Try to select from users table
    console.log('\n🔄 Testing users table access...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('user_id, business_name, owner_name, email_address, created_at')
      .limit(5);
    
    if (usersError) {
      console.error('❌ Users table access failed:', usersError);
      return false;
    }
    
    console.log('✅ Users table access successful');
    console.log('📊 Sample users:', users);
    
    // Test 3: Try to insert a test user
    console.log('\n🔄 Testing user insertion...');
    const testUser = {
      business_name: 'Test Business',
      owner_name: 'Test Owner',
      email_address: `test-${Date.now()}@example.com`,
      password: 'test-password-hash'
    };
    
    const { data: insertedUser, error: insertError } = await supabase
      .from('users')
      .insert(testUser)
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ User insertion failed:', insertError);
      return false;
    }
    
    console.log('✅ User insertion successful');
    console.log('📊 Inserted user:', insertedUser);
    
    // Test 4: Clean up - delete the test user
    console.log('\n🔄 Cleaning up test user...');
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('user_id', insertedUser.user_id);
    
    if (deleteError) {
      console.error('❌ Test user cleanup failed:', deleteError);
    } else {
      console.log('✅ Test user cleaned up successfully');
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return false;
  }
}

async function main() {
  const success = await testConnection();
  
  if (success) {
    console.log('\n🎉 All Supabase tests passed! Connection is working properly.');
  } else {
    console.log('\n❌ Some tests failed. Please check the configuration.');
  }
  
  process.exit(success ? 0 : 1);
}

main();
