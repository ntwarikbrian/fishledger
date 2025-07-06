-- =====================================================
-- Worker Permissions Table Schema
-- Defines permissions directly assigned to workers
-- =====================================================

-- Worker permissions table for direct permission assignment to workers
CREATE TABLE IF NOT EXISTS worker_permissions (
    worker_permission_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    worker_id UUID NOT NULL REFERENCES workers(worker_id) ON DELETE CASCADE,
    permission_name VARCHAR(100) NOT NULL,
    permission_category VARCHAR(50) NOT NULL, -- e.g., 'sales', 'inventory', 'customers', 'reports'
    is_granted BOOLEAN DEFAULT false,
    granted_by UUID NOT NULL REFERENCES users(user_id),
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(worker_id, permission_name)
);

-- Comments for documentation
COMMENT ON TABLE worker_permissions IS 'Defines permissions directly assigned to workers';
COMMENT ON COLUMN worker_permissions.worker_permission_id IS 'Unique identifier for each worker permission';
COMMENT ON COLUMN worker_permissions.worker_id IS 'Reference to the worker';
COMMENT ON COLUMN worker_permissions.permission_name IS 'Name of the permission (e.g., view_sales, create_sales)';
COMMENT ON COLUMN worker_permissions.permission_category IS 'Category of the permission (sales, inventory, customers, etc.)';
COMMENT ON COLUMN worker_permissions.is_granted IS 'Whether this permission is granted to the worker';
COMMENT ON COLUMN worker_permissions.granted_by IS 'User who granted this permission';
COMMENT ON COLUMN worker_permissions.granted_at IS 'Timestamp when permission was granted';
COMMENT ON COLUMN worker_permissions.updated_at IS 'Timestamp when permission was last updated';

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_worker_permissions_worker ON worker_permissions(worker_id);
CREATE INDEX IF NOT EXISTS idx_worker_permissions_name ON worker_permissions(permission_name);
CREATE INDEX IF NOT EXISTS idx_worker_permissions_category ON worker_permissions(permission_category);
CREATE INDEX IF NOT EXISTS idx_worker_permissions_granted ON worker_permissions(is_granted);

-- Row Level Security (RLS) policies
ALTER TABLE worker_permissions ENABLE ROW LEVEL SECURITY;

-- Policy: Business owners can view all worker permissions
CREATE POLICY worker_permissions_select_all ON worker_permissions
    FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- Policy: Business owners can insert worker permissions
CREATE POLICY worker_permissions_insert_owner ON worker_permissions
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Policy: Business owners can update worker permissions
CREATE POLICY worker_permissions_update_owner ON worker_permissions
    FOR UPDATE
    USING (auth.uid() IS NOT NULL);

-- Policy: Business owners can delete worker permissions
CREATE POLICY worker_permissions_delete_owner ON worker_permissions
    FOR DELETE
    USING (auth.uid() IS NOT NULL);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_worker_permissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at timestamp
CREATE TRIGGER update_worker_permissions_updated_at_trigger
    BEFORE UPDATE ON worker_permissions
    FOR EACH ROW
    EXECUTE FUNCTION update_worker_permissions_updated_at();

-- Sample data for development (worker permissions)
-- Note: These will need actual worker_id and user_id values from their respective tables
-- INSERT INTO worker_permissions (worker_id, permission_name, permission_category, is_granted, granted_by) VALUES
-- ('worker-uuid-here', 'view_sales', 'sales', true, 'user-uuid-here'),
-- ('worker-uuid-here', 'create_sales', 'sales', true, 'user-uuid-here'),
-- ('worker-uuid-here', 'view_inventory', 'inventory', true, 'user-uuid-here'),
-- ('worker-uuid-here', 'view_customers', 'customers', true, 'user-uuid-here'),
-- ('worker-uuid-here', 'add_customers', 'customers', true, 'user-uuid-here');
