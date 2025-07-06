#!/usr/bin/env node

/**
 * Test Backend Database Connection (Uses Current Configuration)
 */

import { pool, testConnection } from '../server/config/database.js';
import { env } from '../server/config/environment.js';

async function testBackendConnection() {
  console.log('🔄 Testing backend database connection...');
  console.log(`📍 Database mode: ${env.DATABASE_MODE}`);
  
  try {
    // Test connection using the backend's test function
    const isConnected = await testConnection();
    
    if (isConnected) {
      console.log('✅ Backend database connection successful');
      
      // Test a simple query
      const result = await pool.query('SELECT NOW() as current_time');
      console.log('📊 Current time:', result.rows[0].current_time);
      
      // List tables
      const tables = await pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
      `);
      
      console.log('\n📋 Available tables:');
      tables.rows.forEach(row => {
        console.log(`  ✅ ${row.table_name}`);
      });
      
      console.log(`\n🎉 Backend is successfully connected to ${env.DATABASE_MODE} database!`);
      
      if (env.DATABASE_MODE === 'supabase') {
        console.log('💡 Your application is now using Supabase for database operations');
      } else {
        console.log('💡 Your application is using local PostgreSQL database');
      }
      
    } else {
      console.log('❌ Backend database connection failed');
    }
    
  } catch (error) {
    console.error('❌ Backend database connection error:', error.message);
    
    if (env.DATABASE_MODE === 'supabase') {
      console.log('\n💡 Supabase connection troubleshooting:');
      console.log('   - Check SUPABASE_DB_PASSWORD in your .env file');
      console.log('   - Verify your Supabase project is active');
      console.log('   - Ensure network connectivity to Supabase');
    } else {
      console.log('\n💡 Local database troubleshooting:');
      console.log('   - Ensure PostgreSQL is running locally');
      console.log('   - Check database credentials in .env file');
      console.log('   - Verify database exists');
    }
  } finally {
    await pool.end();
  }
}

testBackendConnection();
