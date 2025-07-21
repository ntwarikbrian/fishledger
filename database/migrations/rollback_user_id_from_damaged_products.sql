-- =====================================================
-- Rollback Migration: Remove user_id from damaged_products
-- Description: Rollback the user_id column addition from damaged_products table
-- Date: 2025-07-21
-- 
-- WARNING: This will remove data isolation from damaged_products!
-- Only run this if you need to rollback the migration.
-- =====================================================

-- Begin transaction for atomic rollback
BEGIN;

-- Step 1: Check if user_id column exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'damaged_products' 
        AND column_name = 'user_id'
    ) THEN
        RAISE NOTICE 'ℹ️  user_id column exists, proceeding with rollback';
    ELSE
        RAISE NOTICE 'ℹ️  user_id column does not exist, nothing to rollback';
        RETURN;
    END IF;
END $$;

-- Step 2: Recreate the original damaged_products_detailed view (without user_id)
DROP VIEW IF EXISTS damaged_products_detailed;

CREATE OR REPLACE VIEW damaged_products_detailed AS
SELECT 
    dp.damage_id,
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

COMMENT ON VIEW damaged_products_detailed IS 'Detailed view of damaged products with product and user information';
RAISE NOTICE '✅ Restored original damaged_products_detailed view';

-- Step 3: Drop the index on user_id
DROP INDEX IF EXISTS idx_damaged_products_user_id;
RAISE NOTICE '✅ Dropped index on user_id';

-- Step 4: Remove the user_id column
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'damaged_products' 
        AND column_name = 'user_id'
    ) THEN
        ALTER TABLE damaged_products DROP COLUMN user_id;
        RAISE NOTICE '✅ Removed user_id column from damaged_products table';
    ELSE
        RAISE NOTICE 'ℹ️  user_id column already removed';
    END IF;
END $$;

-- Step 5: Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON damaged_products TO authenticated;
GRANT SELECT ON damaged_products_detailed TO authenticated;
RAISE NOTICE '✅ Restored permissions';

-- Commit the transaction
COMMIT;

-- Final verification and warning message
DO $$
DECLARE
    column_exists BOOLEAN;
    record_count INTEGER;
BEGIN
    -- Check if column still exists
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'damaged_products' 
        AND column_name = 'user_id'
    ) INTO column_exists;
    
    -- Count total records
    SELECT COUNT(*) INTO record_count FROM damaged_products;
    
    IF NOT column_exists THEN
        RAISE NOTICE '';
        RAISE NOTICE '🔄 ROLLBACK COMPLETED SUCCESSFULLY! 🔄';
        RAISE NOTICE '✅ user_id column removed from damaged_products table';
        RAISE NOTICE '✅ Original view restored';
        RAISE NOTICE '✅ Index removed';
        RAISE NOTICE '⚠️  WARNING: Data isolation is NO LONGER enforced for damaged_products';
        RAISE NOTICE '⚠️  All users can now see all damaged products!';
        RAISE NOTICE '';
        RAISE NOTICE 'You should restart your backend server and update your code to handle the schema change.';
    ELSE
        RAISE EXCEPTION '❌ Rollback verification failed. user_id column still exists.';
    END IF;
END $$;
