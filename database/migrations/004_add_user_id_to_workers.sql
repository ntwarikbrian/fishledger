-- =====================================================
-- Migration: Add user_id column to workers table for data isolation
-- This migration ensures complete data isolation for worker management
-- =====================================================

-- Step 1: Add user_id column to workers table
DO $$
BEGIN
    -- Check if user_id column exists in workers table
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'workers' AND column_name = 'user_id'
    ) THEN
        -- Add user_id column to workers table
        ALTER TABLE workers ADD COLUMN user_id UUID REFERENCES users(user_id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Added user_id column to workers table';
    ELSE
        RAISE NOTICE 'user_id column already exists in workers table';
    END IF;
END $$;

-- Step 2: Update existing workers records with user_id
-- Note: This assumes there's at least one user in the system
-- In production, you might need to handle this differently based on your data
DO $$
DECLARE
    default_user_id UUID;
    worker_count INTEGER;
    updated_count INTEGER;
BEGIN
    -- Count workers without user_id
    SELECT COUNT(*) INTO worker_count FROM workers WHERE user_id IS NULL;
    
    IF worker_count > 0 THEN
        -- Get the first user ID as default (you may need to adjust this logic)
        SELECT user_id INTO default_user_id FROM users ORDER BY created_at ASC LIMIT 1;
        
        IF default_user_id IS NOT NULL THEN
            -- Update existing workers to belong to the first user
            UPDATE workers 
            SET user_id = default_user_id 
            WHERE user_id IS NULL;
            
            GET DIAGNOSTICS updated_count = ROW_COUNT;
            RAISE NOTICE 'Updated % existing workers with default user_id: %', updated_count, default_user_id;
        ELSE
            RAISE WARNING 'No users found in the system. Please ensure at least one user exists before running this migration.';
        END IF;
    ELSE
        RAISE NOTICE 'All workers already have user_id assigned';
    END IF;
END $$;

-- Step 3: Make user_id NOT NULL after updating existing records
DO $$
BEGIN
    -- Check if there are any workers without user_id
    IF NOT EXISTS (SELECT 1 FROM workers WHERE user_id IS NULL) THEN
        -- Make user_id NOT NULL
        ALTER TABLE workers ALTER COLUMN user_id SET NOT NULL;
        RAISE NOTICE 'Set user_id column as NOT NULL in workers table';
    ELSE
        RAISE WARNING 'Cannot set user_id as NOT NULL - some workers still have NULL user_id';
    END IF;
END $$;

-- Step 4: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_workers_user_id ON workers(user_id);
CREATE INDEX IF NOT EXISTS idx_workers_user_email ON workers(user_id, email);
CREATE INDEX IF NOT EXISTS idx_workers_user_created ON workers(user_id, created_at);

-- Step 5: Update unique constraints to include user_id
-- Drop existing email unique constraint if it exists
DO $$
BEGIN
    -- Check if the old unique constraint exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'workers' 
        AND constraint_name = 'workers_email_key'
        AND constraint_type = 'UNIQUE'
    ) THEN
        ALTER TABLE workers DROP CONSTRAINT workers_email_key;
        RAISE NOTICE 'Dropped old email unique constraint';
    END IF;
    
    -- Add new unique constraint for email per user
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'workers' 
        AND constraint_name = 'workers_email_user_id_key'
        AND constraint_type = 'UNIQUE'
    ) THEN
        ALTER TABLE workers ADD CONSTRAINT workers_email_user_id_key UNIQUE(email, user_id);
        RAISE NOTICE 'Added unique constraint for email per user';
    END IF;
END $$;

-- Step 6: Update worker_permissions table to ensure data isolation
-- Check if worker_permissions table exists and needs updates
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'worker_permissions') THEN
        -- Add index for better performance on permission queries
        CREATE INDEX IF NOT EXISTS idx_worker_permissions_worker_id ON worker_permissions(worker_id);
        
        -- Add foreign key constraint if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE table_name = 'worker_permissions' 
            AND constraint_name = 'worker_permissions_worker_id_fkey'
            AND constraint_type = 'FOREIGN KEY'
        ) THEN
            ALTER TABLE worker_permissions 
            ADD CONSTRAINT worker_permissions_worker_id_fkey 
            FOREIGN KEY (worker_id) REFERENCES workers(worker_id) ON DELETE CASCADE;
            
            RAISE NOTICE 'Added foreign key constraint for worker_permissions';
        END IF;
        
        RAISE NOTICE 'Updated worker_permissions table constraints';
    ELSE
        RAISE NOTICE 'worker_permissions table does not exist, skipping related updates';
    END IF;
