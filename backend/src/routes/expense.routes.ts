/**
 * Expense routes
 * Defines routes for expense management endpoints
 */

import { Hono } from 'hono';
import type { Env, Variables } from '../types/index';
import {
  getExpensesHandler,
  getExpenseHandler,
  createExpenseHandler,
  updateExpenseHandler,
  deleteExpenseHandler,
  getExpenseCategoriesHandler,
  getExpenseCategoryHandler,
  createExpenseCategoryHandler,
  updateExpenseCategoryHandler,
  deleteExpenseCategoryHandler,
  createExpenseWithReceiptHandler,
} from '../handlers/expenses';
import { authenticate, apiRateLimit, enforceDataIsolation } from '../middleware';

// Create expenses router
const expenses = new Hono<{ Bindings: Env; Variables: Variables }>();

/**
 * All expense routes require authentication and data isolation
 */
expenses.use('*', authenticate);
expenses.use('*', enforceDataIsolation);
expenses.use('*', apiRateLimit());

/**
 * Expense categories management routes (must come before dynamic :id routes)
 */

// GET /expenses/categories - Get all expense categories
expenses.get('/categories', getExpenseCategoriesHandler);

// GET /expenses/categories/:id - Get specific expense category by ID
expenses.get('/categories/:id', getExpenseCategoryHandler);

// POST /expenses/categories - Create new expense category
expenses.post('/categories', createExpenseCategoryHandler);

// PUT /expenses/categories/:id - Update existing expense category
expenses.put('/categories/:id', updateExpenseCategoryHandler);

// DELETE /expenses/categories/:id - Delete expense category
expenses.delete('/categories/:id', deleteExpenseCategoryHandler);

/**
 * Expense management routes
 */

// GET /expenses - Get all expenses with pagination and filtering
expenses.get('/', getExpensesHandler);

// GET /expenses/:id - Get specific expense by ID
expenses.get('/:id', getExpenseHandler);

// POST /expenses - Create new expense
expenses.post('/', createExpenseHandler);

// POST /expenses/upload - Create expense with receipt upload
expenses.post('/upload', createExpenseWithReceiptHandler);

// PUT /expenses/:id - Update existing expense
expenses.put('/:id', updateExpenseHandler);

// DELETE /expenses/:id - Delete expense
expenses.delete('/:id', deleteExpenseHandler);

export { expenses };
