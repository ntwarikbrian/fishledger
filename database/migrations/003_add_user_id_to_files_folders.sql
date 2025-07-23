-- =====================================================
-- Migration: Add user_id columns to files and folders tables for data isolation
-- This migration ensures complete data isolation for document management
-- =====================================================

-- Step 1: Add user_id column to folders table (if not already present)
-- Note: folders table already has created_by which serves as user_id, but we'll add user_id for consistency
DO $$
BEGIN
    -- Check if user_id column exists in folders table
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'folders' AND column_name = 'user_id'
    ) THEN
        -- Add user_id column to folders table
        ALTER TABLE folders ADD COLUMN user_id UUID REFERENCES users(user_id) ON DELETE CASCADE;
        
        -- Update existing records to set user_id = created_by
        UPDATE folders SET user_id = created_by WHERE user_id IS NULL;
        
        -- Make user_id NOT NULL after updating existing records
        ALTER TABLE folders ALTER COLUMN user_id SET NOT NULL;
        
        -- Add index for performance
        CREATE INDEX IF NOT EXISTS idx_folders_user_id ON folders(user_id);
        
        -- Update unique constraint to include user_id instead of created_by
        ALTER TABLE folders DROP CONSTRAINT IF EXISTS folders_folder_name_created_by_key;
        ALTER TABLE folders ADD CONSTRAINT folders_folder_name_user_id_key UNIQUE(folder_name, user_id);
        
        RAISE NOTICE 'Added user_id column to folders table';
    ELSE
        RAISE NOTICE 'user_id column already exists in folders table';
    END IF;
END $$;

-- Step 2: Add user_id column to files table
DO $$
BEGIN
    -- Check if user_id column exists in files table
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'files' AND column_name = 'user_id'
    ) THEN
        -- Add user_id column to files table
        ALTER TABLE files ADD COLUMN user_id UUID REFERENCES users(user_id) ON DELETE CASCADE;
        
        -- Update existing records to set user_id based on folder's user_id
        UPDATE files 
        SET user_id = folders.user_id 
        FROM folders 
        WHERE files.folder_id = folders.folder_id AND files.user_id IS NULL;
        
        -- Make user_id NOT NULL after updating existing records
        ALTER TABLE files ALTER COLUMN user_id SET NOT NULL;
        
        -- Add index for performance
        CREATE INDEX IF NOT EXISTS idx_files_user_id ON files(user_id);
        
        -- Add composite index for user-specific file queries
        CREATE INDEX IF NOT EXISTS idx_files_user_folder ON files(user_id, folder_id);
        
        RAISE NOTICE 'Added user_id column to files table';
    ELSE
        RAISE NOTICE 'user_id column already exists in files table';
    END IF;
END $$;

-- Step 3: Update folder statistics function to respect data isolation
CREATE OR REPLACE FUNCTION update_folder_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Handle INSERT
    IF TG_OP = 'INSERT' THEN
        UPDATE folders 
        SET 
            file_count = file_count + 1,
            total_size = total_size + COALESCE(NEW.file_size, 0)
        WHERE folder_id = NEW.folder_id AND user_id = NEW.user_id;
        RETURN NEW;
    END IF;
    
    -- Handle UPDATE
    IF TG_OP = 'UPDATE' THEN
        -- If folder changed, update both old and new folders
        IF OLD.folder_id != NEW.folder_id THEN
            -- Decrease count in old folder
            UPDATE folders 
            SET 
                file_count = file_count - 1,
                total_size = total_size - COALESCE(OLD.file_size, 0)
            WHERE folder_id = OLD.folder_id AND user_id = OLD.user_id;
            
            -- Increase count in new folder
            UPDATE folders 
            SET 
                file_count = file_count + 1,
                total_size = total_size + COALESCE(NEW.file_size, 0)
            WHERE folder_id = NEW.folder_id AND user_id = NEW.user_id;
        ELSE
            -- Same folder, just update size difference
            UPDATE folders 
            SET total_size = total_size - COALESCE(OLD.file_size, 0) + COALESCE(NEW.file_size, 0)
            WHERE folder_id = NEW.folder_id AND user_id = NEW.user_id;
        END IF;
        RETURN NEW;
    END IF;
    
    -- Handle DELETE
    IF TG_OP = 'DELETE' THEN
        UPDATE folders 
        SET 
            file_count = file_count - 1,
            total_size = total_size - COALESCE(OLD.file_size, 0)
        WHERE folder_id = OLD.folder_id AND user_id = OLD.user_id;
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Update the permanent folders creation function
-- First drop the existing function to avoid parameter name conflicts
DROP FUNCTION IF EXISTS create_permanent_folders(UUID);

-- Recreate the function with updated logic for data isolation
CREATE OR REPLACE FUNCTION create_permanent_folders(target_user_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Create Workers ID Image folder (permanent system folder)
    INSERT INTO folders (folder_name, description, color, icon, created_by, user_id, is_permanent)
    VALUES (
        'Workers ID Image',
        'Store worker identification images and documents for employee verification',
        '#8B5CF6', -- Purple color
        'id-card', -- ID card icon
        target_user_id,
        target_user_id,
        true -- Mark as permanent folder
    )
    ON CONFLICT (folder_name, user_id) DO NOTHING; -- Prevent duplicates
END;
$$ LANGUAGE plpgsql;

-- Step 5: Add comments for documentation
COMMENT ON COLUMN folders.user_id IS 'Reference to user who owns this folder - ensures data isolation';
COMMENT ON COLUMN files.user_id IS 'Reference to user who owns this file - ensures data isolation';

-- Step 6: Remove old RLS policies if they exist (we use application-level data isolation)
DROP POLICY IF EXISTS files_select_all ON files;
DROP POLICY IF EXISTS files_insert_owner ON files;
DROP POLICY IF EXISTS files_update_owner ON files;
DROP POLICY IF EXISTS files_delete_owner ON files;

-- Disable RLS as we handle data isolation at application level
ALTER TABLE files DISABLE ROW LEVEL SECURITY;
ALTER TABLE folders DISABLE ROW LEVEL SECURITY;

-- Step 7: Verify data integrity
DO $$
DECLARE
    orphaned_files INTEGER;
    orphaned_folders INTEGER;
BEGIN
    -- Check for files without valid user_id
    SELECT COUNT(*) INTO orphaned_files
    FROM files f
    LEFT JOIN users u ON f.user_id = u.user_id
    WHERE u.user_id IS NULL;
    
    -- Check for folders without valid user_id  
    SELECT COUNT(*) INTO orphaned_folders
    FROM folders fo
    LEFT JOIN users u ON fo.user_id = u.user_id
    WHERE u.user_id IS NULL;
    
    IF orphaned_files > 0 THEN
        RAISE WARNING 'Found % orphaned files without valid user_id', orphaned_files;
    END IF;
    
    IF orphaned_folders > 0 THEN
        RAISE WARNING 'Found % orphaned folders without valid user_id', orphaned_folders;
    END IF;
    
    RAISE NOTICE 'Data integrity check completed. Files: %, Folders: %', 
        (SELECT COUNT(*) FROM files), 
        (SELECT COUNT(*) FROM folders);
END $$;
