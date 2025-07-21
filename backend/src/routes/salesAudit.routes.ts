/**
 * Sales Audit Routes
 * Handles audit trail endpoints for sales operations
 */

import { Hono } from 'hono';
import type { Env, Variables } from '../types/index';
import { authenticate, requireEmployee, requireManager, apiRateLimit, enforceDataIsolation } from '../middleware';
import { createAuditHandler, getAuditsHandler, approveAuditHandler, rejectAuditHandler } from '../handlers/salesAudit';

// Create sales audit router with proper typing
const salesAuditRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

/**
 * All sales audit routes require authentication, data isolation, and rate limiting
 */
salesAuditRoutes.use('*', authenticate);
salesAuditRoutes.use('*', enforceDataIsolation);
salesAuditRoutes.use('*', apiRateLimit());

/**
 * @route GET /api/sales-audit
 * @desc Get audit records with pagination and filtering
 * @access Private - Requires employee role or higher
 */
salesAuditRoutes.get('/', requireEmployee, getAuditsHandler);

/**
 * @route POST /api/sales-audit
 * @desc Create a new audit record (typically used internally)
 * @access Private - Requires manager role or higher
 */
salesAuditRoutes.post('/', requireManager, createAuditHandler);

/**
 * @route PUT /api/sales-audit/:id/approve
 * @desc Approve an audit record
 * @access Private - Requires manager role or higher
 */
salesAuditRoutes.put('/:id/approve', requireManager, approveAuditHandler);

/**
 * @route PUT /api/sales-audit/:id/reject
 * @desc Reject an audit record
 * @access Private - Requires manager role or higher
 */
salesAuditRoutes.put('/:id/reject', requireManager, rejectAuditHandler);

export default salesAuditRoutes;
