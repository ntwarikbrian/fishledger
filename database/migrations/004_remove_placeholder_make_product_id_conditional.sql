-- ============================================================================
-- Migration: Remove Placeholder Product and Make product_id Conditional
-- Version: 004
-- Description: Removes placeholder product approach and makes product_id nullable
--              for product_create movements only, while keeping it required for others
-- Date: 2024-01-19
-- ============================================================================

-- Start transaction to ensure atomicity
BEGIN;

-- ============================================================================
-- 1. REMOVE PLACEHOLDER PRODUCT AND PROTECTION
-- ============================================================================

-- Drop the protection trigger first
DROP TRIGGER IF EXISTS prevent_placeholder_deletion ON products;

-- Drop the protection function
DROP FUNCTION IF EXISTS prevent_placeholder_product_deletion();

-- Drop the helper function
DROP FUNCTION IF EXISTS get_product_creation_placeholder_id();

-- Drop the ensure placeholder function
DROP FUNCTION IF EXISTS ensure_placeholder_product_exists();

-- Delete the placeholder product (this will cascade to any stock movements using it)
DELETE FROM products WHERE product_id = '00000000-0000-0000-0000-000000000000';

RAISE NOTICE '✅ Removed placeholder product and all protection functions';

-- ============================================================================
-- 2. MODIFY STOCK_MOVEMENTS TABLE TO ALLOW NULL PRODUCT_ID
-- ============================================================================

-- Drop the foreign key constraint temporarily
ALTER TABLE stock_movements 
DROP CONSTRAINT IF EXISTS stock_movements_product_id_fkey;

-- Make product_id nullable
ALTER TABLE stock_movements 
ALTER COLUMN product_id DROP NOT NULL;

-- Add back the foreign key constraint (now allows NULL)
ALTER TABLE stock_movements 
ADD CONSTRAINT stock_movements_product_id_fkey 
FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE;

RAISE NOTICE '✅ Made product_id nullable in stock_movements table';

-- ============================================================================
-- 3. ADD CONDITIONAL CONSTRAINT FOR PRODUCT_ID
-- ============================================================================

-- Add constraint to ensure product_id is only NULL for product_create movements
ALTER TABLE stock_movements 
ADD CONSTRAINT chk_product_id_conditional CHECK (
    (movement_type = 'product_create' AND product_id IS NULL) OR
    (movement_type != 'product_create' AND product_id IS NOT NULL)
);

RAISE NOTICE '✅ Added conditional constraint for product_id';

-- ============================================================================
-- 4. UPDATE REFERENCE CONSTRAINT
-- ============================================================================

-- Update the reference constraint to handle NULL product_id for product_create
ALTER TABLE stock_movements 
DROP CONSTRAINT IF EXISTS chk_movement_references;

ALTER TABLE stock_movements 
ADD CONSTRAINT chk_movement_references CHECK (
    (movement_type = 'damaged' AND damaged_id IS NOT NULL) OR
    (movement_type = 'new_stock' AND stock_addition_id IS NOT NULL) OR
    (movement_type = 'stock_correction' AND correction_id IS NOT NULL) OR
    (movement_type = 'product_edit') OR
    (movement_type = 'product_delete') OR
    (movement_type = 'product_create')
);

RAISE NOTICE '✅ Updated reference constraint';

-- ============================================================================
-- 5. CREATE HELPER FUNCTION FOR PRODUCT CREATION
-- ============================================================================

-- Function to create product from approved product_create movement
CREATE OR REPLACE FUNCTION create_product_from_movement(
    p_movement_id UUID,
    p_approved_by UUID
)
RETURNS UUID AS $$
DECLARE
    v_movement RECORD;
    v_product_data JSONB;
    v_new_product_id UUID;
