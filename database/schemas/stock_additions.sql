-- =====================================================
-- Stock Additions Table Schema
-- Tracks new stock deliveries and additions
-- =====================================================

-- Stock additions table for tracking new stock deliveries
CREATE TABLE IF NOT EXISTS stock_additions (
    addition_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE, -- Data isolation: additions belong to specific user

    -- Added quantities
    boxes_added INTEGER DEFAULT 0 NOT NULL CHECK (boxes_added >= 0), -- Number of boxes added
    kg_added DECIMAL(10,2) DEFAULT 0 NOT NULL CHECK (kg_added >= 0), -- Kg quantity added

    -- Financial details
    total_cost DECIMAL(12,2) DEFAULT 0 NOT NULL CHECK (total_cost >= 0), -- Total cost of the addition

    -- Delivery details
    delivery_date DATE NOT NULL DEFAULT CURRENT_DATE, -- When the stock was delivered/added

    -- Status tracking
    status VARCHAR(20) DEFAULT 'completed' NOT NULL CHECK (status IN ('pending', 'completed', 'cancelled')),

    -- Audit trail
    performed_by UUID NOT NULL REFERENCES users(user_id), -- User who recorded the addition
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT chk_addition_quantities CHECK (boxes_added > 0 OR kg_added > 0),
    CONSTRAINT chk_delivery_date_not_future CHECK (delivery_date <= CURRENT_DATE) -- Only present or past dates allowed
);

-- Comments for documentation
COMMENT ON TABLE stock_additions IS 'Tracks new stock deliveries and additions to inventory';
COMMENT ON COLUMN stock_additions.addition_id IS 'Unique identifier for each stock addition record';
COMMENT ON COLUMN stock_additions.product_id IS 'Reference to the product being added';
COMMENT ON COLUMN stock_additions.user_id IS 'User ID for data isolation - ensures stock additions belong to specific user';
COMMENT ON COLUMN stock_additions.boxes_added IS 'Number of boxes added to inventory';
COMMENT ON COLUMN stock_additions.kg_added IS 'Kg quantity added to inventory';
COMMENT ON COLUMN stock_additions.total_cost IS 'Total cost of the stock addition';
COMMENT ON COLUMN stock_additions.delivery_date IS 'Date when the stock was delivered/added';
COMMENT ON COLUMN stock_additions.status IS 'Status of the addition: pending, completed, cancelled';
COMMENT ON COLUMN stock_additions.performed_by IS 'User who recorded the stock addition';
COMMENT ON COLUMN stock_additions.created_at IS 'When the addition record was created';
COMMENT ON COLUMN stock_additions.updated_at IS 'When the addition record was last updated';

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_stock_additions_product_id ON stock_additions(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_additions_user_id ON stock_additions(user_id);
CREATE INDEX IF NOT EXISTS idx_stock_additions_performed_by ON stock_additions(performed_by);
CREATE INDEX IF NOT EXISTS idx_stock_additions_delivery_date ON stock_additions(delivery_date);
CREATE INDEX IF NOT EXISTS idx_stock_additions_status ON stock_additions(status);
CREATE INDEX IF NOT EXISTS idx_stock_additions_created_at ON stock_additions(created_at);

-- Row Level Security (RLS) policies
ALTER TABLE stock_additions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view additions for their own business
CREATE POLICY stock_additions_select_own ON stock_additions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.user_id = auth.uid() 
            AND users.user_id = stock_additions.performed_by
        )
    );

-- Policy: Users can insert their own additions
CREATE POLICY stock_additions_insert_own ON stock_additions
    FOR INSERT
    WITH CHECK (performed_by = auth.uid());

-- Policy: Users can update their own additions (only if status is pending)
CREATE POLICY stock_additions_update_own ON stock_additions
    FOR UPDATE
    USING (
        performed_by = auth.uid() 
        AND status = 'pending'
    )
    WITH CHECK (
        performed_by = auth.uid() 
        AND status IN ('pending', 'completed', 'cancelled')
    );

-- Trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_stock_additions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_stock_additions_updated_at
    BEFORE UPDATE ON stock_additions
    FOR EACH ROW
    EXECUTE FUNCTION update_stock_additions_updated_at();

-- Sample data for development
-- Note: These will need actual product_id and user_id values from their respective tables
-- INSERT INTO stock_additions (product_id, boxes_added, kg_added, total_cost, delivery_date, performed_by) VALUES
-- ('product-uuid-here', 20, 0, 370.00, CURRENT_DATE, 'user-uuid-here'),
-- ('product-uuid-here', 0, 15.5, 23.25, CURRENT_DATE - INTERVAL '1 day', 'user-uuid-here'),
-- ('product-uuid-here', 10, 5.2, 185.50, CURRENT_DATE - INTERVAL '2 days', 'user-uuid-here');
