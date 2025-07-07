/**
 * Expense Routes
 * Handles expense management endpoints
 */

import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/auth.js';
import { supabaseClient } from '../config/supabase-client.js';

const router = Router();

/**
 * @route   GET /api/expenses/categories
 * @desc    Get all expense categories
 * @access  Private
 */
router.get('/categories', authenticate, requirePermission('view_expenses'), async (_req, res) => {
  try {
    const { data: categories, error } = await supabaseClient
      .from('expense_categories')
      .select('category_id, category_name, description, budget')
      .order('category_name', { ascending: true });

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      message: 'Expense categories retrieved successfully',
      data: categories || [],
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error fetching expense categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch expense categories',
      error: 'FETCH_EXPENSE_CATEGORIES_ERROR',
      timestamp: new Date(),
    });
  }
});

/**
 * @route   POST /api/expenses/categories
 * @desc    Create new expense category
 * @access  Private
 */
router.post('/categories', authenticate, requirePermission('manage_expenses'), async (req, res) => {
  try {
    const { category_name, description, budget } = req.body;

    // Validate required fields
    if (!category_name || category_name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Category name is required',
        error: 'VALIDATION_ERROR',
        timestamp: new Date(),
      });
    }

    // Validate budget if provided
    if (budget !== undefined && (isNaN(budget) || budget < 0)) {
      return res.status(400).json({
        success: false,
        message: 'Budget must be a positive number',
        error: 'VALIDATION_ERROR',
        timestamp: new Date(),
      });
    }

    // Check if category already exists
    const { data: existingCategory } = await supabaseClient
      .from('expense_categories')
      .select('category_id')
      .eq('category_name', category_name.trim())
      .single();

    if (existingCategory) {
      return res.status(409).json({
        success: false,
        message: 'Category with this name already exists',
        error: 'CATEGORY_EXISTS',
        timestamp: new Date(),
      });
    }

    // Create new category
    const { data: newCategory, error } = await supabaseClient
      .from('expense_categories')
      .insert([{
        category_name: category_name.trim(),
        description: description?.trim() || null,
        budget: budget || 0,
      }])
      .select('category_id, category_name, description, budget')
      .single();

    if (error) {
      throw error;
    }

    res.status(201).json({
      success: true,
      message: 'Expense category created successfully',
      data: newCategory,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error creating expense category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create expense category',
      error: 'CREATE_EXPENSE_CATEGORY_ERROR',
      timestamp: new Date(),
    });
  }
});

/**
 * @route   PUT /api/expenses/categories/:id
 * @desc    Update expense category
 * @access  Private
 */
router.put('/categories/:id', authenticate, requirePermission('manage_expenses'), async (req, res) => {
  try {
    const { id } = req.params;
    const { category_name, description, budget } = req.body;

    // Validate required fields
    if (!category_name || category_name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Category name is required',
        error: 'VALIDATION_ERROR',
        timestamp: new Date(),
      });
    }

    // Validate budget if provided
    if (budget !== undefined && (isNaN(budget) || budget < 0)) {
      return res.status(400).json({
        success: false,
        message: 'Budget must be a positive number',
        error: 'VALIDATION_ERROR',
        timestamp: new Date(),
      });
    }

    // Check if category exists
    const { data: existingCategory } = await supabaseClient
      .from('expense_categories')
      .select('category_id')
      .eq('category_id', id)
      .single();

    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
        error: 'CATEGORY_NOT_FOUND',
        timestamp: new Date(),
      });
    }

    // Check if another category with the same name exists (excluding current)
    const { data: duplicateCategory } = await supabaseClient
      .from('expense_categories')
      .select('category_id')
      .eq('category_name', category_name.trim())
      .neq('category_id', id)
      .single();

    if (duplicateCategory) {
      return res.status(409).json({
        success: false,
        message: 'Another category with this name already exists',
        error: 'CATEGORY_EXISTS',
        timestamp: new Date(),
      });
    }

    // Update category
    const { data: updatedCategory, error } = await supabaseClient
      .from('expense_categories')
      .update({
        category_name: category_name.trim(),
        description: description?.trim() || null,
        budget: budget || 0,
      })
      .eq('category_id', id)
      .select('category_id, category_name, description, budget')
      .single();

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      message: 'Expense category updated successfully',
      data: updatedCategory,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error updating expense category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update expense category',
      error: 'UPDATE_EXPENSE_CATEGORY_ERROR',
      timestamp: new Date(),
    });
  }
});

