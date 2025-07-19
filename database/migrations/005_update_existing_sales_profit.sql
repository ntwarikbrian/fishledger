-- =====================================================
-- Migration: Update Existing Sales with Profit Values
-- Version: 005
-- Description: Calculate and populate profit values for existing sales
-- =====================================================

-- Update existing sales with calculated profit values
-- This will calculate profit based on the selling price stored in sales table
-- and the cost price from the products table

UPDATE sales 
SET 
    profit_per_box = COALESCE(sales.box_price - products.cost_per_box, 0),
    profit_per_kg = COALESCE(sales.kg_price - products.cost_per_kg, 0)
FROM products 
WHERE sales.product_id = products.product_id
AND (sales.profit_per_box = 0 OR sales.profit_per_kg = 0);

-- Add a comment to track this migration
COMMENT ON TABLE sales IS 'Sales table with profit tracking - Updated existing records in migration 005';
