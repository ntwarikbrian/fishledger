-- =====================================================
-- MIGRATION: Remove client_id foreign key constraint
-- Makes client_id independent from contacts table
-- =====================================================

-- This migration removes the foreign key constraint on client_id
-- in the sales table, making it an independent UUID field

BEGIN;

-- Step 1: Check if the foreign key constraint exists
-- Note: This will vary depending on the constraint name in your database
-- Common constraint names might be:
-- - sales_client_id_fkey
-- - fk_sales_client_id
-- - sales_client_id_contacts_contact_id_fkey

-- Step 2: Drop the foreign key constraint if it exists
-- Replace 'sales_client_id_fkey' with the actual constraint name in your database
DO $$
BEGIN
    -- Try to drop the constraint if it exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'sales_client_id_fkey' 
        AND table_name = 'sales'
    ) THEN
        ALTER TABLE sales DROP CONSTRAINT sales_client_id_fkey;
        RAISE NOTICE 'Dropped foreign key constraint: sales_client_id_fkey';
    ELSE
        RAISE NOTICE 'Foreign key constraint sales_client_id_fkey does not exist';
    END IF;
    
    -- Try alternative constraint names
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name LIKE '%client_id%' 
        AND table_name = 'sales'
        AND constraint_type = 'FOREIGN KEY'
    ) THEN
        -- Get the actual constraint name and drop it
        DECLARE
            constraint_name_var TEXT;
        BEGIN
            SELECT constraint_name INTO constraint_name_var
            FROM information_schema.table_constraints 
            WHERE constraint_name LIKE '%client_id%' 
            AND table_name = 'sales'
            AND constraint_type = 'FOREIGN KEY'
            LIMIT 1;
            
            IF constraint_name_var IS NOT NULL THEN
                EXECUTE 'ALTER TABLE sales DROP CONSTRAINT ' || constraint_name_var;
                RAISE NOTICE 'Dropped foreign key constraint: %', constraint_name_var;
            END IF;
        END;
    END IF;
END $$;

-- Step 3: Update the column comment to reflect the change
COMMENT ON COLUMN sales.client_id IS 'Independent client identifier (not linked to any table)';

-- Step 4: Verify the change
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name LIKE '%client_id%' 
        AND table_name = 'sales'
        AND constraint_type = 'FOREIGN KEY'
    ) THEN
        RAISE NOTICE 'SUCCESS: client_id is now independent from contacts table';
    ELSE
        RAISE WARNING 'WARNING: client_id still has foreign key constraints';
    END IF;
END $$;

COMMIT;

-- =====================================================
-- VERIFICATION QUERIES
-- Run these to verify the migration was successful
-- =====================================================

-- Check if any foreign key constraints remain on client_id
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'sales'
    AND kcu.column_name = 'client_id';

-- Check the current column definition
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'sales' 
    AND column_name = 'client_id';
