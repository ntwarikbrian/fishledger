-- =====================================================
-- Message Templates Table Schema
-- Stores reusable message templates for different scenarios
-- =====================================================

-- Message templates table for reusable message templates
CREATE TABLE IF NOT EXISTS message_templates (
    template_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id), -- Owner of this template
    
    -- Template Information
    template_name VARCHAR(200) NOT NULL, -- Name/title of the template
    template_category VARCHAR(50) NOT NULL CHECK (template_category IN ('inventory', 'promotion', 'notification', 'order', 'general')), -- Category of template
    template_type VARCHAR(20) DEFAULT 'email' CHECK (template_type IN ('email', 'internal')), -- Type of template
    
    -- Template Content
    subject_template VARCHAR(200), -- Subject line template with placeholders
    content_template TEXT NOT NULL, -- Message content template with placeholders
    
    -- Template Settings
    is_active BOOLEAN DEFAULT TRUE, -- Whether template is active/available
    is_default BOOLEAN DEFAULT FALSE, -- Whether this is the default template for its category
    use_signature BOOLEAN DEFAULT TRUE, -- Whether to append user's signature
    
    -- Usage Statistics
    usage_count INTEGER DEFAULT 0, -- How many times this template has been used
    last_used TIMESTAMP WITH TIME ZONE, -- When this template was last used
    
    -- Template Variables/Placeholders Documentation
    available_variables JSONB, -- JSON array of available placeholder variables
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Comments for documentation
COMMENT ON TABLE message_templates IS 'Stores reusable message templates for different scenarios';
COMMENT ON COLUMN message_templates.template_id IS 'Unique identifier for each template';
COMMENT ON COLUMN message_templates.user_id IS 'User who owns this template';
COMMENT ON COLUMN message_templates.template_name IS 'Name/title of the template';
COMMENT ON COLUMN message_templates.template_category IS 'Category of template (inventory, promotion, etc.)';
COMMENT ON COLUMN message_templates.template_type IS 'Type of template (email, internal)';
COMMENT ON COLUMN message_templates.subject_template IS 'Subject line with placeholders';
COMMENT ON COLUMN message_templates.content_template IS 'Message content with placeholders';
COMMENT ON COLUMN message_templates.is_active IS 'Whether template is active/available';
COMMENT ON COLUMN message_templates.is_default IS 'Whether this is default for its category';
COMMENT ON COLUMN message_templates.use_signature IS 'Whether to append user signature';
COMMENT ON COLUMN message_templates.usage_count IS 'Number of times template has been used';
COMMENT ON COLUMN message_templates.last_used IS 'When template was last used';
COMMENT ON COLUMN message_templates.available_variables IS 'JSON array of available placeholders';

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_message_templates_user_id ON message_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_message_templates_category ON message_templates(template_category);
CREATE INDEX IF NOT EXISTS idx_message_templates_type ON message_templates(template_type);
CREATE INDEX IF NOT EXISTS idx_message_templates_active ON message_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_message_templates_default ON message_templates(is_default, template_category);
CREATE INDEX IF NOT EXISTS idx_message_templates_usage ON message_templates(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_message_templates_created_at ON message_templates(created_at);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_message_templates_search ON message_templates(user_id, template_category, is_active);

-- Trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_message_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_message_templates_updated_at
    BEFORE UPDATE ON message_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_message_templates_updated_at();

-- Row Level Security (RLS) policies
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own templates
CREATE POLICY message_templates_select_own ON message_templates
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own templates
CREATE POLICY message_templates_insert_own ON message_templates
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own templates
CREATE POLICY message_templates_update_own ON message_templates
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Policy: Users can delete their own templates
CREATE POLICY message_templates_delete_own ON message_templates
    FOR DELETE
    USING (auth.uid() = user_id);

-- Sample data for development
-- Note: These will need actual user_id values from the users table
-- INSERT INTO message_templates (user_id, template_name, template_category, subject_template, content_template, available_variables) VALUES
-- ('user-uuid-here', 'Low Stock Alert', 'inventory', 'Low Stock Alert: {product_name}', 'Dear {contact_name},\n\nWe wanted to inform you that {product_name} is running low in our inventory.\n\nCurrent Stock: {current_quantity}\nRecommended Order: {quantity_needed}\n\nPlease let us know if you would like to place an order.\n\nThank you!', '["product_name", "contact_name", "current_quantity", "quantity_needed"]'),
-- ('user-uuid-here', 'New Product Arrival', 'promotion', 'Fresh {product_name} Now Available!', 'Hello {contact_name},\n\nWe are excited to announce that fresh {product_name} has just arrived!\n\nQuantity Available: {available_quantity}\nPrice: {price_per_unit}\n\nContact us to place your order today.\n\nBest regards!', '["product_name", "contact_name", "available_quantity", "price_per_unit"]'),
-- ('user-uuid-here', 'Order Confirmation', 'order', 'Order Confirmation - {order_id}', 'Dear {contact_name},\n\nThank you for your order!\n\nOrder ID: {order_id}\nTotal Amount: {total_amount}\nExpected Delivery: {delivery_date}\n\nWe will notify you when your order is ready.\n\nThank you for your business!', '["contact_name", "order_id", "total_amount", "delivery_date"]');
