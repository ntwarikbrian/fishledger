/**
 * Custom hook for transaction management
 * Provides comprehensive transaction state management, API integration, and error handling
 * Updated: Removed stats functionality - stats are now calculated client-side
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { transactionService } from '@/lib/api/services/transactions';
import type {
  Transaction,
  TransactionWithDetails,
  CreateTransactionRequest,
  UpdateTransactionRequest,
  TransactionFilters,
  TransactionPagination,
} from '@/types/transaction';

/**
 * Debounce utility function that returns a Promise
 */
const useDebounce = <T extends (...args: any[]) => Promise<any>>(callback: T, delay: number) => {
  const timeoutRef = useRef<NodeJS.Timeout>();

  return useCallback((...args: Parameters<T>): Promise<void> => {
    return new Promise((resolve) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(async () => {
        try {
          await callback(...args);
          resolve();
        } catch (error) {
          console.error('Debounced function error:', error);
          resolve(); // Resolve even on error to prevent hanging promises
        }
      }, delay);
    });
  }, [callback, delay]);
};

interface UseTransactionsReturn {
  // Data state
  transactions: Transaction[];
  transaction: TransactionWithDetails | null;
  
  // Loading states
  loading: boolean;
  creating: boolean;
  updating: boolean;
  deleting: boolean;
  
  // Error state
  error: string | null;
  
  // Pagination
  pagination: TransactionPagination | null;
  
  // Filters
  filters: TransactionFilters;
  
  // Actions
  fetchTransactions: (page?: number, limit?: number) => Promise<void>;
  fetchTransaction: (id: string) => Promise<void>;

  createTransaction: (data: CreateTransactionRequest) => Promise<boolean>;
  updateTransaction: (id: string, data: UpdateTransactionRequest) => Promise<boolean>;
  deleteTransaction: (id: string) => Promise<boolean>;
  searchTransactions: (searchTerm: string) => Promise<void>;
  setFilters: (filters: Partial<TransactionFilters>) => void;
  clearFilters: () => void;
  refetch: () => Promise<void>;
}

/**
 * Hook for managing transactions with comprehensive state management
 */
