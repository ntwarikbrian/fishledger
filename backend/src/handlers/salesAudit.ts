/**
 * Sales Audit Trail Handlers
 * Manages audit logging for sales-related operations
 */

import { z } from 'zod';
import type { HonoContext } from '../types/index';
import {
  createErrorResponse,
  createValidationErrorResponse,
} from '../utils/response';
import { getUserIdFromContext } from '../middleware/data-isolation';

// Validation schemas
const createAuditSchema = z.object({
  sale_id: z.string().uuid('Invalid sale ID'),
  audit_type: z.enum(['quantity_change', 'payment_method_change', 'deletion']),
  boxes_change: z.number().int().default(0),
  kg_change: z.number().default(0),
  reason: z.string().min(1, 'Reason is required').max(500, 'Reason too long'),
  old_values: z.record(z.any()).optional(),
  new_values: z.record(z.any()).optional(),
});

const getAuditsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sale_id: z.string().uuid().optional(),
  audit_type: z.enum(['quantity_change', 'payment_method_change', 'deletion']).optional(),
  approval_status: z.enum(['pending', 'approved', 'rejected']).optional(),
});

const approveAuditSchema = z.object({
  approval_reason: z.string().min(1, 'Approval reason is required').max(500, 'Reason too long'),
});

const rejectAuditSchema = z.object({
  approval_reason: z.string().min(1, 'Rejection reason is required').max(500, 'Reason too long'),
});

/**
 * Create a new audit record
 */
