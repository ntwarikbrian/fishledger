/**
 * Message Controller
 * Handles message-related HTTP requests and responses
 */

import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { messagingService } from '../services/messagingService.js';
import { emailService } from '../services/emailService.js';
import { AuthenticatedRequest } from '../types/api.js';
import { createError, asyncHandler } from '../middleware/errorHandler.js';
import type { RecipientType } from '../types/database.js';

/**
 * Validation schemas using Zod
 */
const sendMessageSchema = z.object({
  recipientIds: z.array(z.string().uuid('Invalid recipient ID format')).min(1, 'At least one recipient is required'),
  recipientType: z.enum(['user', 'worker', 'contact'], {
    errorMap: () => ({ message: 'Recipient type must be user, worker, or contact' })
  }),
  subject: z.string().min(1, 'Subject is required').max(200, 'Subject must be 200 characters or less'),
  content: z.string().min(1, 'Message content is required'),
  messageType: z.enum(['email', 'internal']).optional().default('email'),
  deliveryMethod: z.enum(['email', 'sms', 'whatsapp'], {
    errorMap: () => ({ message: 'Delivery method must be email, sms, or whatsapp' })
  }),
});

const messageHistorySchema = z.object({
  limit: z.string().transform(Number).optional().default('50'),
  offset: z.string().transform(Number).optional().default('0'),
});

const testEmailSchema = z.object({
  email: z.string().email('Invalid email format'),
});

/**
 * Send message to multiple recipients
 * @route POST /api/messages/send
 * @access Private
 */
export const sendMessage = asyncHandler(async (
  req: AuthenticatedRequest,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  console.log('📨 POST /api/messages/send - Sending message');

  // Validate request body
  const validation = sendMessageSchema.safeParse(req.body);
  if (!validation.success) {
    throw createError.badRequest('Invalid message data', validation.error.errors);
  }

  const messageData = validation.data;
  const userId = req.user?.user_id;

  if (!userId) {
    throw createError.unauthorized('User not authenticated');
  }

  // Check if delivery method is supported
  if (messageData.deliveryMethod !== 'email') {
    const methodName = messageData.deliveryMethod.toUpperCase();
    throw createError.badRequest(`${methodName} delivery is not yet supported. Please use email delivery.`);
  }

  // Validate that we have recipients
  if (messageData.recipientIds.length === 0) {
    throw createError.badRequest('At least one recipient is required');
  }

  // Validate message content
  if (!messageData.content.trim()) {
    throw createError.badRequest('Message content cannot be empty');
  }

  if (!messageData.subject.trim()) {
    throw createError.badRequest('Message subject cannot be empty');
  }

  try {
    // Send the message
    const result = await messagingService.sendMessage({
      recipientIds: messageData.recipientIds,
      recipientType: messageData.recipientType as RecipientType,
      subject: messageData.subject,
      content: messageData.content,
      messageType: messageData.messageType,
      deliveryMethod: messageData.deliveryMethod,
      sentBy: userId,
    });

    // Prepare response
    const response = {
      success: result.success,
      message: result.success 
        ? `Message sent successfully to ${result.successfulSends} out of ${result.totalRecipients} recipients`
        : `Failed to send message. ${result.failedSends} out of ${result.totalRecipients} recipients failed`,
      data: {
        totalRecipients: result.totalRecipients,
        successfulSends: result.successfulSends,
        failedSends: result.failedSends,
        results: result.results,
      },
      timestamp: new Date(),
    };

    // Return appropriate status code
    const statusCode = result.success ? (result.failedSends > 0 ? 207 : 200) : 400;
    res.status(statusCode).json(response);
  } catch (error: any) {
    console.error('❌ Error in sendMessage:', error);
    throw createError.internal(`Failed to send message: ${error.message}`);
  }
});

/**
 * Get message history for the authenticated user
 * @route GET /api/messages/history
 * @access Private
 */
