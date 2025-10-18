# Apply Audit Approval Migration

This guide helps you apply the audit approval workflow migration to your database.

## Quick Start

### Option 1: Using Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**
   - Go to your Supabase project dashboard
   - Navigate to "SQL Editor"

2. **Copy and Run the Migration**
   ```sql
   -- Migration: Add Audit Approval Workflow
   -- Description: Adds approval workflow fields to sales_audit table
   -- Date: 2024-01-24
   -- Version: 001

   -- Add approval workflow columns to sales_audit table
   ALTER TABLE sales_audit 
   ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) NOT NULL DEFAULT 'pending' 
       CHECK (approval_status IN ('pending', 'approved', 'rejected'));

   ALTER TABLE sales_audit 
   ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id);

   ALTER TABLE sales_audit 
   ADD COLUMN IF NOT EXISTS approval_timestamp TIMESTAMPTZ;

   ALTER TABLE sales_audit 
   ADD COLUMN IF NOT EXISTS approval_reason TEXT;

   -- Create indexes for better query performance on new columns
   CREATE INDEX IF NOT EXISTS idx_sales_audit_approval_status ON sales_audit(approval_status);
   CREATE INDEX IF NOT EXISTS idx_sales_audit_approved_by ON sales_audit(approved_by);

   -- Add comments for new columns
   COMMENT ON COLUMN sales_audit.approval_status IS 'Approval status: pending, approved, or rejected';
   COMMENT ON COLUMN sales_audit.approved_by IS 'User who approved or rejected the audit record';
   COMMENT ON COLUMN sales_audit.approval_timestamp IS 'When the audit record was approved or rejected';
   COMMENT ON COLUMN sales_audit.approval_reason IS 'Reason for approval or rejection';

   -- Update existing records to have pending status (if any exist)
   UPDATE sales_audit 
   SET approval_status = 'pending' 
   WHERE approval_status IS NULL;
   ```

3. **Click "Run"** to execute the migration

### Option 2: Using Supabase CLI

```bash
# Navigate to your project directory
cd "your-project-directory"

# Apply the migration
supabase db push

# Or reset the database with all migrations
supabase db reset
```

### Option 3: Using Node.js Script

```bash
# Run the migration script
node database/run-migration.js 001_add_audit_approval_workflow.sql
```

## Verification

After applying the migration, verify it worked by checking the table structure:

```sql
-- Check if new columns exist
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'sales_audit' 
AND column_name IN ('approval_status', 'approved_by', 'approval_timestamp', 'approval_reason');

-- Check if indexes were created
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'sales_audit' 
AND indexname LIKE '%approval%';
```

## What This Migration Does

✅ **Adds approval workflow columns:**
- `approval_status` - Status of the audit (pending/approved/rejected)
- `approved_by` - User who approved/rejected the audit
- `approval_timestamp` - When the approval/rejection happened
- `approval_reason` - Reason for the approval/rejection

✅ **Creates performance indexes:**
- Index on `approval_status` for filtering
- Index on `approved_by` for user queries

✅ **Sets up constraints:**
- Check constraint on approval_status values
- Foreign key reference to users table

✅ **Updates existing data:**
- Sets all existing audit records to 'pending' status

## Next Steps

After applying the migration:

1. **Restart your backend server** to ensure the new handlers are loaded
2. **Test the approval functionality** in the frontend
3. **Verify the API endpoints** work correctly:
   - `PUT /api/sales-audit/:id/approve`
   - `PUT /api/sales-audit/:id/reject`

## Rollback (if needed)

If you need to rollback this migration:

```sql
-- WARNING: This will lose approval data
ALTER TABLE sales_audit DROP COLUMN IF EXISTS approval_status;
ALTER TABLE sales_audit DROP COLUMN IF EXISTS approved_by;
ALTER TABLE sales_audit DROP COLUMN IF EXISTS approval_timestamp;
ALTER TABLE sales_audit DROP COLUMN IF EXISTS approval_reason;

-- Drop the indexes
DROP INDEX IF EXISTS idx_sales_audit_approval_status;
DROP INDEX IF EXISTS idx_sales_audit_approved_by;
```
