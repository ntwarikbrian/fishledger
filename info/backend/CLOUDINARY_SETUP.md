# Cloudinary Integration Setup Guide

This guide explains how to set up and use Cloudinary for file uploads in the Local Fishing Backend.

## Overview

The backend now includes comprehensive Cloudinary integration for handling image and file uploads. This includes:

- **CloudinaryService**: Core service for interacting with Cloudinary API
- **FileUploadService**: High-level service for handling file uploads
- **File Upload Middleware**: Hono middleware for processing multipart form data
- **Upload Routes**: RESTful endpoints for various upload scenarios

## Configuration

### Environment Variables

The following environment variables need to be configured:

```bash
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Setting Up Cloudinary Account

1. **Create Account**: Sign up at [cloudinary.com](https://cloudinary.com)
2. **Get Credentials**: Find your credentials in the Dashboard
3. **Configure Environment**: Add credentials to `wrangler.toml` or set as secrets

### Production Deployment

For production, use Wrangler secrets instead of environment variables:

```bash
wrangler secret put CLOUDINARY_CLOUD_NAME
wrangler secret put CLOUDINARY_API_KEY
wrangler secret put CLOUDINARY_API_SECRET
```

## File Structure

```
src/
├── config/
│   └── cloudinary.ts          # Cloudinary configuration and service
├── utils/
│   └── fileUpload.ts          # File upload utilities
├── middleware/
│   └── fileUpload.ts          # File upload middleware
└── routes/
    └── upload.ts              # Upload route handlers
```

## Usage Examples

### Basic Image Upload

```typescript
// POST /api/upload/image
// Content-Type: multipart/form-data
// Body: image file with field name "image"

const formData = new FormData();
formData.append('image', file);

const response = await fetch('/api/upload/image', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer your_jwt_token'
  },
  body: formData
});
```

### Multiple Image Upload

```typescript
// POST /api/upload/images
// Content-Type: multipart/form-data
// Body: multiple image files with field name "images"

const formData = new FormData();
files.forEach(file => {
  formData.append('images', file);
});

const response = await fetch('/api/upload/images', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer your_jwt_token'
  },
  body: formData
});
```

### Avatar Upload

```typescript
// POST /api/upload/avatar
// Automatically resizes to 200x200 and generates responsive URLs

const formData = new FormData();
formData.append('avatar', avatarFile);

const response = await fetch('/api/upload/avatar', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer your_jwt_token'
  },
  body: formData
});
```

### Base64 Upload

```typescript
// POST /api/upload/base64
// Content-Type: application/json

const response = await fetch('/api/upload/base64', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer your_jwt_token',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    data: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...',
    filename: 'image.jpg',
    folder: 'local-fishing/products'
  })
});
```

## Available Endpoints

### Upload Endpoints

- `POST /api/upload/image` - Upload single image
- `POST /api/upload/images` - Upload multiple images
- `POST /api/upload/avatar` - Upload user avatar
- `POST /api/upload/product` - Upload product images
- `POST /api/upload/receipt` - Upload receipts/documents
- `POST /api/upload/base64` - Upload from base64 data

### Management Endpoints

- `DELETE /api/upload/:publicId` - Delete uploaded file
- `GET /api/upload/info/:publicId` - Get file information

## Middleware Usage

### Basic File Upload Middleware

```typescript
import { fileUploadMiddleware } from '../middleware/fileUpload';

app.post('/upload', 
  fileUploadMiddleware({
    maxFiles: 5,
    allowedTypes: ['jpg', 'jpeg', 'png'],
    maxSize: 5242880, // 5MB
    folder: 'my-folder'
  }),
  async (c) => {
    const files = getUploadedFiles(c);
    // Process files...
  }
);
```

### Specialized Middleware

```typescript
import { 
  imageUploadMiddleware,
  avatarUploadMiddleware,
  productImageUploadMiddleware 
} from '../middleware/fileUpload';

// Image upload with validation
app.post('/image', imageUploadMiddleware('image'), handler);

// Avatar upload with auto-resize
app.post('/avatar', avatarUploadMiddleware(), handler);

// Product images (up to 5 files)
app.post('/product', productImageUploadMiddleware(), handler);
```

## Service Usage

### CloudinaryService

```typescript
import { createCloudinaryService } from '../config/cloudinary';