export const getMessageHistory = asyncHandler(async (
  req: AuthenticatedRequest,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  console.log('📨 GET /api/messages/history - Fetching message history');

  // Validate query parameters
  const validation = messageHistorySchema.safeParse(req.query);
  if (!validation.success) {
    throw createError.badRequest('Invalid query parameters', validation.error.errors);
  }

  const { limit, offset } = validation.data;
  const userId = req.user?.user_id;

  if (!userId) {
    throw createError.unauthorized('User not authenticated');
  }

  try {
    const messages = await messagingService.getMessageHistory(userId, limit, offset);

    res.json({
      success: true,
      message: 'Message history retrieved successfully',
      data: {
        messages,
        pagination: {
          limit,
          offset,
          total: messages.length,
        },
      },
      timestamp: new Date(),
    });
  } catch (error: any) {
    console.error('❌ Error in getMessageHistory:', error);
    throw createError.internal(`Failed to fetch message history: ${error.message}`);
  }
});

/**
 * Get message statistics for the authenticated user
 * @route GET /api/messages/stats
 * @access Private
 */
export const getMessageStats = asyncHandler(async (
  req: AuthenticatedRequest,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  console.log('📨 GET /api/messages/stats - Fetching message statistics');

  const userId = req.user?.user_id;

  if (!userId) {
    throw createError.unauthorized('User not authenticated');
  }

  try {
    const stats = await messagingService.getMessageStats(userId);

    res.json({
      success: true,
      message: 'Message statistics retrieved successfully',
      data: stats,
      timestamp: new Date(),
    });
  } catch (error: any) {
    console.error('❌ Error in getMessageStats:', error);
    throw createError.internal(`Failed to fetch message statistics: ${error.message}`);
  }
});

/**
 * Test email configuration
 * @route POST /api/messages/test-email
 * @access Private
 */
export const testEmailConfiguration = asyncHandler(async (
  req: AuthenticatedRequest,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  console.log('📨 POST /api/messages/test-email - Testing email configuration');

  const userId = req.user?.user_id;

  if (!userId) {
    throw createError.unauthorized('User not authenticated');
  }

  try {
    const result = await emailService.testEmailConfiguration(userId);

    res.json({
      success: result.success,
      message: result.success 
        ? 'Email configuration test successful' 
        : `Email configuration test failed: ${result.error}`,
      data: result,
      timestamp: new Date(),
    });
  } catch (error: any) {
    console.error('❌ Error in testEmailConfiguration:', error);
    throw createError.internal(`Failed to test email configuration: ${error.message}`);
  }
});

/**
 * Send test email
 * @route POST /api/messages/send-test-email
 * @access Private
 */
export const sendTestEmail = asyncHandler(async (
  req: AuthenticatedRequest,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  console.log('📨 POST /api/messages/send-test-email - Sending test email');

  // Validate request body
  const validation = testEmailSchema.safeParse(req.body);
  if (!validation.success) {
    throw createError.badRequest('Invalid email data', validation.error.errors);
  }

  const { email } = validation.data;
  const userId = req.user?.user_id;

  if (!userId) {
    throw createError.unauthorized('User not authenticated');
  }

  try {
    const result = await emailService.sendTestEmail(email, userId);

    res.json({
      success: result.success,
      message: result.success 
        ? 'Test email sent successfully' 
        : `Failed to send test email: ${result.error}`,
      data: result,
      timestamp: new Date(),
    });
  } catch (error: any) {
    console.error('❌ Error in sendTestEmail:', error);
    throw createError.internal(`Failed to send test email: ${error.message}`);
  }
});

/**
 * Get available delivery methods
 * @route GET /api/messages/delivery-methods
 * @access Private
 */
export const getDeliveryMethods = asyncHandler(async (
  _req: AuthenticatedRequest,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  console.log('📨 GET /api/messages/delivery-methods - Getting available delivery methods');

  const deliveryMethods = [
    {
      method: 'email',
      name: 'Email',
      description: 'Send messages via email',
      available: true,
      icon: '📧',
    },
    {
      method: 'sms',
      name: 'SMS',
      description: 'Send messages via SMS (Coming Soon)',
      available: false,
      icon: '📱',
    },
    {
      method: 'whatsapp',
      name: 'WhatsApp',
      description: 'Send messages via WhatsApp (Coming Soon)',
      available: false,
      icon: '💬',
    },
  ];

  res.json({
    success: true,
    message: 'Delivery methods retrieved successfully',
    data: deliveryMethods,
    timestamp: new Date(),
  });
});
