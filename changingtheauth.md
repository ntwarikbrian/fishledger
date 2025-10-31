Step 1 – Setup Frontend (React)

Install Clerk React SDK

pnpm add @clerk/clerk-react


Add environment variable .env.local in src/

VITE_CLERK_PUBLISHABLE_KEY=pk_live_XXXX
VITE_API_URL=http://localhost:8080


Wrap App with ClerkProvider

// src/main.tsx or src/App.tsx
import { ClerkProvider, SignedIn, SignedOut, UserButton, SignInButton } from "@clerk/clerk-react";
import Dashboard from "./pages/Dashboard";
import LoginPage from "./pages/LoginPage";

<ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}>
  <SignedIn>
    <UserButton />
    <Dashboard />
  </SignedIn>
  <SignedOut>
    <LoginPage />
  </SignedOut>
</ClerkProvider>


Replace old login page with Clerk SignIn component
Google OAuth login for admins and email/password for workers is handled automatically by Clerk.

Remove any old Google OAuth buttons or password login logic.
Step 2 – Setup Backend (Hono + Cloudflare Workers)

Install Clerk backend SDK

cd backend
pnpm add @clerk/backend


Create Clerk middleware

// backend/src/middleware/clerk.ts
import { clerkMiddleware, getAuth } from "@clerk/backend";
import { Hono } from "hono";

const app = new Hono();
app.use("*", clerkMiddleware());

export { app, getAuth };

