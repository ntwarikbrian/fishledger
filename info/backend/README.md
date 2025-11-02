# Local Fishing Backend

A Cloudflare Workers backend built with TypeScript for the Local Fishing inventory management system.

## Features

- **Authentication & Authorization**: Supabase Auth for all users (Google OAuth and email/password), role-based access control
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
- **Authentication**:
  - **Admins:** Supabase Auth (Sign in with Google/Email, managed session tokens, enforced with backend Supabase middleware)
  - **Workers:** JWT tokens (traditional email/password)
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
│   │   ├── auth.ts    # Supabase Auth middleware for protected endpoints
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

### Admin Authentication (Supabase Auth)
- All admin endpoints require a valid Supabase JWT in the Authorization header
- Authentication is enforced using Supabase Auth middleware in Hono
- Admin sign-in is managed via Supabase Auth UI (Google SSO, email/password)

### Worker Authentication (JWT)
- Worker endpoints use traditional JWT authentication
- Endpoints:
  - `POST /api/auth/worker-login` - Worker login
  - `POST /api/auth/worker-refresh` - Token refresh
  - `GET /api/auth/worker-verify` - Token verification

(Other endpoints remain unchanged)

## Authentication & Authorization

- Supabase Auth secures all protected routes:
  - Supabase Client on the frontend handles session and token management
  - Backend Supabase middleware verifies incoming requests and extracts the authorized user's information and role
  - Only users with the appropriate role (set in Supabase) can access protected routes
- Worker endpoints follow previous JWT authentication, verified using backend JWT logic

## Environment Variables

### Admin (Supabase Auth)
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_KEY` - Supabase service role key for backend operations

### Database
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key

## Setup and Usage

1. Set up project in your Supabase dashboard; configure URL and API keys in frontend and backend environments
2. Frontend uses Supabase Auth UI components for login and session management (see frontend README for details)
3. Backend uses Supabase Auth middleware for route protection
4. All other setup and deployment instructions are unchanged

## Notes
- Database and user provisioning is handled through Supabase Auth
- Passwords are securely managed by Supabase Auth for all users
- All authentication is unified through Supabase Auth with role-based access control