export const useTransactions = (): UseTransactionsReturn => {
  // Data state
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transaction, setTransaction] = useState<TransactionWithDetails | null>(null);
  
  // Loading states
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  // Error state
  const [error, setError] = useState<string | null>(null);
  
  // Pagination
  const [pagination, setPagination] = useState<TransactionPagination | null>(null);
  
  // Filters
  const [filters, setFiltersState] = useState<TransactionFilters>({});

  /**
   * Fetch transactions with filtering and pagination
   */
  const fetchTransactions = useCallback(async (page: number = 1, limit: number = 10, customFilters?: TransactionFilters) => {
    setLoading(true);
    setError(null);

    try {
      const filtersToUse = customFilters || filters;
      const response = await transactionService.getTransactions(page, limit, filtersToUse);

      // Add proper null/undefined checks
      if (!response) {
        throw new Error('No response received from server');
      }

      if (response.success && response.data) {
        setTransactions(Array.isArray(response.data) ? response.data : []);
        setPagination(response.pagination || null);
      } else {
        // Handle error response
        const errorMessage = response.error || 'Failed to fetch transactions';
        setError(errorMessage);
        setTransactions([]);
        setPagination(null);
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch transactions';
      setError(errorMessage);
      setTransactions([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, []); // Remove filters dependency to prevent infinite re-renders

  /**
   * Fetch a single transaction by ID
   */
  const fetchTransaction = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await transactionService.getTransaction(id);
      
      if (response.success && response.data) {
        setTransaction(response.data as TransactionWithDetails);
      } else {
        throw new Error(response.error || 'Failed to fetch transaction');
      }
    } catch (err) {
      console.error('Error fetching transaction:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch transaction');
      setTransaction(null);
    } finally {
      setLoading(false);
    }
  }, []);



  /**
   * Create a new transaction
   */
  const createTransaction = useCallback(async (data: CreateTransactionRequest): Promise<boolean> => {
    setCreating(true);
    setError(null);
    
    try {
      const response = await transactionService.createTransaction(data);
      
      if (response.success) {
        // Refresh the transaction list
        await fetchTransactions(pagination?.page || 1, pagination?.limit || 10);
        return true;
      } else {
        throw new Error(response.error || 'Failed to create transaction');
      }
    } catch (err) {
      console.error('Error creating transaction:', err);
      setError(err instanceof Error ? err.message : 'Failed to create transaction');
      return false;
    } finally {
      setCreating(false);
    }
  }, [fetchTransactions, pagination]);

  /**
   * Update an existing transaction
   */
  const updateTransaction = useCallback(async (id: string, data: UpdateTransactionRequest): Promise<boolean> => {
    setUpdating(true);
    setError(null);
    
    try {
      const response = await transactionService.updateTransaction(id, data);
      
      if (response.success) {
        // Refresh the transaction list and current transaction if viewing details
        await fetchTransactions(pagination?.page || 1, pagination?.limit || 10);
        if (transaction?.transaction_id === id) {
          await fetchTransaction(id);
        }
        return true;
      } else {
        throw new Error(response.error || 'Failed to update transaction');
      }
    } catch (err) {
      console.error('Error updating transaction:', err);
      setError(err instanceof Error ? err.message : 'Failed to update transaction');
      return false;
    } finally {
      setUpdating(false);
    }
  }, [fetchTransactions, fetchTransaction, pagination, transaction]);

  /**
   * Delete a transaction
   */
  const deleteTransaction = useCallback(async (id: string): Promise<boolean> => {
    setDeleting(true);
    setError(null);
    
    try {
      const response = await transactionService.deleteTransaction(id);
      
      if (response.success) {
        // Refresh the transaction list
        await fetchTransactions(pagination?.page || 1, pagination?.limit || 10);
        // Clear current transaction if it was deleted
        if (transaction?.transaction_id === id) {
          setTransaction(null);
        }
        return true;
      } else {
        throw new Error(response.error || 'Failed to delete transaction');
      }
    } catch (err) {
      console.error('Error deleting transaction:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete transaction');
      return false;
    } finally {
      setDeleting(false);
    }
  }, [fetchTransactions, pagination, transaction]);

  /**
   * Search transactions (internal function)
   */
  const performSearch = useCallback(async (searchTerm: string) => {
    // Don't search if term is empty or too short
    if (!searchTerm || searchTerm.trim().length < 1) {
      // If search term is empty, fetch all transactions
      await fetchTransactions(1, pagination?.limit || 10, filters);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await transactionService.searchTransactions(
        searchTerm.trim(),
        filters,
        1, // Reset to first page for search
        pagination?.limit || 10
      );

      // Add proper null/undefined checks
      if (!response) {
        throw new Error('No response received from server');
      }

      if (response.success && response.data) {
        setTransactions(Array.isArray(response.data) ? response.data : []);
        setPagination(response.pagination || null);
      } else {
        // Handle error response
        const errorMessage = response.error || 'Failed to search transactions';
        setError(errorMessage);
        setTransactions([]);
        setPagination(null);
      }
    } catch (err) {
      console.error('Error searching transactions:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to search transactions';
      setError(errorMessage);
      setTransactions([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [filters, pagination?.limit, fetchTransactions]);

  /**
   * Debounced search transactions to prevent too many API calls
   */
  const searchTransactions = useDebounce(performSearch, 500);

  /**
   * Update filters and refetch data
   */
  const setFilters = useCallback((newFilters: Partial<TransactionFilters>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
  }, []);

  /**
   * Clear all filters
   */
  const clearFilters = useCallback(() => {
    setFiltersState({});
  }, []);

  /**
   * Refetch current data
   */
  const refetch = useCallback(async () => {
    await fetchTransactions(pagination?.page || 1, pagination?.limit || 10);
  }, [fetchTransactions, pagination]);

  // Fetch transactions when filters change
  useEffect(() => {
    fetchTransactions(1, pagination?.limit || 10, filters);
  }, [filters, fetchTransactions]); // Pass filters explicitly to avoid stale closure

  return {
    // Data state
    transactions,
    transaction,
    
    // Loading states
    loading,
    creating,
    updating,
    deleting,
    
    // Error state
    error,
    
    // Pagination
    pagination,
    
    // Filters
    filters,
    
    // Actions
    fetchTransactions,
    fetchTransaction,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    searchTransactions,
    setFilters,
    clearFilters,
    refetch,
  };
};
