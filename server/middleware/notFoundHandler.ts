/**
 * Not Found Handler Middleware
 * Handles requests to non-existent endpoints
 */

import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../types/api.js';

/**
 * 404 Not Found handler
 * Sends a consistent response for non-existent endpoints
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const error: ApiError = {
    code: 'NOT_FOUND',
    message: `Endpoint ${req.method} ${req.originalUrl} not found`,
    timestamp: new Date(),
    path: req.originalUrl,
  };

  res.status(404).json({
    success: false,
    error,
  });
};
