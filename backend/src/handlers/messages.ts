/**
 * Messages handlers for email operations
 * Provides endpoints for sending emails using saved user credentials and managing message history
 */

import { z } from 'zod';
import type { HonoContext } from '../types/index';
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

// Validation schemas
const sendEmailSchema = z.object({
  recipient_ids: z.array(z.string().uuid(), { required_error: 'Recipient IDs are required' }).min(1, 'At least one recipient is required'),
  subject: z.string().min(1, 'Subject is required').max(200, 'Subject too long'),
  content: z.string().min(1, 'Message content is required'),
  message_type: z.enum(['email', 'internal']).default('email'),
});

const getMessagesQuerySchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('10'),
  sortBy: z.string().default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().optional(),
  status: z.enum(['sent', 'failed', 'pending']).optional(),
  recipient_type: z.enum(['contact', 'user', 'worker']).optional(),
});

/**
 * Send email to contacts using saved email credentials
 */
export const sendEmailHandler = async (c: HonoContext) => {
  try {
    const body = await c.req.json();

    const validation = sendEmailSchema.safeParse(body);
    if (!validation.success) {
      const errors = validation.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return c.json(createValidationErrorResponse(errors, c.get('requestId')), 400);
    }

    const { recipient_ids, subject, content, message_type } = validation.data;
    const user = c.get('user');

    // Ensure user is authenticated
    if (!user || !user.id) {
      return c.json(createErrorResponse('User authentication required', 401, undefined, c.get('requestId')), 401);
    }

    // Get user's email settings
    const { data: userSettings, error: settingsError } = await c.get('supabase')
      .from('user_settings')
      .select('email_address, email_name, app_password, email_host, email_port, use_tls')
      .eq('user_id', user.id)
      .single();

    if (settingsError || !userSettings) {
      return c.json(createErrorResponse('Email credentials not configured. Please configure your email settings first.', 400, undefined, c.get('requestId')), 400);
    }

    // Check if email credentials are complete
    if (!userSettings.email_address || !userSettings.app_password) {
      return c.json(createErrorResponse('Email credentials incomplete. Please configure your email address and app password in settings.', 400, undefined, c.get('requestId')), 400);
    }

    // Get recipient contacts
    const { data: contacts, error: contactsError } = await c.get('supabase')
      .from('contacts')
      .select('contact_id, contact_name, email')
      .in('contact_id', recipient_ids)
      .eq('user_id', user.id); // Ensure data isolation

    if (contactsError) {
      throw new Error(`Failed to fetch contacts: ${contactsError.message}`);
    }

    if (!contacts || contacts.length === 0) {
      return c.json(createErrorResponse('No valid contacts found', 404, undefined, c.get('requestId')), 404);
    }

    // Filter contacts with valid email addresses
    const validContacts = contacts.filter(contact => contact.email && contact.email.trim() !== '');
    
    if (validContacts.length === 0) {
      return c.json(createErrorResponse('No contacts with valid email addresses found', 400, undefined, c.get('requestId')), 400);
    }

    // Prepare messages for batch insert
    const messagesToInsert = validContacts.map(contact => ({
      user_id: user.id,
      recipient_id: contact.contact_id,
      recipient_type: 'contact' as const,
      recipient_email: contact.email,
      message_type,
      delivery_method: 'email' as const,
      subject,
      content,
      status: 'pending' as const,
      sent_by: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    // Insert messages into database
    const { data: insertedMessages, error: insertError } = await c.get('supabase')
      .from('messages')
      .insert(messagesToInsert)
      .select();

    if (insertError) {
      throw new Error(`Failed to save messages: ${insertError.message}`);
    }

    // Here you would implement the actual email sending logic
    // For now, we'll simulate successful sending and update the status
    const emailResults = [];
    
    for (const contact of validContacts) {
      try {
        // TODO: Implement actual email sending using the saved credentials
        // Example using a service like SendGrid, AWS SES, or direct SMTP
        
        // For now, simulate successful sending
        const success = await simulateEmailSending({
          to: contact.email!,
          from: userSettings.email_address,
          fromName: userSettings.email_name || 'System',
          subject,
          content,
          smtpConfig: {
            host: userSettings.email_host,
            port: userSettings.email_port,
            secure: userSettings.use_tls,
            // Note: In production, you'd decrypt the app_password here
            password: userSettings.app_password,
          }
        });

        emailResults.push({
          contact_id: contact.contact_id,
          contact_name: contact.contact_name,
          email: contact.email,
          status: success ? 'sent' : 'failed',
          error: success ? null : 'Simulated sending failed',
        });

        // Update message status in database
        if (insertedMessages) {
          const messageToUpdate = insertedMessages.find(msg => msg.recipient_id === contact.contact_id);
          if (messageToUpdate) {
            await c.get('supabase')
              .from('messages')
              .update({
                status: success ? 'sent' : 'failed',
                error_message: success ? null : 'Simulated sending failed',
                sent_at: success ? new Date().toISOString() : null,
                delivered_at: success ? new Date().toISOString() : null,
                updated_at: new Date().toISOString(),
              })
              .eq('message_id', messageToUpdate.message_id);
          }
        }

      } catch (error) {
        emailResults.push({
          contact_id: contact.contact_id,
          contact_name: contact.contact_name,
          email: contact.email,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    const successCount = emailResults.filter(result => result.status === 'sent').length;
    const failureCount = emailResults.filter(result => result.status === 'failed').length;

    return c.json(createSuccessResponse({
      total_recipients: validContacts.length,
      successful_sends: successCount,
      failed_sends: failureCount,
      results: emailResults,
      message_ids: insertedMessages?.map(msg => msg.message_id) || [],
    }, `Email sending completed. ${successCount} successful, ${failureCount} failed.`, c.get('requestId')), 200);

  } catch (error) {
    console.error('Send email error:', error);
    return c.json(createErrorResponse('Failed to send emails', 500, { error: error instanceof Error ? error.message : 'Unknown error' }, c.get('requestId')), 500);
  }
};

/**
 * Get message history with pagination and filtering
 */
export const getMessagesHandler = async (c: HonoContext) => {
  try {
    const queryParams = c.req.query();

    const validation = getMessagesQuerySchema.safeParse(queryParams);
    if (!validation.success) {
      const errors = validation.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return c.json(createValidationErrorResponse(errors, c.get('requestId')), 400);
    }

    const { page, limit, sortBy, sortOrder, search, status, recipient_type } = validation.data;

    // Build query
    let query = c.get('supabase')
      .from('messages')
      .select('*');

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }

    if (recipient_type) {
      query = query.eq('recipient_type', recipient_type);
    }

    // Apply search
    if (search) {
      query = applySearch(query, search, ['subject', 'content', 'recipient_email']);
    }

    // Get total count
    const totalCount = await getTotalCount(c.get('supabase'), 'messages', {
      ...(status && { status }),
      ...(recipient_type && { recipient_type }),
    });

    // Apply pagination
    query = applyPagination(query, { page, limit, sortBy, sortOrder });

    const { data: messages, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch messages: ${error.message}`);
    }

    const pagination = calculatePagination(page, limit, totalCount);

    return createPaginatedResponse(
      messages || [],
      pagination,
      c.get('requestId'),
    );

  } catch (error) {
    console.error('Get messages error:', error);
    return c.json(createErrorResponse('Failed to retrieve messages', 500, { error: error instanceof Error ? error.message : 'Unknown error' }, c.get('requestId')), 500);
  }
};

/**
 * Get a single message by ID
 */
export const getMessageHandler = async (c: HonoContext) => {
  try {
    const id = c.req.param('id');

    if (!id) {
      return c.json(createErrorResponse('Message ID is required', 400, undefined, c.get('requestId')), 400);
    }

    const { data: message, error } = await c.get('supabase')
      .from('messages')
      .select('*')
      .eq('message_id', id)
      .single();

    if (error && error.code === 'PGRST116') {
      return c.json(createNotFoundResponse('Message', c.get('requestId')), 404);
    }

    if (error) {
      throw new Error(`Failed to fetch message: ${error.message}`);
    }

    return c.json(createSuccessResponse(message, 'Message retrieved successfully', c.get('requestId')));

  } catch (error) {
    console.error('Get message error:', error);
    return c.json(createErrorResponse('Failed to retrieve message', 500, { error: error instanceof Error ? error.message : 'Unknown error' }, c.get('requestId')), 500);
  }
};

/**
 * Simulate email sending (replace with actual email service implementation)
 * @param emailData - Email data and configuration
 * @returns Promise resolving to boolean indicating success
 */
async function simulateEmailSending(emailData: {
  to: string;
  from: string;
  fromName: string;
  subject: string;
  content: string;
  smtpConfig: {
    host: string;
    port: number;
    secure: boolean;
    password: string;
  };
}): Promise<boolean> {
  // TODO: Replace this simulation with actual email sending logic
  // You could use services like:
  // - SendGrid API
  // - AWS SES
  // - Direct SMTP connection using nodemailer
  // - Cloudflare Email Workers
  
  console.log('Simulating email send to:', emailData.to);
  console.log('From:', emailData.from);
  console.log('Subject:', emailData.subject);
  
  // Simulate some processing time
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Simulate 90% success rate for demonstration
  return Math.random() > 0.1;
}
