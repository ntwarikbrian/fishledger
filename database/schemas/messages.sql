-- =====================================================
-- Messages Table Schema
-- Logs outgoing or internal communications
-- =====================================================

-- Messages table for outgoing or internal communications
CREATE TABLE IF NOT EXISTS messages (
    message_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_id UUID NOT NULL, -- Single recipient ID (user, worker, or contact)
    recipient_type VARCHAR(20) NOT NULL CHECK (recipient_type IN ('user', 'worker', 'contact')),
    subject VARCHAR(200),
    content TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'pending')),
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    sent_by UUID NOT NULL REFERENCES users(user_id) -- user_id or worker_id
);

-- Comments for documentation
COMMENT ON TABLE messages IS 'Logs outgoing or internal communications';
COMMENT ON COLUMN messages.message_id IS 'Unique identifier for each message';
COMMENT ON COLUMN messages.recipient_id IS 'ID of the recipient (user, worker, or contact)';
COMMENT ON COLUMN messages.recipient_type IS 'Type of recipient (user, worker, contact)';
COMMENT ON COLUMN messages.subject IS 'Message subject line';
COMMENT ON COLUMN messages.content IS 'Message content';
COMMENT ON COLUMN messages.status IS 'Message delivery status (sent, failed, pending)';
COMMENT ON COLUMN messages.sent_at IS 'Timestamp when message was sent';
COMMENT ON COLUMN messages.sent_by IS 'User or worker who sent the message';

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_id, recipient_type);
CREATE INDEX IF NOT EXISTS idx_messages_sent_by ON messages(sent_by);
CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status);
CREATE INDEX IF NOT EXISTS idx_messages_sent_at ON messages(sent_at);

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

-- Sample data for development
-- Note: These will need actual recipient_id and user_id values from their respective tables
-- INSERT INTO messages (recipient_id, recipient_type, subject, content, status, sent_by) VALUES
-- ('contact-uuid-here', 'contact', 'New Fish Arrival', 'We have fresh salmon available today!', 'sent', 'user-uuid-here'),
-- ('worker-uuid-here', 'worker', 'Task Assignment', 'Please check the cold storage temperature.', 'sent', 'user-uuid-here');
