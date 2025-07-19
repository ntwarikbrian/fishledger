-- =====================================================
-- Migration: Payment Method Audit System Comprehensive Update
-- Version: 007
-- Description: Complete migration for payment method audit changes
-- Date: 2024-12-19
-- =====================================================

-- This migration combines all the payment method audit changes:
-- 1. Updates audit types from 'payment_update' to 'payment_method_change'
-- 2. Ensures only quantity_change and payment_method_change are supported
-- 3. Updates all related constraints and comments
-- 4. Migrates existing data

BEGIN;

-- =====================================================
-- STEP 1: Update sales_audit table constraints
-- =====================================================

-- Drop the existing constraint if it exists
ALTER TABLE sales_audit DROP CONSTRAINT IF EXISTS sales_audit_audit_type_check;

-- Add the new constraint with updated audit types
-- Only supporting quantity_change, payment_method_change, and deletion
ALTER TABLE sales_audit ADD CONSTRAINT sales_audit_audit_type_check 
CHECK (audit_type IN ('quantity_change', 'payment_method_change', 'deletion'));

-- =====================================================
-- STEP 2: Migrate existing audit records
-- =====================================================

-- Update any existing 'payment_update' records to 'payment_method_change'
-- This ensures backward compatibility with existing data
UPDATE sales_audit 
SET audit_type = 'payment_method_change' 
WHERE audit_type = 'payment_update';

-- Migration logging removed to avoid foreign key constraint issues
-- The migration changes are tracked in the database comments and this file

-- =====================================================
-- STEP 3: Update table and column comments
-- =====================================================

-- Update the main table comment
COMMENT ON TABLE sales_audit IS 'Audit trail for sales changes: quantity and payment method modifications only - Updated in migration 007';

-- Update the audit_type column comment
COMMENT ON COLUMN sales_audit.audit_type IS 'Type of change: quantity_change (for quantity modifications), payment_method_change (for payment method updates), or deletion';

-- Add detailed comments for the supported audit types
COMMENT ON COLUMN sales_audit.boxes_change IS 'Change in box quantity (positive for increase, negative for decrease) - Only used for quantity_change audit type';
COMMENT ON COLUMN sales_audit.kg_change IS 'Change in kg quantity (positive for increase, negative for decrease) - Only used for quantity_change audit type';

-- =====================================================
-- STEP 4: Create indexes for better performance
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
-- STEP 5: Add validation function for audit data
-- =====================================================

-- Create or replace function to validate audit data consistency
CREATE OR REPLACE FUNCTION validate_sales_audit_data()
RETURNS TRIGGER AS $$
BEGIN
    -- Validate quantity_change audit type
    IF NEW.audit_type = 'quantity_change' THEN
        -- Ensure at least one quantity change is recorded
        IF NEW.boxes_change = 0 AND NEW.kg_change = 0 THEN
            RAISE EXCEPTION 'quantity_change audit must have non-zero boxes_change or kg_change';
        END IF;
        
        -- Ensure old_values and new_values contain quantity information
        IF NEW.old_values IS NULL OR NEW.new_values IS NULL THEN
            RAISE EXCEPTION 'quantity_change audit must have old_values and new_values';
        END IF;
    END IF;
    
    -- Validate payment_method_change audit type
    IF NEW.audit_type = 'payment_method_change' THEN
        -- Ensure old_values and new_values contain payment method information
        IF NEW.old_values IS NULL OR NEW.new_values IS NULL THEN
            RAISE EXCEPTION 'payment_method_change audit must have old_values and new_values';
        END IF;
        
        -- Ensure payment method is actually different
        IF NEW.old_values->>'payment_method' = NEW.new_values->>'payment_method' THEN
            RAISE EXCEPTION 'payment_method_change audit must have different payment methods in old_values and new_values';
        END IF;
        
        -- Quantity changes should be zero for payment method changes
        IF NEW.boxes_change != 0 OR NEW.kg_change != 0 THEN
            RAISE EXCEPTION 'payment_method_change audit should not have quantity changes';
        END IF;
    END IF;
    
    -- Validate deletion audit type
    IF NEW.audit_type = 'deletion' THEN
        -- Quantity changes should be zero for deletions
        IF NEW.boxes_change != 0 OR NEW.kg_change != 0 THEN
            RAISE EXCEPTION 'deletion audit should not have quantity changes';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for audit data validation
DROP TRIGGER IF EXISTS trigger_validate_sales_audit_data ON sales_audit;
CREATE TRIGGER trigger_validate_sales_audit_data
    BEFORE INSERT OR UPDATE ON sales_audit
    FOR EACH ROW
    EXECUTE FUNCTION validate_sales_audit_data();

-- =====================================================
-- STEP 6: Create summary view for audit reporting
-- =====================================================

-- Create or replace view for audit summary reporting
CREATE OR REPLACE VIEW sales_audit_summary AS
SELECT 
    audit_type,
    COUNT(*) as total_audits,
    COUNT(CASE WHEN approval_status = 'pending' THEN 1 END) as pending_audits,
    COUNT(CASE WHEN approval_status = 'approved' THEN 1 END) as approved_audits,
    COUNT(CASE WHEN approval_status = 'rejected' THEN 1 END) as rejected_audits,
    MIN(timestamp) as earliest_audit,
    MAX(timestamp) as latest_audit
FROM sales_audit 
WHERE audit_type IN ('quantity_change', 'payment_method_change', 'deletion')
GROUP BY audit_type;

-- Add comment for the view
COMMENT ON VIEW sales_audit_summary IS 'Summary statistics for sales audit records by type - Created in migration 007';

-- =====================================================
-- STEP 7: Verification and logging
-- =====================================================

-- Verify the migration was successful
DO $$
DECLARE
    old_payment_update_count INTEGER;
    new_payment_method_count INTEGER;
BEGIN
    -- Check if any old 'payment_update' records remain
    SELECT COUNT(*) INTO old_payment_update_count 
    FROM sales_audit 
    WHERE audit_type = 'payment_update';
    
    -- Count new 'payment_method_change' records
    SELECT COUNT(*) INTO new_payment_method_count 
    FROM sales_audit 
    WHERE audit_type = 'payment_method_change';
    
    -- Log the results
    RAISE NOTICE 'Migration 007 completed:';
    RAISE NOTICE '  - Old payment_update records remaining: %', old_payment_update_count;
    RAISE NOTICE '  - New payment_method_change records: %', new_payment_method_count;
    
    -- Ensure no old records remain
    IF old_payment_update_count > 0 THEN
        RAISE EXCEPTION 'Migration failed: % payment_update records still exist', old_payment_update_count;
    END IF;
END $$;

COMMIT;

-- =====================================================
-- Migration completed successfully
-- =====================================================

-- Final verification query (run this after migration)
-- SELECT audit_type, COUNT(*) FROM sales_audit GROUP BY audit_type ORDER BY audit_type;
