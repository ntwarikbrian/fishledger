-- =====================================================
-- Users Table Schema
-- Stores account information for business owners
-- =====================================================

-- Enable UUID extension for generating unique identifiers
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table for business owners authentication
CREATE TABLE IF NOT EXISTS users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_name VARCHAR(200) NOT NULL UNIQUE, -- Business name must be unique for data isolation
    owner_name VARCHAR(200) NOT NULL,
    email_address VARCHAR(255) UNIQUE NOT NULL,
    phone_number VARCHAR(20),
    password VARCHAR(255) NOT NULL, -- Will store hashed password (required for authentication)
    is_active BOOLEAN DEFAULT true, -- Account status for security
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Trigger to update updated_at timestamp for users
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE users IS 'Stores account information for business owners with complete data isolation';
COMMENT ON COLUMN users.user_id IS 'Unique identifier for each user - used for data isolation';
COMMENT ON COLUMN users.business_name IS 'Name of the business - must be unique across all users';
COMMENT ON COLUMN users.owner_name IS 'Full name of the business owner';
COMMENT ON COLUMN users.email_address IS 'User email address, used for login - must be unique';
COMMENT ON COLUMN users.phone_number IS 'User phone number';
COMMENT ON COLUMN users.password IS 'Hashed password for security - required for authentication';
COMMENT ON COLUMN users.is_active IS 'Account status - inactive accounts cannot login';
COMMENT ON COLUMN users.created_at IS 'Timestamp when user account was created';
COMMENT ON COLUMN users.last_login IS 'Timestamp of last successful login';
COMMENT ON COLUMN users.updated_at IS 'Timestamp when user record was last updated';

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email_address);
CREATE INDEX IF NOT EXISTS idx_users_business_name ON users(business_name);
CREATE INDEX IF NOT EXISTS idx_users_owner_name ON users(owner_name);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Remove RLS policies as we'll handle data isolation through application logic
-- This ensures compatibility with custom JWT authentication

-- Sample data for development (business owner)
INSERT INTO users (business_name, owner_name, email_address, phone_number, password) VALUES
('AquaFresh Fish Market', 'John Smith', 'admin@aquafresh.com', '+1-555-0000', '$2b$10$example_hash_here')
ON CONFLICT (email_address) DO NOTHING;
