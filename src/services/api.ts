/**
 * API Service for Fish Management System
 * Handles all HTTP requests to the backend server
 */

// API Configuration
const getApiBaseUrl = (): string => {
  const apiMode = import.meta.env.VITE_API_MODE || 'workers';
  const apiUrl = import.meta.env.VITE_API_URL;

  if (apiUrl) {
    // If explicit URL is provided, use it
    return apiMode === 'workers' ? apiUrl : `${apiUrl}/api`;
  }

  // Default URLs based on mode
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

// Types for API requests and responses
export interface LoginRequest {
  email: string;
  password: string;
  remember_me?: boolean;
}

export interface RegisterRequest {
  business_name: string;
  owner_name: string;
  email_address: string;
  phone_number?: string;
  password: string;
  confirm_password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user: {
      id: string;
      email: string;
      businessName: string;
      ownerName: string;
      phoneNumber?: string;
    };
    tokens: {
      accessToken: string;
      refreshToken: string;
      expiresIn: string;
    };
  };
  error?: string;
  timestamp: string;
  requestId?: string;
}

export interface ApiError {
  success: false;
  message: string;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}

// HTTP Client with error handling
class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.token = localStorage.getItem('auth_token');

    console.log('🔧 API Client initialized:', {
      baseURL: this.baseURL,
      hasToken: !!this.token,
      tokenPreview: this.token ? `${this.token.substring(0, 20)}...` : null
    });
  }

  // Set authentication token
  setToken(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  // Clear authentication token
  clearToken() {
    this.token = null;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
  }

  // Clear all authentication data (enhanced for debugging)
  clearAllAuthData() {
    this.token = null;
    // Clear all possible auth-related localStorage items
    const authKeys = [
      'auth_token',
      'refresh_token',
      'user_data',
      'userType',
      'userEmail',
      'businessName',
      'ownerName',
      'workerId'
    ];

    authKeys.forEach(key => {
      localStorage.removeItem(key);
    });

    console.log('🧹 Cleared all authentication data from localStorage');
  }

  // Make HTTP request with error handling
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        // Enhanced error handling for different status codes
        let errorMessage = data.error || data.message || 'Request failed';

        // Handle specific status codes with better error messages
        if (response.status === 409) {
          // Conflict - email/business name already exists
          errorMessage = data.error || 'Email or business name already exists';
        } else if (response.status === 429) {
          // Rate limiting
          errorMessage = data.error || 'Too many requests. Please try again later.';
        } else if (response.status === 400) {
          // Bad request - validation errors
          errorMessage = data.error || 'Invalid data provided';
        } else if (response.status === 401) {
          // Unauthorized
          errorMessage = data.error || 'Authentication required';
        } else if (response.status === 403) {
          // Forbidden
          errorMessage = data.error || 'Access denied';
        } else if (response.status >= 500) {
          // Server errors
          errorMessage = 'Server error. Please try again later.';
        }

        throw new Error(errorMessage);
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        // Check for authentication errors and clear auth data
        if (error.message.includes('User not found') ||
            error.message.includes('Invalid or expired token') ||
            error.message.includes('Authentication required')) {
          console.warn('🔄 Authentication error detected, clearing auth data...');
          this.clearAllAuthData();
          // Optionally redirect to login if not already there
          if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        }
        throw error;
      }
      throw new Error('Network error occurred');
    }
  }

  // GET request
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  // POST request
  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // PUT request
  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // DELETE request
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// Create API client instance
const apiClient = new ApiClient(API_BASE_URL);

// Authentication API
export const authAPI = {
  // Register new user
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    try {
      const response = await apiClient.post<AuthResponse>('/api/auth/register', data);

      // Store user data and token on successful registration
      if (response.success && response.data) {
        // Backend returns tokens in a nested tokens object
        const accessToken = response.data.tokens?.accessToken;
        const refreshToken = response.data.tokens?.refreshToken;

        console.log('🔐 Registration successful, storing tokens:', {
          hasAccessToken: !!accessToken,
          hasRefreshToken: !!refreshToken,
          user: response.data.user
        });

        if (accessToken) {
          apiClient.setToken(accessToken);
          localStorage.setItem('user_data', JSON.stringify(response.data.user));
        }

        if (refreshToken) {
          localStorage.setItem('refresh_token', refreshToken);
        }
      }

      return response;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Registration failed');
    }
  },

  // Login user
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    try {
      const response = await apiClient.post<AuthResponse>('/api/auth/login', data);

      // Store user data and token on successful login
      if (response.success && response.data) {
        // Backend returns tokens in a nested tokens object
        const accessToken = response.data.tokens?.accessToken;
        const refreshToken = response.data.tokens?.refreshToken;

        console.log('🔐 Login successful, storing tokens:', {
          hasAccessToken: !!accessToken,
          hasRefreshToken: !!refreshToken,
          user: response.data.user
        });

        if (accessToken) {
          apiClient.setToken(accessToken);
          localStorage.setItem('user_data', JSON.stringify(response.data.user));
        }

        if (refreshToken) {
          localStorage.setItem('refresh_token', refreshToken);
        }
      }

      return response;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Login failed');
    }
  },

  // Worker login
  workerLogin: async (data: { email: string; password: string; business_name: string }): Promise<AuthResponse> => {
    try {
      const response = await apiClient.post<AuthResponse>('/api/auth/worker-login', data);

      if (response.success && response.data) {
        const accessToken = response.data.tokens?.accessToken;
        const refreshToken = response.data.tokens?.refreshToken;

        if (accessToken) {
          apiClient.setToken(accessToken);
          localStorage.setItem('user_data', JSON.stringify(response.data.user));
        }

        if (refreshToken) {
          localStorage.setItem('refresh_token', refreshToken);
        }
      }

      return response;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Worker login failed');
    }
  },

  // Logout user
  logout: async (): Promise<void> => {
    try {
      await apiClient.post('/api/auth/logout');
    } catch (error) {
      console.warn('Logout request failed:', error);
    } finally {
      // Clear local storage regardless of API response
      apiClient.clearToken();
    }
  },

  // Get user profile
  getProfile: async (): Promise<{
    success: boolean;
    message: string;
    data?: {
      id: string;
      email: string;
      businessName: string;
      ownerName: string;
      phoneNumber?: string;
      createdAt: string;
      lastLogin?: string;
    };
    error?: string;
    timestamp: string;
    requestId?: string;
  }> => {
    return apiClient.get('/api/auth/profile');
  },

  // Update user profile
  updateProfile: async (data: any): Promise<AuthResponse> => {
    return apiClient.put<AuthResponse>('/api/auth/profile', data);
  },

  // Get existing users
  getExistingUsers: async (): Promise<any> => {
    return apiClient.get('/api/auth/existing-users');
  },

  // Refresh token
  refreshToken: async (): Promise<AuthResponse> => {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await apiClient.post<AuthResponse>('/api/auth/refresh', {
      refreshToken: refreshToken, // Backend expects 'refreshToken', not 'refresh_token'
    });

    if (response.success && response.data) {
      // Backend returns tokens in a nested tokens object
      const accessToken = response.data.tokens?.accessToken;
      const newRefreshToken = response.data.tokens?.refreshToken;

      if (accessToken) {
        apiClient.setToken(accessToken);
      }

      if (newRefreshToken) {
        localStorage.setItem('refresh_token', newRefreshToken);
      }
    }

    return response;
  },
};

