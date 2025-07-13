/**
 * Migration Runner Script
 * Helps apply database migrations to Supabase
 */

const fs = require('fs');
const path = require('path');

// Configuration - Update these with your Supabase details
const SUPABASE_URL = process.env.SUPABASE_URL || 'your-supabase-url';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'your-service-key';

async function runMigration(migrationFile) {
  try {
    console.log(`🚀 Running migration: ${migrationFile}`);
    
    // Read the migration file
    const migrationPath = path.join(__dirname, 'migrations', migrationFile);
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // If you have Supabase client setup, you can use it here
    // For now, we'll just output the SQL
    console.log('📄 Migration SQL:');
    console.log('================');
    console.log(migrationSQL);
    console.log('================');
    
    console.log('✅ Migration ready to apply!');
    console.log('');
    console.log('To apply this migration:');
    console.log('1. Copy the SQL above');
    console.log('2. Go to your Supabase dashboard > SQL Editor');
    console.log('3. Paste and run the SQL');
    console.log('');
    console.log('Or use Supabase CLI:');
    console.log('supabase db push');
    
  } catch (error) {
    console.error('❌ Error running migration:', error.message);
  }
}

// Get migration file from command line argument
const migrationFile = process.argv[2];

if (!migrationFile) {
  console.log('Usage: node run-migration.js <migration-file>');
  console.log('Example: node run-migration.js 001_add_audit_approval_workflow.sql');
  process.exit(1);
}

runMigration(migrationFile);
