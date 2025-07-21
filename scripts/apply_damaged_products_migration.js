/**
 * Script to apply the damaged_products migration
 * This adds the user_id column to the damaged_products table for data isolation
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  process.exit(1);
}

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  try {
    console.log('🚀 Starting damaged_products migration...');

    // Read the migration file
    const migrationPath = path.join(process.cwd(), 'database', 'migrations', 'add_user_id_to_damaged_products.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration SQL loaded from:', migrationPath);

    // Split the migration into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📝 Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          console.error(`❌ Error executing statement ${i + 1}:`, error);
          throw error;
        }
        
        console.log(`✅ Statement ${i + 1} executed successfully`);
      } catch (error) {
        console.error(`❌ Failed to execute statement ${i + 1}:`, statement);
        throw error;
      }
    }

    console.log('🎉 Migration completed successfully!');
    console.log('✅ The damaged_products table now has proper data isolation with user_id column');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
applyMigration();