export const createAuditHandler = async (c: HonoContext) => {
  try {
    const body = await c.req.json();

    const validation = createAuditSchema.safeParse(body);
    if (!validation.success) {
      const errors = validation.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return c.json(createValidationErrorResponse(errors, c.get('requestId')), 400);
    }

    const auditData = validation.data;
    const userId = c.get('user')?.id;

    if (!userId) {
      return c.json(createErrorResponse('User not authenticated', 401, undefined, c.get('requestId')), 401);
    }

    // Insert audit record with data isolation
    const currentUserId = getUserIdFromContext(c);
    const { data: newAudit, error } = await c.get('supabase')
      .from('sales_audit')
      .insert({
        user_id: currentUserId, // Add user_id for data isolation
        sale_id: auditData.sale_id,
        audit_type: auditData.audit_type,
        boxes_change: auditData.boxes_change,
        kg_change: auditData.kg_change,
        reason: auditData.reason,
        performed_by: userId,
        old_values: auditData.old_values,
        new_values: auditData.new_values,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create audit record:', error);
      return c.json(createErrorResponse('Failed to create audit record', 500, undefined, c.get('requestId')), 500);
    }

    return c.json({
      success: true,
      data: newAudit,
      message: 'Audit record created successfully',
      timestamp: new Date().toISOString(),
      requestId: c.get('requestId'),
    }, 201);

  } catch (error) {
    console.error('Error in createAuditHandler:', error);
    return c.json(createErrorResponse('Internal server error', 500, undefined, c.get('requestId')), 500);
  }
};

/**
 * Get audit records with pagination and filtering
 */
export const getAuditsHandler = async (c: HonoContext) => {
  try {
    console.log('getAuditsHandler called'); // Debug log
    const query = c.req.query();
    console.log('Query params:', query); // Debug log

    const validation = getAuditsSchema.safeParse(query);

    if (!validation.success) {
      console.log('Validation failed:', validation.error); // Debug log
      const errors = validation.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return c.json(createValidationErrorResponse(errors, c.get('requestId')), 400);
    }

    const { page, limit, sale_id, audit_type, approval_status } = validation.data;
    const offset = (page - 1) * limit;
    console.log('Validated params:', { page, limit, sale_id, audit_type, approval_status }); // Debug log

    // Get current user for data isolation
    const userId = getUserIdFromContext(c);
    console.log('Current user ID for data isolation:', userId); // Debug log

    // Build query with data isolation - only show audits that belong to the current user
    let query_builder = c.get('supabase')
      .from('sales_audit')
      .select(`
        audit_id,
        timestamp,
        sale_id,
        audit_type,
        boxes_change,
        kg_change,
        reason,
        performed_by,
        approval_status,
        approved_by,
        approval_timestamp,
        approval_reason,
        old_values,
        new_values,
        created_at,
        updated_at
      `, { count: 'exact' })
      .eq('user_id', userId); // Apply data isolation filter

    // Apply filters
    if (sale_id) {
      query_builder = query_builder.eq('sale_id', sale_id);
    }
    if (audit_type) {
      query_builder = query_builder.eq('audit_type', audit_type);
    }
    if (approval_status) {
      query_builder = query_builder.eq('approval_status', approval_status);
    }

    // Apply pagination and ordering
    console.log('Executing Supabase query...'); // Debug log
    const { data: audits, error, count } = await query_builder
      .order('timestamp', { ascending: false })
      .range(offset, offset + limit - 1);

    console.log('Supabase query result:', { audits, error, count }); // Debug log

    if (error) {
      console.error('Failed to fetch audit records:', error);
      return c.json(createErrorResponse('Failed to fetch audit records', 500, { supabaseError: error }, c.get('requestId')), 500);
    }

    // Enrich audit data with user and product information
    const enrichedAudits = await Promise.all((audits || []).map(async (audit) => {
      // Get user information for performed_by
      const { data: performedByUser } = await c.get('supabase')
        .from('users')
        .select('user_id, owner_name, business_name')
        .eq('user_id', audit.performed_by)
        .single();

      // Get user information for approved_by if exists
      let approvedByUser = null;
      if (audit.approved_by) {
        const { data: approver } = await c.get('supabase')
          .from('users')
          .select('user_id, owner_name, business_name')
          .eq('user_id', audit.approved_by)
          .single();
        approvedByUser = approver;
      }

      // Get product information from old_values if available
      let productInfo = null;
      if (audit.old_values && audit.old_values.product_id) {
        const { data: product } = await c.get('supabase')
          .from('products')
          .select('product_id, name')
          .eq('product_id', audit.old_values.product_id)
          .single();
        productInfo = product;
      }

      // For deleted sales, get sale info from old_values
      let saleInfo = null;
      if (audit.sale_id === null && audit.old_values) {
        // Sale was deleted, use data from old_values
        saleInfo = {
          id: audit.old_values.id || 'DELETED',
          client_name: audit.old_values.client_name || 'Unknown Client',
          total_amount: audit.old_values.total_amount || 0,
          payment_status: audit.old_values.payment_status || 'unknown',
          deleted: true
        };
      }

      return {
        ...audit,
        performed_by_user: performedByUser,
        approved_by_user: approvedByUser,
        product_info: productInfo,
        sale_info: saleInfo
      };
    }));

    // Create the response object
    const responseData = {
      success: true,
      data: enrichedAudits,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
        hasNext: page < Math.ceil((count || 0) / limit),
        hasPrev: page > 1,
      },
      timestamp: new Date().toISOString(),
      requestId: c.get('requestId'),
    };

    console.log('Returning response:', responseData); // Debug log
    return c.json(responseData);

  } catch (error) {
    console.error('Error in getAuditsHandler:', error);
    return c.json(createErrorResponse('Internal server error', 500, undefined, c.get('requestId')), 500);
  }
};

/**
 * Approve an audit record
 */
