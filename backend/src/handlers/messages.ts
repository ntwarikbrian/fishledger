/**
 * Messages handlers for email and WhatsApp operations
 * Provides endpoints for sending messages using saved user credentials and managing message history
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

// Type definitions
interface EmailSettings {
  email_address: string;
  email_name?: string;
  app_password: string;
  email_host: string;
  email_port: number;
  use_tls: boolean;
}

interface WhatsAppSettings {
  whapi_apikey: string;
  instance_id: string;
  whapi_phone_number: string;
  provider_url: string;
}

// Validation schemas
const sendMessageSchema = z.object({
  recipient_ids: z.array(z.string().uuid(), { required_error: 'Recipient IDs are required' }).min(1, 'At least one recipient is required'),
  subject: z.string().min(1, 'Subject is required').max(200, 'Subject too long'),
  content: z.string().min(1, 'Message content is required'),
  message_type: z.enum(['email', 'internal']).default('email'),
  delivery_method: z.enum(['email', 'whatsapp']).default('email'),
});

// For backward compatibility
const sendEmailSchema = sendMessageSchema;

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
 * Send message to contacts using saved credentials (email or WhatsApp)
 */
export const sendMessageHandler = async (c: HonoContext) => {
  try {
    const body = await c.req.json();
    console.log('Received message send request:', body);
    
    // Validate request body using the schema
    const validation = sendMessageSchema.safeParse(body);
    if (!validation.success) {
      const errResponse = validation.error.errors.map(err => ({
        field: err.path.map(String).join('.'),
        message: err.message,
      }));
      console.error('Validation failed:', errResponse);
      return c.json(
        createValidationErrorResponse(
          errResponse, 
          c.get('requestId')
        ), 
        400
      );
    }

    const { recipient_ids, subject, content, message_type, delivery_method } = validation.data;
    const user = c.get('user');

    // Ensure user is authenticated
    if (!user || !user.id) {
      return c.json(createErrorResponse('User authentication required', 401, undefined, c.get('requestId')), 401);
    }

    // Get user's settings based on delivery method
    let emailSettings: EmailSettings | null = null;
    let whatsAppSettings: WhatsAppSettings | null = null;

    if (delivery_method === 'email') {
      // Get email settings
      const result = await c.get('supabase')
        .from('user_settings')
        .select('email_address, email_name, app_password, email_host, email_port, use_tls')
        .eq('user_id', user.id)
        .single();
      
      if (result.error || !result.data) {
        return c.json(createErrorResponse('Email credentials not configured. Please configure your email settings first.', 400, undefined, c.get('requestId')), 400);
      }

      emailSettings = result.data as EmailSettings;

      // Check if email credentials are complete
      if (!emailSettings.email_address || !emailSettings.app_password) {
        return c.json(createErrorResponse('Email credentials incomplete. Please configure your email address and app password in settings.', 400, undefined, c.get('requestId')), 400);
      }
    } else if (delivery_method === 'whatsapp') {
      // Get WhatsApp settings
      const result = await c.get('supabase')
        .from('user_settings')
        .select('whapi_apikey, instance_id, whapi_phone_number, provider_url')
        .eq('user_id', user.id)
        .single();
      
      if (result.error || !result.data) {
        return c.json(createErrorResponse('WhatsApp credentials not configured. Please configure your WhatsApp settings first.', 400, undefined, c.get('requestId')), 400);
      }

      whatsAppSettings = result.data as WhatsAppSettings;

      // Check if WhatsApp credentials are complete
      if (!whatsAppSettings.whapi_apikey || !whatsAppSettings.instance_id || !whatsAppSettings.whapi_phone_number) {
        return c.json(createErrorResponse('WhatsApp credentials incomplete. Please configure your WhatsApp API key, instance ID, and phone number in settings.', 400, undefined, c.get('requestId')), 400);
      }
    }

    // Get recipient contacts
    const { data: contacts, error: contactsError } = await c.get('supabase')
      .from('contacts')
      .select('contact_id, contact_name, email, phone')
      .in('contact_id', recipient_ids)
      .eq('user_id', user.id); // Ensure data isolation

    if (contactsError) {
      console.error('Supabase contacts query error:', contactsError);
      throw new Error(`Failed to fetch contacts: ${contactsError.message}`);
    }

    if (!contacts || contacts.length === 0) {
      console.warn('No contacts found matching recipient IDs');
      return c.json(createErrorResponse('No valid contacts found', 404, undefined, c.get('requestId')), 404);
    }

    // Ensure all contact IDs are strings for consistent comparison
    const normalizedContacts = contacts.map(contact => ({
      ...contact,
      contact_id: String(contact.contact_id)
    }));

    // Filter contacts based on delivery method
    let validContacts;
    if (delivery_method === 'email') {
      // Filter contacts with valid email addresses
      validContacts = contacts.filter(contact => contact.email && contact.email.trim() !== '');
      if (validContacts.length === 0) {
        return c.json(createErrorResponse('No contacts with valid email addresses found', 400, undefined, c.get('requestId')), 400);
      }
    } else if (delivery_method === 'whatsapp') {
      // Filter contacts with valid phone numbers
      validContacts = contacts.filter(contact => contact.phone && contact.phone.trim() !== '');
      if (validContacts.length === 0) {
        return c.json(createErrorResponse('No contacts with valid phone numbers found', 400, undefined, c.get('requestId')), 400);
      }
    } else {
      return c.json(createErrorResponse('Invalid delivery method', 400, undefined, c.get('requestId')), 400);
    }

    // Prepare messages for batch insert
    const messagesToInsert = validContacts.map(contact => {
      // Ensure content is always a string
      const safeContent = typeof content === 'string' ? content : '';
      
      return {
        user_id: user.id,
        recipient_id: contact.contact_id,
        recipient_type: 'contact' as const,
        recipient_email: delivery_method === 'email' ? contact.email || null : null,
        recipient_phone: delivery_method === 'whatsapp' ? contact.phone || null : null,
        message_type,
        delivery_method,
        subject: delivery_method === 'email' ? subject : null, // WhatsApp doesn't use subject
        content: safeContent,
        status: 'pending' as const,
        sent_by: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    });

    // Insert messages into database
    const { data: insertedMessages, error: insertError } = await c.get('supabase')
      .from('messages')
      .insert(messagesToInsert)
      .select();

    if (insertError) {
      throw new Error(`Failed to save messages: ${insertError.message}`);
    }

    // Process messages based on delivery method
    const messageResults = [];
    
    for (const contact of validContacts) {
      try {
        let success = false;
        
        if (delivery_method === 'email' && emailSettings) {
          // Send email
          success = await simulateEmailSending({
            to: contact.email!,
            from: emailSettings.email_address,
            fromName: emailSettings.email_name || 'System',
            subject,
            content,
            smtpConfig: {
              host: emailSettings.email_host,
              port: emailSettings.email_port,
              secure: emailSettings.use_tls,
              // Note: In production, you'd decrypt the app_password here
              password: emailSettings.app_password,
            }
          });

          messageResults.push({
            contact_id: contact.contact_id,
            contact_name: contact.contact_name,
            recipient: contact.email,
            status: success ? 'sent' : 'failed',
            error: success ? null : 'Simulated sending failed',
          });
        } else if (delivery_method === 'whatsapp' && whatsAppSettings) {
          // Send WhatsApp message
          success = await simulateWhatsAppSending({
            to: contact.phone!,
            content,
            whapiConfig: {
              apiKey: whatsAppSettings.whapi_apikey,
              instanceId: whatsAppSettings.instance_id,
              phoneNumber: whatsAppSettings.whapi_phone_number,
              providerUrl: whatsAppSettings.provider_url,
            }
          });

          messageResults.push({
            contact_id: contact.contact_id,
            contact_name: contact.contact_name,
            recipient: contact.phone,
            status: success ? 'sent' : 'failed',
            error: success ? null : 'Simulated sending failed',
          });
        }

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
        messageResults.push({
          contact_id: contact.contact_id,
          contact_name: contact.contact_name,
          recipient: delivery_method === 'email' ? contact.email : contact.phone,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    const successCount = messageResults.filter(result => result.status === 'sent').length;
    const failureCount = messageResults.filter(result => result.status === 'failed').length;

    return c.json(createSuccessResponse({
      total_recipients: validContacts.length,
      successful_sends: successCount,
      failed_sends: failureCount,
      results: messageResults,
      message_ids: insertedMessages?.map(msg => msg.message_id) || [],
    }, `${delivery_method.charAt(0).toUpperCase() + delivery_method.slice(1)} sending completed. ${successCount} successful, ${failureCount} failed.`, c.get('requestId')), 200);

  } catch (error) {
    const errorMessage = c.req.param('delivery_method') || 'message';
    console.error('Send message error:', error);
    return c.json(createErrorResponse(`Failed to send ${errorMessage} messages`, 500, { error: error instanceof Error ? error.message : 'Unknown error' }, c.get('requestId')), 500);
  }
};

// For backward compatibility
export const sendEmailHandler = sendMessageHandler;

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

    // Get total count manually for messages table
    let countQuery = c.get('supabase')
      .from('messages')
      .select('*', { count: 'exact', head: true });

    if (status) {
      countQuery = countQuery.eq('status', status);
    }
    if (recipient_type) {
      countQuery = countQuery.eq('recipient_type', recipient_type);
    }

    const { count, error: countError } = await countQuery;
    
    if (countError) {
      throw new Error(`Failed to get message count: ${countError.message}`);
    }

    const totalCount = count || 0;

    // Apply pagination manually
    query = query
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range((page - 1) * limit, page * limit - 1);

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
 * Get available delivery methods based on user settings
 */
export const getDeliveryMethodsHandler = async (c: HonoContext) => {
  try {
    const user = c.get('user');

    // Ensure user is authenticated
    if (!user || !user.id) {
      return c.json(createErrorResponse('User authentication required', 401, undefined, c.get('requestId')), 401);
    }

    // Get user settings
    const { data: userSettings, error: settingsError } = await c.get('supabase')
      .from('user_settings')
      .select('email_address, app_password, whapi_apikey, instance_id, whapi_phone_number')
      .eq('user_id', user.id)
      .single();

    if (settingsError) {
      console.error('Error fetching user settings:', settingsError);
      return c.json(createErrorResponse('Failed to fetch user settings', 500, undefined, c.get('requestId')), 500);
    }

    // Determine available delivery methods
    const deliveryMethods = [];

    // Email is available if credentials are configured
    if (userSettings?.email_address && userSettings?.app_password) {
      deliveryMethods.push({
        id: 'email',
        name: 'Email',
        icon: '📧',
        enabled: true,
        requiresSubject: true
      });
    } else {
      deliveryMethods.push({
        id: 'email',
        name: 'Email',
        icon: '📧',
        enabled: false,
        requiresSubject: true,
        disabledReason: 'Email credentials not configured'
      });
    }

    // WhatsApp is available if credentials are configured
    if (userSettings?.whapi_apikey && userSettings?.instance_id && userSettings?.whapi_phone_number) {
      deliveryMethods.push({
        id: 'whatsapp',
        name: 'WhatsApp',
        icon: '💬',
        enabled: true,
        requiresSubject: false
      });
    } else {
      deliveryMethods.push({
        id: 'whatsapp',
        name: 'WhatsApp',
        icon: '💬',
        enabled: false,
        requiresSubject: false,
        disabledReason: 'WhatsApp credentials not configured'
      });
    }

    // SMS is not implemented yet
    deliveryMethods.push({
      id: 'sms',
      name: 'SMS',
      icon: '📱',
      enabled: false,
      requiresSubject: false,
      disabledReason: 'SMS integration coming soon'
    });

    return c.json(createSuccessResponse(deliveryMethods, 'Available delivery methods retrieved', c.get('requestId')));

  } catch (error) {
    console.error('Get delivery methods error:', error);
    return c.json(createErrorResponse('Failed to retrieve delivery methods', 500, { error: error instanceof Error ? error.message : 'Unknown error' }, c.get('requestId')), 500);
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

/**
 * Simulate WhatsApp message sending (replace with actual WhatsApp API implementation)
 * @param whatsappData - WhatsApp message data and configuration
 * @returns Promise resolving to boolean indicating success
 */
async function simulateWhatsAppSending(whatsappData: {
  to: string;
  content: string;
  whapiConfig: {
    apiKey: string;
    instanceId: string;
    phoneNumber: string;
    providerUrl: string;
  };
}): Promise<boolean> {
  // TODO: Replace this simulation with actual WhatsApp API integration
  // You could use services like:
  // - WHAPI.io
  // - Twilio WhatsApp API
  // - MessageBird
  // - WhatsApp Business API
  
  console.log('Simulating WhatsApp message send to:', whatsappData.to);
  console.log('From:', whatsappData.whapiConfig.phoneNumber);
  console.log('Content:', whatsappData.content);
  
  // Simulate some processing time
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Simulate 90% success rate for demonstration
  return Math.random() > 0.1;
}
