-- =====================================================
-- Migration: 001_add_user_id_to_damaged_products
-- Description: Add user_id column to damaged_products table for data isolation
-- Author: System
-- Date: 2025-07-21
-- Version: 1.0.0
-- =====================================================

-- Create schema_migrations table if it doesn't exist (for tracking migrations)
CREATE TABLE IF NOT EXISTS schema_migrations (
    id SERIAL PRIMARY KEY,
    version VARCHAR(50) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    applied_by VARCHAR(100) DEFAULT CURRENT_USER
);

-- Migration metadata
INSERT INTO schema_migrations (version, description, applied_at)
VALUES ('001', 'Add user_id column to damaged_products table for data isolation', NOW())
ON CONFLICT (version) DO NOTHING;

-- Begin transaction for atomic migration
BEGIN;

-- Step 1: Check if user_id column already exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'damaged_products' 
        AND column_name = 'user_id'
    ) THEN
        -- Add user_id column to damaged_products table
        ALTER TABLE damaged_products 
        ADD COLUMN user_id UUID REFERENCES users(user_id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Added user_id column to damaged_products table';
    ELSE
        RAISE NOTICE 'user_id column already exists in damaged_products table';
    END IF;
END $$;

-- Step 2: Update existing records to set user_id based on the product's user_id
-- This ensures existing damaged products are properly associated with users
UPDATE damaged_products 
SET user_id = (
    SELECT p.user_id 
    FROM products p 
    WHERE p.product_id = damaged_products.product_id
)
WHERE user_id IS NULL;

-- Step 3: Verify all records have user_id set
DO $$
DECLARE
    null_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO null_count 
    FROM damaged_products 
    WHERE user_id IS NULL;
    
    IF null_count > 0 THEN
        RAISE EXCEPTION 'Found % damaged_products records without user_id. Migration cannot continue.', null_count;
    END IF;
    
    RAISE NOTICE 'All damaged_products records have user_id set';
END $$;

-- Step 4: Make user_id NOT NULL after updating existing records
ALTER TABLE damaged_products 
ALTER COLUMN user_id SET NOT NULL;

-- Step 5: Add comment for the new column
COMMENT ON COLUMN damaged_products.user_id IS 'Data isolation: damaged products belong to specific user';

-- Step 6: Create index for better query performance on user_id
CREATE INDEX IF NOT EXISTS idx_damaged_products_user_id ON damaged_products(user_id);

-- Step 7: Update the damaged_products_detailed view to include user_id
DROP VIEW IF EXISTS damaged_products_detailed;

CREATE OR REPLACE VIEW damaged_products_detailed AS
SELECT 
    dp.damage_id,
    dp.user_id,
    dp.product_id,
    p.name AS product_name,
    pc.name AS category_name,
    dp.damaged_boxes,
    dp.damaged_kg,
    dp.damaged_reason,
    dp.description,
    dp.damaged_date,
    dp.loss_value,
    dp.damaged_approval,
    dp.approved_date,
    
    -- Reporter information
    reporter.owner_name AS reported_by_name,
    reporter.business_name AS reported_by_business,
    
    -- Approver information
    approver.owner_name AS approved_by_name,
    approver.business_name AS approved_by_business,
    
    dp.created_at,
    dp.updated_at
FROM damaged_products dp
JOIN products p ON dp.product_id = p.product_id
LEFT JOIN product_categories pc ON p.category_id = pc.category_id
LEFT JOIN users reporter ON dp.reported_by = reporter.user_id
LEFT JOIN users approver ON dp.approved_by = approver.user_id
ORDER BY dp.created_at DESC;

-- Step 8: Update view comment
COMMENT ON VIEW damaged_products_detailed IS 'Detailed view of damaged products with product and user information including data isolation';

-- Step 9: Grant appropriate permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON damaged_products TO authenticated;
GRANT SELECT ON damaged_products_detailed TO authenticated;

-- Commit the transaction
COMMIT;

-- Verification and success message
DO $$
DECLARE
    column_exists BOOLEAN;
    record_count INTEGER;
BEGIN
    -- Check if column exists and is NOT NULL
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'damaged_products' 
        AND column_name = 'user_id'
        AND is_nullable = 'NO'
    ) INTO column_exists;
    
    -- Count total records
    SELECT COUNT(*) INTO record_count FROM damaged_products;
    
    IF column_exists THEN
        RAISE NOTICE '✅ Migration 001 completed successfully!';
        RAISE NOTICE '✅ user_id column added to damaged_products table';
        RAISE NOTICE '✅ % existing records updated with user_id', record_count;
        RAISE NOTICE '✅ Data isolation is now enforced for damaged_products';
    ELSE
        RAISE EXCEPTION '❌ Migration 001 failed: user_id column not properly created';
    END IF;
END $$;
