# Database Migration Guide

This guide explains how to apply database migrations for the currency support feature.

## Overview

We've added currency support to the application, which requires a new `user_settings` table to store user preferences including currency selection (USD or RWF).

## Migration Files

### 001_add_user_settings.sql
- **Purpose**: Adds the `user_settings` table for storing user preferences
- **Features**:
  - Currency selection (USD or RWF)
  - Language preferences (en or rw)
  - Theme settings (light, dark, system)
  - Notification preferences
  - Business hours configuration
  - Creates default settings for existing users

## How to Apply Migrations

### Method 1: Using the Migration Runner (Recommended)

1. **Run specific migration**:
   ```bash
   cd database
   node run-migration.js 001_add_user_settings.sql
   ```

2. **Run all migrations**:
   ```bash
   cd database
   node run-migration.js all
   ```

3. **Copy the output SQL and paste it into your Supabase SQL Editor**

### Method 2: Manual Application

1. **Open Supabase Dashboard**
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor

2. **Copy Migration SQL**
   - Open `database/migrations/001_add_user_settings.sql`
   - Copy the entire content

3. **Execute in Supabase**
   - Paste the SQL into the SQL Editor
   - Click "Run" to execute the migration

### Method 3: Using Supabase CLI (if available)

```bash
# If you have Supabase CLI set up
supabase db push
```

## What the Migration Does

1. **Creates `user_settings` table** with the following columns:
   - `setting_id` (UUID, Primary Key)
   - `user_id` (UUID, Foreign Key to users table)
   - `currency` (VARCHAR, USD or RWF)
   - `language` (VARCHAR, en or rw)
   - `theme` (VARCHAR, light/dark/system)
   - `email_notifications` (BOOLEAN)
   - `sms_notifications` (BOOLEAN)
   - `low_stock_alerts` (BOOLEAN)
   - `daily_reports` (BOOLEAN)
   - `weekly_reports` (BOOLEAN)
   - `monthly_reports` (BOOLEAN)
   - `auto_reporting` (BOOLEAN)
   - `business_hours_start` (TIME)
   - `business_hours_end` (TIME)
   - `working_days` (INTEGER[])
   - `created_at` (TIMESTAMP)
   - `updated_at` (TIMESTAMP)

2. **Creates indexes** for performance:
   - Unique index on `user_id`
   - Index on `currency`
   - Index on `language`

3. **Creates trigger** for automatic `updated_at` timestamp updates

4. **Adds default settings** for all existing users

5. **Creates migration tracking table** to track applied migrations

## Verification

After applying the migration, verify it worked correctly:

1. **Check table exists**:
   ```sql
   SELECT table_name FROM information_schema.tables WHERE table_name = 'user_settings';
   ```

2. **Check default settings were created**:
   ```sql
   SELECT COUNT(*) FROM user_settings;
   ```

3. **Check migration was recorded**:
   ```sql
   SELECT * FROM schema_migrations WHERE version = '001';
   ```

## Rollback (if needed)

If you need to rollback this migration:

```sql
-- Drop the user_settings table
DROP TABLE IF EXISTS user_settings CASCADE;

-- Drop the trigger function
DROP FUNCTION IF EXISTS update_user_settings_updated_at() CASCADE;

-- Remove migration record
DELETE FROM schema_migrations WHERE version = '001';
```

## Frontend Changes

The migration enables the following frontend features:

1. **Currency Selection**: Users can choose between USD ($) and RWF in Settings
2. **Dynamic Currency Display**: All monetary values throughout the app will display in the selected currency
3. **Persistent Preferences**: Currency choice is saved to the database and persists across sessions
4. **Automatic Formatting**: Currency values are formatted according to the selected currency's conventions

## Testing

After applying the migration:

1. **Test Settings Page**: Go to Settings and verify the currency dropdown appears
2. **Test Currency Switching**: Change currency and verify it updates throughout the app
3. **Test Persistence**: Refresh the page and verify the currency choice is maintained
4. **Test New Users**: Create a new user and verify they get default settings

## Support

If you encounter issues:

1. Check the Supabase logs for any error messages
2. Verify your database permissions allow creating tables and indexes
3. Ensure the `users` table exists (required for foreign key constraint)
4. Contact the development team if problems persist

## Next Steps

After applying this migration:

1. Deploy the updated frontend code
2. Test the currency functionality thoroughly
3. Monitor for any issues in production
4. Consider adding more currencies in future updates
