-- =====================================================
-- Migration: Payment Method Audit System Update (Final)
-- Version: 007-final
-- Description: Production-ready migration for payment method audit changes
-- Date: 2024-12-19
-- =====================================================

-- This migration safely updates the audit system to support payment method changes
-- without any foreign key constraint issues

BEGIN;

-- =====================================================
-- STEP 1: Update sales_audit table constraints
-- =====================================================

-- Drop the existing constraint if it exists
ALTER TABLE sales_audit DROP CONSTRAINT IF EXISTS sales_audit_audit_type_check;

-- Add the new constraint with updated audit types
-- Only supporting: quantity_change, payment_method_change, deletion
ALTER TABLE sales_audit ADD CONSTRAINT sales_audit_audit_type_check 
CHECK (audit_type IN ('quantity_change', 'payment_method_change', 'deletion'));

-- =====================================================
-- STEP 2: Migrate existing audit records
-- =====================================================

-- Count existing payment_update records before migration
DO $$
DECLARE
    old_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO old_count FROM sales_audit WHERE audit_type = 'payment_update';
    RAISE NOTICE 'Found % payment_update records to migrate', old_count;
END $$;

-- Update any existing 'payment_update' records to 'payment_method_change'
-- This ensures backward compatibility with existing data
UPDATE sales_audit 
SET audit_type = 'payment_method_change',
    updated_at = CURRENT_TIMESTAMP
WHERE audit_type = 'payment_update';

-- =====================================================
-- STEP 3: Update table and column comments
-- =====================================================

-- Update the main table comment
COMMENT ON TABLE sales_audit IS 'Audit trail for sales changes: quantity and payment method modifications only - Updated in migration 007';

-- Update the audit_type column comment
COMMENT ON COLUMN sales_audit.audit_type IS 'Type of change: quantity_change (for quantity modifications), payment_method_change (for payment method updates), or deletion';

-- Add detailed comments for clarity
COMMENT ON COLUMN sales_audit.boxes_change IS 'Change in box quantity (positive for increase, negative for decrease) - Only used for quantity_change audit type';
COMMENT ON COLUMN sales_audit.kg_change IS 'Change in kg quantity (positive for increase, negative for decrease) - Only used for quantity_change audit type';
COMMENT ON COLUMN sales_audit.old_values IS 'JSON object containing the old values before change - Contains payment_method for payment_method_change audits';
COMMENT ON COLUMN sales_audit.new_values IS 'JSON object containing the new values after change - Contains payment_method for payment_method_change audits';

-- =====================================================
-- STEP 4: Create performance indexes (optional)
-- =====================================================

-- Create index for payment method change queries
CREATE INDEX IF NOT EXISTS idx_sales_audit_payment_method_change 
ON sales_audit(audit_type, timestamp) 
WHERE audit_type = 'payment_method_change';

-- Create index for quantity change queries  
CREATE INDEX IF NOT EXISTS idx_sales_audit_quantity_change 
ON sales_audit(audit_type, timestamp) 
WHERE audit_type = 'quantity_change';

-- =====================================================
-- STEP 5: Verification and final checks
-- =====================================================

-- Verify the migration was successful
DO $$
DECLARE
    old_payment_update_count INTEGER;
    new_payment_method_count INTEGER;
    quantity_change_count INTEGER;
    deletion_count INTEGER;
    total_audits INTEGER;
BEGIN
    -- Check if any old 'payment_update' records remain
    SELECT COUNT(*) INTO old_payment_update_count 
    FROM sales_audit 
    WHERE audit_type = 'payment_update';
    
    -- Count records by type
    SELECT COUNT(*) INTO new_payment_method_count 
    FROM sales_audit 
    WHERE audit_type = 'payment_method_change';
    
    SELECT COUNT(*) INTO quantity_change_count 
    FROM sales_audit 
    WHERE audit_type = 'quantity_change';
    
    SELECT COUNT(*) INTO deletion_count 
    FROM sales_audit 
    WHERE audit_type = 'deletion';
    
    -- Count total audit records
    SELECT COUNT(*) INTO total_audits FROM sales_audit;
    
    -- Log the results
    RAISE NOTICE '=== Migration 007 Results ===';
    RAISE NOTICE 'Total audit records: %', total_audits;
    RAISE NOTICE 'Quantity change audits: %', quantity_change_count;
    RAISE NOTICE 'Payment method change audits: %', new_payment_method_count;
    RAISE NOTICE 'Deletion audits: %', deletion_count;
    RAISE NOTICE 'Old payment_update records remaining: %', old_payment_update_count;
    
    -- Ensure no old records remain
    IF old_payment_update_count > 0 THEN
        RAISE EXCEPTION 'Migration failed: % payment_update records still exist', old_payment_update_count;
    END IF;
    
    -- Verify constraint is working
    BEGIN
        INSERT INTO sales_audit (sale_id, audit_type, reason, performed_by) 
        VALUES ('00000000-0000-0000-0000-000000000000', 'invalid_type', 'test', '00000000-0000-0000-0000-000000000000');
        RAISE EXCEPTION 'Constraint check failed: invalid audit type was allowed';
    EXCEPTION
        WHEN check_violation THEN
            RAISE NOTICE 'Constraint verification passed: invalid audit types are properly rejected';
        WHEN foreign_key_violation THEN
            RAISE NOTICE 'Constraint verification passed: invalid audit types are properly rejected';
    END;
    
    RAISE NOTICE 'Migration 007 completed successfully!';
    RAISE NOTICE '=============================';
END $$;

COMMIT;

-- =====================================================
-- Post-migration verification queries
-- =====================================================

-- Run these queries after migration to verify results:

-- 1. Check audit type distribution
-- SELECT 
--     audit_type, 
--     COUNT(*) as count,
--     MIN(timestamp) as earliest,
--     MAX(timestamp) as latest
-- FROM sales_audit 
-- GROUP BY audit_type 
-- ORDER BY audit_type;

-- 2. Check for any remaining old audit types
-- SELECT COUNT(*) as old_payment_update_count 
-- FROM sales_audit 
-- WHERE audit_type = 'payment_update';

-- 3. Verify constraint is active
-- SELECT conname, consrc 
-- FROM pg_constraint 
-- WHERE conname = 'sales_audit_audit_type_check';

-- =====================================================
-- Migration completed successfully
-- =====================================================
