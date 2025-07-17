/**
 * Transaction API service
 * Provides comprehensive transaction management API operations
 */

import { apiClient } from '../client';
import type {
  Transaction,
  TransactionWithDetails,
  CreateTransactionRequest,
  UpdateTransactionRequest,
  TransactionFilters,
  TransactionStats,
  TransactionResponse,
  TransactionsResponse,
  TransactionStatsResponse,
  TransactionPagination,
} from '@/types/transaction';

/**
 * Transaction API service class
 * Handles all transaction-related API operations with proper error handling
 */
export class TransactionService {
  private readonly baseEndpoint = '/api/transactions';

  /**
   * Get all transactions with filtering, searching, and pagination
   */
  async getTransactions(
    page: number = 1,
    limit: number = 10,
    filters?: TransactionFilters
  ): Promise<TransactionsResponse> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      // Add filters to query parameters
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params.append(key, value.toString());
          }
        });
      }

      const response = await apiClient.get<{
        success: boolean;
        data: Transaction[];
        pagination: TransactionPagination;
        message?: string;
        timestamp: string;
        requestId: string;
      }>(`${this.baseEndpoint}?${params.toString()}`);

      // The API client returns the backend response directly
      // Add null/undefined checks for safety
      if (!response || typeof response !== 'object') {
        throw new Error('Invalid response format from server');
      }

      // Check if response is empty object (same issue as stats)
      if (Object.keys(response).length === 0) {
        console.error('❌ Empty response from backend for transactions - providing fallback');

        return {
          success: true,
          data: [],
          pagination: {
            page: page,
            limit: limit,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false,
          },
          message: 'No transaction data available (using fallback)',
          timestamp: new Date().toISOString(),
          requestId: 'fallback-response',
        };
      }

      const backendResponse = response as any;

      return {
        success: backendResponse.success || false,
        data: backendResponse.data || [],
        pagination: backendResponse.pagination || null,
        message: backendResponse.message,
        timestamp: backendResponse.timestamp || new Date().toISOString(),
        requestId: backendResponse.requestId || 'unknown',
      };
    } catch (error) {
      console.error('Error fetching transactions:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch transactions',
        timestamp: new Date().toISOString(),
        requestId: 'client-error',
      };
    }
  }

  /**
   * Get a single transaction by ID
   */
  async getTransaction(id: string): Promise<TransactionResponse> {
    try {
      const response = await apiClient.get<{
        success: boolean;
        data: TransactionWithDetails;
        message?: string;
        timestamp: string;
        requestId: string;
      }>(`${this.baseEndpoint}/${id}`);

      // Add null/undefined checks for safety
      if (!response || typeof response !== 'object') {
        throw new Error('Invalid response format from server');
      }

      const backendResponse = response as any;

      return {
        success: backendResponse.success || false,
        data: backendResponse.data || null,
        message: backendResponse.message,
        timestamp: backendResponse.timestamp || new Date().toISOString(),
        requestId: backendResponse.requestId || 'unknown',
      };
    } catch (error) {
      console.error('Error fetching transaction:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch transaction',
        timestamp: new Date().toISOString(),
        requestId: 'client-error',
      };
    }
  }

  /**
   * Create a new transaction
   */
  async createTransaction(data: CreateTransactionRequest): Promise<TransactionResponse> {
    try {
      const response = await apiClient.post<{
        success: boolean;
        data: Transaction;
        message?: string;
        timestamp: string;
        requestId: string;
      }>(this.baseEndpoint, data);

      // Add null/undefined checks for safety
      if (!response || typeof response !== 'object') {
        throw new Error('Invalid response format from server');
      }

      const backendResponse = response as any;

      return {
        success: backendResponse.success || false,
        data: backendResponse.data || null,
        message: backendResponse.message,
        timestamp: backendResponse.timestamp || new Date().toISOString(),
        requestId: backendResponse.requestId || 'unknown',
      };
    } catch (error) {
      console.error('Error creating transaction:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create transaction',
        timestamp: new Date().toISOString(),
        requestId: 'client-error',
      };
    }
  }

  /**
   * Update an existing transaction
   */
  async updateTransaction(id: string, data: UpdateTransactionRequest): Promise<TransactionResponse> {
    try {
      const response = await apiClient.put<{
        success: boolean;
        data: Transaction;
        message?: string;
        timestamp: string;
        requestId: string;
      }>(`${this.baseEndpoint}/${id}`, data);

      // Add null/undefined checks for safety
      if (!response || typeof response !== 'object') {
        throw new Error('Invalid response format from server');
      }

      const backendResponse = response as any;

      return {
        success: backendResponse.success || false,
        data: backendResponse.data || null,
        message: backendResponse.message,
        timestamp: backendResponse.timestamp || new Date().toISOString(),
        requestId: backendResponse.requestId || 'unknown',
      };
    } catch (error) {
      console.error('Error updating transaction:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update transaction',
        timestamp: new Date().toISOString(),
        requestId: 'client-error',
      };
    }
  }

  /**
   * Delete a transaction
   */
  async deleteTransaction(id: string): Promise<TransactionResponse> {
    try {
      const response = await apiClient.delete<{
        success: boolean;
        data: { transaction_id: string };
        message?: string;
        timestamp: string;
        requestId: string;
      }>(`${this.baseEndpoint}/${id}`);

      // Add null/undefined checks for safety
      if (!response || typeof response !== 'object') {
        throw new Error('Invalid response format from server');
      }

      const backendResponse = response as any;

      return {
        success: backendResponse.success || false,
        data: backendResponse.data as any || null,
        message: backendResponse.message,
        timestamp: backendResponse.timestamp || new Date().toISOString(),
        requestId: backendResponse.requestId || 'unknown',
      };
    } catch (error) {
      console.error('Error deleting transaction:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete transaction',
        timestamp: new Date().toISOString(),
        requestId: 'client-error',
      };
    }
  }

  /**
   * Get transaction statistics and summary
   */
  async getTransactionStats(dateFrom?: string, dateTo?: string): Promise<TransactionStatsResponse> {
    try {
      // Check authentication first
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Authentication required. Please log in to view transaction statistics.');
      }

      const params = new URLSearchParams();
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);

      const queryString = params.toString();
      const endpoint = `${this.baseEndpoint}/stats${queryString ? `?${queryString}` : ''}`;

      console.log('🔄 Fetching transaction stats from:', endpoint);

      // The API client returns the backend response directly
      const response = await apiClient.get<{
        success: boolean;
        data: TransactionStats;
        message?: string;
        timestamp: string;
        requestId: string;
      }>(endpoint);

      console.log('📊 Transaction stats response:', response);
      console.log('📊 Response type:', typeof response);
      console.log('📊 Response keys:', response ? Object.keys(response) : 'NO KEYS');

      // Check if response is empty object (the current issue)
      if (!response || (typeof response === 'object' && Object.keys(response).length === 0)) {
        console.error('❌ Empty response from backend - providing fallback stats');

        // Provide fallback empty stats instead of throwing error
        const fallbackStats: TransactionStats = {
          total_transactions: 0,
          total_amount: 0,
          paid_transactions: 0,
          pending_transactions: 0,
          partial_transactions: 0,
          paid_amount: 0,
          pending_amount: 0,
          partial_amount: 0,
          payment_methods: {
            momo_pay: 0,
            cash: 0,
            bank_transfer: 0,
          },
          payment_method_amounts: {
            momo_pay: 0,
            cash: 0,
            bank_transfer: 0,
          },
        };

        return {
          success: true,
          data: fallbackStats,
          message: 'No transaction data available (using fallback stats)',
          error: undefined,
          timestamp: new Date().toISOString(),
          requestId: 'fallback-response',
        };
      }

      // Handle successful response
      if (response && typeof response === 'object' && 'success' in response) {
        const backendResponse = response as any; // Type assertion for flexibility

        if (backendResponse.success && backendResponse.data) {
          return {
            success: backendResponse.success,
            data: backendResponse.data,
            message: backendResponse.message,
            error: undefined,
            timestamp: backendResponse.timestamp || new Date().toISOString(),
            requestId: backendResponse.requestId || 'unknown',
          };
        } else {
          // Backend returned success: false
          throw new Error(backendResponse.message || backendResponse.error || 'Backend returned unsuccessful response');
        }
      }

      // If we get here, the response format is unexpected
      console.error('❌ Unexpected response format:', response);
      throw new Error('Unexpected response format from server');
    } catch (error) {
      console.error('❌ Error fetching transaction stats:', error);

      // Handle specific error types
      let errorMessage = 'Failed to fetch transaction statistics';

      if (error instanceof Error) {
        if (error.message.includes('401') || error.message.includes('Unauthorized')) {
          errorMessage = 'Authentication failed. Please log in again.';
        } else if (error.message.includes('403') || error.message.includes('Forbidden')) {
          errorMessage = 'Access denied. You do not have permission to view transaction statistics.';
        } else if (error.message.includes('404')) {
          errorMessage = 'Transaction statistics endpoint not found.';
        } else if (error.message.includes('500')) {
          errorMessage = 'Server error while fetching transaction statistics. Please try again later.';
        } else {
          errorMessage = error.message;
        }
      }

      return {
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString(),
        requestId: 'client-error',
      };
    }
  }

  /**
   * Get transactions for a specific sale
   */
  async getTransactionsBySale(saleId: string): Promise<TransactionsResponse> {
    try {
      const response = await apiClient.get<{
        success: boolean;
        data: Transaction[];
        message?: string;
        timestamp: string;
        requestId: string;
      }>(`${this.baseEndpoint}/sale/${saleId}`);

      // Add null/undefined checks for safety
      if (!response || typeof response !== 'object') {
        throw new Error('Invalid response format from server');
      }

      const backendResponse = response as any;

      return {
        success: backendResponse.success || false,
        data: backendResponse.data || [],
        message: backendResponse.message,
        timestamp: backendResponse.timestamp || new Date().toISOString(),
        requestId: backendResponse.requestId || 'unknown',
      };
    } catch (error) {
      console.error('Error fetching sale transactions:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch sale transactions',
        timestamp: new Date().toISOString(),
        requestId: 'client-error',
      };
    }
  }

  /**
   * Search transactions with advanced filtering
   */
  async searchTransactions(
    searchTerm: string,
    filters?: Omit<TransactionFilters, 'search'>,
    page: number = 1,
    limit: number = 10
  ): Promise<TransactionsResponse> {
    const searchFilters: TransactionFilters = {
      ...filters,
      search: searchTerm,
    };

    return this.getTransactions(page, limit, searchFilters);
  }
}

// Export singleton instance
export const transactionService = new TransactionService();
