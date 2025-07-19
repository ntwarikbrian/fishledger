/**
 * Database Migration Runner
 * Helps apply database migrations to Supabase
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration - Update these with your Supabase details
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'your-supabase-url';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-key';

/**
 * Get list of migration files
 */
function getMigrationFiles() {
  const migrationsDir = path.join(__dirname, 'migrations');

  if (!fs.existsSync(migrationsDir)) {
    console.log('📁 No migrations directory found');
    return [];
  }

  return fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort(); // Sort to ensure migrations run in order
}

/**
 * Run a specific migration file
 */
async function runMigration(migrationFile) {
  try {
    console.log(`🚀 Preparing migration: ${migrationFile}`);

    // Read the migration file
    const migrationPath = path.join(__dirname, 'migrations', migrationFile);

    if (!fs.existsSync(migrationPath)) {
      console.error(`❌ Migration file not found: ${migrationPath}`);
      return;
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

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
    console.log('Alternative methods:');
    console.log('- Use Supabase CLI: supabase db push');
    console.log('- Use psql: psql -h <host> -U <user> -d <database> -f migrations/' + migrationFile);

  } catch (error) {
    console.error('❌ Error reading migration:', error.message);
  }
}

/**
 * Run all pending migrations
 */
async function runAllMigrations() {
  console.log('🚀 Preparing all migrations...\n');

  const migrationFiles = getMigrationFiles();

  if (migrationFiles.length === 0) {
    console.log('📋 No migration files found');
    return;
  }

  console.log(`📋 Found ${migrationFiles.length} migration files:`);
  migrationFiles.forEach((file, index) => {
    console.log(`  ${index + 1}. ${file}`);
  });

  console.log('\n📄 Combined Migration SQL:');
  console.log('==========================');

  for (const file of migrationFiles) {
    const migrationPath = path.join(__dirname, 'migrations', file);
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log(`-- Migration: ${file}`);
    console.log(migrationSQL);
    console.log('');
  }

  console.log('==========================');
  console.log('✅ All migrations ready to apply!');
  console.log('');
  console.log('To apply these migrations:');
  console.log('1. Copy all the SQL above');
  console.log('2. Go to your Supabase dashboard > SQL Editor');
  console.log('3. Paste and run the SQL');
}

// Get migration file from command line argument
const migrationFile = process.argv[2];

if (!migrationFile) {
  console.log('Usage:');
  console.log('  node run-migration.js <migration-file>  # Run specific migration');
  console.log('  node run-migration.js all               # Run all migrations');
  console.log('');
  console.log('Examples:');
  console.log('  node run-migration.js 001_add_user_settings.sql');
  console.log('  node run-migration.js all');
  process.exit(1);
}

// Run the appropriate function based on argument
if (migrationFile === 'all') {
  runAllMigrations();
} else {
  runMigration(migrationFile);
}
