# Local Fishing Backend

A Cloudflare Workers backend built with TypeScript for the Local Fishing inventory management system.

## Features

- **Authentication & Authorization**: Clerk-based authentication for admins (Google OAuth via Clerk), JWT-based for worker users, role-based access control
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
  - **Admins:** Clerk (Sign in with Google via Clerk, managed session tokens, enforced with backend Clerk middleware)
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
│   │   ├── clerk.ts   # Clerk middleware for admin endpoints
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

### Admin Authentication (Clerk)
- All admin endpoints require a valid Clerk session token in the Authorization header
- Authentication is enforced using Clerk middleware in Hono
- Admin sign-in is managed via Clerk's "Sign in with Google" (or other SSO options Clerk offers)

### Worker Authentication (JWT)
- Worker endpoints use traditional JWT authentication
- Endpoints:
  - `POST /api/auth/worker-login` - Worker login
  - `POST /api/auth/worker-refresh` - Token refresh
  - `GET /api/auth/worker-verify` - Token verification

(Other endpoints remain unchanged)

## Authentication & Authorization

- Clerk-based authentication secures all admin routes:
  - Clerk's React SDK on the frontend handles session and token issuance
  - Backend Clerk middleware verifies incoming requests and extracts the authorized user's information and role
  - Only users with the `admin` role (as provisioned by Clerk) can access protected admin routes
- Worker endpoints follow previous JWT authentication, verified using backend JWT logic

## Environment Variables

### Admin (Clerk)
- `CLERK_SECRET_KEY` - Clerk backend secret (for validation)

### Database
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key

## Setup and Usage

1. Set up Clerk in your Clerk dashboard; set publishable and secret keys in your frontend and backend environments
2. Frontend uses Clerk components for login and session management (see frontend README for details)
3. Backend uses Clerk middleware for admin route protection
4. All other setup and deployment instructions are unchanged

## Notes
- Database and user provisioning is automatic for admins via Clerk's first login
- No admin passwords are present or needed for Clerk users
- Worker authentication continues via the established legacy endpoints until all users fully migrate to Clerk
