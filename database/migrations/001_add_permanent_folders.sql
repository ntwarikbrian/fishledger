-- =====================================================
-- Migration: Add Permanent Folders Support
-- Version: 001
-- Date: 2025-01-16
-- Description: Adds is_permanent column and constraints to folders table
-- =====================================================

-- Start transaction
BEGIN;

-- Add is_permanent column to folders table
ALTER TABLE folders 
ADD COLUMN IF NOT EXISTS is_permanent BOOLEAN DEFAULT false;

-- Add comment for the new column
COMMENT ON COLUMN folders.is_permanent IS 'Whether this is a permanent system folder that cannot be deleted';

-- Add unique constraint for folder names per user (if not exists)
DO $$
BEGIN
    -- Check if constraint already exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'folders_folder_name_created_by_key' 
        AND table_name = 'folders'
    ) THEN
        ALTER TABLE folders ADD CONSTRAINT folders_folder_name_created_by_key UNIQUE(folder_name, created_by);
    END IF;
END $$;

-- Create index for is_permanent column (if not exists)
CREATE INDEX IF NOT EXISTS idx_folders_permanent ON folders(is_permanent);

-- Create function to create permanent folders for users
CREATE OR REPLACE FUNCTION create_permanent_folders(user_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Create Workers ID Image folder (permanent system folder)
    INSERT INTO folders (folder_name, description, color, icon, created_by, is_permanent, file_count, total_size)
    VALUES (
        'Workers ID Image',
        'Store worker identification images and documents for employee verification',
        '#8B5CF6', -- Purple color
        'id-card', -- ID card icon
        user_id,
        true, -- Mark as permanent folder
        0, -- Initial file count
        0  -- Initial total size
    )
    ON CONFLICT (folder_name, created_by) DO NOTHING; -- Prevent duplicates
END;
$$ LANGUAGE plpgsql;

-- Create function to migrate existing folders (optional)
CREATE OR REPLACE FUNCTION migrate_existing_workers_folders()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER := 0;
BEGIN
    -- Update any existing "Workers ID Image" folders to be permanent
    UPDATE folders 
    SET is_permanent = true 
    WHERE folder_name = 'Workers ID Image' 
    AND is_permanent = false;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- Run the migration for existing folders
SELECT migrate_existing_workers_folders() as updated_folders_count;

-- Create permanent folders for all existing users (optional - uncomment if needed)
-- INSERT INTO folders (folder_name, description, color, icon, created_by, is_permanent, file_count, total_size)
-- SELECT 
--     'Workers ID Image',
--     'Store worker identification images and documents for employee verification',
--     '#8B5CF6',
--     'id-card',
--     user_id,
--     true,
--     0,
--     0
-- FROM users
-- ON CONFLICT (folder_name, created_by) DO NOTHING;

-- Commit transaction
COMMIT;

-- =====================================================
-- Migration Complete
-- =====================================================

-- Verify migration
DO $$
DECLARE
    column_exists BOOLEAN;
    index_exists BOOLEAN;
    constraint_exists BOOLEAN;
BEGIN
    -- Check if is_permanent column exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'folders' 
        AND column_name = 'is_permanent'
    ) INTO column_exists;
    
    -- Check if index exists
    SELECT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'folders' 
        AND indexname = 'idx_folders_permanent'
    ) INTO index_exists;
    
    -- Check if unique constraint exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'folders_folder_name_created_by_key' 
        AND table_name = 'folders'
    ) INTO constraint_exists;
    
    -- Report results
    RAISE NOTICE 'Migration verification:';
    RAISE NOTICE '- is_permanent column: %', CASE WHEN column_exists THEN 'EXISTS' ELSE 'MISSING' END;
    RAISE NOTICE '- idx_folders_permanent index: %', CASE WHEN index_exists THEN 'EXISTS' ELSE 'MISSING' END;
    RAISE NOTICE '- unique constraint: %', CASE WHEN constraint_exists THEN 'EXISTS' ELSE 'MISSING' END;
    
    IF NOT (column_exists AND index_exists AND constraint_exists) THEN
        RAISE EXCEPTION 'Migration verification failed!';
    END IF;
    
    RAISE NOTICE 'Migration completed successfully!';
END $$;