const cloudinaryService = createCloudinaryService(env);

// Upload file
const result = await cloudinaryService.uploadFile(buffer, {
  folder: 'products',
  quality: 'auto:good',
  width: 800,
  height: 800
});

// Generate responsive URLs
const urls = cloudinaryService.generateResponsiveUrls(publicId, [
  { name: 'thumbnail', width: 150, height: 150 },
  { name: 'medium', width: 400, height: 400 }
]);

// Delete file
await cloudinaryService.deleteFile(publicId);
```

### FileUploadService

```typescript
import { createFileUploadService } from '../utils/fileUpload';

const uploadService = createFileUploadService(env);

// Parse multipart data
const files = await uploadService.parseMultipartData(request);

// Upload single file
const result = await uploadService.uploadSingleFile(file, {
  folder: 'uploads',
  generateUniqueName: true
});

// Upload multiple files
const results = await uploadService.uploadMultipleFiles(files, options);
```

## Folder Structure

The system uses organized folder structure in Cloudinary:

```
local-fishing/
├── products/          # Product images
├── users/            # User avatars and profiles
├── receipts/         # Receipt and document images
├── documents/        # General documents
└── temp/            # Temporary uploads
```

## Image Transformations

### Predefined Presets

```typescript
import { IMAGE_PRESETS } from '../config/cloudinary';

// Available presets:
// - THUMBNAIL: 150x150, crop fill
// - SMALL: 300x300, crop fit
// - MEDIUM: 600x600, crop fit
// - LARGE: 1200x1200, crop fit
// - AVATAR: 100x100, crop fill, face gravity
// - PRODUCT: 400x400, crop fit
```

### Custom Transformations

```typescript
const transformedUrl = cloudinaryService.generateUrl(publicId, {
  width: 500,
  height: 300,
  crop: 'fill',
  gravity: 'face',
  quality: 'auto:best',
  format: 'webp'
});
```

## Error Handling

The system includes comprehensive error handling:

- **Validation Errors**: File type, size, and format validation
- **Upload Errors**: Network and Cloudinary API errors
- **Configuration Errors**: Missing or invalid credentials
- **Processing Errors**: Image transformation failures

## Security Features

- **Authentication Required**: All upload endpoints require JWT authentication
- **File Type Validation**: Strict file type checking
- **Size Limits**: Configurable file size limits
- **Folder Isolation**: Organized folder structure prevents conflicts
- **Secure URLs**: All URLs use HTTPS

## Performance Optimizations

- **Auto Quality**: Automatic quality optimization
- **Format Selection**: Automatic format selection (WebP when supported)
- **Responsive Images**: Multiple sizes generated automatically
- **CDN Delivery**: Global CDN for fast image delivery

## Monitoring and Logging

- **Upload Tracking**: All uploads are logged
- **Error Logging**: Detailed error information
- **Performance Metrics**: Upload timing and success rates
- **Usage Statistics**: File count and storage usage

## Troubleshooting

### Common Issues

1. **Configuration Missing**: Check environment variables
2. **File Too Large**: Verify MAX_FILE_SIZE setting
3. **Invalid File Type**: Check allowedTypes configuration
4. **Upload Timeout**: Increase timeout settings
5. **Quota Exceeded**: Check Cloudinary account limits

### Debug Endpoints

Use debug endpoints to test configuration:

```bash
# Test Cloudinary configuration
GET /debug/cloudinary

# Check environment variables
GET /debug/env
```

## Best Practices

1. **Use Appropriate Folders**: Organize files by type and purpose
2. **Set Size Limits**: Configure reasonable file size limits
3. **Validate File Types**: Always validate file types on upload
4. **Generate Unique Names**: Use unique filenames to prevent conflicts
5. **Clean Up**: Delete unused files regularly
6. **Monitor Usage**: Track storage and bandwidth usage
7. **Use Transformations**: Optimize images for different use cases

## Integration Examples

### Frontend Integration

```javascript
// React/Vue component example
const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append('image', file);
  
  try {
    const response = await fetch('/api/upload/image', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    const result = await response.json();
    if (result.success) {
      console.log('Upload successful:', result.data);
      return result.data.file.secure_url;
    }
  } catch (error) {
    console.error('Upload failed:', error);
  }
};
```

This integration provides a robust, scalable solution for file uploads in the Local Fishing application.
