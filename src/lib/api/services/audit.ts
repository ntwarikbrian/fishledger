/**
 * Audit API Service
 * Handles sales audit trail operations including approval/rejection
 */

import { apiClient } from '../client';
import type { ApiResponse } from '../types';

// =====================================================
// AUDIT TYPES
// =====================================================

export interface AuditRecord {
  audit_id: string;
  timestamp: string;
  sale_id: string | null; // Can be null for deleted sales
  audit_type: 'quantity_change' | 'payment_method_change' | 'deletion';
  boxes_change: number;
  kg_change: number;
  reason: string;
  performed_by: string;
  approval_status: 'pending' | 'approved' | 'rejected';
  approved_by?: string;
  approval_timestamp?: string;
  approval_reason?: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  created_at: string;
  updated_at: string;
  // Related data
  sales?: {
    id: string;
    total_amount: number;
    payment_status: string;
    products?: {
      name: string;
      product_categories?: {
        name: string;
      };
    };
  };
  users?: {
    owner_name: string;
  };
  approver?: {
    owner_name: string;
  };
  // Enriched data from backend (added by getAuditsHandler)
  performed_by_user?: {
    owner_name: string;
  };
  approved_by_user?: {
    owner_name: string;
  };
  product_info?: {
    product_id: string;
    name: string;
  };
  sale_info?: {
    id: string;
    client_name: string;
    total_amount: number;
    payment_status: string;
    deleted: boolean;
  };
}

export interface AuditFilters {
  page?: number;
  limit?: number;
  sale_id?: string;
  audit_type?: 'quantity_change' | 'payment_method_change' | 'deletion';
  approval_status?: 'pending' | 'approved' | 'rejected';
}

export interface CreateAuditRequest {
  sale_id: string;
  audit_type: 'quantity_change' | 'payment_method_change' | 'deletion';
  boxes_change?: number;
  kg_change?: number;
  reason: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
}

export interface ApprovalRequest {
  approval_reason: string;
}

export interface AuditListResponse {
  data: AuditRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Backend response type (PaginatedResponse)
export interface AuditPaginatedResponse {
  success: boolean;
  data: AuditRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  timestamp: string;
  requestId: string;
}

// =====================================================
// AUDIT SERVICE CLASS
// =====================================================

/**
 * Audit Service Class
 * Provides methods for audit trail operations
 */
class AuditService {
  
  /**
   * Get audit records with pagination and filtering
   */
  async getAudits(filters: AuditFilters = {}): Promise<AuditPaginatedResponse> {
    try {
      const queryParams = new URLSearchParams();

      if (filters.page) queryParams.append('page', filters.page.toString());
      if (filters.limit) queryParams.append('limit', filters.limit.toString());
      if (filters.sale_id) queryParams.append('sale_id', filters.sale_id);
      if (filters.audit_type) queryParams.append('audit_type', filters.audit_type);
      if (filters.approval_status) queryParams.append('approval_status', filters.approval_status);

      const endpoint = `/api/sales-audit${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      console.log('Fetching audit records from:', endpoint); // Debug log

      const response = await apiClient.get(endpoint);
      console.log('Audit service response:', response); // Debug log

      return response as any;
    } catch (error) {
      console.error('Error in audit service:', error);
      // Log more details about the error
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      throw error;
    }
  }

  /**
   * Create a new audit record
   */
  async createAudit(auditData: CreateAuditRequest): Promise<ApiResponse<AuditRecord>> {
    try {
      return await apiClient.post<AuditRecord>('/api/sales-audit', auditData);
    } catch (error) {
      console.error('Error creating audit record:', error);
      throw error;
    }
  }

  /**
   * Approve an audit record
   */
  async approveAudit(auditId: string, approvalData: ApprovalRequest): Promise<ApiResponse<AuditRecord>> {
    try {
      return await apiClient.put<AuditRecord>(`/api/sales-audit/${auditId}/approve`, approvalData);
    } catch (error) {
      console.error('Error approving audit record:', error);
      throw error;
    }
  }

  /**
   * Reject an audit record
   */
  async rejectAudit(auditId: string, rejectionData: ApprovalRequest): Promise<ApiResponse<AuditRecord>> {
    try {
      return await apiClient.put<AuditRecord>(`/api/sales-audit/${auditId}/reject`, rejectionData);
    } catch (error) {
      console.error('Error rejecting audit record:', error);
      throw error;
    }
  }

  /**
   * Get audit records for a specific sale
   */
  async getSaleAudits(saleId: string): Promise<AuditPaginatedResponse> {
    try {
      return await this.getAudits({ sale_id: saleId });
    } catch (error) {
      console.error('Error fetching sale audit records:', error);
      throw error;
    }
  }

  /**
   * Get pending audit records
   */
  async getPendingAudits(page: number = 1, limit: number = 20): Promise<AuditPaginatedResponse> {
    try {
      return await this.getAudits({
        approval_status: 'pending',
        page,
        limit
      });
    } catch (error) {
      console.error('Error fetching pending audit records:', error);
      throw error;
    }
  }

  /**
   * Validate audit approval/rejection request
   */
  validateApprovalRequest(data: ApprovalRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.approval_reason || data.approval_reason.trim().length === 0) {
      errors.push('Approval reason is required');
    }

    if (data.approval_reason && data.approval_reason.length > 500) {
      errors.push('Approval reason must be less than 500 characters');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Create and export service instance
export const auditService = new AuditService();

// Export service class for potential extension
export { AuditService };

// Default export
export default auditService;
