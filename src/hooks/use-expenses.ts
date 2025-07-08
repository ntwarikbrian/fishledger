import { useState, useEffect } from 'react';
import { expensesApi } from '@/lib/api';

export interface Expense {
  expense_id: string;
  title: string;
  category_id: string;
  amount: number;
  date: string;
  status: string;
  receipt_url?: string | null;
  added_by: string;
  created_at: string;
  updated_at: string;
  expense_categories?: {
    category_id: string;
    category_name: string;
    description?: string;
  };
  users?: {
    user_id: string;
    owner_name: string;
  };
}

export interface CreateExpenseData {
  title: string;
  category_id: string;
  amount: number;
  date: string;
  status?: string;
  receipt_url?: string | null;
}

export interface UpdateExpenseData {
  title?: string;
  category_id?: string;
  amount?: number;
  date?: string;
  status?: string;
  receipt_url?: string | null;
}

export const useExpenses = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch all expenses from the API
   */
  const fetchExpenses = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await expensesApi.getAll();
      
      if (response.success && response.data) {
        setExpenses(response.data);
      } else {
        setError(response.error || 'Failed to fetch expenses');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Create a new expense
   */
  const createExpense = async (data: CreateExpenseData): Promise<boolean> => {
    try {
      setError(null);

      const response = await expensesApi.create(data);

      if (response.success) {
        // Refresh the expenses list
        await fetchExpenses();
        return true;
      } else {
        setError(response.error || 'Failed to create expense');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      return false;
    }
  };

  /**
   * Create a new expense with file upload
   */
  const createExpenseWithFile = async (data: CreateExpenseData, file?: File): Promise<boolean> => {
    try {
      setError(null);

      const response = await expensesApi.createWithFile(data, file);

      if (response.success) {
        // Refresh the expenses list
        await fetchExpenses();
        return true;
      } else {
        setError(response.error || 'Failed to create expense');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      return false;
    }
  };

  /**
   * Update an existing expense
   */
  const updateExpense = async (id: string, data: UpdateExpenseData): Promise<boolean> => {
    try {
      setError(null);
      
      const response = await expensesApi.update(id, data);
      
      if (response.success) {
        // Refresh the expenses list
        await fetchExpenses();
        return true;
      } else {
        setError(response.error || 'Failed to update expense');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      return false;
    }
  };

  /**
   * Delete an expense
   */
  const deleteExpense = async (id: string): Promise<boolean> => {
    try {
      setError(null);
      
      const response = await expensesApi.delete(id);
      
      if (response.success) {
        // Refresh the expenses list
        await fetchExpenses();
        return true;
      } else {
        setError(response.error || 'Failed to delete expense');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      return false;
    }
  };

  // Fetch expenses on component mount
  useEffect(() => {
    fetchExpenses();
  }, []);

  return {
    expenses,
    loading,
    error,
    fetchExpenses,
    createExpense,
    createExpenseWithFile,
    updateExpense,
    deleteExpense,
  };
};
