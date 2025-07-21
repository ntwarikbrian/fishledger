-- =====================================================
-- Simple Migration: Add user_id to damaged_products
-- Description: Add user_id column to damaged_products table for data isolation
-- Date: 2025-07-21
-- 
-- Instructions:
-- 1. Run this script in Supabase SQL Editor
-- 2. Check the output messages for success confirmation
-- =====================================================

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
        
        RAISE NOTICE '✅ Added user_id column to damaged_products table';
    ELSE
        RAISE NOTICE 'ℹ️  user_id column already exists in damaged_products table';
    END IF;
END $$;

-- Step 2: Update existing records to set user_id based on the product's user_id
-- This ensures existing damaged products are properly associated with users
DO $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE damaged_products 
    SET user_id = (
        SELECT p.user_id 
        FROM products p 
        WHERE p.product_id = damaged_products.product_id
    )
    WHERE user_id IS NULL;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RAISE NOTICE '✅ Updated % existing damaged_products records with user_id', updated_count;
END $$;

-- Step 3: Verify all records have user_id set
DO $$
DECLARE
    null_count INTEGER;
    total_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO null_count 
    FROM damaged_products 
    WHERE user_id IS NULL;
    
    SELECT COUNT(*) INTO total_count 
    FROM damaged_products;
    
    IF null_count > 0 THEN
        RAISE EXCEPTION '❌ Found % damaged_products records without user_id out of % total. Migration cannot continue.', null_count, total_count;
    END IF;
    
    RAISE NOTICE '✅ All % damaged_products records have user_id set', total_count;
END $$;

-- Step 4: Make user_id NOT NULL after updating existing records
DO $$
BEGIN
    -- Check if column is already NOT NULL
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'damaged_products' 
        AND column_name = 'user_id'
        AND is_nullable = 'YES'
    ) THEN
        ALTER TABLE damaged_products 
        ALTER COLUMN user_id SET NOT NULL;
        
        RAISE NOTICE '✅ Set user_id column to NOT NULL';
    ELSE
        RAISE NOTICE 'ℹ️  user_id column is already NOT NULL';
    END IF;
END $$;

-- Step 5: Add comment for the new column
COMMENT ON COLUMN damaged_products.user_id IS 'Data isolation: damaged products belong to specific user';

-- Step 6: Create index for better query performance on user_id
CREATE INDEX IF NOT EXISTS idx_damaged_products_user_id ON damaged_products(user_id);
RAISE NOTICE '✅ Created index on damaged_products.user_id';

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
RAISE NOTICE '✅ Updated damaged_products_detailed view';

-- Step 9: Grant appropriate permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON damaged_products TO authenticated;
GRANT SELECT ON damaged_products_detailed TO authenticated;
RAISE NOTICE '✅ Granted permissions on damaged_products and view';

-- Commit the transaction
COMMIT;

-- Final verification and success message
DO $$
DECLARE
    column_exists BOOLEAN;
    is_not_null BOOLEAN;
    record_count INTEGER;
    index_exists BOOLEAN;
BEGIN
    -- Check if column exists and is NOT NULL
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'damaged_products' 
        AND column_name = 'user_id'
    ) INTO column_exists;
    
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'damaged_products' 
        AND column_name = 'user_id'
        AND is_nullable = 'NO'
    ) INTO is_not_null;
    
    -- Count total records
    SELECT COUNT(*) INTO record_count FROM damaged_products;
    
    -- Check if index exists
    SELECT EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE tablename = 'damaged_products' 
        AND indexname = 'idx_damaged_products_user_id'
    ) INTO index_exists;
    
    IF column_exists AND is_not_null AND index_exists THEN
        RAISE NOTICE '';
        RAISE NOTICE '🎉 MIGRATION COMPLETED SUCCESSFULLY! 🎉';
        RAISE NOTICE '✅ user_id column added to damaged_products table';
        RAISE NOTICE '✅ % existing records updated with user_id', record_count;
        RAISE NOTICE '✅ Column set to NOT NULL';
        RAISE NOTICE '✅ Index created for performance';
        RAISE NOTICE '✅ View updated with user_id';
        RAISE NOTICE '✅ Data isolation is now enforced for damaged_products';
        RAISE NOTICE '';
        RAISE NOTICE 'You can now restart your backend server to use the updated schema.';
    ELSE
        RAISE EXCEPTION '❌ Migration verification failed. Please check the steps above.';
    END IF;
END $$;
