/**
 * Folder routes
 * Defines routes for folder management endpoints
 */

import { Hono } from 'hono';
import type { Env, Variables } from '../types/index';
import {
  getFoldersHandler,
  getFolderHandler,
  createFolderHandler,
  updateFolderHandler,
  deleteFolderHandler,
} from '../handlers/folders';
import { authenticate, apiRateLimit, enforceDataIsolation } from '../middleware';

// Create folders router
const folders = new Hono<{ Bindings: Env; Variables: Variables }>();

/**
 * All folder routes require authentication and data isolation
 */
folders.use('*', authenticate);
folders.use('*', enforceDataIsolation);
folders.use('*', apiRateLimit());

/**
 * Folder management routes
 */

// GET /folders - Get all folders with pagination and search
folders.get('/', getFoldersHandler);

// GET /folders/:id - Get specific folder by ID
folders.get('/:id', getFolderHandler);

// POST /folders - Create new folder
folders.post('/', createFolderHandler);

// PUT /folders/:id - Update existing folder
folders.put('/:id', updateFolderHandler);

// DELETE /folders/:id - Delete folder
folders.delete('/:id', deleteFolderHandler);

export { folders };
