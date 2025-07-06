-- =====================================================
-- Products Table Schema
-- Tracks fish inventory, including pricing, damage, and expiry
-- =====================================================

-- Products table for fish inventory management
CREATE TABLE IF NOT EXISTS products (
    product_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    category_id UUID NOT NULL REFERENCES product_categories(category_id),
    quantity INTEGER DEFAULT 0,
    selling_type VARCHAR(20) NOT NULL CHECK (selling_type IN ('boxed', 'weight', 'both')),
    price DECIMAL(10,2) NOT NULL,
    cost_price DECIMAL(10,2) NOT NULL,
    profit DECIMAL(10,2) GENERATED ALWAYS AS (price - cost_price) STORED,
    supplier VARCHAR(200),
    low_stock_threshold INTEGER DEFAULT 10,
    damaged_reason TEXT,
    damaged_date DATE,
    loss_value DECIMAL(10,2) DEFAULT 0,
    approval_status VARCHAR(20) DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
    reported_by UUID REFERENCES users(user_id),
    expiry_date DATE,
    days_left INTEGER GENERATED ALWAYS AS (
        CASE 
            WHEN expiry_date IS NULL THEN NULL
            ELSE EXTRACT(DAY FROM (expiry_date - CURRENT_DATE))
        END
    ) STORED,
    stock_status VARCHAR(20) GENERATED ALWAYS AS (
        CASE 
            WHEN quantity <= (low_stock_threshold * 0.5) THEN 'critical'
            WHEN quantity <= low_stock_threshold THEN 'warning'
            ELSE 'monitor'
        END
    ) STORED
);

-- Comments for documentation
COMMENT ON TABLE products IS 'Tracks fish inventory, including pricing, damage, and expiry';
COMMENT ON COLUMN products.product_id IS 'Unique identifier for each product';
COMMENT ON COLUMN products.sku IS 'Stock Keeping Unit - unique product code';
COMMENT ON COLUMN products.name IS 'Product name (e.g., Atlantic Salmon)';
COMMENT ON COLUMN products.category_id IS 'Reference to product category';
COMMENT ON COLUMN products.quantity IS 'Current stock quantity';
COMMENT ON COLUMN products.selling_type IS 'How product is sold: boxed, weight, or both';
COMMENT ON COLUMN products.price IS 'Selling price per unit';
COMMENT ON COLUMN products.cost_price IS 'Cost price per unit';
COMMENT ON COLUMN products.profit IS 'Calculated profit per unit (price - cost_price)';
COMMENT ON COLUMN products.supplier IS 'Supplier name or company';
COMMENT ON COLUMN products.low_stock_threshold IS 'Threshold for low stock alerts';
COMMENT ON COLUMN products.damaged_reason IS 'Reason for product damage';
COMMENT ON COLUMN products.damaged_date IS 'Date when product was damaged';
COMMENT ON COLUMN products.loss_value IS 'Financial loss due to damage';
COMMENT ON COLUMN products.approval_status IS 'Approval status for damage reports';
COMMENT ON COLUMN products.reported_by IS 'User who reported the damage';
COMMENT ON COLUMN products.expiry_date IS 'Product expiry date';
COMMENT ON COLUMN products.days_left IS 'Calculated days until expiry';
COMMENT ON COLUMN products.stock_status IS 'Calculated stock status (critical, warning, monitor)';

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_selling_type ON products(selling_type);
CREATE INDEX IF NOT EXISTS idx_products_stock_status ON products(stock_status);
CREATE INDEX IF NOT EXISTS idx_products_expiry ON products(expiry_date);
CREATE INDEX IF NOT EXISTS idx_products_supplier ON products(supplier);
CREATE INDEX IF NOT EXISTS idx_products_approval_status ON products(approval_status);

-- Row Level Security (RLS) policies
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Policy: Business owners can view all products
CREATE POLICY products_select_all ON products
    FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- Policy: Business owners can insert products
CREATE POLICY products_insert_owner ON products
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Policy: Business owners can update products
CREATE POLICY products_update_owner ON products
    FOR UPDATE
    USING (auth.uid() IS NOT NULL);

-- Policy: Business owners can delete products
CREATE POLICY products_delete_owner ON products
    FOR DELETE
    USING (auth.uid() IS NOT NULL);

-- Function to validate product data
CREATE OR REPLACE FUNCTION validate_product_data()
RETURNS TRIGGER AS $$
BEGIN
    -- Ensure price is positive
    IF NEW.price <= 0 THEN
        RAISE EXCEPTION 'Product price must be positive';
    END IF;
    
    -- Ensure cost_price is positive
    IF NEW.cost_price <= 0 THEN
        RAISE EXCEPTION 'Product cost price must be positive';
    END IF;
    
    -- Ensure quantity is not negative
    IF NEW.quantity < 0 THEN
        RAISE EXCEPTION 'Product quantity cannot be negative';
    END IF;
    
    -- Ensure low_stock_threshold is positive
    IF NEW.low_stock_threshold <= 0 THEN
        RAISE EXCEPTION 'Low stock threshold must be positive';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to validate product data
CREATE TRIGGER validate_product_data_trigger
    BEFORE INSERT OR UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION validate_product_data();

-- Sample data for development
-- Note: These will need actual category_id values from the product_categories table
-- INSERT INTO products (sku, name, category_id, quantity, selling_type, price, cost_price, supplier, low_stock_threshold, expiry_date) VALUES
-- ('SALM-001', 'Atlantic Salmon', 'category-uuid-here', 50, 'both', 25.99, 18.50, 'Ocean Fresh Suppliers', 10, CURRENT_DATE + INTERVAL '7 days'),
-- ('COD-001', 'Fresh Cod', 'category-uuid-here', 30, 'weight', 22.50, 16.00, 'Atlantic Fish Co.', 8, CURRENT_DATE + INTERVAL '5 days'),
-- ('TUNA-001', 'Yellowfin Tuna', 'category-uuid-here', 15, 'boxed', 45.00, 32.00, 'Pacific Seafood Ltd.', 5, CURRENT_DATE + INTERVAL '10 days');
