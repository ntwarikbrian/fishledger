/**
 * API utility functions for making HTTP requests
 * DEPRECATED: This file is kept for backward compatibility
 * Use the new modular API structure in ./api/ directory
 */

// Re-export everything from the new API structure
export * from './api';

// Legacy API configuration - kept for compatibility
const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://your-production-api.com/api'
  : 'http://localhost:5004/api';

/**
 * Generic API request function with error handling
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

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || `HTTP error! status: ${response.status}`);
    }

    return result;
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
  getAll: () => apiRequest<any[]>('/categories'),

  /**
   * Create a new category
   */
  create: (data: { name: string; description?: string }) =>
    apiRequest('/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /**
   * Update an existing category
   */
  update: (id: string, data: { name: string; description?: string }) =>
    apiRequest(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  /**
   * Delete a category
   */
  delete: (id: string) =>
    apiRequest(`/categories/${id}`, {
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
  getAll: () => apiRequest<any[]>('/products'),

  /**
   * Create a new product
   */
  create: (data: any) =>
    apiRequest('/products', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /**
   * Update an existing product
   */
  update: (id: string, data: any) =>
    apiRequest(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  /**
   * Delete a product
   */
  delete: (id: string) =>
    apiRequest(`/products/${id}`, {
      method: 'DELETE',
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
  getById: (id: string) => apiRequest<{ data: Contact }>(`/contacts/${id}`),

  /**
   * Create a new contact
   */
  create: (data: CreateContactInput) =>
    apiRequest<{ data: Contact }>('/contacts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /**
   * Update an existing contact
   */
  update: (id: string, data: UpdateContactInput) =>
    apiRequest<{ data: Contact }>(`/contacts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  /**
   * Delete a contact
   */
  delete: (id: string) =>
    apiRequest<{ data: Contact }>(`/contacts/${id}`, {
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
  getAll: () => apiRequest<any[]>('/expenses/categories'),

  /**
   * Create a new expense category
   */
  create: (data: { category_name: string; description?: string; budget?: number }) =>
    apiRequest('/expenses/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /**
   * Update an existing expense category
   */
  update: (id: string, data: { category_name: string; description?: string; budget?: number }) =>
    apiRequest(`/expenses/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  /**
   * Delete an expense category
   */
  delete: (id: string) =>
    apiRequest(`/expenses/categories/${id}`, {
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
  getAll: () => apiRequest<any[]>('/expenses'),

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
    apiRequest('/expenses', {
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
      formData.append('file', file);
    }

    return apiRequest('/expenses', {
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
    apiRequest(`/expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  /**
   * Delete an expense
   */
  delete: (id: string) =>
    apiRequest(`/expenses/${id}`, {
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
  getAll: () => apiRequest<FolderData[]>('/folders'),

  /**
   * Get a specific folder by ID
   */
  getById: (id: string) => apiRequest<FolderData>(`/folders/${id}`),

  /**
   * Create a new folder
   */
  create: (data: CreateFolderData) =>
    apiRequest<FolderData>('/folders', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /**
   * Update an existing folder
   */
  update: (id: string, data: UpdateFolderData) =>
    apiRequest<FolderData>(`/folders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  /**
   * Delete a folder (only if it's empty)
   */
  delete: (id: string) =>
    apiRequest<{ folder_id: string }>(`/folders/${id}`, {
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
    apiRequest<FileData[]>(`/files?folder_id=${folderId}`),

  /**
   * Get a specific file by ID
   */
  getById: (id: string) =>
    apiRequest<FileData>(`/files/${id}`),

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

    return apiRequest<FileUploadResponse>('/files/upload', {
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

    return apiRequest<MultipleFileUploadResponse>('/files/upload-multiple', {
      method: 'POST',
      body: formData,
    });
  },

  /**
   * Delete a file
   */
  delete: (id: string) =>
    apiRequest<{ message: string }>(`/files/${id}`, {
      method: 'DELETE',
    }),
};

export default apiRequest;
