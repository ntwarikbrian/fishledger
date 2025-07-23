-- =====================================================
-- MIGRATION: Add user_id column to deposits table
-- Purpose: Add data isolation support to deposits table
-- =====================================================

-- Step 1: Add user_id column to deposits table
ALTER TABLE deposits 
ADD COLUMN IF NOT EXISTS user_id UUID;

-- Step 2: Update existing deposits to use created_by as user_id
UPDATE deposits 
SET user_id = created_by 
WHERE user_id IS NULL;

-- Step 3: Make user_id NOT NULL and add foreign key constraint
ALTER TABLE deposits 
ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE deposits 
ADD CONSTRAINT fk_deposits_user_id 
FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;

-- Step 4: Add foreign key constraints for audit fields if not already present
ALTER TABLE deposits 
DROP CONSTRAINT IF EXISTS fk_deposits_created_by;

ALTER TABLE deposits 
ADD CONSTRAINT fk_deposits_created_by 
FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE CASCADE;

ALTER TABLE deposits 
DROP CONSTRAINT IF EXISTS fk_deposits_updated_by;

ALTER TABLE deposits 
ADD CONSTRAINT fk_deposits_updated_by 
FOREIGN KEY (updated_by) REFERENCES users(user_id) ON DELETE SET NULL;

-- Step 5: Add index for user_id for better performance
CREATE INDEX IF NOT EXISTS idx_deposits_user_id ON deposits(user_id);

-- Step 6: Update composite indexes to include user_id
DROP INDEX IF EXISTS idx_deposits_type_approval;
CREATE INDEX IF NOT EXISTS idx_deposits_user_type_approval ON deposits(user_id, deposit_type, approval);

DROP INDEX IF EXISTS idx_deposits_date_approval;
CREATE INDEX IF NOT EXISTS idx_deposits_user_date_approval ON deposits(user_id, date_time, approval);

DROP INDEX IF EXISTS idx_deposits_created_by_approval;
CREATE INDEX IF NOT EXISTS idx_deposits_user_created_approval ON deposits(user_id, created_by, approval);

-- Add comment for the new column
COMMENT ON COLUMN deposits.user_id IS 'Data isolation: deposits belong to specific user';
