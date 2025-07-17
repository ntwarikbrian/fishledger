-- Migration: Add to_recipient column to deposits table
-- Description: Adds a new column to store the recipient type for boss deposits (boss, manager, etc.)
-- Date: 2025-07-15

-- Add the to_recipient column to the deposits table
ALTER TABLE deposits 
ADD COLUMN IF NOT EXISTS to_recipient VARCHAR(100);

-- Add comment to the column
COMMENT ON COLUMN deposits.to_recipient IS 'For boss type deposits, specifies who (boss, manager, etc.)';

-- Create index for better query performance on to_recipient
CREATE INDEX IF NOT EXISTS idx_deposits_to_recipient ON deposits(to_recipient);
