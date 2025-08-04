/**
 * Messages routes
 * Defines routes for messaging endpoints using saved email credentials
 */

import { Hono } from 'hono';
import type { Env, Variables } from '../types/index';
import {
  sendMessageHandler,
  getMessagesHandler,
  getMessageHandler,
  getDeliveryMethodsHandler,
} from '../handlers/messages';
import { authenticate, apiRateLimit, enforceDataIsolation } from '../middleware';

// Create messages router
const messages = new Hono<{ Bindings: Env; Variables: Variables }>();

/**
 * All message routes require authentication and data isolation
 */
messages.use('*', authenticate);
messages.use('*', enforceDataIsolation);
messages.use('*', apiRateLimit());

/**
 * Message management routes
 */

// POST /messages/send - Send messages to contacts using saved credentials (email or WhatsApp)
messages.post('/send', sendMessageHandler);

// GET /messages - Get message history
messages.get('/', getMessagesHandler);

// GET /messages/:id - Get single message by ID
messages.get('/:id', getMessageHandler);

// GET /messages/delivery-methods - Get available delivery methods
messages.get('/delivery-methods', getDeliveryMethodsHandler);

export { messages };
