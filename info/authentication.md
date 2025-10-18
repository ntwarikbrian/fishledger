# Authentication System Documentation

## Overview

This document outlines the authentication system for the LocalFishing Management System, which now implements **Google OAuth for admin users** while maintaining **traditional email/password authentication for worker users**.

## Current Authentication Structure

### 🔐 Admin Users (Business Owners)
- **Authentication Method**: Google OAuth 2.0
- **Registration**: Automatic upon first Google login
- **Login**: Google Sign-in button only
- **User Data**: Extracted from Google profile (email, name, business info)
- **Tokens**: JWT tokens generated after successful Google authentication

### 👷 Worker Users (Staff Members) 
- **Authentication Method**: Traditional email/password + business name
- **Registration**: Manual registration by admin/business owner
- **Login**: Email, password, and business name form
- **User Data**: Stored in database with encrypted passwords
- **Tokens**: JWT tokens generated after password verification

## Implementation Details

### Google OAuth Configuration

#### Required Environment Variables

**Frontend (.env.local):**
```env
# Google OAuth Configuration
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
VITE_GOOGLE_REDIRECT_URI=http://localhost:5000/auth/google/callback
VITE_API_URL=http://localhost:8080
```

**Backend (backend/.env):**
```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:8080/api/auth/google/callback

# Existing Supabase and JWT configuration remains unchanged
```

#### Google Cloud Console Setup

1. **Create Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create new project or select existing one

2. **Enable Google+ API**
   - Navigate to "APIs & Services" → "Library"
   - Search for "Google+ API" and enable it

3. **Create OAuth 2.0 Credentials**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth 2.0 Client IDs"
   - Select "Web application"
   - Add authorized redirect URIs:
     - `http://localhost:5000/auth/google/callback` (development)
     - `https://your-domain.com/auth/google/callback` (production)

4. **Configure OAuth Consent Screen**
   - Set application name: "LocalFishing Management System"
   - Add authorized domains
   - Configure scopes: email, profile, openid

### Backend Implementation

#### New Google OAuth Endpoints

**GET /api/auth/google** - Initiates Google OAuth flow
```typescript
// Redirects user to Google OAuth consent screen
// Returns: 302 redirect to Google OAuth URL
```

**POST /api/auth/google/callback** - Handles Google OAuth callback
```typescript
// Processes Google OAuth code
// Creates/updates user account
// Returns: JWT tokens for authenticated user
```

**POST /api/auth/google/verify** - Verifies Google ID token
```typescript
// Verifies Google ID token client-side flow
// Creates/updates user account  
// Returns: JWT tokens for authenticated user
```

#### User Account Creation Flow

When a user logs in with Google for the first time:

1. **Extract Google Profile Data**
   - Email address (primary key)
   - Full name (owner_name)
   - Google ID (for future reference)

2. **Auto-Generate Business Information**
   - Business name: Derived from email domain or user input
   - Phone number: Optional, can be added later
   - Account status: Active by default

3. **Create Database Record**
   ```sql
   INSERT INTO users (
     user_id,
     email_address,
     business_name,
     owner_name,
     password, -- Set to null for Google OAuth users
     google_id,
     is_active,
     created_at
   ) VALUES (
     uuid_generate_v4(),
     'user@company.com',
     'Company Business',
     'John Doe',
     null,
     'google_user_id_123',
     true,
     now()
   );
   ```

4. **Generate JWT Tokens**
   - Access token with user information
   - Refresh token for session management

### Frontend Implementation

#### UI Changes

**Login Page (src/pages/Login.tsx)**
- **Admin Tab**: Remove email/password form, replace with "Sign in with Google" button
- **Worker Tab**: Keep existing email/password/business_name form unchanged
- Add Google OAuth redirect handling

**Registration Page (src/pages/Register.tsx)**
- **Complete Removal**: Admin registration form removed entirely
- **Worker Registration**: Remains unchanged (handled by admin)
- **Redirect Logic**: Admin users redirected to Google OAuth

#### Google OAuth Integration

**Google Auth Service (src/services/googleAuth.ts)**
```typescript
export class GoogleAuthService {
  private clientId: string;
  
  // Initialize Google OAuth
  initializeGoogleAuth(): Promise<void>
  
  // Trigger Google sign-in
  signInWithGoogle(): Promise<GoogleAuthResponse>
  
  // Handle OAuth callback
  handleGoogleCallback(code: string): Promise<AuthResponse>
  
  // Sign out from Google
  signOutFromGoogle(): Promise<void>
}
```

### Security Considerations

#### Google OAuth Security
- **CSRF Protection**: State parameter validation
- **Token Validation**: Verify Google ID tokens server-side
- **Scope Limitation**: Only request necessary permissions (email, profile)
- **Secure Storage**: JWT tokens stored securely client-side

