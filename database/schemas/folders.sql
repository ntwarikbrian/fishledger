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
    created_by UUID NOT NULL REFERENCES users(user_id)
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
COMMENT ON COLUMN folders.created_by IS 'User who created this folder';

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_folders_name ON folders(folder_name);
CREATE INDEX IF NOT EXISTS idx_folders_created_by ON folders(created_by);

-- Row Level Security (RLS) policies
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;

-- Policy: Business owners can view all folders
CREATE POLICY folders_select_all ON folders
    FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- Policy: Business owners can insert folders
CREATE POLICY folders_insert_owner ON folders
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Policy: Business owners can update folders
CREATE POLICY folders_update_owner ON folders
    FOR UPDATE
    USING (auth.uid() IS NOT NULL);

-- Policy: Business owners can delete folders
CREATE POLICY folders_delete_owner ON folders
    FOR DELETE
    USING (auth.uid() IS NOT NULL);

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

-- Sample data for development
-- Note: These will need actual user_id values from the users table
-- INSERT INTO folders (folder_name, description, color, icon, created_by) VALUES
-- ('Contracts', 'Customer contracts, supplier agreements, and legal documents', '#10B981', 'document-text', 'user-uuid-here'),
-- ('Receipts', 'Purchase receipts, expense receipts, and payment confirmations', '#F59E0B', 'receipt-tax', 'user-uuid-here'),
-- ('Licenses', 'Business licenses, permits, and certifications', '#8B5CF6', 'shield-check', 'user-uuid-here'),
-- ('Financial', 'Financial statements, tax documents, and accounting records', '#EF4444', 'currency-dollar', 'user-uuid-here');
