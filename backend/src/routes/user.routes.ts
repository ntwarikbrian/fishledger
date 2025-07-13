/**
 * User routes
 * Defines routes for user management endpoints
 */

import { Hono } from 'hono';
import type { Env, Variables } from '../types/index';
import {
  getUsersHandler,
  getUserHandler,
  createUserHandler,
  updateUserHandler,
  deleteUserHandler,
} from '../handlers/users';
import { authenticate, requireAdmin, requireSelfOrAdmin, apiRateLimit } from '../middleware';

// Create user router
const users = new Hono<{ Bindings: Env; Variables: Variables }>();

/**
 * All user routes require authentication
 */
users.use('*', authenticate);
users.use('*', apiRateLimit());

/**
 * User management routes
 */

// GET /users - Get all users (admin only)
users.get('/', requireAdmin, getUsersHandler);

// GET /users/:id - Get user by ID (admin or self)
users.get('/:id', requireSelfOrAdmin((c) => c.req.param('id')), getUserHandler);

// POST /users - Create new user (admin only)
users.post('/', requireAdmin, createUserHandler);

// PUT /users/:id - Update user (admin or self)
users.put('/:id', requireSelfOrAdmin((c) => c.req.param('id')), updateUserHandler);

// DELETE /users/:id - Delete user (admin only)
users.delete('/:id', requireAdmin, deleteUserHandler);

export { users };
