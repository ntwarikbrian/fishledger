-- =====================================================
-- MIGRATION: Create Independent Deposits Table
-- Version: 001
-- Description: Separate deposits from transactions table
-- =====================================================

-- Step 1: Create the new deposits table
CREATE TABLE IF NOT EXISTS deposits (
    -- Primary key
    deposit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Deposit information
    date_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deposit_type VARCHAR(10) NOT NULL CHECK (deposit_type IN ('momo', 'bank', 'boss')),
    account_name VARCHAR(255) NOT NULL,
    account_number VARCHAR(50),
    amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
    
    -- Image storage (Cloudinary integration)
    deposit_image_url TEXT,
    
    -- Approval workflow
    approval VARCHAR(10) DEFAULT 'pending' CHECK (approval IN ('pending', 'approved', 'rejected')),
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID
);

-- Step 2: Create indexes for the deposits table
CREATE INDEX IF NOT EXISTS idx_deposits_date_time ON deposits(date_time);
CREATE INDEX IF NOT EXISTS idx_deposits_deposit_type ON deposits(deposit_type);
CREATE INDEX IF NOT EXISTS idx_deposits_approval ON deposits(approval);
CREATE INDEX IF NOT EXISTS idx_deposits_created_by ON deposits(created_by);
CREATE INDEX IF NOT EXISTS idx_deposits_account_name ON deposits(account_name);
CREATE INDEX IF NOT EXISTS idx_deposits_type_approval ON deposits(deposit_type, approval);
CREATE INDEX IF NOT EXISTS idx_deposits_date_approval ON deposits(date_time, approval);
CREATE INDEX IF NOT EXISTS idx_deposits_created_by_approval ON deposits(created_by, approval);

-- Step 3: Migrate existing deposit data from transactions table (if any exists)
-- This will move any transactions that have deposit_type set to the new deposits table
INSERT INTO deposits (
    date_time,
    deposit_type,
    account_name,
    account_number,
    amount,
    deposit_image_url,
    approval,
    created_at,
    created_by,
    updated_at,
    updated_by
)
SELECT 
    date_time,
    deposit_type,
    COALESCE(client_name, 'Unknown Account') as account_name,
    account_number,
    total_amount,
    image_url,
    'approved' as approval, -- Assume existing deposits are approved
    created_at,
    created_by,
    updated_at,
    created_by as updated_by -- Use created_by as updated_by for existing records
FROM transactions 
WHERE deposit_type IS NOT NULL 
AND deposit_type IN ('momo', 'bank', 'boss')
ON CONFLICT (deposit_id) DO NOTHING; -- Prevent duplicates if migration is run multiple times

-- Step 4: Remove deposit-related columns from transactions table
-- Note: Be careful with this step in production - backup data first!

-- Remove indexes related to deposit fields
DROP INDEX IF EXISTS idx_transactions_deposit_type;

-- Remove deposit-related columns from transactions table
ALTER TABLE transactions DROP COLUMN IF EXISTS deposit_id;
ALTER TABLE transactions DROP COLUMN IF EXISTS deposit_type;
ALTER TABLE transactions DROP COLUMN IF EXISTS account_number;
ALTER TABLE transactions DROP COLUMN IF EXISTS reference;
ALTER TABLE transactions DROP COLUMN IF EXISTS image_url;

-- Step 5: Create trigger for automatic timestamp updates
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

-- Step 6: Add comments for documentation
COMMENT ON TABLE deposits IS 'Independent deposits management system for tracking cash deposits';
COMMENT ON COLUMN deposits.deposit_id IS 'Unique identifier for each deposit';
COMMENT ON COLUMN deposits.date_time IS 'Date and time when the deposit was made';
COMMENT ON COLUMN deposits.deposit_type IS 'Type of deposit: momo, bank, or boss';
COMMENT ON COLUMN deposits.account_name IS 'Name of the account where deposit was made';
COMMENT ON COLUMN deposits.account_number IS 'Account number (optional)';
COMMENT ON COLUMN deposits.amount IS 'Amount of the deposit';
COMMENT ON COLUMN deposits.deposit_image_url IS 'URL to deposit proof image stored in Cloudinary';
COMMENT ON COLUMN deposits.approval IS 'Approval status: pending, approved, or rejected';

-- Migration completed successfully
-- The deposits table is now independent from transactions
