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
} from '../handlers/expenses';
import { authenticate, apiRateLimit } from '../middleware';

// Create expenses router
const expenses = new Hono<{ Bindings: Env; Variables: Variables }>();

/**
 * All expense routes require authentication
 */
expenses.use('*', authenticate);
expenses.use('*', apiRateLimit());

/**
 * Expense management routes
 */

// GET /expenses - Get all expenses with pagination and filtering
expenses.get('/', getExpensesHandler);

// GET /expenses/:id - Get specific expense by ID
expenses.get('/:id', getExpenseHandler);

// POST /expenses - Create new expense
expenses.post('/', createExpenseHandler);

// PUT /expenses/:id - Update existing expense
expenses.put('/:id', updateExpenseHandler);

// DELETE /expenses/:id - Delete expense
expenses.delete('/:id', deleteExpenseHandler);

export { expenses };
