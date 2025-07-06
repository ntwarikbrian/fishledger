/**
 * Categories Routes
 * Handles product category management operations
 */

import express from 'express';
import { authenticate, requirePermission } from '../middleware/auth.js';
import { supabaseClient } from '../config/supabase-client.js';

const router = express.Router();

/**
 * @route   GET /api/categories
 * @desc    Get all product categories
 * @access  Private
 */
router.get('/', authenticate, requirePermission('view_inventory'), async (_req, res) => {
  try {
    const { data: categories, error } = await supabaseClient
      .from('product_categories')
      .select('category_id, name, description, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      message: 'Categories retrieved successfully',
      data: categories || [],
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: 'FETCH_CATEGORIES_ERROR',
      timestamp: new Date(),
    });
  }
});

/**
 * @route   POST /api/categories
 * @desc    Create new product category
 * @access  Private
 */
router.post('/', authenticate, requirePermission('manage_inventory'), async (req, res) => {
  try {
    const { name, description } = req.body;

    // Validate required fields
    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Category name is required',
        error: 'VALIDATION_ERROR',
        timestamp: new Date(),
      });
    }

    // Check if category already exists
    const { data: existingCategory } = await supabaseClient
      .from('product_categories')
      .select('category_id')
      .eq('name', name.trim())
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
      .from('product_categories')
      .insert({
        name: name.trim(),
        description: description?.trim() || null,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: newCategory,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create category',
      error: 'CREATE_CATEGORY_ERROR',
      timestamp: new Date(),
    });
  }
});

/**
 * @route   PUT /api/categories/:id
 * @desc    Update product category
 * @access  Private
 */
router.put('/:id', authenticate, requirePermission('manage_inventory'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    // Validate required fields
    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Category name is required',
        error: 'VALIDATION_ERROR',
        timestamp: new Date(),
      });
    }

    // Check if category exists
    const { data: existingCategory } = await supabaseClient
      .from('product_categories')
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

    // Check if another category with the same name exists (excluding current category)
    const { data: duplicateCategory } = await supabaseClient
      .from('product_categories')
      .select('category_id')
      .eq('name', name.trim())
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
      .from('product_categories')
      .update({
        name: name.trim(),
        description: description?.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('category_id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      message: 'Category updated successfully',
      data: updatedCategory,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update category',
      error: 'UPDATE_CATEGORY_ERROR',
      timestamp: new Date(),
    });
  }
});

/**
 * @route   DELETE /api/categories/:id
 * @desc    Delete product category
 * @access  Private
 */
router.delete('/:id', authenticate, requirePermission('manage_inventory'), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if category exists
    const { data: existingCategory } = await supabaseClient
      .from('product_categories')
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

    // Check if category is being used by any products
    const { data: productsUsingCategory } = await supabaseClient
      .from('products')
      .select('product_id')
      .eq('category_id', id)
      .limit(1);

    if (productsUsingCategory && productsUsingCategory.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Cannot delete category that is being used by products',
        error: 'CATEGORY_IN_USE',
        timestamp: new Date(),
      });
    }

    // Delete category
    const { error } = await supabaseClient
      .from('product_categories')
      .delete()
      .eq('category_id', id);

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      message: 'Category deleted successfully',
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete category',
      error: 'DELETE_CATEGORY_ERROR',
      timestamp: new Date(),
    });
  }
});

export default router;
