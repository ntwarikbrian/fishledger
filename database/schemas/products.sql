-- =====================================================
-- Products Table Schema
-- Tracks fish inventory, including pricing, damage, and expiry
-- =====================================================

-- Products table for fish inventory management with box/kg support
CREATE TABLE IF NOT EXISTS products (
    product_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE, -- Data isolation: products belong to specific user
    name VARCHAR(200) NOT NULL,
    category_id UUID NOT NULL REFERENCES product_categories(category_id),

    -- Inventory fields for box/kg management
    quantity_box INTEGER DEFAULT 0 NOT NULL, -- Number of full boxes in stock (renamed from boxed_quantity)
    box_to_kg_ratio DECIMAL(10,2) DEFAULT 20 NOT NULL, -- How many kg per box (e.g., 20kg per box)
    quantity_kg DECIMAL(10,2) DEFAULT 0 NOT NULL, -- Loose kg stock (renamed from kg_quantity)

    -- Cost pricing fields
    cost_per_box DECIMAL(10,2) NOT NULL, -- Cost price per box for calculating profit margins
    cost_per_kg DECIMAL(10,2) NOT NULL, -- Cost price per kilogram for calculating profit margins

    -- Selling pricing fields
    price_per_box DECIMAL(10,2) NOT NULL, -- Selling price per box (renamed from boxed_selling_price)
    price_per_kg DECIMAL(10,2) NOT NULL, -- Selling price per kg (renamed from kg_selling_price)

    -- Calculated profit fields
    profit_per_box DECIMAL(10,2) GENERATED ALWAYS AS (price_per_box - cost_per_box) STORED,
    profit_per_kg DECIMAL(10,2) GENERATED ALWAYS AS (price_per_kg - cost_per_kg) STORED,

    -- Stock management
    boxed_low_stock_threshold INTEGER DEFAULT 10 NOT NULL, -- Low stock threshold for boxed quantity alerts

    -- Product lifecycle tracking
    expiry_date DATE,
    days_left INTEGER, -- Days remaining until expiry (calculated by application or trigger)

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT chk_cost_per_box_positive CHECK (cost_per_box >= 0),
    CONSTRAINT chk_cost_per_kg_positive CHECK (cost_per_kg >= 0),
    CONSTRAINT chk_price_per_box_positive CHECK (price_per_box >= 0),
    CONSTRAINT chk_price_per_kg_positive CHECK (price_per_kg >= 0),
    CONSTRAINT chk_quantity_box_non_negative CHECK (quantity_box >= 0),
    CONSTRAINT chk_quantity_kg_non_negative CHECK (quantity_kg >= 0),
    CONSTRAINT chk_box_to_kg_ratio_positive CHECK (box_to_kg_ratio > 0),
    CONSTRAINT chk_boxed_low_stock_threshold_positive CHECK (boxed_low_stock_threshold >= 0)
);

-- Comments for documentation
COMMENT ON TABLE products IS 'Tracks fish inventory with box/kg management, pricing, damage, and expiry - isolated per user';
COMMENT ON COLUMN products.product_id IS 'Unique identifier for each product';
COMMENT ON COLUMN products.user_id IS 'Reference to user who owns this product - ensures data isolation';
COMMENT ON COLUMN products.name IS 'Product name (e.g., Atlantic Salmon)';
COMMENT ON COLUMN products.category_id IS 'Reference to product category';
COMMENT ON COLUMN products.quantity_box IS 'Number of full boxes in stock';
COMMENT ON COLUMN products.quantity_kg IS 'Loose kg stock available';
COMMENT ON COLUMN products.box_to_kg_ratio IS 'How many kg per box (e.g., 20kg per box)';
COMMENT ON COLUMN products.cost_per_box IS 'Cost price per box for calculating profit margins';
COMMENT ON COLUMN products.cost_per_kg IS 'Cost price per kilogram for calculating profit margins';
COMMENT ON COLUMN products.price_per_box IS 'Selling price per box';
COMMENT ON COLUMN products.price_per_kg IS 'Selling price per kilogram';
COMMENT ON COLUMN products.profit_per_box IS 'Profit margin per box (selling price - cost price)';
COMMENT ON COLUMN products.profit_per_kg IS 'Profit margin per kilogram (selling price - cost price)';
COMMENT ON COLUMN products.boxed_low_stock_threshold IS 'Low stock threshold for boxed quantity alerts';
COMMENT ON COLUMN products.expiry_date IS 'Product expiry date';
COMMENT ON COLUMN products.days_left IS 'Days remaining until expiry (calculated)';
COMMENT ON COLUMN products.created_at IS 'Timestamp when product was created';
COMMENT ON COLUMN products.updated_at IS 'Timestamp when product was last updated';

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id); -- Critical for data isolation
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_expiry_date ON products(expiry_date);
CREATE INDEX IF NOT EXISTS idx_products_quantity_box ON products(quantity_box);
CREATE INDEX IF NOT EXISTS idx_products_quantity_kg ON products(quantity_kg);
CREATE INDEX IF NOT EXISTS idx_products_cost_per_box ON products(cost_per_box);
CREATE INDEX IF NOT EXISTS idx_products_cost_per_kg ON products(cost_per_kg);
CREATE INDEX IF NOT EXISTS idx_products_boxed_low_stock ON products(boxed_low_stock_threshold);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at);

