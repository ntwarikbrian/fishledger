-- =====================================================
-- Files Table Schema
-- Stores individual file entries linked to folders
-- =====================================================

-- Files table for individual file entries linked to folders with Cloudinary integration
CREATE TABLE IF NOT EXISTS files (
    file_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL, -- Primary file URL (Cloudinary or fallback)
    cloudinary_public_id VARCHAR(255), -- Cloudinary unique identifier
    cloudinary_url TEXT, -- Cloudinary HTTP URL
    cloudinary_secure_url TEXT, -- Cloudinary HTTPS URL
    file_type VARCHAR(100), -- MIME type (e.g., image/jpeg, application/pdf)
    cloudinary_resource_type VARCHAR(20) DEFAULT 'auto', -- Cloudinary resource type (image, video, raw, auto)
    description TEXT,
    folder_id UUID NOT NULL REFERENCES folders(folder_id),
    file_size INTEGER, -- File size in bytes
    upload_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    added_by UUID NOT NULL REFERENCES users(user_id)
);

-- Comments for documentation
COMMENT ON TABLE files IS 'Stores individual file entries linked to folders with Cloudinary integration';
COMMENT ON COLUMN files.file_id IS 'Unique identifier for each file';
COMMENT ON COLUMN files.file_name IS 'Original filename when uploaded';
COMMENT ON COLUMN files.file_url IS 'Primary file URL (Cloudinary secure URL or fallback)';
COMMENT ON COLUMN files.cloudinary_public_id IS 'Cloudinary unique public identifier for the file';
COMMENT ON COLUMN files.cloudinary_url IS 'Cloudinary HTTP URL for the file';
COMMENT ON COLUMN files.cloudinary_secure_url IS 'Cloudinary HTTPS URL for the file (preferred)';
COMMENT ON COLUMN files.file_type IS 'MIME type of the file (e.g., image/jpeg, application/pdf)';
COMMENT ON COLUMN files.cloudinary_resource_type IS 'Cloudinary resource type (image, video, raw, auto)';
COMMENT ON COLUMN files.description IS 'User-provided description of the file';
COMMENT ON COLUMN files.folder_id IS 'Reference to the folder containing this file';
COMMENT ON COLUMN files.file_size IS 'File size in bytes';
COMMENT ON COLUMN files.upload_date IS 'Timestamp when file was uploaded';
COMMENT ON COLUMN files.added_by IS 'User who uploaded the file';

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_files_folder ON files(folder_id);
CREATE INDEX IF NOT EXISTS idx_files_added_by ON files(added_by);
CREATE INDEX IF NOT EXISTS idx_files_filename ON files(file_name);
CREATE INDEX IF NOT EXISTS idx_files_upload_date ON files(upload_date);
CREATE INDEX IF NOT EXISTS idx_files_cloudinary_public_id ON files(cloudinary_public_id);
CREATE INDEX IF NOT EXISTS idx_files_file_type ON files(file_type);

-- Row Level Security (RLS) policies
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

-- Policy: Business owners can view all files
CREATE POLICY files_select_all ON files
    FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- Policy: Business owners can insert files
CREATE POLICY files_insert_owner ON files
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Policy: Business owners can update files
CREATE POLICY files_update_owner ON files
    FOR UPDATE
    USING (auth.uid() IS NOT NULL);

-- Policy: Business owners can delete files
CREATE POLICY files_delete_owner ON files
    FOR DELETE
    USING (auth.uid() IS NOT NULL);

-- Trigger to update folder statistics when files are added/removed/modified
CREATE TRIGGER update_folder_stats_trigger
    AFTER INSERT OR UPDATE OR DELETE ON files
    FOR EACH ROW
    EXECUTE FUNCTION update_folder_stats();

-- Function to validate file data with Cloudinary support
CREATE OR REPLACE FUNCTION validate_file_data()
RETURNS TRIGGER AS $$
BEGIN
    -- Ensure file name is not empty
    IF NEW.file_name IS NULL OR LENGTH(TRIM(NEW.file_name)) = 0 THEN
        RAISE EXCEPTION 'File name cannot be empty';
    END IF;

    -- Ensure file_url is not empty
    IF NEW.file_url IS NULL OR LENGTH(TRIM(NEW.file_url)) = 0 THEN
        RAISE EXCEPTION 'File URL cannot be empty';
    END IF;

    -- Ensure file size is not negative
    IF NEW.file_size IS NOT NULL AND NEW.file_size < 0 THEN
        RAISE EXCEPTION 'File size cannot be negative';
    END IF;

    -- Validate Cloudinary resource type if provided
    IF NEW.cloudinary_resource_type IS NOT NULL AND
       NEW.cloudinary_resource_type NOT IN ('image', 'video', 'raw', 'auto') THEN
        RAISE EXCEPTION 'Invalid Cloudinary resource type. Must be: image, video, raw, or auto';
    END IF;

    -- If Cloudinary public ID is provided, ensure secure URL is also provided
    IF NEW.cloudinary_public_id IS NOT NULL AND
       (NEW.cloudinary_secure_url IS NULL OR LENGTH(TRIM(NEW.cloudinary_secure_url)) = 0) THEN
        RAISE EXCEPTION 'Cloudinary secure URL is required when public ID is provided';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to validate file data
CREATE TRIGGER validate_file_data_trigger
    BEFORE INSERT OR UPDATE ON files
    FOR EACH ROW
    EXECUTE FUNCTION validate_file_data();

-- Sample data for development with Cloudinary integration
-- Note: These will need actual folder_id and user_id values from their respective tables
-- INSERT INTO files (file_name, file_url, cloudinary_public_id, cloudinary_secure_url, file_type, cloudinary_resource_type, description, folder_id, file_size, added_by) VALUES
-- ('business_license.pdf', 'https://res.cloudinary.com/dji23iymw/image/upload/v1234567890/documents/business_license_2024.pdf', 'documents/business_license_2024', 'https://res.cloudinary.com/dji23iymw/image/upload/v1234567890/documents/business_license_2024.pdf', 'application/pdf', 'raw', 'Business operating license for 2024', 'folder-uuid-here', 245760, 'user-uuid-here'),
-- ('supplier_contract.pdf', 'https://res.cloudinary.com/dji23iymw/image/upload/v1234567890/documents/supplier_contract_atlantic.pdf', 'documents/supplier_contract_atlantic', 'https://res.cloudinary.com/dji23iymw/image/upload/v1234567890/documents/supplier_contract_atlantic.pdf', 'application/pdf', 'raw', 'Contract with Atlantic Fish Co.', 'folder-uuid-here', 189440, 'user-uuid-here'),
-- ('receipt_001.jpg', 'https://res.cloudinary.com/dji23iymw/image/upload/v1234567890/receipts/receipt_001_jan2024.jpg', 'receipts/receipt_001_jan2024', 'https://res.cloudinary.com/dji23iymw/image/upload/v1234567890/receipts/receipt_001_jan2024.jpg', 'image/jpeg', 'image', 'Equipment purchase receipt', 'folder-uuid-here', 98304, 'user-uuid-here');