// Health check API
export const healthAPI = {
  check: async (): Promise<any> => {
    return fetch('http://localhost:5004/health').then(res => res.json());
  },
};

// Transactions API types
export interface MarkAsPaidRequest {
  client_name: string;
  amount_paid: number;
  payment_method?: 'momo_pay' | 'cash' | 'bank_transfer';
  reference?: string;
}

export interface MarkAsPaidResponse {
  client_name: string;
  amount_paid: number;
  payment_method: string;
  reference?: string;
  updated_sales: number;
  updated_transactions: number;
  remaining_outstanding: number;
  sales_updated: Array<{
    sale_id: string;
    new_payment_status: string;
    amount_paid_to_sale: number;
    remaining_amount: number;
  }>;
}

export interface TransactionApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  timestamp: string;
  requestId?: string;
}

// Transactions API
export const transactionsAPI = {
  // Mark debtor as paid
  markAsPaid: async (request: MarkAsPaidRequest): Promise<TransactionApiResponse<MarkAsPaidResponse>> => {
    console.log('🔄 Calling mark as paid API with request:', request);
    try {
      const response = await apiClient.post<TransactionApiResponse<MarkAsPaidResponse>>('/api/transactions/mark-as-paid', request);
      console.log('✅ Mark as paid API response:', response);
      return response;
    } catch (error) {
      console.error('❌ Mark as paid API error:', error);
      throw error;
    }
  },
};

// Dashboard API types
export interface DashboardStats {
  totalRevenue: number;
  totalProfit: number;
  totalExpenses: number;
  productsInStock: number;
  lowStockItems: number;
  damagedItems: number;
  revenueGrowth: number;
  profitMargin: number;
}

export interface RevenueChartData {
  month: string;
  profit: number;
  invest: number;
  isCurrentMonth: boolean;
}

export interface FinancialOverviewData {
  name: string;
  value: number;
  amount: number;
  color: string;
  icon: string;
}

export interface DashboardApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  timestamp: string;
  requestId?: string;
}

// Dashboard API
export const dashboardAPI = {
  // Get comprehensive dashboard statistics
  getStats: async (): Promise<DashboardApiResponse<DashboardStats>> => {
    console.log('🔄 Calling dashboard stats API...');
    try {
      const response = await apiClient.get<DashboardApiResponse<DashboardStats>>('/api/dashboard/stats');
      console.log('✅ Dashboard stats API response:', response);
      return response;
    } catch (error) {
      console.error('❌ Dashboard stats API error:', error);
      throw error;
    }
  },

  // Get revenue chart data for different time periods
  getRevenueChart: async (period: 'week' | 'month' | '6months' = 'month'): Promise<DashboardApiResponse<RevenueChartData[]>> => {
    console.log('🔄 Calling revenue chart API with period:', period);
    try {
      const response = await apiClient.get<DashboardApiResponse<RevenueChartData[]>>(`/api/dashboard/revenue-chart?period=${period}`);
      console.log('✅ Revenue chart API response:', response);
      return response;
    } catch (error) {
      console.error('❌ Revenue chart API error:', error);
      throw error;
    }
  },

  // Get financial overview data for pie chart
  getFinancialOverview: async (): Promise<DashboardApiResponse<FinancialOverviewData[]>> => {
    console.log('🔄 Calling financial overview API...');
    try {
      const response = await apiClient.get<DashboardApiResponse<FinancialOverviewData[]>>('/api/dashboard/financial-overview');
      console.log('✅ Financial overview API response:', response);
      return response;
    } catch (error) {
      console.error('❌ Financial overview API error:', error);
      throw error;
    }
  },
};

// Export the API client for other services
export { apiClient };
export default apiClient;
