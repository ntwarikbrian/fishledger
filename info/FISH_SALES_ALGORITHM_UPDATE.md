# 🐟 Fish Sales Algorithm Implementation

## Overview
Updated the sales system to implement a new fish sales algorithm where customers request kg amounts and the system automatically handles box-to-kg conversion when needed.

## Key Changes

### Backend Updates

#### 1. New Sales Handler (`backend/src/handlers/sales.ts`)
- **Updated validation schema**: Now accepts `requested_kg` instead of separate `boxes_quantity` and `kg_quantity`
- **New fish sales algorithm**: 
  - Prioritizes using loose kg stock first
  - Automatically converts boxes to kg when needed (1 box = configurable kg ratio)
  - Handles excess kg from box conversion by adding back to loose stock
- **New endpoint**: `POST /api/sales/fish` for the fish sales algorithm
- **Legacy support**: Original endpoint still available for backward compatibility

#### 2. Algorithm Logic
```typescript
// Step 1: Use available kg stock first
if (availableKg >= neededKg) {
  usedKg = neededKg;
  availableKg -= neededKg;
} else {
  usedKg = availableKg;
  neededKg -= availableKg;
  availableKg = 0;
}

// Step 2: Convert boxes to kg if needed
if (neededKg > 0) {
  const boxesNeeded = Math.ceil(neededKg / boxToKgRatio);
  if (availableBoxes >= boxesNeeded) {
    usedBoxes = boxesNeeded;
    const kgFromBoxes = boxesNeeded * boxToKgRatio;
    const excessKg = kgFromBoxes - neededKg;
    if (excessKg > 0) {
      availableKg += excessKg; // Add excess back to loose stock
    }
  }
}
```

#### 3. Routes Update (`backend/src/routes/sales.routes.ts`)
- Added new route: `POST /sales/fish` for the fish sales algorithm
- Maintains existing routes for backward compatibility

### Frontend Updates

#### 1. API Service (`src/lib/api/services/inventory.ts`)
- **New interfaces**: `FishSaleRequest` and `FishSaleResult`
- **New method**: `createFishSale()` for calling the fish sales endpoint
- **Validation**: `validateFishSaleRequest()` for client-side validation

#### 2. Sales Component (`src/pages/Sales.tsx`)
- **Updated UI**: New form focused on kg requests instead of separate box/kg inputs
- **Algorithm preview**: Shows how the system will fulfill the order
- **Real-time calculations**: Displays total amount and stock availability
- **Smart validation**: Prevents orders that exceed total available stock
- **Enhanced UX**: Clear indicators of algorithm steps and stock changes

#### 3. Key UI Features
- **Product selection**: Shows price per kg and total available stock
- **Requested kg input**: Simple input for customer's kg requirement
- **Algorithm preview**: Real-time preview of how the order will be fulfilled
- **Stock validation**: Immediate feedback on stock availability
- **Payment integration**: Supports all existing payment methods and statuses

## Benefits

### 1. Simplified Customer Experience
- Customers only need to specify kg amount
- No need to understand box-to-kg conversions
- System handles all complexity automatically

### 2. Optimized Inventory Management
- Prioritizes loose kg stock to minimize waste
- Efficiently converts boxes when needed
- Automatically manages excess kg from box conversion

### 3. Better Stock Utilization
- Reduces manual calculation errors
- Ensures optimal use of available inventory
- Maintains accurate stock levels after each sale

### 4. Enhanced Reporting
- Detailed algorithm steps for audit trail
- Clear breakdown of boxes used vs kg sold
- Improved transparency in stock movements

## API Endpoints

### New Fish Sales Endpoint
```
POST /api/sales/fish
Content-Type: application/json

{
  "product_id": "uuid",
  "requested_kg": 25.5,
  "payment_method": "cash",
  "payment_status": "paid",
  "amount_paid": 66.30,
  "client_name": "John Doe",
  "email_address": "john@example.com",
  "phone": "+1234567890"
}
```

### Response Format
```json
{
  "success": true,
  "data": { /* sale record */ },
  "message": "Fish sale completed: 25.5kg sold for $66.30",
  "algorithm": {
    "name": "Fish Sales Algorithm",
    "description": "Prioritizes kg stock first, then converts boxes when needed",
    "steps": [
      "Used 15.5kg from loose stock",
      "Converted 1 box(es) to 10kg, used 10kg, added 0kg back to loose stock"
    ],
    "result": {
      "sold_kg": 25.5,
      "used_boxes": 1,
      "total_amount": 66.30
    }
  },
  "stockInfo": {
    "before": { "boxes": 10, "kg": 15.5 },
    "after": { "boxes": 9, "kg": 0 }
  }
}
```

## Testing

### Test Cases Covered
1. **Simple kg sale**: When sufficient loose kg is available
2. **Box conversion**: When loose kg is insufficient and boxes need conversion
3. **Exact conversion**: When conversion results in exact kg needed
4. **Multiple box conversion**: When multiple boxes are needed
5. **Insufficient stock**: When total available stock is less than requested
6. **Edge cases**: Partial box conversion and excess kg handling

### Test File
- `backend/test-fish-sales-algorithm.ts` - Comprehensive test suite for the algorithm

## Future Enhancements

### 1. Advanced Features
- **Bulk sales**: Support for multiple products in one transaction
- **Price optimization**: Dynamic pricing based on stock levels
- **Expiry management**: Prioritize products by expiry date
- **Customer preferences**: Remember customer buying patterns

### 2. Analytics & Reporting
- **Algorithm efficiency**: Track how often box conversion is needed
- **Stock optimization**: Analyze optimal box-to-kg ratios
- **Sales patterns**: Identify peak demand periods
- **Waste reduction**: Monitor excess kg from conversions

### 3. Integration Opportunities
- **Inventory alerts**: Notify when conversion frequently needed
- **Supplier integration**: Automatic reordering based on conversion patterns
- **Customer notifications**: Alert customers about stock availability
- **Mobile app**: Dedicated mobile interface for sales staff

## Migration Notes

### Backward Compatibility
- Original sales endpoint (`POST /api/sales`) remains functional
- Existing sales data structure unchanged
- Legacy UI components preserved for reference

### Deployment Considerations
- No database schema changes required
- New endpoint can be deployed independently
- Frontend updates are additive, not breaking changes

## Conclusion

The fish sales algorithm significantly improves the user experience by automating complex inventory calculations while maintaining full transparency and audit trails. The implementation prioritizes simplicity for users while providing powerful backend logic for optimal inventory management.
