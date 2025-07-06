/**
 * Contact Routes
 * Handles contact management endpoints for fish selling business
 */

import { Router, Request, Response } from 'express';
import { authenticate, requirePermission } from '../middleware/auth.js';
import { supabaseClient } from '../config/supabase-client.js';
import { z } from 'zod';

const router = Router();

/**
 * Validation schemas for contact operations with enhanced validation
 */
const createContactSchema = z.object({
  company_name: z.string()
    .max(200, 'Company name must be less than 200 characters')
    .optional()
    .or(z.literal('')),
  contact_name: z.string()
    .min(2, 'Contact name must be at least 2 characters long')
    .max(200, 'Contact name must be less than 200 characters')
    .trim(),
  email: z.string()
    .email('Please enter a valid email address')
    .max(255, 'Email must be less than 255 characters')
    .optional()
    .or(z.literal('')),
  phone_number: z.string()
    .max(20, 'Phone number must be less than 20 characters')
    .optional()
    .or(z.literal('')),
  contact_type: z.enum(['supplier', 'customer'], {
    required_error: 'Contact type must be either supplier or customer'
  }),
  address: z.string()
    .max(500, 'Address must be less than 500 characters')
    .optional()
    .or(z.literal(''))
});

const updateContactSchema = createContactSchema.partial();

const queryParamsSchema = z.object({
  contact_type: z.enum(['supplier', 'customer']).optional(),
  search: z.string().optional(),
  page: z.string().transform(Number).optional(),
  limit: z.string().transform(Number).optional(),
  sort_by: z.enum(['contact_name', 'company_name', 'contact_type']).optional(),
  sort_order: z.enum(['ASC', 'DESC']).optional()
});

/**
 * @route   GET /api/contacts
 * @desc    Get all contacts with optional filtering and pagination
 * @access  Private
 */
