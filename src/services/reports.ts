/**
 * Reports Service
 * Handles API calls for report generation and management
 */

import { apiConfig } from '@/config/api';

export type ReportType = 'general' | 'sales' | 'top-selling' | 'debtor-credit' | 'profit-loss';

export interface ReportFilters {
  dateFrom?: string;
  dateTo?: string;
  categoryId?: string;
  lowStockOnly?: boolean;
  paymentMethod?: 'momo_pay' | 'cash' | 'bank_transfer';
  paymentStatus?: 'paid' | 'pending' | 'partial';
  type?: 'sale' | 'expense' | 'deposit';
}

export interface ReportInfo {
  type: string;
  endpoint: string;
  description: string;
  parameters: string[];
}

export interface ReportsListResponse {
  success: boolean;
  message: string;
  timestamp: string;
  requestId: string;
  data: {
    reports: ReportInfo[];
    notes: string[];
  };
}

/**
 * Get authentication headers for API requests
 */
const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };
};

/**
 * Build query string from filters
 */
const buildQueryString = (filters: ReportFilters): string => {
  const params = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, value.toString());
    }
  });
  
  return params.toString();
};

/**
 * Get list of available reports
 */
export const getAvailableReports = async (): Promise<ReportsListResponse> => {
  try {
    const response = await fetch(`${apiConfig.baseUrl}${apiConfig.endpoints.reports.list}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching available reports:', error);
    throw new Error('Failed to fetch available reports');
  }
};

/**
 * Check reports service health
 */
export const checkReportsHealth = async (): Promise<any> => {
  try {
    const response = await fetch(`${apiConfig.baseUrl}${apiConfig.endpoints.reports.health}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error checking reports health:', error);
    throw new Error('Failed to check reports service health');
  }
};

/**
 * Download a report as PDF
 */
export const downloadReport = async (
  reportType: ReportType,
  filters: ReportFilters = {},
  filename?: string
): Promise<void> => {
  try {
    // Get the appropriate endpoint
    const endpoint = apiConfig.endpoints.reports[reportType];
    if (!endpoint) {
      throw new Error(`Unknown report type: ${reportType}`);
    }

    // Build query string
    const queryString = buildQueryString(filters);
    const url = `${apiConfig.baseUrl}${endpoint}${queryString ? `?${queryString}` : ''}`;

    // Make the request
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      // Try to get error message from response
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch {
        // If response is not JSON, use status text
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    // Get the PDF blob
    const blob = await response.blob();
    
    // Create download link
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    
    // Set filename
    const defaultFilename = `${reportType}-report-${new Date().toISOString().split('T')[0]}.pdf`;
    link.download = filename || defaultFilename;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
    
  } catch (error) {
    console.error(`Error downloading ${reportType} report:`, error);
    throw error;
  }
};

/**
 * View a report in a new tab/window
 */
export const viewReport = async (
  reportType: ReportType,
  filters: ReportFilters = {}
): Promise<void> => {
  try {
    // Get the appropriate endpoint
    const endpoint = apiConfig.endpoints.reports[reportType];
    if (!endpoint) {
      throw new Error(`Unknown report type: ${reportType}`);
    }

    // Build query string
    const queryString = buildQueryString(filters);
    const url = `${apiConfig.baseUrl}${endpoint}${queryString ? `?${queryString}` : ''}`;

    // Make the request
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      // Try to get error message from response
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch {
        // If response is not JSON, use status text
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    // Get the PDF blob
    const blob = await response.blob();
    
    // Create blob URL and open in new tab
    const blobUrl = window.URL.createObjectURL(blob);
    const newWindow = window.open(blobUrl, '_blank');
    
    if (!newWindow) {
      // If popup was blocked, fallback to download
      throw new Error('Popup blocked. Please allow popups for this site or use download instead.');
    }
    
    // Cleanup URL after a delay to allow the browser to load it
    setTimeout(() => {
      window.URL.revokeObjectURL(blobUrl);
    }, 1000);
    
  } catch (error) {
    console.error(`Error viewing ${reportType} report:`, error);
    throw error;
  }
};

/**
 * Get PDF URL for viewing in popup
 */
export const getPDFUrl = (
  reportType: ReportType,
  filters: ReportFilters = {},
  download: boolean = false
): string => {
  // Get the appropriate endpoint
  const endpoint = apiConfig.endpoints.reports[reportType];
  if (!endpoint) {
    throw new Error(`Unknown report type: ${reportType}`);
  }

  // Add download parameter if needed
  const allFilters = download ? { ...filters, download: 'true' } : filters;

  // Build query string
  const queryString = buildQueryString(allFilters);
  return `${apiConfig.baseUrl}${endpoint}${queryString ? `?${queryString}` : ''}`;
};

/**
 * View report in popup container
 */
export const viewReportInPopup = (
  reportType: ReportType,
  filters: ReportFilters = {}
): string => {
  return getPDFUrl(reportType, filters, false);
};

/**
 * Get download URL for report
 */
export const getDownloadUrl = (
  reportType: ReportType,
  filters: ReportFilters = {}
): string => {
  return getPDFUrl(reportType, filters, true);
};

/**
 * Generate stock report
 */
export const generateStockReport = async (filters: ReportFilters = {}) => {
  return downloadReport('stock', filters);
};

/**
 * Generate sales report
 */
export const generateSalesReport = async (filters: ReportFilters = {}) => {
  return downloadReport('sales', filters);
};

/**
 * Generate financial report
 */
export const generateFinancialReport = async (filters: ReportFilters = {}) => {
  // Financial reports require date range
  if (!filters.dateFrom || !filters.dateTo) {
    throw new Error('Financial reports require both dateFrom and dateTo parameters');
  }
  return downloadReport('financial', filters);
};

/**
 * Generate transaction report
 */
export const generateTransactionReport = async (filters: ReportFilters = {}) => {
  // Transaction reports require date range
  if (!filters.dateFrom || !filters.dateTo) {
    throw new Error('Transaction reports require both dateFrom and dateTo parameters');
  }
  return downloadReport('transactions', filters);
};

/**
 * Generate product report
 */
export const generateProductReport = async (filters: ReportFilters = {}) => {
  return downloadReport('products', filters);
};

/**
 * Generate customer report
 */
export const generateCustomerReport = async (filters: ReportFilters = {}) => {
  return downloadReport('customers', filters);
};

/**
 * View stock report
 */
export const viewStockReport = async (filters: ReportFilters = {}) => {
  return viewReport('stock', filters);
};

/**
 * View sales report
 */
export const viewSalesReport = async (filters: ReportFilters = {}) => {
  return viewReport('sales', filters);
};

/**
 * View financial report
 */
export const viewFinancialReport = async (filters: ReportFilters = {}) => {
  // Financial reports require date range
  if (!filters.dateFrom || !filters.dateTo) {
    throw new Error('Financial reports require both dateFrom and dateTo parameters');
  }
  return viewReport('financial', filters);
};

/**
 * View transaction report
 */
export const viewTransactionReport = async (filters: ReportFilters = {}) => {
  // Transaction reports require date range
  if (!filters.dateFrom || !filters.dateTo) {
    throw new Error('Transaction reports require both dateFrom and dateTo parameters');
  }
  return viewReport('transactions', filters);
};

/**
 * View product report
 */
export const viewProductReport = async (filters: ReportFilters = {}) => {
  return viewReport('products', filters);
};

/**
 * View customer report
 */
export const viewCustomerReport = async (filters: ReportFilters = {}) => {
  return viewReport('customers', filters);
};
