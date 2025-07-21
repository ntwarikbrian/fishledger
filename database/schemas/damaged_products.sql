-- =====================================================
-- Damaged Products Table Schema
-- Tracks damaged inventory separately from main products
-- =====================================================

-- Damaged products table for tracking damaged inventory
CREATE TABLE IF NOT EXISTS damaged_products (
    damage_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE, -- Data isolation: damaged products belong to specific user
    product_id UUID NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
    
    -- Damaged quantities
    damaged_boxes INTEGER DEFAULT 0 NOT NULL CHECK (damaged_boxes >= 0),
    damaged_kg DECIMAL(10,2) DEFAULT 0 NOT NULL CHECK (damaged_kg >= 0),
    
    -- Damage details
    damaged_reason TEXT NOT NULL,
    description TEXT, -- Additional description/notes about the damage
    damaged_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Financial impact
    loss_value DECIMAL(12,2) DEFAULT 0 NOT NULL CHECK (loss_value >= 0),
    
    -- Approval workflow
    damaged_approval BOOLEAN DEFAULT false NOT NULL,
    approved_by UUID REFERENCES users(user_id),
    approved_date TIMESTAMP WITH TIME ZONE,
    
    -- Audit trail
    reported_by UUID NOT NULL REFERENCES users(user_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT chk_damaged_quantities CHECK (damaged_boxes > 0 OR damaged_kg > 0),
    CONSTRAINT chk_approval_consistency CHECK (
        (damaged_approval = true AND approved_by IS NOT NULL AND approved_date IS NOT NULL) OR
        (damaged_approval = false AND approved_by IS NULL AND approved_date IS NULL)
    )
);

-- Comments for damaged products table
COMMENT ON TABLE damaged_products IS 'Tracks damaged inventory items separately from main products table';
COMMENT ON COLUMN damaged_products.damage_id IS 'Unique identifier for each damage record';
COMMENT ON COLUMN damaged_products.product_id IS 'Reference to the product that was damaged';
COMMENT ON COLUMN damaged_products.damaged_boxes IS 'Number of boxes that were damaged';
COMMENT ON COLUMN damaged_products.damaged_kg IS 'Weight in kg that was damaged';
COMMENT ON COLUMN damaged_products.damaged_reason IS 'Reason for the damage';
COMMENT ON COLUMN damaged_products.description IS 'Additional notes about the damage';
COMMENT ON COLUMN damaged_products.damaged_date IS 'Date when the damage was reported';
COMMENT ON COLUMN damaged_products.loss_value IS 'Financial loss value from the damaged products';
COMMENT ON COLUMN damaged_products.damaged_approval IS 'Whether the damage report has been approved';
COMMENT ON COLUMN damaged_products.approved_by IS 'User who approved the damage report';
COMMENT ON COLUMN damaged_products.approved_date IS 'Date when the damage was approved';
COMMENT ON COLUMN damaged_products.reported_by IS 'User who reported the damage';

-- Indexes for damaged products performance
CREATE INDEX IF NOT EXISTS idx_damaged_products_product_id ON damaged_products(product_id);
CREATE INDEX IF NOT EXISTS idx_damaged_products_damaged_date ON damaged_products(damaged_date);
CREATE INDEX IF NOT EXISTS idx_damaged_products_reported_by ON damaged_products(reported_by);
CREATE INDEX IF NOT EXISTS idx_damaged_products_approval_status ON damaged_products(damaged_approval);

-- Enable RLS for damaged products
ALTER TABLE damaged_products ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access damaged products from their own business
CREATE POLICY damaged_products_user_isolation ON damaged_products
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.user_id = auth.uid()
        )
    );

