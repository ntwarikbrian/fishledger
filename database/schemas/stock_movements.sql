-- =====================================================
-- Stock Movements Table Schema
-- Tracks inventory changes from irregular events
-- =====================================================

-- Stock movements table for tracking inventory changes from irregular events
-- Note: product_create movement_type kept for backward compatibility but not used in direct creation workflow
CREATE TABLE IF NOT EXISTS stock_movements (
    movement_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE, -- Data isolation: movements belong to specific user
    product_id UUID NOT NULL REFERENCES products(product_id),
    movement_type VARCHAR(20) NOT NULL CHECK (movement_type IN ('damaged', 'new_stock', 'stock_correction', 'product_edit', 'product_delete', 'product_create')),

    -- Changes in box and kg quantities
    box_change INTEGER DEFAULT 0, -- Box quantity change (positive for increase, negative for decrease)
    kg_change DECIMAL(10,2) DEFAULT 0, -- Kg change (positive for increase, negative for decrease)

    -- Product edit tracking fields (for movement_type = 'product_edit')
    field_changed TEXT, -- Name of the field that was changed (e.g., 'name', 'cost_per_box', 'price_per_kg')
    old_value TEXT, -- Previous value of the field (stored as text for flexibility)
    new_value TEXT, -- New value of the field (stored as text for flexibility)

    -- Reference IDs for tracking specific records based on movement type
    damaged_id UUID REFERENCES damaged_products(damage_id), -- Reference to damaged product record
    stock_addition_id UUID REFERENCES stock_additions(addition_id), -- Reference to stock addition record
    correction_id UUID REFERENCES stock_corrections(correction_id), -- Reference to stock correction record

    -- Movement details
    reason TEXT, -- Reason from the referenced record or manual entry
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled', 'rejected')),

    -- Audit trail
    performed_by UUID NOT NULL REFERENCES users(user_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    -- Note: product_create removed from constraint since it's no longer used in direct creation workflow
    CONSTRAINT chk_stock_movement_quantities CHECK (
        (movement_type NOT IN ('product_edit', 'product_delete') AND (box_change != 0 OR kg_change != 0)) OR
        (movement_type = 'product_edit' AND field_changed IS NOT NULL) OR
        (movement_type = 'product_delete' AND field_changed IS NOT NULL)
    ),
    CONSTRAINT chk_movement_references CHECK (
        (movement_type = 'damaged' AND damaged_id IS NOT NULL) OR
        (movement_type = 'new_stock' AND stock_addition_id IS NOT NULL) OR
        (movement_type = 'stock_correction' AND correction_id IS NOT NULL) OR
        (movement_type = 'product_edit') OR
        (movement_type = 'product_delete') OR
        (movement_type = 'product_create')
    )
);

-- Comments for documentation
COMMENT ON TABLE stock_movements IS 'Tracks inventory changes from irregular events (damaged, new stock, corrections)';
COMMENT ON COLUMN stock_movements.movement_id IS 'Unique identifier for each movement';
COMMENT ON COLUMN stock_movements.product_id IS 'Reference to the product being moved';
COMMENT ON COLUMN stock_movements.movement_type IS 'Type of movement: damaged, new_stock, stock_correction, product_edit, product_delete, product_create';
COMMENT ON COLUMN stock_movements.box_change IS 'Change in box quantity - positive for increase, negative for decrease';
COMMENT ON COLUMN stock_movements.kg_change IS 'Change in kg quantity - positive for increase, negative for decrease';
COMMENT ON COLUMN stock_movements.damaged_id IS 'Reference to damaged_products record for damaged movements';
COMMENT ON COLUMN stock_movements.stock_addition_id IS 'Reference to stock addition record for new stock movements';
COMMENT ON COLUMN stock_movements.correction_id IS 'Reference to stock correction record for correction movements';
COMMENT ON COLUMN stock_movements.reason IS 'Reason for the movement, derived from source record or manual entry';
COMMENT ON COLUMN stock_movements.status IS 'Status of the movement: pending, completed, cancelled';
COMMENT ON COLUMN stock_movements.performed_by IS 'User who performed the movement';
COMMENT ON COLUMN stock_movements.created_at IS 'Timestamp when movement was recorded';
COMMENT ON COLUMN stock_movements.field_changed IS 'Name of the field that was changed (for product_edit movements)';
COMMENT ON COLUMN stock_movements.old_value IS 'Previous value of the changed field (for product_edit movements)';
COMMENT ON COLUMN stock_movements.new_value IS 'New value of the changed field (for product_edit movements)';

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_type ON stock_movements(movement_type);
CREATE INDEX IF NOT EXISTS idx_stock_movements_date ON stock_movements(created_at);
CREATE INDEX IF NOT EXISTS idx_stock_movements_performed_by ON stock_movements(performed_by);
CREATE INDEX IF NOT EXISTS idx_stock_movements_damaged_id ON stock_movements(damaged_id);
-- Index for sale_id removed as column no longer exists
CREATE INDEX IF NOT EXISTS idx_stock_movements_status ON stock_movements(status);

-- Row Level Security (RLS) policies
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

-- Policy: Business owners can view all stock movements
CREATE POLICY stock_movements_select_all ON stock_movements
    FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- Policy: Business owners can insert stock movements
CREATE POLICY stock_movements_insert_owner ON stock_movements
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Policy: Business owners can update stock movements
CREATE POLICY stock_movements_update_owner ON stock_movements
    FOR UPDATE
    USING (auth.uid() IS NOT NULL);

-- Policy: Business owners can delete stock movements
CREATE POLICY stock_movements_delete_owner ON stock_movements
    FOR DELETE
    USING (auth.uid() IS NOT NULL);

-- Sample data for development
-- Note: These will need actual product_id and user_id values from their respective tables
-- INSERT INTO stock_movements (product_id, movement_type, box_change, kg_change, reason, performed_by, damaged_id) VALUES
-- ('product-uuid-here', 'damaged', -2, -5.5, 'Missing stock discovered during audit', 'user-uuid-here', 'damage-uuid-here'),
-- ('product-uuid-here', 'stock_correction', 0, 3.2, 'Weight correction after re-weighing', 'user-uuid-here', NULL),
-- ('product-uuid-here', 'new_stock', 20, 0, 'New stock delivery', 'user-uuid-here', NULL);
