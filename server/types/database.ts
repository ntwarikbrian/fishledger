/**
 * Database Types for Fish Selling Management System
 * TypeScript interfaces matching the PostgreSQL schema
 */

// =====================================================
// 1. USERS TABLE TYPES
// =====================================================

/**
 * User interface for business owners
 * Represents the users table structure
 */
export interface User {
  user_id: string; // UUID
  business_name: string;
  owner_name: string;
  email_address: string;
  phone_number?: string;
  password: string; // Hashed password
  created_at: Date;
  last_login?: Date;
}

/**
 * User creation input (excludes auto-generated fields)
 */
export interface CreateUserInput {
  business_name: string;
  owner_name: string;
  email_address: string;
  phone_number?: string;
  password: string;
}

/**
 * User update input (all fields optional except user_id)
 */
export interface UpdateUserInput {
  user_id: string;
  business_name?: string;
  owner_name?: string;
  email_address?: string;
  phone_number?: string;
  password?: string;
}

// =====================================================
// 2. WORKERS TABLE TYPES
// =====================================================

/**
 * Worker interface for system users employed under a business
 */
export interface Worker {
  worker_id: string; // UUID
  full_name: string;
  email: string;
  phone_number?: string;
  identification_image_url?: string;
  monthly_salary?: number;
  total_revenue_generated: number;
  recent_login_history?: Record<string, any>; // JSONB
  created_at: Date;
}

/**
 * Worker creation input
 */
export interface CreateWorkerInput {
  full_name: string;
  email: string;
  phone_number?: string;
  identification_image_url?: string;
  monthly_salary?: number;
}

/**
 * Worker update input
 */
export interface UpdateWorkerInput {
  worker_id: string;
  full_name?: string;
  email?: string;
  phone_number?: string;
  identification_image_url?: string;
  monthly_salary?: number;
  total_revenue_generated?: number;
  recent_login_history?: Record<string, any>;
}

// =====================================================
// 3. WORKER TASKS TABLE TYPES
// =====================================================

export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'overdue';

/**
 * Worker task interface
 */
export interface WorkerTask {
  task_id: string; // UUID
  task_title: string;
  sub_tasks?: Record<string, any>; // JSONB
  assigned_to: string; // UUID reference to workers
  priority: TaskPriority;
  due_date_time?: Date;
  status: TaskStatus;
  progress_percentage: number;
  created_at: Date;
}

/**
 * Worker task creation input
 */
export interface CreateWorkerTaskInput {
  task_title: string;
  sub_tasks?: Record<string, any>;
  assigned_to: string;
  priority?: TaskPriority;
  due_date_time?: Date;
  status?: TaskStatus;
  progress_percentage?: number;
}

// =====================================================
// 4. EXPENSE CATEGORIES TABLE TYPES
// =====================================================

/**
 * Expense category interface
 */
export interface ExpenseCategory {
  category_id: string; // UUID
  category_name: string;
  description?: string;
  budget: number;
}

/**
 * Expense category creation input
 */
export interface CreateExpenseCategoryInput {
  category_name: string;
  description?: string;
  budget?: number;
}

// =====================================================
// 5. EXPENSES TABLE TYPES
// =====================================================

export type ExpenseStatus = 'rejected' | 'pending' | 'paid';

/**
 * Expense interface
 */
export interface Expense {
  expense_id: string; // UUID
  category_id: string; // UUID reference to expense_categories
  amount: number;
  date: Date;
  added_by: string; // UUID reference to users
  status: ExpenseStatus;
}

/**
 * Expense creation input
 */
export interface CreateExpenseInput {
  category_id: string;
  amount: number;
  date: Date;
  added_by: string;
  status?: ExpenseStatus;
}

// =====================================================
// 6. CONTACTS TABLE TYPES
// =====================================================

export type ContactType = 'supplier' | 'customer';

/**
 * Contact interface with timestamps for audit trail
 */
