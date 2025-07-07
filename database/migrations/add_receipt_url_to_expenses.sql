-- Migration: Add receipt_url column to expenses table
-- Date: 2025-01-07
-- Description: Add receipt_url field to store Cloudinary URLs for expense receipts

-- Add the receipt_url column to the expenses table
ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS receipt_url TEXT;

-- Add comment for the new column
COMMENT ON COLUMN expenses.receipt_url IS 'URL to uploaded receipt image or document';

-- Update the status constraint to only allow 'pending' and 'paid'
ALTER TABLE expenses 
DROP CONSTRAINT IF EXISTS expenses_status_check;

ALTER TABLE expenses 
ADD CONSTRAINT expenses_status_check 
CHECK (status IN ('pending', 'paid'));

-- Refresh the schema cache (for Supabase)
NOTIFY pgrst, 'reload schema';
