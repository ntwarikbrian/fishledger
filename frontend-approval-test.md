# Frontend Approval Workflow Test Guide

## Overview
This guide helps you test the new approval workflow for stock operations in the frontend.

## What's Been Implemented

### ✅ Backend API Endpoints
- `POST /api/stock-movements/:movementId/approve-stock-addition`
- `POST /api/stock-movements/:movementId/reject-stock-addition`
- `POST /api/stock-movements/:movementId/approve-stock-correction`
- `POST /api/stock-movements/:movementId/reject-stock-correction`
- `POST /api/stock-movements/:movementId/approve-product-create`
- `POST /api/stock-movements/:movementId/reject-product-create`

### ✅ Frontend API Service Methods
- `stockMovementsApi.approveStockAddition(movementId)`
- `stockMovementsApi.rejectStockAddition(movementId, reason)`
- `stockMovementsApi.approveStockCorrection(movementId)`
- `stockMovementsApi.rejectStockCorrection(movementId, reason)`
- `stockMovementsApi.approveProductCreate(movementId)`
- `stockMovementsApi.rejectProductCreate(movementId, reason)`

### ✅ Frontend UI Components
- **Approval Buttons**: ✓ (green) and ✗ (red) buttons for all pending requests
- **Smart Button Logic**: Buttons only appear for pending requests
- **Dynamic Tooltips**: Show appropriate action text based on movement type
- **Handler Functions**: Complete approval/rejection logic for all movement types

## How to Test

### 1. Test Stock Addition Approval
1. **Create a Stock Addition Request**:
   - Go to Inventory → Products
   - Click "Add Stock" on any product
   - Fill in boxes/kg and cost
   - Submit the form
   - **Expected**: Message shows "Pending approval from admin"

2. **Approve/Reject the Request**:
   - Go to Inventory → Stock Movements tab
   - Look for the new stock addition with status "PENDING"
   - You should see ✓ and ✗ buttons in the Actions column
   - Click ✓ to approve or ✗ to reject
   - **Expected**: Product quantities update (if approved) or request is marked rejected

### 2. Test Stock Correction Approval
1. **Create a Stock Correction Request**:
   - Go to Stock Corrections page
   - Create a new correction for any product
   - Submit the form
   - **Expected**: Message shows "Pending approval from admin"

2. **Approve/Reject the Request**:
   - Go to Inventory → Stock Movements tab
   - Look for the stock correction with status "PENDING"
   - Click ✓ to approve or ✗ to reject
   - **Expected**: Product quantities update (if approved) or request is marked rejected

### 3. Test Product Creation Approval
1. **Create a Product Creation Request**:
   - Go to Inventory → Products
   - Click "Add Product"
   - Fill in all product details
   - Submit the form
   - **Expected**: Message shows "Pending approval from admin"

2. **Approve/Reject the Request**:
   - Go to Inventory → Stock Movements tab
   - Look for the product creation with status "PENDING"
   - Click ✓ to approve or ✗ to reject
   - **Expected**: New product is created (if approved) or request is marked rejected

### 4. Visual Verification
- **Pending Status**: All pending requests show yellow "PENDING" badge
- **Action Buttons**: Only pending requests show ✓ and ✗ buttons
- **Completed Status**: Approved requests show green "COMPLETED" badge
- **Rejected Status**: Rejected requests show red "REJECTED" badge

## Expected User Flow

### For Regular Users (Employees):
1. Create stock addition/correction/product requests
2. See "Pending approval" messages
3. Cannot see approval buttons (if permissions are properly set)

### For Managers/Admins:
1. See all pending requests in Stock Movements
2. Can approve or reject any pending request
3. See confirmation messages after actions
4. See updated product data after approvals

## Troubleshooting

### If Approval Buttons Don't Appear:
1. Check that the movement has `status: 'pending'`
2. Verify the movement type is one of: `new_stock`, `stock_correction`, `product_create`, `product_edit`, `product_delete`
3. Check browser console for JavaScript errors

### If API Calls Fail:
1. Check browser Network tab for failed requests
2. Verify backend server is running
3. Check authentication tokens are valid

### If Product Quantities Don't Update:
1. Refresh the page after approval
2. Check that the stock movement status changed to "completed"
3. Verify the backend approval handler is working correctly

## Success Criteria

✅ **Stock Addition Workflow**:
- Request creates pending movement
- Approval updates product quantities
- Rejection marks request as rejected

✅ **Stock Correction Workflow**:
- Request creates pending movement
- Approval applies corrections to product
- Rejection marks request as rejected

✅ **Product Creation Workflow**:
- Request creates pending movement
- Approval creates new product
- Rejection marks request as rejected

✅ **UI/UX**:
- Clear visual indicators for pending requests
- Intuitive approval/rejection buttons
- Appropriate success/error messages
- Real-time updates after actions

## Next Steps

After testing, consider implementing:
1. **Bulk Approval**: Select multiple requests and approve/reject at once
2. **Notification System**: Email/push notifications for pending requests
3. **Approval Dashboard**: Dedicated page for managing all pending requests
4. **Audit Trail**: Detailed history of who approved/rejected what and when
5. **Auto-Approval Rules**: Automatically approve small changes under certain thresholds