/**
 * @route   DELETE /api/expenses/categories/:id
 * @desc    Delete expense category
 * @access  Private
 */
router.delete('/categories/:id', authenticate, requirePermission('manage_expenses'), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if category exists
    const { data: existingCategory } = await supabaseClient
      .from('expense_categories')
      .select('category_id, category_name')
      .eq('category_id', id)
      .single();

    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
        error: 'CATEGORY_NOT_FOUND',
        timestamp: new Date(),
      });
    }

    // Check if category is being used by any expenses
    const { data: expensesUsingCategory, error: expenseCheckError } = await supabaseClient
      .from('expenses')
      .select('expense_id')
      .eq('category_id', id)
      .limit(1);

    if (expenseCheckError) {
      throw expenseCheckError;
    }

    if (expensesUsingCategory && expensesUsingCategory.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Cannot delete category that is being used by expenses',
        error: 'CATEGORY_IN_USE',
        timestamp: new Date(),
      });
    }

    // Delete category
    const { error } = await supabaseClient
      .from('expense_categories')
      .delete()
      .eq('category_id', id);

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      message: 'Expense category deleted successfully',
      data: { category_id: id },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error deleting expense category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete expense category',
      error: 'DELETE_EXPENSE_CATEGORY_ERROR',
      timestamp: new Date(),
    });
  }
});

