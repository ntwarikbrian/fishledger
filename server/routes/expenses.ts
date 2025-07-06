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

router.get('/', authenticate, requirePermission('view_expenses'), (_req, res) => {
  res.json({ success: true, message: 'Expenses endpoint - Coming soon', timestamp: new Date() });
});

router.post('/', authenticate, requirePermission('manage_expenses'), (_req, res) => {
  res.json({ success: true, message: 'Create expense endpoint - Coming soon', timestamp: new Date() });
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
