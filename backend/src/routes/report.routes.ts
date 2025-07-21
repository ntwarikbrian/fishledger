/**
 * Report Routes
 * Defines all report-related endpoints for PDF generation
 */

import { Hono } from 'hono';
import { z } from 'zod';
import type { Env, Variables } from '../types';
import {
  generateGeneralReport,
  generateStockReport,
  generateSalesReport,
  generateFinancialReport,
  generateTransactionReport,
  generateProductReport,
  generateCustomerReport,
  generateTopSellingReport,
  generateDebtorCreditReport,
  generateProfitLossReport,
} from '../handlers/reports';
import { createHandlerErrorResponse } from '../utils/response';
import { authenticate, enforceDataIsolation, apiRateLimit } from '../middleware';

// Create the reports router
export const reports = new Hono<{ Bindings: Env; Variables: Variables }>();

/**
 * All report routes require authentication and data isolation
 * Reports should only show data for the authenticated user
 */
reports.use('*', authenticate);
reports.use('*', enforceDataIsolation);
reports.use('*', apiRateLimit());

// Validation schemas for query parameters
const dateRangeSchema = z.object({
  dateFrom: z.string().optional().refine(
    (val) => !val || !isNaN(Date.parse(val)),
    { message: 'Invalid dateFrom format. Use ISO date string.' }
  ),
  dateTo: z.string().optional().refine(
    (val) => !val || !isNaN(Date.parse(val)),
    { message: 'Invalid dateTo format. Use ISO date string.' }
  ),
});

const generalReportSchema = dateRangeSchema.extend({
  categoryId: z.string().uuid().optional(),
});

const stockReportSchema = dateRangeSchema.extend({
  categoryId: z.string().uuid().optional(),
  lowStockOnly: z.enum(['true', 'false']).optional(),
});

const salesReportSchema = dateRangeSchema.extend({
  paymentMethod: z.enum(['momo_pay', 'cash', 'bank_transfer']).optional(),
  paymentStatus: z.enum(['paid', 'pending', 'partial']).optional(),
});

const financialReportSchema = z.object({
  dateFrom: z.string().refine(
    (val) => !isNaN(Date.parse(val)),
    { message: 'dateFrom is required and must be a valid ISO date string.' }
  ),
  dateTo: z.string().refine(
    (val) => !isNaN(Date.parse(val)),
    { message: 'dateTo is required and must be a valid ISO date string.' }
  ),
});

const transactionReportSchema = financialReportSchema.extend({
  type: z.enum(['sale', 'expense', 'deposit']).optional(),
});

const productReportSchema = dateRangeSchema.extend({
  categoryId: z.string().uuid().optional(),
});

const customerReportSchema = dateRangeSchema;

const topSellingReportSchema = dateRangeSchema.extend({
  categoryId: z.string().uuid().optional(),
});

const debtorCreditReportSchema = dateRangeSchema;

const profitLossReportSchema = z.object({
  dateFrom: z.string().refine(
    (val) => !isNaN(Date.parse(val)),
    { message: 'dateFrom is required and must be a valid ISO date string.' }
  ),
  dateTo: z.string().refine(
    (val) => !isNaN(Date.parse(val)),
    { message: 'dateTo is required and must be a valid ISO date string.' }
  ),
});

/**
 * Middleware to validate query parameters
 */
function validateQuery<T extends z.ZodSchema>(schema: T) {
  return async (c: any, next: any) => {
    try {
      const query = c.req.query();
      const result = schema.safeParse(query);
      
      if (!result.success) {
        const errors = result.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        
        return c.json(
          createHandlerErrorResponse(
            'Invalid query parameters',
            c.get('requestId'),
            'Validation failed'
          ),
          400
        );
      }
      
      // Store validated data for use in handlers
      c.set('validatedQuery', result.data);
      await next();
    } catch (error) {
      console.error('Query validation error:', error);
      return c.json(
        createHandlerErrorResponse(
          'Query validation failed',
          c.get('requestId'),
          error instanceof Error ? error.message : 'Unknown error'
        ),
        500
      );
    }
  };
}

/**
 * GET /api/reports/general/pdf
 * Generate general report PDF
 *
 * Query Parameters:
 * - dateFrom (optional): Start date for filtering (ISO string)
 * - dateTo (optional): End date for filtering (ISO string)
 * - categoryId (optional): Filter by category UUID
 */
reports.get('/general/pdf', validateQuery(generalReportSchema), generateGeneralReport);

/**
 * GET /api/reports/stock/pdf
 * Generate stock report PDF
 *
 * Query Parameters:
 * - dateFrom (optional): Start date for filtering (ISO string)
 * - dateTo (optional): End date for filtering (ISO string)
 * - categoryId (optional): Filter by category UUID
 * - lowStockOnly (optional): Show only low stock items ('true' or 'false')
 */
reports.get('/stock/pdf', validateQuery(stockReportSchema), generateStockReport);

/**
 * GET /api/reports/sales/pdf
 * Generate sales report PDF
 * 
 * Query Parameters:
 * - dateFrom (optional): Start date for filtering (ISO string)
 * - dateTo (optional): End date for filtering (ISO string)
 * - paymentMethod (optional): Filter by payment method ('momo_pay', 'cash', 'bank_transfer')
 * - paymentStatus (optional): Filter by payment status ('paid', 'pending', 'partial')
 */
reports.get('/sales/pdf', validateQuery(salesReportSchema), generateSalesReport);

