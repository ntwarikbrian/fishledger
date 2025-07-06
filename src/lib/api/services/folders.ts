/**
 * Folders API Service
 * Handles folder management operations
 */

import { apiClient } from '../client';
import type {
  FolderData,
  CreateFolderData,
  UpdateFolderData,
  ApiResponse,
  PaginatedResponse,
  PaginationParams
} from '../types';

/**
 * Folders API service
 */
export class FoldersService {
  /**
   * Get all folders
   */
  async getAll(params?: PaginationParams): Promise<ApiResponse<FolderData[]>> {
    const queryParams = new URLSearchParams();
    
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.sort) queryParams.append('sort', params.sort);
    if (params?.order) queryParams.append('order', params.order);
    
    const endpoint = `/folders${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiClient.get<FolderData[]>(endpoint);
  }

  /**
   * Get paginated folders
   */
  async getPaginated(params?: PaginationParams): Promise<ApiResponse<PaginatedResponse<FolderData>>> {
    const queryParams = new URLSearchParams();
    
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.sort) queryParams.append('sort', params.sort);
    if (params?.order) queryParams.append('order', params.order);
    
    const endpoint = `/folders/paginated${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiClient.get<PaginatedResponse<FolderData>>(endpoint);
  }

  /**
   * Get folder by ID
   */
  async getById(id: string): Promise<ApiResponse<FolderData>> {
    return apiClient.get<FolderData>(`/folders/${id}`);
  }

  /**
   * Create new folder
   */
  async create(folderData: CreateFolderData): Promise<ApiResponse<FolderData>> {
    return apiClient.post<FolderData>('/folders', folderData);
  }

  /**
   * Update existing folder
   */
  async update(id: string, folderData: UpdateFolderData): Promise<ApiResponse<FolderData>> {
    return apiClient.patch<FolderData>(`/folders/${id}`, folderData);
  }

  /**
   * Delete folder
   */
  async delete(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`/folders/${id}`);
  }

  /**
   * Search folders by name
   */
  async search(query: string, params?: PaginationParams): Promise<ApiResponse<FolderData[]>> {
    const queryParams = new URLSearchParams();
    queryParams.append('q', query);
    
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.sort) queryParams.append('sort', params.sort);
    if (params?.order) queryParams.append('order', params.order);
    
    return apiClient.get<FolderData[]>(`/folders/search?${queryParams.toString()}`);
  }

  /**
   * Get folder statistics
   */
  async getStats(id: string): Promise<ApiResponse<{
    file_count: number;
    total_size: number;
    last_modified: string;
  }>> {
    return apiClient.get(`/folders/${id}/stats`);
  }

  /**
   * Duplicate folder
   */
  async duplicate(id: string, newName?: string): Promise<ApiResponse<FolderData>> {
    return apiClient.post<FolderData>(`/folders/${id}/duplicate`, {
      new_name: newName
    });
  }

  /**
   * Move folder to another parent (if hierarchical structure is supported)
   */
  async move(id: string, newParentId?: string): Promise<ApiResponse<FolderData>> {
    return apiClient.patch<FolderData>(`/folders/${id}/move`, {
      parent_id: newParentId
    });
  }

  /**
   * Get folders by color
   */
  async getByColor(color: string): Promise<ApiResponse<FolderData[]>> {
    return apiClient.get<FolderData[]>(`/folders/by-color/${color}`);
  }

  /**
   * Get recently created folders
   */
  async getRecent(limit: number = 10): Promise<ApiResponse<FolderData[]>> {
    return apiClient.get<FolderData[]>(`/folders/recent?limit=${limit}`);
  }

  /**
   * Bulk delete folders
   */
  async bulkDelete(ids: string[]): Promise<ApiResponse<{
    deleted: string[];
    failed: Array<{ id: string; error: string }>;
  }>> {
    return apiClient.post('/folders/bulk-delete', { ids });
  }

  /**
   * Export folder data
   */
  async export(id: string, format: 'json' | 'csv' = 'json'): Promise<ApiResponse<any>> {
    return apiClient.get(`/folders/${id}/export?format=${format}`);
  }

  /**
   * Get folder permissions (if ACL is implemented)
   */
  async getPermissions(id: string): Promise<ApiResponse<{
    owner: string;
    permissions: Array<{
      user_id: string;
      permission: 'read' | 'write' | 'admin';
    }>;
  }>> {
    return apiClient.get(`/folders/${id}/permissions`);
  }

  /**
   * Update folder permissions
   */
  async updatePermissions(id: string, permissions: Array<{
    user_id: string;
    permission: 'read' | 'write' | 'admin';
  }>): Promise<ApiResponse<void>> {
    return apiClient.patch(`/folders/${id}/permissions`, { permissions });
  }
}

// Create and export service instance
export const foldersService = new FoldersService();
