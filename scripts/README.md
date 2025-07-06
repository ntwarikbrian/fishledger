# Database Migration to Supabase

This directory contains scripts and tools for migrating your local PostgreSQL database to Supabase.

## Prerequisites

1. **Supabase Database Password**: You need to get your Supabase database password from the Supabase dashboard:
   - Go to your Supabase project dashboard
   - Navigate to Settings > Database
   - Copy the database password
   - Add it to your `.env` file as `SUPABASE_DB_PASSWORD`

2. **Environment Configuration**: Make sure your `.env` file contains all the required Supabase configuration variables.

## Migration Process

### Step 1: Test Connections

First, test that both your local PostgreSQL and Supabase connections are working:

```bash
cd server
npm run migrate:test
```

### Step 2: Deploy Schema to Supabase

Deploy your database schema to Supabase:

```bash
npm run migrate:schema
```

This will execute the `database/main.sql` file on your Supabase database, creating all tables and relationships.

### Step 3: Export Local Data

Export your existing data from the local PostgreSQL database:

```bash
npm run migrate:export
```

This creates a `database-export.json` file with all your data.

### Step 4: Import Data to Supabase

Import the exported data to Supabase:

```bash
npm run migrate:import
```

### Full Migration (All Steps)

To run all steps in sequence:

```bash
npm run migrate:full
```

## Switching to Supabase Mode

After successful migration, switch your application to use Supabase:

1. Update your `.env` file:
   ```env
   DATABASE_MODE=supabase
   ```

2. Restart your server:
   ```bash
   npm run dev
   ```

Your application will now connect to Supabase instead of local PostgreSQL.

## Switching Back to Local Mode

To switch back to local PostgreSQL:

1. Update your `.env` file:
   ```env
   DATABASE_MODE=local
   ```

2. Restart your server

## Troubleshooting

### Connection Issues

- **Local PostgreSQL**: Ensure your local PostgreSQL server is running and credentials are correct
- **Supabase**: Verify your Supabase project is active and database password is correct

### Schema Issues

- If schema deployment fails, check that your `database/main.sql` file is valid PostgreSQL syntax
- Ensure all required extensions are available in Supabase

### Data Import Issues

- Foreign key constraints may cause import issues - the script imports tables in the correct order
- If you have existing data in Supabase, the script will truncate tables before import
- Comment out the `TRUNCATE` line in the script if you want to preserve existing data

## Files

- `migrate-to-supabase.js` - Main migration script
- `database-export.json` - Generated export file (created after running export)
- `README.md` - This documentation

## Environment Variables Required

```env
# Local Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=inventory
DB_USER=postgres
DB_PASSWORD=your_local_password

# Supabase Database
SUPABASE_DB_HOST=db.hebdlpduohlfhdgvugla.supabase.co
SUPABASE_DB_PORT=5432
SUPABASE_DB_NAME=postgres
SUPABASE_DB_USER=postgres
SUPABASE_DB_PASSWORD=your_supabase_password

# Database Mode
DATABASE_MODE=local  # or 'supabase'
```
