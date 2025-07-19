/**
 * Inventory API Service
 * Handles fish inventory operations with box/kg unboxing algorithm
 */

import { apiClient } from '../client';

// Types for inventory operations
export interface Product {
  product_id: string;
  name: string;
  category_id: string;

  // Inventory fields for box/kg management
  quantity_box: number; // Number of full boxes in stock
  box_to_kg_ratio: number; // How many kg per box (e.g., 20kg per box)
  quantity_kg: number; // Loose kg stock

  // Cost pricing fields
  cost_per_box: number; // Cost price per box for calculating profit margins
  cost_per_kg: number; // Cost price per kilogram for calculating profit margins

  // Selling pricing fields
  price_per_box: number; // Selling price per box
  price_per_kg: number; // Selling price per kg

  // Stock management
  boxed_low_stock_threshold: number; // Low stock threshold for boxed quantity alerts
}

export interface SaleRequest {
  product_id: string;
  boxes_quantity: number;
  kg_quantity: number;
  box_price: number;
  kg_price: number;
  payment_method: 'momo_pay' | 'cash' | 'bank_transfer';
  payment_status?: 'paid' | 'pending' | 'partial';
  amount_paid?: number; // Amount already paid (for partial payments)
  client_id?: string;
  client_name?: string; // Optional since it's only required for pending/partial payments
  email_address?: string;
  phone?: string;
}

// New interface for the fish sales algorithm
export interface FishSaleRequest {
  product_id: string;
  requested_kg: number; // Customer requests kg, system handles box conversion
  requested_boxes?: number; // Optional: Customer can also request specific number of boxes
  payment_method: 'momo_pay' | 'cash' | 'bank_transfer';
  payment_status?: 'paid' | 'pending' | 'partial';
  amount_paid?: number;
  client_id?: string;
  client_name?: string;
  email_address?: string;
  phone?: string;
}

// Fish sale API response interface (extends ApiResponse with additional properties)
export interface FishSaleApiResponse {
  success: boolean;
  data?: any;
  message?: string;
  error?: string;
  timestamp?: Date;
  algorithm?: {
    name: string;
    description: string;
    steps: string[];
    result: {
      sold_kg: number;
      sold_boxes?: number;
      used_boxes: number;
      total_amount: number;
    };
  };
  stockInfo?: {
    before: { boxes: number; kg: number };
    after: { boxes: number; kg: number };
  };
}

export interface FishSaleResult {
  success: boolean;
  data?: any;
  message?: string;
  algorithm?: {
    name: string;
    description: string;
    steps: string[];
    result: {
      sold_kg: number;
      sold_boxes?: number;
      used_boxes: number;
      total_amount: number;
    };
  };
  stockInfo?: {
    before: { boxes: number; kg: number };
    after: { boxes: number; kg: number };
  };
  error?: string;
}

export interface SaleResult {
  success: boolean;
  id?: string;
  product_id?: string;
  boxes_quantity?: number;
  kg_quantity?: number;
  total_amount?: number;
  amount_paid?: number;
  remaining_amount?: number;
  payment_status?: string;
  client_name?: string;
  error?: string;
}

export interface UnboxingOperation {
  boxes_opened: number;
  kg_added: number;
  reason: string;
  timestamp: Date;
}

export interface InventoryPreview {
  canFulfill: boolean;
  boxesUnboxedNeeded: number;
  finalInventory: { quantity_box: number; quantity_kg: number };
  warnings: string[];
}

export interface Sale {
  id: string;
  product_id: string;
  boxes_quantity: number;
  kg_quantity: number;
  box_price: number;
  kg_price: number;
  profit_per_box: number;
  profit_per_kg: number;
  total_amount: number;
  amount_paid?: number;
  remaining_amount?: number;
  date_time: string;
  payment_status: 'paid' | 'pending' | 'partial';
  payment_method: 'momo_pay' | 'cash' | 'bank_transfer' | null;
  performed_by: string;
  client_id?: string | null;
  client_name: string;
  email_address?: string | null;
  phone?: string | null;
  products?: {
    product_id: string;
    name: string;
    category_id: string;
    product_categories?: {
      category_id: string;
      name: string;
    };
  };
  users?: {
    user_id: string;
    owner_name: string;
    business_name: string;
  };
}

