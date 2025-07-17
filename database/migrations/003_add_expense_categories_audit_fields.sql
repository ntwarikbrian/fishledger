-- Migration: Add audit fields to expense_categories table
-- Description: Adds created_at and updated_at columns to expense_categories table
-- Date: 2025-07-15

-- Add created_at column if it doesn't exist
ALTER TABLE expense_categories 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Add updated_at column if it doesn't exist
ALTER TABLE expense_categories 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Add comments to the new columns
COMMENT ON COLUMN expense_categories.created_at IS 'Timestamp when the category was created';
COMMENT ON COLUMN expense_categories.updated_at IS 'Timestamp when the category was last updated';

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_expense_categories_created_at ON expense_categories(created_at);
CREATE INDEX IF NOT EXISTS idx_expense_categories_updated_at ON expense_categories(updated_at);

-- Update existing records to have proper timestamps if they don't have them
UPDATE expense_categories 
SET created_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
WHERE created_at IS NULL OR updated_at IS NULL;