router.get('/', authenticate, requirePermission('view_contacts'), async (req: Request, res: Response): Promise<any> => {
  try {
    console.log('📞 GET /api/contacts - Fetching contacts');

    // Validate query parameters
    const queryValidation = queryParamsSchema.safeParse(req.query);
    if (!queryValidation.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        errors: queryValidation.error.errors
      });
    }

    const {
      contact_type,
      search,
      page = 1,
      limit = 50,
      sort_by = 'contact_name',
      sort_order = 'ASC'
    } = queryValidation.data;

    // Build Supabase query
    let query = supabaseClient
      .from('contacts')
      .select('*');

    // Apply filters
    if (contact_type) {
      query = query.eq('contact_type', contact_type);
    }

    if (search) {
      query = query.or(`contact_name.ilike.%${search}%,company_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    // Apply sorting
    query = query.order(sort_by, { ascending: sort_order === 'ASC' });

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data: contacts, error, count } = await query;

    if (error) {
      console.error('❌ Error fetching contacts:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch contacts',
        error: error.message
      });
    }

    console.log(`✅ Successfully fetched ${contacts?.length || 0} contacts`);

    res.json({
      success: true,
      data: contacts || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      },
      timestamp: new Date()
    });

  } catch (error) {
    console.error('❌ Unexpected error in GET /api/contacts:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route   POST /api/contacts
 * @desc    Create a new contact
 * @access  Private
 */
router.post('/', authenticate, requirePermission('manage_contacts'), async (req: Request, res: Response): Promise<any> => {
  try {
    console.log('📞 POST /api/contacts - Creating new contact');

    // Validate request body
    const validation = createContactSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid contact data',
        errors: validation.error.errors
      });
    }

    const contactData = validation.data;
    const userId = (req as any).user?.user_id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Check for duplicate email if provided
    if (contactData.email) {
      const { data: existingContact } = await supabaseClient
        .from('contacts')
        .select('contact_id')
        .eq('email', contactData.email)
        .single();

      if (existingContact) {
        return res.status(409).json({
          success: false,
          message: 'A contact with this email already exists'
        });
      }
    }

    // Create the contact with added_by field
    const contactWithUser = {
      ...contactData,
      added_by: userId
    };

    const { data: newContact, error } = await supabaseClient
      .from('contacts')
      .insert(contactWithUser)
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating contact:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create contact',
        error: error.message
      });
    }

    console.log('✅ Successfully created contact:', newContact.contact_id);

    res.status(201).json({
      success: true,
      message: 'Contact created successfully',
      data: newContact,
      timestamp: new Date()
    });

  } catch (error) {
    console.error('❌ Unexpected error in POST /api/contacts:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route   GET /api/contacts/:id
 * @desc    Get contact by ID
 * @access  Private
 */
router.get('/:id', authenticate, requirePermission('view_contacts'), async (req: Request, res: Response): Promise<any> => {
  try {
    console.log(`📞 GET /api/contacts/${req.params.id} - Fetching contact by ID`);

    const contactId = req.params.id;

    // Validate contact ID exists
    if (!contactId) {
      res.status(400).json({
        success: false,
        message: 'Contact ID is required'
      });
      return;
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(contactId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid contact ID format'
      });
    }

    const { data: contact, error } = await supabaseClient
      .from('contacts')
      .select('*')
      .eq('contact_id', contactId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'Contact not found'
        });
      }

      console.error('❌ Error fetching contact:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch contact',
        error: error.message
      });
    }

    console.log('✅ Successfully fetched contact:', contactId);

    res.json({
      success: true,
      data: contact,
      timestamp: new Date()
    });

  } catch (error) {
    console.error(`❌ Unexpected error in GET /api/contacts/${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route   PUT /api/contacts/:id
 * @desc    Update contact by ID
 * @access  Private
 */
router.put('/:id', authenticate, requirePermission('manage_contacts'), async (req: Request, res: Response): Promise<any> => {
  try {
    console.log(`📞 PUT /api/contacts/${req.params.id} - Updating contact`);

    const contactId = req.params.id;

    // Validate contact ID exists
    if (!contactId) {
      return res.status(400).json({
        success: false,
        message: 'Contact ID is required'
      });
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(contactId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid contact ID format'
      });
    }

    // Validate request body
    const validation = updateContactSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid contact data',
        errors: validation.error.errors
      });
    }

    const updateData = validation.data;

    // Check if contact exists
    const { error: fetchError } = await supabaseClient
      .from('contacts')
      .select('contact_id')
      .eq('contact_id', contactId)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'Contact not found'
        });
      }

      console.error('❌ Error checking contact existence:', fetchError);
      return res.status(500).json({
        success: false,
        message: 'Failed to verify contact',
        error: fetchError.message
      });
    }

    // Check for duplicate email if email is being updated
    if (updateData.email) {
      const { data: duplicateContact } = await supabaseClient
        .from('contacts')
        .select('contact_id')
        .eq('email', updateData.email)
        .neq('contact_id', contactId)
        .single();

      if (duplicateContact) {
        return res.status(409).json({
          success: false,
          message: 'A contact with this email already exists'
        });
      }
    }

    // Update the contact
    const { data: updatedContact, error: updateError } = await supabaseClient
      .from('contacts')
      .update(updateData)
      .eq('contact_id', contactId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error updating contact:', updateError);
      return res.status(500).json({
        success: false,
        message: 'Failed to update contact',
        error: updateError.message
      });
    }

    console.log('✅ Successfully updated contact:', contactId);

    res.json({
      success: true,
      message: 'Contact updated successfully',
      data: updatedContact,
      timestamp: new Date()
    });

  } catch (error) {
    console.error(`❌ Unexpected error in PUT /api/contacts/${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route   DELETE /api/contacts/:id
 * @desc    Delete contact by ID
 * @access  Private
 */
router.delete('/:id', authenticate, requirePermission('manage_contacts'), async (req: Request, res: Response): Promise<any> => {
  try {
    console.log(`📞 DELETE /api/contacts/${req.params.id} - Deleting contact`);

    const contactId = req.params.id;

    // Validate contact ID exists
    if (!contactId) {
      return res.status(400).json({
        success: false,
        message: 'Contact ID is required'
      });
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(contactId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid contact ID format'
      });
    }

    // Check if contact exists and get its data before deletion
    const { data: existingContact, error: fetchError } = await supabaseClient
      .from('contacts')
      .select('*')
      .eq('contact_id', contactId)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'Contact not found'
        });
      }

      console.error('❌ Error checking contact existence:', fetchError);
      return res.status(500).json({
        success: false,
        message: 'Failed to verify contact',
        error: fetchError.message
      });
    }

    // Delete the contact
    const { error: deleteError } = await supabaseClient
      .from('contacts')
      .delete()
      .eq('contact_id', contactId);

    if (deleteError) {
      console.error('❌ Error deleting contact:', deleteError);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete contact',
        error: deleteError.message
      });
    }

    console.log('✅ Successfully deleted contact:', contactId);

    res.json({
      success: true,
      message: 'Contact deleted successfully',
      data: existingContact,
      timestamp: new Date()
    });

  } catch (error) {
    console.error(`❌ Unexpected error in DELETE /api/contacts/${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
