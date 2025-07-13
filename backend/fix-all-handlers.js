/**
 * Script to fix all TypeScript validation errors in handler files
 * This script applies common patterns to fix the validation errors
 */

const fs = require('fs');
const path = require('path');

const handlerFiles = [
  'src/handlers/contacts.ts',
  'src/handlers/expenses.ts',
  'src/handlers/folders.ts',
  'src/handlers/files.ts',
  'src/handlers/products.ts'
];

function fixFile(filePath) {
  console.log(`Fixing ${filePath}...`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Fix 1: Zod validation errors
  content = content.replace(
    /return createValidationErrorResponse\(validation\.error, context\.requestId\);/g,
    `const errors = validation.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return createValidationErrorResponse(errors, context.requestId);`
  );
  
  // Fix 2: Error response with string details
  content = content.replace(
    /createErrorResponse\(\s*'([^']+)',\s*(\d+),\s*'([^']+)',\s*context\.requestId\s*\)/g,
    `createErrorResponse('$1', $2, { error: '$3' }, context.requestId)`
  );
  
  content = content.replace(
    /createErrorResponse\(\s*'([^']+)',\s*(\d+),\s*error instanceof Error \? error\.message : 'Unknown error',\s*context\.requestId\s*\)/g,
    `createErrorResponse('$1', $2, { error: error instanceof Error ? error.message : 'Unknown error' }, context.requestId)`
  );
  
  // Fix 3: createPaginatedResponse with extra message parameter
  content = content.replace(
    /createPaginatedResponse\(\s*([^,]+),\s*([^,]+),\s*'[^']+',\s*context\.requestId\s*\)/g,
    `createPaginatedResponse($1, $2, context.requestId)`
  );
  
  // Fix 4: createSuccessResponse parameter order
  content = content.replace(
    /createSuccessResponse\(\s*'([^']+)',\s*([^,]+),\s*context\.requestId,?\s*(\d+)?\s*\)/g,
    (match, message, data, statusCode) => {
      if (statusCode) {
        return `new Response(JSON.stringify({
      success: true,
      message: '${message}',
      data: ${data},
      requestId: context.requestId,
    }), {
      status: ${statusCode},
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': context.requestId,
      },
    })`;
      } else {
        return `createSuccessResponse(${data}, '${message}', context.requestId)`;
      }
    }
  );
  
  fs.writeFileSync(filePath, content);
  console.log(`Fixed ${filePath}`);
}

// Apply fixes to all handler files
handlerFiles.forEach(fixFile);

console.log('All handler files have been fixed!');
