-- =====================================================
-- Migration: Add Product Edit Tracking to Stock Movements
-- Description: Extends stock_movements table to track product information changes
-- Date: 2025-07-19
-- =====================================================

-- Step 1: Add new columns for product edit tracking
ALTER TABLE stock_movements
    ADD COLUMN field_changed TEXT,
    ADD COLUMN old_value TEXT,
    ADD COLUMN new_value TEXT;

-- Step 2: Update movement_type constraint to include 'product_edit'
ALTER TABLE stock_movements
    DROP CONSTRAINT IF EXISTS stock_movements_movement_type_check;

ALTER TABLE stock_movements
    ADD CONSTRAINT stock_movements_movement_type_check 
    CHECK (movement_type IN ('damaged', 'new_stock', 'stock_correction', 'product_edit'));

-- Step 3: Update quantity constraint to allow product_edit movements without quantity changes
ALTER TABLE stock_movements
    DROP CONSTRAINT IF EXISTS chk_stock_movement_quantities;

ALTER TABLE stock_movements
    ADD CONSTRAINT chk_stock_movement_quantities CHECK (
        (movement_type != 'product_edit' AND (box_change != 0 OR kg_change != 0)) OR
        (movement_type = 'product_edit' AND field_changed IS NOT NULL)
    );

-- Step 4: Update reference constraint to allow product_edit movements without reference IDs
ALTER TABLE stock_movements
    DROP CONSTRAINT IF EXISTS chk_movement_references;

ALTER TABLE stock_movements
    ADD CONSTRAINT chk_movement_references CHECK (
        (movement_type = 'damaged' AND damaged_id IS NOT NULL) OR
        (movement_type = 'new_stock' AND stock_addition_id IS NOT NULL) OR
        (movement_type = 'stock_correction' AND correction_id IS NOT NULL) OR
        (movement_type = 'product_edit')
    );

-- Step 5: Add indexes for the new columns to improve query performance
CREATE INDEX IF NOT EXISTS idx_stock_movements_field_changed ON stock_movements(field_changed);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product_edit ON stock_movements(movement_type) WHERE movement_type = 'product_edit';

-- Step 6: Add comments for documentation
COMMENT ON COLUMN stock_movements.field_changed IS 'Name of the field that was changed (for product_edit movements)';
COMMENT ON COLUMN stock_movements.old_value IS 'Previous value of the changed field (for product_edit movements)';
COMMENT ON COLUMN stock_movements.new_value IS 'New value of the changed field (for product_edit movements)';

-- Sample data for testing (commented out)
-- INSERT INTO stock_movements (
--     product_id,
--     movement_type,
--     field_changed,
--     old_value,
--     new_value,
--     reason,
--     performed_by,
--     status
-- ) VALUES (
--     'product-uuid-here',
--     'product_edit',
--     'cost_per_box',
--     '18.50',
--     '19.75',
--     'Updated due to new supplier pricing',
--     'user-uuid-here',
--     'completed'
-- );
