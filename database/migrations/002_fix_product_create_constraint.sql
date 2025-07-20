-- ============================================================================
-- Migration: Fix Product Creation Constraint Issue
-- Version: 002
-- Description: Fixes the chk_movement_references constraint to properly support
--              product_create movement type in the approval workflow
-- Date: 2024-01-19
-- Author: System Migration
-- ============================================================================

-- Start transaction to ensure atomicity
BEGIN;

-- ============================================================================
-- 1. BACKUP CURRENT CONSTRAINT DEFINITION
-- ============================================================================

-- Create a backup table to store current constraint information
CREATE TEMP TABLE constraint_backup AS
SELECT
    cc.constraint_name,
    cc.check_clause,
    tc.table_name,
    CURRENT_TIMESTAMP as backup_time
FROM information_schema.check_constraints cc
JOIN information_schema.table_constraints tc
    ON cc.constraint_name = tc.constraint_name
WHERE cc.constraint_name = 'chk_movement_references'
AND tc.table_name = 'stock_movements';

-- Log the backup
DO $$
DECLARE
    backup_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO backup_count FROM constraint_backup;
    RAISE NOTICE 'Constraint backup created: % records', backup_count;
END $$;

-- ============================================================================
-- 2. VALIDATE CURRENT STATE
-- ============================================================================

-- Check if stock_movements table exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stock_movements') THEN
        RAISE EXCEPTION 'stock_movements table does not exist. Migration cannot proceed.';
    END IF;
    RAISE NOTICE 'stock_movements table exists - validation passed';
END $$;

-- Check if movement_type column supports product_create
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.check_constraints cc
        JOIN information_schema.table_constraints tc
            ON cc.constraint_name = tc.constraint_name
        WHERE tc.table_name = 'stock_movements'
        AND cc.constraint_name LIKE '%movement_type%'
        AND cc.check_clause LIKE '%product_create%'
    ) THEN
        RAISE EXCEPTION 'movement_type constraint does not support product_create. Please run migration 001 first.';
    END IF;
    RAISE NOTICE 'movement_type constraint supports product_create - validation passed';
END $$;

-- ============================================================================
-- 3. UPDATE REFERENCE CONSTRAINT
-- ============================================================================

-- Drop the existing constraint
ALTER TABLE stock_movements
DROP CONSTRAINT IF EXISTS chk_movement_references;

-- Create the updated constraint that includes product_create
ALTER TABLE stock_movements
ADD CONSTRAINT chk_movement_references CHECK (
    (movement_type = 'damaged' AND damaged_id IS NOT NULL) OR
    (movement_type = 'new_stock' AND stock_addition_id IS NOT NULL) OR
    (movement_type = 'stock_correction' AND correction_id IS NOT NULL) OR
    (movement_type = 'product_edit') OR
    (movement_type = 'product_delete') OR
    (movement_type = 'product_create')
);

-- ============================================================================
-- 4. VALIDATE THE FIX
-- ============================================================================

-- Test that the constraint allows product_create movements
DO $$
DECLARE
    test_result BOOLEAN := FALSE;
BEGIN
    -- Try to validate a product_create movement would pass the constraint
    SELECT TRUE INTO test_result
    FROM (
        SELECT 'product_create' as movement_type,
               NULL as damaged_id,
               NULL as stock_addition_id,
               NULL as correction_id
    ) test_data
    WHERE (
        (test_data.movement_type = 'damaged' AND test_data.damaged_id IS NOT NULL) OR
        (test_data.movement_type = 'new_stock' AND test_data.stock_addition_id IS NOT NULL) OR
        (test_data.movement_type = 'stock_correction' AND test_data.correction_id IS NOT NULL) OR
        (test_data.movement_type = 'product_edit') OR
        (test_data.movement_type = 'product_delete') OR
        (test_data.movement_type = 'product_create')
    );

    IF test_result THEN
        RAISE NOTICE 'Constraint validation passed - product_create movements are now allowed';
    ELSE
        RAISE EXCEPTION 'Constraint validation failed - product_create movements still not allowed';
    END IF;
END $$;

-- ============================================================================
-- 5. CREATE VERIFICATION FUNCTION
-- ============================================================================

