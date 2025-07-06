/**
 * Dashboard Routes
 * Handles dashboard and analytics endpoints
 */

import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/auth.js';

const router = Router();

router.get('/stats', authenticate, requirePermission('view_dashboard'), (_req, res) => {
  res.json({ success: true, message: 'Dashboard stats endpoint - Coming soon', timestamp: new Date() });
});

router.get('/sales-analytics', authenticate, requirePermission('view_analytics'), (_req, res) => {
  res.json({ success: true, message: 'Sales analytics endpoint - Coming soon', timestamp: new Date() });
});

router.get('/stock-analytics', authenticate, requirePermission('view_analytics'), (_req, res) => {
  res.json({ success: true, message: 'Stock analytics endpoint - Coming soon', timestamp: new Date() });
});

export default router;
