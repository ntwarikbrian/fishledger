-- =====================================================
-- Migration: Add Profit Columns to Sales Table
-- Version: 004
-- Description: Add profit per box and profit per kg columns to track profitability
-- =====================================================

-- Add profit columns to sales table
ALTER TABLE sales 
ADD COLUMN IF NOT EXISTS profit_per_box DECIMAL(8,2) DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS profit_per_kg DECIMAL(8,2) DEFAULT 0 NOT NULL;

-- Add comments for the new columns
COMMENT ON COLUMN sales.profit_per_box IS 'Profit per box (selling price - cost price)';
COMMENT ON COLUMN sales.profit_per_kg IS 'Profit per kg (selling price - cost price)';

-- Create indexes for performance on profit columns (useful for reporting)
CREATE INDEX IF NOT EXISTS idx_sales_profit_per_box ON sales(profit_per_box);
CREATE INDEX IF NOT EXISTS idx_sales_profit_per_kg ON sales(profit_per_kg);

-- Update the validation function to include profit validation
CREATE OR REPLACE FUNCTION validate_sale_data()
RETURNS TRIGGER AS $$
BEGIN
    -- Ensure at least one quantity is positive
    IF NEW.boxes_quantity <= 0 AND NEW.kg_quantity <= 0 THEN
        RAISE EXCEPTION 'At least one of boxes_quantity or kg_quantity must be positive';
    END IF;

    -- Ensure total_amount is positive
    IF NEW.total_amount <= 0 THEN
        RAISE EXCEPTION 'Sale total amount must be positive';
    END IF;

    -- Ensure pricing fields are not negative
    IF NEW.box_price < 0 OR NEW.kg_price < 0 THEN
        RAISE EXCEPTION 'Prices cannot be negative';
    END IF;

    -- Ensure profit fields are not null (can be negative for losses)
    IF NEW.profit_per_box IS NULL OR NEW.profit_per_kg IS NULL THEN
        RAISE EXCEPTION 'Profit fields cannot be null';
    END IF;

    -- Ensure client_name is provided
    IF NEW.client_name IS NULL OR LENGTH(TRIM(NEW.client_name)) = 0 THEN
        RAISE EXCEPTION 'Client name is required';
    END IF;

    -- Calculate and validate total amount
    DECLARE
        calculated_total DECIMAL(10,2);
    BEGIN
        calculated_total := (NEW.boxes_quantity * NEW.box_price) + (NEW.kg_quantity * NEW.kg_price);

        -- Allow small rounding differences (within 0.01)
        IF ABS(NEW.total_amount - calculated_total) > 0.01 THEN
            RAISE EXCEPTION 'Total amount does not match calculated total. Expected: %, Got: %', calculated_total, NEW.total_amount;
        END IF;
    END;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Note: Existing sales records will have profit_per_box and profit_per_kg set to 0
-- To calculate actual profits for existing records, you would need to:
-- 1. Get the cost prices from the products table at the time of sale
-- 2. Update the profit columns accordingly
-- 
-- Example update query (run after migration if needed):
-- UPDATE sales 
-- SET 
--     profit_per_box = sales.box_price - products.cost_per_box,
--     profit_per_kg = sales.kg_price - products.cost_per_kg
-- FROM products 
-- WHERE sales.product_id = products.product_id;

-- Migration completed successfully
SELECT 'Migration 004: Added profit columns to sales table' AS migration_status;
