-- =====================================================
-- Migration: Restructure User Settings Table
-- Version: 002
-- Description: Restructures user_settings table to include email credentials and WhatsApp settings
-- Date: 2025-01-23
-- =====================================================

-- Check if migration has already been applied
DO $$
BEGIN
    -- Check if the new columns already exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_settings' 
        AND column_name = 'email_address'
    ) THEN
        
        -- Drop existing columns that are being removed
        ALTER TABLE user_settings 
        DROP COLUMN IF EXISTS timezone,
        DROP COLUMN IF EXISTS date_format,
        DROP COLUMN IF EXISTS theme,
        DROP COLUMN IF EXISTS email_notifications,
        DROP COLUMN IF EXISTS sms_notifications,
        DROP COLUMN IF EXISTS low_stock_alerts,
        DROP COLUMN IF EXISTS daily_reports,
        DROP COLUMN IF EXISTS weekly_reports,
        DROP COLUMN IF EXISTS monthly_reports,
        DROP COLUMN IF EXISTS auto_reporting,
        DROP COLUMN IF EXISTS business_hours_start,
        DROP COLUMN IF EXISTS business_hours_end,
        DROP COLUMN IF EXISTS working_days;
        
        -- Add new email configuration columns
        ALTER TABLE user_settings 
        ADD COLUMN email_address VARCHAR(255),
        ADD COLUMN email_name VARCHAR(200),
        ADD COLUMN app_password VARCHAR(255),
        ADD COLUMN email_host VARCHAR(255) DEFAULT 'smtp.gmail.com',
        ADD COLUMN email_port INTEGER DEFAULT 587,
        ADD COLUMN use_tls BOOLEAN DEFAULT TRUE;
        
        -- Add WhatsApp integration columns
        ALTER TABLE user_settings 
        ADD COLUMN whapi_apikey VARCHAR(255),
        ADD COLUMN instance_id VARCHAR(100),
        ADD COLUMN whapi_phone_number VARCHAR(20),
        ADD COLUMN provider_url VARCHAR(500);
        
        -- Drop existing indexes that may reference removed columns
        DROP INDEX IF EXISTS idx_user_settings_currency;
        DROP INDEX IF EXISTS idx_user_settings_language;
        
        -- Recreate essential indexes
        CREATE INDEX IF NOT EXISTS idx_user_settings_currency ON user_settings(currency);
        CREATE INDEX IF NOT EXISTS idx_user_settings_language ON user_settings(language);
        
        -- Update table and column comments
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
        
        RAISE NOTICE 'Migration 002: user_settings table restructured successfully';
        
    ELSE
        RAISE NOTICE 'Migration 002: user_settings table already restructured, skipping';
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Migration 002 failed: %', SQLERRM;
END $$;

-- Record this migration
INSERT INTO schema_migrations (version, description)
VALUES ('002', 'Restructure user_settings table with email credentials and WhatsApp settings')
ON CONFLICT (version) DO NOTHING;

-- =====================================================
-- End of Migration 002
-- =====================================================
