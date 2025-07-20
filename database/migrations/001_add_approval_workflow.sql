-- Migration: Add Approval Workflow for Stock Operations
-- Version: 001
-- Description: Implements approval workflow for stock additions, product creation, and stock corrections
-- Date: 2024-01-19

-- Start transaction to ensure atomicity
BEGIN;

-- ============================================================================
-- 1. UPDATE STOCK_MOVEMENTS TABLE CONSTRAINTS
-- ============================================================================

-- Add new movement type 'product_create' to the existing enum constraint
ALTER TABLE stock_movements 
DROP CONSTRAINT IF EXISTS stock_movements_movement_type_check;

ALTER TABLE stock_movements 
ADD CONSTRAINT stock_movements_movement_type_check 
CHECK (movement_type IN ('damaged', 'new_stock', 'stock_correction', 'product_edit', 'product_delete', 'product_create'));

-- Update the quantity constraints to include new movement types
ALTER TABLE stock_movements 
DROP CONSTRAINT IF EXISTS chk_stock_movement_quantities;

ALTER TABLE stock_movements 
ADD CONSTRAINT chk_stock_movement_quantities CHECK (
    (movement_type NOT IN ('product_edit', 'product_delete', 'product_create') AND (box_change != 0 OR kg_change != 0)) OR
    (movement_type = 'product_edit' AND field_changed IS NOT NULL) OR
    (movement_type = 'product_delete' AND field_changed IS NOT NULL) OR
    (movement_type = 'product_create' AND field_changed IS NOT NULL)
);

-- ============================================================================
-- 2. UPDATE REFERENCE CONSTRAINT TO INCLUDE 'PRODUCT_CREATE'
-- ============================================================================

-- Update reference constraint to include product_create (which doesn't need reference IDs)
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

-- ============================================================================
-- 3. UPDATE STATUS CONSTRAINT TO INCLUDE 'REJECTED'
-- ============================================================================

-- Add 'rejected' status to existing status constraint
ALTER TABLE stock_movements
DROP CONSTRAINT IF EXISTS stock_movements_status_check;

ALTER TABLE stock_movements
ADD CONSTRAINT stock_movements_status_check
CHECK (status IN ('pending', 'completed', 'cancelled', 'rejected'));

-- ============================================================================
-- 3. CREATE INDEXES FOR BETTER PERFORMANCE
-- ============================================================================

-- Index for filtering by status (for pending approvals dashboard)
CREATE INDEX IF NOT EXISTS idx_stock_movements_status_pending 
ON stock_movements(status) WHERE status = 'pending';

-- Index for filtering by movement type and status
CREATE INDEX IF NOT EXISTS idx_stock_movements_type_status 
ON stock_movements(movement_type, status);

-- Index for filtering pending requests by user
CREATE INDEX IF NOT EXISTS idx_stock_movements_pending_by_user 
ON stock_movements(performed_by, status) WHERE status = 'pending';

-- ============================================================================
-- 4. UPDATE EXISTING STOCK MOVEMENTS TO HAVE 'COMPLETED' STATUS
-- ============================================================================

-- Update any existing stock movements that don't have a status set
UPDATE stock_movements 
SET status = 'completed' 
WHERE status IS NULL;

-- ============================================================================
-- 5. CREATE APPROVAL WORKFLOW FUNCTIONS
-- ============================================================================

-- Function to get pending approvals count
CREATE OR REPLACE FUNCTION get_pending_approvals_count()
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM stock_movements
        WHERE status = 'pending'
    );
END;
$$ LANGUAGE plpgsql;

