# Cloudinary Integration Setup

This document provides comprehensive information about the Cloudinary integration for file uploads in the Fish Selling Management System.

## Overview

The system uses Cloudinary as the primary file storage service for handling document uploads, image processing, and file management. All files are uploaded to Cloudinary and their metadata is stored in the PostgreSQL database.

## Configuration

### Environment Variables

Add the following environment variables to your `.env` file:

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=dji23iymw
CLOUDINARY_API_KEY=162843632338622
CLOUDINARY_API_SECRET=pB_7QOUVorneWKAer1aErW-yNe0
```

### File Structure

```
server/
├── config/
│   └── cloudinary.ts          # Cloudinary SDK configuration
├── services/
│   └── fileUploadService.ts   # File upload business logic
├── middleware/
│   └── upload.ts              # Multer configuration and validation
├── routes/
│   └── files.ts               # File management API endpoints
├── utils/
│   ├── cloudinaryTest.ts      # Connection testing utility
│   └── fileErrorHandler.ts    # Comprehensive error handling
└── docs/
    └── CLOUDINARY_SETUP.md    # This documentation
```

## API Endpoints

### Upload Single File
```http
POST /api/files/upload
Content-Type: multipart/form-data

Body:
- file: File (required)
- folder_id: string (required)
- description: string (optional)
```

### Upload Multiple Files
```http
POST /api/files/upload-multiple
Content-Type: multipart/form-data

Body:
- files: File[] (required, max 10 files)
- folder_id: string (required)
- description: string (optional)
```

### Get Files by Folder
```http
GET /api/files?folder_id={folder_id}
```

### Get File by ID
```http
GET /api/files/{file_id}
```

### Delete File
```http
DELETE /api/files/{file_id}
```

## Supported File Types

### Images
- JPEG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif)
- WebP (.webp)
- SVG (.svg)

### Documents
- PDF (.pdf)
- Microsoft Word (.doc, .docx)
- Microsoft Excel (.xls, .xlsx)
- Microsoft PowerPoint (.ppt, .pptx)
- Text files (.txt)
- CSV files (.csv)

### Archives
- ZIP (.zip)
- RAR (.rar)
- 7-Zip (.7z)

### Videos (Optional)
- MP4 (.mp4)
- MPEG (.mpeg)
- QuickTime (.mov)
- AVI (.avi)

## File Size Limits

- Maximum file size: 10MB (configurable via `MAX_FILE_SIZE` environment variable)
- Maximum files per request: 10 files
- Total request size limit: 50MB

## Database Schema

The files are stored with the following structure:

```sql
CREATE TABLE files (
    file_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    cloudinary_public_id VARCHAR(255),
    cloudinary_url TEXT,
    cloudinary_secure_url TEXT,
    file_type VARCHAR(100),
    cloudinary_resource_type VARCHAR(20) DEFAULT 'auto',
    description TEXT,
    folder_id UUID NOT NULL REFERENCES folders(folder_id),
    file_size INTEGER,
    upload_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    added_by UUID NOT NULL REFERENCES users(user_id)
);
```

## Error Handling

The system provides comprehensive error handling for various scenarios:

### Error Types
- `UPLOAD_FAILED`: General upload failure
- `CLOUDINARY_ERROR`: Cloudinary service errors
- `DATABASE_ERROR`: Database operation errors
- `VALIDATION_ERROR`: File validation errors
- `FILE_NOT_FOUND`: File not found errors
- `ACCESS_DENIED`: Permission errors
- `FILE_TOO_LARGE`: File size limit exceeded
- `INVALID_FILE_TYPE`: Unsupported file type
- `QUOTA_EXCEEDED`: Storage quota exceeded
- `NETWORK_ERROR`: Network connectivity issues

### Error Response Format
```json
{
  "success": false,
  "message": "User-friendly error message",
  "error": "ERROR_TYPE",
  "retryable": true,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Testing

### Test Cloudinary Connection
```bash
npm run test:cloudinary
```

### Manual Testing
1. Start the server: `npm run dev`
2. Use a tool like Postman to test the upload endpoints
3. Check the Cloudinary dashboard for uploaded files
4. Verify database entries in the `files` table

## Security Features

### File Validation
- MIME type validation
- File extension validation
- File size validation
- Malicious file detection

### Access Control
- User authentication required
- Permission-based access control
- User can only access their own files
- Folder-based organization

### Cloudinary Security
- Secure HTTPS URLs
- API key authentication
- Resource type validation
- Automatic format optimization

## Performance Optimizations

### Image Processing
- Automatic quality optimization
- Format optimization (WebP, AVIF)
- Lazy loading support
- Responsive image generation

### Caching
- Cloudinary CDN caching
- Browser caching headers
- Optimized delivery

### Database
- Indexed queries on frequently accessed fields
- Efficient folder statistics tracking
- Optimized file metadata storage

## Troubleshooting

### Common Issues

1. **Upload fails with authentication error**
   - Check Cloudinary credentials in environment variables
   - Verify API key and secret are correct

2. **File not found after upload**
   - Check database connection
   - Verify folder exists
   - Check user permissions

3. **Large files fail to upload**
   - Check file size limits
   - Verify Cloudinary account limits
   - Check network timeout settings

4. **Invalid file type error**
   - Check supported file types list
   - Verify MIME type detection
   - Check file extension validation

### Debug Mode
Set `NODE_ENV=development` to enable detailed error messages and logging.

## Monitoring

### Cloudinary Dashboard
- Monitor upload statistics
- Track storage usage
- View transformation usage
- Check API usage limits

### Application Logs
- File upload success/failure rates
- Error frequency and types
- Performance metrics
- User activity patterns

## Best Practices

1. **File Organization**
   - Use descriptive folder names
   - Organize files by type or purpose
   - Regular cleanup of unused files

2. **Performance**
   - Optimize images before upload when possible
   - Use appropriate file formats
   - Monitor storage usage

3. **Security**
   - Validate all file uploads
   - Implement proper access controls
   - Regular security audits

4. **Maintenance**
   - Regular backup of file metadata
   - Monitor Cloudinary usage limits
   - Clean up orphaned files
