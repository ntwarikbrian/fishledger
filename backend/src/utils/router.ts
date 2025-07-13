/**
 * Simple router implementation for Cloudflare Workers
 * Provides route matching and middleware support
 */

import type { HttpMethod, Route, RouteHandler, RequestContext, Middleware } from '../types/index';
import { createErrorResponse, createMethodNotAllowedResponse, getRequestId } from './response';

/**
 * Simple router class for handling HTTP requests
 */
export class Router {
  private routes: Route[] = [];
  private globalMiddleware: Middleware[] = [];

  /**
   * Adds global middleware that runs for all routes
   * @param middleware - Middleware function
   */
  use(middleware: Middleware): void {
    this.globalMiddleware.push(middleware);
  }

  /**
   * Adds a GET route
   * @param path - Route path pattern
   * @param handler - Route handler function
   * @param middleware - Optional route-specific middleware
   */
  get(path: string, handler: RouteHandler, middleware: (Middleware | RouteHandler)[] = []): void {
    this.addRoute('GET', path, handler, middleware);
  }

  /**
   * Adds a POST route
   * @param path - Route path pattern
   * @param handler - Route handler function
   * @param middleware - Optional route-specific middleware
   */
  post(path: string, handler: RouteHandler, middleware: (Middleware | RouteHandler)[] = []): void {
    this.addRoute('POST', path, handler, middleware);
  }

  /**
   * Adds a PUT route
   * @param path - Route path pattern
   * @param handler - Route handler function
   * @param middleware - Optional route-specific middleware
   */
  put(path: string, handler: RouteHandler, middleware: (Middleware | RouteHandler)[] = []): void {
    this.addRoute('PUT', path, handler, middleware);
  }

  /**
   * Adds a PATCH route
   * @param path - Route path pattern
   * @param handler - Route handler function
   * @param middleware - Optional route-specific middleware
   */
  patch(path: string, handler: RouteHandler, middleware: (Middleware | RouteHandler)[] = []): void {
    this.addRoute('PATCH', path, handler, middleware);
  }

  /**
   * Adds a DELETE route
   * @param path - Route path pattern
   * @param handler - Route handler function
   * @param middleware - Optional route-specific middleware
   */
  delete(path: string, handler: RouteHandler, middleware: (Middleware | RouteHandler)[] = []): void {
    this.addRoute('DELETE', path, handler, middleware);
  }

  /**
   * Adds an OPTIONS route
   * @param path - Route path pattern
   * @param handler - Route handler function
   * @param middleware - Optional route-specific middleware
   */
  options(path: string, handler: RouteHandler, middleware: (Middleware | RouteHandler)[] = []): void {
    this.addRoute('OPTIONS', path, handler, middleware);
  }

  /**
   * Handles an incoming request
   * @param request - HTTP request
   * @param context - Request context
   * @returns Promise resolving to HTTP response
   */
  async handle(request: Request, context: RequestContext): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method as HttpMethod;
    const pathname = url.pathname;

    // Handle OPTIONS requests globally for CORS
    if (method === 'OPTIONS') {
      // Let the global middleware handle OPTIONS requests
      return await this.executeMiddleware(
        request,
        context,
        this.globalMiddleware,
        async () => new Response(null, { status: 204 }),
      );
    }

    // Find matching route
    const matchedRoute = this.findRoute(method, pathname);

    if (!matchedRoute) {
      // Check if path exists with different method
      const pathExists = this.routes.some(route => this.matchPath(route.path, pathname));

      if (pathExists) {
        const allowedMethods = this.routes
          .filter(route => this.matchPath(route.path, pathname))
          .map(route => route.method);

        return createMethodNotAllowedResponse(allowedMethods, context.requestId);
      }

      return createErrorResponse('Route not found', 404, undefined, context.requestId);
    }

