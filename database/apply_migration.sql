-- =====================================================
-- Apply Migration: Add user_id column to damaged_products table
-- Run this script in Supabase SQL Editor
-- =====================================================

-- Step 1: Add user_id column to damaged_products table for data isolation
ALTER TABLE damaged_products 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(user_id) ON DELETE CASCADE;

-- Step 2: Update existing records to set user_id based on the product's user_id
-- This ensures existing damaged products are properly associated with users
UPDATE damaged_products 
SET user_id = (
    SELECT p.user_id 
    FROM products p 
    WHERE p.product_id = damaged_products.product_id
)
WHERE user_id IS NULL;

-- Step 3: Make user_id NOT NULL after updating existing records
ALTER TABLE damaged_products 
ALTER COLUMN user_id SET NOT NULL;

-- Step 4: Add comment for the new column
COMMENT ON COLUMN damaged_products.user_id IS 'Data isolation: damaged products belong to specific user';

-- Step 5: Create index for better query performance on user_id
CREATE INDEX IF NOT EXISTS idx_damaged_products_user_id ON damaged_products(user_id);

-- Step 6: Update the damaged_products_detailed view to include user_id
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
JOIN product_categories pc ON p.category_id = pc.category_id
LEFT JOIN users reporter ON dp.reported_by = reporter.user_id
LEFT JOIN users approver ON dp.approved_by = approver.user_id
ORDER BY dp.created_at DESC;

-- Step 7: Grant appropriate permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON damaged_products TO authenticated;
GRANT SELECT ON damaged_products_detailed TO authenticated;

-- Verification query - run this to check if migration was successful
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'damaged_products' 
    AND column_name = 'user_id';

-- Success message
SELECT 'Migration completed successfully! The damaged_products table now has proper data isolation.' AS status;
