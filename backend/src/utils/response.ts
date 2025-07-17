/**
 * Response utilities for consistent API responses
 * Provides standardized response formatting and error handling
 */

import type {
  ApiResponse,
  PaginatedResponse,
  ErrorResponse,
  ValidationError,
  RateLimitInfo,
} from '../types/index';

/**
 * Creates a successful API response
 * @param data - Response data
 * @param message - Optional success message
 * @param requestId - Request identifier
 * @returns Formatted success response
 */
export function createSuccessResponse<T>(
  data: T,
  message?: string,
  requestId = generateRequestId(),
  status = 200,
): Response {
  // Validate status code to prevent invalid Response creation
  if (typeof status !== 'number' || status < 200 || status > 599) {
    console.error('Invalid status code provided to createSuccessResponse:', status);
    status = 200; // Default to 200 for invalid status codes
  }

  const response: ApiResponse<T> = {
    success: true,
    data,
    ...(message && { message }),
    timestamp: new Date().toISOString(),
    requestId,
  };

  return new Response(JSON.stringify(response), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'X-Request-ID': requestId,
    },
  });
}

/**
 * Creates a paginated API response
 * @param data - Array of items
 * @param pagination - Pagination metadata
 * @param requestId - Request identifier
 * @returns Formatted paginated response
 */
export function createPaginatedResponse<T>(
  data: T[],
  pagination: PaginatedResponse<T>['pagination'],
  requestId = generateRequestId(),
): Response {
  const response: PaginatedResponse<T> = {
    success: true,
    data,
    pagination,
    timestamp: new Date().toISOString(),
    requestId,
  };

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'X-Request-ID': requestId,
      'X-Total-Count': pagination.total.toString(),
      'X-Page': pagination.page.toString(),
      'X-Per-Page': pagination.limit.toString(),
    },
  });
}

/**
 * Creates an error response
 * @param error - Error message or Error object
 * @param status - HTTP status code
 * @param details - Additional error details
 * @param requestId - Request identifier
 * @param includeStack - Whether to include stack trace (development only)
 * @returns Formatted error response
 */
export function createErrorResponse(
  error: string | Error,
  status = 500,
  details?: Record<string, unknown>,
  requestId = generateRequestId(),
  includeStack = false,
): Response {
  // Validate status code to prevent invalid Response creation
  if (typeof status !== 'number' || status < 200 || status > 599) {
    console.error('Invalid status code provided to createErrorResponse:', status);
    status = 500; // Default to 500 for invalid status codes
  }

  const errorMessage = error instanceof Error ? error.message : error;
  const stack = error instanceof Error && includeStack ? error.stack : undefined;

  const response: ErrorResponse = {
    success: false,
    error: errorMessage,
    ...(details && { details }),
    ...(stack && { stack }),
    timestamp: new Date().toISOString(),
    requestId,
  };

  return new Response(JSON.stringify(response), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'X-Request-ID': requestId,
    },
  });
}

/**
 * Creates a validation error response
 * @param errors - Array of validation errors
 * @param requestId - Request identifier
 * @returns Formatted validation error response
 */
export function createValidationErrorResponse(
  errors: ValidationError[],
  requestId = generateRequestId(),
): Response {
  return createErrorResponse(
    'Validation failed',
    400,
    { validationErrors: errors },
    requestId,
  );
}

/**
 * Creates a rate limit exceeded response
 * @param rateLimitInfo - Rate limit information
 * @param requestId - Request identifier
 * @returns Formatted rate limit response
 */
export function createRateLimitResponse(
  rateLimitInfo: RateLimitInfo,
  requestId = generateRequestId(),
): Response {
  const response = createErrorResponse(
    'Rate limit exceeded',
    429,
    { rateLimit: rateLimitInfo },
    requestId,
  );

  // Add rate limit headers
  const headers = new Headers(response.headers);
  headers.set('X-RateLimit-Limit', rateLimitInfo.limit.toString());
  headers.set('X-RateLimit-Remaining', rateLimitInfo.remaining.toString());
  headers.set('X-RateLimit-Reset', rateLimitInfo.reset.toString());
  
  if (rateLimitInfo.retryAfter) {
    headers.set('Retry-After', rateLimitInfo.retryAfter.toString());
  }

  return new Response(response.body, {
    status: response.status,
    headers,
  });
}

/**
 * Creates a not found response
 * @param resource - Resource that was not found
 * @param requestId - Request identifier
 * @returns Formatted not found response
 */
export function createNotFoundResponse(
  resource = 'Resource',
  requestId = generateRequestId(),
): Response {
  return createErrorResponse(
    `${resource} not found`,
    404,
    undefined,
    requestId,
  );
}

/**
 * Creates an unauthorized response
 * @param message - Optional custom message
 * @param requestId - Request identifier
 * @returns Formatted unauthorized response
 */
export function createUnauthorizedResponse(
  message = 'Unauthorized',
  requestId = generateRequestId(),
): Response {
  return createErrorResponse(message, 401, undefined, requestId);
}

/**
 * Creates a forbidden response
 * @param message - Optional custom message
 * @param requestId - Request identifier
 * @returns Formatted forbidden response
 */
export function createForbiddenResponse(
  message = 'Forbidden',
  requestId = generateRequestId(),
): Response {
  return createErrorResponse(message, 403, undefined, requestId);
}

/**
 * Creates a method not allowed response
 * @param allowedMethods - Array of allowed HTTP methods
 * @param requestId - Request identifier
 * @returns Formatted method not allowed response
 */
export function createMethodNotAllowedResponse(
  allowedMethods: string[],
  requestId = generateRequestId(),
): Response {
  const response = createErrorResponse(
    'Method not allowed',
    405,
    { allowedMethods },
    requestId,
  );

  const headers = new Headers(response.headers);
  headers.set('Allow', allowedMethods.join(', '));

  return new Response(response.body, {
    status: response.status,
    headers,
  });
}

/**
 * Creates a no content response
 * @param requestId - Request identifier
 * @returns Empty response with 204 status
 */
export function createNoContentResponse(requestId = generateRequestId()): Response {
  return new Response(null, {
    status: 204,
    headers: {
      'X-Request-ID': requestId,
    },
  });
}

/**
 * Generates a unique request ID
 * @returns Random request identifier
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Calculates pagination metadata
 * @param page - Current page number
 * @param limit - Items per page
 * @param total - Total number of items
 * @returns Pagination metadata object
 */
export function calculatePagination(
  page: number,
  limit: number,
  total: number,
): PaginatedResponse<unknown>['pagination'] {
  const totalPages = Math.ceil(total / limit);
  
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

/**
 * Extracts request ID from headers or generates a new one
 * @param request - HTTP request object
 * @returns Request ID string
 */
export function getRequestId(request: Request): string {
  return request.headers.get('X-Request-ID') || generateRequestId();
}

/**
 * Creates an error response with simplified parameters for handlers
 * @param message - Error message
 * @param requestId - Request identifier
 * @param details - Additional error details
 * @param status - HTTP status code (default: 500)
 * @returns Formatted error response
 */
export function createHandlerErrorResponse(
  message: string,
  requestId: string,
  details?: string,
  status = 500,
): ErrorResponse {
  return {
    success: false,
    error: message,
    ...(details && { details: { message: details } }),
    timestamp: new Date().toISOString(),
    requestId,
  };
}
