/**
 * Product routes
 * Defines routes for product management endpoints
 */

import { Hono } from 'hono';
import type { Env, Variables } from '../types/index';
import {
  getProductsHandler,
  getProductHandler,
  createProductHandler,
  updateProductHandler,
  deleteProductHandler,
  getLowStockHandler,
  getDamagedProductHandler,
  recordDamagedProductHandler,
  deleteDamagedProductHandler
} from '../handlers/products';
import {
  createStockAdditionHandler,
  getProductStockAdditionsHandler
} from '../handlers/stock-additions';
import { authenticate, requireEmployee, requireManager, apiRateLimit } from '../middleware';

// Create product router
const products = new Hono<{ Bindings: Env; Variables: Variables }>();

/**
 * All product routes require authentication
 */
products.use('*', authenticate);
products.use('*', apiRateLimit());

/**
 * Product management routes
 */

// GET /products - Get all products (any authenticated user)
products.get('/', requireEmployee, getProductsHandler);

// GET /products/low-stock - Get low stock products (any authenticated user)
products.get('/low-stock', requireEmployee, getLowStockHandler);

// GET /products/damaged - Get damaged products (any authenticated user)
products.get('/damaged', requireEmployee, getDamagedProductHandler);

// GET /products/:id - Get product by ID (any authenticated user)
products.get('/:id', requireEmployee, getProductHandler);

// POST /products - Create new product (manager or admin)
products.post('/', requireManager, createProductHandler);

// PUT /products/:id - Update product (manager or admin)
products.put('/:id', requireManager, updateProductHandler);

// DELETE /products/:id - Delete product (manager or admin)
products.delete('/:id', requireManager, deleteProductHandler);

// POST /products/:id/damage - Record damaged product (manager or admin)
products.post('/:id/damage', requireManager, recordDamagedProductHandler);

// DELETE /products/damaged/:damageId - Delete damaged product record (manager or admin)
products.delete('/damaged/:damageId', requireManager, deleteDamagedProductHandler);

// POST /products/:id/stock - Add stock to product (manager or admin)
products.post('/:id/stock', requireManager, createStockAdditionHandler);

// GET /products/:id/stock-additions - Get stock additions for a product (any authenticated user)
products.get('/:id/stock-additions', requireEmployee, getProductStockAdditionsHandler);

export { products };
