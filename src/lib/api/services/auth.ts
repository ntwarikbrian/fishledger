/**
 * Authentication API Service
 * Handles user authentication, registration, and session management
 */

import { apiClient } from '../client';
import type {
  LoginCredentials,
  RegisterData,
  AuthResponse,
  UserData,
  ApiResponse
} from '../types';

/**
 * Authentication API service
 */
export class AuthService {
  /**
   * User login
   */
  async login(credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> {
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
    
    // Store token if login successful
    if (response.success && response.data?.token) {
      localStorage.setItem('auth_token', response.data.token);
      if (response.data.refreshToken) {
        localStorage.setItem('refresh_token', response.data.refreshToken);
      }
    }
    
    return response;
  }

  /**
   * User registration
   */
  async register(userData: RegisterData): Promise<ApiResponse<AuthResponse>> {
    const response = await apiClient.post<AuthResponse>('/auth/register', userData);
    
    // Store token if registration successful
    if (response.success && response.data?.token) {
      localStorage.setItem('auth_token', response.data.token);
      if (response.data.refreshToken) {
        localStorage.setItem('refresh_token', response.data.refreshToken);
      }
    }
    
    return response;
  }

  /**
   * User logout
   */
  async logout(): Promise<ApiResponse<void>> {
    try {
      // Call logout endpoint if available
      await apiClient.post('/auth/logout');
    } catch (error) {
      // Continue with local logout even if server call fails
      console.warn('Server logout failed, continuing with local logout');
    } finally {
      // Always clear local storage
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
    }
    
    return { success: true };
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<ApiResponse<UserData>> {
    return apiClient.get<UserData>('/auth/me');
  }

  /**
   * Update user profile
   */
  async updateProfile(userData: Partial<UserData>): Promise<ApiResponse<UserData>> {
    return apiClient.patch<UserData>('/auth/profile', userData);
  }

  /**
   * Change password
   */
  async changePassword(data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<ApiResponse<void>> {
    return apiClient.post<void>('/auth/change-password', data);
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<ApiResponse<void>> {
    return apiClient.post<void>('/auth/forgot-password', { email });
  }

  /**
   * Reset password with token
   */
  async resetPassword(data: {
    token: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<ApiResponse<void>> {
    return apiClient.post<void>('/auth/reset-password', data);
  }

  /**
   * Refresh authentication token
   */
  async refreshToken(): Promise<ApiResponse<{ token: string; refreshToken?: string }>> {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await apiClient.post<{ token: string; refreshToken?: string }>(
      '/auth/refresh',
      { refreshToken }
    );

    // Update stored tokens
    if (response.success && response.data?.token) {
      localStorage.setItem('auth_token', response.data.token);
      if (response.data.refreshToken) {
        localStorage.setItem('refresh_token', response.data.refreshToken);
      }
    }

    return response;
  }

  /**
   * Verify email address
   */
  async verifyEmail(token: string): Promise<ApiResponse<void>> {
    return apiClient.post<void>('/auth/verify-email', { token });
  }

  /**
   * Resend email verification
   */
  async resendEmailVerification(): Promise<ApiResponse<void>> {
    return apiClient.post<void>('/auth/resend-verification');
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem('auth_token');
  }

  /**
   * Get stored auth token
   */
  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  /**
   * Clear all authentication data
   */
  clearAuth(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
  }
}

// Create and export service instance
export const authService = new AuthService();
