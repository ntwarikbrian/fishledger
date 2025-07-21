/**
 * File routes
 * Defines routes for file management endpoints
 */

import { Hono } from 'hono';
import type { Env, Variables } from '../types/index';
import {
  getFilesHandler,
  getFileHandler,
  uploadFileHandler,
  updateFileHandler,
  deleteFileHandler,
} from '../handlers/files';
import { authenticate, apiRateLimit, enforceDataIsolation } from '../middleware';

// Create files router
const files = new Hono<{ Bindings: Env; Variables: Variables }>();

/**
 * All file routes require authentication and data isolation
 */
files.use('*', authenticate);
files.use('*', enforceDataIsolation);
files.use('*', apiRateLimit());

/**
 * File management routes
 */

// GET /files - Get all files with pagination and search
files.get('/', getFilesHandler);

// GET /files/:id - Get specific file by ID
files.get('/:id', getFileHandler);

// POST /files - Upload new file
files.post('/', uploadFileHandler);

// PUT /files/:id - Update existing file metadata
files.put('/:id', updateFileHandler);

// DELETE /files/:id - Delete file
files.delete('/:id', deleteFileHandler);

export { files };
