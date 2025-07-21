/**
 * Stock corrections routes
 * Defines routes for stock correction management endpoints
 */

import { Hono } from 'hono';
import type { Env, Variables } from '../types/index';
import {
  createStockCorrectionHandler,
  getStockCorrectionsHandler
} from '../handlers/stock-corrections';
import { authenticate, requireManager, apiRateLimit, enforceDataIsolation } from '../middleware';

// Create stock corrections router
const stockCorrections = new Hono<{ Bindings: Env; Variables: Variables }>();

/**
 * All stock correction routes require authentication and data isolation
 */
stockCorrections.use('*', authenticate);
stockCorrections.use('*', enforceDataIsolation);
stockCorrections.use('*', apiRateLimit());

/**
 * Stock correction management routes
 */

// GET /stock-corrections - Get all stock corrections (manager or admin)
stockCorrections.get('/', requireManager, getStockCorrectionsHandler);

// POST /stock-corrections - Create new stock correction (manager or admin)
stockCorrections.post('/', requireManager, createStockCorrectionHandler);

export { stockCorrections };
