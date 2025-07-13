# Database Schema Updates Summary

This document summarizes all the changes made to the database schema files.

## Updated Files

### 1. `main.sql` - Updated ✅
**Location**: `database/main.sql`

**Changes Made**:
- Updated `sales_audit` table to include approval workflow fields
- Added new columns:
  - `approval_status` VARCHAR(20) NOT NULL DEFAULT 'pending' 
  - `approved_by` UUID REFERENCES users(user_id)
  - `approval_timestamp` TIMESTAMPTZ
  - `approval_reason` TEXT
- Added new indexes:
  - `idx_sales_audit_approval_status`
  - `idx_sales_audit_approved_by`
- Added comprehensive column comments for documentation

### 2. `sales_audit.sql` - Original (No Changes) ✅
**Location**: `database/sales_audit.sql`

**Status**: Kept as original base schema without approval workflow
**Purpose**: Maintains the base table structure for reference

### 3. Migration Files - New ✅
**Location**: `database/migrations/`

**New Files Created**:
- `001_add_audit_approval_workflow.sql` - Migration to add approval workflow
- `README.md` - Migration documentation and instructions
- `apply-audit-migration.md` - Step-by-step application guide
- `run-migration.js` - Node.js helper script

## Schema Changes Summary

### Sales Audit Table Enhancement

**Before** (Original):
```sql
CREATE TABLE sales_audit (
    audit_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    audit_type VARCHAR(50) NOT NULL CHECK (audit_type IN ('quantity_change', 'payment_update', 'deletion')),
    boxes_change INTEGER DEFAULT 0,
    kg_change DECIMAL(10,2) DEFAULT 0.00,
    reason TEXT NOT NULL,
    performed_by UUID NOT NULL REFERENCES users(user_id),
    old_values JSONB,
    new_values JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

**After** (Updated in main.sql):
```sql
CREATE TABLE sales_audit (
    audit_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    audit_type VARCHAR(50) NOT NULL CHECK (audit_type IN ('quantity_change', 'payment_update', 'deletion')),
    boxes_change INTEGER DEFAULT 0,
    kg_change DECIMAL(10,2) DEFAULT 0.00,
    reason TEXT NOT NULL,
    performed_by UUID NOT NULL REFERENCES users(user_id),
    
    -- NEW: Approval workflow fields
    approval_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
    approved_by UUID REFERENCES users(user_id),
    approval_timestamp TIMESTAMPTZ,
    approval_reason TEXT,
    
    old_values JSONB,
    new_values JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### New Indexes Added

```sql
CREATE INDEX IF NOT EXISTS idx_sales_audit_approval_status ON sales_audit(approval_status);
CREATE INDEX IF NOT EXISTS idx_sales_audit_approved_by ON sales_audit(approved_by);
```

### New Column Comments

```sql
COMMENT ON COLUMN sales_audit.approval_status IS 'Approval status: pending, approved, or rejected';
COMMENT ON COLUMN sales_audit.approved_by IS 'User who approved or rejected the audit record';
COMMENT ON COLUMN sales_audit.approval_timestamp IS 'When the audit record was approved or rejected';
COMMENT ON COLUMN sales_audit.approval_reason IS 'Reason for approval or rejection';
```

## Backend Implementation Status

### ✅ Completed
- **Handlers**: `backend/src/handlers/salesAudit.ts`
  - `approveAuditHandler` - Approve audit records
  - `rejectAuditHandler` - Reject audit records
  - Enhanced `getAuditsHandler` with approval filtering

- **Routes**: `backend/src/routes/salesAudit.routes.ts`
  - `PUT /api/sales-audit/:id/approve`
  - `PUT /api/sales-audit/:id/reject`

- **API Services**: `src/lib/api/services/audit.ts`
  - Complete audit service with approval operations
  - TypeScript interfaces and validation

### ✅ Frontend Updates
- **Sales Component**: Enhanced with edit/delete functionality
- **Audit Interface**: Updated to match database schema
- **Action Buttons**: Approval/rejection buttons implemented

## Migration Strategy

### Option 1: Fresh Installation
Use the updated `main.sql` file for new installations.

### Option 2: Existing Database Migration
Apply the migration file `001_add_audit_approval_workflow.sql` to existing databases.

### Option 3: Manual Application
Follow the step-by-step guide in `apply-audit-migration.md`.

## Verification Steps

After applying changes:

1. **Check Table Structure**:
```sql
\d sales_audit
```

2. **Verify New Columns**:
```sql
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'sales_audit' 
AND column_name LIKE '%approval%';
```

3. **Test Backend Endpoints**:
- `GET /api/sales-audit?approval_status=pending`
- `PUT /api/sales-audit/{id}/approve`
- `PUT /api/sales-audit/{id}/reject`

## File Structure

```
database/
├── main.sql                          # ✅ Updated with approval workflow
├── sales_audit.sql                   # ✅ Original base schema (unchanged)
├── migrations/
│   ├── 001_add_audit_approval_workflow.sql  # ✅ New migration
│   ├── README.md                     # ✅ Migration documentation
│   ├── apply-audit-migration.md      # ✅ Application guide
│   └── run-migration.js              # ✅ Helper script
└── SCHEMA_UPDATES.md                 # ✅ This summary document
```

## Next Steps

1. **Apply Migration**: Choose your preferred method from the migration guide
2. **Test Backend**: Restart backend and verify endpoints work
3. **Test Frontend**: Verify approval buttons function correctly
4. **Production Deployment**: Apply migration to production database when ready
