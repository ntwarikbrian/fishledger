import { useState, useEffect } from 'react';
import { expenseCategoriesApi } from '@/lib/api';

export interface ExpenseCategory {
  category_id: string;
  category_name: string;
  description?: string;
  budget: number;
}

export interface CreateExpenseCategoryData {
  category_name: string;
  description?: string;
  budget?: number;
}

export interface UpdateExpenseCategoryData {
  category_name: string;
  description?: string;
  budget?: number;
}

/**
 * Custom hook for managing expense categories
 * Provides CRUD operations and state management for expense categories
 */
export const useExpenseCategories = () => {
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch all expense categories from the API
   */
  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await expenseCategoriesApi.getAll();
      
      if (response.success && response.data) {
        setCategories(response.data);
      } else {
        setError(response.error || 'Failed to fetch expense categories');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Create a new expense category
   */
  const createCategory = async (data: CreateExpenseCategoryData): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await expenseCategoriesApi.create(data);
      
      if (response.success) {
        // Refresh categories list
        await fetchCategories();
        return true;
      } else {
        setError(response.error || 'Failed to create expense category');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      return false;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Update an existing expense category
   */
  const updateCategory = async (id: string, data: UpdateExpenseCategoryData): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await expenseCategoriesApi.update(id, data);
      
      if (response.success) {
        // Refresh categories list
        await fetchCategories();
        return true;
      } else {
        setError(response.error || 'Failed to update expense category');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      return false;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Delete an expense category
   */
  const deleteCategory = async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      setError(null);

      const response = await expenseCategoriesApi.delete(id);

      if (response.success) {
        // Don't auto-refresh here - let the caller decide when to refresh
        return { success: true };
      } else {
        const errorMessage = response.error || 'Failed to delete expense category';
        // Don't set error in state - let caller handle it
        return { success: false, error: errorMessage };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      // Don't set error in state - let caller handle it
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Clear any existing errors
   */
  const clearError = () => {
    setError(null);
  };

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  return {
    categories,
    loading,
    error,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    clearError,
  };
};
