# Supabase Setup Guide for LocalFishing Backend

This guide explains how to set up and configure Supabase for the LocalFishing backend with Cloudflare Workers.

## 🎯 Overview

The LocalFishing backend uses Supabase as the PostgreSQL database provider with the following features:

- **Dual Client Support**: Service role and anonymous clients with automatic fallback
- **Enhanced Error Handling**: Comprehensive error categorization and retry logic
- **Connection Health Monitoring**: Multi-level connection testing and diagnostics
- **Type Safety**: Full TypeScript support with database schema types
- **Row Level Security**: Proper data isolation and security policies

## 🔧 Environment Variables

### Required Variables

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# JWT Configuration
JWT_SECRET=your-jwt-secret-at-least-32-characters
JWT_REFRESH_SECRET=your-refresh-secret-at-least-32-characters
```

### Optional Variables

```bash
# Environment
ENVIRONMENT=development
LOG_LEVEL=debug

# CORS
CORS_ORIGIN=http://localhost:5173,http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Email (optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=your-email@gmail.com

# Cloudinary (optional)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

## 🗄️ Database Schema

The backend expects the following tables to exist in your Supabase database:

### Core Tables
- `users` - Business owners authentication
- `workers` - Employee management
- `product_categories` - Product classification
- `products` - Fish inventory with box/kg support
- `sales` - Transaction records
- `contacts` - Customer/supplier management

### Supporting Tables
- `stock_movements` - Inventory change tracking
- `expenses` - Financial tracking
- `expense_categories` - Expense classification
- `messages` - Communication logs
- `folders` - Document organization
- `files` - File storage with Cloudinary integration

## 🚀 Setup Steps

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note down your project URL and API keys

### 2. Set Up Database Schema

Run the database schema from the `database/main.sql` file:

```sql
-- Copy and paste the contents of database/main.sql
-- into your Supabase SQL editor
```

### 3. Configure Environment Variables

For **Cloudflare Workers**, set up secrets:

```bash
cd backend
pnpm dlx wrangler login
pnpm dlx wrangler secret put SUPABASE_URL
pnpm dlx wrangler secret put SUPABASE_ANON_KEY
pnpm dlx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
pnpm dlx wrangler secret put JWT_SECRET
pnpm dlx wrangler secret put JWT_REFRESH_SECRET
```

For **local development**, create `.env` file:

```bash
# Copy .env.example to .env and fill in your values
cp .env.example .env
```

### 4. Test Connection

Run the connection test script:

```bash
cd scripts
pnpm install
pnpm run test:supabase
```

### 5. Deploy and Test

Deploy your Cloudflare Worker:

```bash
cd backend
pnpm run deploy
```

Test the health endpoint:

```bash
curl https://your-worker.your-subdomain.workers.dev/health
```

## 🔍 Connection Testing

The backend includes comprehensive connection testing:

### Health Check Endpoint

```
GET /health
```

Returns detailed health information:

```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 12345,
  "version": "1.0.0",
  "environment": "development",
  "services": [
    {
      "service": "database",
      "status": "healthy",
      "responseTime": 123,
      "testResults": [
        {
          "test": "System table query",
          "success": true
        }
      ]
    }
  ]
}
```

### Manual Testing

Use the test script to verify connection:

```bash
cd scripts
node test-supabase-connection.js
```

## 🛠️ Client Configuration

### Service Role Client

- **Purpose**: Server-side operations with full database access
- **Bypasses**: Row Level Security policies
- **Use Cases**: Admin operations, data migrations, system tasks

### Anonymous Client

- **Purpose**: User-facing operations
- **Respects**: Row Level Security policies
- **Use Cases**: User authentication, data access with proper permissions

### Automatic Fallback

The backend automatically falls back to anonymous client if service role fails:

```typescript
const { client, usingServiceRole } = createSupabaseClientWithFallback(env, true);
```

## 🔒 Security Configuration

### Row Level Security (RLS)

All tables have RLS enabled with appropriate policies:

```sql
-- Example policy for users table
CREATE POLICY users_select_own ON users
    FOR SELECT
    USING (auth.uid() = user_id);
```

### JWT Configuration

Ensure your JWT secrets are:
- At least 32 characters long
- Cryptographically secure
- Different for access and refresh tokens

## 🐛 Troubleshooting

### Common Issues

1. **Connection Timeout**
   - Check Supabase project status
   - Verify network connectivity
   - Check rate limiting

2. **Authentication Errors**
   - Verify API keys are correct
   - Check JWT secret configuration
   - Ensure RLS policies are properly set

3. **Table Not Found**
   - Verify database schema is deployed
   - Check table names match exactly
   - Ensure proper permissions

### Debug Mode

Enable debug logging:

```bash
# Set environment variable
LOG_LEVEL=debug
```

### Connection Diagnostics

The health check provides detailed diagnostics:

- System table queries
- RPC function calls
- Table access tests
- Schema validation

## 📊 Monitoring

### Health Monitoring

Monitor the `/health` endpoint for:
- Database connectivity
- Response times
- Error rates
- Service availability

### Logging

The backend provides structured logging:

```
✅ Database connected successfully (service role)
🔄 Executing user creation (attempt 1/3)
⚠️ Database connection test failed, but client created
❌ Database error during user creation: Duplicate entry
```

## 🔄 Updates and Migrations

### Schema Updates

1. Update `database/main.sql`
2. Create migration scripts
3. Test in development
4. Deploy to production

### Client Updates

The Supabase client is automatically updated with:
- Enhanced error handling
- Retry logic
- Connection fallback
- Type safety improvements

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
