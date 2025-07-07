-- =====================================================
-- Message Settings Table Schema
-- Stores email configuration and messaging preferences
-- =====================================================

-- Message settings table for email configuration and messaging preferences
CREATE TABLE IF NOT EXISTS message_settings (
    setting_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id), -- Owner of these settings
    
    -- Email Configuration
    email_host VARCHAR(255) DEFAULT 'smtp.gmail.com', -- SMTP server host
    email_port INTEGER DEFAULT 587, -- SMTP server port
    email_user VARCHAR(255), -- Email username/address for sending
    email_password VARCHAR(255), -- Email password (encrypted)
    email_from VARCHAR(255), -- Default "from" email address
    email_from_name VARCHAR(200), -- Default "from" name
    
    -- Email Security Settings
    email_use_tls BOOLEAN DEFAULT TRUE, -- Use TLS encryption
    email_use_ssl BOOLEAN DEFAULT FALSE, -- Use SSL encryption
    
    -- Messaging Preferences
    auto_send_enabled BOOLEAN DEFAULT TRUE, -- Enable automatic message sending
    daily_message_limit INTEGER DEFAULT 100, -- Daily message sending limit
    retry_failed_messages BOOLEAN DEFAULT TRUE, -- Retry failed messages
    max_retry_attempts INTEGER DEFAULT 3, -- Maximum retry attempts for failed messages
    
    -- Notification Settings
    notify_on_send_success BOOLEAN DEFAULT FALSE, -- Notify when message sent successfully
    notify_on_send_failure BOOLEAN DEFAULT TRUE, -- Notify when message fails to send
    
    -- Template Settings
    default_signature TEXT, -- Default email signature
    business_logo_url TEXT, -- URL to business logo for emails
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Comments for documentation
COMMENT ON TABLE message_settings IS 'Stores email configuration and messaging preferences for users';
COMMENT ON COLUMN message_settings.setting_id IS 'Unique identifier for each setting record';
COMMENT ON COLUMN message_settings.user_id IS 'User who owns these settings';
COMMENT ON COLUMN message_settings.email_host IS 'SMTP server hostname';
COMMENT ON COLUMN message_settings.email_port IS 'SMTP server port number';
COMMENT ON COLUMN message_settings.email_user IS 'Email username for authentication';
COMMENT ON COLUMN message_settings.email_password IS 'Encrypted email password';
COMMENT ON COLUMN message_settings.email_from IS 'Default sender email address';
COMMENT ON COLUMN message_settings.email_from_name IS 'Default sender display name';
COMMENT ON COLUMN message_settings.email_use_tls IS 'Whether to use TLS encryption';
COMMENT ON COLUMN message_settings.email_use_ssl IS 'Whether to use SSL encryption';
COMMENT ON COLUMN message_settings.auto_send_enabled IS 'Whether automatic sending is enabled';
COMMENT ON COLUMN message_settings.daily_message_limit IS 'Maximum messages per day';
COMMENT ON COLUMN message_settings.retry_failed_messages IS 'Whether to retry failed messages';
COMMENT ON COLUMN message_settings.max_retry_attempts IS 'Maximum retry attempts';
COMMENT ON COLUMN message_settings.notify_on_send_success IS 'Notify on successful sends';
COMMENT ON COLUMN message_settings.notify_on_send_failure IS 'Notify on failed sends';
COMMENT ON COLUMN message_settings.default_signature IS 'Default email signature';
COMMENT ON COLUMN message_settings.business_logo_url IS 'URL to business logo';

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_message_settings_user_id ON message_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_message_settings_created_at ON message_settings(created_at);

-- Ensure one settings record per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_message_settings_unique_user ON message_settings(user_id);

-- Trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_message_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_message_settings_updated_at
    BEFORE UPDATE ON message_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_message_settings_updated_at();

-- Row Level Security (RLS) policies
ALTER TABLE message_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own settings
CREATE POLICY message_settings_select_own ON message_settings
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own settings
CREATE POLICY message_settings_insert_own ON message_settings
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own settings
CREATE POLICY message_settings_update_own ON message_settings
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Policy: Users can delete their own settings
CREATE POLICY message_settings_delete_own ON message_settings
    FOR DELETE
    USING (auth.uid() = user_id);

-- Sample data for development
-- Note: This will need actual user_id values from the users table
-- INSERT INTO message_settings (user_id, email_user, email_from, email_from_name, default_signature) VALUES
-- ('user-uuid-here', 'automatedinventorymessage@gmail.com', 'noreply@aquafresh.com', 'AquaFresh Fish Market', 'Best regards,\nAquaFresh Fish Market Team\nPhone: +1-555-0000\nEmail: admin@aquafresh.com');
