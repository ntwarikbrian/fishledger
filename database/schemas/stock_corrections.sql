-- =====================================================
-- Stock Corrections Table Schema
-- Tracks manual inventory adjustments and corrections
-- =====================================================

-- Stock corrections table for tracking manual inventory adjustments
CREATE TABLE IF NOT EXISTS stock_corrections (
    correction_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
    
    -- Adjustment quantities (positive or negative)
    box_adjustment INTEGER DEFAULT 0 NOT NULL, -- Positive for increase, negative for decrease
    kg_adjustment DECIMAL(10,2) DEFAULT 0 NOT NULL, -- Positive for increase, negative for decrease
    
    -- Correction details
    correction_reason TEXT NOT NULL, -- Reason for the correction (e.g., "Counting error", "Theft", "Found missing stock")
    correction_date DATE NOT NULL DEFAULT CURRENT_DATE, -- When the correction was made
    
    -- Status tracking
    status VARCHAR(20) DEFAULT 'completed' NOT NULL CHECK (status IN ('pending', 'completed', 'cancelled')),
    
    -- Audit trail
    performed_by UUID NOT NULL REFERENCES users(user_id), -- User who performed the correction
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT chk_correction_quantities CHECK (box_adjustment != 0 OR kg_adjustment != 0),
    CONSTRAINT chk_correction_reason_length CHECK (LENGTH(correction_reason) >= 3)
);

-- Comments for documentation
COMMENT ON TABLE stock_corrections IS 'Tracks manual inventory adjustments and corrections';
COMMENT ON COLUMN stock_corrections.correction_id IS 'Unique identifier for each correction record';
COMMENT ON COLUMN stock_corrections.product_id IS 'Reference to the product being corrected';
COMMENT ON COLUMN stock_corrections.box_adjustment IS 'Box quantity adjustment - positive for increase, negative for decrease';
COMMENT ON COLUMN stock_corrections.kg_adjustment IS 'Kg quantity adjustment - positive for increase, negative for decrease';
COMMENT ON COLUMN stock_corrections.correction_reason IS 'Reason for the correction (minimum 3 characters)';
COMMENT ON COLUMN stock_corrections.correction_date IS 'Date when the correction was made';
COMMENT ON COLUMN stock_corrections.status IS 'Status of the correction: pending, completed, cancelled';
COMMENT ON COLUMN stock_corrections.performed_by IS 'User who performed the correction';
COMMENT ON COLUMN stock_corrections.created_at IS 'When the correction record was created';
COMMENT ON COLUMN stock_corrections.updated_at IS 'When the correction record was last updated';

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_stock_corrections_product_id ON stock_corrections(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_corrections_performed_by ON stock_corrections(performed_by);
CREATE INDEX IF NOT EXISTS idx_stock_corrections_correction_date ON stock_corrections(correction_date);
CREATE INDEX IF NOT EXISTS idx_stock_corrections_status ON stock_corrections(status);
CREATE INDEX IF NOT EXISTS idx_stock_corrections_created_at ON stock_corrections(created_at);

-- Row Level Security (RLS) policies
ALTER TABLE stock_corrections ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view corrections for their own business
CREATE POLICY stock_corrections_select_own ON stock_corrections
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.user_id = auth.uid() 
            AND users.user_id = stock_corrections.performed_by
        )
    );

-- Policy: Users can insert their own corrections
CREATE POLICY stock_corrections_insert_own ON stock_corrections
    FOR INSERT
    WITH CHECK (performed_by = auth.uid());

-- Policy: Users can update their own corrections (only if status is pending)
CREATE POLICY stock_corrections_update_own ON stock_corrections
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
CREATE OR REPLACE FUNCTION update_stock_corrections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_stock_corrections_updated_at
    BEFORE UPDATE ON stock_corrections
    FOR EACH ROW
    EXECUTE FUNCTION update_stock_corrections_updated_at();

-- Sample data for development
-- Note: These will need actual product_id and user_id values from their respective tables
-- INSERT INTO stock_corrections (product_id, box_adjustment, kg_adjustment, correction_reason, performed_by) VALUES
-- ('product-uuid-here', 5, 0, 'Found 5 additional boxes during inventory count', 'user-uuid-here'),
-- ('product-uuid-here', -2, -5.5, 'Missing stock discovered during audit', 'user-uuid-here'),
-- ('product-uuid-here', 0, 3.2, 'Weight correction after re-weighing', 'user-uuid-here');
