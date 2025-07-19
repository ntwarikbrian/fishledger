-- =====================================================
-- Sales Table Schema
-- Redesigned for simplified sales transactions
-- =====================================================

-- Sales table for individual product sales transactions
CREATE TABLE IF NOT EXISTS sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,

    -- Quantities sold
    boxes_quantity INTEGER DEFAULT 0 NOT NULL, -- Number of boxes sold
    kg_quantity DECIMAL(8,2) DEFAULT 0 NOT NULL, -- Kg sold (using smaller precision for cost efficiency)

    -- Pricing at time of sale
    box_price DECIMAL(8,2) NOT NULL, -- Price per box at time of sale
    kg_price DECIMAL(8,2) NOT NULL, -- Price per kg at time of sale

    -- Profit tracking
    profit_per_box DECIMAL(8,2) DEFAULT 0 NOT NULL, -- Profit per box (selling price - cost price)
    profit_per_kg DECIMAL(8,2) DEFAULT 0 NOT NULL, -- Profit per kg (selling price - cost price)

    -- Total amount for this sale
    total_amount DECIMAL(10,2) NOT NULL, -- Total amount calculated

    -- Partial payment tracking
    amount_paid DECIMAL(10,2) DEFAULT 0 NOT NULL, -- Amount already paid (for partial payments)
    remaining_amount DECIMAL(10,2) DEFAULT 0 NOT NULL, -- Outstanding balance (total_amount - amount_paid)

    -- Sale timestamp
    date_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Payment information
    payment_status VARCHAR(10) DEFAULT 'pending' CHECK (payment_status IN ('paid', 'pending', 'partial')),
    payment_method VARCHAR(15) CHECK (payment_method IN ('momo_pay', 'cash', 'bank_transfer')),

    -- User who performed the sale
    performed_by UUID NOT NULL REFERENCES users(user_id),

    -- Client information (independent UUID, not linked to contacts table)
    client_id UUID, -- Independent client identifier
    client_name VARCHAR(100), -- Client name (required even if not in contacts)
    email_address VARCHAR(150), -- Client email
    phone VARCHAR(15) -- Client phone (using smaller field for cost efficiency)
);

-- Comments for documentation
COMMENT ON TABLE sales IS 'Individual product sales transactions';
COMMENT ON COLUMN sales.id IS 'Unique identifier for each sale';
COMMENT ON COLUMN sales.product_id IS 'Reference to the product sold';
COMMENT ON COLUMN sales.boxes_quantity IS 'Number of boxes sold';
COMMENT ON COLUMN sales.kg_quantity IS 'Kg sold (loose weight)';
COMMENT ON COLUMN sales.box_price IS 'Price per box at time of sale';
COMMENT ON COLUMN sales.kg_price IS 'Price per kg at time of sale';
COMMENT ON COLUMN sales.profit_per_box IS 'Profit per box (selling price - cost price)';
COMMENT ON COLUMN sales.profit_per_kg IS 'Profit per kg (selling price - cost price)';
COMMENT ON COLUMN sales.total_amount IS 'Total amount for this sale';
COMMENT ON COLUMN sales.amount_paid IS 'Amount already paid (for partial payments)';
COMMENT ON COLUMN sales.remaining_amount IS 'Outstanding balance (total_amount - amount_paid)';
COMMENT ON COLUMN sales.date_time IS 'Date and time of sale';
COMMENT ON COLUMN sales.payment_status IS 'Payment status (paid, pending, partial)';
COMMENT ON COLUMN sales.payment_method IS 'Method of payment (cash, card, transfer)';
COMMENT ON COLUMN sales.performed_by IS 'User who performed the sale';
COMMENT ON COLUMN sales.client_id IS 'Independent client identifier (not linked to any table)';
COMMENT ON COLUMN sales.client_name IS 'Name of the client/customer';
COMMENT ON COLUMN sales.email_address IS 'Email address of the client';
COMMENT ON COLUMN sales.phone IS 'Phone number of the client';

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sales_product ON sales(product_id);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(date_time);
CREATE INDEX IF NOT EXISTS idx_sales_payment_status ON sales(payment_status);
CREATE INDEX IF NOT EXISTS idx_sales_performed_by ON sales(performed_by);
CREATE INDEX IF NOT EXISTS idx_sales_client_name ON sales(client_name);
CREATE INDEX IF NOT EXISTS idx_sales_client_id ON sales(client_id);
CREATE INDEX IF NOT EXISTS idx_sales_profit_per_box ON sales(profit_per_box);
CREATE INDEX IF NOT EXISTS idx_sales_profit_per_kg ON sales(profit_per_kg);

