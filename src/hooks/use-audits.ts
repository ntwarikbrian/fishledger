/**
 * Custom hook for managing audit data
 * Provides methods to fetch, filter, and manage sales audit records
 */

import { useState, useEffect, useCallback } from 'react';
import { auditService, type AuditRecord, type AuditFilters, type AuditPaginatedResponse } from '@/lib/api/services/audit';

interface UseAuditsReturn {
  audits: AuditRecord[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  } | null;
  filters: AuditFilters;
  setFilters: (filters: Partial<AuditFilters>) => void;
  refetch: () => Promise<void>;
  approveAudit: (auditId: string, reason: string) => Promise<boolean>;
  rejectAudit: (auditId: string, reason: string) => Promise<boolean>;
}

export const useAudits = (initialFilters: AuditFilters = {}): UseAuditsReturn => {
  const [audits, setAudits] = useState<AuditRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<UseAuditsReturn['pagination']>(null);
  const [filters, setFiltersState] = useState<AuditFilters>({
    page: 1,
    limit: 20,
    ...initialFilters,
  });

  // Fetch audit records
  const fetchAudits = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if user is authenticated
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Authentication required. Please log in.');
      }

      const response = await auditService.getAudits(filters);
      console.log('useAudits - Full response:', response); // Debug log
      console.log('useAudits - Response type:', typeof response); // Debug log
      console.log('useAudits - Response keys:', Object.keys(response || {})); // Debug log

      // Temporarily accept any response to debug the structure
      if (response && (response.success || response.data || Array.isArray(response))) {
        // Handle different response structures
        let auditsData = response.data || response;
        let paginationData = response.pagination;

        console.log('useAudits - Setting audits:', auditsData); // Debug log
        console.log('useAudits - Setting pagination:', paginationData); // Debug log

        setAudits(Array.isArray(auditsData) ? auditsData : []);
        setPagination(paginationData || null);
      } else {
        console.error('useAudits - Response not successful:', response); // Debug log
        throw new Error('Failed to fetch audit records: Response not successful');
      }
    } catch (err) {
      console.error('Error fetching audits:', err);
      if (err instanceof Error && err.message.includes('401')) {
        setError('Authentication failed. Please log in again.');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to fetch audit records');
      }
      setAudits([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Update filters
  const setFilters = useCallback((newFilters: Partial<AuditFilters>) => {
    setFiltersState(prev => ({
      ...prev,
      ...newFilters,
      // Reset to page 1 when filters change (except when explicitly setting page)
      page: newFilters.page !== undefined ? newFilters.page : 1,
    }));
  }, []);

  // Refetch data
  const refetch = useCallback(async () => {
    await fetchAudits();
  }, [fetchAudits]);

  // Approve audit record
  const approveAudit = useCallback(async (auditId: string, reason: string): Promise<boolean> => {
    try {
      const response = await auditService.approveAudit(auditId, { approval_reason: reason });
      
      if (response.success) {
        // Refresh the audit list to show updated status
        await refetch();
        return true;
      } else {
        throw new Error(response.error || 'Failed to approve audit record');
      }
    } catch (err) {
      console.error('Error approving audit:', err);
      setError(err instanceof Error ? err.message : 'Failed to approve audit record');
      return false;
    }
  }, [refetch]);

  // Reject audit record
  const rejectAudit = useCallback(async (auditId: string, reason: string): Promise<boolean> => {
    try {
      const response = await auditService.rejectAudit(auditId, { approval_reason: reason });
      
      if (response.success) {
        // Refresh the audit list to show updated status
        await refetch();
        return true;
      } else {
        throw new Error(response.error || 'Failed to reject audit record');
      }
    } catch (err) {
      console.error('Error rejecting audit:', err);
      setError(err instanceof Error ? err.message : 'Failed to reject audit record');
      return false;
    }
  }, [refetch]);

  // Fetch data when filters change
  useEffect(() => {
    fetchAudits();
  }, [fetchAudits]);

  return {
    audits,
    loading,
    error,
    pagination,
    filters,
    setFilters,
    refetch,
    approveAudit,
    rejectAudit,
  };
};

// Export types for convenience
export type { AuditRecord, AuditFilters };
