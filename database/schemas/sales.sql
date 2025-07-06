-- =====================================================
-- Sales Table Schema
-- Logs transaction data for sold products
-- =====================================================

-- Sales table for transaction data of sold products
CREATE TABLE IF NOT EXISTS sales (
    sales_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(product_id),
    selling_method VARCHAR(20) NOT NULL CHECK (selling_method IN ('boxed', 'weight')),
    quantity DECIMAL(10,2) NOT NULL, -- Can be units for boxed or kg for weight
    total_amount DECIMAL(12,2) NOT NULL,
    date_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'partial', 'overdue')),
    payment_method VARCHAR(20) CHECK (payment_method IN ('cash', 'card', 'bank_transfer', 'mobile_money')),
    client_name VARCHAR(200),
    client_email VARCHAR(255),
    client_phone_number VARCHAR(20),
    client_address TEXT
);

-- Comments for documentation
COMMENT ON TABLE sales IS 'Logs transaction data for sold products';
COMMENT ON COLUMN sales.sales_id IS 'Unique identifier for each sale';
COMMENT ON COLUMN sales.product_id IS 'Reference to the product sold';
COMMENT ON COLUMN sales.selling_method IS 'Method of sale: boxed or weight';
COMMENT ON COLUMN sales.quantity IS 'Quantity sold (units for boxed, kg for weight)';
COMMENT ON COLUMN sales.total_amount IS 'Total amount for this sale';
COMMENT ON COLUMN sales.date_time IS 'Date and time of sale';
COMMENT ON COLUMN sales.payment_status IS 'Payment status (pending, paid, partial, overdue)';
COMMENT ON COLUMN sales.payment_method IS 'Method of payment (cash, card, bank_transfer, mobile_money)';
COMMENT ON COLUMN sales.client_name IS 'Name of the client/customer';
COMMENT ON COLUMN sales.client_email IS 'Email address of the client';
COMMENT ON COLUMN sales.client_phone_number IS 'Phone number of the client';
COMMENT ON COLUMN sales.client_address IS 'Address of the client';

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sales_product ON sales(product_id);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(date_time);
CREATE INDEX IF NOT EXISTS idx_sales_payment_status ON sales(payment_status);
CREATE INDEX IF NOT EXISTS idx_sales_selling_method ON sales(selling_method);
CREATE INDEX IF NOT EXISTS idx_sales_client_name ON sales(client_name);

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
    -- Ensure quantity is positive
    IF NEW.quantity <= 0 THEN
        RAISE EXCEPTION 'Sale quantity must be positive';
    END IF;

    -- Ensure total_amount is positive
    IF NEW.total_amount <= 0 THEN
        RAISE EXCEPTION 'Sale total amount must be positive';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to validate sale data
CREATE TRIGGER validate_sale_data_trigger
    BEFORE INSERT OR UPDATE ON sales
    FOR EACH ROW
    EXECUTE FUNCTION validate_sale_data();

-- Sample data for development
-- Note: These will need actual product_id values from the products table
-- INSERT INTO sales (product_id, selling_method, quantity, total_amount, payment_status, payment_method, client_name, client_email, client_phone_number) VALUES
-- ('product-uuid-here', 'boxed', 5, 129.95, 'paid', 'cash', 'John Smith', 'john@email.com', '+1-555-1001'),
-- ('product-uuid-here', 'weight', 2.5, 56.25, 'pending', 'card', 'Jane Doe', 'jane@email.com', '+1-555-1002'),
-- ('product-uuid-here', 'boxed', 10, 450.00, 'paid', 'bank_transfer', 'Ocean Restaurant', 'orders@oceanrestaurant.com', '+1-555-1003');
