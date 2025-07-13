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
  updateSaleHandler,
  deleteSaleHandler,
} from '../handlers/sales';
import { authenticate, apiRateLimit } from '../middleware';

// Create sales router
const sales = new Hono<{ Bindings: Env; Variables: Variables }>();

/**
 * All sales routes require authentication
 */
sales.use('*', authenticate);
sales.use('*', apiRateLimit());

/**
 * Sales management routes
 */

// GET /sales - Get all sales with pagination and filtering
sales.get('/', getSalesHandler);

// GET /sales/:id - Get specific sale by ID
sales.get('/:id', getSaleHandler);

// POST /sales - Create new sale
sales.post('/', createSaleHandler);

// PUT /sales/:id - Update existing sale
sales.put('/:id', updateSaleHandler);

// DELETE /sales/:id - Delete sale
sales.delete('/:id', deleteSaleHandler);

export { sales };
