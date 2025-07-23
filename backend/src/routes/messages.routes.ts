/**
 * Messages routes
 * Defines routes for messaging endpoints using saved email credentials
 */

import { Hono } from 'hono';
import type { Env, Variables } from '../types/index';
import {
  sendEmailHandler,
  getMessagesHandler,
  getMessageHandler,
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

// POST /messages/send - Send email to contacts using saved credentials
messages.post('/send', sendEmailHandler);

// GET /messages - Get message history
messages.get('/', getMessagesHandler);

// GET /messages/:id - Get single message by ID
messages.get('/:id', getMessageHandler);

export { messages };
