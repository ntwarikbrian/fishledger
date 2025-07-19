# Product Edit Tracking Test Guide

## Overview
This guide helps you test the new product edit tracking functionality that automatically logs all product information changes in the stock movements table.

## Test Steps

### 1. Setup
1. Start the backend server: `cd backend && npm run dev`
2. Start the frontend: `cd frontend && npm run dev` (if separate)
3. Login to the application
4. Navigate to Inventory → All Products

### 2. Test Product Edit Tracking

#### Test Case 1: Edit Product Name
1. Click edit button on any product
2. Change the product name (e.g., "Atlantic Salmon" → "Premium Atlantic Salmon")
3. Save the changes
4. Go to Inventory → Stock Movements view
5. **Expected Result:** You should see a new entry with:
   - Purple "PRODUCT EDIT" badge
   - Field: "name"
   - Old value: "Atlantic Salmon"
   - New value: "Premium Atlantic Salmon"

#### Test Case 2: Edit Multiple Fields
1. Edit a product and change multiple fields:
   - Name: "Cod Fish" → "Fresh Cod"
   - Cost per box: "15.00" → "16.50"
   - Price per kg: "2.50" → "2.75"
2. Save the changes
3. Check stock movements
4. **Expected Result:** You should see 3 separate entries, one for each changed field

#### Test Case 3: Edit with Reason
1. Edit a product with a reason (if reason field is available)
2. Change price per box and add reason: "Price increase due to supplier costs"
3. **Expected Result:** The reason should appear in the stock movements entry

### 3. Verify Database Records

#### Check Database Directly (Optional)
```sql
-- View recent product edit movements
SELECT 
    sm.created_at,
    p.name as product_name,
    sm.field_changed,
    sm.old_value,
    sm.new_value,
    sm.reason
FROM stock_movements sm
JOIN products p ON sm.product_id = p.product_id
WHERE sm.movement_type = 'product_edit'
ORDER BY sm.created_at DESC
LIMIT 10;
```

### 4. Test Filtering
1. In stock movements view, use the filter dropdown
2. Select "Product Info Changes"
3. **Expected Result:** Only product edit movements should be displayed

## Tracked Fields
The following fields are automatically tracked when changed:
- Product Name
- Category
- Box to KG Ratio
- Cost per Box
- Cost per KG
- Price per Box
- Price per KG
- Low Stock Threshold
- Expiry Date

## Visual Indicators
- **Badge:** Purple "PRODUCT EDIT" badge
- **Field Column:** Shows the name of the changed field
- **Values:** Old value (red background) → New value (green background)
- **Reason:** Shows why the change was made

## Troubleshooting

### No Audit Records Created
1. Check that the product actually has changes
2. Verify user has proper permissions
3. Check browser console for errors
4. Check backend logs for database errors

### Missing Field Information
1. Ensure the field is in the trackable fields list
2. Check that old and new values are different
3. Verify database schema has the new columns

### Display Issues
1. Refresh the stock movements view
2. Check that the movement_type filter includes 'product_edit'
3. Verify the UI components are properly updated

## Expected Database Schema
```sql
-- stock_movements table should have these columns:
movement_type VARCHAR(20) -- includes 'product_edit'
field_changed TEXT        -- name of changed field
old_value TEXT           -- previous value
new_value TEXT           -- new value
```

## Success Criteria
✅ Product edits create audit records automatically
✅ Each changed field gets its own record
✅ Records display properly in stock movements table
✅ Visual styling distinguishes product edits from stock changes
✅ Filtering works to show only product edits
✅ All trackable fields are monitored
