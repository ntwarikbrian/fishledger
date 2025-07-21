-- =====================================================
-- Migration: 000_create_schema_migrations
-- Description: Create schema_migrations table to track database migrations
-- Author: System
-- Date: 2025-07-21
-- Version: 1.0.0
-- =====================================================

-- Create schema_migrations table if it doesn't exist
CREATE TABLE IF NOT EXISTS schema_migrations (
    id SERIAL PRIMARY KEY,
    version VARCHAR(50) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    applied_by VARCHAR(100) DEFAULT CURRENT_USER,
    checksum VARCHAR(64), -- For future integrity checking
    execution_time_ms INTEGER, -- Track how long migration took
    rollback_sql TEXT, -- Store rollback commands for future use
    
    -- Constraints
    CONSTRAINT chk_version_format CHECK (version ~ '^[0-9]{3}$'),
    CONSTRAINT chk_applied_at_not_future CHECK (applied_at <= CURRENT_TIMESTAMP)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_schema_migrations_version ON schema_migrations(version);
CREATE INDEX IF NOT EXISTS idx_schema_migrations_applied_at ON schema_migrations(applied_at);

-- Add comments for documentation
COMMENT ON TABLE schema_migrations IS 'Tracks database schema migrations and their application status';
COMMENT ON COLUMN schema_migrations.id IS 'Auto-incrementing primary key';
COMMENT ON COLUMN schema_migrations.version IS 'Migration version number (3-digit format: 001, 002, etc.)';
COMMENT ON COLUMN schema_migrations.description IS 'Human-readable description of what the migration does';
COMMENT ON COLUMN schema_migrations.applied_at IS 'Timestamp when the migration was applied';
COMMENT ON COLUMN schema_migrations.applied_by IS 'Database user who applied the migration';
COMMENT ON COLUMN schema_migrations.checksum IS 'Checksum of migration file for integrity verification';
COMMENT ON COLUMN schema_migrations.execution_time_ms IS 'Time taken to execute the migration in milliseconds';
COMMENT ON COLUMN schema_migrations.rollback_sql IS 'SQL commands to rollback this migration if needed';

-- Insert the initial migration record for this table creation
INSERT INTO schema_migrations (version, description, applied_at) 
VALUES ('000', 'Create schema_migrations table to track database migrations', NOW())
ON CONFLICT (version) DO NOTHING;

-- Grant permissions
GRANT SELECT ON schema_migrations TO authenticated;
GRANT INSERT, UPDATE ON schema_migrations TO authenticated; -- For migration scripts

-- Create a function to get the current migration version
CREATE OR REPLACE FUNCTION get_current_migration_version()
RETURNS VARCHAR(50) AS $$
BEGIN
    RETURN (
        SELECT version 
        FROM schema_migrations 
        ORDER BY version DESC 
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql;

-- Create a function to check if a migration has been applied
CREATE OR REPLACE FUNCTION is_migration_applied(migration_version VARCHAR(50))
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM schema_migrations 
        WHERE version = migration_version
    );
END;
$$ LANGUAGE plpgsql;

-- Create a view to show migration status
CREATE OR REPLACE VIEW migration_status AS
SELECT 
    version,
    description,
    applied_at,
    applied_by,
    execution_time_ms,
    CASE 
        WHEN execution_time_ms IS NOT NULL THEN 'COMPLETED'
        ELSE 'PENDING'
    END AS status
FROM schema_migrations
ORDER BY version;

COMMENT ON VIEW migration_status IS 'Shows the status of all database migrations';

-- Success message
SELECT 'Schema migrations table created successfully!' AS status;
