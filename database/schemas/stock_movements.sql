-- =====================================================
-- Stock Movements Table Schema
-- Tracks inventory changes from irregular events
-- =====================================================

-- Stock movements table for tracking inventory changes from irregular events
CREATE TABLE IF NOT EXISTS stock_movements (
    movement_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(product_id),
    movement_type VARCHAR(20) NOT NULL CHECK (movement_type IN ('counting_error', 'theft', 'return')),
    weight_change DECIMAL(10,2) DEFAULT 0, -- Weight change in kg (positive for increase, negative for decrease)
    quantity_change INTEGER DEFAULT 0, -- Quantity change (positive for increase, negative for decrease)
    reason TEXT NOT NULL,
    performed_by UUID NOT NULL REFERENCES users(user_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Comments for documentation
COMMENT ON TABLE stock_movements IS 'Tracks inventory changes from irregular events';
COMMENT ON COLUMN stock_movements.movement_id IS 'Unique identifier for each movement';
COMMENT ON COLUMN stock_movements.product_id IS 'Reference to the product being moved';
COMMENT ON COLUMN stock_movements.movement_type IS 'Type of movement: counting_error, theft, return';
COMMENT ON COLUMN stock_movements.weight_change IS 'Change in weight (kg) - positive for increase, negative for decrease';
COMMENT ON COLUMN stock_movements.quantity_change IS 'Change in quantity - positive for increase, negative for decrease';
COMMENT ON COLUMN stock_movements.reason IS 'Detailed reason for the stock movement';
COMMENT ON COLUMN stock_movements.performed_by IS 'User who performed the movement';
COMMENT ON COLUMN stock_movements.created_at IS 'Timestamp when movement was recorded';

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_type ON stock_movements(movement_type);
CREATE INDEX IF NOT EXISTS idx_stock_movements_date ON stock_movements(created_at);
CREATE INDEX IF NOT EXISTS idx_stock_movements_performed_by ON stock_movements(performed_by);

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
-- INSERT INTO stock_movements (product_id, movement_type, weight_change, quantity_change, reason, performed_by) VALUES
-- ('product-uuid-here', 'counting_error', 0, 5, 'Found 5 additional boxes during inventory count', 'user-uuid-here'),
-- ('product-uuid-here', 'theft', -2.5, -1, 'Missing fish reported by staff', 'user-uuid-here'),
-- ('product-uuid-here', 'return', 1.2, 0, 'Customer returned spoiled fish', 'user-uuid-here');
