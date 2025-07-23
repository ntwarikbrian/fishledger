-- =====================================================
-- Migration: Restructure Contacts Table and Remove Message Templates
-- Version: 003
-- Description: Removes unused columns from contacts table and drops message_templates table
-- Date: 2025-01-23
-- =====================================================

-- Check if migration has already been applied
DO $$
BEGIN
    -- Check if we've already removed the specified columns
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contacts' 
        AND column_name IN ('company_name', 'address', 'email_verified', 'preferred_contact_method', 
                           'email_notifications', 'last_contacted', 'total_messages_sent', 'notes')
    ) THEN
        
        -- Remove unused columns from contacts table
        ALTER TABLE contacts 
        DROP COLUMN IF EXISTS company_name,
        DROP COLUMN IF EXISTS address,
        DROP COLUMN IF EXISTS email_verified,
        DROP COLUMN IF EXISTS preferred_contact_method,
        DROP COLUMN IF EXISTS email_notifications,
        DROP COLUMN IF EXISTS last_contacted,
        DROP COLUMN IF EXISTS total_messages_sent,
        DROP COLUMN IF EXISTS notes;
        
        -- Drop related indexes for removed columns
        DROP INDEX IF EXISTS idx_contacts_company_name;
        DROP INDEX IF EXISTS idx_contacts_email_verified;
        DROP INDEX IF EXISTS idx_contacts_preferred_method;
        DROP INDEX IF EXISTS idx_contacts_email_notifications;
        DROP INDEX IF EXISTS idx_contacts_last_contacted;
        DROP INDEX IF EXISTS idx_contacts_search;
        DROP INDEX IF EXISTS idx_contacts_messaging;
        
        -- Recreate essential indexes for remaining columns
        CREATE INDEX IF NOT EXISTS idx_contacts_type ON contacts(contact_type);
        CREATE INDEX IF NOT EXISTS idx_contacts_contact_name ON contacts(contact_name);
        CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email) WHERE email IS NOT NULL;
        CREATE INDEX IF NOT EXISTS idx_contacts_added_by ON contacts(added_by);
        CREATE INDEX IF NOT EXISTS idx_contacts_created_at ON contacts(created_at);
        
        -- Create composite index for common search patterns (simplified)
        CREATE INDEX IF NOT EXISTS idx_contacts_search_simple ON contacts(contact_type, contact_name);
        
        -- Update table and column comments for remaining columns
        COMMENT ON TABLE contacts IS 'Stores simplified business contact information for messaging system integration';
        COMMENT ON COLUMN contacts.contact_id IS 'Unique identifier for each contact';
        COMMENT ON COLUMN contacts.user_id IS 'User who owns this contact (for data isolation)';
        COMMENT ON COLUMN contacts.contact_name IS 'Contact person name (required)';
        COMMENT ON COLUMN contacts.email IS 'Contact email address for messaging';
        COMMENT ON COLUMN contacts.phone_number IS 'Contact phone number';
        COMMENT ON COLUMN contacts.contact_type IS 'Type of contact: supplier or customer';
        COMMENT ON COLUMN contacts.added_by IS 'User who added this contact';
        COMMENT ON COLUMN contacts.created_at IS 'Timestamp when contact was created';
        COMMENT ON COLUMN contacts.updated_at IS 'Timestamp when contact was last updated';
        
        RAISE NOTICE 'Migration 003: Contacts table restructured successfully';
        
    ELSE
        RAISE NOTICE 'Migration 003: Contacts table already restructured, skipping';
    END IF;
    
    -- Drop message_templates table if it exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'message_templates') THEN
        
        -- Drop dependent objects first
        DROP TRIGGER IF EXISTS trigger_update_message_templates_updated_at ON message_templates;
        DROP FUNCTION IF EXISTS update_message_templates_updated_at();
        
        -- Drop the table
        DROP TABLE IF EXISTS message_templates CASCADE;
        
        RAISE NOTICE 'Migration 003: message_templates table removed successfully';
        
    ELSE
        RAISE NOTICE 'Migration 003: message_templates table does not exist, skipping';
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Migration 003 failed: %', SQLERRM;
END $$;

-- Record this migration
INSERT INTO schema_migrations (version, description)
VALUES ('003', 'Restructure contacts table and remove message_templates table for messaging system integration')
ON CONFLICT (version) DO NOTHING;

-- =====================================================
-- End of Migration 003
-- =====================================================