#### Worker Authentication Security  
- **Password Hashing**: bcrypt with salt rounds (unchanged)
- **Rate Limiting**: Prevent brute force attacks (unchanged)
- **Session Management**: JWT token rotation (unchanged)
- **Business Isolation**: Workers can only access their business data (unchanged)

### Database Schema Changes

#### Users Table Modifications
```sql
-- Add Google OAuth support to existing users table
ALTER TABLE users 
ADD COLUMN google_id VARCHAR(255) UNIQUE NULL,
ADD COLUMN auth_provider VARCHAR(20) DEFAULT 'email' CHECK (auth_provider IN ('email', 'google')),
ADD COLUMN profile_picture_url TEXT NULL;

-- Allow password to be null for Google OAuth users
ALTER TABLE users ALTER COLUMN password DROP NOT NULL;

-- Add index for Google ID lookups
CREATE INDEX idx_users_google_id ON users(google_id) WHERE google_id IS NOT NULL;

-- Add constraint to ensure either password or google_id exists
ALTER TABLE users ADD CONSTRAINT chk_auth_method 
CHECK (
  (auth_provider = 'email' AND password IS NOT NULL) OR 
  (auth_provider = 'google' AND google_id IS NOT NULL)
);
```

### Migration Strategy

#### Phase 1: Preparation
1. Add Google OAuth dependencies to package.json
2. Create Google Cloud Project and configure OAuth
3. Add environment variables for Google OAuth
4. Update database schema with new columns

#### Phase 2: Backend Implementation
1. Create Google OAuth handlers
2. Modify user creation logic to support Google users
3. Update authentication middleware to handle both auth types
4. Add Google token verification utilities

#### Phase 3: Frontend Implementation  
1. Install Google OAuth libraries
2. Create Google Auth service
3. Modify login page UI (remove admin registration/login forms)
4. Add Google Sign-in button for admin users
5. Keep worker login forms unchanged

#### Phase 4: Testing & Deployment
1. Test Google OAuth flow end-to-end
2. Verify worker authentication still works
3. Test user creation and data isolation
4. Deploy with proper environment variables

### API Endpoints Summary

#### Admin Authentication (Google OAuth)
- `GET /api/auth/google` - Start OAuth flow
- `POST /api/auth/google/callback` - Handle OAuth callback  
- `POST /api/auth/google/verify` - Verify Google ID token
- `POST /api/auth/logout` - Logout (same for both auth types)
- `GET /api/auth/profile` - Get user profile (same for both auth types)

#### Worker Authentication (Email/Password) - **UNCHANGED**
- `POST /api/auth/worker-login` - Worker login
- `POST /api/auth/worker-refresh` - Worker token refresh
- `GET /api/auth/worker-verify` - Worker token verification

### Error Handling

#### Google OAuth Errors
- **Invalid OAuth Code**: Return 400 with clear error message
- **Google API Failure**: Fallback gracefully, log error
- **User Creation Failure**: Return 500 with retry instructions
- **Token Generation Failure**: Return 500 with system error

#### Worker Auth Errors - **UNCHANGED**
- All existing worker authentication error handling remains the same
- Password validation, business name verification, etc.

### Testing Strategy

#### Unit Tests
- Google OAuth token verification
- User creation with Google profile data
- JWT token generation for Google users
- Worker authentication (existing tests)

#### Integration Tests
- Complete Google OAuth flow
- Mixed authentication scenarios (Google admin + password workers)
- Token refresh for both auth types
- User data isolation between businesses

#### End-to-End Tests
- Admin Google login flow
- Worker password login flow  
- Permission boundaries between user types
- Session management for both auth types

### Troubleshooting

#### Common Issues

**Google OAuth Setup**
- Incorrect redirect URI configuration
- Missing Google Cloud API permissions
- Invalid client ID/secret configuration

**Mixed Authentication**
- JWT token validation conflicts
- User role confusion between admin/worker
- Database constraint violations

**Frontend Integration**
- CORS issues with Google OAuth
- Token storage and retrieval problems
- UI state management between auth types

### Production Considerations

#### Environment Variables
- Use secure secret management for Google Client Secret
- Configure proper redirect URIs for production domain
- Set up proper CORS origins for production

#### Monitoring
- Log Google OAuth failures for debugging
- Monitor user creation patterns
- Track authentication method usage

#### Backup Authentication
- Maintain ability to manually create admin users if needed
- Have database recovery procedures for auth failures
- Consider fallback authentication methods for emergencies

---

## Summary

This implementation provides a seamless authentication experience where:

- **Admin users (business owners)** enjoy modern, secure Google OAuth authentication
- **Worker users** continue using familiar email/password authentication  
- **Security** is maintained with proper token validation and user isolation
- **Existing functionality** remains completely unchanged for workers
- **Database integrity** is preserved with proper constraints and validation

The system maintains backward compatibility while modernizing the admin authentication experience, making it easier for business owners to manage their accounts while keeping worker access patterns familiar and secure.