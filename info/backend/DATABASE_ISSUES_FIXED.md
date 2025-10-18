# Database Issues Investigation and Fixes

## Issues Found and Fixed

### 1. **Schema Mismatch in Product Handlers**

**Problem**: The product handlers were trying to access columns that don't exist in the actual database schema.

**Files Fixed**:
- `backend/src/handlers/product.handlers.ts`

**Changes Made**:
- Updated `CreateProductRequest` and `UpdateProductRequest` interfaces to match actual schema
- Fixed column names in SELECT queries:
  - `stock_quantity` → `quantity_box` and `quantity_kg`
  - `min_stock_level` → `boxed_low_stock_threshold`
  - `price` → `price_per_box` and `price_per_kg`
  - `cost_price` → `cost_per_box` and `cost_per_kg`
  - Removed non-existent columns: `sku`, `barcode`, `unit`, `location`, `supplier_info`, `is_active`
- Updated validation schemas to match actual database fields
- Fixed low stock query to use correct column names
- Changed soft delete to hard delete since `is_active` column doesn't exist

### 2. **Incorrect Function Parameter Order**

**Problem**: The `recordExists` function was being called with incorrect parameter order.

**Files Fixed**:
- `backend/src/handlers/product.handlers.ts`
- `backend/src/handlers/users.ts`

**Changes Made**:
- Fixed calls from `recordExists(supabase, table, column, id)` to `recordExists(supabase, table, id, column)`

### 3. **Enhanced Error Handling**

**Problem**: Database operations lacked proper error handling and could crash the application.

**Files Fixed**:
- `backend/src/utils/db.ts`

**Changes Made**:
- Added try-catch blocks to `recordExists` function
- Added try-catch blocks to `getLowStockProducts` function
- Added proper error logging
- Made functions return safe defaults on error instead of crashing

### 4. **Database Schema Alignment**

