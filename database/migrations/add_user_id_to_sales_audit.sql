-- =====================================================
-- Migration: Add user_id column to sales_audit table
-- Purpose: Enable data isolation for sales audit records
-- Date: 2025-07-21
-- =====================================================

-- Add user_id column to sales_audit table for data isolation
ALTER TABLE sales_audit 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(user_id) ON DELETE CASCADE;

-- Update existing records to set user_id based on the sale's user_id
-- This ensures existing audit records are properly associated with users
UPDATE sales_audit 
SET user_id = (
    SELECT s.user_id 
    FROM sales s 
    WHERE s.id = sales_audit.sale_id
)
WHERE user_id IS NULL AND sale_id IS NOT NULL;

-- For audit records where sale_id is NULL (deleted sales), 
-- set user_id based on performed_by user
UPDATE sales_audit 
SET user_id = performed_by
WHERE user_id IS NULL AND sale_id IS NULL;

-- Make user_id NOT NULL after updating existing records
ALTER TABLE sales_audit 
ALTER COLUMN user_id SET NOT NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_sales_audit_user_id ON sales_audit(user_id);

-- Add comment for documentation
COMMENT ON COLUMN sales_audit.user_id IS 'User ID for data isolation - ensures audit records belong to specific user';

-- Verification query (optional - for testing)
-- SELECT 
--     COUNT(*) as total_records,
--     COUNT(user_id) as records_with_user_id,
--     COUNT(*) - COUNT(user_id) as records_without_user_id
-- FROM sales_audit;
