/**
 * API Service for Fish Management System
 * Handles all HTTP requests to the backend server
 */

// API Configuration
const API_BASE_URL = 'http://localhost:5004/api';

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
      user_id: string;
      business_name: string;
      owner_name: string;
      email_address: string;
      phone_number?: string;
      created_at: string;
      last_login?: string;
    };
    token: string;
    refresh_token: string;
    expires_in: string;
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
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
        throw new Error(data.error?.message || data.message || 'Request failed');
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
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
      const response = await apiClient.post<AuthResponse>('/auth/register', data);
      
      // Store user data and token on successful registration
      if (response.success && response.data) {
        apiClient.setToken(response.data.token);
        localStorage.setItem('user_data', JSON.stringify(response.data.user));
        localStorage.setItem('refresh_token', response.data.refresh_token);
      }
      
      return response;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Registration failed');
    }
  },

  // Login user
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/login', data);
      
      // Store user data and token on successful login
      if (response.success && response.data) {
        apiClient.setToken(response.data.token);
        localStorage.setItem('user_data', JSON.stringify(response.data.user));
        localStorage.setItem('refresh_token', response.data.refresh_token);
      }
      
      return response;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Login failed');
    }
  },

  // Worker login
  workerLogin: async (data: { email: string; password: string; business_name: string }): Promise<AuthResponse> => {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/worker-login', data);
      
      if (response.success && response.data) {
        apiClient.setToken(response.data.token);
        localStorage.setItem('user_data', JSON.stringify(response.data.user));
        localStorage.setItem('refresh_token', response.data.refresh_token);
      }
      
      return response;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Worker login failed');
    }
  },

  // Logout user
  logout: async (): Promise<void> => {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.warn('Logout request failed:', error);
    } finally {
      // Clear local storage regardless of API response
      apiClient.clearToken();
    }
  },

  // Get user profile
  getProfile: async (): Promise<AuthResponse> => {
    return apiClient.get<AuthResponse>('/auth/profile');
  },

  // Get existing users
  getExistingUsers: async (): Promise<any> => {
    return apiClient.get('/auth/existing-users');
  },

  // Refresh token
  refreshToken: async (): Promise<AuthResponse> => {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await apiClient.post<AuthResponse>('/auth/refresh', {
      refresh_token: refreshToken,
    });

    if (response.success && response.data) {
      apiClient.setToken(response.data.token);
      localStorage.setItem('refresh_token', response.data.refresh_token);
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

// Export the API client for other services
export { apiClient };
export default apiClient;
