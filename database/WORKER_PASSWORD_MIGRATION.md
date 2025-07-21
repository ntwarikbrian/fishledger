# Worker Password Migration

This document describes the changes made to add password authentication for workers.

## Overview

Added a password column to the workers table to enable worker authentication functionality. This allows workers to log in with their email and password.

## Database Changes

### 1. Migration File
- **File**: `database/migrations/010_add_worker_password.sql`
- **Purpose**: Adds password column to workers table
- **Changes**:
  - Adds `password VARCHAR(255) NOT NULL` column
  - Sets default hashed password for existing workers
  - Adds appropriate comments

### 2. Schema Updates
- **Files**: `database/main.sql`, `database/schemas/workers.sql`
- **Changes**: Updated to include password column in table definition

### 3. Sample Data
- Updated sample worker data to include hashed passwords
- Default password for development: `password123`

## Backend Changes

### 1. TypeScript Interfaces
- **File**: `backend/src/config/supabase.ts`
- **Changes**: Updated Worker Row and Insert types to include password field

### 2. Worker Handlers
- **File**: `backend/src/handlers/workers.ts`
- **Changes**:
  - Added bcrypt import for password hashing
  - Updated `createWorker` to hash passwords before storing
  - Added `authenticateWorker` function for login
  - Updated `getAllWorkers` and `getWorkerById` to exclude password from responses
  - Password is never returned in API responses for security

### 3. Routes
- **File**: `backend/src/routes/worker.routes.ts`
- **Changes**:
  - Added `/workers/auth` POST endpoint for worker authentication
  - Authentication endpoint is public (no auth middleware)
  - All other worker endpoints require authentication

## Frontend Changes

### 1. Service Layer
- **File**: `src/services/workerService.ts`
- **Changes**:
  - Added `WorkerAuthData` and `WorkerAuthResponse` interfaces
  - Added `authenticateWorker` function
  - Updated Worker interface to include optional password field

## API Endpoints

### Worker Authentication
```
POST /api/workers/auth
Content-Type: application/json

{
  "email": "worker@example.com",
  "password": "password123"
}
```

**Response (Success)**:
```json
{
  "success": true,
  "message": "Authentication successful",
  "worker": {
    "worker_id": "uuid",
    "full_name": "Worker Name",
    "email": "worker@example.com",
    "phone_number": "+1234567890",
    "monthly_salary": 3000.00,
    "total_revenue_generated": 15000.00,
    "recent_login_history": ["2025-01-21T10:30:00Z"],
    "created_at": "2025-01-01T00:00:00Z"
  }
}
```

**Response (Error)**:
```json
{
  "success": false,
  "error": "Invalid email or password"
}
```

## Security Features

1. **Password Hashing**: Uses bcrypt with 10 salt rounds
2. **No Password Exposure**: Password field is never returned in API responses
3. **Login History**: Tracks recent login timestamps (last 10 logins)
4. **Rate Limiting**: Authentication endpoint has rate limiting applied

## Migration Instructions

### Option 1: Using the Migration Runner
```bash
cd database/migrations
node run-worker-password-migration.js
```

### Option 2: Manual SQL Execution
1. Connect to your Supabase database
2. Execute the SQL from `database/migrations/010_add_worker_password.sql`

### Option 3: Using Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the migration SQL
4. Execute the query

## Testing

### 1. Test Worker Creation
- Create a new worker through the admin interface
- Verify password is hashed in the database
- Verify password is not returned in API responses

### 2. Test Worker Authentication
- Use the `/api/workers/auth` endpoint
- Test with correct credentials (should succeed)
- Test with incorrect credentials (should fail)
- Verify login history is updated

### 3. Test Existing Workers
- Existing workers will have a default password: `password123`
- They should be able to authenticate with this password
- Consider requiring password changes on first login

## Next Steps

1. **Implement Worker Login UI**: Create a login form for workers
2. **JWT Token Generation**: Generate JWT tokens for authenticated workers
3. **Worker Dashboard**: Create a worker-specific dashboard
4. **Password Reset**: Implement password reset functionality
5. **Force Password Change**: Require existing workers to change default passwords

## Security Considerations

1. **Default Passwords**: Change default passwords in production
2. **Password Policy**: Implement password strength requirements
3. **Session Management**: Implement proper session/token management
4. **Audit Logging**: Log authentication attempts
5. **Account Lockout**: Consider implementing account lockout after failed attempts
