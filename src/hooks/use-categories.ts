import { useState, useEffect } from 'react';
import { categoriesApi } from '@/lib/api';

export interface Category {
  category_id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateCategoryData {
  name: string;
  description?: string;
}

export interface UpdateCategoryData {
  name: string;
  description?: string;
}

/**
 * Custom hook for managing categories
 * Provides CRUD operations and state management for product categories
 */
export const useCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch all categories from the API
   */
  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await categoriesApi.getAll();
      
      if (response.success && response.data) {
        setCategories(response.data);
      } else {
        setError(response.error || 'Failed to fetch categories');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Create a new category
   */
  const createCategory = async (data: CreateCategoryData): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const response = await categoriesApi.create(data);

      if (response.success) {
        // Refresh categories list - don't let refresh errors affect the create success
        try {
          await fetchCategories();
        } catch (refreshError) {
          console.warn('Failed to refresh categories after create:', refreshError);
          // Don't set error here since the create was successful
        }
        return true;
      } else {
        setError(response.error || 'Failed to create category');
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
   * Update an existing category
   */
  const updateCategory = async (id: string, data: UpdateCategoryData): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const response = await categoriesApi.update(id, data);

      if (response.success) {
        // Refresh categories list - don't let refresh errors affect the update success
        try {
          await fetchCategories();
        } catch (refreshError) {
          console.warn('Failed to refresh categories after update:', refreshError);
          // Don't set error here since the update was successful
        }
        return true;
      } else {
        setError(response.error || 'Failed to update category');
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
   * Delete a category
   */
  const deleteCategory = async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      // Don't clear error here - let the component handle error display

      const response = await categoriesApi.delete(id);

      if (response.success) {
        // Refresh categories list - don't let refresh errors affect the delete success
        try {
          await fetchCategories();
        } catch (refreshError) {
          console.warn('Failed to refresh categories after delete:', refreshError);
          // Don't set error here since the delete was successful
        }
        return { success: true };
      } else {
        // Return the error instead of setting it in state
        return { success: false, error: response.error || 'Failed to delete category' };
      }
    } catch (err) {
      // Return the error instead of setting it in state
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
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
