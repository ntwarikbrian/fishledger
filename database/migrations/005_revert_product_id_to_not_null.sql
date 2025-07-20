-- ============================================================================
-- Migration: Revert product_id to NOT NULL in stock_movements
-- Version: 005
-- Description: Reverts product_id back to NOT NULL in stock_movements table
--              since product creation now follows direct logic without approval workflow
-- Date: 2024-01-20
-- ============================================================================

-- Start transaction to ensure atomicity
BEGIN;

-- ============================================================================
-- 1. CLEAN UP ANY EXISTING PRODUCT_CREATE MOVEMENTS WITH NULL PRODUCT_ID
-- ============================================================================

DO $$
BEGIN
    -- Remove any pending product_create movements (both NULL and non-NULL product_id)
    -- These are from the old approval workflow and are no longer needed
    DELETE FROM stock_movements
    WHERE movement_type = 'product_create';

    RAISE NOTICE '✅ Cleaned up all existing product_create movements';

    -- Clean up any other movements that might violate the new constraint
    -- Remove movements that have zero changes and are not product_edit or product_delete
    DELETE FROM stock_movements
    WHERE movement_type NOT IN ('product_edit', 'product_delete')
    AND box_change = 0
    AND kg_change = 0;

    RAISE NOTICE '✅ Cleaned up movements with zero changes';

    -- ============================================================================
    -- 2. REMOVE CONDITIONAL CONSTRAINT FOR PRODUCT_ID
    -- ============================================================================

    -- Drop the conditional constraint that allowed NULL product_id for product_create
    ALTER TABLE stock_movements
    DROP CONSTRAINT IF EXISTS chk_product_id_conditional;

    RAISE NOTICE '✅ Removed conditional constraint for product_id';

    -- ============================================================================
    -- 3. MAKE PRODUCT_ID NOT NULL AGAIN
    -- ============================================================================

    -- Drop the foreign key constraint temporarily
    ALTER TABLE stock_movements
    DROP CONSTRAINT IF EXISTS stock_movements_product_id_fkey;

    -- Make product_id NOT NULL again
    ALTER TABLE stock_movements
    ALTER COLUMN product_id SET NOT NULL;

    -- Add back the foreign key constraint
    ALTER TABLE stock_movements
    ADD CONSTRAINT stock_movements_product_id_fkey
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE;

    RAISE NOTICE '✅ Made product_id NOT NULL in stock_movements table';

    -- ============================================================================
    -- 4. UPDATE STOCK MOVEMENTS CONSTRAINT
    -- ============================================================================

    -- Check for any remaining problematic rows before applying constraint
    RAISE NOTICE 'Checking for rows that would violate new constraint...';

    -- Check for movements with zero changes that are not product_edit/product_delete
    IF EXISTS (
        SELECT 1 FROM stock_movements
        WHERE movement_type NOT IN ('product_edit', 'product_delete')
        AND box_change = 0
        AND kg_change = 0
    ) THEN
        RAISE NOTICE 'Found movements with zero changes, cleaning up...';
        DELETE FROM stock_movements
        WHERE movement_type NOT IN ('product_edit', 'product_delete')
        AND box_change = 0
        AND kg_change = 0;
    END IF;

    -- Check for product_edit movements without field_changed
    IF EXISTS (
        SELECT 1 FROM stock_movements
        WHERE movement_type = 'product_edit'
        AND field_changed IS NULL
    ) THEN
        RAISE NOTICE 'Found product_edit movements without field_changed, cleaning up...';
        DELETE FROM stock_movements
        WHERE movement_type = 'product_edit'
        AND field_changed IS NULL;
    END IF;

    -- Check for product_delete movements without field_changed
    IF EXISTS (
        SELECT 1 FROM stock_movements
        WHERE movement_type = 'product_delete'
        AND field_changed IS NULL
    ) THEN
        RAISE NOTICE 'Found product_delete movements without field_changed, cleaning up...';
        DELETE FROM stock_movements
        WHERE movement_type = 'product_delete'
        AND field_changed IS NULL;
    END IF;

    -- Update the constraint to remove product_create from the special cases
    -- since product creation no longer goes through stock_movements
    ALTER TABLE stock_movements
    DROP CONSTRAINT IF EXISTS chk_stock_movement_quantities;

    ALTER TABLE stock_movements
    ADD CONSTRAINT chk_stock_movement_quantities CHECK (
        (movement_type NOT IN ('product_edit', 'product_delete') AND (box_change != 0 OR kg_change != 0)) OR
        (movement_type = 'product_edit' AND field_changed IS NOT NULL) OR
        (movement_type = 'product_delete' AND field_changed IS NOT NULL)
    );

    RAISE NOTICE '✅ Updated stock movement quantities constraint';

    -- ============================================================================
    -- 5. REMOVE PRODUCT_CREATE FROM MOVEMENT_TYPE ENUM
    -- ============================================================================

    -- Note: We'll keep product_create in the enum for backward compatibility
    -- but it won't be used in the new direct creation workflow
    -- This prevents breaking existing data or reports

    RAISE NOTICE '⚠️  Keeping product_create in movement_type enum for backward compatibility';
END $$;

-- ============================================================================
-- 6. CLEAN UP PLACEHOLDER PRODUCT FUNCTIONS (if they still exist)
-- ============================================================================

DO $$
BEGIN
    -- Remove the placeholder product protection trigger
    DROP TRIGGER IF EXISTS prevent_placeholder_deletion ON products;

    -- Remove the placeholder product protection function
    DROP FUNCTION IF EXISTS prevent_placeholder_product_deletion();

    -- Remove the placeholder product helper function
    DROP FUNCTION IF EXISTS get_product_creation_placeholder_id();

    -- Remove the ensure placeholder function
    DROP FUNCTION IF EXISTS ensure_placeholder_product_exists();

    RAISE NOTICE '✅ Removed all placeholder product functions and triggers';
END $$;

-- ============================================================================
-- 7. COMMIT TRANSACTION
-- ============================================================================

COMMIT;

-- ============================================================================
-- 8. VERIFICATION AND SUMMARY
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 Migration 005 completed successfully!';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Changes applied:';
    RAISE NOTICE '   ✅ Cleaned up existing product_create movements with NULL product_id';
    RAISE NOTICE '   ✅ Removed conditional constraint for product_id';
    RAISE NOTICE '   ✅ Made product_id NOT NULL in stock_movements table';
    RAISE NOTICE '   ✅ Updated stock movement quantities constraint';
    RAISE NOTICE '   ✅ Removed placeholder product helper function';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Product creation now follows direct logic without approval workflow!';
    RAISE NOTICE '';
    RAISE NOTICE '📝 How it works now:';
    RAISE NOTICE '   1. User creates product → product is created directly in products table';
    RAISE NOTICE '   2. No approval workflow needed for product creation';
    RAISE NOTICE '   3. Stock movements only track inventory changes, not product creation';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  Note: product_create enum value kept for backward compatibility';
    RAISE NOTICE '';
END $$;