-- Function to get pending approvals by type
CREATE OR REPLACE FUNCTION get_pending_approvals_by_type()
RETURNS TABLE(
    movement_type VARCHAR(20),
    pending_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sm.movement_type,
        COUNT(*) as pending_count
    FROM stock_movements sm
    WHERE sm.status = 'pending'
    GROUP BY sm.movement_type
    ORDER BY pending_count DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to approve stock addition
CREATE OR REPLACE FUNCTION approve_stock_addition(
    p_movement_id UUID,
    p_approved_by UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    v_movement RECORD;
    v_product RECORD;
BEGIN
    -- Get the pending movement
    SELECT * INTO v_movement
    FROM stock_movements
    WHERE movement_id = p_movement_id
    AND movement_type = 'new_stock'
    AND status = 'pending';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Pending stock addition not found';
    END IF;
    
    -- Get current product data
    SELECT * INTO v_product
    FROM products
    WHERE product_id = v_movement.product_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Product not found';
    END IF;
    
    -- Update product quantities
    UPDATE products
    SET 
        quantity_box = quantity_box + v_movement.box_change,
        quantity_kg = quantity_kg + v_movement.kg_change,
        updated_at = CURRENT_TIMESTAMP
    WHERE product_id = v_movement.product_id;
    
    -- Update movement status
    UPDATE stock_movements
    SET 
        status = 'completed',
        reason = reason || ' | APPROVED BY: ' || p_approved_by::TEXT
    WHERE movement_id = p_movement_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to approve stock correction
CREATE OR REPLACE FUNCTION approve_stock_correction(
    p_movement_id UUID,
    p_approved_by UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    v_movement RECORD;
    v_product RECORD;
BEGIN
    -- Get the pending movement
    SELECT * INTO v_movement
    FROM stock_movements
    WHERE movement_id = p_movement_id
    AND movement_type = 'stock_correction'
    AND status = 'pending';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Pending stock correction not found';
    END IF;
    
    -- Get current product data
    SELECT * INTO v_product
    FROM products
    WHERE product_id = v_movement.product_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Product not found';
    END IF;
    
    -- Update product quantities
    UPDATE products
    SET 
        quantity_box = quantity_box + v_movement.box_change,
        quantity_kg = quantity_kg + v_movement.kg_change,
        updated_at = CURRENT_TIMESTAMP
    WHERE product_id = v_movement.product_id;
    
    -- Update movement status
    UPDATE stock_movements
    SET 
        status = 'completed',
        reason = reason || ' | APPROVED BY: ' || p_approved_by::TEXT
    WHERE movement_id = p_movement_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 6. CREATE VIEWS FOR EASY QUERYING
-- ============================================================================

-- View for pending approvals with product details
CREATE OR REPLACE VIEW pending_approvals AS
SELECT 
    sm.movement_id,
    sm.movement_type,
    sm.product_id,
    p.name as product_name,
    pc.name as category_name,
    sm.box_change,
    sm.kg_change,
    sm.field_changed,
    sm.old_value,
    sm.new_value,
    sm.reason,
    sm.performed_by,
    u.email_address as requested_by_email,
    sm.created_at as requested_at,
    CASE 
        WHEN sm.movement_type = 'new_stock' THEN 'Stock Addition'
        WHEN sm.movement_type = 'stock_correction' THEN 'Stock Correction'
        WHEN sm.movement_type = 'product_create' THEN 'Product Creation'
        WHEN sm.movement_type = 'product_edit' THEN 'Product Edit'
        WHEN sm.movement_type = 'product_delete' THEN 'Product Deletion'
        ELSE sm.movement_type
    END as request_type_display
FROM stock_movements sm
LEFT JOIN products p ON sm.product_id = p.product_id
LEFT JOIN product_categories pc ON p.category_id = pc.category_id
LEFT JOIN users u ON sm.performed_by = u.user_id
WHERE sm.status = 'pending'
ORDER BY sm.created_at ASC;

-- ============================================================================
-- 7. UPDATE COMMENTS AND DOCUMENTATION
-- ============================================================================

-- Update table comments
COMMENT ON COLUMN stock_movements.movement_type IS 'Type of movement: damaged, new_stock, stock_correction, product_edit, product_delete, product_create';
COMMENT ON COLUMN stock_movements.status IS 'Status of the movement: pending (awaiting approval), completed (approved and applied), cancelled, rejected';

-- Add comments for new functions
COMMENT ON FUNCTION get_pending_approvals_count() IS 'Returns the total count of pending approval requests';
COMMENT ON FUNCTION get_pending_approvals_by_type() IS 'Returns pending approval counts grouped by movement type';
COMMENT ON FUNCTION approve_stock_addition(UUID, UUID) IS 'Approves a pending stock addition and updates product quantities';
COMMENT ON FUNCTION approve_stock_correction(UUID, UUID) IS 'Approves a pending stock correction and updates product quantities';

-- Add comment for new view
COMMENT ON VIEW pending_approvals IS 'View showing all pending approval requests with product and user details';

-- ============================================================================
-- 8. GRANT PERMISSIONS
-- ============================================================================

-- Grant permissions to authenticated users for the new view
GRANT SELECT ON pending_approvals TO authenticated;

-- Grant execute permissions for the new functions to authenticated users
GRANT EXECUTE ON FUNCTION get_pending_approvals_count() TO authenticated;
GRANT EXECUTE ON FUNCTION get_pending_approvals_by_type() TO authenticated;
GRANT EXECUTE ON FUNCTION approve_stock_addition(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION approve_stock_correction(UUID, UUID) TO authenticated;

-- ============================================================================
-- 9. MIGRATION METADATA
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
    '001_add_approval_workflow',
    'Implements approval workflow for stock operations including new movement types, status tracking, and approval functions'
);

-- Commit the transaction
COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES (Run these after migration to verify success)
-- ============================================================================

-- Verify new movement types are accepted
-- SELECT DISTINCT movement_type FROM stock_movements;

-- Verify new status values are accepted
-- SELECT DISTINCT status FROM stock_movements;

-- Check pending approvals view
-- SELECT * FROM pending_approvals LIMIT 5;

-- Check approval functions
-- SELECT get_pending_approvals_count();
-- SELECT * FROM get_pending_approvals_by_type();

-- ============================================================================
-- ROLLBACK SCRIPT (Use if migration needs to be reverted)
-- ============================================================================

/*
-- ROLLBACK SCRIPT - RUN ONLY IF MIGRATION NEEDS TO BE REVERTED

BEGIN;

-- Drop new functions
DROP FUNCTION IF EXISTS get_pending_approvals_count();
DROP FUNCTION IF EXISTS get_pending_approvals_by_type();
DROP FUNCTION IF EXISTS approve_stock_addition(UUID, UUID);
DROP FUNCTION IF EXISTS approve_stock_correction(UUID, UUID);

-- Drop new view
DROP VIEW IF EXISTS pending_approvals;

-- Drop new indexes
DROP INDEX IF EXISTS idx_stock_movements_status_pending;
DROP INDEX IF EXISTS idx_stock_movements_type_status;
DROP INDEX IF EXISTS idx_stock_movements_pending_by_user;

-- Revert status constraint
ALTER TABLE stock_movements 
DROP CONSTRAINT IF EXISTS stock_movements_status_check;

ALTER TABLE stock_movements 
ADD CONSTRAINT stock_movements_status_check 
CHECK (status IN ('pending', 'completed', 'cancelled'));

-- Revert movement type constraint
ALTER TABLE stock_movements 
DROP CONSTRAINT IF EXISTS stock_movements_movement_type_check;

ALTER TABLE stock_movements 
ADD CONSTRAINT stock_movements_movement_type_check 
CHECK (movement_type IN ('damaged', 'new_stock', 'stock_correction', 'product_edit', 'product_delete'));

-- Revert quantity constraint
ALTER TABLE stock_movements 
DROP CONSTRAINT IF EXISTS chk_stock_movement_quantities;

ALTER TABLE stock_movements 
ADD CONSTRAINT chk_stock_movement_quantities CHECK (
    (movement_type NOT IN ('product_edit', 'product_delete') AND (box_change != 0 OR kg_change != 0)) OR
    (movement_type = 'product_edit' AND field_changed IS NOT NULL) OR
    (movement_type = 'product_delete' AND field_changed IS NOT NULL)
);

-- Remove migration record
DELETE FROM migration_history WHERE migration_name = '001_add_approval_workflow';

COMMIT;
*/
