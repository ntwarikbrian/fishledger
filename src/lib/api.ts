/**
 * API utility functions for making HTTP requests
 * DEPRECATED: This file is kept for backward compatibility
 * Use the new modular API structure in ./api/ directory
 */

// Re-export everything from the new API structure
export * from './api';

// Legacy API configuration - kept for compatibility
const getApiBaseUrl = (): string => {
  const apiMode = import.meta.env.VITE_API_MODE || 'workers';
  const isProduction = import.meta.env.VITE_NODE_ENV === 'production' || import.meta.env.NODE_ENV === 'production';

  if (apiMode === 'workers') {
    return isProduction
      ? 'https://local-fishing-backend.your-username.workers.dev'
      : 'http://localhost:8787';
  } else {
    return isProduction
      ? 'https://your-production-api.com/api'
      : 'http://localhost:5004/api';
  }
};

const API_BASE_URL = getApiBaseUrl();

/**
 * Generic API request function with error handling
 * Handles both old and new backend response formats
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; message?: string; error?: string }> {
  try {
    const token = localStorage.getItem('auth_token');

    // Don't set Content-Type for FormData - let browser set it with boundary
    const isFormData = options.body instanceof FormData;

    // Build headers properly for FormData
    const headers: Record<string, string> = {};

    // Add Content-Type only for non-FormData requests
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }

    // Add Authorization header if token exists
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Merge with any additional headers
    Object.assign(headers, options.headers);

    console.log('API Request:', {
      endpoint,
      method: options.method || 'GET',
      hasToken: !!token,
      isFormData,
      headers: Object.keys(headers)
    });

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    let result;
    try {
      result = await response.json();
    } catch (jsonError) {
      // If response is not JSON, create a basic error response
      result = {
        success: false,
        error: `Server returned non-JSON response: ${response.statusText}`,
      };
    }

    console.log('API Response:', {
      status: response.status,
      ok: response.ok,
      result
    });

    if (!response.ok) {
      // Handle new backend error format
      if (result && typeof result === 'object') {
        // New format: { success: false, error: "message", ... }
        if ('success' in result && result.success === false) {
          return {
            success: false,
            error: result.error || result.message || `HTTP error! status: ${response.status}`,
            status: response.status,
          };
        }
        // Old format or other error structures
        return {
          success: false,
          error: result.error || result.message || `HTTP error! status: ${response.status}`,
          status: response.status,
        };
      }

      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Handle successful responses - normalize format
    if (result && typeof result === 'object') {
      // New backend format: { success: true, data: {...}, message?: "...", ... }
      if ('success' in result && result.success === true) {
        return {
          success: true,
          data: result.data,
          message: result.message,
        };
      }

      // Old format or direct data response
      if ('success' in result) {
        return result;
      }

      // Direct data response (wrap in success format)
      return {
        success: true,
        data: result as T,
      };
    }

    // Fallback for non-object responses
    return {
      success: true,
      data: result as T,
    };
  } catch (error) {
    console.error(`API request failed for ${endpoint}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Categories API functions
 */
