-- ============================================================================
-- Migration: Create Placeholder Product for Product Creation Requests
-- Version: 003
-- Description: Creates a special placeholder product to satisfy foreign key 
--              constraints for product_create movements without making product_id nullable
-- Date: 2024-01-19
-- ============================================================================

-- Start transaction to ensure atomicity
BEGIN;

-- ============================================================================
-- 1. VALIDATE PREREQUISITES
-- ============================================================================

-- Check if products table exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'products' 
        AND table_schema = 'public'
    ) THEN
        RAISE EXCEPTION 'products table does not exist. Cannot proceed with migration.';
    END IF;
    RAISE NOTICE '✅ products table exists';
END $$;

-- Check if product_categories table exists and get a default category
DO $$
DECLARE
    default_category_id UUID;
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'product_categories' 
        AND table_schema = 'public'
    ) THEN
        RAISE EXCEPTION 'product_categories table does not exist. Cannot proceed with migration.';
    END IF;
    
    -- Check if we have at least one category
    SELECT category_id INTO default_category_id 
    FROM product_categories 
    LIMIT 1;
    
    IF default_category_id IS NULL THEN
        RAISE EXCEPTION 'No categories found in product_categories table. Please create at least one category first.';
    END IF;
    
    RAISE NOTICE '✅ product_categories table exists with categories';
END $$;

-- ============================================================================
-- 2. CREATE PLACEHOLDER PRODUCT
-- ============================================================================

-- Create a special placeholder product for product creation requests
DO $$
DECLARE
    default_category_id UUID;
    placeholder_exists BOOLEAN := FALSE;
BEGIN
    -- Check if placeholder already exists
    SELECT EXISTS(
        SELECT 1 FROM products 
        WHERE product_id = '00000000-0000-0000-0000-000000000000'
    ) INTO placeholder_exists;
    
    IF placeholder_exists THEN
        RAISE NOTICE '⚠️  Placeholder product already exists, skipping creation';
    ELSE
        -- Get the first available category
        SELECT category_id INTO default_category_id 
        FROM product_categories 
        ORDER BY created_at ASC 
        LIMIT 1;
        
        -- Insert the placeholder product
        INSERT INTO products (
            product_id,
            name,
            category_id,
            quantity_box,
            box_to_kg_ratio,
            quantity_kg,
            cost_per_box,
            cost_per_kg,
            price_per_box,
            price_per_kg,
            boxed_low_stock_threshold,
            created_at,
            updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            '[PLACEHOLDER] Product Creation Request',
            default_category_id,
            0,
            1,
            0,
            0,
            0,
            0,
            0,
            0,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        );
        
        RAISE NOTICE '✅ Created placeholder product for product creation requests';
    END IF;
END $$;

-- ============================================================================
-- 3. ADD CONSTRAINTS TO PROTECT PLACEHOLDER
-- ============================================================================

-- Create a function to prevent deletion of the placeholder product
CREATE OR REPLACE FUNCTION prevent_placeholder_product_deletion()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.product_id = '00000000-0000-0000-0000-000000000000' THEN
        RAISE EXCEPTION 'Cannot delete placeholder product used for product creation workflow';
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to prevent deletion
DROP TRIGGER IF EXISTS prevent_placeholder_deletion ON products;
CREATE TRIGGER prevent_placeholder_deletion
    BEFORE DELETE ON products
    FOR EACH ROW
    EXECUTE FUNCTION prevent_placeholder_product_deletion();

-- ============================================================================
-- 4. CREATE HELPER FUNCTION
-- ============================================================================

-- Function to get the placeholder product ID (for consistency)
CREATE OR REPLACE FUNCTION get_product_creation_placeholder_id()
RETURNS UUID AS $$
BEGIN
    RETURN '00000000-0000-0000-0000-000000000000'::UUID;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_product_creation_placeholder_id() TO authenticated;

-- ============================================================================
-- 5. VERIFY THE SOLUTION
-- ============================================================================

-- Test that we can now create product_create movements
DO $$
DECLARE
    test_user_id UUID;
    test_movement_id UUID;
BEGIN
    -- Get a test user (or use a placeholder)
    SELECT user_id INTO test_user_id FROM users LIMIT 1;
    
    IF test_user_id IS NULL THEN
        -- Use a placeholder user ID for testing
        test_user_id := '11111111-1111-1111-1111-111111111111';
        RAISE NOTICE '⚠️  No users found, using placeholder user ID for test';
    END IF;
    
    -- Try to insert a test product_create movement
    INSERT INTO stock_movements (
        product_id,
        movement_type,
        box_change,
        kg_change,
        field_changed,
        old_value,
        new_value,
        reason,
        performed_by,
        status
    ) VALUES (
        get_product_creation_placeholder_id(),
        'product_create',
        0,
        0,
        'product_creation',
        '',
        '{"name": "Test Product", "description": "Test"}',
        'Test product creation request',
        test_user_id,
        'pending'
    ) RETURNING movement_id INTO test_movement_id;
    
    -- Clean up the test record
    DELETE FROM stock_movements WHERE movement_id = test_movement_id;
    
    RAISE NOTICE '✅ Product creation movements can now be created successfully';
    
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION '❌ Test failed: %', SQLERRM;
END $$;

-- ============================================================================
-- 6. UPDATE COMMENTS AND DOCUMENTATION
-- ============================================================================

-- Add comment to placeholder product
COMMENT ON TABLE products IS 'Products table. Contains a special placeholder product (ID: 00000000-0000-0000-0000-000000000000) for product creation workflow.';

-- Add function comments
COMMENT ON FUNCTION prevent_placeholder_product_deletion() IS 'Prevents deletion of the placeholder product used for product creation workflow';
COMMENT ON FUNCTION get_product_creation_placeholder_id() IS 'Returns the UUID of the placeholder product used for product creation requests';

-- ============================================================================
-- 7. RECORD MIGRATION
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
    '003_create_placeholder_product_for_creation_requests',
    'Creates a special placeholder product to satisfy foreign key constraints for product_create movements'
);

-- ============================================================================
-- 8. FINAL SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 Migration 003 completed successfully!';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Changes applied:';
    RAISE NOTICE '   ✅ Created placeholder product (ID: 00000000-0000-0000-0000-000000000000)';
    RAISE NOTICE '   ✅ Added protection against placeholder deletion';
    RAISE NOTICE '   ✅ Created helper function get_product_creation_placeholder_id()';
    RAISE NOTICE '   ✅ Product creation workflow now works without foreign key errors';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Product creation approval workflow is now fully functional!';
    RAISE NOTICE '';
END $$;

-- Commit the transaction
COMMIT;

-- ============================================================================
-- ROLLBACK SCRIPT (for reference)
-- ============================================================================
/*
-- To rollback this migration, run:

BEGIN;

-- Drop triggers and functions
DROP TRIGGER IF EXISTS prevent_placeholder_deletion ON products;
DROP FUNCTION IF EXISTS prevent_placeholder_product_deletion();
DROP FUNCTION IF EXISTS get_product_creation_placeholder_id();

-- Delete placeholder product
DELETE FROM products WHERE product_id = '00000000-0000-0000-0000-000000000000';

-- Remove migration record
DELETE FROM migration_history WHERE migration_name = '003_create_placeholder_product_for_creation_requests';

COMMIT;
*/
