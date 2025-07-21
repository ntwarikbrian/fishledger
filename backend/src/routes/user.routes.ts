/**
 * User routes
 * Defines routes for user management endpoints
 */

import { Hono } from 'hono';
import type { Env, Variables } from '../types/index';
import {
  getUsersHandler,
  getUserHandler,
  // createUserHandler, // DISABLED: User creation only through /auth/register
  updateUserHandler,
  // deleteUserHandler, // DISABLED: Users cannot delete other admin accounts
} from '../handlers/users';
import { authenticate, requireAdmin, requireSelfOrAdmin, apiRateLimit, enforceDataIsolation } from '../middleware';

// Create user router
const users = new Hono<{ Bindings: Env; Variables: Variables }>();

/**
 * All user routes require authentication and data isolation
 */
users.use('*', authenticate);
users.use('*', enforceDataIsolation);
users.use('*', apiRateLimit());

/**
 * User management routes
 */

// GET /users - Get all users (admin only)
users.get('/', requireAdmin, getUsersHandler);

// GET /users/:id - Get user by ID (admin or self)
users.get('/:id', requireSelfOrAdmin((c) => c.req.param('id')), getUserHandler);

// POST /users - DISABLED for security: User creation only through /auth/register
// users.post('/', requireAdmin, createUserHandler);

// PUT /users/:id - Update user (admin or self)
users.put('/:id', requireSelfOrAdmin((c) => c.req.param('id')), updateUserHandler);

// DELETE /users/:id - DISABLED for security: Users cannot delete other admin accounts
// users.delete('/:id', requireAdmin, deleteUserHandler);

export { users };
