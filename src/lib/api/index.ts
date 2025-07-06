/**
 * Main API Export
 * Centralized export for all API functionality
 */

// Export all types
export * from './types';

// Export API client
export * from './client';

// Export all services
export * from './services';

// Export the main API object for easy access
export { api } from './services';

// Convenience exports for common operations
export { apiClient } from './client';
export { authService as auth } from './services/auth';
export { foldersService as folders } from './services/folders';
export { filesService as files } from './services/files';

// Legacy compatibility exports (for existing code)
export { authService as authApi } from './services/auth';
export { foldersService as foldersApi } from './services/folders';
export { filesService as filesApi } from './services/files';
