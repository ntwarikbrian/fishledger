/**
 * Request Logger Middleware
 * Custom logging middleware for request tracking and monitoring
 */

import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

/**
 * Extended Request interface with tracking properties
 */
interface TrackedRequest extends Request {
  requestId?: string;
  startTime?: number;
}

/**
 * Request logger middleware
 * Adds request tracking and performance monitoring
 */
export const requestLogger = (
  req: TrackedRequest,
  res: Response,
  next: NextFunction
): void => {
  // Generate unique request ID
  req.requestId = uuidv4();
  req.startTime = Date.now();

  // Add request ID to response headers
  res.setHeader('X-Request-ID', req.requestId);

  // Log request start
  console.log(`📥 [${req.requestId}] ${req.method} ${req.originalUrl} - Started`);

  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any): Response {
    const duration = Date.now() - (req.startTime || 0);
    const statusCode = res.statusCode;
    const statusEmoji = statusCode >= 400 ? '❌' : statusCode >= 300 ? '⚠️' : '✅';
    
    console.log(
      `📤 [${req.requestId}] ${req.method} ${req.originalUrl} - ${statusEmoji} ${statusCode} (${duration}ms)`
    );

    // Call original end method
    return originalEnd.call(this, chunk, encoding);
  };

  next();
};
