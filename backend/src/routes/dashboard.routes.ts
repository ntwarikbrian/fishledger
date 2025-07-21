/**
 * Dashboard routes
 * Defines routes for dashboard analytics and statistics endpoints
 */

import { Hono } from 'hono';
import type { Env, Variables } from '../types/index';
import {
  getDashboardStatsHandler,
  getRevenueChartHandler,
  getFinancialOverviewHandler,
} from '../handlers/dashboard';
import { authenticate, requireEmployee, apiRateLimit, enforceDataIsolation } from '../middleware';

// Create dashboard router
const dashboard = new Hono<{ Bindings: Env; Variables: Variables }>();

/**
 * All dashboard routes require authentication, data isolation, and rate limiting
 */
dashboard.use('*', authenticate);
dashboard.use('*', enforceDataIsolation);
dashboard.use('*', apiRateLimit());

/**
 * Dashboard analytics routes
 */

// GET /dashboard/stats - Get comprehensive dashboard statistics
dashboard.get('/stats', requireEmployee, getDashboardStatsHandler);

// GET /dashboard/revenue-chart - Get revenue chart data for the last 9 months
dashboard.get('/revenue-chart', requireEmployee, getRevenueChartHandler);

// GET /dashboard/financial-overview - Get financial overview data for pie chart
dashboard.get('/financial-overview', requireEmployee, getFinancialOverviewHandler);

export { dashboard };