export const approveAuditHandler = async (c: HonoContext) => {
  try {
    console.log('🔍 approveAuditHandler started');
    const auditId = c.req.param('id');
    console.log('📋 Audit ID:', auditId);

    const body = await c.req.json();
    console.log('📝 Request body:', body);

    if (!auditId) {
      console.log('❌ No audit ID provided');
      return c.json(createErrorResponse('Audit ID is required', 400, undefined, c.get('requestId')), 400);
    }

    const validation = approveAuditSchema.safeParse(body);
    if (!validation.success) {
      console.log('❌ Validation failed:', validation.error);
      const errors = validation.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return c.json(createValidationErrorResponse(errors, c.get('requestId')), 400);
    }

    const { approval_reason } = validation.data;
    const userId = c.get('user')?.id;
    console.log('👤 User ID:', userId);

    if (!userId) {
      console.log('❌ User not authenticated');
      return c.json(createErrorResponse('User not authenticated', 401, undefined, c.get('requestId')), 401);
    }

    // Get full audit record with data isolation - only allow approving own audit records
    const currentUserId = getUserIdFromContext(c);
    console.log('🔒 Current user ID for data isolation:', currentUserId);

    console.log('🔍 Fetching audit record...');
    const { data: auditRecord, error: fetchError } = await c.get('supabase')
      .from('sales_audit')
      .select('*')
      .eq('audit_id', auditId)
      .eq('user_id', currentUserId) // Apply data isolation filter
      .single();

    console.log('📊 Audit record fetch result:', { auditRecord, fetchError });

    if (fetchError || !auditRecord) {
      console.log('❌ Audit record not found');
      return c.json(createErrorResponse('Audit record not found', 404, undefined, c.get('requestId')), 404);
    }

    if (auditRecord.approval_status !== 'pending') {
      console.log('❌ Audit record already processed:', auditRecord.approval_status);
      return c.json(createErrorResponse('Audit record has already been processed', 400, undefined, c.get('requestId')), 400);
    }

    console.log('⚙️ Executing audit type:', auditRecord.audit_type);
    // Execute the actual sale changes based on audit type
    let executionResult = null;

    if (auditRecord.audit_type === 'deletion') {
      console.log('🗑️ Executing sale deletion...');
      executionResult = await executeSaleDeletion(c, auditRecord);
    } else if (auditRecord.audit_type === 'quantity_change' || auditRecord.audit_type === 'payment_method_change') {
      console.log('📝 Executing sale update...');
      executionResult = await executeSaleUpdate(c, auditRecord);
    }

    console.log('📊 Execution result:', executionResult);

    if (!executionResult || !executionResult.success) {
      console.log('❌ Execution failed:', executionResult?.error);
      return c.json(createErrorResponse(
        `Failed to execute ${auditRecord.audit_type}: ${executionResult?.error || 'Unknown error'}`,
        500,
        undefined,
        c.get('requestId')
      ), 500);
    }

    console.log('✅ Execution successful, updating audit record...');
    // Update audit record with approval after successful execution
    const { data: updatedAudit, error: updateError } = await c.get('supabase')
      .from('sales_audit')
      .update({
        approval_status: 'approved',
        approved_by: userId,
        approval_timestamp: new Date().toISOString(),
        approval_reason: approval_reason,
      })
      .eq('audit_id', auditId)
      .select()
      .single();

    console.log('📊 Audit update result:', { updatedAudit, updateError });

    if (updateError) {
      console.error('❌ Failed to approve audit record:', updateError);
      return c.json(createErrorResponse('Failed to approve audit record', 500, undefined, c.get('requestId')), 500);
    }

    console.log('✅ Audit approval completed successfully');
    return c.json({
      success: true,
      data: {
        audit: updatedAudit,
        execution: executionResult.data
      },
      message: `${auditRecord.audit_type} approved and executed successfully`,
      timestamp: new Date().toISOString(),
      requestId: c.get('requestId'),
    });

  } catch (error) {
    console.error('💥 Error in approveAuditHandler:', error);
    return c.json(createErrorResponse('Internal server error', 500, undefined, c.get('requestId')), 500);
  }
};

/**
 * Reject an audit record
 */
