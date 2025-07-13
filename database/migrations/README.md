# Database Migrations

This directory contains database migration files for the Fish Management System.

## Migration Naming Convention

Migrations should be named using the following pattern:
```
{version}_{description}.sql
```

Where:
- `version`: 3-digit zero-padded number (001, 002, 003, etc.)
- `description`: Brief description using snake_case

## How to Run Migrations

### Using Supabase CLI (Recommended)
```bash
# Apply all pending migrations
supabase db reset

# Or apply specific migration
supabase db push
```

### Manual Execution
1. Connect to your Supabase database
2. Execute the SQL files in order (001, 002, 003, etc.)

## Migration Files

### 001_add_audit_approval_workflow.sql
- **Purpose**: Adds approval workflow to sales audit system
- **Changes**:
  - Adds `approval_status` column (pending/approved/rejected)
  - Adds `approved_by` column (references users table)
  - Adds `approval_timestamp` column
  - Adds `approval_reason` column
  - Creates indexes for performance
  - Updates existing records to 'pending' status

## Best Practices

1. **Always backup** your database before running migrations
2. **Test migrations** on a development environment first
3. **Never modify** existing migration files once they've been applied
4. **Create new migrations** for any schema changes
5. **Include rollback instructions** in comments when possible

## Rollback Instructions

### For 001_add_audit_approval_workflow.sql
```sql
-- Remove the added columns (WARNING: This will lose data)
ALTER TABLE sales_audit DROP COLUMN IF EXISTS approval_status;
ALTER TABLE sales_audit DROP COLUMN IF EXISTS approved_by;
ALTER TABLE sales_audit DROP COLUMN IF EXISTS approval_timestamp;
ALTER TABLE sales_audit DROP COLUMN IF EXISTS approval_reason;

-- Drop the indexes
DROP INDEX IF EXISTS idx_sales_audit_approval_status;
DROP INDEX IF EXISTS idx_sales_audit_approved_by;
```

## Migration Status Tracking

Consider creating a migrations table to track applied migrations:

```sql
CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(10) PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    description TEXT
);
```