export interface StockMovement {
  movement_id: string;
  product_id: string;
  movement_type: 'damaged' | 'new_stock' | 'stock_correction' | 'product_edit' | 'sale' | 'unboxing';
  box_change: number;
  kg_change: number;
  damaged_id?: string;
  stock_addition_id?: string;
  correction_id?: string;
  sale_id?: string;
  reason?: string;
  status: 'pending' | 'completed' | 'cancelled';
  performed_by: string;
  created_at: string;
  // Product edit specific fields
  field_changed?: string;
  old_value?: string;
  new_value?: string;
  products?: {
    product_id: string;
    name: string;
    box_to_kg_ratio: number;
    product_categories?: {
      name: string;
    };
  };
  performer?: {
    user_id: string;
    owner_name: string;
    business_name?: string;
  };
  damaged_products?: {
    damage_id: string;
    damaged_reason: string;
    damaged_date: string;
    loss_value: number;
    description?: string;
  };
  sales?: {
    sales_id: string;
    client_name?: string;
    total_amount: number;
    payment_method?: string;
  };
  // Legacy fields for backward compatibility
  related_sale_id?: string;
  unboxing_details?: UnboxingOperation[];
}

/**
 * Inventory Service Class
 * Provides methods for inventory and sales operations
 */
class InventoryService {
  
  /**
   * Create a new sale (legacy method)
   */
  async createSale(saleRequest: SaleRequest): Promise<SaleResult> {
    try {
      const response = await apiClient.post('/api/sales', saleRequest);

      // The API client returns the full backend response structure directly
      if (!response.success) {
        throw new Error(response.message || 'Sale creation failed');
      }

      return {
        success: true,
        ...(response.data && typeof response.data === 'object' ? response.data : {})
      };
    } catch (error: any) {
      console.error('Error creating sale:', error);

      // Handle ApiClientError specifically
      if (error.name === 'ApiClientError') {
        return {
          success: false,
          error: error.message || 'Failed to create sale',
        };
      }

      return {
        success: false,
        error: error.message || 'Failed to create sale',
      };
    }
  }

  /**
   * Create a fish sale using the new algorithm
   * Customer requests kg, system automatically handles box conversion
   */
  async createFishSale(fishSaleRequest: FishSaleRequest): Promise<FishSaleResult> {
    try {
      console.log('🐟 Creating fish sale with request:', JSON.stringify(fishSaleRequest, null, 2));
      const response = await apiClient.post('/api/sales/fish', fishSaleRequest) as FishSaleApiResponse;

      console.log('🐟 Fish sale API response:', response);

      if (!response.success) {
        throw new Error(response.message || 'Fish sale creation failed');
      }

      return {
        success: true,
        data: response.data,
        message: response.message,
        algorithm: response.algorithm,
        stockInfo: response.stockInfo
      };
    } catch (error: any) {
      console.error('Error creating fish sale:', error);

      // Handle ApiClientError specifically
      if (error.name === 'ApiClientError') {
        return {
          success: false,
          error: error.message || 'Failed to create fish sale',
        };
      }

      return {
        success: false,
        error: error.message || 'Failed to create fish sale',
      };
    }
  }

  /**
   * Get preview of sale without executing
   */
  async getSalePreview(productId: string, boxesRequested: number, kgRequested: number): Promise<InventoryPreview> {
    try {
      const response = await apiClient.post('/api/sales/preview', {
        product_id: productId,
        boxes_requested: boxesRequested,
        kg_requested: kgRequested
      });

      if (!response.success) {
        throw new Error(response.message || 'Preview generation failed');
      }

      return response.data as InventoryPreview;
    } catch (error: any) {
      console.error('Error getting sale preview:', error);
      return {
        canFulfill: false,
        boxesUnboxedNeeded: 0,
        finalInventory: { quantity_box: 0, quantity_kg: 0 },
        warnings: [error.response?.data?.message || error.message || 'Failed to generate preview']
      };
    }
  }

