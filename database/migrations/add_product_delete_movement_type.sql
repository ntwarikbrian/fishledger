-- Migration: Add product_delete movement type to stock_movements table
-- This migration adds support for product deletion requests that require approval

-- Step 1: Update movement_type constraint to include 'product_delete'
ALTER TABLE stock_movements
    DROP CONSTRAINT IF EXISTS stock_movements_movement_type_check;

ALTER TABLE stock_movements
    ADD CONSTRAINT stock_movements_movement_type_check 
    CHECK (movement_type IN ('damaged', 'new_stock', 'stock_correction', 'product_edit', 'product_delete'));

-- Step 2: Update reference constraint to allow product_delete movements without reference IDs
ALTER TABLE stock_movements
    DROP CONSTRAINT IF EXISTS chk_movement_references;

ALTER TABLE stock_movements
    ADD CONSTRAINT chk_movement_references CHECK (
        (movement_type = 'damaged' AND damaged_id IS NOT NULL) OR
        (movement_type = 'new_stock' AND stock_addition_id IS NOT NULL) OR
        (movement_type = 'stock_correction' AND correction_id IS NOT NULL) OR
        (movement_type = 'product_edit') OR
        (movement_type = 'product_delete')
    );

-- Step 3: Update quantity constraint to allow product_delete movements without quantity changes
ALTER TABLE stock_movements
    DROP CONSTRAINT IF EXISTS chk_stock_movement_quantities;

ALTER TABLE stock_movements
    ADD CONSTRAINT chk_stock_movement_quantities CHECK (
        (movement_type NOT IN ('product_edit', 'product_delete') AND (box_change != 0 OR kg_change != 0)) OR
        (movement_type = 'product_edit' AND field_changed IS NOT NULL) OR
        (movement_type = 'product_delete' AND field_changed IS NOT NULL)
    );

-- Step 4: Update status constraint to include 'rejected' status for delete requests
ALTER TABLE stock_movements
    DROP CONSTRAINT IF EXISTS stock_movements_status_check;

ALTER TABLE stock_movements
    ADD CONSTRAINT stock_movements_status_check 
    CHECK (status IN ('pending', 'completed', 'cancelled', 'rejected'));

-- Comments for documentation
COMMENT ON CONSTRAINT stock_movements_movement_type_check ON stock_movements IS 'Ensures movement_type is one of: damaged, new_stock, stock_correction, product_edit, product_delete';
COMMENT ON CONSTRAINT chk_movement_references ON stock_movements IS 'Ensures proper reference IDs are set based on movement type';
COMMENT ON CONSTRAINT chk_stock_movement_quantities ON stock_movements IS 'Ensures quantity changes are present for stock movements, or field_changed for edit/delete movements';
COMMENT ON CONSTRAINT stock_movements_status_check ON stock_movements IS 'Ensures status is one of: pending, completed, cancelled, rejected';
