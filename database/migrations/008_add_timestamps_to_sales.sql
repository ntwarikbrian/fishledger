-- =====================================================
-- Migration: Add Timestamp Columns to Sales Table
-- Version: 008
-- Description: Add created_at and updated_at columns to sales table for audit tracking
-- =====================================================

-- Add timestamp columns to sales table
ALTER TABLE sales 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL;

-- Add comments for the new columns
COMMENT ON COLUMN sales.created_at IS 'Timestamp when the sale record was created';
COMMENT ON COLUMN sales.updated_at IS 'Timestamp when the sale record was last updated';

-- Create function to automatically update updated_at column
CREATE OR REPLACE FUNCTION update_sales_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at on record changes
DROP TRIGGER IF EXISTS sales_updated_at_trigger ON sales;
CREATE TRIGGER sales_updated_at_trigger
    BEFORE UPDATE ON sales
    FOR EACH ROW
    EXECUTE FUNCTION update_sales_updated_at();

-- Update existing records to have proper timestamps
-- Set created_at to date_time if it exists, otherwise current timestamp
UPDATE sales 
SET 
    created_at = COALESCE(date_time, CURRENT_TIMESTAMP),
    updated_at = COALESCE(date_time, CURRENT_TIMESTAMP)
WHERE created_at IS NULL OR updated_at IS NULL;

-- Add indexes for better query performance on timestamp columns
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);
CREATE INDEX IF NOT EXISTS idx_sales_updated_at ON sales(updated_at);

-- Verification query (uncomment to run after migration)
-- SELECT 
--     COUNT(*) as total_sales,
--     COUNT(created_at) as sales_with_created_at,
--     COUNT(updated_at) as sales_with_updated_at
-- FROM sales;
