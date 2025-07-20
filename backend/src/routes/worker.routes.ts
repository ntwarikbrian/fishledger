/**
 * Worker Routes
 * Defines API endpoints for worker management operations
 */

import { Hono } from 'hono';
import { 
  createWorker,
  getAllWorkers,
  getWorkerById,
  updateWorker,
  deleteWorker,
  getWorkerPermissions,
  updateWorkerPermissions
} from '../handlers/workers';
import { authMiddleware } from '../middleware/auth-hono';
import { rateLimitMiddleware } from '../middleware/rate-limit';
import { requestIdMiddleware } from '../middleware/request-id';
import { loggingMiddleware } from '../middleware/logging';

// Create worker router
const workerRouter = new Hono();

// Apply middleware
workerRouter.use('*', requestIdMiddleware);
workerRouter.use('*', loggingMiddleware);
workerRouter.use('*', authMiddleware); // Require authentication for all worker routes
workerRouter.use('*', rateLimitMiddleware);

/**
 * @route POST /workers
 * @desc Create a new worker account
 * @access Private (Business owners only)
 * @body {
 *   full_name: string,
 *   email: string,
 *   password: string,
 *   phone_number?: string,
 *   monthly_salary?: number,
 *   id_card_front: File,
 *   id_card_back: File
 * }
 */
workerRouter.post('/', createWorker);

/**
 * @route GET /workers
 * @desc Get all workers
 * @access Private (Business owners only)
 */
workerRouter.get('/', getAllWorkers);

/**
 * @route GET /workers/:id
 * @desc Get worker by ID
 * @access Private (Business owners only)
 * @param {string} id - Worker ID
 */
workerRouter.get('/:id', getWorkerById);

/**
 * @route PUT /workers/:id
 * @desc Update worker information
 * @access Private (Business owners only)
 * @param {string} id - Worker ID
 * @body {
 *   full_name?: string,
 *   email?: string,
 *   phone_number?: string,
 *   monthly_salary?: number
 * }
 */
workerRouter.put('/:id', updateWorker);

/**
 * @route DELETE /workers/:id
 * @desc Delete worker account
 * @access Private (Business owners only)
 * @param {string} id - Worker ID
 */
workerRouter.delete('/:id', deleteWorker);

/**
 * @route GET /workers/:id/permissions
 * @desc Get worker permissions
 * @access Private (Business owners only)
 * @param {string} id - Worker ID
 */
workerRouter.get('/:id/permissions', getWorkerPermissions);

/**
 * @route PUT /workers/:id/permissions
 * @desc Update worker permissions
 * @access Private (Business owners only)
 * @param {string} id - Worker ID
 * @body {
 *   permissions: {
 *     [category: string]: {
 *       [permission: string]: boolean
 *     }
 *   }
 * }
 */
workerRouter.put('/:id/permissions', updateWorkerPermissions);

export { workerRouter };