export const rejectAuditHandler = async (c: HonoContext) => {
  try {
    const auditId = c.req.param('id');
    const body = await c.req.json();

    if (!auditId) {
      return c.json(createErrorResponse('Audit ID is required', 400, undefined, c.get('requestId')), 400);
    }

    const validation = rejectAuditSchema.safeParse(body);
    if (!validation.success) {
      const errors = validation.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return c.json(createValidationErrorResponse(errors, c.get('requestId')), 400);
    }

    const { approval_reason } = validation.data;
    const userId = c.get('user')?.id;

    if (!userId) {
      return c.json(createErrorResponse('User not authenticated', 401, undefined, c.get('requestId')), 401);
    }

    // Check if audit record exists and is pending with data isolation
    const currentUserId = getUserIdFromContext(c);
    const { data: existingAudit, error: fetchError } = await c.get('supabase')
      .from('sales_audit')
      .select('audit_id, approval_status')
      .eq('audit_id', auditId)
      .eq('user_id', currentUserId) // Apply data isolation filter
      .single();

    if (fetchError || !existingAudit) {
      return c.json(createErrorResponse('Audit record not found', 404, undefined, c.get('requestId')), 404);
    }

    if (existingAudit.approval_status !== 'pending') {
      return c.json(createErrorResponse('Audit record has already been processed', 400, undefined, c.get('requestId')), 400);
    }

    // Update audit record with rejection
    const { data: updatedAudit, error: updateError } = await c.get('supabase')
      .from('sales_audit')
      .update({
        approval_status: 'rejected',
        approved_by: userId,
        approval_timestamp: new Date().toISOString(),
        approval_reason: approval_reason,
      })
      .eq('audit_id', auditId)
      .select()
      .single();

    if (updateError) {
      console.error('Failed to reject audit record:', updateError);
      return c.json(createErrorResponse('Failed to reject audit record', 500, undefined, c.get('requestId')), 500);
    }

    return c.json({
      success: true,
      data: updatedAudit,
      message: 'Audit record rejected successfully',
      timestamp: new Date().toISOString(),
      requestId: c.get('requestId'),
    });

  } catch (error) {
    console.error('Error in rejectAuditHandler:', error);
    return c.json(createErrorResponse('Internal server error', 500, undefined, c.get('requestId')), 500);
  }
};

/**
 * Utility function to create audit records (used by other handlers)
 */
