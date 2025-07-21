-- =====================================================
-- Migration: Add Password Column to Workers Table
-- Description: Add password column to workers table for authentication
-- Version: 010
-- Date: 2025-01-21
-- =====================================================

-- Start transaction
BEGIN;

-- Add password column to workers table
ALTER TABLE workers 
ADD COLUMN IF NOT EXISTS password VARCHAR(255);

-- Add comment for the new column
COMMENT ON COLUMN workers.password IS 'Hashed password for worker authentication';

-- Create index for password lookups (optional, but can help with performance)
-- Note: We don't index passwords directly for security reasons
-- CREATE INDEX IF NOT EXISTS idx_workers_password ON workers(password);

-- Update existing workers with a default temporary password
-- In production, you should require workers to set their own passwords
-- This is just for development/testing purposes
UPDATE workers 
SET password = '$2b$10$defaulthashedpasswordfordev123456789' 
WHERE password IS NULL;

-- Make password column NOT NULL after setting default values
ALTER TABLE workers 
ALTER COLUMN password SET NOT NULL;

-- Commit transaction
COMMIT;

-- Note: After running this migration, you should:
-- 1. Update your application to hash passwords before storing them
-- 2. Implement worker login functionality
-- 3. Require existing workers to set new passwords on first login
