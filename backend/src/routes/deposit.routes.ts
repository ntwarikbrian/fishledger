/**
 * Deposit routes
 * Defines routes for deposit management endpoints
 */

import { Hono } from 'hono';
import type { Env, Variables } from '../types/index';
import {
  getDepositsHandler,
  getDepositHandler,
  createDepositHandler,
  createDepositWithImageHandler,
  updateDepositHandler,
  deleteDepositHandler,
  getDepositStatsHandler,
} from '../handlers/deposits';
import { authenticate, requireEmployee, apiRateLimit, enforceDataIsolation } from '../middleware';

// Create deposit router
const deposits = new Hono<{ Bindings: Env; Variables: Variables }>();

/**
 * All deposit routes require authentication, data isolation, and rate limiting
 */
deposits.use('*', authenticate);
deposits.use('*', enforceDataIsolation);
deposits.use('*', apiRateLimit());

/**
 * Deposit management routes
 */

// GET /deposits - Get all deposits with filtering and pagination
deposits.get('/', requireEmployee, getDepositsHandler);

// GET /deposits/stats - Get deposit statistics and summary
deposits.get('/stats', requireEmployee, getDepositStatsHandler);

// GET /deposits/:id - Get a specific deposit by ID
deposits.get('/:id', requireEmployee, getDepositHandler);

// POST /deposits - Create a new deposit
deposits.post('/', requireEmployee, createDepositHandler);

// POST /deposits/upload - Create deposit with image upload
deposits.post('/upload', requireEmployee, createDepositWithImageHandler);

// PUT /deposits/:id - Update a specific deposit
deposits.put('/:id', requireEmployee, updateDepositHandler);

// DELETE /deposits/:id - Delete a specific deposit
deposits.delete('/:id', requireEmployee, deleteDepositHandler);

export { deposits };
