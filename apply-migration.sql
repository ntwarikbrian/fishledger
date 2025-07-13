-- Apply the audit approval workflow migration
-- Copy this SQL and run it in your Supabase SQL Editor

-- Add approval workflow columns to sales_audit table
ALTER TABLE sales_audit 
ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) NOT NULL DEFAULT 'pending' 
    CHECK (approval_status IN ('pending', 'approved', 'rejected'));

ALTER TABLE sales_audit 
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id);

ALTER TABLE sales_audit 
ADD COLUMN IF NOT EXISTS approval_timestamp TIMESTAMPTZ;

ALTER TABLE sales_audit 
ADD COLUMN IF NOT EXISTS approval_reason TEXT;

-- Create indexes for better query performance on new columns
CREATE INDEX IF NOT EXISTS idx_sales_audit_approval_status ON sales_audit(approval_status);
CREATE INDEX IF NOT EXISTS idx_sales_audit_approved_by ON sales_audit(approved_by);

-- Add comments for new columns
COMMENT ON COLUMN sales_audit.approval_status IS 'Approval status: pending, approved, or rejected';
COMMENT ON COLUMN sales_audit.approved_by IS 'User who approved or rejected the audit record';
COMMENT ON COLUMN sales_audit.approval_timestamp IS 'When the audit record was approved or rejected';
COMMENT ON COLUMN sales_audit.approval_reason IS 'Reason for approval or rejection';

-- Update existing records to have pending status (if any exist)
UPDATE sales_audit 
SET approval_status = 'pending' 
WHERE approval_status IS NULL;
