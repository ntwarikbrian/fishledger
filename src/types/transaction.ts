/**
 * Transaction types for comprehensive transaction management
 * Matches the database schema exactly for type safety
 */

// Base transaction interface matching database schema
export interface Transaction {
  transaction_id: string;
  sale_id: string;
  date_time: string;
  product_name: string;
  client_name: string;
  boxes_quantity: number;
  kg_quantity: number;
  total_amount: number;
  payment_status: 'paid' | 'pending' | 'partial';
  payment_method: 'momo_pay' | 'cash' | 'bank_transfer' | null;
  deposit_id: string | null;
  deposit_type: 'momo' | 'bank' | 'boss' | null;
  account_number: string | null;
  reference: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
  created_by: string; // Required field in main.sql
  updated_by: string | null;
}

// Extended transaction with related data for detailed views
export interface TransactionWithDetails extends Transaction {
  sales?: {
    id: string;
    product_id: string;
    amount_paid?: number;
    remaining_amount?: number;
    products?: {
      product_id: string;
      name: string;
      category_id: string;
      product_categories?: {
        category_id: string;
        name: string;
      };
    };
  };
  users?: {
    user_id: string;
    owner_name: string;
    business_name: string;
  };
}

// Create transaction request interface
export interface CreateTransactionRequest {
  sale_id: string;
  date_time: string;
  product_name: string;
  client_name: string;
  boxes_quantity?: number;
  kg_quantity?: number;
  total_amount: number;
  payment_status?: 'paid' | 'pending' | 'partial';
  payment_method?: 'momo_pay' | 'cash' | 'bank_transfer' | null;
  deposit_id?: string | null;
  deposit_type?: 'momo' | 'bank' | 'boss' | null;
  account_number?: string | null;
  reference?: string | null;
  image_url?: string | null;
}

// Update transaction request interface
export interface UpdateTransactionRequest {
  date_time?: string;
  product_name?: string;
  client_name?: string;
  boxes_quantity?: number;
  kg_quantity?: number;
  total_amount?: number;
  payment_status?: 'paid' | 'pending' | 'partial';
  payment_method?: 'momo_pay' | 'cash' | 'bank_transfer' | null;
  deposit_id?: string | null;
  deposit_type?: 'momo' | 'bank' | 'boss' | null;
  account_number?: string | null;
  reference?: string | null;
  image_url?: string | null;
}

// Transaction filters for search and filtering
export interface TransactionFilters {
  payment_status?: 'paid' | 'pending' | 'partial';
  payment_method?: 'momo_pay' | 'cash' | 'bank_transfer';
  deposit_type?: 'momo' | 'bank' | 'boss';
  client_name?: string;
  product_name?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}

// Transaction statistics interface
export interface TransactionStats {
  total_transactions: number;
  total_amount: number;
  paid_transactions: number;
  pending_transactions: number;
  partial_transactions: number;
  paid_amount: number;
  pending_amount: number;
  partial_amount: number;
  payment_methods: {
    momo_pay: number;
    cash: number;
    bank_transfer: number;
  };
  payment_method_amounts: {
    momo_pay: number;
    cash: number;
    bank_transfer: number;
  };
}

// Pagination interface for transaction lists
export interface TransactionPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// API response interfaces
export interface TransactionResponse {
  success: boolean;
  data?: Transaction;
  message?: string;
  error?: string;
  timestamp: string;
  requestId: string;
}

export interface TransactionsResponse {
  success: boolean;
  data?: Transaction[];
  pagination?: TransactionPagination;
  message?: string;
  error?: string;
  timestamp: string;
  requestId: string;
}

export interface TransactionStatsResponse {
  success: boolean;
  data?: TransactionStats;
  message?: string;
  error?: string;
  timestamp: string;
  requestId: string;
}

// Form data interfaces for UI components
export interface TransactionFormData {
  sale_id: string;
  date_time: string;
  product_name: string;
  client_name: string;
  boxes_quantity: number;
  kg_quantity: number;
  total_amount: number;
  payment_status: 'paid' | 'pending' | 'partial';
  payment_method: 'momo_pay' | 'cash' | 'bank_transfer' | '';
  deposit_id: string;
  deposit_type: 'momo' | 'bank' | 'boss' | '';
  account_number: string;
  reference: string;
  image_url: string;
}

// Payment method options for UI
export const PAYMENT_METHODS = [
  { value: 'momo_pay', label: 'Mobile Money' },
  { value: 'cash', label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
] as const;

// Payment status options for UI
export const PAYMENT_STATUSES = [
  { value: 'paid', label: 'Paid' },
  { value: 'pending', label: 'Pending' },
  { value: 'partial', label: 'Partial' },
] as const;

// Deposit type options for UI
export const DEPOSIT_TYPES = [
  { value: 'momo', label: 'Mobile Money' },
  { value: 'bank', label: 'Bank' },
  { value: 'boss', label: 'Boss' },
] as const;

// Debtor interface for customers with outstanding payments
export interface Debtor {
  clientName: string;
  email: string | null;
  phone: string | null;
  totalOwed: number;
  totalAmount: number;
  totalPaid: number;
  salesCount: number;
  lastSaleDate: string;
  sales: Array<{
    id: string;
    total_amount: number;
    amount_paid: number;
    remaining_amount: number;
    payment_status: 'pending' | 'partial';
    payment_method: string | null;
    date_time: string;
    products?: {
      name: string;
      category_id: string;
      product_categories?: {
        name: string;
      };
    };
  }>;
}

// Debtor filters interface
export interface DebtorFilters {
  search?: string;
  sortBy?: 'client_name' | 'remaining_amount' | 'total_amount' | 'date_time';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// Utility type for payment method values
export type PaymentMethod = typeof PAYMENT_METHODS[number]['value'];

// Utility type for payment status values
export type PaymentStatus = typeof PAYMENT_STATUSES[number]['value'];

// Utility type for deposit type values
export type DepositType = typeof DEPOSIT_TYPES[number]['value'];

// Transaction table column configuration for UI tables
export interface TransactionTableColumn {
  key: keyof Transaction | 'actions';
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
}

// Default transaction form values
export const DEFAULT_TRANSACTION_FORM: TransactionFormData = {
  sale_id: '',
  date_time: new Date().toISOString(),
  product_name: '',
  client_name: '',
  boxes_quantity: 0,
  kg_quantity: 0,
  total_amount: 0,
  payment_status: 'pending',
  payment_method: '',
  deposit_id: '',
  deposit_type: '',
  account_number: '',
  reference: '',
  image_url: '',
};
