# Handler Fixes Needed

## Issues to Fix:

1. **createValidationErrorResponse** - Convert Zod errors to ValidationError[]
2. **createErrorResponse** - Fix parameter order (details should be object, not string)
3. **createPaginatedResponse** - Remove extra message parameter
4. **createSuccessResponse** - Check parameter order

## Pattern to Fix Zod Validation:

```typescript
// WRONG:
return createValidationErrorResponse(validation.error, context.requestId);

// CORRECT:
const errors = validation.error.errors.map(err => ({
  field: err.path.join('.'),
  message: err.message,
}));
return createValidationErrorResponse(errors, context.requestId);
```

## Pattern to Fix Error Response:

```typescript
// WRONG:
return createErrorResponse(
  'Error message',
  500,
  'Error details string',
  context.requestId
);

// CORRECT:
return createErrorResponse(
  'Error message',
  500,
  { error: 'Error details string' },
  context.requestId
);
```

## Pattern to Fix Paginated Response:

```typescript
// WRONG:
return createPaginatedResponse(
  data,
  pagination,
  'Success message',
  context.requestId
);

// CORRECT:
return createPaginatedResponse(
  data,
  pagination,
  context.requestId
);
```

## Files to Fix:
- backend/src/handlers/categories.ts
- backend/src/handlers/contacts.ts  
- backend/src/handlers/expenses.ts
- backend/src/handlers/folders.ts
- backend/src/handlers/files.ts
- backend/src/handlers/products.ts (new damage handlers)
