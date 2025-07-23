/**
 * Contacts handlers for CRUD operations
 * Provides endpoints for managing customer and supplier contacts
 */

import { z } from 'zod';
import type { HonoContext, PaginationParams } from '../types/index';
import {
  createSuccessResponse,
  createErrorResponse,
  createValidationErrorResponse,
  createPaginatedResponse,
  createNotFoundResponse,
  calculatePagination,
} from '../utils/response';
import {
  applyPagination,
  applySearch,
  getTotalCount,
  recordExists,
} from '../utils/db';

// Validation schemas (simplified for new schema)
const createContactSchema = z.object({
  contact_name: z.string().min(1, 'Contact name is required').max(200, 'Contact name too long'),
  email: z.string().email('Invalid email format').max(255, 'Email too long').optional(),
  phone_number: z.string().max(20, 'Phone number too long').optional(),
  contact_type: z.enum(['supplier', 'customer'], { required_error: 'Contact type is required' }),
});

const updateContactSchema = createContactSchema.partial();

const getContactsQuerySchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('10'),
  sortBy: z.string().default('contact_name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  search: z.string().optional(),
  contact_type: z.enum(['supplier', 'customer']).optional(),
});

/**
 * Get all contacts with pagination and filtering
 */
export const getContactsHandler = async (c: HonoContext) => {
  try {
    const queryParams = c.req.query();

    const validation = getContactsQuerySchema.safeParse(queryParams);
    if (!validation.success) {
      const errors = validation.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return c.json(createValidationErrorResponse(errors, c.get('requestId')), 400);
    }

    const { page, limit, sortBy, sortOrder, search, contact_type } = validation.data;

    // Build query
    let query = c.get('supabase')
      .from('contacts')
      .select('*');

    // Apply filters
    if (contact_type) {
      query = query.eq('contact_type', contact_type);
    }

    // Apply search (updated for simplified schema)
    if (search) {
      query = applySearch(query, search, ['contact_name', 'email']);
    }

    // Get total count
    const totalCount = await getTotalCount(c.get('supabase'), 'contacts',
      contact_type ? { contact_type } : {});

    // Apply pagination
    query = applyPagination(query, { page, limit, sortBy, sortOrder });

    const { data: contacts, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch contacts: ${error.message}`);
    }

    const pagination = calculatePagination(page, limit, totalCount);

    return createPaginatedResponse(
      contacts || [],
      pagination,
      c.get('requestId'),
    );

  } catch (error) {
    console.error('Get contacts error:', error);
    return c.json(createErrorResponse('Failed to retrieve contacts', 500, { error: error instanceof Error ? error.message : 'Unknown error' }, c.get('requestId')), 500);
  }
};

/**
 * Get a single contact by ID
 */
export const getContactHandler = async (c: HonoContext) => {
  try {
    const id = c.req.param('id');

    if (!id) {
      return c.json(createErrorResponse('Contact ID is required', 400, undefined, c.get('requestId')), 400);
    }

    const { data: contact, error } = await c.get('supabase')
      .from('contacts')
      .select('*')
      .eq('contact_id', id)
      .single();

    if (error && error.code === 'PGRST116') {
      return c.json(createNotFoundResponse('Contact', c.get('requestId')), 404);
    }

    if (error) {
      throw new Error(`Failed to fetch contact: ${error.message}`);
    }

    return c.json(createSuccessResponse(contact, 'Contact retrieved successfully', c.get('requestId')));

  } catch (error) {
    console.error('Get contact error:', error);
    return c.json(createErrorResponse('Failed to retrieve contact', 500, { error: error instanceof Error ? error.message : 'Unknown error' }, c.get('requestId')), 500);
  }
};

/**
 * Create a new contact
 */
export const createContactHandler = async (c: HonoContext) => {
  try {
    const body = await c.req.json();

    const validation = createContactSchema.safeParse(body);
    if (!validation.success) {
      const errors = validation.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return c.json(createValidationErrorResponse(errors, c.get('requestId')), 400);
    }

    const contactData = validation.data;
    const user = c.get('user');

    // Ensure user is authenticated
    if (!user || !user.id) {
      return c.json(createErrorResponse('User authentication required', 401, undefined, c.get('requestId')), 401);
    }

    // Check if email already exists (if provided)
    if (contactData.email) {
      const { data: existingContact } = await c.get('supabase')
        .from('contacts')
        .select('contact_id')
        .eq('email', contactData.email)
        .single();

      if (existingContact) {
        return c.json(createErrorResponse('Email already exists', 409, { error: 'A contact with this email already exists' }, c.get('requestId')), 409);
      }
    }

    // Create contact (removed unused fields)
    const { data: newContact, error } = await c.get('supabase')
      .from('contacts')
      .insert({
        ...contactData,
        user_id: user.id,
        added_by: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create contact: ${error.message}`);
    }

    return c.json({
      success: true,
      message: 'Contact created successfully',
      data: newContact,
      requestId: c.get('requestId'),
    }, 201);

  } catch (error) {
    console.error('Create contact error:', error);
    return c.json(createErrorResponse('Failed to create contact', 500, { error: error instanceof Error ? error.message : 'Unknown error' }, c.get('requestId')), 500);
  }
};

