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
import {
  authenticateWorker,
  refreshWorkerToken,
  getWorkerProfile,
  logoutWorker,
} from '../handlers/workers';
import {
  authenticate,
  authRateLimit,
  authenticateWorker as authenticateWorkerMiddleware,
  enforceWorkerDataIsolation,
} from '../middleware';

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
 * Worker authentication routes
 */

// POST /auth/worker-login - Worker login
auth.post('/worker-login', authRateLimit, authenticateWorker);

// POST /auth/worker-refresh - Worker token refresh
auth.post('/worker-refresh', authRateLimit, refreshWorkerToken);

/**
 * Protected authentication routes
 */

// POST /auth/logout - User logout (requires authentication)
auth.post('/logout', authenticate, logoutHandler);

// GET /auth/profile - Get current user profile (requires authentication)
auth.get('/profile', authenticate, profileHandler);

/**
 * Protected worker authentication routes
 */

// POST /auth/worker-logout - Worker logout (requires worker authentication)
auth.post('/worker-logout', authenticateWorkerMiddleware, logoutWorker);

// GET /auth/worker-profile - Get current worker profile (requires worker authentication)
auth.get('/worker-profile', authenticateWorkerMiddleware, enforceWorkerDataIsolation, getWorkerProfile);

// GET /auth/worker-verify - Verify worker token validity
auth.get('/worker-verify', authenticateWorkerMiddleware, (c) => {
  const worker = c.get('worker');

  return c.json({
    success: true,
    data: {
      valid: true,
      worker: {
        id: worker?.id,
        email: worker?.email,
        fullName: worker?.fullName,
        role: worker?.role,
        businessId: worker?.businessId,
      },
    },
    timestamp: new Date().toISOString(),
    requestId: c.get('requestId'),
  });
});

export { auth };