-- Composite index for user-specific queries
CREATE INDEX IF NOT EXISTS idx_products_user_category ON products(user_id, category_id);
CREATE INDEX IF NOT EXISTS idx_products_user_name ON products(user_id, name);

-- Remove RLS policies as we'll handle data isolation through application logic
-- This ensures compatibility with custom JWT authentication

-- Function to validate product data with new structure
CREATE OR REPLACE FUNCTION validate_product_data()
RETURNS TRIGGER AS $$
BEGIN
    -- Ensure cost prices are positive
    IF NEW.cost_per_box <= 0 THEN
        RAISE EXCEPTION 'Cost per box must be positive';
    END IF;

    IF NEW.cost_per_kg <= 0 THEN
        RAISE EXCEPTION 'Cost per kg must be positive';
    END IF;

    -- Ensure selling prices are positive
    IF NEW.price_per_box <= 0 THEN
        RAISE EXCEPTION 'Price per box must be positive';
    END IF;

    IF NEW.price_per_kg <= 0 THEN
        RAISE EXCEPTION 'Price per kg must be positive';
    END IF;

    -- Ensure box quantities are not negative
    IF NEW.quantity_box < 0 THEN
        RAISE EXCEPTION 'Box quantity cannot be negative';
    END IF;

    -- Ensure kg quantities are not negative
    IF NEW.quantity_kg < 0 THEN
        RAISE EXCEPTION 'Kg quantity cannot be negative';
    END IF;

    -- Ensure box_to_kg_ratio is positive
    IF NEW.box_to_kg_ratio <= 0 THEN
        RAISE EXCEPTION 'Box to kg ratio must be positive';
    END IF;

    -- Ensure boxed_low_stock_threshold is positive
    IF NEW.boxed_low_stock_threshold <= 0 THEN
        RAISE EXCEPTION 'Boxed low stock threshold must be positive';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to validate product data
CREATE TRIGGER validate_product_data_trigger
    BEFORE INSERT OR UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION validate_product_data();

-- Function to calculate days left until expiry
CREATE OR REPLACE FUNCTION calculate_days_left()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate days left until expiry
    IF NEW.expiry_date IS NOT NULL THEN
        NEW.days_left = NEW.expiry_date - CURRENT_DATE;
    ELSE
        NEW.days_left = NULL;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to calculate days left
CREATE TRIGGER calculate_days_left_trigger
    BEFORE INSERT OR UPDATE OF expiry_date ON products
    FOR EACH ROW
    EXECUTE FUNCTION calculate_days_left();

-- Sample data for development
-- Note: These will need actual category_id values from the product_categories table
-- INSERT INTO products (name, category_id, quantity_box, box_to_kg_ratio, quantity_kg, cost_per_box, cost_per_kg, price_per_box, price_per_kg, boxed_low_stock_threshold, expiry_date) VALUES
-- ('Atlantic Salmon', 'category-uuid-here', 50, 20.0, 15.5, 18.50, 0.93, 25.99, 1.30, 10, CURRENT_DATE + INTERVAL '7 days'),
-- ('Fresh Cod', 'category-uuid-here', 30, 15.0, 8.2, 16.00, 1.07, 22.50, 1.50, 8, CURRENT_DATE + INTERVAL '5 days'),
-- ('Yellowfin Tuna', 'category-uuid-here', 15, 25.0, 12.0, 32.00, 1.28, 45.00, 1.80, 5, CURRENT_DATE + INTERVAL '10 days');
