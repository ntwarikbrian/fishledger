-- =====================================================
-- Users Table Schema
-- Stores account information for business owners
-- =====================================================

-- Users table for business owners authentication
CREATE TABLE IF NOT EXISTS users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_name VARCHAR(200) NOT NULL,
    owner_name VARCHAR(200) NOT NULL,
    email_address VARCHAR(255) UNIQUE NOT NULL,
    phone_number VARCHAR(20),
    password VARCHAR(255) NOT NULL, -- Will store hashed password
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE
);

-- Comments for documentation
COMMENT ON TABLE users IS 'Stores account information for business owners';
COMMENT ON COLUMN users.user_id IS 'Unique identifier for each user';
COMMENT ON COLUMN users.business_name IS 'Name of the business';
COMMENT ON COLUMN users.owner_name IS 'Full name of the business owner';
COMMENT ON COLUMN users.email_address IS 'User email address, used for login';
COMMENT ON COLUMN users.phone_number IS 'User phone number';
COMMENT ON COLUMN users.password IS 'Hashed password for security';
COMMENT ON COLUMN users.created_at IS 'Timestamp when user account was created';
COMMENT ON COLUMN users.last_login IS 'Timestamp of last successful login';

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email_address);
CREATE INDEX IF NOT EXISTS idx_users_business_name ON users(business_name);
CREATE INDEX IF NOT EXISTS idx_users_owner_name ON users(owner_name);

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own record
CREATE POLICY users_select_own ON users
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can update their own record
CREATE POLICY users_update_own ON users
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own record (registration)
CREATE POLICY users_insert_own ON users
    FOR INSERT
    WITH CHECK (true); -- Allow registration

-- Sample data for development (business owner)
INSERT INTO users (business_name, owner_name, email_address, phone_number, password) VALUES
('AquaFresh Fish Market', 'John Smith', 'admin@aquafresh.com', '+1-555-0000', '$2b$10$example_hash_here')
ON CONFLICT (email_address) DO NOTHING;
