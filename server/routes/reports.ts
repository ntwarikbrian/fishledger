/**
 * Report Routes
 * Handles reporting endpoints
 */

import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/auth.js';

const router = Router();

router.get('/stock', authenticate, requirePermission('view_reports'), (_req, res) => {
  res.json({ success: true, message: 'Stock report endpoint - Coming soon', timestamp: new Date() });
});

router.get('/sales', authenticate, requirePermission('view_reports'), (_req, res) => {
  res.json({ success: true, message: 'Sales report endpoint - Coming soon', timestamp: new Date() });
});

router.get('/expenses', authenticate, requirePermission('view_reports'), (_req, res) => {
  res.json({ success: true, message: 'Expense report endpoint - Coming soon', timestamp: new Date() });
});

router.get('/profit', authenticate, requirePermission('view_reports'), (_req, res) => {
  res.json({ success: true, message: 'Profit report endpoint - Coming soon', timestamp: new Date() });
});

export default router;
