-- =====================================================
-- Automatic Messages Table Schema
-- Handles inventory-triggered automated notifications
-- =====================================================

-- Automatic messages table for inventory-triggered automated notifications
CREATE TABLE IF NOT EXISTS automatic_messages (
    auto_message_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(product_id),
    current_quantity INTEGER NOT NULL,
    recipient_id UUID NOT NULL, -- ID of recipient (user, worker, or contact)
    recipient_type VARCHAR(20) NOT NULL CHECK (recipient_type IN ('user', 'worker', 'contact')),
    quantity_needed INTEGER NOT NULL,
    quantity_triggered INTEGER NOT NULL, -- Threshold that triggered the message
    message_template TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Comments for documentation
COMMENT ON TABLE automatic_messages IS 'Handles inventory-triggered automated notifications';
COMMENT ON COLUMN automatic_messages.auto_message_id IS 'Unique identifier for each automatic message';
COMMENT ON COLUMN automatic_messages.product_id IS 'Reference to the product that triggered the message';
COMMENT ON COLUMN automatic_messages.current_quantity IS 'Current quantity when message was triggered';
COMMENT ON COLUMN automatic_messages.recipient_id IS 'ID of the recipient';
COMMENT ON COLUMN automatic_messages.recipient_type IS 'Type of recipient (user, worker, contact)';
COMMENT ON COLUMN automatic_messages.quantity_needed IS 'Quantity needed to restock';
COMMENT ON COLUMN automatic_messages.quantity_triggered IS 'Threshold quantity that triggered the message';
COMMENT ON COLUMN automatic_messages.message_template IS 'Template for the automatic message';
COMMENT ON COLUMN automatic_messages.created_at IS 'Timestamp when automatic message was created';
COMMENT ON COLUMN automatic_messages.updated_at IS 'Timestamp when automatic message was last updated';

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_automatic_messages_product ON automatic_messages(product_id);
CREATE INDEX IF NOT EXISTS idx_automatic_messages_recipient ON automatic_messages(recipient_id, recipient_type);
CREATE INDEX IF NOT EXISTS idx_automatic_messages_created_at ON automatic_messages(created_at);

-- Row Level Security (RLS) policies
ALTER TABLE automatic_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Business owners can view all automatic messages
CREATE POLICY automatic_messages_select_all ON automatic_messages
    FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- Policy: Business owners can insert automatic messages
CREATE POLICY automatic_messages_insert_owner ON automatic_messages
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Policy: Business owners can update automatic messages
CREATE POLICY automatic_messages_update_owner ON automatic_messages
    FOR UPDATE
    USING (auth.uid() IS NOT NULL);

-- Policy: Business owners can delete automatic messages
CREATE POLICY automatic_messages_delete_owner ON automatic_messages
    FOR DELETE
    USING (auth.uid() IS NOT NULL);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_automatic_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at timestamp
CREATE TRIGGER update_automatic_messages_updated_at_trigger
    BEFORE UPDATE ON automatic_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_automatic_messages_updated_at();

-- Sample data for development
-- Note: These will need actual product_id and recipient_id values from their respective tables
-- INSERT INTO automatic_messages (product_id, current_quantity, recipient_id, recipient_type, quantity_needed, quantity_triggered, message_template) VALUES
-- ('product-uuid-here', 5, 'contact-uuid-here', 'contact', 50, 10, 'Low stock alert: {product_name} is running low. Current: {current_quantity}, Need: {quantity_needed}'),
-- ('product-uuid-here', 2, 'user-uuid-here', 'user', 100, 5, 'Critical stock alert: {product_name} is critically low. Immediate restocking required.');
