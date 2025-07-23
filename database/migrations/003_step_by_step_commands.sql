-- =====================================================
-- Migration 003: Step-by-Step Commands
-- Run these commands one by one if the full migration fails
-- =====================================================

-- Step 1: Remove unused columns from contacts table
-- Run each ALTER TABLE command separately:

ALTER TABLE contacts DROP COLUMN IF EXISTS company_name;

ALTER TABLE contacts DROP COLUMN IF EXISTS address;

ALTER TABLE contacts DROP COLUMN IF EXISTS email_verified;

ALTER TABLE contacts DROP COLUMN IF EXISTS preferred_contact_method;

ALTER TABLE contacts DROP COLUMN IF EXISTS email_notifications;

ALTER TABLE contacts DROP COLUMN IF EXISTS last_contacted;

ALTER TABLE contacts DROP COLUMN IF EXISTS total_messages_sent;

ALTER TABLE contacts DROP COLUMN IF EXISTS notes;

-- Step 2: Drop old indexes
DROP INDEX IF EXISTS idx_contacts_company_name;

DROP INDEX IF EXISTS idx_contacts_email_verified;

DROP INDEX IF EXISTS idx_contacts_preferred_method;

DROP INDEX IF EXISTS idx_contacts_email_notifications;

DROP INDEX IF EXISTS idx_contacts_last_contacted;

DROP INDEX IF EXISTS idx_contacts_search;

DROP INDEX IF EXISTS idx_contacts_messaging;

-- Step 3: Create new indexes
CREATE INDEX IF NOT EXISTS idx_contacts_type ON contacts(contact_type);

CREATE INDEX IF NOT EXISTS idx_contacts_contact_name ON contacts(contact_name);

CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email) WHERE email IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_contacts_added_by ON contacts(added_by);

CREATE INDEX IF NOT EXISTS idx_contacts_created_at ON contacts(created_at);

CREATE INDEX IF NOT EXISTS idx_contacts_search_simple ON contacts(contact_type, contact_name);

-- Step 4: Update comments
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

-- Step 5: Drop message_templates table
DROP TRIGGER IF EXISTS trigger_update_message_templates_updated_at ON message_templates;

DROP FUNCTION IF EXISTS update_message_templates_updated_at();

DROP TABLE IF EXISTS message_templates CASCADE;

-- Step 6: Record migration (create table first if needed)
CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(50) PRIMARY KEY,
    description TEXT,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO schema_migrations (version, description)
VALUES ('003', 'Restructure contacts table and remove message_templates table for messaging system integration')
ON CONFLICT (version) DO NOTHING;
