/**
 * API Types for Fish Selling Management System
 * Request and response interfaces for API endpoints
 */

import { Request } from 'express';
import { User } from './database.js';

// =====================================================
// AUTHENTICATION TYPES
// =====================================================

/**
 * Login request interface
 */
export interface LoginRequest {
  email: string;
  password: string;
  remember_me?: boolean;
}

/**
 * Registration request interface
 */
export interface RegisterRequest {
  business_name: string;
  owner_name: string;
  email_address: string;
  phone_number?: string;
  password: string;
  confirm_password: string;
}

/**
 * Authentication response interface
 */
export interface AuthResponse {
  user: Omit<User, 'password'>;
  token: string;
  refresh_token: string;
  expires_in: string;
}

/**
 * Token refresh request interface
 */
export interface RefreshTokenRequest {
  refresh_token: string;
}

/**
 * Password reset request interface
 */
export interface PasswordResetRequest {
  email: string;
}

/**
 * Password change request interface
 */
export interface PasswordChangeRequest {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

// =====================================================
// EXTENDED REQUEST TYPES
// =====================================================

/**
 * Authenticated request interface
 * Extends Express Request with user information
 */
export interface AuthenticatedRequest extends Request {
  user?: {
    user_id: string;
    email: string;
    business_name: string;
    owner_name: string;
    role: 'admin' | 'worker';
  };
  worker?: {
    worker_id: string;
    email: string;
    full_name: string;
    permissions: string[];
  };
}

/**
 * File upload request interface
 */
export interface FileUploadRequest extends AuthenticatedRequest {
  file?: Express.Multer.File;
  files?: Express.Multer.File[];
}

// =====================================================
// QUERY PARAMETER TYPES
// =====================================================

/**
 * Product query parameters
 */
export interface ProductQueryParams {
  category_id?: string;
  selling_type?: 'boxed' | 'weight' | 'both';
  stock_status?: 'critical' | 'warning' | 'monitor';
  search?: string;
  page?: number;
  limit?: number;
  sort_by?: 'name' | 'price' | 'quantity' | 'created_at';
  sort_order?: 'ASC' | 'DESC';
}

/**
 * Sales query parameters
 */
export interface SalesQueryParams {
  product_id?: string;
  selling_method?: 'boxed' | 'weight';
  payment_status?: 'pending' | 'paid' | 'partial' | 'overdue';
  client_name?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
  sort_by?: 'date_time' | 'total_amount' | 'client_name';
  sort_order?: 'ASC' | 'DESC';
}

/**
 * Expense query parameters
 */
export interface ExpenseQueryParams {
  category_id?: string;
  status?: 'rejected' | 'pending' | 'paid';
  date_from?: string;
  date_to?: string;
  amount_min?: number;
  amount_max?: number;
  page?: number;
  limit?: number;
  sort_by?: 'date' | 'amount' | 'status';
  sort_order?: 'ASC' | 'DESC';
}

/**
 * Worker query parameters
 */
export interface WorkerQueryParams {
  search?: string;
  has_permissions?: boolean;
  page?: number;
  limit?: number;
  sort_by?: 'full_name' | 'email' | 'created_at' | 'monthly_salary';
  sort_order?: 'ASC' | 'DESC';
}

/**
 * Contact query parameters
 */
export interface ContactQueryParams {
  contact_type?: 'supplier' | 'customer';
  search?: string;
  page?: number;
  limit?: number;
  sort_by?: 'contact_name' | 'company_name' | 'contact_type';
  sort_order?: 'ASC' | 'DESC';
}

// =====================================================
// DASHBOARD AND ANALYTICS TYPES
// =====================================================

/**
 * Dashboard statistics interface
 */
export interface DashboardStats {
  total_products: number;
  low_stock_products: number;
  critical_stock_products: number;
  total_sales_today: number;
  total_sales_this_month: number;
  total_revenue_today: number;
  total_revenue_this_month: number;
  pending_expenses: number;
  total_workers: number;
  pending_tasks: number;
  recent_sales: any[];
  top_selling_products: any[];
  stock_alerts: any[];
}

/**
 * Sales analytics interface
 */
export interface SalesAnalytics {
  daily_sales: Array<{
    date: string;
    total_sales: number;
    total_revenue: number;
  }>;
  monthly_sales: Array<{
    month: string;
    total_sales: number;
    total_revenue: number;
  }>;
  product_performance: Array<{
    product_name: string;
    total_sold: number;
    total_revenue: number;
  }>;
  payment_status_breakdown: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
}

/**
 * Stock analytics interface
 */
export interface StockAnalytics {
  stock_levels: Array<{
    product_name: string;
    current_quantity: number;
    low_stock_threshold: number;
    status: string;
  }>;
  stock_movements: Array<{
    date: string;
    movement_type: string;
    quantity_change: number;
    product_name: string;
  }>;
  expiry_alerts: Array<{
    product_name: string;
    expiry_date: string;
    days_left: number;
  }>;
}

// =====================================================
// ERROR TYPES
// =====================================================

/**
 * API error interface
 */
export interface ApiError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
  path?: string;
}

/**
 * Validation error interface
 */
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

/**
 * Validation error response interface
 */
export interface ValidationErrorResponse {
  success: false;
  message: string;
  errors: ValidationError[];
  timestamp: Date;
}
