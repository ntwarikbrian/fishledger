-- Migration: Update Payment Methods
-- This script updates the payment method options from ['cash', 'card', 'transfer'] to ['momo_pay', 'cash', 'bank_transfer']
-- Date: 2024-01-XX
-- Description: Migrate existing payment methods to new values for backward compatibility

-- Step 1: Remove the existing constraint
ALTER TABLE sales DROP CONSTRAINT IF EXISTS sales_payment_method_check;

-- Step 2: Update existing data to map old values to new values
-- 'card' -> 'momo_pay' (assuming card payments were mostly mobile payments)
-- 'transfer' -> 'bank_transfer' (direct mapping)
-- 'cash' -> 'cash' (no change needed)

UPDATE sales 
SET payment_method = 'bank_transfer' 
WHERE payment_method = 'transfer';

UPDATE sales 
SET payment_method = 'momo_pay' 
WHERE payment_method = 'card';

-- Step 3: Increase the column size to accommodate longer payment method names
ALTER TABLE sales ALTER COLUMN payment_method TYPE VARCHAR(15);

-- Step 4: Add the new constraint with updated values
ALTER TABLE sales ADD CONSTRAINT sales_payment_method_check 
CHECK (payment_method IN ('momo_pay', 'cash', 'bank_transfer'));

-- Step 5: Update any audit records if they exist
UPDATE sales_audit 
SET old_values = jsonb_set(
    old_values, 
    '{payment_method}', 
    CASE 
        WHEN old_values->>'payment_method' = 'transfer' THEN '"bank_transfer"'::jsonb
        WHEN old_values->>'payment_method' = 'card' THEN '"momo_pay"'::jsonb
        ELSE old_values->'payment_method'
    END
)
WHERE old_values ? 'payment_method' 
AND old_values->>'payment_method' IN ('transfer', 'card');

UPDATE sales_audit 
SET new_values = jsonb_set(
    new_values, 
    '{payment_method}', 
    CASE 
        WHEN new_values->>'payment_method' = 'transfer' THEN '"bank_transfer"'::jsonb
        WHEN new_values->>'payment_method' = 'card' THEN '"momo_pay"'::jsonb
        ELSE new_values->'payment_method'
    END
)
WHERE new_values ? 'payment_method' 
AND new_values->>'payment_method' IN ('transfer', 'card');

-- Verification queries (uncomment to run after migration)
-- SELECT payment_method, COUNT(*) FROM sales GROUP BY payment_method;
-- SELECT 'Migration completed successfully' as status;