export interface Contact {
  contact_id: string; // UUID
  company_name?: string;
  contact_name: string;
  email?: string;
  phone_number?: string;
  contact_type: ContactType;
  address?: string;
  added_by: string; // UUID reference to users
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

/**
 * Contact creation input (from frontend)
 * Note: added_by is handled automatically by the server from authenticated user
 */
export interface CreateContactInput {
  company_name?: string;
  contact_name: string;
  email?: string;
  phone_number?: string;
  contact_type: ContactType;
  address?: string;
}

/**
 * Contact creation input with added_by (internal server use)
 */
export interface CreateContactInputWithUser extends CreateContactInput {
  added_by: string;
}

/**
 * Contact query parameters for filtering and pagination
 */
export interface ContactQueryParams {
  contact_type?: ContactType;
  search?: string;
  page?: number;
  limit?: number;
  sort_by?: 'contact_name' | 'company_name' | 'contact_type';
  sort_order?: 'ASC' | 'DESC';
}

// =====================================================
// 7. MESSAGES TABLE TYPES
// =====================================================

export type RecipientType = 'user' | 'worker' | 'contact';
export type MessageStatus = 'sent' | 'failed' | 'pending';

/**
 * Message interface
 */
export interface Message {
  message_id: string; // UUID
  recipient_id: string; // UUID
  recipient_type: RecipientType;
  subject?: string;
  content: string;
  status: MessageStatus;
  sent_at: Date;
  sent_by: string; // UUID reference to users
}

/**
 * Message creation input
 */
export interface CreateMessageInput {
  recipient_id: string;
  recipient_type: RecipientType;
  subject?: string;
  content: string;
  sent_by: string;
  status?: MessageStatus;
}

// =====================================================
// 8. AUTOMATIC MESSAGES TABLE TYPES
// =====================================================

/**
 * Automatic message interface
 */
export interface AutomaticMessage {
  auto_message_id: string; // UUID
  product_id: string; // UUID reference to products
  current_quantity: number;
  recipient_id: string; // UUID
  recipient_type: RecipientType;
  quantity_needed: number;
  quantity_triggered: number;
  message_template: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * Automatic message creation input
 */
export interface CreateAutomaticMessageInput {
  product_id: string;
  current_quantity: number;
  recipient_id: string;
  recipient_type: RecipientType;
  quantity_needed: number;
  quantity_triggered: number;
  message_template: string;
}

// =====================================================
// 9. FOLDERS TABLE TYPES
// =====================================================

/**
 * Folder interface
 */
export interface Folder {
  folder_id: string; // UUID
  folder_name: string;
  description?: string;
  color: string; // Hex color code
  icon: string; // Icon name
  file_count: number;
  total_size: number; // Total size in bytes
  created_by: string; // UUID reference to users
}

/**
 * Folder creation input
 */
export interface CreateFolderInput {
  folder_name: string;
  description?: string;
  color?: string;
  icon?: string;
  created_by: string;
}

// =====================================================
// 10. FILES TABLE TYPES
// =====================================================

export type CloudinaryResourceType = 'image' | 'video' | 'raw' | 'auto';

/**
 * File interface with Cloudinary integration
 */
export interface File {
  file_id: string; // UUID
  file_name: string;
  file_url: string; // Primary file URL (Cloudinary or fallback)
  cloudinary_public_id?: string; // Cloudinary unique identifier
  cloudinary_url?: string; // Cloudinary HTTP URL
  cloudinary_secure_url?: string; // Cloudinary HTTPS URL
  file_type?: string; // MIME type (e.g., image/jpeg, application/pdf)
  cloudinary_resource_type?: CloudinaryResourceType; // Cloudinary resource type
  description?: string;
  folder_id: string; // UUID reference to folders
  file_size?: number; // File size in bytes
  upload_date: Date;
  added_by: string; // UUID reference to users
}

/**
 * File creation input with Cloudinary support
 */
export interface CreateFileInput {
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
  added_by: string;
}

/**
 * File update input (for editing existing files)
 */
export interface UpdateFileInput {
  file_name?: string;
  file_url?: string;
  cloudinary_public_id?: string;
  cloudinary_url?: string;
  cloudinary_secure_url?: string;
  file_type?: string;
  cloudinary_resource_type?: CloudinaryResourceType;
  description?: string;
  folder_id?: string;
  file_size?: number;
}

/**
 * Cloudinary upload response interface
 */
export interface CloudinaryUploadResponse {
  public_id: string;
  version: number;
  signature: string;
  width?: number;
  height?: number;
  format: string;
  resource_type: CloudinaryResourceType;
  created_at: string;
  tags: string[];
  bytes: number;
  type: string;
  etag: string;
  placeholder: boolean;
  url: string;
  secure_url: string;
  access_mode: string;
  original_filename: string;
}

// =====================================================
// 11. PRODUCT CATEGORIES TABLE TYPES
// =====================================================

/**
 * Product category interface
 */
export interface ProductCategory {
  category_id: string; // UUID
  name: string;
  description?: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * Product category creation input
 */
export interface CreateProductCategoryInput {
  name: string;
  description?: string;
}

// =====================================================
// 12. PRODUCTS TABLE TYPES
// =====================================================

export type SellingType = 'boxed' | 'weight' | 'both';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';
export type StockStatus = 'critical' | 'warning' | 'monitor';

/**
 * Product interface for fish inventory
 */
export interface Product {
  product_id: string; // UUID
  sku: string;
  name: string;
  category_id: string; // UUID reference to product_categories
  quantity: number;
  selling_type: SellingType;
  price: number;
  cost_price: number;
  profit: number; // Generated column
  supplier?: string;
  low_stock_threshold: number;
  damaged_reason?: string;
  damaged_date?: Date;
  loss_value: number;
  approval_status: ApprovalStatus;
  reported_by?: string; // UUID reference to users
  expiry_date?: Date;
  days_left?: number; // Generated column
  stock_status: StockStatus; // Generated column
}

/**
 * Product creation input
 */
export interface CreateProductInput {
  sku: string;
  name: string;
  category_id: string;
  quantity?: number;
  selling_type: SellingType;
  price: number;
  cost_price: number;
  supplier?: string;
  low_stock_threshold?: number;
  damaged_reason?: string;
  damaged_date?: Date;
  loss_value?: number;
  approval_status?: ApprovalStatus;
  reported_by?: string;
  expiry_date?: Date;
}

// =====================================================
// 13. STOCK MOVEMENTS TABLE TYPES
// =====================================================

export type MovementType = 'counting_error' | 'theft' | 'return';

/**
 * Stock movement interface
 */
export interface StockMovement {
  movement_id: string; // UUID
  product_id: string; // UUID reference to products
  movement_type: MovementType;
  weight_change: number; // Weight change in kg
  quantity_change: number; // Quantity change
  reason: string;
  performed_by: string; // UUID reference to users
  created_at: Date;
}

/**
 * Stock movement creation input
 */
export interface CreateStockMovementInput {
  product_id: string;
  movement_type: MovementType;
  weight_change?: number;
  quantity_change?: number;
  reason: string;
  performed_by: string;
}

// =====================================================
// 14. SALES TABLE TYPES
// =====================================================

export type SellingMethod = 'boxed' | 'weight';
export type PaymentStatus = 'pending' | 'paid' | 'partial' | 'overdue';
export type PaymentMethod = 'cash' | 'card' | 'bank_transfer' | 'mobile_money';

/**
 * Sales interface
 */
export interface Sale {
  sales_id: string; // UUID
  product_id: string; // UUID reference to products
  selling_method: SellingMethod;
  quantity: number; // Units for boxed or kg for weight
  total_amount: number;
  date_time: Date;
  payment_status: PaymentStatus;
  payment_method?: PaymentMethod;
  client_name?: string;
  client_email?: string;
  client_phone_number?: string;
  client_address?: string;
}

/**
 * Sales creation input
 */
export interface CreateSaleInput {
  product_id: string;
  selling_method: SellingMethod;
  quantity: number;
  total_amount: number;
  payment_status?: PaymentStatus;
  payment_method?: PaymentMethod;
  client_name?: string;
  client_email?: string;
  client_phone_number?: string;
  client_address?: string;
}

// =====================================================
// 15. WORKER PERMISSIONS TABLE TYPES
// =====================================================

/**
 * Worker permission interface
 */
export interface WorkerPermission {
  worker_permission_id: string; // UUID
  worker_id: string; // UUID reference to workers
  permission_name: string;
  permission_category: string; // e.g., 'sales', 'inventory', 'customers', 'reports'
  is_granted: boolean;
  granted_by: string; // UUID reference to users
  granted_at: Date;
  updated_at: Date;
}

/**
 * Worker permission creation input
 */
export interface CreateWorkerPermissionInput {
  worker_id: string;
  permission_name: string;
  permission_category: string;
  is_granted?: boolean;
  granted_by: string;
}

// =====================================================
// COMMON TYPES AND UTILITIES
// =====================================================

/**
 * Generic API response interface
 */
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  timestamp: Date;
}

/**
 * Pagination interface
 */
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

/**
 * Paginated response interface
 */
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

/**
 * Database query result interface
 */
export interface QueryResult<T = any> {
  rows: T[];
  rowCount: number;
  command: string;
}
