/**
 * Authentication routes
 * Defines routes for authentication endpoints
 */

import { Hono } from 'hono';
import type { Env, Variables } from '../types/index';
import {
  loginHandler,
  registerHandler,
  refreshTokenHandler,
  logoutHandler,
  profileHandler,
} from '../handlers/auth';
import { authenticate, authRateLimit } from '../middleware';

// Create auth router
const auth = new Hono<{ Bindings: Env; Variables: Variables }>();

/**
 * Public authentication routes
 */

// POST /auth/login - User login
auth.post('/login', authRateLimit, loginHandler);

// POST /auth/register - User registration
auth.post('/register', authRateLimit, registerHandler);

// POST /auth/refresh - Refresh access token
auth.post('/refresh', authRateLimit, refreshTokenHandler);

/**
 * Protected authentication routes
 */

// POST /auth/logout - User logout (requires authentication)
auth.post('/logout', authenticate, logoutHandler);

// GET /auth/profile - Get current user profile (requires authentication)
auth.get('/profile', authenticate, profileHandler);

export { auth };