export const createAuditRecord = async (
  supabase: any,
  saleId: string,
  auditType: 'quantity_change' | 'payment_method_change' | 'deletion',
  reason: string,
  performedBy: string,
  userId: string, // Add userId parameter for data isolation
  options: {
    boxesChange?: number;
    kgChange?: number;
    oldValues?: Record<string, any>;
    newValues?: Record<string, any>;
  } = {}
) => {
  try {
    // Validate audit data before insertion
    const boxesChange = options.boxesChange || 0;
    const kgChange = options.kgChange || 0;

    // For quantity_change audits, ensure at least one quantity changed
    if (auditType === 'quantity_change' && boxesChange === 0 && kgChange === 0) {
      console.error('Invalid quantity_change audit: both boxes_change and kg_change are zero');
      return false;
    }

    // For payment_method_change audits, ensure no quantity changes
    if (auditType === 'payment_method_change' && (boxesChange !== 0 || kgChange !== 0)) {
      console.error('Invalid payment_method_change audit: should not have quantity changes');
      return false;
    }

    // For deletion audits, ensure no quantity changes
    if (auditType === 'deletion' && (boxesChange !== 0 || kgChange !== 0)) {
      console.error('Invalid deletion audit: should not have quantity changes');
      return false;
    }

    const auditData = {
      user_id: userId, // Add user_id for data isolation
      sale_id: saleId,
      audit_type: auditType,
      boxes_change: boxesChange,
      kg_change: kgChange,
      reason,
      performed_by: performedBy,
      old_values: options.oldValues,
      new_values: options.newValues,
    };

    console.log('Inserting audit record:', auditData);

    const { error } = await supabase
      .from('sales_audit')
      .insert(auditData);

    if (error) {
      console.error('Failed to create audit record:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error creating audit record:', error);
    return false;
  }
};

/**
 * Execute sale deletion when audit is approved
 */
const executeSaleDeletion = async (c: HonoContext, auditRecord: any) => {
  try {
    const saleId = auditRecord.sale_id;
    const oldValues = auditRecord.old_values;

    if (!oldValues) {
      return { success: false, error: 'No sale data found in audit record' };
    }

    // Get current product stock for restoration
    const { data: product, error: productError } = await c.get('supabase')
      .from('products')
      .select('product_id, quantity_box, quantity_kg')
      .eq('product_id', oldValues.product_id)
      .single();

    if (productError || !product) {
      return { success: false, error: 'Product not found for stock restoration' };
    }

    // Restore stock
    const restoredBoxQuantity = product.quantity_box + oldValues.boxes_quantity;
    const restoredKgQuantity = product.quantity_kg + oldValues.kg_quantity;

    const { error: stockRestoreError } = await c.get('supabase')
      .from('products')
      .update({
        quantity_box: restoredBoxQuantity,
        quantity_kg: restoredKgQuantity,
        updated_at: new Date().toISOString(),
      })
      .eq('product_id', oldValues.product_id);

    if (stockRestoreError) {
      return { success: false, error: `Failed to restore stock: ${stockRestoreError.message}` };
    }

    // Delete the sale
    const { error: deleteError } = await c.get('supabase')
      .from('sales')
      .delete()
      .eq('id', saleId);

    if (deleteError) {
      return { success: false, error: `Failed to delete sale: ${deleteError.message}` };
    }

    return {
      success: true,
      data: {
        deleted: true,
        sale_id: saleId,
        stock_restored: {
          boxes: oldValues.boxes_quantity,
          kg: oldValues.kg_quantity
        }
      }
    };
  } catch (error) {
    console.error('Error executing sale deletion:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

/**
 * Execute sale update when audit is approved
 */
const executeSaleUpdate = async (c: HonoContext, auditRecord: any) => {
  try {
    console.log('🔧 executeSaleUpdate started');
    const saleId = auditRecord.sale_id;
    const oldValues = auditRecord.old_values;
    const newValues = auditRecord.new_values;

    console.log('📊 Sale update data:', { saleId, oldValues, newValues });

    if (!oldValues || !newValues) {
      console.log('❌ Missing sale data in audit record');
      return { success: false, error: 'No sale data found in audit record' };
    }

    // Get current product data for stock calculations
    const { data: product, error: productError } = await c.get('supabase')
      .from('products')
      .select('product_id, name, quantity_box, quantity_kg, box_to_kg_ratio, price_per_box, price_per_kg')
      .eq('product_id', oldValues.product_id)
      .single();

    if (productError || !product) {
      return { success: false, error: 'Product not found' };
    }

    // Prepare update data with proper calculations
    let finalUpdateData = { ...newValues };

    // Handle quantity changes if they exist
    if (auditRecord.audit_type === 'quantity_change') {
      const newBoxes = newValues.boxes_quantity ?? oldValues.boxes_quantity;
      const newKg = newValues.kg_quantity ?? oldValues.kg_quantity;

      // Recalculate total amount if quantities changed
      const newTotalAmount = (newBoxes * oldValues.box_price) + (newKg * oldValues.kg_price);
      const newAmountPaid = newValues.amount_paid ?? oldValues.amount_paid ?? 0;
      const newRemainingAmount = (newValues.payment_status === 'paid') ? 0 : newTotalAmount - newAmountPaid;

      finalUpdateData = {
        ...finalUpdateData,
        boxes_quantity: newBoxes,
        kg_quantity: newKg,
        total_amount: newTotalAmount,
        amount_paid: newAmountPaid,
        remaining_amount: newRemainingAmount,
      };

      // Update inventory
      const finalBoxQuantity = product.quantity_box + oldValues.boxes_quantity - newBoxes;
      const finalKgQuantity = product.quantity_kg + oldValues.kg_quantity - newKg;

      const { error: stockUpdateError } = await c.get('supabase')
        .from('products')
        .update({
          quantity_box: finalBoxQuantity,
          quantity_kg: finalKgQuantity,
          updated_at: new Date().toISOString(),
        })
        .eq('product_id', oldValues.product_id);

      if (stockUpdateError) {
        return { success: false, error: `Failed to update product stock: ${stockUpdateError.message}` };
      }
    } else if (auditRecord.audit_type === 'payment_method_change') {
      // Only payment method changed, update payment method
      finalUpdateData = {
        ...finalUpdateData,
        payment_method: newValues.payment_method ?? oldValues.payment_method,
      };
    }

    // Update the sale record
    const { data: updatedSale, error: updateError } = await c.get('supabase')
      .from('sales')
      .update(finalUpdateData)
      .eq('id', saleId)
      .select('*')
      .single();

    if (updateError) {
      return { success: false, error: `Failed to update sale: ${updateError.message}` };
    }

    return {
      success: true,
      data: {
        updated: true,
        sale: updatedSale,
        changes_applied: finalUpdateData
      }
    };
  } catch (error) {
    console.error('Error executing sale update:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};
