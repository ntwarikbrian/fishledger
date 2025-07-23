-- =====================================================
-- DEPOSITS TABLE SCHEMA
-- Independent deposits management system
-- =====================================================

-- Create deposits table
CREATE TABLE IF NOT EXISTS deposits (
    -- Primary key
    deposit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Data isolation
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE, -- Data isolation: deposits belong to specific user

    -- Deposit information
    date_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deposit_type VARCHAR(10) NOT NULL CHECK (deposit_type IN ('momo', 'bank', 'boss')),
    account_name VARCHAR(255) NOT NULL,
    account_number VARCHAR(50),
    amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
    to_recipient VARCHAR(100), -- For boss type deposits, specifies who (boss, manager, etc.)

    -- Image storage (Cloudinary integration)
    deposit_image_url TEXT,

    -- Approval workflow
    approval VARCHAR(10) DEFAULT 'pending' CHECK (approval IN ('pending', 'approved', 'rejected')),

    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID REFERENCES users(user_id) ON DELETE SET NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_deposits_date_time ON deposits(date_time);
CREATE INDEX IF NOT EXISTS idx_deposits_deposit_type ON deposits(deposit_type);
CREATE INDEX IF NOT EXISTS idx_deposits_approval ON deposits(approval);
CREATE INDEX IF NOT EXISTS idx_deposits_created_by ON deposits(created_by);
CREATE INDEX IF NOT EXISTS idx_deposits_account_name ON deposits(account_name);

-- Create composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_deposits_type_approval ON deposits(deposit_type, approval);
CREATE INDEX IF NOT EXISTS idx_deposits_date_approval ON deposits(date_time, approval);
CREATE INDEX IF NOT EXISTS idx_deposits_created_by_approval ON deposits(created_by, approval);

-- Add foreign key constraints (assuming users table exists)
-- ALTER TABLE deposits ADD CONSTRAINT fk_deposits_created_by FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE CASCADE;
-- ALTER TABLE deposits ADD CONSTRAINT fk_deposits_updated_by FOREIGN KEY (updated_by) REFERENCES users(user_id) ON DELETE SET NULL;

-- Add comments for documentation
COMMENT ON TABLE deposits IS 'Independent deposits management system for tracking cash deposits';
COMMENT ON COLUMN deposits.deposit_id IS 'Unique identifier for each deposit';
COMMENT ON COLUMN deposits.date_time IS 'Date and time when the deposit was made';
COMMENT ON COLUMN deposits.deposit_type IS 'Type of deposit: momo, bank, or boss';
COMMENT ON COLUMN deposits.account_name IS 'Name of the account where deposit was made';
COMMENT ON COLUMN deposits.account_number IS 'Account number (optional)';
COMMENT ON COLUMN deposits.amount IS 'Amount of the deposit';
COMMENT ON COLUMN deposits.deposit_image_url IS 'URL to deposit proof image stored in Cloudinary';
COMMENT ON COLUMN deposits.approval IS 'Approval status: pending, approved, or rejected';
COMMENT ON COLUMN deposits.created_at IS 'Timestamp when record was created';
COMMENT ON COLUMN deposits.created_by IS 'User who created the deposit record';
COMMENT ON COLUMN deposits.updated_at IS 'Timestamp when record was last updated';
COMMENT ON COLUMN deposits.updated_by IS 'User who last updated the deposit record';

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_deposits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_deposits_updated_at
    BEFORE UPDATE ON deposits
    FOR EACH ROW
    EXECUTE FUNCTION update_deposits_updated_at();
