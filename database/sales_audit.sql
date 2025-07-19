-- Sales Audit Trail Table
-- This table tracks all changes made to sales records for auditing purposes

CREATE TABLE IF NOT EXISTS sales_audit (
    audit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sale_id UUID REFERENCES sales(id) ON DELETE SET NULL,
    audit_type VARCHAR(50) NOT NULL CHECK (audit_type IN ('quantity_change', 'payment_method_change', 'deletion')),
    boxes_change INTEGER DEFAULT 0,
    kg_change DECIMAL(10,2) DEFAULT 0.00,
    reason TEXT NOT NULL,
    performed_by UUID NOT NULL REFERENCES users(user_id),
    
    -- Additional metadata for audit trail
    old_values JSONB,
    new_values JSONB,
    
    -- Indexes for better query performance
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_sales_audit_sale_id ON sales_audit(sale_id);
CREATE INDEX IF NOT EXISTS idx_sales_audit_timestamp ON sales_audit(timestamp);
CREATE INDEX IF NOT EXISTS idx_sales_audit_audit_type ON sales_audit(audit_type);
CREATE INDEX IF NOT EXISTS idx_sales_audit_performed_by ON sales_audit(performed_by);

-- Create a trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_sales_audit_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_sales_audit_updated_at
    BEFORE UPDATE ON sales_audit
    FOR EACH ROW
    EXECUTE FUNCTION update_sales_audit_updated_at();

-- Add comments for documentation
COMMENT ON TABLE sales_audit IS 'Audit trail for all sales-related changes';
COMMENT ON COLUMN sales_audit.audit_id IS 'Unique identifier for each audit record';
COMMENT ON COLUMN sales_audit.timestamp IS 'When the audit event occurred';
COMMENT ON COLUMN sales_audit.sale_id IS 'Reference to the sales record that was modified';
COMMENT ON COLUMN sales_audit.audit_type IS 'Type of change: quantity_change, payment_method_change, or deletion';
COMMENT ON COLUMN sales_audit.boxes_change IS 'Change in box quantity (can be negative)';
COMMENT ON COLUMN sales_audit.kg_change IS 'Change in kg quantity (can be negative)';
COMMENT ON COLUMN sales_audit.reason IS 'Description of why the change was made';
COMMENT ON COLUMN sales_audit.performed_by IS 'User who performed the action';
COMMENT ON COLUMN sales_audit.old_values IS 'JSON object containing the old values before change';
COMMENT ON COLUMN sales_audit.new_values IS 'JSON object containing the new values after change';