**Actual Database Schema** (from `database/main.sql`):
```sql
CREATE TABLE IF NOT EXISTS products (
    product_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    category_id UUID NOT NULL REFERENCES product_categories(category_id),
    
    -- Inventory fields for box/kg management
    quantity_box INTEGER DEFAULT 0 NOT NULL,
    box_to_kg_ratio DECIMAL(10,2) DEFAULT 20 NOT NULL,
    quantity_kg DECIMAL(10,2) DEFAULT 0 NOT NULL,
    
    -- Cost pricing fields
    cost_per_box DECIMAL(10,2) NOT NULL,
    cost_per_kg DECIMAL(10,2) NOT NULL,
    
    -- Selling pricing fields
    price_per_box DECIMAL(10,2) NOT NULL,
    price_per_kg DECIMAL(10,2) NOT NULL,
    
    -- Calculated profit fields
    profit_per_box DECIMAL(10,2) GENERATED ALWAYS AS (price_per_box - cost_per_box) STORED,
    profit_per_kg DECIMAL(10,2) GENERATED ALWAYS AS (price_per_kg - cost_per_kg) STORED,
    
    -- Stock management
    boxed_low_stock_threshold INTEGER DEFAULT 10 NOT NULL,
    
    -- Product lifecycle tracking
    expiry_date DATE,
    days_left INTEGER,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

**Handler Updates**:
- All SELECT queries now use correct column names
- All INSERT/UPDATE operations use correct field names
- Validation schemas match database constraints
- Low stock queries use `quantity_box < boxed_low_stock_threshold`

### 5. **Type Safety Improvements**

**Problem**: TypeScript types in Supabase config were correct, but handlers weren't using them properly.

**Files Fixed**:
- `backend/src/handlers/product.handlers.ts`

**Changes Made**:
- Updated request interfaces to match database schema
- Removed references to non-existent fields
- Added proper category validation

## Testing

Created `backend/test-db-connection.ts` to verify:
1. Basic database connectivity
2. Table structure compatibility
3. CRUD operations functionality
4. Schema alignment

## Key Fixes Summary

1. ✅ **Product Handlers**: Updated to use correct database column names
2. ✅ **Function Calls**: Fixed parameter order in `recordExists` calls
3. ✅ **Error Handling**: Added comprehensive error handling and logging
4. ✅ **Schema Alignment**: All queries now match the actual database schema
5. ✅ **Type Safety**: Request interfaces match database structure
6. ✅ **Low Stock Logic**: Fixed to use correct threshold comparison
7. ✅ **Delete Operations**: Changed from soft delete to hard delete

## Next Steps

1. **Test the fixes** by running the backend server
2. **Run the test script** to verify database connectivity
3. **Test API endpoints** to ensure they work correctly
4. **Add proper authentication** to the login handler (currently has placeholder password verification)
5. **Consider adding back SKU/barcode fields** to the database schema if needed for business requirements

## Files Modified

- `backend/src/handlers/product.handlers.ts` - Major schema alignment fixes
- `backend/src/handlers/users.ts` - Fixed recordExists parameter order
- `backend/src/utils/db.ts` - Enhanced error handling
- `backend/test-db-connection.ts` - New test script (created)
- `backend/DATABASE_ISSUES_FIXED.md` - This documentation (created)

The database fetching and data sending issues should now be resolved. The backend should be able to properly communicate with the Supabase database using the correct schema structure.

## Additional Fixes - HTTP Status Code and Routing Issues

### 6. **Invalid HTTP Status Code Error**

**Problem**: The application was throwing `RangeError: Responses may only be constructed with status codes in the range 200 to 599, inclusive` error.

**Root Cause**:
- Response helper functions were being wrapped in `c.json()` calls, creating nested Response objects
- `as any` type casting was bypassing TypeScript's status code validation
- Invalid status codes were being passed to Response constructors

**Files Fixed**:
- `backend/src/handlers/categories.ts` - Fixed double Response wrapping
- `backend/src/handlers/sales.ts` - Fixed double Response wrapping
- `backend/src/handlers/product.handlers.ts` - Fixed `as any` status code casting
- `backend/src/handlers/auth.ts` - Fixed `as any` status code casting
- `backend/src/handlers/user.handlers.ts` - Fixed `as any` status code casting
- `backend/src/utils/response.ts` - Added status code validation
- `backend/src/index.ts` - Fixed CORS middleware application

**Changes Made**:
- Removed `c.json()` wrapping around response helper functions that already return Response objects
- Replaced `statusCode as any` with proper type casting and validation
- Added status code validation in response utility functions
- Fixed CORS middleware to apply directly instead of nested middleware calls
- Added proper error handling for invalid status codes

### 7. **404 Route Not Found Error**

**Problem**: Frontend was getting 404 errors when trying to access `/auth/login` endpoint.

**Root Cause**:
- Frontend API client was making requests to `/auth/login` instead of `/api/auth/login`
- Backend routes are mounted at `/api` prefix, but frontend was not using the correct endpoints

**Files Fixed**:
- `src/services/api.ts` - Fixed all auth endpoint paths to include `/api` prefix
- `src/lib/api/services/auth.ts` - Fixed profile endpoint path

**Changes Made**:
- Updated all auth endpoints from `/auth/*` to `/api/auth/*`
- Fixed login, register, logout, profile, refresh token endpoints
- Ensured consistency between frontend API calls and backend route mounting

**Example Fix**:
```typescript
// Before (WRONG):
const response = await apiClient.post<AuthResponse>('/auth/login', data);

// After (CORRECT):
const response = await apiClient.post<AuthResponse>('/api/auth/login', data);
```

## Additional Fixes - HTTP Status Code Issues

### 6. **Invalid HTTP Status Code Error**

**Problem**: The application was throwing `RangeError: Responses may only be constructed with status codes in the range 200 to 599, inclusive` error.

**Root Cause**:
- Response helper functions were being wrapped in `c.json()` calls, creating nested Response objects
- `as any` type casting was bypassing TypeScript's status code validation
- Invalid status codes were being passed to Response constructors

**Files Fixed**:
- `backend/src/handlers/categories.ts` - Fixed double Response wrapping
- `backend/src/handlers/sales.ts` - Fixed double Response wrapping
- `backend/src/handlers/product.handlers.ts` - Fixed `as any` status code casting
- `backend/src/handlers/auth.ts` - Fixed `as any` status code casting
- `backend/src/handlers/user.handlers.ts` - Fixed `as any` status code casting
- `backend/src/utils/response.ts` - Added status code validation
- `backend/src/index.ts` - Fixed CORS middleware application

**Changes Made**:
- Removed `c.json()` wrapping around response helper functions that already return Response objects
- Replaced `statusCode as any` with proper type casting and validation
- Added status code validation in response utility functions
- Fixed CORS middleware to apply directly instead of nested middleware calls
- Added proper error handling for invalid status codes

**Example Fix**:
```typescript
// Before (WRONG):
return c.json(createErrorResponse('Error', 500, {}, requestId), 500);

// After (CORRECT):
return createErrorResponse('Error', 500, {}, requestId);
```

```typescript
// Before (WRONG):
return c.json({...}, statusCode as any);

// After (CORRECT):
const validStatusCode = (statusCode >= 200 && statusCode <= 599) ? statusCode : 500;
return c.json({...}, validStatusCode as 200 | 201 | 400 | 401 | 403 | 404 | 409 | 422 | 429 | 500 | 503);
```
