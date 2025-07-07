const { supabaseClient } = require('../config/supabase-client');
const fs = require('fs');
const path = require('path');

async function runMigration(migrationFile) {
  try {
    console.log(`🔄 Running migration: ${migrationFile}`);
    
    // Read the migration file
    const migrationPath = path.join(__dirname, '../../database/migrations', migrationFile);
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split by semicolon and filter out empty statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.includes('NOTIFY')) {
        console.log(`⏭️  Skipping NOTIFY statement (${i + 1}/${statements.length})`);
        continue;
      }
      
      console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
      console.log(`   ${statement.substring(0, 100)}${statement.length > 100 ? '...' : ''}`);
      
      const { error } = await supabaseClient.rpc('exec_sql', { sql: statement });
      
      if (error) {
        console.error(`❌ Error executing statement ${i + 1}:`, error);
        throw error;
      }
      
      console.log(`✅ Statement ${i + 1} executed successfully`);
    }
    
    console.log(`🎉 Migration completed successfully: ${migrationFile}`);
    
  } catch (error) {
    console.error(`💥 Migration failed: ${migrationFile}`, error);
    throw error;
  }
}

// Get migration file from command line argument
const migrationFile = process.argv[2];

if (!migrationFile) {
  console.error('❌ Please provide a migration file name');
  console.log('Usage: node run-migration.js <migration-file.sql>');
  process.exit(1);
}

// Run the migration
runMigration(migrationFile)
  .then(() => {
    console.log('🏁 Migration process completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💀 Migration process failed:', error);
    process.exit(1);
  });