export const categoriesApi = {
  /**
   * Get all product categories
   */
  getAll: () => apiRequest<any[]>('/api/categories'),

  /**
   * Create a new category
   */
  create: (data: { name: string; description?: string }) =>
    apiRequest('/api/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /**
   * Update an existing category
   */
  update: (id: string, data: { name: string; description?: string }) =>
    apiRequest(`/api/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  /**
   * Delete a category
   */
  delete: (id: string) =>
    apiRequest(`/api/categories/${id}`, {
      method: 'DELETE',
    }),
};

/**
 * Products API functions
 */
export const productsApi = {
  /**
   * Get all products
   */
  getAll: () => apiRequest<any[]>('/api/products'),

  /**
   * Create a new product
   */
  create: (data: any) =>
    apiRequest('/api/products', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /**
   * Update an existing product
   */
  update: (id: string, data: any) =>
    apiRequest(`/api/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  /**
   * Delete a product (with cascading delete of all related records)
   */
  delete: (id: string, reason?: string) =>
    apiRequest(`/api/products/${id}`, {
      method: 'DELETE',
      body: reason ? JSON.stringify({ reason }) : undefined,
    }),

  /**
   * Record damaged product
   */
  recordDamage: (id: string, data: {
    damaged_boxes: number;
    damaged_kg: number;
    damaged_reason: string;
    description?: string;
  }) =>
    apiRequest(`/api/products/${id}/damage`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /**
   * Get all damaged products
   */
  getDamagedProducts: () => apiRequest<any[]>('/api/products/damaged'),
};

/**
 * Stock Movement API endpoints
 */
export const stockMovementsApi = {
  /**
   * Get all stock movements with filtering
   */
  getAll: (params?: {
    movement_type?: string;
    product_id?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.movement_type) searchParams.append('movement_type', params.movement_type);
    if (params?.product_id) searchParams.append('product_id', params.product_id);
    if (params?.status) searchParams.append('status', params.status);
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.offset) searchParams.append('offset', params.offset.toString());

    return apiRequest<any[]>(`/api/stock-movements?${searchParams.toString()}`);
  },

  /**
   * Get stock movement by ID
   */
  getById: (id: string) => apiRequest<any>(`/api/stock-movements/${id}`),

  /**
   * Get stock movements for a specific product
   */
  getByProduct: (productId: string, limit?: number) => {
    const params = limit ? `?limit=${limit}` : '';
    return apiRequest<any[]>(`/api/stock-movements/product/${productId}${params}`);
  },

  /**
   * Create a new stock movement
   */
  create: (data: {
    product_id: string;
    movement_type: 'damaged' | 'new_stock' | 'stock_correction' | 'product_edit' | 'product_delete';
    box_change?: number;
    kg_change?: number;
    reason?: string;
    damaged_id?: string;
    stock_addition_id?: string;
    correction_id?: string;
    field_changed?: string;
    old_value?: string;
    new_value?: string;
  }) =>
    apiRequest(`/api/stock-movements`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /**
   * Approve a pending product edit request
   */
  approveProductEdit: (movementId: string) =>
    apiRequest(`/api/stock-movements/${movementId}/approve`, {
      method: 'POST',
    }),

  /**
   * Reject a pending product edit request
   */
  rejectProductEdit: (movementId: string, reason?: string) =>
    apiRequest(`/api/stock-movements/${movementId}/reject`, {
      method: 'POST',
      body: reason ? JSON.stringify({ reason }) : undefined,
    }),

  /**
   * Approve a pending product delete request
   */
  approveProductDelete: (movementId: string) =>
    apiRequest(`/api/stock-movements/${movementId}/approve-delete`, {
      method: 'POST',
    }),

  /**
   * Reject a pending product delete request
   */
  rejectProductDelete: (movementId: string, reason?: string) =>
    apiRequest(`/api/stock-movements/${movementId}/reject-delete`, {
      method: 'POST',
      body: reason ? JSON.stringify({ reason }) : undefined,
    }),
};

// =====================================================
// STOCK CORRECTIONS API
// =====================================================

export const stockCorrections = {
  /**
   * Get all stock corrections with filtering
   */
  getAll: (params?: {
    product_id?: string;
    status?: string;
    limit?: number;
    offset?: number;
    start_date?: string;
    end_date?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.product_id) searchParams.append('product_id', params.product_id);
    if (params?.status) searchParams.append('status', params.status);
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.offset) searchParams.append('offset', params.offset.toString());
    if (params?.start_date) searchParams.append('start_date', params.start_date);
    if (params?.end_date) searchParams.append('end_date', params.end_date);

    return apiRequest<any[]>(`/api/stock-corrections?${searchParams.toString()}`);
  },

  /**
   * Get stock correction by ID
   */
  getById: (id: string) => apiRequest<any>(`/api/stock-corrections/${id}`),

  /**
   * Get stock corrections for a specific product
   */
  getByProduct: (productId: string, limit?: number) => {
    const params = limit ? `?limit=${limit}` : '';
    return apiRequest<any[]>(`/api/stock-corrections/product/${productId}${params}`);
  },

  /**
   * Create a new stock correction
   */
  create: (data: {
    product_id: string;
    box_adjustment: number;
    kg_adjustment: number;
    correction_reason: string;
    correction_date?: string;
  }) =>
    apiRequest(`/api/stock-corrections`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// =====================================================
// STOCK ADDITIONS API
// =====================================================

export const stockAdditions = {
  /**
   * Get all stock additions with filtering
   */
  getAll: (params?: {
    product_id?: string;
    status?: string;
    limit?: number;
    offset?: number;
    start_date?: string;
    end_date?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.product_id) searchParams.append('product_id', params.product_id);
    if (params?.status) searchParams.append('status', params.status);
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.offset) searchParams.append('offset', params.offset.toString());
    if (params?.start_date) searchParams.append('start_date', params.start_date);
    if (params?.end_date) searchParams.append('end_date', params.end_date);

    return apiRequest<any[]>(`/api/stock-additions?${searchParams.toString()}`);
  },

  /**
   * Get stock addition by ID
   */
  getById: (id: string) => apiRequest<any>(`/api/stock-additions/${id}`),

  /**
   * Get stock additions for a specific product
   */
  getByProduct: (productId: string, limit?: number) => {
    const params = limit ? `?limit=${limit}` : '';
    return apiRequest<any[]>(`/api/stock-additions/product/${productId}${params}`);
  },

  /**
   * Create a new stock addition
   */
  create: (data: {
    product_id: string;
    boxes_added: number;
    kg_added: number;
    total_cost: number;
    delivery_date?: string;
  }) =>
    apiRequest(`/api/products/${data.product_id}/stock`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

/**
 * Contact types for API operations
 */
export interface Contact {
  contact_id: string;
  company_name?: string;
  contact_name: string;
  email?: string;
  phone_number?: string;
  contact_type: 'supplier' | 'customer';
  address?: string;
  added_by: string;
}

export interface CreateContactInput {
  company_name?: string;
  contact_name: string;
  email?: string;
  phone_number?: string;
  contact_type: 'supplier' | 'customer';
  address?: string;
  // Note: added_by is handled automatically by the server from the authenticated user
}

export interface UpdateContactInput {
  company_name?: string;
  contact_name?: string;
  email?: string;
  phone_number?: string;
  contact_type?: 'supplier' | 'customer';
  address?: string;
}

export interface ContactQueryParams {
  contact_type?: 'supplier' | 'customer';
  search?: string;
  page?: number;
  limit?: number;
  sort_by?: 'contact_name' | 'company_name' | 'contact_type';
  sort_order?: 'ASC' | 'DESC';
}

/**
 * Contacts API functions
 */
export const contactsApi = {
  /**
   * Get all contacts with optional filtering and pagination
   */
  getAll: (params?: ContactQueryParams) => {
    const searchParams = new URLSearchParams();

    if (params?.contact_type) searchParams.append('contact_type', params.contact_type);
    if (params?.search) searchParams.append('search', params.search);
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.sort_by) searchParams.append('sort_by', params.sort_by);
    if (params?.sort_order) searchParams.append('sort_order', params.sort_order);

    const queryString = searchParams.toString();
    const url = queryString ? `/contacts?${queryString}` : '/contacts';

    return apiRequest<{
      data: Contact[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>(url);
  },

  /**
   * Get contact by ID
   */
  getById: (id: string) => apiRequest<{ data: Contact }>(`/api/contacts/${id}`),

  /**
   * Create a new contact
   */
  create: (data: CreateContactInput) =>
    apiRequest<{ data: Contact }>('/api/contacts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /**
   * Update an existing contact
   */
  update: (id: string, data: UpdateContactInput) =>
    apiRequest<{ data: Contact }>(`/api/contacts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  /**
   * Delete a contact
   */
  delete: (id: string) =>
    apiRequest<{ data: Contact }>(`/api/contacts/${id}`, {
      method: 'DELETE',
    }),

  /**
   * Get contacts by type (customers or suppliers)
   */
  getByType: (type: 'supplier' | 'customer', params?: Omit<ContactQueryParams, 'contact_type'>) =>
    contactsApi.getAll({ ...params, contact_type: type }),

  /**
   * Search contacts by name, company, or email
   */
  search: (query: string, params?: Omit<ContactQueryParams, 'search'>) =>
    contactsApi.getAll({ ...params, search: query }),
};

/**
 * Folder interface for frontend
 */
export interface FolderData {
  folder_id: string;
  folder_name: string;
  description?: string;
  color: string;
  icon: string;
  file_count: number;
  total_size: number;
  is_permanent?: boolean; // Whether this is a permanent system folder
  created_by: string;
}

/**
 * Folder creation input interface
 */
export interface CreateFolderData {
  folder_name: string;
  description?: string;
  color?: string;
  icon?: string;
}

/**
 * Folder update input interface
 */
export interface UpdateFolderData {
  folder_name?: string;
  description?: string;
  color?: string;
  icon?: string;
}

/**
 * Expense Categories API functions
 */
export const expenseCategoriesApi = {
  /**
   * Get all expense categories
   */
  getAll: () => apiRequest<any[]>('/api/expenses/categories'),

  /**
   * Create a new expense category
   */
  create: (data: { category_name: string; description?: string; budget?: number }) =>
    apiRequest('/api/expenses/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /**
   * Update an existing expense category
   */
  update: (id: string, data: { category_name: string; description?: string; budget?: number }) =>
    apiRequest(`/api/expenses/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  /**
   * Delete an expense category
   */
  delete: (id: string) =>
    apiRequest(`/api/expenses/categories/${id}`, {
      method: 'DELETE',
    }),
};

/**
 * Expenses API functions
 */
export const expensesApi = {
  /**
   * Get all expenses
   */
  getAll: () => apiRequest<any[]>('/api/expenses'),

  /**
   * Create a new expense
   */
  create: (data: {
    title: string;
    category_id: string;
    amount: number;
    date: string;
    status?: string;
    receipt_url?: string | null;
  }) =>
    apiRequest('/api/expenses', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /**
   * Create a new expense with file upload
   */
  createWithFile: (data: {
    title: string;
    category_id: string;
    amount: number;
    date: string;
    status?: string;
    receipt_url?: string | null;
  }, file?: File) => {
    const formData = new FormData();

    // Append expense data
    formData.append('title', data.title);
    formData.append('category_id', data.category_id);
    formData.append('amount', data.amount.toString());
    formData.append('date', data.date);
    formData.append('status', data.status || 'pending');

    if (data.receipt_url) {
      formData.append('receipt_url', data.receipt_url);
    }

    // Append file if provided
    if (file) {
      formData.append('receipt', file);
    }

    return apiRequest('/api/expenses/upload', {
      method: 'POST',
      body: formData,
    });
  },

  /**
   * Update an existing expense
   */
  update: (id: string, data: {
    title?: string;
    category_id?: string;
    amount?: number;
    date?: string;
    status?: string;
    receipt_url?: string | null;
  }) =>
    apiRequest(`/api/expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  /**
   * Delete an expense
   */
  delete: (id: string) =>
    apiRequest(`/api/expenses/${id}`, {
      method: 'DELETE',
    }),
};

/**
 * Folders API functions
 */
export const foldersApi = {
  /**
   * Get all folders for the authenticated user
   */
  getAll: () => apiRequest<FolderData[]>('/api/folders'),

  /**
   * Get a specific folder by ID
   */
  getById: (id: string) => apiRequest<FolderData>(`/api/folders/${id}`),

  /**
   * Create a new folder
   */
  create: (data: CreateFolderData) =>
    apiRequest<FolderData>('/api/folders', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /**
   * Update an existing folder
   */
  update: (id: string, data: UpdateFolderData) =>
    apiRequest<FolderData>(`/api/folders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  /**
   * Delete a folder (only if it's empty)
   */
  delete: (id: string) =>
    apiRequest<{ folder_id: string }>(`/api/folders/${id}`, {
      method: 'DELETE',
    }),
};

/**
 * File data interface for API responses
 */
export interface FileData {
  file_id: string;
  file_name: string;
  file_url: string;
  cloudinary_public_id?: string;
  cloudinary_url?: string;
  cloudinary_secure_url?: string;
  file_type?: string;
  cloudinary_resource_type?: string;
  description?: string;
  folder_id: string;
  file_size?: number;
  upload_date: string;
  added_by: string;
}

/**
 * File upload response interface
 */
export interface FileUploadResponse {
  file: FileData;
  cloudinary: {
    public_id: string;
    secure_url: string;
    resource_type: string;
    format?: string;
    bytes?: number;
  };
  metadata: {
    size: string;
    category: string;
    mime_type: string;
  };
}

/**
 * Multiple file upload response interface
 */
export interface MultipleFileUploadResponse {
  successful: Array<{
    file: FileData;
    cloudinary: {
      public_id: string;
      secure_url: string;
      resource_type: string;
    };
  }>;
  failed: Array<{
    error: string;
  }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}

/**
 * Files API functions
 */
export const filesApi = {
  /**
   * Get files by folder ID
   */
  getByFolder: (folderId: string) =>
    apiRequest<FileData[]>(`/api/files?folder_id=${folderId}`),

  /**
   * Get a specific file by ID
   */
  getById: (id: string) =>
    apiRequest<FileData>(`/api/files/${id}`),

  /**
   * Upload a single file
   */
  uploadSingle: (file: File, folderId: string, description?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder_id', folderId);
    if (description) {
      formData.append('description', description);
    }

    return apiRequest<FileUploadResponse>('/api/files', {
      method: 'POST',
      body: formData,
    });
  },

  /**
   * Upload multiple files
   */
  uploadMultiple: (files: File[], folderId: string, description?: string) => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });
    formData.append('folder_id', folderId);
    if (description) {
      formData.append('description', description);
    }

    return apiRequest<MultipleFileUploadResponse>('/api/files', {
      method: 'POST',
      body: formData,
    });
  },

  /**
   * Update file metadata
   */
  updateMetadata: (id: string, data: { file_name?: string; description?: string }) =>
    apiRequest<FileData>(`/api/files/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  /**
   * Delete a file
   */
  delete: async (id: string) => {
    console.log("🔗 API: Calling delete for file ID:", id);
    try {
      const result = await apiRequest<{ message: string }>(`/api/files/${id}`, {
        method: 'DELETE',
      });
      console.log("🔗 API: Delete response:", result);
      return result;
    } catch (error) {
      console.error("🔗 API: Delete error:", error);
      throw error;
    }
  },
};

export default apiRequest;