-- Comments for documentation
COMMENT ON TABLE damaged_products IS 'Tracks damaged inventory items separately from main products table';
COMMENT ON COLUMN damaged_products.damage_id IS 'Unique identifier for each damage record';
COMMENT ON COLUMN damaged_products.product_id IS 'Reference to the product that was damaged';
COMMENT ON COLUMN damaged_products.damaged_boxes IS 'Number of boxes that were damaged';
COMMENT ON COLUMN damaged_products.damaged_kg IS 'Weight in kg that was damaged';
COMMENT ON COLUMN damaged_products.damaged_reason IS 'Reason for the damage (e.g., Transit, Quality Issues, etc.)';
COMMENT ON COLUMN damaged_products.description IS 'Additional notes or description about the damage';
COMMENT ON COLUMN damaged_products.damaged_date IS 'Date when the damage was reported';
COMMENT ON COLUMN damaged_products.loss_value IS 'Financial loss value from the damaged products';
COMMENT ON COLUMN damaged_products.damaged_approval IS 'Whether the damage report has been approved';
COMMENT ON COLUMN damaged_products.approved_by IS 'User who approved the damage report';
COMMENT ON COLUMN damaged_products.approved_date IS 'Date when the damage was approved';
COMMENT ON COLUMN damaged_products.reported_by IS 'User who reported the damage';
COMMENT ON COLUMN damaged_products.created_at IS 'Timestamp when damage record was created';
COMMENT ON COLUMN damaged_products.updated_at IS 'Timestamp when damage record was last updated';

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_damaged_products_product_id ON damaged_products(product_id);
CREATE INDEX IF NOT EXISTS idx_damaged_products_damaged_date ON damaged_products(damaged_date);
CREATE INDEX IF NOT EXISTS idx_damaged_products_reported_by ON damaged_products(reported_by);
CREATE INDEX IF NOT EXISTS idx_damaged_products_approval_status ON damaged_products(damaged_approval);
CREATE INDEX IF NOT EXISTS idx_damaged_products_created_at ON damaged_products(created_at);

-- Trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_damaged_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_damaged_products_updated_at
    BEFORE UPDATE ON damaged_products
    FOR EACH ROW
    EXECUTE FUNCTION update_damaged_products_updated_at();

-- Trigger to automatically set approval details when damaged_approval is set to true
CREATE OR REPLACE FUNCTION set_damaged_products_approval_details()
RETURNS TRIGGER AS $$
BEGIN
    -- If approval status is being set to true and approved_date is not set
    IF NEW.damaged_approval = true AND OLD.damaged_approval = false THEN
        NEW.approved_date = CURRENT_TIMESTAMP;
        -- approved_by should be set by the application
    END IF;
    
    -- If approval status is being set to false, clear approval details
    IF NEW.damaged_approval = false AND OLD.damaged_approval = true THEN
        NEW.approved_by = NULL;
        NEW.approved_date = NULL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_damaged_products_approval_details
    BEFORE UPDATE ON damaged_products
    FOR EACH ROW
    EXECUTE FUNCTION set_damaged_products_approval_details();

-- View for detailed damaged products with product and user information
CREATE OR REPLACE VIEW damaged_products_detailed AS
SELECT 
    dp.damage_id,
    dp.product_id,
    p.name AS product_name,
    pc.name AS category_name,
    dp.damaged_boxes,
    dp.damaged_kg,
    dp.damaged_reason,
    dp.description,
    dp.damaged_date,
    dp.loss_value,
    dp.damaged_approval,
    dp.approved_date,
    
    -- Reporter information
    reporter.owner_name AS reported_by_name,
    reporter.business_name AS reported_by_business,
    
    -- Approver information
    approver.owner_name AS approved_by_name,
    approver.business_name AS approved_by_business,
    
    dp.created_at,
    dp.updated_at
FROM damaged_products dp
JOIN products p ON dp.product_id = p.product_id
LEFT JOIN product_categories pc ON p.category_id = pc.category_id
JOIN users reporter ON dp.reported_by = reporter.user_id
LEFT JOIN users approver ON dp.approved_by = approver.user_id
ORDER BY dp.damaged_date DESC, dp.created_at DESC;

COMMENT ON VIEW damaged_products_detailed IS 'Detailed view of damaged products with product and user information';
