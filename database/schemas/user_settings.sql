-- =====================================================
-- User Settings Table Schema
-- Stores user preferences, email credentials, and WhatsApp settings
-- =====================================================

-- User settings table for storing user preferences and messaging credentials
CREATE TABLE IF NOT EXISTS user_settings (
    setting_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE, -- Owner of these settings
    
    -- Basic Settings
    currency VARCHAR(3) DEFAULT 'USD' CHECK (currency IN ('USD', 'RWF')), -- User's preferred currency
    language VARCHAR(5) DEFAULT 'en' CHECK (language IN ('en', 'rw')), -- User's preferred language
    
    -- Email Configuration for Sending Messages
    email_address VARCHAR(255), -- Email address for sending emails
    email_name VARCHAR(200), -- Display name for outgoing emails
    app_password VARCHAR(255), -- App password for email authentication (encrypted)
    email_host VARCHAR(255) DEFAULT 'smtp.gmail.com', -- SMTP server host
    email_port INTEGER DEFAULT 587, -- SMTP server port
    use_tls BOOLEAN DEFAULT TRUE, -- Use TLS encryption for email
    
    -- WhatsApp Integration via WHAPI
    whapi_apikey VARCHAR(255), -- WHAPI API key for WhatsApp messaging
    instance_id VARCHAR(100), -- WHAPI instance ID
    whapi_phone_number VARCHAR(20), -- Phone number associated with WHAPI
    provider_url VARCHAR(500), -- WHAPI provider URL
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create unique index to ensure one settings record per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_settings_currency ON user_settings(currency);
CREATE INDEX IF NOT EXISTS idx_user_settings_language ON user_settings(language);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_settings_updated_at
    BEFORE UPDATE ON user_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_user_settings_updated_at();

-- Comments for documentation
COMMENT ON TABLE user_settings IS 'Stores user preferences, messaging credentials, and application settings';
COMMENT ON COLUMN user_settings.setting_id IS 'Unique identifier for each setting record';
COMMENT ON COLUMN user_settings.user_id IS 'User who owns these settings';
COMMENT ON COLUMN user_settings.currency IS 'User preferred currency (USD or RWF)';
COMMENT ON COLUMN user_settings.language IS 'User preferred language (en or rw)';
COMMENT ON COLUMN user_settings.email_address IS 'Email address for sending emails';
COMMENT ON COLUMN user_settings.email_name IS 'Display name for outgoing emails';
COMMENT ON COLUMN user_settings.app_password IS 'App password for email authentication (encrypted)';
COMMENT ON COLUMN user_settings.email_host IS 'SMTP server hostname';
COMMENT ON COLUMN user_settings.email_port IS 'SMTP server port number';
COMMENT ON COLUMN user_settings.use_tls IS 'Whether to use TLS encryption for email';
COMMENT ON COLUMN user_settings.whapi_apikey IS 'WHAPI API key for WhatsApp messaging';
COMMENT ON COLUMN user_settings.instance_id IS 'WHAPI instance ID';
COMMENT ON COLUMN user_settings.whapi_phone_number IS 'Phone number associated with WHAPI';
COMMENT ON COLUMN user_settings.provider_url IS 'WHAPI provider URL';
COMMENT ON COLUMN user_settings.created_at IS 'Timestamp when record was created';
COMMENT ON COLUMN user_settings.updated_at IS 'Timestamp when record was last updated';