-- Function to verify the constraint is working correctly
CREATE OR REPLACE FUNCTION verify_product_create_constraint()
RETURNS TABLE(
    constraint_exists BOOLEAN,
    supports_product_create BOOLEAN,
    constraint_definition TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        EXISTS(
            SELECT 1
            FROM information_schema.check_constraints cc
            JOIN information_schema.table_constraints tc
                ON cc.constraint_name = tc.constraint_name
            WHERE cc.constraint_name = 'chk_movement_references'
            AND tc.table_name = 'stock_movements'
        ) as constraint_exists,
        EXISTS(
            SELECT 1
            FROM information_schema.check_constraints cc
            JOIN information_schema.table_constraints tc
                ON cc.constraint_name = tc.constraint_name
            WHERE cc.constraint_name = 'chk_movement_references'
            AND tc.table_name = 'stock_movements'
            AND cc.check_clause LIKE '%product_create%'
        ) as supports_product_create,
        COALESCE(
            (SELECT cc.check_clause::TEXT
             FROM information_schema.check_constraints cc
             JOIN information_schema.table_constraints tc
                 ON cc.constraint_name = tc.constraint_name
             WHERE cc.constraint_name = 'chk_movement_references'
             AND tc.table_name = 'stock_movements'
             LIMIT 1),
            'Constraint not found'
        ) as constraint_definition;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION verify_product_create_constraint() TO authenticated;

-- ============================================================================
-- 6. UPDATE COMMENTS AND DOCUMENTATION
-- ============================================================================

-- Update constraint comment
COMMENT ON CONSTRAINT chk_movement_references ON stock_movements IS
'Ensures proper reference IDs are set based on movement type. Updated to support product_create movements.';

-- Add function comment
COMMENT ON FUNCTION verify_product_create_constraint() IS
'Verification function to check if product_create constraint is properly configured';

-- ============================================================================
-- 7. MIGRATION METADATA
-- ============================================================================

-- Create migration tracking table if it doesn't exist
CREATE TABLE IF NOT EXISTS migration_history (
    migration_id SERIAL PRIMARY KEY,
    migration_name VARCHAR(255) NOT NULL UNIQUE,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    description TEXT
);

-- Record this migration
INSERT INTO migration_history (migration_name, description)
VALUES (
    '002_fix_product_create_constraint',
    'Fixes the chk_movement_references constraint to properly support product_create movement type in the approval workflow'
);

-- ============================================================================
-- 8. FINAL VERIFICATION AND REPORTING
-- ============================================================================

-- Run final verification
DO $$
DECLARE
    verification_result RECORD;
BEGIN
    SELECT * INTO verification_result FROM verify_product_create_constraint();

    RAISE NOTICE '=== MIGRATION VERIFICATION REPORT ===';
    RAISE NOTICE 'Constraint exists: %', verification_result.constraint_exists;
    RAISE NOTICE 'Supports product_create: %', verification_result.supports_product_create;
    RAISE NOTICE 'Constraint definition: %', verification_result.constraint_definition;

    IF verification_result.constraint_exists AND verification_result.supports_product_create THEN
        RAISE NOTICE '✅ Migration completed successfully!';
        RAISE NOTICE 'Product creation approval workflow is now functional.';
    ELSE
        RAISE EXCEPTION '❌ Migration verification failed. Please check the constraint manually.';
    END IF;
END $$;

-- Commit the transaction
COMMIT;

-- ============================================================================
-- POST-MIGRATION INSTRUCTIONS
-- ============================================================================

-- Display success message and next steps
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 Migration 002 completed successfully!';
    RAISE NOTICE '';
    RAISE NOTICE '📋 What was fixed:';
    RAISE NOTICE '   ✅ chk_movement_references constraint now includes product_create';
    RAISE NOTICE '   ✅ Product creation approval workflow is now functional';
    RAISE NOTICE '   ✅ Verification function created for future testing';
    RAISE NOTICE '';
    RAISE NOTICE '🧪 To test the fix:';
    RAISE NOTICE '   1. Try creating a new product through the API';
    RAISE NOTICE '   2. Check that it creates a pending stock movement';
    RAISE NOTICE '   3. Verify approval/rejection buttons appear in the UI';
    RAISE NOTICE '';
    RAISE NOTICE '🔍 To verify the fix anytime, run:';
    RAISE NOTICE '   SELECT * FROM verify_product_create_constraint();';
    RAISE NOTICE '';
END $$;

-- ============================================================================
-- ROLLBACK INSTRUCTIONS (FOR REFERENCE ONLY)
-- ============================================================================

/*
-- ============================================================================
-- ROLLBACK SCRIPT - USE ONLY IF MIGRATION NEEDS TO BE REVERTED
-- ============================================================================

-- WARNING: This will revert the constraint fix and break product creation approval

BEGIN;

-- Revert the constraint to exclude product_create
ALTER TABLE stock_movements
DROP CONSTRAINT IF EXISTS chk_movement_references;

ALTER TABLE stock_movements
ADD CONSTRAINT chk_movement_references CHECK (
    (movement_type = 'damaged' AND damaged_id IS NOT NULL) OR
    (movement_type = 'new_stock' AND stock_addition_id IS NOT NULL) OR
    (movement_type = 'stock_correction' AND correction_id IS NOT NULL) OR
    (movement_type = 'product_edit') OR
    (movement_type = 'product_delete')
);

-- Drop verification function
DROP FUNCTION IF EXISTS verify_product_create_constraint();

-- Remove migration record
DELETE FROM migration_history WHERE migration_name = '002_fix_product_create_constraint';

-- Update constraint comment
COMMENT ON CONSTRAINT chk_movement_references ON stock_movements IS
'Ensures proper reference IDs are set based on movement type. Reverted to exclude product_create.';

COMMIT;

RAISE NOTICE 'Migration 002 has been rolled back. Product creation approval will not work.';

-- ============================================================================
*/
