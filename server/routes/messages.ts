/**
 * Message Routes
 * Handles messaging endpoints
 */

import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/auth.js';
import {
  sendMessage,
  getMessageHistory,
  getMessageStats,
  testEmailConfiguration,
  sendTestEmail,
  getDeliveryMethods,
} from '../controllers/messageController.js';

const router = Router();

/**
 * @route   POST /api/messages/send
 * @desc    Send message to multiple recipients
 * @access  Private (requires send_messages permission)
 */
router.post('/send', authenticate, requirePermission('send_messages'), sendMessage);

/**
 * @route   GET /api/messages/history
 * @desc    Get message history for authenticated user
 * @access  Private (requires view_messages permission)
 */
router.get('/history', authenticate, requirePermission('view_messages'), getMessageHistory);

/**
 * @route   GET /api/messages/stats
 * @desc    Get message statistics for authenticated user
 * @access  Private (requires view_messages permission)
 */
router.get('/stats', authenticate, requirePermission('view_messages'), getMessageStats);

/**
 * @route   POST /api/messages/test-email
 * @desc    Test email configuration
 * @access  Private (requires send_messages permission)
 */
router.post('/test-email', authenticate, requirePermission('send_messages'), testEmailConfiguration);

/**
 * @route   POST /api/messages/send-test-email
 * @desc    Send test email to specified address
 * @access  Private (requires send_messages permission)
 */
router.post('/send-test-email', authenticate, requirePermission('send_messages'), sendTestEmail);

/**
 * @route   GET /api/messages/delivery-methods
 * @desc    Get available delivery methods
 * @access  Private (requires view_messages permission)
 */
router.get('/delivery-methods', authenticate, requirePermission('view_messages'), getDeliveryMethods);

export default router;
