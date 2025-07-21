/**
 * Category routes
 * Defines routes for product category management endpoints
 */

import { Hono } from 'hono';
import type { Env, Variables } from '../types/index';
import {
  getCategoriesHandler,
  getCategoryHandler,
  createCategoryHandler,
  updateCategoryHandler,
  deleteCategoryHandler,
} from '../handlers/categories';
import { authenticate, apiRateLimit, errorHandler, enforceDataIsolation } from '../middleware';

// Create category router
const categories = new Hono<{ Bindings: Env; Variables: Variables }>();

/**
 * All category routes require authentication, data isolation, and error handling
 */
categories.use('*', errorHandler);
categories.use('*', authenticate);
categories.use('*', enforceDataIsolation);
categories.use('*', apiRateLimit());

/**
 * Category management routes
 */

// GET /categories - Get all categories with pagination and search
categories.get('/', getCategoriesHandler);

// GET /categories/:id - Get specific category by ID
categories.get('/:id', getCategoryHandler);

// POST /categories - Create new category
categories.post('/', createCategoryHandler);

// PUT /categories/:id - Update existing category
categories.put('/:id', updateCategoryHandler);

// DELETE /categories/:id - Delete category
categories.delete('/:id', deleteCategoryHandler);

export { categories };
