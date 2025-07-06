#!/usr/bin/env node

/**
 * Test Supabase Database Connection
 */

import { Pool } from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseConfig = {
  host: process.env.SUPABASE_DB_HOST || 'db.hebdlpduohlfhdgvugla.supabase.co',
  port: parseInt(process.env.SUPABASE_DB_PORT || '5432', 10),
  database: process.env.SUPABASE_DB_NAME || 'postgres',
  user: process.env.SUPABASE_DB_USER || 'postgres',
  password: process.env.SUPABASE_DB_PASSWORD || '',
  ssl: { rejectUnauthorized: false },
};

const pool = new Pool(supabaseConfig);

async function testSupabaseConnection() {
  console.log('🔄 Testing Supabase database connection...');
  console.log(`📍 Connecting to: ${supabaseConfig.host}:${supabaseConfig.port}/${supabaseConfig.database}`);
  
  if (!supabaseConfig.password) {
    console.log('⚠️  Warning: SUPABASE_DB_PASSWORD is not set in .env file');
    console.log('💡 You need to get the database password from your Supabase dashboard:');
    console.log('   1. Go to https://supabase.com/dashboard/project/hebdlpduohlfhdgvugla');
    console.log('   2. Navigate to Settings > Database');
    console.log('   3. Copy the database password');
    console.log('   4. Add it to your .env file as SUPABASE_DB_PASSWORD=your_password');
    return;
  }
  
  try {
    // Test connection
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Supabase database connection successful');
    console.log('📊 Current time:', result.rows[0].now);
    
    // List all tables
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('\n📋 Tables in Supabase database:');
    tables.rows.forEach(row => {
      console.log(`  ✅ ${row.table_name}`);
    });
    
    // Check table counts
    console.log('\n📊 Table row counts:');
    for (const table of tables.rows) {
      try {
        const count = await pool.query(`SELECT COUNT(*) FROM ${table.table_name}`);
        console.log(`  📋 ${table.table_name}: ${count.rows[0].count} rows`);
      } catch (err) {
        console.log(`  ❌ ${table.table_name}: error reading (${err.message})`);
      }
    }
    
    console.log('\n🎉 Supabase connection test completed successfully!');
    console.log('💡 Your backend is now configured to use Supabase database');
    
  } catch (error) {
    console.error('❌ Supabase database connection failed:', error.message);
    console.log('\n💡 This might be because:');
    console.log('   - Database password is incorrect');
    console.log('   - Network connectivity issues');
    console.log('   - Supabase project is not active');
    console.log('\n💡 Please check your Supabase project settings and credentials');
  } finally {
    await pool.end();
  }
}

testSupabaseConnection();
