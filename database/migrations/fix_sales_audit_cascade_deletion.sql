-- Migration: Fix sales_audit cascade deletion issue
-- This migration changes the foreign key constraint to preserve audit records when sales are deleted

-- Step 1: Drop the existing foreign key constraint
ALTER TABLE sales_audit 
    DROP CONSTRAINT IF EXISTS sales_audit_sale_id_fkey;

-- Step 2: Add the new foreign key constraint without CASCADE DELETE
-- This allows audit records to remain even after the sale is deleted
ALTER TABLE sales_audit 
    ADD CONSTRAINT sales_audit_sale_id_fkey 
    FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE SET NULL;

-- Step 3: Allow sale_id to be nullable for deleted sales
ALTER TABLE sales_audit 
    ALTER COLUMN sale_id DROP NOT NULL;

-- Step 4: Add a comment to explain the change
COMMENT ON CONSTRAINT sales_audit_sale_id_fkey ON sales_audit IS 
'Foreign key to sales table with SET NULL on delete to preserve audit trail for deleted sales';

-- Step 5: Update any existing audit records that might have issues
-- (This is a safety measure in case there are any orphaned records)
UPDATE sales_audit 
SET sale_id = NULL 
WHERE sale_id NOT IN (SELECT id FROM sales);
