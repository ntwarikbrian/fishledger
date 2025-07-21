-- =====================================================
-- TRANSACTIONS TABLE SCHEMA
-- Comprehensive transaction management system
-- =====================================================

-- Transactions table for comprehensive transaction management
CREATE TABLE IF NOT EXISTS transactions (
    -- Primary key
    transaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Reference to sales table
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,

    -- Transaction timestamp (copied from sales for quick access)
    date_time TIMESTAMP WITH TIME ZONE NOT NULL,

    -- Product information (denormalized for performance)
    product_name VARCHAR(255) NOT NULL,

    -- Client information (denormalized for performance)
    client_name VARCHAR(255) NOT NULL,

    -- Quantity information
    boxes_quantity INTEGER DEFAULT 0 NOT NULL,
    kg_quantity DECIMAL(10,3) DEFAULT 0 NOT NULL,

    -- Financial information
    total_amount DECIMAL(10,2) NOT NULL,

    -- Payment status and method
    payment_status VARCHAR(10) DEFAULT 'pending' CHECK (payment_status IN ('paid', 'pending', 'partial')),
    payment_method VARCHAR(15) CHECK (payment_method IN ('momo_pay', 'cash', 'bank_transfer')),

    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- User who created/updated the transaction
    created_by UUID NOT NULL REFERENCES users(user_id),
    updated_by UUID REFERENCES users(user_id)
);

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_transactions_sale_id ON transactions(sale_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date_time ON transactions(date_time);
CREATE INDEX IF NOT EXISTS idx_transactions_payment_status ON transactions(payment_status);
CREATE INDEX IF NOT EXISTS idx_transactions_payment_method ON transactions(payment_method);
CREATE INDEX IF NOT EXISTS idx_transactions_client_name ON transactions(client_name);
CREATE INDEX IF NOT EXISTS idx_transactions_product_name ON transactions(product_name);
CREATE INDEX IF NOT EXISTS idx_transactions_created_by ON transactions(created_by);
CREATE INDEX IF NOT EXISTS idx_transactions_updated_by ON transactions(updated_by);

-- Create composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_transactions_status_method ON transactions(payment_status, payment_method);
CREATE INDEX IF NOT EXISTS idx_transactions_date_status ON transactions(date_time, payment_status);

-- Row Level Security (RLS) policies
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Policy: Business owners can view all transactions
CREATE POLICY transactions_select_all ON transactions
    FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- Policy: Business owners can insert transactions
CREATE POLICY transactions_insert_own ON transactions
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Policy: Business owners can update their own transactions
CREATE POLICY transactions_update_own ON transactions
    FOR UPDATE
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);

-- Policy: Business owners can delete their own transactions
CREATE POLICY transactions_delete_own ON transactions
    FOR DELETE
    USING (auth.uid() IS NOT NULL);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_transactions_updated_at
    BEFORE UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_transactions_updated_at();

-- Create function to automatically create transaction from sale
CREATE OR REPLACE FUNCTION create_transaction_from_sale()
RETURNS TRIGGER AS $$
DECLARE
    product_name_val VARCHAR(255);
BEGIN
    -- Get product name from products table
    SELECT name INTO product_name_val
    FROM products
    WHERE product_id = NEW.product_id;

    -- Insert transaction record
    INSERT INTO transactions (
        sale_id,
        date_time,
        product_name,
        client_name,
        boxes_quantity,
        kg_quantity,
        total_amount,
        payment_status,
        payment_method,
        created_by,
        updated_by
    ) VALUES (
        NEW.id,
        NEW.date_time,
        COALESCE(product_name_val, 'Unknown Product'),
        COALESCE(NEW.client_name, 'Walk-in Customer'), -- Handle null client_name
        NEW.boxes_quantity,
        NEW.kg_quantity,
        NEW.total_amount,
        NEW.payment_status,
        NEW.payment_method,
        NEW.performed_by,
        NEW.performed_by -- Set updated_by to same user on creation
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically create transaction when sale is created
CREATE TRIGGER trigger_create_transaction_from_sale
    AFTER INSERT ON sales
    FOR EACH ROW
    EXECUTE FUNCTION create_transaction_from_sale();

-- Create function to update transaction when sale is updated
CREATE OR REPLACE FUNCTION update_transaction_from_sale()
RETURNS TRIGGER AS $$
DECLARE
    product_name_val VARCHAR(255);
BEGIN
    -- Get product name from products table
    SELECT name INTO product_name_val
    FROM products
    WHERE product_id = NEW.product_id;

    -- Update corresponding transaction record
    UPDATE transactions SET
        date_time = NEW.date_time,
        product_name = COALESCE(product_name_val, 'Unknown Product'),
        client_name = COALESCE(NEW.client_name, 'Walk-in Customer'), -- Handle null client_name
        boxes_quantity = NEW.boxes_quantity,
        kg_quantity = NEW.kg_quantity,
        total_amount = NEW.total_amount,
        payment_status = NEW.payment_status,
        payment_method = NEW.payment_method,
        updated_at = CURRENT_TIMESTAMP,
        updated_by = NEW.performed_by -- Track who updated the sale (and thus the transaction)
    WHERE sale_id = NEW.id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update transaction when sale is updated
CREATE TRIGGER trigger_update_transaction_from_sale
    AFTER UPDATE ON sales
    FOR EACH ROW
    EXECUTE FUNCTION update_transaction_from_sale();

-- Add comments for documentation
COMMENT ON TABLE transactions IS 'Comprehensive transaction management system for tracking all financial transactions';
COMMENT ON COLUMN transactions.transaction_id IS 'Unique identifier for each transaction';
COMMENT ON COLUMN transactions.sale_id IS 'Reference to the originating sale record';
COMMENT ON COLUMN transactions.date_time IS 'Transaction timestamp copied from sales for performance';
COMMENT ON COLUMN transactions.product_name IS 'Product name denormalized for quick access';
COMMENT ON COLUMN transactions.client_name IS 'Client name denormalized for quick access';
COMMENT ON COLUMN transactions.deposit_id IS 'External deposit or transaction reference ID';
COMMENT ON COLUMN transactions.deposit_type IS 'Type of deposit: momo, bank, or boss';
COMMENT ON COLUMN transactions.account_number IS 'Account number for bank transfers';
COMMENT ON COLUMN transactions.reference IS 'Additional reference information';
COMMENT ON COLUMN transactions.image_url IS 'URL to receipt or proof image';
COMMENT ON COLUMN transactions.created_by IS 'User who created the transaction';
COMMENT ON COLUMN transactions.updated_by IS 'User who last updated the transaction';
