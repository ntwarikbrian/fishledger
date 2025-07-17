-- =====================================================
-- Folders Table Schema
-- Organizes document storage
-- =====================================================

-- Folders table for organizing document storage
CREATE TABLE IF NOT EXISTS folders (
    folder_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    folder_name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3B82F6', -- Hex color code for folder display
    icon VARCHAR(50) DEFAULT 'folder', -- Icon name for folder display
    file_count INTEGER DEFAULT 0, -- Number of files in this folder
    total_size BIGINT DEFAULT 0, -- Total size of all files in bytes
    is_permanent BOOLEAN DEFAULT false, -- Whether this is a permanent system folder
    created_by UUID NOT NULL REFERENCES users(user_id),

    -- Ensure unique folder names per user
    UNIQUE(folder_name, created_by)
);

-- Comments for documentation
COMMENT ON TABLE folders IS 'Organizes document storage';
COMMENT ON COLUMN folders.folder_id IS 'Unique identifier for each folder';
COMMENT ON COLUMN folders.folder_name IS 'Folder name (e.g., Contracts, Receipts, Licenses)';
COMMENT ON COLUMN folders.description IS 'Description of what documents belong in this folder';
COMMENT ON COLUMN folders.color IS 'Hex color code for folder display in UI';
COMMENT ON COLUMN folders.icon IS 'Icon name for folder display in UI';
COMMENT ON COLUMN folders.file_count IS 'Number of files currently in this folder';
COMMENT ON COLUMN folders.total_size IS 'Total size of all files in this folder (bytes)';
COMMENT ON COLUMN folders.is_permanent IS 'Whether this is a permanent system folder that cannot be deleted';
COMMENT ON COLUMN folders.created_by IS 'User who created this folder';

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_folders_name ON folders(folder_name);
CREATE INDEX IF NOT EXISTS idx_folders_created_by ON folders(created_by);
CREATE INDEX IF NOT EXISTS idx_folders_permanent ON folders(is_permanent);

-- Note: RLS policies removed for simplified access control

-- Function to update folder statistics
CREATE OR REPLACE FUNCTION update_folder_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update file count and total size for the folder
    IF TG_OP = 'INSERT' THEN
        UPDATE folders 
        SET file_count = file_count + 1,
            total_size = total_size + COALESCE(NEW.file_size, 0)
        WHERE folder_id = NEW.folder_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE folders 
        SET file_count = file_count - 1,
            total_size = total_size - COALESCE(OLD.file_size, 0)
        WHERE folder_id = OLD.folder_id;
    ELSIF TG_OP = 'UPDATE' THEN
        -- If folder changed
        IF OLD.folder_id != NEW.folder_id THEN
            UPDATE folders 
            SET file_count = file_count - 1,
                total_size = total_size - COALESCE(OLD.file_size, 0)
            WHERE folder_id = OLD.folder_id;
            
            UPDATE folders 
            SET file_count = file_count + 1,
                total_size = total_size + COALESCE(NEW.file_size, 0)
            WHERE folder_id = NEW.folder_id;
        -- If file size changed
        ELSIF COALESCE(OLD.file_size, 0) != COALESCE(NEW.file_size, 0) THEN
            UPDATE folders 
            SET total_size = total_size - COALESCE(OLD.file_size, 0) + COALESCE(NEW.file_size, 0)
            WHERE folder_id = NEW.folder_id;
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create permanent system folders that should exist for all users
-- This function creates essential folders that every user needs
CREATE OR REPLACE FUNCTION create_permanent_folders(user_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Create Workers ID Image folder (permanent system folder)
    INSERT INTO folders (folder_name, description, color, icon, created_by, is_permanent)
    VALUES (
        'Workers ID Image',
        'Store worker identification images and documents for employee verification',
        '#8B5CF6', -- Purple color
        'id-card', -- ID card icon
        user_id,
        true -- Mark as permanent folder
    )
    ON CONFLICT (folder_name, created_by) DO NOTHING; -- Prevent duplicates
END;
$$ LANGUAGE plpgsql;

-- Sample data for development
-- Note: These will need actual user_id values from the users table
-- INSERT INTO folders (folder_name, description, color, icon, created_by) VALUES
-- ('Contracts', 'Customer contracts, supplier agreements, and legal documents', '#10B981', 'document-text', 'user-uuid-here'),
-- ('Receipts', 'Purchase receipts, expense receipts, and payment confirmations', '#F59E0B', 'receipt-tax', 'user-uuid-here'),
-- ('Licenses', 'Business licenses, permits, and certifications', '#8B5CF6', 'shield-check', 'user-uuid-here'),
-- ('Financial', 'Financial statements, tax documents, and accounting records', '#EF4444', 'currency-dollar', 'user-uuid-here');
