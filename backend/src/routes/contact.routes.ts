/**
 * Contact routes
 * Defines routes for contact management endpoints
 */

import { Hono } from 'hono';
import type { Env, Variables } from '../types/index';
import {
  getContactsHandler,
  getContactHandler,
  createContactHandler,
  updateContactHandler,
  deleteContactHandler,
} from '../handlers/contacts';
import { authenticate, apiRateLimit, enforceDataIsolation } from '../middleware';

// Create contacts router
const contacts = new Hono<{ Bindings: Env; Variables: Variables }>();

/**
 * All contact routes require authentication and data isolation
 */
contacts.use('*', authenticate);
contacts.use('*', enforceDataIsolation);
contacts.use('*', apiRateLimit());

/**
 * Contact management routes
 */

// GET /contacts - Get all contacts with pagination and search
contacts.get('/', getContactsHandler);

// GET /contacts/:id - Get specific contact by ID
contacts.get('/:id', getContactHandler);

// POST /contacts - Create new contact
contacts.post('/', createContactHandler);

// PUT /contacts/:id - Update existing contact
contacts.put('/:id', updateContactHandler);

// DELETE /contacts/:id - Delete contact
contacts.delete('/:id', deleteContactHandler);

export { contacts };
