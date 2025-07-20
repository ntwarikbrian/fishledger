-- Quick fix for the product_create constraint issue
-- Run this directly in your database to fix the constraint

-- Update reference constraint to include product_create
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

-- Verify the constraint was updated
SELECT constraint_name, check_clause 
FROM information_schema.check_constraints 
WHERE constraint_name = 'chk_movement_references';
