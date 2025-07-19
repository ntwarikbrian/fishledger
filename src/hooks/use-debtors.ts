/**
 * Hook for managing debtor data
 * Provides functionality to fetch and manage customers with outstanding payments
 */

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api/client';
import type { Debtor, DebtorFilters } from '@/types/transaction';

interface DebtorResponse {
  success: boolean;
  data: Debtor[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  message?: string;
}

interface UseDebtorsReturn {
  debtors: Debtor[];
  loading: boolean;
  error: string | null;
  pagination: DebtorResponse['pagination'] | null;
  filters: DebtorFilters;
  fetchDebtors: () => Promise<void>;
  searchDebtors: (searchTerm: string) => void;
  setFilters: (filters: Partial<DebtorFilters>) => void;
  clearFilters: () => void;
  refetch: () => Promise<void>;
}

const defaultFilters: DebtorFilters = {
  search: '',
  sortBy: 'remaining_amount',
  sortOrder: 'desc',
  page: 1,
  limit: 50,
};

export function useDebtors(): UseDebtorsReturn {
  const [debtors, setDebtors] = useState<Debtor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<DebtorResponse['pagination'] | null>(null);
  const [filters, setFiltersState] = useState<DebtorFilters>(defaultFilters);

  /**
   * Fetch debtors from the API
   */
  const fetchDebtors = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query parameters
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());

      console.log('🔍 Fetching debtors with filters:', filters);

      const response = await apiClient.get(`/api/transactions/debtors?${params.toString()}`);

      console.log('📊 Debtors API response:', {
        success: response.success,
        dataLength: Array.isArray(response.data) ? response.data.length : 'not array',
        pagination: response.pagination,
      });

      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch debtors');
      }

      setDebtors(response.data || []);
      setPagination(response.pagination || null);

    } catch (err) {
      console.error('❌ Error fetching debtors:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch debtors');
      setDebtors([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  /**
   * Search debtors by name, email, or phone
   */
  const searchDebtors = useCallback((searchTerm: string) => {
    setFiltersState(prev => ({
      ...prev,
      search: searchTerm,
      page: 1, // Reset to first page when searching
    }));
  }, []);

  /**
   * Update filters
   */
  const setFilters = useCallback((newFilters: Partial<DebtorFilters>) => {
    setFiltersState(prev => ({
      ...prev,
      ...newFilters,
    }));
  }, []);

  /**
   * Clear all filters
   */
  const clearFilters = useCallback(() => {
    setFiltersState(defaultFilters);
  }, []);

  /**
   * Refetch data (alias for fetchDebtors)
   */
  const refetch = useCallback(() => {
    return fetchDebtors();
  }, [fetchDebtors]);

  // Fetch debtors when filters change
  useEffect(() => {
    fetchDebtors();
  }, [fetchDebtors]);

  return {
    debtors,
    loading,
    error,
    pagination,
    filters,
    fetchDebtors,
    searchDebtors,
    setFilters,
    clearFilters,
    refetch,
  };
}