-- Row Level Security (RLS) policies
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

-- Policy: Business owners can view all sales
CREATE POLICY sales_select_all ON sales
    FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- Policy: Business owners can insert sales
CREATE POLICY sales_insert_owner ON sales
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Policy: Business owners can update sales
CREATE POLICY sales_update_owner ON sales
    FOR UPDATE
    USING (auth.uid() IS NOT NULL);

-- Policy: Business owners can delete sales
CREATE POLICY sales_delete_owner ON sales
    FOR DELETE
    USING (auth.uid() IS NOT NULL);

-- Function to validate sale data
CREATE OR REPLACE FUNCTION validate_sale_data()
RETURNS TRIGGER AS $$
BEGIN
    -- Ensure at least one quantity is positive
    IF NEW.boxes_quantity <= 0 AND NEW.kg_quantity <= 0 THEN
        RAISE EXCEPTION 'At least one of boxes_quantity or kg_quantity must be positive';
    END IF;

    -- Ensure total_amount is positive
    IF NEW.total_amount <= 0 THEN
        RAISE EXCEPTION 'Sale total amount must be positive';
    END IF;

    -- Ensure pricing fields are not negative
    IF NEW.box_price < 0 OR NEW.kg_price < 0 THEN
        RAISE EXCEPTION 'Prices cannot be negative';
    END IF;

    -- Ensure profit fields are not null (can be negative for losses)
    IF NEW.profit_per_box IS NULL OR NEW.profit_per_kg IS NULL THEN
        RAISE EXCEPTION 'Profit fields cannot be null';
    END IF;

    -- Ensure client_name is provided
    IF NEW.client_name IS NULL OR LENGTH(TRIM(NEW.client_name)) = 0 THEN
        RAISE EXCEPTION 'Client name is required';
    END IF;

    -- Calculate and validate total amount
    DECLARE
        calculated_total DECIMAL(10,2);
    BEGIN
        calculated_total := (NEW.boxes_quantity * NEW.box_price) + (NEW.kg_quantity * NEW.kg_price);

        -- Allow small rounding differences (within 0.01)
        IF ABS(NEW.total_amount - calculated_total) > 0.01 THEN
            RAISE EXCEPTION 'Total amount does not match calculated total. Expected: %, Got: %', calculated_total, NEW.total_amount;
        END IF;
    END;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to validate sale data
CREATE TRIGGER validate_sale_data_trigger
    BEFORE INSERT OR UPDATE ON sales
    FOR EACH ROW
    EXECUTE FUNCTION validate_sale_data();

-- Sample data for development
-- Note: These will need actual product_id and user_id values from the respective tables
-- INSERT INTO sales (product_id, boxes_quantity, kg_quantity, box_price, kg_price, total_amount, payment_status, payment_method, performed_by, client_name, email_address, phone) VALUES
-- ('product-uuid-here', 2, 5.5, 25.99, 1.30, 59.13, 'paid', 'cash', 'user-uuid-here', 'John Smith', 'john@email.com', '+1-555-1001'),
-- ('product-uuid-here', 0, 10.0, 0, 1.50, 15.00, 'pending', 'card', 'user-uuid-here', 'Jane Doe', 'jane@email.com', '+1-555-1002'),
-- ('product-uuid-here', 5, 0, 22.50, 0, 112.50, 'paid', 'transfer', 'user-uuid-here', 'Ocean Restaurant', 'orders@oceanrestaurant.com', '+1-555-1003');
