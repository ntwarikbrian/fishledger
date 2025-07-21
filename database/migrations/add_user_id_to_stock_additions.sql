-- =====================================================
-- Migration: Add user_id column to stock_additions table
-- Purpose: Enable data isolation for stock additions
-- Date: 2025-07-21
-- =====================================================

-- Add user_id column to stock_additions table for data isolation
ALTER TABLE stock_additions 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(user_id) ON DELETE CASCADE;

-- Update existing records to set user_id based on the performed_by user
-- This ensures existing stock additions are properly associated with users
UPDATE stock_additions 
SET user_id = performed_by
WHERE user_id IS NULL;

-- Make user_id NOT NULL after updating existing records
ALTER TABLE stock_additions 
ALTER COLUMN user_id SET NOT NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_stock_additions_user_id ON stock_additions(user_id);

-- Add comment for documentation
COMMENT ON COLUMN stock_additions.user_id IS 'User ID for data isolation - ensures stock additions belong to specific user';
