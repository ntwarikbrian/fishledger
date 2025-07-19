-- =====================================================
-- Migration: Update Audit Types
-- Version: 006
-- Description: Update sales_audit table to support new audit types
-- =====================================================

-- Drop the existing constraint
ALTER TABLE sales_audit DROP CONSTRAINT IF EXISTS sales_audit_audit_type_check;

-- Add the new constraint with updated audit types
ALTER TABLE sales_audit ADD CONSTRAINT sales_audit_audit_type_check 
CHECK (audit_type IN ('quantity_change', 'payment_method_change', 'deletion'));

-- Update existing 'payment_update' records to 'payment_method_change'
UPDATE sales_audit 
SET audit_type = 'payment_method_change' 
WHERE audit_type = 'payment_update';

-- Update the comment to reflect the new audit types
COMMENT ON COLUMN sales_audit.audit_type IS 'Type of change: quantity_change, payment_method_change, or deletion';

-- Add a comment to track this migration
COMMENT ON TABLE sales_audit IS 'Audit trail for all sales-related changes with approval workflow - Updated audit types in migration 006';
