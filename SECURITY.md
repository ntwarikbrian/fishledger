# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability in this project, please report it by emailing [ntwaribrian262@gmail.com](mailto:ntwarikbrian@gmail.com).

Please do not create public GitHub issues for security vulnerabilities.

## Security Practices

### Credential Management

This project follows strict credential management practices:

1. **No Hardcoded Secrets**: Sensitive credentials are never committed to the repository
2. **Wrangler Secrets**: All secrets are managed through Cloudflare Wrangler secrets
3. **Environment Validation**: Zod schema validation ensures all required environment variables are present and correctly formatted

### Data Protection

1. **Data Isolation**: Multi-tenant architecture ensures complete data isolation between users
2. **Database Security**: Row-level security policies in Supabase PostgreSQL
3. **Authentication**: JWT-based authentication with secure token handling

### Secure Configuration

The application implements several security measures:

1. **Input Validation**: All API inputs are validated using Zod schemas
2. **CORS Configuration**: Proper CORS headers to prevent unauthorized access
3. **Rate Limiting**: API rate limiting to prevent abuse
4. **Error Handling**: Secure error responses that don't expose sensitive information

## Key Rotation Process

When rotating secrets, follow these steps:

1. Generate new secrets for all services
2. Update secrets using `wrangler secret put` commands
3. Test the application with new secrets
4. Invalidate existing user sessions
5. Notify users if necessary

## Secret Management Commands

To manage secrets in the backend:

```bash
# Navigate to the backend directory
cd backend

# Set all required secrets
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_ANON_KEY
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
wrangler secret put JWT_SECRET
wrangler secret put JWT_REFRESH_SECRET
wrangler secret put CLOUDINARY_CLOUD_NAME
wrangler secret put CLOUDINARY_API_KEY
wrangler secret put CLOUDINARY_API_SECRET
wrangler secret put EMAIL_USER
wrangler secret put EMAIL_PASSWORD

```

For detailed instructions, see [backend/README.md](backend/README.md).