/**
 * Sales routes
 * Defines routes for sales management endpoints
 */

import { Hono } from 'hono';
import type { Env, Variables } from '../types/index';
import {
  getSalesHandler,
  getSaleHandler,
  createSaleHandler,
  createFishSaleHandler,
  updateSaleHandler,
  deleteSaleHandler,
} from '../handlers/sales';
import { authenticate, apiRateLimit, enforceDataIsolation } from '../middleware';

// Create sales router
const sales = new Hono<{ Bindings: Env; Variables: Variables }>();

/**
 * All sales routes require authentication and data isolation
 */
sales.use('*', authenticate);
sales.use('*', enforceDataIsolation);
sales.use('*', apiRateLimit());

/**
 * Sales management routes
 */

// GET /sales - Get all sales with pagination and filtering
sales.get('/', getSalesHandler);

// GET /sales/:id - Get specific sale by ID
sales.get('/:id', getSaleHandler);

// POST /sales - Create new sale (legacy endpoint)
sales.post('/', createSaleHandler);

// POST /sales/fish - Create fish sale using the new algorithm (recommended)
sales.post('/fish', createFishSaleHandler);

// PUT /sales/:id - Update existing sale
sales.put('/:id', updateSaleHandler);

// DELETE /sales/:id - Delete sale
sales.delete('/:id', deleteSaleHandler);

export { sales };
