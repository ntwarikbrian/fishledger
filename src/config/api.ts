/**
 * API Configuration for Fish Management System
 * Handles switching between Cloudflare Workers and traditional Express server
 */

export type ApiMode = 'workers' | 'express';

export interface ApiConfig {
  mode: ApiMode;
  baseUrl: string;
  timeout: number;
  retries: number;
  endpoints: {
    health: string;
    auth: {
      login: string;
      register: string;
      workerLogin: string;
      refresh: string;
      profile: string;
      changePassword: string;
      logout: string;
    };
    products: {
      list: string;
      create: string;
      get: (id: string) => string;
      update: (id: string) => string;
      delete: (id: string) => string;
      lowStock: string;
    };
    sales: {
      list: string;
      create: string;
      createFish: string;
      get: (id: string) => string;
      update: (id: string) => string;
      delete: (id: string) => string;
    };
    categories: {
      list: string;
      create: string;
      get: (id: string) => string;
      update: (id: string) => string;
      delete: (id: string) => string;
    };
    contacts: {
      list: string;
      create: string;
      get: (id: string) => string;
      update: (id: string) => string;
      delete: (id: string) => string;
    };
    expenses: {
      list: string;
      create: string;
      get: (id: string) => string;
      update: (id: string) => string;
      delete: (id: string) => string;
    };
    folders: {
      list: string;
      create: string;
      get: (id: string) => string;
      update: (id: string) => string;
      delete: (id: string) => string;
    };
    files: {
      list: string;
      upload: string;
      get: (id: string) => string;
      update: (id: string) => string;
      delete: (id: string) => string;
    };
    dashboard: {
      stats: string;
    };
    reports: {
      list: string;
      health: string;
      general: string;
      sales: string;
      'top-selling': string;
      'debtor-credit': string;
      'profit-loss': string;
    };
    settings: {
      get: string;
      update: string;
    };
    transactions: {
      list: string;
      create: string;
      get: (id: string) => string;
      update: (id: string) => string;
      delete: (id: string) => string;
      stats: string;
      debtors: string;
      markAsPaid: string;
      bySale: (saleId: string) => string;
      upload: string;
    };
    workers: {
      list: string;
      create: string;
      get: (id: string) => string;
      update: (id: string) => string;
      delete: (id: string) => string;
      permissions: (id: string) => string;
      updatePermissions: (id: string) => string;
    };
  };
}

/**
 * Get API mode from environment variables
 */
export const getApiMode = (): ApiMode => {
  const mode = import.meta.env.VITE_API_MODE as ApiMode;
  return mode === 'express' ? 'express' : 'workers'; // Default to workers
};

/**
 * Get API base URL based on mode and environment
 */
export const getApiBaseUrl = (): string => {
  const mode = getApiMode();
  const customUrl = import.meta.env.VITE_API_URL;
  
  if (customUrl) {
    // If explicit URL is provided, use it
    return mode === 'workers' ? customUrl : `${customUrl}/api`;
  }
  
  // Default URLs based on mode and environment
  const isProduction = import.meta.env.VITE_NODE_ENV === 'production' || import.meta.env.NODE_ENV === 'production';

  if (mode === 'workers') {
    return isProduction
      ? 'https://local-fishing-backend.ntwaribrian262.workers.dev'
      : 'http://localhost:8787';
  } else {
    return isProduction
      ? 'https://your-production-api.com/api'
      : 'http://localhost:5004/api';
  }
};

/**
 * Create API configuration object
 */