END $$;

-- Step 7: Add comments for documentation
COMMENT ON COLUMN workers.user_id IS 'Reference to user who owns this worker - ensures data isolation';

-- Step 8: Create helper function for worker data validation
CREATE OR REPLACE FUNCTION validate_worker_user_access(target_worker_id UUID, requesting_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if the requesting user owns the worker
    RETURN EXISTS (
        SELECT 1 FROM workers 
        WHERE worker_id = target_worker_id 
        AND user_id = requesting_user_id
    );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION validate_worker_user_access(UUID, UUID) IS 'Helper function to validate if a user has access to a specific worker';

-- Step 9: Remove old RLS policies if they exist (we use application-level data isolation)
DROP POLICY IF EXISTS workers_select_own ON workers;
DROP POLICY IF EXISTS workers_insert_own ON workers;
DROP POLICY IF EXISTS workers_update_own ON workers;
DROP POLICY IF EXISTS workers_delete_own ON workers;

-- Disable RLS as we handle data isolation at application level
ALTER TABLE workers DISABLE ROW LEVEL SECURITY;

-- Step 10: Verify data integrity
DO $$
DECLARE
    orphaned_workers INTEGER;
    total_workers INTEGER;
    users_count INTEGER;
BEGIN
    -- Check for workers without valid user_id
    SELECT COUNT(*) INTO orphaned_workers
    FROM workers w
    LEFT JOIN users u ON w.user_id = u.user_id
    WHERE u.user_id IS NULL;
    
    -- Get total counts
    SELECT COUNT(*) INTO total_workers FROM workers;
    SELECT COUNT(*) INTO users_count FROM users;
    
    IF orphaned_workers > 0 THEN
        RAISE WARNING 'Found % orphaned workers without valid user_id', orphaned_workers;
    END IF;
    
    RAISE NOTICE 'Data integrity check completed. Workers: %, Users: %, Orphaned: %', 
        total_workers, users_count, orphaned_workers;
        
    -- Check email uniqueness per user
    IF EXISTS (
        SELECT email, user_id, COUNT(*) 
        FROM workers 
        GROUP BY email, user_id 
        HAVING COUNT(*) > 1
    ) THEN
        RAISE WARNING 'Found duplicate email addresses within the same user account';
    ELSE
        RAISE NOTICE 'Email uniqueness per user verified successfully';
    END IF;
END $$;

-- Step 11: Create trigger to automatically validate user access on updates
CREATE OR REPLACE FUNCTION check_worker_user_consistency()
RETURNS TRIGGER AS $$
BEGIN
    -- Prevent changing user_id to a different user (security measure)
    IF TG_OP = 'UPDATE' AND OLD.user_id != NEW.user_id THEN
        RAISE EXCEPTION 'Cannot transfer worker to different user. user_id cannot be changed.';
    END IF;
    
    -- Ensure user_id is always set on insert
    IF TG_OP = 'INSERT' AND NEW.user_id IS NULL THEN
        RAISE EXCEPTION 'user_id cannot be NULL when creating a worker';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_check_worker_user_consistency ON workers;
CREATE TRIGGER trigger_check_worker_user_consistency
    BEFORE INSERT OR UPDATE ON workers
    FOR EACH ROW
    EXECUTE FUNCTION check_worker_user_consistency();

COMMENT ON TRIGGER trigger_check_worker_user_consistency ON workers IS 'Ensures data integrity and prevents unauthorized user_id changes';

-- Final success message
DO $$
BEGIN
    RAISE NOTICE '✅ Migration completed successfully: Added user_id to workers table with complete data isolation';
    RAISE NOTICE '📊 Summary:';
    RAISE NOTICE '   - Added user_id column with foreign key constraint';
    RAISE NOTICE '   - Updated existing workers with default user_id';
    RAISE NOTICE '   - Created performance indexes';
    RAISE NOTICE '   - Added unique constraint for email per user';
    RAISE NOTICE '   - Created data validation triggers';
    RAISE NOTICE '   - Disabled RLS in favor of application-level isolation';
END $$;