  /**
   * Update an existing sale
   */
  async updateSale(saleId: string, updateData: Partial<SaleRequest>): Promise<SaleResult> {
    try {
      console.log('Updating sale with data:', updateData); // Debug log
      const response = await apiClient.put(`/api/sales/${saleId}`, updateData);

      // The API client returns the full backend response structure directly
      if (!response.success) {
        throw new Error(response.message || 'Sale update failed');
      }

      return {
        success: true,
        ...(response.data && typeof response.data === 'object' ? response.data : {})
      };
    } catch (error: any) {
      console.error('Error updating sale:', error);

      // Handle ApiClientError specifically with detailed error information
      if (error.name === 'ApiClientError') {
        let errorMessage = error.message || 'Failed to update sale';

        // Extract validation errors if available
        if (error.details?.details?.validationErrors) {
          const validationErrors = error.details.details.validationErrors;
          errorMessage = `Validation errors: ${validationErrors.map((e: any) => `${e.field}: ${e.message}`).join(', ')}`;
        } else if (error.details?.error) {
          errorMessage = error.details.error;
        }

        return {
          success: false,
          error: errorMessage,
        };
      }

      return {
        success: false,
        error: error.message || 'Failed to update sale',
      };
    }
  }

  /**
   * Delete a sale - Creates audit record for admin approval
   */
  async deleteSale(saleId: string, deleteData?: { reason: string }): Promise<{ success: boolean; error?: string }> {
    try {
      const config = deleteData ? {
        body: JSON.stringify(deleteData),
        headers: {
          'Content-Type': 'application/json',
        }
      } : undefined;

      const response = await apiClient.delete(`/api/sales/${saleId}`, config);

      // The API client returns the full backend response structure directly
      if (!response.success) {
        throw new Error(response.message || 'Sale deletion failed');
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error deleting sale:', error);

      // Handle ApiClientError specifically
      if (error.name === 'ApiClientError') {
        return {
          success: false,
          error: error.message || 'Failed to delete sale',
        };
      }

      return {
        success: false,
        error: error.message || 'Failed to delete sale',
      };
    }
  }

  /**
   * Get all sales
   */
  async getSales(): Promise<Sale[]> {
    try {
      console.log('🔄 Fetching sales from API...');
      const response = await apiClient.get('/api/sales');

      console.log('📦 Sales API response:', {
        success: response.success,
        dataType: typeof response.data,
        dataLength: Array.isArray(response.data) ? response.data.length : 'not array',
        hasData: !!response.data,
        hasPagination: !!(response as any).pagination,
        fullResponse: response
      });

      if (!response.success) {
        console.error('❌ Sales API returned success: false', response);
        throw new Error(response.message || 'Failed to fetch sales');
      }

      // Handle both direct array and paginated response
      const salesData = Array.isArray(response.data) ? response.data : [];
      console.log('✅ Processed sales data:', salesData.length, 'items');

      return salesData;
    } catch (error: any) {
      console.error('💥 Error fetching sales:', {
        error,
        message: error.message,
        response: error.response,
        stack: error.stack
      });
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch sales');
    }
  }

  /**
   * Get sale by ID
   */
  async getSaleById(saleId: string): Promise<Sale> {
    try {
      const response = await apiClient.get(`/api/sales/${saleId}`);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch sale');
      }

      return response.data as Sale;
    } catch (error: any) {
      console.error('Error fetching sale:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch sale');
    }
  }

  /**
   * Get stock movements for all products
   */
  async getStockMovements(params?: {
    movement_type?: string;
    product_id?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<StockMovement[]> {
    try {
      // Build query string from params
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            queryParams.append(key, value.toString());
          }
        });
      }

      const endpoint = queryParams.toString()
        ? `/api/stock-movements?${queryParams.toString()}`
        : '/api/stock-movements';

