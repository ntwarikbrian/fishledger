-- =====================================================
-- Rollback Migration: Remove Permanent Folders Support
-- Version: 001_rollback
-- Date: 2025-01-16
-- Description: Removes is_permanent column and related changes from folders table
-- =====================================================

-- Start transaction
BEGIN;

-- Drop functions created in the migration
DROP FUNCTION IF EXISTS create_permanent_folders(UUID);
DROP FUNCTION IF EXISTS migrate_existing_workers_folders();

-- Drop index for is_permanent column
DROP INDEX IF EXISTS idx_folders_permanent;

-- Remove unique constraint (if it was added by migration)
DO $$
BEGIN
    -- Check if constraint exists and drop it
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'folders_folder_name_created_by_key' 
        AND table_name = 'folders'
    ) THEN
        ALTER TABLE folders DROP CONSTRAINT folders_folder_name_created_by_key;
        RAISE NOTICE 'Dropped unique constraint: folders_folder_name_created_by_key';
    END IF;
END $$;

-- Remove is_permanent column from folders table
ALTER TABLE folders DROP COLUMN IF EXISTS is_permanent;

-- Commit transaction
COMMIT;

-- =====================================================
-- Rollback Complete
-- =====================================================

-- Verify rollback
DO $$
DECLARE
    column_exists BOOLEAN;
    index_exists BOOLEAN;
    constraint_exists BOOLEAN;
    function_exists BOOLEAN;
BEGIN
    -- Check if is_permanent column still exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'folders' 
        AND column_name = 'is_permanent'
    ) INTO column_exists;
    
    -- Check if index still exists
    SELECT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'folders' 
        AND indexname = 'idx_folders_permanent'
    ) INTO index_exists;
    
    -- Check if unique constraint still exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'folders_folder_name_created_by_key' 
        AND table_name = 'folders'
    ) INTO constraint_exists;
    
    -- Check if function still exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_name = 'create_permanent_folders'
    ) INTO function_exists;
    
    -- Report results
    RAISE NOTICE 'Rollback verification:';
    RAISE NOTICE '- is_permanent column: %', CASE WHEN column_exists THEN 'STILL EXISTS' ELSE 'REMOVED' END;
    RAISE NOTICE '- idx_folders_permanent index: %', CASE WHEN index_exists THEN 'STILL EXISTS' ELSE 'REMOVED' END;
    RAISE NOTICE '- unique constraint: %', CASE WHEN constraint_exists THEN 'STILL EXISTS' ELSE 'REMOVED' END;
    RAISE NOTICE '- create_permanent_folders function: %', CASE WHEN function_exists THEN 'STILL EXISTS' ELSE 'REMOVED' END;
    
    IF column_exists OR index_exists OR function_exists THEN
        RAISE WARNING 'Some migration artifacts still exist after rollback!';
    ELSE
        RAISE NOTICE 'Rollback completed successfully!';
    END IF;
END $$;

-- =====================================================
-- IMPORTANT NOTES
-- =====================================================
-- 
-- This rollback will:
-- 1. Remove the is_permanent column from folders table
-- 2. Drop the idx_folders_permanent index
-- 3. Remove the unique constraint on (folder_name, created_by)
-- 4. Drop the create_permanent_folders function
-- 
-- WARNING: This will permanently delete the is_permanent data!
-- Make sure to backup your database before running this rollback.
-- 
-- Any folders marked as permanent will lose that status and
-- become regular folders that can be deleted.
-- =====================================================
