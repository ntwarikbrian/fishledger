# Authentication System Documentation

## Overview

This document outlines the authentication system for the LocalFishing Management System with the new **Clerk** authentication provider for admin users. Workers continue to use traditional email/password authentication for now.

---

## Authentication Structure

### 🔐 Admin Users (Business Owners) with Clerk
- **Authentication Method:** Clerk (Sign in with Google via Clerk)
- **Login:** Sign in with Google via Clerk's <SignIn /> component
- **Session:** Clerk handles OAuth handshake, stores session, and issues Clerk JWT
- **Frontend:** Clerk React SDK manages session internally; no manual token management
- **API Requests:** Frontend requests to admin backend endpoints include the Clerk session token in the Authorization header
- **Backend:**
  - Hono middleware uses Clerk's official package to validate the session
  - Extracts Clerk `userId`, `role`, and other claims
  - Performs role-based authorization (must be `admin` for admin endpoints)
  - On success: fetches data from DB, returns to frontend
  - On failure: returns 401/403 status
- **User Provisioning:** Admin account is provisioned automatically on first Clerk OAuth sign-in

### 👷 Worker Users (Staff Members)
- **Authentication Method:** Traditional email/password
- **Registration:** Manual by admin/business owner
- **Login:** Email, password, and business name form
- **Session:** JWT tokens (legacy, NOT Clerk)
- **User Data:** Stored in database with encrypted passwords

---

## Clerk Integration Details

### Required Environment Variables

**Frontend (.env.local):**
```env
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
VITE_API_URL=http://localhost:8080
```

**Backend (backend/.env):**
```env
CLERK_SECRET_KEY=your_clerk_secret_key
# (other DB and JWT config remain for worker auth)
```

---

## Frontend Implementation
- Add Clerk React Provider and <SignIn /> wherever admin authentication is needed
- Clerk SDK manages session and handles token exchange/refresh automatically
- To access admin endpoints: call APIs including Clerk session token (handled automatically if using Clerk fetch helpers)
- Use Clerk's user object for user metadata/roles

## Backend Implementation
- Install Clerk's Cloudflare/Hono middleware
- Apply Clerk middleware to routes under `/api/admin/*`
- Validate Clerk session and extract user details on request
- Check admin role on sensitive endpoints
- On validation success: process request as admin
- On failure: return HTTP 401/403

---

## Example Admin Flow
1. Admin clicks “Sign in with Google” (via Clerk <SignIn />)
2. Clerk handles Google OAuth, creates session, issues Clerk JWT
3. Admin navigates app; frontend APIs include Clerk session token
4. Backend checks Clerk token via Hono middleware
5. Backend validates role/permissions, fetches data, responds

---

## Security Considerations
- All admin routes require valid Clerk session
- Role verification enforced for all privileged actions
- Clerk session tokens are short-lived and auto-rotated
- Database does not store administrator passwords for Clerk users

---

## Database Schema for Admins (example)
- Store Clerk `userId` and reference to local business/admin info if needed
- No passwords for Clerk users; worker users managed as before

---

## Migration Notes
- Remove manual Google OAuth config for admin
- Keep existing password-based worker login unchanged (may migrate later)

---

## Summary
Admin authentication is now managed via Clerk, providing secure Google (and potentially other) OAuth with seamless session handling on both frontend and backend.
Worker login continues to use traditional methods until further notice.