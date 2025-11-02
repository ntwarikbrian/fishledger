# Authentication System Documentation

## Overview

This document outlines the authentication system for the LocalFishing Management System using Supabase Auth for all users, providing a unified authentication experience for both admin users and workers.

---

## Authentication Structure

### 🔐 Admin Users (Business Owners) with Supabase Auth
- **Authentication Method:** Supabase Auth (Sign in with Google + Email/Password)
- **Login:** Sign in via Supabase Auth UI or a custom implementation
- **Session:** Supabase manages sessions and issues JWT tokens
- **Frontend:** Supabase Client handles session management and token refresh
- **API Requests:** Frontend includes Supabase session token (Bearer) in Authorization header
- **Backend:**
  - Hono middleware verifies Supabase JWTs or uses Supabase service key to fetch user info
  - Extracts `user.id`, `app_metadata` and custom claims for role verification
  - Performs role-based authorization (admin/worker roles)
  - On success: fetches data from DB, returns to frontend
  - On failure: returns 401/403 status
- **User Provisioning:** Admin account can be created automatically on first OAuth sign-in or provisioned manually

### 👷 Worker Users (Staff Members)
- **Authentication Method:** Supabase Auth (Email/Password)
- **Registration:** Manual by admin/business owner or self-serve if enabled
- **Login:** Email, password, and business name form
- **Session:** Supabase JWT tokens
- **User Data:** Stored in Supabase Auth with secure password hashing

---

## Supabase Auth Integration Details

### Required Environment Variables

**Frontend (.env.local):**
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=http://localhost:8080
```

**Backend (backend/.env):**
```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_KEY=your_supabase_service_key   # server-side service role key
```

---

## Frontend Implementation
- Add Supabase client and (optionally) Supabase Auth UI components where admin or worker authentication is needed
- Use the Supabase Client to manage sessions, sign-in flows (Google, email/password), and token refresh
- To access protected backend endpoints: include the Supabase session token as a Bearer token in the Authorization header
- Use Supabase user object and `app_metadata` or custom user metadata for roles/permissions

## Backend Implementation
- Install `@supabase/supabase-js` in the backend and create a server client with the service key
- Implement Hono middleware that reads the Bearer token, validates or introspects it with Supabase, and attaches the user to the request context
- Enforce role checks (for example by reading `app_metadata.role` or checking a `users` table column)
- On validation success: continue request handling. On failure: return 401/403

---

## Example Admin Flow
1. Admin signs in with Google or Email/Password via Supabase Auth UI
2. Supabase handles OAuth, creates a session, and issues a JWT
3. Admin navigates the app; frontend includes the Supabase session token in requests
4. Backend validates the Supabase JWT (or calls Supabase auth endpoint) and extracts user info
5. Backend verifies admin role/permissions, fetches data, and responds

---

## Security Considerations
- All admin routes require a valid Supabase JWT
- Role verification must be enforced for all privileged actions
- Use Supabase service role key only on the server and protect it in environment variables
- Prefer short-lived access tokens and server-side verification

---

## Database Schema for Admins (example)
- Store Supabase `user.id` and reference to local business/admin info when needed
- Use `app_metadata` or a `users` table column to store roles (`admin` / `worker`)

---

## Summary
Supabase Auth provides a single, unified authentication system for admins and workers. It handles OAuth (Google), email/password, session management, and token issuance; backend services should validate Supabase JWTs and enforce role-based access.