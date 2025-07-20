-- ============================================================================
-- Migration: Remove Placeholder Product Protection
-- Version: 004
-- Description: Removes the protection trigger that prevents deletion of the placeholder product
-- Date: 2024-01-19
-- ============================================================================

-- Start transaction to ensure atomicity
BEGIN;

-- ============================================================================
-- 1. REMOVE PROTECTION TRIGGER AND FUNCTION
-- ============================================================================

-- Drop the trigger that prevents deletion
DROP TRIGGER IF EXISTS prevent_placeholder_deletion ON products;

-- Drop the protection function
DROP FUNCTION IF EXISTS prevent_placeholder_product_deletion();

RAISE NOTICE '✅ Removed placeholder product protection - it can now be deleted';

-- ============================================================================
-- 2. UPDATE COMMENTS
-- ============================================================================

-- Update table comment to reflect that placeholder can be deleted
COMMENT ON TABLE products IS 'Products table. May contain a placeholder product (ID: 00000000-0000-0000-0000-000000000000) for product creation workflow, but it can be deleted if needed.';

-- ============================================================================
-- 3. RECORD MIGRATION
-- ============================================================================

-- Create migration tracking table if it doesn't exist
CREATE TABLE IF NOT EXISTS migration_history (
    migration_id SERIAL PRIMARY KEY,
    migration_name VARCHAR(255) NOT NULL UNIQUE,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    description TEXT
);

-- Record this migration
INSERT INTO migration_history (migration_name, description)
VALUES (
    '004_remove_placeholder_protection',
    'Removes the protection trigger that prevents deletion of the placeholder product'
);

-- ============================================================================
-- 4. SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 Migration 004 completed successfully!';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Changes applied:';
    RAISE NOTICE '   ✅ Removed placeholder product deletion protection';
    RAISE NOTICE '   ✅ Placeholder product can now be deleted normally';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  Note: If you delete the placeholder product, product creation';
    RAISE NOTICE '   requests will fail until you recreate it or run migration 003 again.';
    RAISE NOTICE '';
END $$;

-- Commit the transaction
COMMIT;