      const response = await apiClient.get(endpoint);

      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch stock movements');
      }

      return (response.data as StockMovement[]) || [];
    } catch (error: any) {
      console.error('Error fetching stock movements:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch stock movements');
    }
  }

  /**
   * Get stock movements for a specific product
   */
  async getProductStockMovements(productId: string, limit?: number): Promise<StockMovement[]> {
    try {
      const response = await apiClient.get(`/api/stock-movements/product/${productId}?limit=${limit || 20}`);

      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch product stock movements');
      }

      return (response.data as StockMovement[]) || [];
    } catch (error: any) {
      console.error('Error fetching product stock movements:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch product stock movements');
    }
  }

  /**
   * Get stock movement by ID
   */
  async getStockMovementById(movementId: string): Promise<StockMovement> {
    try {
      const response = await apiClient.get(`/api/stock-movements/${movementId}`);

      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch stock movement');
      }

      return response.data as StockMovement;
    } catch (error: any) {
      console.error('Error fetching stock movement:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch stock movement');
    }
  }

  /**
   * Create a new stock movement
   */
  async createStockMovement(data: {
    product_id: string;
    movement_type: 'damaged' | 'new_stock' | 'stock_correction' | 'product_edit' | 'product_delete';
    box_change?: number;
    kg_change?: number;
    reason?: string;
    damaged_id?: string;
    stock_addition_id?: string;
    correction_id?: string;
    field_changed?: string;
    old_value?: string;
    new_value?: string;
  }): Promise<StockMovement> {
    try {
      const response = await apiClient.post('/api/stock-movements', data);

      if (!response.success) {
        throw new Error(response.message || 'Failed to create stock movement');
      }

      return response.data as StockMovement;
    } catch (error: any) {
      console.error('Error creating stock movement:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to create stock movement');
    }
  }

  /**
   * Calculate total price for a sale request
   */
  calculateSaleTotal(product: Product, boxesRequested: number, kgRequested: number): {
    boxesTotal: number;
    kgTotal: number;
    totalAmount: number;
  } {
    const boxesTotal = boxesRequested * (product.price_per_box || 0);
    const kgTotal = kgRequested * (product.price_per_kg || 0);
    const totalAmount = boxesTotal + kgTotal;

    return {
      boxesTotal,
      kgTotal,
      totalAmount
    };
  }

  /**
   * Validate sale request
   */
  validateSaleRequest(saleRequest: SaleRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!saleRequest.product_id) {
      errors.push('Product ID is required');
    }

    if (saleRequest.boxes_quantity < 0) {
      errors.push('Boxes quantity cannot be negative');
    }

    if (saleRequest.kg_quantity < 0) {
      errors.push('KG quantity cannot be negative');
    }

    if (saleRequest.boxes_quantity <= 0 && saleRequest.kg_quantity <= 0) {
      errors.push('At least one quantity (boxes or kg) must be greater than 0');
    }

    if (saleRequest.box_price < 0) {
      errors.push('Box price cannot be negative');
    }

    if (saleRequest.kg_price < 0) {
      errors.push('KG price cannot be negative');
    }

    // Client name is only required for pending and partial payments, not for paid
    if ((saleRequest.payment_status === 'pending' || saleRequest.payment_status === 'partial') &&
        (!saleRequest.client_name || saleRequest.client_name.trim().length === 0)) {
      errors.push('Client name is required for pending or partial payments');
    }

    if (!saleRequest.payment_method) {
      errors.push('Payment method is required');
    }

    if (!['momo_pay', 'cash', 'bank_transfer'].includes(saleRequest.payment_method)) {
      errors.push('Payment method must be momo_pay, cash, or bank_transfer');
    }

    if (saleRequest.email_address && !this.isValidEmail(saleRequest.email_address)) {
      errors.push('Invalid email format');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate fish sale request
   */
  validateFishSaleRequest(fishSaleRequest: FishSaleRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!fishSaleRequest.product_id) {
      errors.push('Product ID is required');
    }

    // At least one quantity (kg or boxes) must be specified
    if ((!fishSaleRequest.requested_kg || fishSaleRequest.requested_kg <= 0) &&
        (!fishSaleRequest.requested_boxes || fishSaleRequest.requested_boxes <= 0)) {
      errors.push('Either requested kg or requested boxes must be greater than 0');
    }

    // Validate kg if specified
    if (fishSaleRequest.requested_kg && fishSaleRequest.requested_kg > 0) {
      if (fishSaleRequest.requested_kg < 0.1) {
        errors.push('Requested kg must be at least 0.1');
      }
      if (fishSaleRequest.requested_kg > 10000) {
        errors.push('Requested kg cannot exceed 10,000');
      }
    }

    // Validate boxes if specified
    if (fishSaleRequest.requested_boxes && fishSaleRequest.requested_boxes > 0) {
      if (fishSaleRequest.requested_boxes < 1) {
        errors.push('Requested boxes must be at least 1');
      }
      if (fishSaleRequest.requested_boxes > 1000) {
        errors.push('Requested boxes cannot exceed 1,000');
      }
    }

    if (!fishSaleRequest.payment_method) {
      errors.push('Payment method is required');
    }

    if (!['momo_pay', 'cash', 'bank_transfer'].includes(fishSaleRequest.payment_method)) {
      errors.push('Invalid payment method');
    }

    if (fishSaleRequest.payment_status && !['paid', 'pending', 'partial'].includes(fishSaleRequest.payment_status)) {
      errors.push('Invalid payment status');
    }

    if (fishSaleRequest.amount_paid && fishSaleRequest.amount_paid < 0) {
      errors.push('Amount paid cannot be negative');
    }

    // Client name is required for pending or partial payments
    if ((fishSaleRequest.payment_status === 'pending' || fishSaleRequest.payment_status === 'partial') && !fishSaleRequest.client_name?.trim()) {
      errors.push('Client name is required for pending or partial payments');
    }

    if (fishSaleRequest.email_address && !this.isValidEmail(fishSaleRequest.email_address)) {
      errors.push('Invalid email format');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Helper method to validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Format currency for display (deprecated - use useCurrency hook instead)
   */
  formatCurrency(amount: number): string {
    // Try to get currency from localStorage first
    const savedCurrency = localStorage.getItem('currency') as 'USD' | 'RWF' | null;
    const currency = savedCurrency || 'USD';

    try {
      const options: Intl.NumberFormatOptions = {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: currency === 'RWF' ? 0 : 2,
        maximumFractionDigits: currency === 'RWF' ? 0 : 2,
      };

      const locale = currency === 'RWF' ? 'rw-RW' : 'en-US';
      return new Intl.NumberFormat(locale, options).format(amount);
    } catch (error) {
      // Fallback formatting
      const symbol = currency === 'RWF' ? 'RWF' : '$';
      const formattedAmount = currency === 'RWF'
        ? Math.round(amount).toLocaleString()
        : amount.toFixed(2);

      return currency === 'USD'
        ? `${symbol}${formattedAmount}`
        : `${formattedAmount} ${symbol}`;
    }
  }

  /**
   * Format date for display
   */
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Helper method to validate phone number format
   */
  private isValidPhoneNumber(phone: string): boolean {
    // Basic phone number validation - accepts various formats
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    return phoneRegex.test(cleanPhone) && cleanPhone.length >= 7 && cleanPhone.length <= 15;
  }

  /**
   * Check if inventory levels are sufficient for a sale
   */
  checkInventorySufficiency(product: Product, boxesRequested: number, kgRequested: number): {
    sufficient: boolean;
    warnings: string[];
    suggestions: string[];
  } {
    const warnings: string[] = [];
    const suggestions: string[] = [];
    let sufficient = true;

    // Check box availability
    if (boxesRequested > product.quantity_box) {
      sufficient = false;
      warnings.push(`Insufficient boxes: requested ${boxesRequested}, available ${product.quantity_box}`);
      suggestions.push(`Reduce box quantity to ${product.quantity_box} or less`);
    }

    // Check if we need to unbox for kg requests
    if (kgRequested > product.quantity_kg) {
      const kgShortage = kgRequested - product.quantity_kg;
      const boxesNeeded = Math.ceil(kgShortage / product.box_to_kg_ratio);
      const availableBoxesAfterSale = product.quantity_box - boxesRequested;

      if (boxesNeeded > availableBoxesAfterSale) {
        sufficient = false;
        warnings.push(`Insufficient inventory for kg request: need ${boxesNeeded} boxes to unbox, but only ${availableBoxesAfterSale} available after box sales`);
        suggestions.push(`Reduce kg quantity or box quantity to free up boxes for unboxing`);
      } else {
        warnings.push(`Will automatically unbox ${boxesNeeded} boxes to fulfill kg request`);
      }
    }

    // Check for low stock warnings
    const finalBoxes = product.quantity_box - boxesRequested - Math.ceil(Math.max(0, kgRequested - product.quantity_kg) / product.box_to_kg_ratio);
    const finalKg = product.quantity_kg + Math.ceil(Math.max(0, kgRequested - product.quantity_kg) / product.box_to_kg_ratio) * product.box_to_kg_ratio - kgRequested;
    const totalEquivalentBoxes = finalBoxes + Math.floor(finalKg / product.box_to_kg_ratio);

    if (totalEquivalentBoxes <= product.boxed_low_stock_threshold) {
      warnings.push('Product will be at low stock level after this sale');
      suggestions.push('Consider restocking this product soon');
    }

    return {
      sufficient,
      warnings,
      suggestions
    };
  }
}

// Export singleton instance
export const inventoryService = new InventoryService();

// Export the service class for testing
export { InventoryService };
