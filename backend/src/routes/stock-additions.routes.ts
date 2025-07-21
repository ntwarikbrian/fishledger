/**
 * Stock additions routes
 * Defines routes for stock addition management endpoints
 */

import { Hono } from 'hono';
import type { Env, Variables } from '../types/index';
import {
  getStockAdditionsHandler
} from '../handlers/stock-additions';
import { authenticate, requireEmployee, apiRateLimit, enforceDataIsolation } from '../middleware';

// Create stock additions router
const stockAdditions = new Hono<{ Bindings: Env; Variables: Variables }>();

/**
 * All stock addition routes require authentication and data isolation
 */
stockAdditions.use('*', authenticate);
stockAdditions.use('*', enforceDataIsolation);
stockAdditions.use('*', apiRateLimit());

/**
 * Stock addition management routes
 */

// GET /stock-additions - Get all stock additions (any authenticated user)
stockAdditions.get('/', requireEmployee, getStockAdditionsHandler);

export { stockAdditions };
