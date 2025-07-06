/**
 * API Types and Interfaces
 * Centralized type definitions for all API operations
 */

// =====================================================
// COMMON API TYPES
// =====================================================

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp?: Date;
}

/**
 * API request configuration
 */
export interface ApiRequestConfig extends RequestInit {
  timeout?: number;
  retries?: number;
}

/**
 * Error response structure
 */
export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: any;
}

// =====================================================
// AUTHENTICATION TYPES
// =====================================================

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  address: string;
  businessType: string;
}

export interface AuthResponse {
  user: UserData;
  token: string;
  refreshToken?: string;
}

export interface UserData {
  user_id: string;
  business_name: string;
  owner_name: string;
  email_address: string;
  phone_number?: string;
  address?: string;
  business_type?: string;
  created_at: string;
}

// =====================================================
// CATEGORY TYPES
// =====================================================

export interface CategoryData {
  category_id: string;
  name: string;
  description?: string;
  created_at: string;
}

export interface CreateCategoryData {
  name: string;
  description?: string;
}

// =====================================================
// FOLDER TYPES
// =====================================================

export interface FolderData {
  folder_id: string;
  folder_name: string;
  description?: string;
  color: string;
  icon: string;
  file_count: number;
  total_size: number;
  created_by: string;
  created_at: string;
}

export interface CreateFolderData {
  folder_name: string;
  description?: string;
  color?: string;
  icon?: string;
}

export interface UpdateFolderData {
  folder_name?: string;
  description?: string;
  color?: string;
  icon?: string;
}

// =====================================================
// FILE TYPES
// =====================================================

export type CloudinaryResourceType = 'image' | 'video' | 'raw' | 'auto';

export interface FileData {
  file_id: string;
  file_name: string;
  file_url: string;
  cloudinary_public_id?: string;
  cloudinary_url?: string;
  cloudinary_secure_url?: string;
  file_type?: string;
  cloudinary_resource_type?: CloudinaryResourceType;
  description?: string;
  folder_id: string;
  file_size?: number;
  upload_date: string;
  added_by: string;
}

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

// =====================================================
// PRODUCT TYPES
// =====================================================

export interface ProductData {
  product_id: string;
  name: string;
  category_id: string;
  price: number;
  stock_quantity: number;
  description?: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateProductData {
  name: string;
  category_id: string;
  price: number;
  stock_quantity: number;
  description?: string;
  image_url?: string;
}

// =====================================================
// CUSTOMER TYPES
// =====================================================

export interface CustomerData {
  customer_id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  created_at: string;
}

export interface CreateCustomerData {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

// =====================================================
// ORDER TYPES
// =====================================================

export interface OrderData {
  order_id: string;
  customer_id: string;
  total_amount: number;
  status: 'pending' | 'confirmed' | 'delivered' | 'cancelled';
  order_date: string;
  delivery_date?: string;
  notes?: string;
}

export interface CreateOrderData {
  customer_id: string;
  total_amount: number;
  status?: 'pending' | 'confirmed' | 'delivered' | 'cancelled';
  delivery_date?: string;
  notes?: string;
}

// =====================================================
// PAGINATION TYPES
// =====================================================

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// =====================================================
// QUERY TYPES
// =====================================================

export interface QueryFilters {
  [key: string]: any;
}

export interface SearchParams {
  query?: string;
  filters?: QueryFilters;
  pagination?: PaginationParams;
}