/**
 * Update an existing contact
 */
export const updateContactHandler = async (c: HonoContext) => {
  try {
    const id = c.req.param('id');

    if (!id) {
      return c.json(createErrorResponse('Contact ID is required', 400, undefined, c.get('requestId')), 400);
    }

    const body = await c.req.json();

    const validation = updateContactSchema.safeParse(body);
    if (!validation.success) {
      const errors = validation.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return c.json(createValidationErrorResponse(errors, c.get('requestId')), 400);
    }

    const updateData = validation.data;

    // Check if contact exists
    const contactExists = await recordExists(c.get('supabase'), 'contacts', id, 'contact_id');
    if (!contactExists) {
      return c.json(createNotFoundResponse('Contact', c.get('requestId')), 404);
    }

    // Check if new email conflicts (if email is being updated)
    if (updateData.email) {
      const { data: existingContact } = await c.get('supabase')
        .from('contacts')
        .select('contact_id')
        .eq('email', updateData.email)
        .neq('contact_id', id)
        .single();

      if (existingContact) {
        return c.json(createErrorResponse('Email already exists', 409, { error: 'A contact with this email already exists' }, c.get('requestId')), 409);
      }
    }

    // Update contact
    const { data: updatedContact, error } = await c.get('supabase')
      .from('contacts')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('contact_id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update contact: ${error.message}`);
    }

    return c.json(createSuccessResponse(updatedContact, 'Contact updated successfully', c.get('requestId')));

  } catch (error) {
    console.error('Update contact error:', error);
    return c.json(createErrorResponse('Failed to update contact', 500, { error: error instanceof Error ? error.message : 'Unknown error' }, c.get('requestId')), 500);
  }
};

/**
 * Delete a contact
 */
export const deleteContactHandler = async (c: HonoContext) => {
  try {
    const id = c.req.param('id');

    if (!id) {
      return c.json(createErrorResponse('Contact ID is required', 400, undefined, c.get('requestId')), 400);
    }

    // Check if contact exists
    const contactExists = await recordExists(c.get('supabase'), 'contacts', id, 'contact_id');
    if (!contactExists) {
      return c.json(createNotFoundResponse('Contact', c.get('requestId')), 404);
    }

    // Delete contact
    const { error } = await c.get('supabase')
      .from('contacts')
      .delete()
      .eq('contact_id', id);

    if (error) {
      throw new Error(`Failed to delete contact: ${error.message}`);
    }

    return c.json(createSuccessResponse(
      { deleted: true, contact_id: id },
      'Contact deleted successfully',
      c.get('requestId'),
    ));

  } catch (error) {
    console.error('Delete contact error:', error);
    return c.json(createErrorResponse('Failed to delete contact', 500, { error: error instanceof Error ? error.message : 'Unknown error' }, c.get('requestId')), 500);
  }
};