/**
 * GET /api/reports/financial/pdf
 * Generate financial report PDF
 * 
 * Query Parameters:
 * - dateFrom (required): Start date for filtering (ISO string)
 * - dateTo (required): End date for filtering (ISO string)
 */
reports.get('/financial/pdf', validateQuery(financialReportSchema), generateFinancialReport);

/**
 * GET /api/reports/transactions/pdf
 * Generate transaction report PDF
 * 
 * Query Parameters:
 * - dateFrom (required): Start date for filtering (ISO string)
 * - dateTo (required): End date for filtering (ISO string)
 * - type (optional): Filter by transaction type ('sale', 'expense', 'deposit')
 */
reports.get('/transactions/pdf', validateQuery(transactionReportSchema), generateTransactionReport);

/**
 * GET /api/reports/products/pdf
 * Generate product performance report PDF
 * 
 * Query Parameters:
 * - dateFrom (optional): Start date for filtering sales data (ISO string)
 * - dateTo (optional): End date for filtering sales data (ISO string)
 * - categoryId (optional): Filter by category UUID
 */
reports.get('/products/pdf', validateQuery(productReportSchema), generateProductReport);

/**
 * GET /api/reports/customers/pdf
 * Generate customer report PDF
 * 
 * Query Parameters:
 * - dateFrom (optional): Start date for filtering (ISO string)
 * - dateTo (optional): End date for filtering (ISO string)
 */
reports.get('/customers/pdf', validateQuery(customerReportSchema), generateCustomerReport);

/**
 * GET /api/reports/top-selling/pdf
 * Generate top selling products report PDF
 *
 * Query Parameters:
 * - dateFrom (optional): Start date for filtering (ISO string)
 * - dateTo (optional): End date for filtering (ISO string)
 * - categoryId (optional): Filter by category UUID
 */
reports.get('/top-selling/pdf', validateQuery(topSellingReportSchema), generateTopSellingReport);

/**
 * GET /api/reports/debtor-credit/pdf
 * Generate debtor/credit report PDF
 *
 * Query Parameters:
 * - dateFrom (optional): Start date for filtering (ISO string)
 * - dateTo (optional): End date for filtering (ISO string)
 */
reports.get('/debtor-credit/pdf', validateQuery(debtorCreditReportSchema), generateDebtorCreditReport);

/**
 * GET /api/reports/profit-loss/pdf
 * Generate profit and loss report PDF
 *
 * Query Parameters:
 * - dateFrom (required): Start date for filtering (ISO string)
 * - dateTo (required): End date for filtering (ISO string)
 */
reports.get('/profit-loss/pdf', validateQuery(profitLossReportSchema), generateProfitLossReport);

/**
 * GET /api/reports/health
 * Health check endpoint for reports service
 */
reports.get('/health', (c) => {
  return c.json({
    success: true,
    message: 'Reports service is healthy',
    timestamp: new Date().toISOString(),
    requestId: c.get('requestId'),
    availableReports: [
      'general',
      'stock',
      'sales',
      'financial',
      'transactions',
      'products',
      'customers',
      'top-selling',
      'debtor-credit',
      'profit-loss'
    ],
  });
});

/**
 * GET /api/reports
 * Get available report types and their descriptions
 */
reports.get('/', (c) => {
  return c.json({
    success: true,
    message: 'Available report endpoints',
    timestamp: new Date().toISOString(),
    requestId: c.get('requestId'),
    data: {
      reports: [
        {
          type: 'general',
          endpoint: '/api/reports/general/pdf',
          description: 'Generate comprehensive general business report with product overview',
          parameters: ['dateFrom?', 'dateTo?', 'categoryId?'],
        },
        {
          type: 'sales',
          endpoint: '/api/reports/sales/pdf',
          description: 'Generate sales report with transaction details',
          parameters: ['dateFrom?', 'dateTo?', 'paymentMethod?', 'paymentStatus?'],
        },
        {
          type: 'top-selling',
          endpoint: '/api/reports/top-selling/pdf',
          description: 'Generate top selling products report with performance metrics',
          parameters: ['dateFrom?', 'dateTo?', 'categoryId?'],
        },
        {
          type: 'debtor-credit',
          endpoint: '/api/reports/debtor-credit/pdf',
          description: 'Generate debtor and credit report with outstanding balances',
          parameters: ['dateFrom?', 'dateTo?'],
        },
        {
          type: 'profit-loss',
          endpoint: '/api/reports/profit-loss/pdf',
          description: 'Generate profit and loss statement with financial analysis',
          parameters: ['dateFrom*', 'dateTo*'],
        },
      ],
      notes: [
        'Parameters marked with * are required',
        'Parameters marked with ? are optional',
        'All date parameters should be in ISO format (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss.sssZ)',
        'All reports are generated as PDF files',
        'Reports include summary statistics and detailed data tables',
      ],
    },
  });
});

/**
 * Handle 404 for unmatched report routes
 */
reports.notFound((c) => {
  return c.json(
    createHandlerErrorResponse(
      'Report endpoint not found',
      c.get('requestId'),
      `The report endpoint ${c.req.path} does not exist. Use GET /api/reports to see available endpoints.`
    ),
    404
  );
});

/**
 * Error handler for report routes
 */
reports.onError((error, c) => {
  console.error('Report route error:', error);
  
  return c.json(
    createHandlerErrorResponse(
      'Report generation failed',
      c.get('requestId'),
      error.message
    ),
    500
  );
});

export default reports;
