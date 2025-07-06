/**
 * API Services Index
 * Centralized export of all API services
 */

// Import service instances for creating the api object
import { authService } from './auth';
import { foldersService } from './folders';
import { filesService } from './files';

// Re-export everything from individual service files
export * from './auth';
export * from './folders';
export * from './files';

// Export service instances for direct use
export const api = {
  auth: authService,
  folders: foldersService,
  files: filesService,
} as const;

// Export individual services for backward compatibility
export const authApi = authService;
export const foldersApi = foldersService;
export const filesApi = filesService;
