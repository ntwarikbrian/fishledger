#!/usr/bin/env node

/**
 * Test Local Database Connection and Check for Existing Data
 */

import { Pool } from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const localConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'inventory',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
};

const pool = new Pool(localConfig);

async function testLocalDatabase() {
  console.log('🔄 Testing local database connection...');
  console.log(`📍 Connecting to: ${localConfig.host}:${localConfig.port}/${localConfig.database}`);
  
  try {
    // Test connection
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Local database connection successful');
    console.log('📊 Current time:', result.rows[0].now);
    
    // Check if any tables have data
    const tables = [
      'users', 'workers', 'product_categories', 'products', 
      'contacts', 'expenses', 'sales', 'folders', 'files',
      'expense_categories', 'stock_movements', 'worker_tasks'
    ];
    
    let totalRows = 0;
    console.log('\n📋 Checking existing data:');
    
    for (const table of tables) {
      try {
        const count = await pool.query(`SELECT COUNT(*) FROM ${table}`);
        const rowCount = parseInt(count.rows[0].count);
        totalRows += rowCount;
        
        if (rowCount > 0) {
          console.log(`✅ ${table}: ${rowCount} rows`);
        } else {
          console.log(`⚪ ${table}: empty`);
        }
      } catch (err) {
        console.log(`❌ ${table}: table does not exist`);
      }
    }
    
    console.log(`\n📊 Total rows across all tables: ${totalRows}`);
    
    if (totalRows > 0) {
      console.log('\n💡 You have existing data that can be migrated to Supabase');
      console.log('💡 Run "npm run migrate:full" to migrate everything to Supabase');
    } else {
      console.log('\n💡 No existing data found - you can start fresh with Supabase');
      console.log('💡 Set DATABASE_MODE=supabase in your .env file to use Supabase');
    }
    
  } catch (error) {
    console.error('❌ Local database connection failed:', error.message);
    console.log('\n💡 This might be because:');
    console.log('   - PostgreSQL is not running locally');
    console.log('   - Database credentials are incorrect');
    console.log('   - Database does not exist');
    console.log('\n💡 You can still use Supabase by setting DATABASE_MODE=supabase');
  } finally {
    await pool.end();
  }
}

testLocalDatabase();
