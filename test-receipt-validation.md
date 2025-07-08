# Receipt Upload Format Validation Test

## Overview
This document demonstrates how the expense receipt upload now strictly validates image formats to only accept JPEG, GIF, PNG, and WebP files.

## Changes Made

### 1. Backend Middleware (`server/middleware/upload.ts`)
- Created `receiptOnlyFilter` that only allows specific formats:
  - `image/jpeg`
  - `image/jpg` 
  - `image/png`
  - `image/webp`
  - `image/gif`
- Added `uploadSingleReceipt` middleware for receipt-specific uploads
- Enhanced error handling with specific error message: "Upload required image format. Only JPEG, GIF, PNG, and WebP are allowed."

### 2. Backend Routes (`server/routes/expenses.ts`)
- Updated expense creation route to handle file uploads directly
- Uses `uploadSingleReceipt` middleware for validation
- Automatically uploads valid files to Cloudinary during expense creation

### 3. Frontend (`src/pages/Expenses.tsx`)
- Updated file input to only accept: `.jpg,.jpeg,.png,.webp,.gif`
- Added client-side validation with same error message
- Modified expense creation to send file directly with form data
- Updated UI text to reflect supported formats

### 4. API Service (`src/lib/api.ts`)
- Added `createWithFile` method that sends FormData with file attachment

## Testing the Validation

### ✅ Accepted Formats
Try uploading these file types - they should work:
- `.jpg` or `.jpeg` files
- `.png` files  
- `.webp` files
- `.gif` files

### ❌ Rejected Formats  
Try uploading these file types - they should be rejected with error message:
- `.pdf` files
- `.doc` or `.docx` files
- `.txt` files
- `.bmp` files
- `.tiff` files
- `.svg` files
- Any other non-image formats

## Expected Behavior

1. **Frontend Validation**: When you select an invalid file, you'll see:
   > "Upload required image format. Only JPEG, GIF, PNG, and WebP are allowed."

2. **Backend Validation**: If somehow an invalid file reaches the backend, it will be rejected with the same error message.

3. **Successful Upload**: Valid files will be uploaded to Cloudinary and associated with the expense.

## Error Messages
- **Client-side**: "Upload required image format. Only JPEG, GIF, PNG, and WebP are allowed."
- **Server-side**: "Upload required image format. Only JPEG, GIF, PNG, and WebP are allowed. Received: [mimetype]"

## How to Test

1. Go to the Expenses page
2. Click "Add Expense" 
3. Fill in the required fields (title, amount, category, date)
4. Try to upload a receipt with an unsupported format (e.g., .pdf, .txt, .bmp)
5. You should see the error message and the file should be rejected
6. Try uploading a supported format (e.g., .jpg, .png, .webp, .gif)
7. The file should be accepted and the expense should be created successfully

## Technical Implementation

The validation happens at multiple levels:
1. **HTML Input**: `accept=".jpg,.jpeg,.png,.webp,.gif"`
2. **Frontend JS**: Validates `file.type` against allowed MIME types
3. **Backend Middleware**: `receiptOnlyFilter` validates MIME type before processing
4. **Error Handling**: Consistent error messages across all validation points