// Get all expenses
router.get('/', authenticate, requirePermission('view_expenses'), async (req, res) => {
  try {
    const { data, error } = await supabaseClient
      .from('expenses')
      .select(`
        *,
        expense_categories (
          category_id,
          category_name,
          description
        ),
        users (
          user_id,
          owner_name
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching expenses:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch expenses',
        error: 'FETCH_EXPENSES_ERROR',
        timestamp: new Date(),
      });
    }

    res.json({
      success: true,
      message: 'Expenses fetched successfully',
      data: data || [],
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch expenses',
      error: 'FETCH_EXPENSES_ERROR',
      timestamp: new Date(),
    });
  }
});

// Create a new expense
// Update an expense
router.put('/:id', authenticate, requirePermission('manage_expenses'), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, category_id, amount, date, status, receipt_url } = req.body;

    // Validate expense ID
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Expense ID is required',
        error: 'VALIDATION_ERROR',
        timestamp: new Date(),
      });
    }

    // Build update object with only provided fields
    const updateData: any = {};
    if (title !== undefined) updateData.title = title.trim();
    if (category_id !== undefined) updateData.category_id = category_id;
    if (amount !== undefined) updateData.amount = parseFloat(amount);
    if (date !== undefined) updateData.date = date;
    if (status !== undefined) updateData.status = status;
    if (receipt_url !== undefined) updateData.receipt_url = receipt_url;

    // Validate amount if provided
    if (amount !== undefined && parseFloat(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be greater than 0',
        error: 'VALIDATION_ERROR',
        timestamp: new Date(),
      });
    }

    // Validate status if provided
    if (status !== undefined) {
      const validStatuses = ['pending', 'paid'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status. Must be one of: pending, paid',
          error: 'VALIDATION_ERROR',
          timestamp: new Date(),
        });
      }
    }

    // Verify category exists if category_id is provided
    if (category_id !== undefined) {
      const { data: categoryData, error: categoryError } = await supabaseClient
        .from('expense_categories')
        .select('category_id')
        .eq('category_id', category_id)
        .single();

      if (categoryError || !categoryData) {
        return res.status(400).json({
          success: false,
          message: 'Invalid category ID',
          error: 'VALIDATION_ERROR',
          timestamp: new Date(),
        });
      }
    }

    // Update the expense
    const { data, error } = await supabaseClient
      .from('expenses')
      .update(updateData)
      .eq('expense_id', id)
      .select(`
        *,
        expense_categories (
          category_id,
          category_name,
          description
        )
      `)
      .single();

    if (error) {
      console.error('Error updating expense:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update expense',
        error: 'UPDATE_EXPENSE_ERROR',
        timestamp: new Date(),
      });
    }

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found',
        error: 'EXPENSE_NOT_FOUND',
        timestamp: new Date(),
      });
    }

    res.json({
      success: true,
      message: 'Expense updated successfully',
      data,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error updating expense:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update expense',
      error: 'UPDATE_EXPENSE_ERROR',
      timestamp: new Date(),
    });
  }
});

// Delete an expense
router.delete('/:id', authenticate, requirePermission('manage_expenses'), async (req, res) => {
  try {
    const { id } = req.params;

    // Validate expense ID
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Expense ID is required',
        error: 'VALIDATION_ERROR',
        timestamp: new Date(),
      });
    }

    // Delete the expense
    const { data, error } = await supabaseClient
      .from('expenses')
      .delete()
      .eq('expense_id', id)
      .select()
      .single();

    if (error) {
      console.error('Error deleting expense:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete expense',
        error: 'DELETE_EXPENSE_ERROR',
        timestamp: new Date(),
      });
    }

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found',
        error: 'EXPENSE_NOT_FOUND',
        timestamp: new Date(),
      });
    }

    res.json({
      success: true,
      message: 'Expense deleted successfully',
      data: { expense_id: id },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete expense',
      error: 'DELETE_EXPENSE_ERROR',
      timestamp: new Date(),
    });
  }
});

router.post('/', authenticate, requirePermission('manage_expenses'), async (req, res) => {
  try {
    const { title, category_id, amount, date, status = 'pending', receipt_url } = req.body;

    // Validate required fields
    if (!title || !category_id || !amount || !date) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: title, category_id, amount, and date are required',
        error: 'VALIDATION_ERROR',
        timestamp: new Date(),
      });
    }

    // Validate amount is positive
    if (parseFloat(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be greater than 0',
        error: 'VALIDATION_ERROR',
        timestamp: new Date(),
      });
    }

    // Validate status
    const validStatuses = ['pending', 'paid'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: pending, paid',
        error: 'VALIDATION_ERROR',
        timestamp: new Date(),
      });
    }

    // Get user ID from the authenticated request
    const userId = req.user?.user_id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
        error: 'AUTHENTICATION_ERROR',
        timestamp: new Date(),
      });
    }

    // Verify category exists
    const { data: categoryData, error: categoryError } = await supabaseClient
      .from('expense_categories')
      .select('category_id')
      .eq('category_id', category_id)
      .single();

    if (categoryError || !categoryData) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category ID',
        error: 'VALIDATION_ERROR',
        timestamp: new Date(),
      });
    }

    // Insert the expense
    const { data, error } = await supabaseClient
      .from('expenses')
      .insert({
        title: title.trim(),
        category_id,
        amount: parseFloat(amount),
        date,
        status,
        receipt_url: receipt_url || null,
        added_by: userId,
      })
      .select(`
        *,
        expense_categories (
          category_id,
          category_name,
          description
        )
      `)
      .single();

    if (error) {
      console.error('Error creating expense:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create expense',
        error: 'CREATE_EXPENSE_ERROR',
        timestamp: new Date(),
      });
    }

    res.status(201).json({
      success: true,
      message: 'Expense created successfully',
      data,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create expense',
      error: 'CREATE_EXPENSE_ERROR',
      timestamp: new Date(),
    });
  }
});

router.get('/:id', authenticate, requirePermission('view_expenses'), (_req, res) => {
  res.json({ success: true, message: 'Get expense by ID endpoint - Coming soon', timestamp: new Date() });
});

router.put('/:id', authenticate, requirePermission('manage_expenses'), (_req, res) => {
  res.json({ success: true, message: 'Update expense endpoint - Coming soon', timestamp: new Date() });
});

router.delete('/:id', authenticate, requirePermission('manage_expenses'), (_req, res) => {
  res.json({ success: true, message: 'Delete expense endpoint - Coming soon', timestamp: new Date() });
});

export default router;