    try {
      // Execute middleware chain
      return await this.executeMiddleware(
        request,
        context,
        [...this.globalMiddleware, ...(matchedRoute.middleware || [])],
        matchedRoute.handler,
      );
    } catch (error) {
      console.error('Router error:', error);
      return createErrorResponse(
        error instanceof Error ? error.message : 'Internal server error',
        500,
        undefined,
        context.requestId,
        true, // Include stack trace in development
      );
    }
  }

  /**
   * Adds a route to the router
   * @param method - HTTP method
   * @param path - Route path pattern
   * @param handler - Route handler function
   * @param middleware - Optional route-specific middleware
   */
  private addRoute(
    method: HttpMethod,
    path: string,
    handler: RouteHandler,
    middleware: (Middleware | RouteHandler)[] = [],
  ): void {
    this.routes.push({
      method,
      path: this.normalizePath(path),
      handler,
      middleware,
    });
  }

  /**
   * Finds a matching route for the given method and path
   * @param method - HTTP method
   * @param pathname - Request pathname
   * @returns Matched route or null
   */
  private findRoute(method: HttpMethod, pathname: string): Route | null {
    return this.routes.find(
      route => route.method === method && this.matchPath(route.path, pathname),
    ) || null;
  }

  /**
   * Checks if a path pattern matches the given pathname
   * @param pattern - Route path pattern
   * @param pathname - Request pathname
   * @returns True if path matches
   */
  private matchPath(pattern: string, pathname: string): boolean {
    const normalizedPathname = this.normalizePath(pathname);
    
    // Exact match
    if (pattern === normalizedPathname) {
      return true;
    }

    // Pattern with parameters (e.g., /users/:id)
    const patternParts = pattern.split('/');
    const pathnameParts = normalizedPathname.split('/');

    if (patternParts.length !== pathnameParts.length) {
      return false;
    }

    return patternParts.every((part, index) => {
      return part.startsWith(':') || part === pathnameParts[index];
    });
  }

  /**
   * Normalizes a path by removing trailing slashes and ensuring leading slash
   * @param path - Path to normalize
   * @returns Normalized path
   */
  private normalizePath(path: string): string {
    if (!path.startsWith('/')) {
      path = '/' + path;
    }
    
    if (path.length > 1 && path.endsWith('/')) {
      path = path.slice(0, -1);
    }
    
    return path;
  }

  /**
   * Executes middleware chain and final handler
   * @param request - HTTP request
   * @param context - Request context
   * @param middleware - Array of middleware functions
   * @param handler - Final route handler
   * @returns Promise resolving to HTTP response
   */
  private async executeMiddleware(
    request: Request,
    context: RequestContext,
    middleware: (Middleware | RouteHandler)[],
    handler: RouteHandler,
  ): Promise<Response> {
    let index = 0;

    const next = async (): Promise<Response> => {
      if (index >= middleware.length) {
        // All middleware executed, call the final handler
        return await handler(request, context);
      }

      const currentMiddleware = middleware[index++];

      if (!currentMiddleware) {
        return await handler(request, context);
      }

      // Check if it's a middleware or route handler
      if (currentMiddleware.length === 3) {
        // Middleware (has next parameter)
        return await (currentMiddleware as Middleware)(request, context, next);
      } else {
        // Route handler (no next parameter)
        return await (currentMiddleware as RouteHandler)(request, context);
      }
    };

    return await next();
  }
}

/**
 * Extracts path parameters from a matched route
 * @param pattern - Route path pattern (e.g., /users/:id)
 * @param pathname - Actual pathname (e.g., /users/123)
 * @returns Object with parameter key-value pairs
 */
export function extractPathParams(pattern: string, pathname: string): Record<string, string> {
  const params: Record<string, string> = {};
  
  const patternParts = pattern.split('/');
  const pathnameParts = pathname.split('/');

  patternParts.forEach((part, index) => {
    if (part.startsWith(':')) {
      const paramName = part.slice(1);
      params[paramName] = pathnameParts[index] || '';
    }
  });

  return params;
}

/**
 * Parses query parameters from a URL
 * @param url - URL object
 * @returns Object with query parameter key-value pairs
 */
export function parseQueryParams(url: URL): Record<string, string> {
  const params: Record<string, string> = {};
  
  url.searchParams.forEach((value, key) => {
    params[key] = value;
  });

  return params;
}

/**
 * Creates a new router instance
 * @returns New router instance
 */
export function createRouter(): Router {
  return new Router();
}