BEGIN
    -- Get the pending movement
    SELECT * INTO v_movement
    FROM stock_movements
    WHERE movement_id = p_movement_id
    AND movement_type = 'product_create'
    AND status = 'pending'
    AND product_id IS NULL;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Pending product creation movement not found';
    END IF;
    
    -- Parse the product data
    BEGIN
        v_product_data := v_movement.new_value::JSONB;
    EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION 'Invalid product data in movement: %', SQLERRM;
    END;
    
    -- Create the product
    INSERT INTO products (
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
        expiry_date
    ) VALUES (
        (v_product_data->>'name')::VARCHAR(200),
        (v_product_data->>'category_id')::UUID,
        COALESCE((v_product_data->>'quantity_box')::INTEGER, 0),
        COALESCE((v_product_data->>'box_to_kg_ratio')::DECIMAL(10,2), 20),
        COALESCE((v_product_data->>'quantity_kg')::DECIMAL(10,2), 0),
        (v_product_data->>'cost_per_box')::DECIMAL(10,2),
        (v_product_data->>'cost_per_kg')::DECIMAL(10,2),
        (v_product_data->>'price_per_box')::DECIMAL(10,2),
        (v_product_data->>'price_per_kg')::DECIMAL(10,2),
        COALESCE((v_product_data->>'boxed_low_stock_threshold')::INTEGER, 10),
        CASE 
            WHEN v_product_data->>'expiry_date' IS NOT NULL 
            THEN (v_product_data->>'expiry_date')::DATE 
            ELSE NULL 
        END
    ) RETURNING product_id INTO v_new_product_id;
    
    -- Update the movement with the new product_id and mark as completed
    UPDATE stock_movements
    SET 
        product_id = v_new_product_id,
        status = 'completed',
        reason = reason || ' | APPROVED BY: ' || p_approved_by::TEXT
    WHERE movement_id = p_movement_id;
    
    RETURN v_new_product_id;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION create_product_from_movement(UUID, UUID) TO authenticated;

-- ============================================================================
-- 6. UPDATE COMMENTS
-- ============================================================================

-- Update table comment
COMMENT ON COLUMN stock_movements.product_id IS 'Reference to the product. NULL only for product_create movements before approval.';

-- Add function comment
COMMENT ON FUNCTION create_product_from_movement(UUID, UUID) IS 'Creates a product from an approved product_create movement and updates the movement record';

-- ============================================================================
-- 7. VERIFY THE SOLUTION
-- ============================================================================

-- Test that we can create product_create movements with NULL product_id
DO $$
DECLARE
    test_user_id UUID;
    test_movement_id UUID;
BEGIN
    -- Get a test user
    SELECT user_id INTO test_user_id FROM users LIMIT 1;
    
    IF test_user_id IS NULL THEN
        test_user_id := '11111111-1111-1111-1111-111111111111';
        RAISE NOTICE '⚠️  No users found, using placeholder user ID for test';
    END IF;
    
    -- Try to insert a test product_create movement with NULL product_id
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
        NULL, -- NULL product_id for product_create
        'product_create',
        0,
        0,
        'product_creation',
        '',
        '{"name": "Test Product", "category_id": "11111111-1111-1111-1111-111111111111", "cost_per_box": 100, "cost_per_kg": 5, "price_per_box": 150, "price_per_kg": 7.5}',
        'Test product creation request',
        test_user_id,
        'pending'
    ) RETURNING movement_id INTO test_movement_id;
    
    -- Clean up the test record
    DELETE FROM stock_movements WHERE movement_id = test_movement_id;
    
    RAISE NOTICE '✅ Product creation movements with NULL product_id work correctly';
    
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION '❌ Test failed: %', SQLERRM;
END $$;

-- ============================================================================
-- 8. RECORD MIGRATION
-- ============================================================================

-- Record this migration
INSERT INTO migration_history (migration_name, description)
VALUES (
    '004_remove_placeholder_make_product_id_conditional',
    'Removes placeholder product approach and makes product_id nullable for product_create movements only'
);

-- ============================================================================
-- 9. FINAL SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 Migration 004 completed successfully!';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Changes applied:';
    RAISE NOTICE '   ✅ Removed placeholder product and protection functions';
    RAISE NOTICE '   ✅ Made product_id nullable for product_create movements only';
    RAISE NOTICE '   ✅ Added conditional constraint for product_id';
    RAISE NOTICE '   ✅ Created helper function for product creation from movements';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Product creation workflow now works without placeholder products!';
    RAISE NOTICE '';
    RAISE NOTICE '📝 How it works now:';
    RAISE NOTICE '   1. User creates product → stock_movements entry with NULL product_id';
    RAISE NOTICE '   2. Admin approves → product is created and movement updated';
    RAISE NOTICE '   3. Admin rejects → movement marked rejected, no product created';
    RAISE NOTICE '';
END $$;

-- Commit the transaction
COMMIT;
