-- =====================================================
-- SALES AUDIT TABLE
-- Tracks all changes made to sales records for auditing
-- =====================================================

-- Sales Audit Trail Table
CREATE TABLE IF NOT EXISTS sales_audit (
    audit_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE, -- Data isolation: audit records belong to specific user
    timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    sale_id UUID REFERENCES sales(id) ON DELETE SET NULL,
    audit_type VARCHAR(50) NOT NULL CHECK (audit_type IN ('quantity_change', 'payment_method_change', 'deletion')),
    boxes_change INTEGER DEFAULT 0,
    kg_change DECIMAL(10,2) DEFAULT 0.00,
    reason TEXT NOT NULL,
    performed_by UUID NOT NULL REFERENCES users(user_id),

    -- Approval workflow fields
    approval_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
    approved_by UUID REFERENCES users(user_id),
    approval_timestamp TIMESTAMPTZ,
    approval_reason TEXT,

    -- Additional metadata for audit trail
    old_values JSONB,
    new_values JSONB,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_sales_audit_user_id ON sales_audit(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_audit_sale_id ON sales_audit(sale_id);
CREATE INDEX IF NOT EXISTS idx_sales_audit_timestamp ON sales_audit(timestamp);
CREATE INDEX IF NOT EXISTS idx_sales_audit_audit_type ON sales_audit(audit_type);
CREATE INDEX IF NOT EXISTS idx_sales_audit_performed_by ON sales_audit(performed_by);
CREATE INDEX IF NOT EXISTS idx_sales_audit_approval_status ON sales_audit(approval_status);
CREATE INDEX IF NOT EXISTS idx_sales_audit_approved_by ON sales_audit(approved_by);

-- Create a trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_sales_audit_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_sales_audit_updated_at
    BEFORE UPDATE ON sales_audit
    FOR EACH ROW
    EXECUTE FUNCTION update_sales_audit_updated_at();

-- Add comments for sales_audit table documentation
COMMENT ON TABLE sales_audit IS 'Audit trail for all sales-related changes with approval workflow';
COMMENT ON COLUMN sales_audit.audit_id IS 'Unique identifier for each audit record';
COMMENT ON COLUMN sales_audit.user_id IS 'User ID for data isolation - ensures audit records belong to specific user';
COMMENT ON COLUMN sales_audit.timestamp IS 'When the audit event occurred';
COMMENT ON COLUMN sales_audit.sale_id IS 'Reference to the sales record that was modified';
COMMENT ON COLUMN sales_audit.audit_type IS 'Type of change: quantity_change, payment_update, or deletion';
COMMENT ON COLUMN sales_audit.boxes_change IS 'Change in box quantity (can be negative)';
COMMENT ON COLUMN sales_audit.kg_change IS 'Change in kg quantity (can be negative)';
COMMENT ON COLUMN sales_audit.reason IS 'Description of why the change was made';
COMMENT ON COLUMN sales_audit.performed_by IS 'User who performed the action';
COMMENT ON COLUMN sales_audit.approval_status IS 'Approval status: pending, approved, or rejected';
COMMENT ON COLUMN sales_audit.approved_by IS 'User who approved or rejected the audit record';
COMMENT ON COLUMN sales_audit.approval_timestamp IS 'When the audit record was approved or rejected';
COMMENT ON COLUMN sales_audit.approval_reason IS 'Reason for approval or rejection';
COMMENT ON COLUMN sales_audit.old_values IS 'JSON object containing the old values before change';
COMMENT ON COLUMN sales_audit.new_values IS 'JSON object containing the new values after change';
