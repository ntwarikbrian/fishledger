/**
 * Stock movements routes
 * Defines routes for stock movement tracking endpoints
 */

import { Hono } from 'hono';
import type { Env, Variables } from '../types/index';
import {
  getStockMovementsHandler,
  createStockMovementHandler,
  getProductStockMovementsHandler,
  getStockSummaryHandler,
  approveProductEditHandler,
  rejectProductEditHandler,
  approveProductDeleteHandler,
  rejectProductDeleteHandler
} from '../handlers/stock-movements';
import { authenticate, requireEmployee, requireManager, apiRateLimit } from '../middleware';

// Create stock movements router
const stockMovements = new Hono<{ Bindings: Env; Variables: Variables }>();

/**
 * All stock movement routes require authentication
 */
stockMovements.use('*', authenticate);
stockMovements.use('*', apiRateLimit());

/**
 * Stock movement management routes
 */

// GET /stock-movements - Get all stock movements (any authenticated user)
stockMovements.get('/', requireEmployee, getStockMovementsHandler);

// POST /stock-movements - Create new stock movement (manager or admin)
stockMovements.post('/', requireManager, createStockMovementHandler);

// GET /stock-movements/product/:productId - Get stock movements for a product (any authenticated user)
stockMovements.get('/product/:productId', requireEmployee, getProductStockMovementsHandler);

// GET /stock-movements/summary/:productId - Get stock summary for a product (any authenticated user)
stockMovements.get('/summary/:productId', requireEmployee, getStockSummaryHandler);

// POST /stock-movements/:movementId/approve - Approve pending product edit (manager or admin)
stockMovements.post('/:movementId/approve', requireManager, approveProductEditHandler);

// POST /stock-movements/:movementId/reject - Reject pending product edit (manager or admin)
stockMovements.post('/:movementId/reject', requireManager, rejectProductEditHandler);

// POST /stock-movements/:movementId/approve-delete - Approve pending product delete (manager or admin)
stockMovements.post('/:movementId/approve-delete', requireManager, approveProductDeleteHandler);

// POST /stock-movements/:movementId/reject-delete - Reject pending product delete (manager or admin)
stockMovements.post('/:movementId/reject-delete', requireManager, rejectProductDeleteHandler);

export { stockMovements };
