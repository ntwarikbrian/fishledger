#!/usr/bin/env node

/**
 * Database Migration Script for Supabase
 * Exports data from local PostgreSQL and imports to Supabase
 */

import { Pool } from 'pg';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Database configurations
 */
const localConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'inventory',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
};

const supabaseConfig = {
  host: process.env.SUPABASE_DB_HOST || 'db.hebdlpduohlfhdgvugla.supabase.co',
  port: parseInt(process.env.SUPABASE_DB_PORT || '5432', 10),
  database: process.env.SUPABASE_DB_NAME || 'postgres',
  user: process.env.SUPABASE_DB_USER || 'postgres',
  password: process.env.SUPABASE_DB_PASSWORD || '',
  ssl: { rejectUnauthorized: false },
};

/**
 * Create database connection pools
 */
const localPool = new Pool(localConfig);
const supabasePool = new Pool(supabaseConfig);

/**
 * List of tables to migrate (in order to respect foreign key constraints)
 */
const TABLES_ORDER = [
  'users',
  'workers',
  'fish_categories',
  'suppliers',
  'fish_products',
  'contacts',
  'document_folders',
  'documents',
  'expense_categories',
  'expenses',
  'sales',
  'sale_items',
  'stock_movements',
  'worker_tasks',
  'worker_attendance',
  'message_settings',
  'message_history'
];

/**
 * Export data from local database
 */
async function exportLocalData() {
  console.log('🔄 Starting local database export...');
  
  const exportData = {};
  
  try {
    for (const table of TABLES_ORDER) {
      console.log(`📤 Exporting table: ${table}`);
      
      // Check if table exists
      const tableExists = await localPool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        );
      `, [table]);
      
      if (!tableExists.rows[0].exists) {
        console.log(`⚠️  Table ${table} does not exist, skipping...`);
        continue;
      }
      
      // Export table data
      const result = await localPool.query(`SELECT * FROM ${table}`);
      exportData[table] = result.rows;
      
      console.log(`✅ Exported ${result.rows.length} rows from ${table}`);
    }
    
    // Save export data to file
    const exportPath = path.join(__dirname, 'database-export.json');
    await fs.writeFile(exportPath, JSON.stringify(exportData, null, 2));
    
    console.log(`💾 Export data saved to: ${exportPath}`);
    console.log('✅ Local database export completed successfully!');
    
    return exportData;
    
  } catch (error) {
    console.error('❌ Error during local database export:', error);
    throw error;
  }
}

/**
 * Deploy schema to Supabase
 */
async function deploySchemaToSupabase() {
  console.log('🔄 Deploying schema to Supabase...');
  
  try {
    // Read the main schema file
    const schemaPath = path.join(__dirname, '..', 'database', 'main.sql');
    const schemaSQL = await fs.readFile(schemaPath, 'utf8');
    
    // Execute schema on Supabase
    console.log('📤 Executing schema on Supabase...');
    await supabasePool.query(schemaSQL);
    
    console.log('✅ Schema deployed to Supabase successfully!');
    
  } catch (error) {
    console.error('❌ Error deploying schema to Supabase:', error);
    throw error;
  }
}

/**
 * Import data to Supabase
 */
async function importDataToSupabase(exportData) {
  console.log('🔄 Starting Supabase data import...');
  
  try {
    for (const table of TABLES_ORDER) {
      if (!exportData[table] || exportData[table].length === 0) {
        console.log(`⚠️  No data to import for table: ${table}`);
        continue;
      }
      
      console.log(`📥 Importing ${exportData[table].length} rows to ${table}`);
      
      // Clear existing data (optional - comment out if you want to preserve existing data)
      await supabasePool.query(`TRUNCATE TABLE ${table} CASCADE`);
      
      // Import data row by row
      for (const row of exportData[table]) {
        const columns = Object.keys(row);
        const values = Object.values(row);
        const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');
        
        const insertQuery = `
          INSERT INTO ${table} (${columns.join(', ')}) 
          VALUES (${placeholders})
          ON CONFLICT DO NOTHING
        `;
        
        await supabasePool.query(insertQuery, values);
      }
      
      console.log(`✅ Imported data to ${table}`);
    }
    
    console.log('✅ Supabase data import completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during Supabase data import:', error);
    throw error;
  }
}

/**
 * Test database connections
 */
async function testConnections() {
  console.log('🔄 Testing database connections...');
  
  try {
    // Test local connection
    console.log('📡 Testing local PostgreSQL connection...');
    await localPool.query('SELECT NOW()');
    console.log('✅ Local PostgreSQL connection successful');
    
    // Test Supabase connection
    console.log('📡 Testing Supabase connection...');
    await supabasePool.query('SELECT NOW()');
    console.log('✅ Supabase connection successful');
    
  } catch (error) {
    console.error('❌ Database connection test failed:', error);
    throw error;
  }
}

/**
 * Main migration function
 */
async function migrate() {
  console.log('🚀 Starting database migration to Supabase...\n');
  
  try {
    // Test connections first
    await testConnections();
    console.log('');
    
    // Deploy schema to Supabase
    await deploySchemaToSupabase();
    console.log('');
    
    // Export data from local database
    const exportData = await exportLocalData();
    console.log('');
    
    // Import data to Supabase
    await importDataToSupabase(exportData);
    console.log('');
    
    console.log('🎉 Database migration completed successfully!');
    console.log('💡 You can now switch to Supabase mode by setting DATABASE_MODE=supabase in your .env file');
    
  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  } finally {
    // Close connections
    await localPool.end();
    await supabasePool.end();
  }
}

/**
 * Command line interface
 */
const command = process.argv[2];

switch (command) {
  case 'test':
    testConnections().then(() => process.exit(0)).catch(() => process.exit(1));
    break;
  case 'schema':
    deploySchemaToSupabase().then(() => process.exit(0)).catch(() => process.exit(1));
    break;
  case 'export':
    exportLocalData().then(() => process.exit(0)).catch(() => process.exit(1));
    break;
  case 'import':
    // Load export data and import
    fs.readFile(path.join(__dirname, 'database-export.json'), 'utf8')
      .then(data => importDataToSupabase(JSON.parse(data)))
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
    break;
  case 'migrate':
  default:
    migrate();
    break;
}
