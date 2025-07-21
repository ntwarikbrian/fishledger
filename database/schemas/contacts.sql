-- =====================================================
-- Contacts Table Schema
-- Stores business contact information (suppliers/customers)
-- Optimized for cost efficiency with appropriate field sizes
-- =====================================================

-- Contacts table for business contact information
CREATE TABLE IF NOT EXISTS contacts (
    contact_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE, -- Data isolation: contacts belong to specific user
    company_name VARCHAR(200),                    -- Optional company name (max 200 chars for cost efficiency)
    contact_name VARCHAR(200) NOT NULL,           -- Required contact person name
    email VARCHAR(255),                           -- Optional email (standard email length)
    phone_number VARCHAR(20),                     -- Optional phone (international format support)
    contact_type VARCHAR(20) NOT NULL CHECK (contact_type IN ('supplier', 'customer')), -- Business relationship type
    address TEXT,                                 -- Optional address (using TEXT for flexibility)
    email_verified BOOLEAN DEFAULT FALSE,         -- Whether email address has been verified
    preferred_contact_method VARCHAR(20) DEFAULT 'email' CHECK (preferred_contact_method IN ('email', 'phone', 'both')), -- Preferred communication method
    email_notifications BOOLEAN DEFAULT TRUE,     -- Whether contact wants to receive email notifications
    last_contacted TIMESTAMP WITH TIME ZONE,      -- When this contact was last messaged
    total_messages_sent INTEGER DEFAULT 0,        -- Total number of messages sent to this contact
    notes TEXT,                                   -- Additional notes about the contact
    added_by UUID NOT NULL REFERENCES users(user_id), -- User who added this contact
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, -- When contact was created
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP  -- When contact was last updated
);

-- Comments for documentation
COMMENT ON TABLE contacts IS 'Stores business contact information (suppliers/customers) with messaging preferences';
COMMENT ON COLUMN contacts.contact_id IS 'Unique identifier for each contact';
COMMENT ON COLUMN contacts.company_name IS 'Company or business name';
COMMENT ON COLUMN contacts.contact_name IS 'Contact person name';
COMMENT ON COLUMN contacts.email IS 'Contact email address';
COMMENT ON COLUMN contacts.phone_number IS 'Contact phone number';
COMMENT ON COLUMN contacts.contact_type IS 'Type of contact: supplier or customer';
COMMENT ON COLUMN contacts.address IS 'Contact physical address';
COMMENT ON COLUMN contacts.email_verified IS 'Whether email address has been verified';
COMMENT ON COLUMN contacts.preferred_contact_method IS 'Preferred method for communication';
COMMENT ON COLUMN contacts.email_notifications IS 'Whether contact wants to receive email notifications';
COMMENT ON COLUMN contacts.last_contacted IS 'Timestamp of last message sent to this contact';
COMMENT ON COLUMN contacts.total_messages_sent IS 'Total count of messages sent to this contact';
COMMENT ON COLUMN contacts.notes IS 'Additional notes about the contact';
COMMENT ON COLUMN contacts.added_by IS 'User who added this contact';
COMMENT ON COLUMN contacts.created_at IS 'Timestamp when contact was created';
COMMENT ON COLUMN contacts.updated_at IS 'Timestamp when contact was last updated';

-- Indexes for performance and cost optimization
CREATE INDEX IF NOT EXISTS idx_contacts_type ON contacts(contact_type);
CREATE INDEX IF NOT EXISTS idx_contacts_company_name ON contacts(company_name) WHERE company_name IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contacts_contact_name ON contacts(contact_name);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contacts_added_by ON contacts(added_by);
CREATE INDEX IF NOT EXISTS idx_contacts_created_at ON contacts(created_at);
CREATE INDEX IF NOT EXISTS idx_contacts_email_verified ON contacts(email_verified);
CREATE INDEX IF NOT EXISTS idx_contacts_preferred_method ON contacts(preferred_contact_method);
CREATE INDEX IF NOT EXISTS idx_contacts_email_notifications ON contacts(email_notifications);
CREATE INDEX IF NOT EXISTS idx_contacts_last_contacted ON contacts(last_contacted);

-- Composite index for common search patterns
CREATE INDEX IF NOT EXISTS idx_contacts_search ON contacts(contact_type, contact_name, company_name);
CREATE INDEX IF NOT EXISTS idx_contacts_messaging ON contacts(email_notifications, preferred_contact_method) WHERE email IS NOT NULL;

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_contacts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update the updated_at field
CREATE TRIGGER trigger_contacts_updated_at
    BEFORE UPDATE ON contacts
    FOR EACH ROW
    EXECUTE FUNCTION update_contacts_updated_at();

-- Row Level Security (RLS) policies
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Policy: Business owners can view all contacts
CREATE POLICY contacts_select_all ON contacts
    FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- Policy: Business owners can insert contacts
CREATE POLICY contacts_insert_owner ON contacts
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Policy: Business owners can update contacts
CREATE POLICY contacts_update_owner ON contacts
    FOR UPDATE
    USING (auth.uid() IS NOT NULL);

-- Policy: Business owners can delete contacts
CREATE POLICY contacts_delete_owner ON contacts
    FOR DELETE
    USING (auth.uid() IS NOT NULL);

-- Sample data for development
-- Note: These will need actual user_id values from the users table
-- INSERT INTO contacts (company_name, contact_name, email, phone_number, contact_type, address, email_verified, preferred_contact_method, email_notifications, notes, added_by) VALUES
-- ('Fresh Fish Market', 'John Doe', 'orders@freshfishmarket.com', '+1-555-1001', 'customer', '123 Market Street, Downtown', TRUE, 'email', TRUE, 'Regular customer, prefers morning deliveries', 'user-uuid-here'),
-- ('Ocean Suppliers Ltd', 'Jane Smith', 'supply@oceansuppliers.com', '+1-555-2001', 'supplier', '456 Industrial Ave, Port District', TRUE, 'both', TRUE, 'Primary supplier for fresh fish', 'user-uuid-here'),
-- ('Seafood Wholesale Co.', 'Mike Johnson', 'bulk@seafoodwholesale.com', '+1-555-1003', 'customer', '789 Wholesale District, Industrial Zone', FALSE, 'email', TRUE, 'Bulk orders only, payment terms 30 days', 'user-uuid-here'),
-- ('Atlantic Fish Co.', 'Sarah Wilson', 'sales@atlanticfish.com', '+1-555-2002', 'supplier', '321 Harbor Road, Fishing District', TRUE, 'phone', FALSE, 'Backup supplier, call for urgent orders', 'user-uuid-here');
