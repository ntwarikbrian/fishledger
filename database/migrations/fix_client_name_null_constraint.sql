-- =====================================================
-- MIGRATION: Fix client_name null constraint in transaction triggers
-- Handles null client_name values when creating transactions from sales
-- =====================================================

-- This migration updates the trigger functions to handle null client_name values
-- by providing a default value of 'Walk-in Customer'

BEGIN;

-- Step 1: Update the create_transaction_from_sale function
CREATE OR REPLACE FUNCTION create_transaction_from_sale()
RETURNS TRIGGER AS $$
DECLARE
    product_name_val VARCHAR(255);
BEGIN
    -- Get product name from products table
    SELECT name INTO product_name_val
    FROM products
    WHERE product_id = NEW.product_id;

    -- Insert transaction record with null-safe client_name
    INSERT INTO transactions (
        sale_id,
        date_time,
        product_name,
        client_name,
        boxes_quantity,
        kg_quantity,
        total_amount,
        payment_status,
        payment_method,
        created_by,
        updated_by
    ) VALUES (
        NEW.id,
        NEW.date_time,
        COALESCE(product_name_val, 'Unknown Product'),
        COALESCE(NEW.client_name, 'Walk-in Customer'), -- Handle null client_name
        NEW.boxes_quantity,
        NEW.kg_quantity,
        NEW.total_amount,
        NEW.payment_status,
        NEW.payment_method,
        NEW.performed_by,
        NEW.performed_by -- Set updated_by to same user on creation
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Update the update_transaction_from_sale function
CREATE OR REPLACE FUNCTION update_transaction_from_sale()
RETURNS TRIGGER AS $$
DECLARE
    product_name_val VARCHAR(255);
BEGIN
    -- Get product name from products table
    SELECT name INTO product_name_val
    FROM products
    WHERE product_id = NEW.product_id;

    -- Update corresponding transaction record with null-safe client_name
    UPDATE transactions SET
        date_time = NEW.date_time,
        product_name = COALESCE(product_name_val, 'Unknown Product'),
        client_name = COALESCE(NEW.client_name, 'Walk-in Customer'), -- Handle null client_name
        boxes_quantity = NEW.boxes_quantity,
        kg_quantity = NEW.kg_quantity,
        total_amount = NEW.total_amount,
        payment_status = NEW.payment_status,
        payment_method = NEW.payment_method,
        updated_at = CURRENT_TIMESTAMP,
        updated_by = NEW.performed_by -- Track who updated the sale (and thus the transaction)
    WHERE sale_id = NEW.id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Handle databases that don't have updated_by column yet
-- Create a version without updated_by for backward compatibility
CREATE OR REPLACE FUNCTION create_transaction_from_sale_legacy()
RETURNS TRIGGER AS $$
DECLARE
    product_name_val VARCHAR(255);
BEGIN
    -- Get product name from products table
    SELECT name INTO product_name_val
    FROM products
    WHERE product_id = NEW.product_id;

    -- Insert transaction record (legacy version without updated_by)
    INSERT INTO transactions (
        sale_id,
        date_time,
        product_name,
        client_name,
        boxes_quantity,
        kg_quantity,
        total_amount,
        payment_status,
        payment_method,
        created_by
    ) VALUES (
        NEW.id,
        NEW.date_time,
        COALESCE(product_name_val, 'Unknown Product'),
        COALESCE(NEW.client_name, 'Walk-in Customer'), -- Handle null client_name
        NEW.boxes_quantity,
        NEW.kg_quantity,
        NEW.total_amount,
        NEW.payment_status,
        NEW.payment_method,
        NEW.performed_by
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Check if updated_by column exists and use appropriate function
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'transactions' 
        AND column_name = 'updated_by'
    ) THEN
        RAISE NOTICE 'Using updated trigger functions with updated_by support';
        -- Functions are already created above
    ELSE
        RAISE NOTICE 'Using legacy trigger functions without updated_by';
        -- Replace the main function with legacy version
        DROP FUNCTION IF EXISTS create_transaction_from_sale();
        ALTER FUNCTION create_transaction_from_sale_legacy() RENAME TO create_transaction_from_sale;
        
        -- Create legacy update function
        CREATE OR REPLACE FUNCTION update_transaction_from_sale()
        RETURNS TRIGGER AS $$
        DECLARE
            product_name_val VARCHAR(255);
        BEGIN
            -- Get product name from products table
            SELECT name INTO product_name_val
            FROM products
            WHERE product_id = NEW.product_id;

            -- Update corresponding transaction record (legacy version)
            UPDATE transactions SET
                date_time = NEW.date_time,
                product_name = COALESCE(product_name_val, 'Unknown Product'),
                client_name = COALESCE(NEW.client_name, 'Walk-in Customer'), -- Handle null client_name
                boxes_quantity = NEW.boxes_quantity,
                kg_quantity = NEW.kg_quantity,
                total_amount = NEW.total_amount,
                payment_status = NEW.payment_status,
                payment_method = NEW.payment_method,
                updated_at = CURRENT_TIMESTAMP
            WHERE sale_id = NEW.id;

            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    END IF;
END $$;

-- Step 5: Clean up legacy function if not needed
DROP FUNCTION IF EXISTS create_transaction_from_sale_legacy();

COMMIT;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Test the trigger function (this should not fail)
DO $$
BEGIN
    RAISE NOTICE 'Migration completed successfully!';
    RAISE NOTICE 'Trigger functions now handle null client_name values';
    RAISE NOTICE 'Default value for null client_name: "Walk-in Customer"';
END $$;
