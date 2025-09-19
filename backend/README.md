# Local Fishing Backend

A Cloudflare Workers backend built with TypeScript for the Local Fishing inventory management system.

## Features

- **Authentication & Authorization**: JWT-based authentication with role-based access control
- **User Management**: Complete CRUD operations for user accounts
- **Product Management**: Inventory management with stock tracking
- **Sales Management**: Transaction processing and sales tracking
- **Stock Movements**: Comprehensive inventory movement tracking
- **Real-time Database**: Supabase integration for PostgreSQL database
- **Type Safety**: Full TypeScript implementation with comprehensive type definitions
- **Middleware**: CORS, authentication, rate limiting, and logging middleware
- **Error Handling**: Comprehensive error handling with detailed responses

## Tech Stack

- **Runtime**: Cloudflare Workers
- **Language**: TypeScript
- **Database**: PostgreSQL (Supabase)
- **Authentication**: JWT tokens
- **Validation**: Zod schema validation
- **Password Hashing**: bcryptjs

## Project Structure

```
backend/
├── src/
│   ├── config/           # Configuration files
│   │   ├── environment.ts
│   │   └── supabase.ts
│   ├── handlers/         # API route handlers
│   │   ├── auth.ts
│   │   ├── users.ts
│   │   ├── products.ts
│   │   ├── sales.ts
│   │   └── stock-movements.ts
│   ├── middleware/       # Middleware functions
│   │   ├── auth.ts
│   │   └── cors.ts
│   ├── types/           # TypeScript type definitions
│   │   └── index.ts
│   ├── utils/           # Utility functions
│   │   ├── auth.ts
│   │   ├── db.ts
│   │   ├── response.ts
│   │   └── router.ts
│   └── index.ts         # Main entry point
├── package.json
├── tsconfig.json
├── wrangler.toml
└── eslint.config.js
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get current user profile

### Users
- `GET /api/users` - Get all users (paginated)
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (soft delete)

### Products
- `GET /api/products` - Get all products (paginated, filterable)
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create new product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product (soft delete)
- `GET /api/products/low-stock` - Get products with low stock

### Sales
- `GET /api/sales` - Get all sales (paginated, filterable)
- `GET /api/sales/:id` - Get sale by ID
- `POST /api/sales` - Create new sale
- `PUT /api/sales/:id` - Update sale

### Stock Movements
- `GET /api/stock-movements` - Get all stock movements (paginated, filterable)
- `POST /api/stock-movements` - Create new stock movement
- `GET /api/products/:productId/stock-movements` - Get stock movements for a product
- `GET /api/products/:productId/stock-summary` - Get stock summary for a product

### Health Check
- `GET /health` - Application health status

## Setup Instructions

### Prerequisites
- Node.js 18+
- pnpm
- Cloudflare account
- Supabase account

### Installation

1. **Install dependencies**:
   ```bash
   pnpm install
   ```

2. **Install Wrangler CLI globally**:
   ```bash
   pnpm install -g wrangler
   ```

3. **Login to Cloudflare**:
   ```bash
   wrangler login
   ```

4. **Configure environment variables**:
   Update `wrangler.toml` with your environment variables or use Wrangler secrets:
   ```bash
   wrangler secret put SUPABASE_URL
   wrangler secret put SUPABASE_SERVICE_ROLE_KEY
   wrangler secret put JWT_SECRET
   # ... add other secrets
   ```

### Development

1. **Start development server**:
   ```bash
   pnpm run dev
   ```

2. **Run type checking**:
   ```bash
   pnpm run type-check
   ```

3. **Run linting**:
   ```bash
   pnpm run lint
   ```

### Deployment

1. **Deploy to Cloudflare Workers**:
   ```bash
   pnpm run deploy
   ```

## Environment Variables

The following environment variables are required:

### Database
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key

### Authentication
- `JWT_SECRET` - Secret for signing JWT tokens (min 32 characters)
- `JWT_EXPIRES_IN` - JWT token expiration time (default: 7d)
- `JWT_REFRESH_SECRET` - Secret for refresh tokens (min 32 characters)
- `JWT_REFRESH_EXPIRES_IN` - Refresh token expiration (default: 30d)

### CORS
- `CORS_ORIGIN` - Allowed origins (comma-separated)

### Rate Limiting
- `RATE_LIMIT_WINDOW_MS` - Rate limit window in milliseconds
- `RATE_LIMIT_MAX_REQUESTS` - Maximum requests per window

### Email (Optional)
- `EMAIL_HOST` - SMTP host
- `EMAIL_PORT` - SMTP port
- `EMAIL_USER` - SMTP username
- `EMAIL_PASSWORD` - SMTP password
- `EMAIL_FROM` - From email address

### File Upload (Optional)
- `CLOUDINARY_CLOUD_NAME` - Cloudinary cloud name
- `CLOUDINARY_API_KEY` - Cloudinary API key
- `CLOUDINARY_API_SECRET` - Cloudinary API secret

## Database Schema

The backend expects the following database tables:

- `users` - User accounts and profiles
- `products` - Product catalog and inventory
- `sales` - Sales transactions
- `stock_movements` - Inventory movement tracking

Refer to the database schema files in the `database/` directory of the main project.

## Authentication & Authorization

The API uses JWT-based authentication with the following roles:
- `admin` - Full access to all resources
- `manager` - Access to most resources except user management
- `employee` - Limited access to basic operations

## Error Handling

All API responses follow a consistent format:

**Success Response**:
```json
{
  "success": true,
  "data": {...},
  "message": "Operation successful",
  "timestamp": "2025-07-10T19:47:00.000Z",
  "requestId": "req_1720647420000_abc123"
}
```

**Error Response**:
```json
{
  "success": false,
  "error": "Error message",
  "timestamp": "2025-07-10T19:47:00.000Z",
  "requestId": "req_1720647420000_abc123"
}
```

## Contributing

1. Follow TypeScript best practices
2. Add comprehensive error handling
3. Include JSDoc comments for all functions
4. Write tests for new features
5. Follow the existing code structure and patterns

## License

MIT License
