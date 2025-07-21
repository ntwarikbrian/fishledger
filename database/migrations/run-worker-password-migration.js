/**
 * Migration Runner: Add Password Column to Workers Table
 * 
 * This script applies the worker password migration to your Supabase database.
 * 
 * Usage:
 * 1. Make sure you have your Supabase credentials set up
 * 2. Run: node run-worker-password-migration.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables (you may need to adjust this based on your setup)
require('dotenv').config({ path: '../../.env' });

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials. Please check your environment variables.');
  console.error('Required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('🚀 Starting worker password migration...');

    // Read the migration SQL file
    const migrationPath = path.join(__dirname, '010_add_worker_password.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Remove comments and split into individual statements
    const statements = migrationSQL
      .split('\n')
      .filter(line => !line.trim().startsWith('--') && line.trim() !== '')
      .join('\n')
      .split(';')
      .filter(statement => statement.trim() !== '');

    console.log(`📝 Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (statement) {
        console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
        
        const { error } = await supabase.rpc('exec_sql', { 
          sql: statement 
        });

        if (error) {
          console.error(`❌ Error executing statement ${i + 1}:`, error);
          throw error;
        }
      }
    }

    console.log('✅ Migration completed successfully!');
    console.log('');
    console.log('📋 Next steps:');
    console.log('1. Update your application to use the new password field');
    console.log('2. Test worker authentication functionality');
    console.log('3. Require existing workers to set new passwords');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
runMigration();
