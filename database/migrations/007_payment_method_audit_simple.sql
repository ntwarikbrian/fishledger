-- =====================================================
-- Migration: Payment Method Audit System Update (Simple)
-- Version: 007-simple
-- Description: Essential changes for payment method audit system
-- Date: 2024-12-19
-- =====================================================

-- This is a simplified version that focuses on the core changes:
-- 1. Updates audit types from 'payment_update' to 'payment_method_change'
-- 2. Migrates existing data
-- 3. Updates constraints and comments

BEGIN;

-- =====================================================
-- STEP 1: Update sales_audit table constraints
-- =====================================================

-- Drop the existing constraint if it exists
ALTER TABLE sales_audit DROP CONSTRAINT IF EXISTS sales_audit_audit_type_check;

-- Add the new constraint with updated audit types
ALTER TABLE sales_audit ADD CONSTRAINT sales_audit_audit_type_check 
CHECK (audit_type IN ('quantity_change', 'payment_method_change', 'deletion'));

-- =====================================================
-- STEP 2: Migrate existing audit records
-- =====================================================

-- Update any existing 'payment_update' records to 'payment_method_change'
UPDATE sales_audit 
SET audit_type = 'payment_method_change' 
WHERE audit_type = 'payment_update';

-- =====================================================
-- STEP 3: Update table and column comments
-- =====================================================

-- Update the main table comment
COMMENT ON TABLE sales_audit IS 'Audit trail for sales changes: quantity and payment method modifications only - Updated in migration 007';

-- Update the audit_type column comment
COMMENT ON COLUMN sales_audit.audit_type IS 'Type of change: quantity_change (for quantity modifications), payment_method_change (for payment method updates), or deletion';

-- =====================================================
-- STEP 4: Verification
-- =====================================================

-- Verify the migration was successful
DO $$
DECLARE
    old_payment_update_count INTEGER;
    new_payment_method_count INTEGER;
    total_audits INTEGER;
BEGIN
    -- Check if any old 'payment_update' records remain
    SELECT COUNT(*) INTO old_payment_update_count 
    FROM sales_audit 
    WHERE audit_type = 'payment_update';
    
    -- Count new 'payment_method_change' records
    SELECT COUNT(*) INTO new_payment_method_count 
    FROM sales_audit 
    WHERE audit_type = 'payment_method_change';
    
    -- Count total audit records
    SELECT COUNT(*) INTO total_audits FROM sales_audit;
    
    -- Log the results
    RAISE NOTICE 'Migration 007 completed successfully:';
    RAISE NOTICE '  - Total audit records: %', total_audits;
    RAISE NOTICE '  - Old payment_update records remaining: %', old_payment_update_count;
    RAISE NOTICE '  - New payment_method_change records: %', new_payment_method_count;
    
    -- Ensure no old records remain
    IF old_payment_update_count > 0 THEN
        RAISE EXCEPTION 'Migration failed: % payment_update records still exist', old_payment_update_count;
    END IF;
    
    RAISE NOTICE 'Migration 007 verification passed!';
END $$;

COMMIT;

-- =====================================================
-- Post-migration verification query
-- =====================================================

-- Run this query after migration to verify results:
-- SELECT 
--     audit_type, 
--     COUNT(*) as count,
--     MIN(timestamp) as earliest,
--     MAX(timestamp) as latest
-- FROM sales_audit 
-- GROUP BY audit_type 
-- ORDER BY audit_type;
