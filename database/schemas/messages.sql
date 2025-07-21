-- =====================================================
-- Messages Table Schema
-- Logs outgoing or internal communications
-- =====================================================

-- Messages table for outgoing or internal communications
CREATE TABLE IF NOT EXISTS messages (
    message_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE, -- Data isolation: messages belong to specific user
    recipient_id UUID NOT NULL, -- Single recipient ID (user, worker, or contact)
    recipient_type VARCHAR(20) NOT NULL CHECK (recipient_type IN ('user', 'worker', 'contact')),
    recipient_email VARCHAR(255), -- Email address of the recipient (extracted from contacts/users/workers)
    message_type VARCHAR(20) DEFAULT 'email' CHECK (message_type IN ('email', 'internal')), -- Type of message
    delivery_method VARCHAR(20) DEFAULT 'email' CHECK (delivery_method IN ('email', 'system')), -- How message is delivered
    subject VARCHAR(200),
    content TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('sent', 'failed', 'pending')),
    error_message TEXT, -- Store error details if delivery fails
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    delivered_at TIMESTAMP WITH TIME ZONE, -- When message was successfully delivered
    sent_by UUID NOT NULL REFERENCES users(user_id), -- user_id who sent the message
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Comments for documentation
COMMENT ON TABLE messages IS 'Logs outgoing or internal communications with email support';
COMMENT ON COLUMN messages.message_id IS 'Unique identifier for each message';
COMMENT ON COLUMN messages.recipient_id IS 'ID of the recipient (user, worker, or contact)';
COMMENT ON COLUMN messages.recipient_type IS 'Type of recipient (user, worker, contact)';
COMMENT ON COLUMN messages.recipient_email IS 'Email address of the recipient for email delivery';
COMMENT ON COLUMN messages.message_type IS 'Type of message (email for external, internal for system)';
COMMENT ON COLUMN messages.delivery_method IS 'Method used to deliver the message (email, system)';
COMMENT ON COLUMN messages.subject IS 'Message subject line';
COMMENT ON COLUMN messages.content IS 'Message content';
COMMENT ON COLUMN messages.status IS 'Message delivery status (sent, failed, pending)';
COMMENT ON COLUMN messages.error_message IS 'Error details if message delivery failed';
COMMENT ON COLUMN messages.sent_at IS 'Timestamp when message was sent';
COMMENT ON COLUMN messages.delivered_at IS 'Timestamp when message was successfully delivered';
COMMENT ON COLUMN messages.sent_by IS 'User who sent the message';
COMMENT ON COLUMN messages.created_at IS 'Timestamp when message record was created';
COMMENT ON COLUMN messages.updated_at IS 'Timestamp when message record was last updated';

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_id, recipient_type);
CREATE INDEX IF NOT EXISTS idx_messages_sent_by ON messages(sent_by);
CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status);
CREATE INDEX IF NOT EXISTS idx_messages_sent_at ON messages(sent_at);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_email ON messages(recipient_email);
CREATE INDEX IF NOT EXISTS idx_messages_message_type ON messages(message_type);
CREATE INDEX IF NOT EXISTS idx_messages_delivery_method ON messages(delivery_method);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_updated_at ON messages(updated_at);

-- Row Level Security (RLS) policies
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Policy: Business owners can view all messages
CREATE POLICY messages_select_all ON messages
    FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- Policy: Business owners can insert messages
CREATE POLICY messages_insert_owner ON messages
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Policy: Business owners can update messages
CREATE POLICY messages_update_owner ON messages
    FOR UPDATE
    USING (auth.uid() IS NOT NULL);

-- Policy: Business owners can delete messages
CREATE POLICY messages_delete_owner ON messages
    FOR DELETE
    USING (auth.uid() IS NOT NULL);

-- Trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_messages_updated_at
    BEFORE UPDATE ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_messages_updated_at();

-- Function to update contact statistics when messages are sent
CREATE OR REPLACE FUNCTION update_contact_message_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update contact statistics if recipient is a contact
    IF NEW.recipient_type = 'contact' AND NEW.status = 'sent' THEN
        UPDATE contacts
        SET
            total_messages_sent = total_messages_sent + 1,
            last_contacted = NEW.sent_at,
            updated_at = CURRENT_TIMESTAMP
        WHERE contact_id = NEW.recipient_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_contact_message_stats
    AFTER INSERT OR UPDATE ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_contact_message_stats();

-- View to get messages with recipient details
CREATE OR REPLACE VIEW message_recipients AS
SELECT
    m.message_id,
    m.recipient_id,
    m.recipient_type,
    m.recipient_email,
    m.message_type,
    m.delivery_method,
    m.subject,
    m.content,
    m.status,
    m.error_message,
    m.sent_at,
    m.delivered_at,
    m.sent_by,
    m.created_at,
    m.updated_at,

    -- Recipient details based on type
    CASE
        WHEN m.recipient_type = 'contact' THEN c.contact_name
        WHEN m.recipient_type = 'user' THEN u.owner_name
        WHEN m.recipient_type = 'worker' THEN w.full_name
    END AS recipient_name,

    CASE
        WHEN m.recipient_type = 'contact' THEN c.email
        WHEN m.recipient_type = 'user' THEN u.email_address
        WHEN m.recipient_type = 'worker' THEN w.email
    END AS recipient_email_address,

    CASE
        WHEN m.recipient_type = 'contact' THEN c.company_name
        WHEN m.recipient_type = 'user' THEN u.business_name
        WHEN m.recipient_type = 'worker' THEN NULL
    END AS recipient_company,

    -- Sender details
    sender.owner_name AS sender_name,
    sender.email_address AS sender_email

FROM messages m
LEFT JOIN contacts c ON m.recipient_type = 'contact' AND m.recipient_id = c.contact_id
LEFT JOIN users u ON m.recipient_type = 'user' AND m.recipient_id = u.user_id
LEFT JOIN workers w ON m.recipient_type = 'worker' AND m.recipient_id = w.worker_id
LEFT JOIN users sender ON m.sent_by = sender.user_id;

-- Sample data for development
-- Note: These will need actual recipient_id and user_id values from their respective tables
-- INSERT INTO messages (recipient_id, recipient_type, recipient_email, message_type, delivery_method, subject, content, status, sent_by) VALUES
-- ('contact-uuid-here', 'contact', 'supplier@example.com', 'email', 'email', 'New Fish Arrival', 'We have fresh salmon available today!', 'sent', 'user-uuid-here'),
-- ('worker-uuid-here', 'worker', 'worker@company.com', 'internal', 'system', 'Task Assignment', 'Please check the cold storage temperature.', 'sent', 'user-uuid-here'),
-- ('contact-uuid-here', 'contact', 'customer@example.com', 'email', 'email', 'Special Offer', 'Fresh catch of the day with 20% discount!', 'pending', 'user-uuid-here');
