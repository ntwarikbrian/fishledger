/**
 * Custom hook for managing products
 * Provides CRUD operations and state management for fish products
 */

import { useState, useEffect, useCallback } from 'react';
import { productsApi } from '@/lib/api';

// Product interface matching the new database schema
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
  
  // Calculated profit fields
  profit_per_box: number; // Profit margin per box (selling price - cost price)
  profit_per_kg: number; // Profit margin per kilogram (selling price - cost price)
  
  // Stock management
  boxed_low_stock_threshold: number; // Low stock threshold for boxed quantity alerts
  
  // Product lifecycle and damage tracking
  expiry_date?: string;
  days_left?: number; // Days remaining until expiry (calculated)
  damaged_reason?: string;
  damaged_date?: string;
  loss_value: number;
  damaged_approval: boolean; // Whether damaged product report has been approved
  reported_by?: string; // UUID reference to users
  
  // Timestamps
  created_at: string;
  updated_at: string;
  
  // Category information (joined from product_categories)
  product_categories?: {
    category_id: string;
    name: string;
    description?: string;
  };
}

export interface CreateProductData {
  name: string;
  category_id: string;
  quantity_box?: number;
  box_to_kg_ratio: number;
  quantity_kg?: number;
  cost_per_box: number;
  cost_per_kg: number;
  price_per_box: number;
  price_per_kg: number;
  boxed_low_stock_threshold?: number;
  expiry_date?: string;
  damaged_reason?: string;
  damaged_date?: string;
  loss_value?: number;
  damaged_approval?: boolean;
  reported_by?: string;
}

/**
 * Custom hook for managing products
 * Provides CRUD operations and state management for fish products
 */
export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch all products from the API
   */
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await productsApi.getAll();

      if (response.success && response.data) {
        setProducts(response.data);
      } else {
        setError(response.error || 'Failed to fetch products');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, []); // No dependencies needed as it's a pure API call

  /**
   * Create a new product
   */
  const createProduct = async (productData: CreateProductData): Promise<boolean> => {
    try {
      setError(null);
      
      const response = await productsApi.create(productData);
      
      if (response.success) {
        // Refresh the products list
        await fetchProducts();
        return true;
      } else {
        setError(response.error || 'Failed to create product');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      return false;
    }
  };

  /**
   * Update an existing product
   */
  const updateProduct = async (id: string, productData: Partial<CreateProductData>): Promise<boolean> => {
    try {
      setError(null);
      
      const response = await productsApi.update(id, productData);
      
      if (response.success) {
        // Refresh the products list
        await fetchProducts();
        return true;
      } else {
        setError(response.error || 'Failed to update product');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      return false;
    }
  };

  /**
   * Delete a product (with cascading delete of all related records)
   */
  const deleteProduct = async (id: string, reason?: string): Promise<boolean> => {
    try {
      setError(null);

      const response = await productsApi.delete(id, reason);

      if (response.success) {
        // Refresh the products list
        await fetchProducts();
        return true;
      } else {
        // Set the specific error message for UI display
        const errorMessage = response.error || 'Failed to delete product';
        setError(errorMessage);
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      return false;
    }
  };

  /**
   * Get products with low stock
   */
  const getLowStockProducts = () => {
    return products.filter(product => {
      const totalEquivalentBoxes = product.quantity_box + Math.floor(product.quantity_kg / product.box_to_kg_ratio);
      return totalEquivalentBoxes <= product.boxed_low_stock_threshold;
    });
  };

  /**
   * Get products that are expired or expiring soon
   */
  const getExpiringProducts = (daysThreshold: number = 7) => {
    return products.filter(product => {
      if (!product.days_left) return false;
      return product.days_left <= daysThreshold;
    });
  };

  /**
   * Get damaged products from local state
   */
  const getDamagedProducts = () => {
    return products.filter(product => product.damaged_reason && product.damaged_reason.trim() !== '');
  };

  /**
   * Fetch damaged products from API with detailed information
   */
  const fetchDamagedProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await productsApi.getDamagedProducts();

      if (response.success && response.data) {
        return response.data;
      } else {
        setError(response.error || 'Failed to fetch damaged products');
        return [];
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      return [];
    } finally {
      setLoading(false);
    }
  }, []); // No dependencies needed as it's a pure API call

  /**
   * Calculate total inventory value
   */
  const calculateTotalValue = useCallback(() => {
    return products.reduce((total, product) => {
      const boxValue = product.quantity_box * product.price_per_box;
      const kgValue = product.quantity_kg * product.price_per_kg;
      return total + boxValue + kgValue;
    }, 0);
  }, [products]);

  /**
   * Calculate total cost value
   */
  const calculateTotalCost = useCallback(() => {
    return products.reduce((total, product) => {
      const boxCost = product.quantity_box * product.cost_per_box;
      const kgCost = product.quantity_kg * product.cost_per_kg;
      return total + boxCost + kgCost;
    }, 0);
  }, [products]);

  /**
   * Calculate total profit
   */
  const calculateTotalProfit = useCallback(() => {
    const totalValue = calculateTotalValue();
    const totalCost = calculateTotalCost();
    return totalValue - totalCost;
  }, [calculateTotalValue, calculateTotalCost]);

  /**
   * Calculate profit margin percentage
   */
  const calculateProfitMargin = useCallback(() => {
    const totalValue = calculateTotalValue();
    const totalProfit = calculateTotalProfit();
    return totalValue > 0 ? (totalProfit / totalValue) * 100 : 0;
  }, [calculateTotalValue, calculateTotalProfit]);

  /**
   * Delete a damaged product record and restore stock
   */
  const deleteDamagedProduct = useCallback(async (damageId: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await productsApi.deleteDamagedProduct(damageId);

      if (response.success) {
        return response;
      } else {
        setError(response.error || 'Failed to delete damaged product');
        return response;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch products on component mount
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return {
    products,
    loading,
    error,
    fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    getLowStockProducts,
    getExpiringProducts,
    getDamagedProducts,
    fetchDamagedProducts,
    deleteDamagedProduct,
    calculateTotalValue,
    calculateTotalCost,
    calculateTotalProfit,
    calculateProfitMargin,
  };
};
