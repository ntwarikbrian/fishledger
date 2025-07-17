/**
 * Deposits hook for managing deposit operations
 * Provides functions for CRUD operations on deposits
 */

import { useState, useCallback } from 'react';
import { toast } from 'sonner';

// Deposit interface matching backend response
export interface Deposit {
  deposit_id: string;
  date_time: string;
  amount: number;
  deposit_type: 'momo' | 'bank' | 'boss';
  account_name: string;
  account_number: string | null;
  to_recipient: string | null; // For boss type deposits, specifies who (boss, manager, etc.)
  deposit_image_url: string | null;
  approval: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
  created_by: string;
}

// Create deposit request interface
export interface CreateDepositRequest {
  amount: number;
  deposit_type: 'momo' | 'bank' | 'boss';
  account_name: string;
  account_number?: string;
  to_recipient?: string; // For boss type deposits
}

// Update deposit request interface
export interface UpdateDepositRequest {
  amount?: number;
  deposit_type?: 'momo' | 'bank' | 'boss';
  account_name?: string;
  account_number?: string;
  to_recipient?: string; // For boss type deposits
  approval?: 'pending' | 'approved' | 'rejected';
}

// Create deposit with image request interface
export interface CreateDepositWithImageRequest extends CreateDepositRequest {
  image?: File;
}

// Deposit filters interface
export interface DepositFilters {
  search?: string;
  deposit_type?: 'momo' | 'bank' | 'boss';
  page?: number;
  limit?: number;
}

// Deposit statistics interface
export interface DepositStats {
  totalDeposits: number;
  totalAmount: number;
  depositsByType: Record<string, number>;
  amountByType: Record<string, number>;
  depositsByApproval: Record<string, number>;
}

// API response interfaces
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  timestamp: string;
  requestId: string;
}

interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export const useDeposits = () => {
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [stats, setStats] = useState<DepositStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get API base URL - match the pattern used by other services
  const getApiUrl = () => {
    const apiMode = import.meta.env.VITE_API_MODE || 'workers';
    const apiUrl = import.meta.env.VITE_API_URL;

    if (apiUrl) {
      // If explicit URL is provided, use it
      return apiMode === 'workers' ? `${apiUrl}/api` : `${apiUrl}/api`;
    }

    // Default URLs based on mode
    const isProduction = import.meta.env.VITE_NODE_ENV === 'production' || import.meta.env.NODE_ENV === 'production';

    const finalUrl = apiMode === 'workers'
      ? (isProduction
          ? 'https://local-fishing-backend.your-username.workers.dev/api'
          : 'http://localhost:8787/api')
      : (isProduction
          ? 'https://your-production-api.com/api'
          : 'http://localhost:5004/api');

    console.log('🌐 API URL determined:', finalUrl);
    return finalUrl;
  };

  // Get auth token
  const getAuthToken = () => {
    return localStorage.getItem('auth_token');
  };

  // Fetch deposits with filters
  const fetchDeposits = useCallback(async (filters: DepositFilters = {}) => {
    console.log('🔄 Fetching deposits with filters:', filters);
    setLoading(true);
    setError(null);

    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const queryParams = new URLSearchParams();
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.deposit_type) queryParams.append('deposit_type', filters.deposit_type);
      if (filters.page) queryParams.append('page', filters.page.toString());
      if (filters.limit) queryParams.append('limit', filters.limit.toString());

      const apiUrl = `${getApiUrl()}/deposits?${queryParams}`;
      console.log('📡 Fetching from URL:', apiUrl);
      console.log('🔑 Using token:', token.substring(0, 20) + '...');

      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('📊 Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ API Error:', errorData);
        throw new Error(errorData.error || 'Failed to fetch deposits');
      }

      const data: PaginatedResponse<Deposit> = await response.json();
      console.log('✅ Deposits API response:', data);
      console.log('📋 Deposits data:', data.data);
      console.log('📊 Data type:', typeof data.data, 'Is array:', Array.isArray(data.data));

      // Validate response structure
      if (!data.success) {
        throw new Error('API returned unsuccessful response');
      }

      if (!Array.isArray(data.data)) {
        console.warn('⚠️ API returned non-array data:', data.data);
        setDeposits([]);
        return data;
      }

      setDeposits(data.data);
      return data;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch deposits';
      setError(errorMessage);
      setDeposits([]); // Ensure deposits is always an array
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch deposit statistics
  const fetchStats = useCallback(async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${getApiUrl()}/deposits/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch deposit statistics');
      }

      const data: ApiResponse<DepositStats> = await response.json();
      setStats(data.data);
      return data.data;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch deposit statistics';
      console.error('Fetch stats error:', errorMessage);
      // Don't show toast for stats errors as they're not critical
      throw err;
    }
  }, []);

  // Create deposit
  const createDeposit = useCallback(async (depositData: CreateDepositRequest) => {
    setLoading(true);
    setError(null);

    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${getApiUrl()}/deposits`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(depositData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create deposit');
      }

      const data: ApiResponse<Deposit> = await response.json();
      
      // Add new deposit to the list
      setDeposits(prev => [data.data, ...(Array.isArray(prev) ? prev : [])]);
      
      toast.success('Deposit created successfully');
      return data.data;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create deposit';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create deposit with image
  const createDepositWithImage = useCallback(async (depositData: CreateDepositWithImageRequest) => {
    setLoading(true);
    setError(null);

    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const formData = new FormData();
      formData.append('amount', depositData.amount.toString());
      formData.append('deposit_type', depositData.deposit_type);
      formData.append('account_name', depositData.account_name);
      if (depositData.account_number) formData.append('account_number', depositData.account_number);
      if (depositData.to_recipient) formData.append('to_recipient', depositData.to_recipient);
      if (depositData.image) formData.append('image', depositData.image);

      const response = await fetch(`${getApiUrl()}/deposits/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create deposit');
      }

      const data: ApiResponse<Deposit> = await response.json();

      // Add new deposit to the list and refresh to ensure consistency
      setDeposits(prev => [data.data, ...(Array.isArray(prev) ? prev : [])]);

      // Automatically refresh the deposits list to ensure data consistency
      setTimeout(() => {
        fetchDeposits();
      }, 100);

      toast.success('Deposit created successfully');
      return data.data;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create deposit';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchDeposits]);

  // Get single deposit
  const getDeposit = useCallback(async (id: string) => {
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${getApiUrl()}/deposits/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch deposit');
      }

      const data: ApiResponse<Deposit> = await response.json();
      return data.data;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch deposit';
      toast.error(errorMessage);
      throw err;
    }
  }, []);

  // Update deposit
  const updateDeposit = useCallback(async (id: string, updateData: UpdateDepositRequest) => {
    setLoading(true);
    setError(null);

    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${getApiUrl()}/deposits/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update deposit');
      }

      const data: ApiResponse<Deposit> = await response.json();

      // Update deposit in the list
      setDeposits(prev => (Array.isArray(prev) ? prev : []).map(deposit =>
        deposit.deposit_id === id ? data.data : deposit
      ));

      toast.success('Deposit updated successfully');
      return data.data;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update deposit';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete deposit
  const deleteDeposit = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${getApiUrl()}/deposits/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete deposit');
      }

      const data: ApiResponse<Deposit> = await response.json();

      // Remove deposit from the list and refresh to ensure consistency
      setDeposits(prev => (Array.isArray(prev) ? prev : []).filter(deposit => deposit.deposit_id !== id));

      // Automatically refresh the deposits list to ensure data consistency
      setTimeout(() => {
        fetchDeposits();
      }, 100);

      toast.success('Deposit deleted successfully');
      return data.data;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete deposit';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchDeposits]);

  return {
    deposits,
    stats,
    loading,
    error,
    fetchDeposits,
    fetchStats,
    createDeposit,
    createDepositWithImage,
    updateDeposit,
    deleteDeposit,
    getDeposit,
  };
};
