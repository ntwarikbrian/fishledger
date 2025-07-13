/**
 * Files API Service
 * Handles file upload, management, and operations
 */

import { apiClient } from '../client';
import type {
  FileData,
  FileUploadResponse,
  MultipleFileUploadResponse,
  ApiResponse,
  PaginationParams,
  QueryFilters
} from '../types';

/**
 * Files API service
 */
export class FilesService {
  /**
   * Get files by folder ID
   */
  async getByFolder(folderId: string, params?: PaginationParams): Promise<ApiResponse<FileData[]>> {
    const queryParams = new URLSearchParams();
    queryParams.append('folder_id', folderId);
    
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.sort) queryParams.append('sort', params.sort);
    if (params?.order) queryParams.append('order', params.order);
    
    return apiClient.get<FileData[]>(`/api/files?${queryParams.toString()}`);
  }

  /**
   * Get file by ID
   */
  async getById(id: string): Promise<ApiResponse<FileData>> {
    return apiClient.get<FileData>(`/api/files/${id}`);
  }

  /**
   * Upload single file
   */
  async uploadSingle(
    file: File,
    folderId: string,
    description?: string,
    onProgress?: (progress: number) => void
  ): Promise<ApiResponse<FileUploadResponse>> {
    const additionalData: Record<string, string> = {
      folder_id: folderId,
    };
    
    if (description) {
      additionalData.description = description;
    }

    return apiClient.uploadFile<FileUploadResponse>('/files/upload', file, additionalData, onProgress);
  }

  /**
   * Upload multiple files
   */
  async uploadMultiple(
    files: File[],
    folderId: string,
    description?: string
  ): Promise<ApiResponse<MultipleFileUploadResponse>> {
    const formData = new FormData();
    
    files.forEach(file => {
      formData.append('files', file);
    });
    
    formData.append('folder_id', folderId);
    if (description) {
      formData.append('description', description);
    }

    return apiClient.post<MultipleFileUploadResponse>('/api/files/upload-multiple', formData);
  }

  /**
   * Delete file
   */
  async delete(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`/api/files/${id}`);
  }

  /**
   * Update file metadata
   */
  async updateMetadata(id: string, data: {
    file_name?: string;
    description?: string;
    folder_id?: string;
  }): Promise<ApiResponse<FileData>> {
    return apiClient.patch<FileData>(`/files/${id}`, data);
  }

  /**
   * Search files
   */
  async search(
    query: string,
    filters?: QueryFilters,
    params?: PaginationParams
  ): Promise<ApiResponse<FileData[]>> {
    const queryParams = new URLSearchParams();
    queryParams.append('q', query);
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.sort) queryParams.append('sort', params.sort);
    if (params?.order) queryParams.append('order', params.order);
    
    return apiClient.get<FileData[]>(`/api/files/search?${queryParams.toString()}`);
  }

  /**
   * Get files by type
   */
  async getByType(
    fileType: string,
    params?: PaginationParams
  ): Promise<ApiResponse<FileData[]>> {
    const queryParams = new URLSearchParams();
    queryParams.append('type', fileType);
    
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.sort) queryParams.append('sort', params.sort);
    if (params?.order) queryParams.append('order', params.order);
    
    return apiClient.get<FileData[]>(`/api/files/by-type?${queryParams.toString()}`);
  }

  /**
   * Get recent files
   */
  async getRecent(limit: number = 10): Promise<ApiResponse<FileData[]>> {
    return apiClient.get<FileData[]>(`/api/files/recent?limit=${limit}`);
  }

  /**
   * Move file to another folder
   */
  async move(id: string, newFolderId: string): Promise<ApiResponse<FileData>> {
    return apiClient.patch<FileData>(`/files/${id}/move`, {
      folder_id: newFolderId
    });
  }

  /**
   * Copy file to another folder
   */
  async copy(id: string, targetFolderId: string, newName?: string): Promise<ApiResponse<FileData>> {
    return apiClient.post<FileData>(`/api/files/${id}/copy`, {
      folder_id: targetFolderId,
      new_name: newName
    });
  }

  /**
   * Bulk delete files
   */
  async bulkDelete(ids: string[]): Promise<ApiResponse<{
    deleted: string[];
    failed: Array<{ id: string; error: string }>;
  }>> {
    return apiClient.post('/api/files/bulk-delete', { ids });
  }

  /**
   * Get file download URL
   */
  async getDownloadUrl(id: string): Promise<ApiResponse<{ download_url: string; expires_at: string }>> {
    return apiClient.get(`/api/files/${id}/download-url`);
  }

  /**
   * Generate file thumbnail (if supported)
   */
  async generateThumbnail(id: string, size: 'small' | 'medium' | 'large' = 'medium'): Promise<ApiResponse<{
    thumbnail_url: string;
  }>> {
    return apiClient.post(`/api/files/${id}/thumbnail`, { size });
  }

  /**
   * Get file statistics
   */
  async getStats(): Promise<ApiResponse<{
    total_files: number;
    total_size: number;
    by_type: Record<string, number>;
    recent_uploads: number;
  }>> {
    return apiClient.get('/api/files/stats');
  }

  /**
   * Test upload (for debugging)
   */
  async testUpload(file: File): Promise<ApiResponse<any>> {
    return apiClient.uploadFile('/files/test-upload', file);
  }

  /**
   * Get file sharing link (if sharing is implemented)
   */
  async createShareLink(id: string, options?: {
    expires_at?: string;
    password?: string;
    download_limit?: number;
  }): Promise<ApiResponse<{
    share_url: string;
    expires_at?: string;
  }>> {
    return apiClient.post(`/api/files/${id}/share`, options);
  }

  /**
   * Revoke file sharing link
   */
  async revokeShareLink(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/api/files/${id}/share`);
  }
}

// Create and export service instance
export const filesService = new FilesService();
