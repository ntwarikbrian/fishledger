/**
 * Worker Service
 * Handles API calls for worker management operations
 */

import { apiConfig } from '../config/api';



// Worker interfaces
export interface Worker {
  worker_id: string;
  full_name: string;
  email: string;
  phone_number?: string;
  id_card_front_url?: string;
  id_card_back_url?: string;
  password?: string; // Optional for frontend display (never send password to frontend)
  monthly_salary?: number;
  total_revenue_generated: number;
  recent_login_history?: any;
  created_at: string;
}

export interface CreateWorkerData {
  full_name: string;
  email: string;
  password: string;
  phone_number?: string;
  monthly_salary?: number;
  id_card_front: File;
  id_card_back: File;
}

export interface UpdateWorkerData {
  full_name?: string;
  email?: string;
  phone_number?: string;
  monthly_salary?: number;
}

export interface WorkerAuthData {
  email: string;
  password: string;
}

export interface WorkerAuthResponse {
  success: boolean;
  message?: string;
  worker?: Worker;
  error?: string;
}

export interface WorkerPermissions {
  [category: string]: {
    [permission: string]: boolean;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

/**
 * Get authentication headers
 */
function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('auth_token');
  return {
    'Authorization': token ? `Bearer ${token}` : '',
  };
}

/**
 * Create a new worker account
 */
export async function createWorker(workerData: CreateWorkerData): Promise<ApiResponse<Worker>> {
  try {
    const formData = new FormData();
    
    // Append text fields
    formData.append('full_name', workerData.full_name);
    formData.append('email', workerData.email);
    formData.append('password', workerData.password);
    
    if (workerData.phone_number) {
      formData.append('phone_number', workerData.phone_number);
    }
    
    if (workerData.monthly_salary) {
      formData.append('monthly_salary', workerData.monthly_salary.toString());
    }
    
    // Append files
    formData.append('id_card_front', workerData.id_card_front);
    formData.append('id_card_back', workerData.id_card_back);

    const response = await fetch(`${apiConfig.baseUrl}${apiConfig.endpoints.workers.create}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to create worker');
    }

    // Backend returns: { success: true, data: { worker: {...} }, message: "..." }
    const worker = result.data?.worker || result.worker;

    return {
      success: true,
      data: worker,
      message: result.message,
    };
  } catch (error) {
    console.error('Create worker error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create worker',
    };
  }
}

/**
 * Get all workers
 */
export async function getAllWorkers(): Promise<ApiResponse<Worker[]>> {
  try {
    const response = await fetch(`${apiConfig.baseUrl}${apiConfig.endpoints.workers.list}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to fetch workers');
    }

    // Backend returns: { success: true, data: { workers: [...], meta: {...} } }
    const workers = result.data?.workers || result.workers || [];

    return {
      success: true,
      data: workers,
    };
  } catch (error) {
    console.error('❌ Get workers error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch workers',
    };
  }
}

/**
 * Get worker by ID
 */
export async function getWorkerById(workerId: string): Promise<ApiResponse<Worker>> {
  try {
    const response = await fetch(`${apiConfig.baseUrl}${apiConfig.endpoints.workers.get(workerId)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to fetch worker');
    }

    // Backend returns: { success: true, data: { worker: {...} } }
    const worker = result.data?.worker || result.worker;

    return {
      success: true,
      data: worker,
    };
  } catch (error) {
    console.error('Get worker error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch worker',
    };
  }
}

/**
 * Update worker information
 */
export async function updateWorker(workerId: string, updateData: UpdateWorkerData): Promise<ApiResponse<Worker>> {
  try {
    const response = await fetch(`${apiConfig.baseUrl}${apiConfig.endpoints.workers.update(workerId)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(updateData),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to update worker');
    }

    // Backend returns: { success: true, data: { worker: {...} }, message: "..." }
    const worker = result.data?.worker || result.worker;

    return {
      success: true,
      data: worker,
      message: result.message,
    };
  } catch (error) {
    console.error('Update worker error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update worker',
    };
  }
}

/**
 * Delete worker
 */
export async function deleteWorker(workerId: string): Promise<ApiResponse<void>> {
  try {
    const response = await fetch(`${apiConfig.baseUrl}${apiConfig.endpoints.workers.delete(workerId)}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to delete worker');
    }

    return {
      success: true,
      message: result.message,
    };
  } catch (error) {
    console.error('Delete worker error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete worker',
    };
  }
}

/**
 * Get worker permissions
 */
export async function getWorkerPermissions(workerId: string): Promise<ApiResponse<WorkerPermissions>> {
  try {
    const response = await fetch(`${apiConfig.baseUrl}${apiConfig.endpoints.workers.permissions(workerId)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to fetch worker permissions');
    }

    // Backend returns: { success: true, data: { worker_id: "...", permissions: {...} } }
    const permissions = result.data?.permissions || result.permissions;

    return {
      success: true,
      data: permissions,
    };
  } catch (error) {
    console.error('Get worker permissions error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch worker permissions',
    };
  }
}

/**
 * Update worker permissions
 */
export async function updateWorkerPermissions(
  workerId: string, 
  permissions: WorkerPermissions
): Promise<ApiResponse<void>> {
  try {
    const response = await fetch(`${apiConfig.baseUrl}${apiConfig.endpoints.workers.updatePermissions(workerId)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ permissions }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to update worker permissions');
    }

    return {
      success: true,
      message: result.message,
    };
  } catch (error) {
    console.error('Update worker permissions error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update worker permissions',
    };
  }
}

/**
 * Authenticate worker with email and password
 */
export async function authenticateWorker(authData: WorkerAuthData): Promise<WorkerAuthResponse> {
  try {
    const response = await fetch(`${apiConfig.baseUrl}${apiConfig.endpoints.auth.workerLogin}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(authData),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || 'Authentication failed',
      };
    }

    // Backend returns: { success: true, data: { worker: {...} }, message: "..." }
    const worker = result.data?.worker || result.worker;

    return {
      success: true,
      message: result.message,
      worker: worker,
    };
  } catch (error) {
    console.error('Worker authentication error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Authentication failed',
    };
  }
}

/**
 * Update worker ID card (front or back)
 */
export async function updateWorkerIdCard(
  workerId: string,
  cardType: 'front' | 'back',
  idCardFile: File
): Promise<ApiResponse<{ message: string; [key: string]: string }>> {
  try {
    const formData = new FormData();
    formData.append('card_type', cardType);
    formData.append('id_card_file', idCardFile);

    const response = await fetch(`${apiConfig.baseUrl}${apiConfig.endpoints.workers.get(workerId)}/id-card`, {
      method: 'PUT',
      headers: {
        ...getAuthHeaders(),
        // Don't set Content-Type for FormData, let browser set it with boundary
      },
      body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || `Failed to update ${cardType} ID card`,
      };
    }

    // Backend returns: { success: true, data: { message: "...", ...urls } }
    const data = result.data || result;

    return {
      success: true,
      data: data,
    };
  } catch (error) {
    console.error(`Error updating ${cardType} ID card:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to update ${cardType} ID card`,
    };
  }
}