export const createApiConfig = (): ApiConfig => {
  const mode = getApiMode();
  const baseUrl = getApiBaseUrl();
  
  return {
    mode,
    baseUrl,
    timeout: 30000, // 30 seconds
    retries: 3,
    endpoints: {
      health: '/health',
      auth: {
        login: '/api/auth/login',
        register: '/api/auth/register',
        workerLogin: '/api/auth/worker-login',
        refresh: '/api/auth/refresh',
        profile: '/api/auth/profile',
        changePassword: '/api/auth/change-password',
        logout: '/api/auth/logout',
      },
      products: {
        list: '/api/products',
        create: '/api/products',
        get: (id: string) => `/api/products/${id}`,
        update: (id: string) => `/api/products/${id}`,
        delete: (id: string) => `/api/products/${id}`,
        lowStock: '/api/products/low-stock',
      },
      sales: {
        list: '/api/sales',
        create: '/api/sales',
        createFish: '/api/sales/fish', // New fish sales algorithm endpoint
        get: (id: string) => `/api/sales/${id}`,
        update: (id: string) => `/api/sales/${id}`,
        delete: (id: string) => `/api/sales/${id}`,
      },
      categories: {
        list: '/api/categories',
        create: '/api/categories',
        get: (id: string) => `/api/categories/${id}`,
        update: (id: string) => `/api/categories/${id}`,
        delete: (id: string) => `/api/categories/${id}`,
      },
      contacts: {
        list: '/api/contacts',
        create: '/api/contacts',
        get: (id: string) => `/api/contacts/${id}`,
        update: (id: string) => `/api/contacts/${id}`,
        delete: (id: string) => `/api/contacts/${id}`,
      },
      expenses: {
        list: '/api/expenses',
        create: '/api/expenses',
        get: (id: string) => `/api/expenses/${id}`,
        update: (id: string) => `/api/expenses/${id}`,
        delete: (id: string) => `/api/expenses/${id}`,
      },
      folders: {
        list: '/api/folders',
        create: '/api/folders',
        get: (id: string) => `/api/folders/${id}`,
        update: (id: string) => `/api/folders/${id}`,
        delete: (id: string) => `/api/folders/${id}`,
      },
      files: {
        list: '/api/files',
        upload: '/api/files',
        get: (id: string) => `/api/files/${id}`,
        update: (id: string) => `/api/files/${id}`,
        delete: (id: string) => `/api/files/${id}`,
      },
      transactions: {
        list: '/api/transactions',
        create: '/api/transactions',
        get: (id: string) => `/api/transactions/${id}`,
        update: (id: string) => `/api/transactions/${id}`,
        delete: (id: string) => `/api/transactions/${id}`,
        stats: '/api/transactions/stats',
        debtors: '/api/transactions/debtors',
        markAsPaid: '/api/transactions/mark-as-paid',
        bySale: (saleId: string) => `/api/transactions/sale/${saleId}`,
        upload: '/api/transactions/upload',
      },
      dashboard: {
        stats: '/api/dashboard/stats',
      },
      reports: {
        list: '/api/reports',
        health: '/api/reports/health',
        general: '/api/reports/general/pdf',
        sales: '/api/reports/sales/pdf',
        'top-selling': '/api/reports/top-selling/pdf',
        'debtor-credit': '/api/reports/debtor-credit/pdf',
        'profit-loss': '/api/reports/profit-loss/pdf',
      },
      settings: {
        get: '/api/settings',
        update: '/api/settings',
      },
      workers: {
        list: '/api/workers',
        create: '/api/workers',
        get: (id: string) => `/api/workers/${id}`,
        update: (id: string) => `/api/workers/${id}`,
        delete: (id: string) => `/api/workers/${id}`,
        permissions: (id: string) => `/api/workers/${id}/permissions`,
        updatePermissions: (id: string) => `/api/workers/${id}/permissions`,
      },
    },
  };
};

/**
 * Default API configuration instance
 */
export const apiConfig = createApiConfig();

/**
 * Helper function to build full URL
 */
export const buildApiUrl = (endpoint: string): string => {
  const config = apiConfig;
  return `${config.baseUrl}${endpoint}`;
};

/**
 * Helper function to check if we're using Cloudflare Workers
 */
export const isUsingWorkers = (): boolean => {
  return getApiMode() === 'workers';
};

/**
 * Helper function to check if we're using Express server
 */
export const isUsingExpress = (): boolean => {
  return getApiMode() === 'express';
};

/**
 * Get API configuration info for debugging
 */
export const getApiInfo = () => {
  const config = apiConfig;
  return {
    mode: config.mode,
    baseUrl: config.baseUrl,
    environment: import.meta.env.NODE_ENV,
    customUrl: import.meta.env.VITE_API_URL,
    timeout: config.timeout,
    retries: config.retries,
  };
};

/**
 * Get API configuration - used by services to access API endpoints
 * @returns The API configuration object
 */
export const getApiConfig = (): ApiConfig => {
  return apiConfig;
};

/**
 * Log API configuration (for development)
 */
export const logApiConfig = (): void => {
  if (import.meta.env.NODE_ENV === 'development') {
    const info = getApiInfo();
    console.log('🔧 API Configuration:', info);
  }
};
