/**
 * Messaging Service
 * Handles message creation, sending, and management
 */

import { supabaseClient } from '../config/supabase-client.js';
import { emailService, EmailOptions } from './emailService.js';
import type {
  Message,
  RecipientType,
  MessageStatus
} from '../types/database.js';

/**
 * Send message options interface
 */
export interface SendMessageOptions {
  recipientIds: string[];
  recipientType: RecipientType;
  subject: string;
  content: string;
  messageType?: 'email' | 'internal';
  deliveryMethod: 'email' | 'sms' | 'whatsapp';
  sentBy: string;
}

/**
 * Message sending result interface
 */
export interface MessageSendResult {
  success: boolean;
  totalRecipients: number;
  successfulSends: number;
  failedSends: number;
  results: Array<{
    recipientId: string;
    recipientEmail?: string;
    recipientName?: string;
    success: boolean;
    messageId?: string;
    error?: string;
  }>;
}

/**
 * Recipient information interface
 */
interface RecipientInfo {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  emailNotifications?: boolean;
}

/**
 * Messaging Service Class
 * Manages message operations and delivery
 */
export class MessagingService {
  
  /**
   * Get recipient information based on type and IDs
   */
  private async getRecipientInfo(recipientIds: string[], recipientType: RecipientType): Promise<RecipientInfo[]> {
    try {
      let query;

      // Build query based on recipient type
      switch (recipientType) {
        case 'contact':
          query = supabaseClient
            .from('contacts')
            .select('contact_id, contact_name, email, phone_number, email_notifications')
            .in('contact_id', recipientIds);
          break;
        case 'user':
          query = supabaseClient
            .from('users')
            .select('user_id, owner_name, email_address, phone_number')
            .in('user_id', recipientIds);
          break;
        case 'worker':
          query = supabaseClient
            .from('workers')
            .select('worker_id, full_name, email, phone_number')
            .in('worker_id', recipientIds);
          break;
        default:
          throw new Error(`Invalid recipient type: ${recipientType}`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Error fetching recipient info:', error);
        throw new Error(`Failed to fetch recipient information: ${error.message}`);
      }

      if (!data || data.length === 0) {
        console.warn('⚠️ No recipients found for IDs:', recipientIds);
        return [];
      }

      // Transform data to RecipientInfo format
      const recipients: RecipientInfo[] = data.map((item: any) => {
        switch (recipientType) {
          case 'contact':
            return {
              id: item.contact_id,
              name: item.contact_name,
              email: item.email,
              phone: item.phone_number,
              emailNotifications: item.email_notifications,
            };
          case 'user':
            return {
              id: item.user_id,
              name: item.owner_name,
              email: item.email_address,
              phone: item.phone_number,
            };
          case 'worker':
            return {
              id: item.worker_id,
              name: item.full_name,
              email: item.email,
              phone: item.phone_number,
            };
          default:
            throw new Error(`Invalid recipient type: ${recipientType}`);
        }
      });

      console.log(`📋 Found ${recipients.length} recipients of type ${recipientType}`);
      return recipients;
    } catch (error) {
      console.error('❌ Error in getRecipientInfo:', error);
      throw error;
    }
  }

  /**
   * Create message record in database
   */
  private async createMessageRecord(
    recipientId: string,
    recipientType: RecipientType,
    recipientEmail: string | undefined,
    messageType: 'email' | 'internal',
    deliveryMethod: 'email' | 'sms' | 'whatsapp',
    subject: string,
    content: string,
    sentBy: string,
    status: MessageStatus = 'pending'
  ): Promise<string | null> {
    try {
      const messageData = {
        recipient_id: recipientId,
        recipient_type: recipientType,
        recipient_email: recipientEmail,
        message_type: messageType,
        delivery_method: deliveryMethod,
        subject: subject || null,
        content,
        status,
        sent_by: sentBy,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      console.log('📝 Creating message record:', {
        recipient_id: recipientId,
        recipient_type: recipientType,
        recipient_email: recipientEmail,
        delivery_method: deliveryMethod,
        status,
      });

      const { data, error } = await supabaseClient
        .from('messages')
        .insert(messageData)
        .select('message_id')
        .single();

      if (error) {
        console.error('❌ Error creating message record:', error);
        throw new Error(`Failed to create message record: ${error.message}`);
      }

      if (!data?.message_id) {
        throw new Error('No message ID returned from database');
      }

      console.log('✅ Message record created with ID:', data.message_id);
      return data.message_id;
    } catch (error: any) {
      console.error('❌ Error in createMessageRecord:', error);
      throw error;
    }
  }

  /**
   * Update message status and delivery information
   */
  private async updateMessageStatus(
    messageId: string,
    status: MessageStatus,
    errorMessage?: string,
    deliveredAt?: Date
  ): Promise<void> {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (errorMessage) {
        updateData.error_message = errorMessage;
      }

      if (deliveredAt) {
        updateData.delivered_at = deliveredAt.toISOString();
      }

      const { error } = await supabaseClient
        .from('messages')
        .update(updateData)
        .eq('message_id', messageId);

      if (error) {
        console.error('❌ Error updating message status:', error);
      }
    } catch (error) {
      console.error('❌ Error in updateMessageStatus:', error);
    }
  }

  /**
   * Send message to multiple recipients
   */
  async sendMessage(options: SendMessageOptions): Promise<MessageSendResult> {
    console.log('📨 Starting message send process for', options.recipientIds.length, 'recipients');

    const result: MessageSendResult = {
      success: false,
      totalRecipients: options.recipientIds.length,
      successfulSends: 0,
      failedSends: 0,
      results: [],
    };

    try {
      // Get recipient information
      const recipients = await this.getRecipientInfo(options.recipientIds, options.recipientType);

      if (recipients.length === 0) {
        throw new Error('No valid recipients found');
      }

      // Process each recipient
      for (const recipient of recipients) {
        const recipientResult: {
          recipientId: string;
          recipientEmail?: string;
          recipientName?: string;
          success: boolean;
          messageId?: string;
          error?: string;
        } = {
          recipientId: recipient.id,
          success: false,
        };

        // Add optional properties only if they exist
        if (recipient.email) {
          recipientResult.recipientEmail = recipient.email;
        }
        if (recipient.name) {
          recipientResult.recipientName = recipient.name;
        }

        try {
          // Create message record in database
          const messageId = await this.createMessageRecord(
            recipient.id,
            options.recipientType,
            recipient.email,
            options.messageType || 'email',
            options.deliveryMethod,
            options.subject,
            options.content,
            options.sentBy,
            'pending'
          );

          if (!messageId) {
            throw new Error('Failed to create message record');
          }

          recipientResult.messageId = messageId;

          // Handle different delivery methods
          if (options.deliveryMethod === 'email') {
            // Check if recipient has email and wants email notifications
            if (!recipient.email) {
              throw new Error('Recipient has no email address');
            }

            if (options.recipientType === 'contact' && recipient.emailNotifications === false) {
              throw new Error('Recipient has disabled email notifications');
            }

            // Send email
            const emailOptions: EmailOptions = {
              to: recipient.email,
              subject: options.subject,
              content: options.content,
            };

            const emailResult = await emailService.sendEmail(emailOptions, options.sentBy);

            if (emailResult.success) {
              // Update message status to sent
              await this.updateMessageStatus(messageId, 'sent', undefined, new Date());
              recipientResult.success = true;
              result.successfulSends++;
            } else {
              // Update message status to failed
              await this.updateMessageStatus(messageId, 'failed', emailResult.error);
              throw new Error(emailResult.error || 'Email sending failed');
            }
          } else if (options.deliveryMethod === 'sms') {
            // SMS functionality placeholder
            await this.updateMessageStatus(messageId, 'failed', 'SMS functionality not implemented yet');
            throw new Error('SMS functionality not implemented yet');
          } else if (options.deliveryMethod === 'whatsapp') {
            // WhatsApp functionality placeholder
            await this.updateMessageStatus(messageId, 'failed', 'WhatsApp functionality not implemented yet');
            throw new Error('WhatsApp functionality not implemented yet');
          } else {
            throw new Error(`Unsupported delivery method: ${options.deliveryMethod}`);
          }
        } catch (error: any) {
          console.error(`❌ Error sending message to ${recipient.name}:`, error.message);
          recipientResult.error = error.message;
          result.failedSends++;

          // Update message status if messageId exists
          if (recipientResult.messageId) {
            await this.updateMessageStatus(recipientResult.messageId, 'failed', error.message);
          }
        }

        result.results.push(recipientResult);
      }

      // Determine overall success
      result.success = result.successfulSends > 0;

      console.log(`📨 Message send completed: ${result.successfulSends}/${result.totalRecipients} successful`);

      return result;
    } catch (error: any) {
      console.error('❌ Error in sendMessage:', error);
      
      result.success = false;
      result.failedSends = result.totalRecipients;
      
      return result;
    }
  }

  /**
   * Get message history for a user
   */
  async getMessageHistory(userId: string, limit: number = 50, offset: number = 0): Promise<Message[]> {
    try {
      const { data, error } = await supabaseClient
        .from('messages')
        .select('*')
        .eq('sent_by', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('❌ Error fetching message history:', error);
        throw new Error(`Failed to fetch message history: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('❌ Error in getMessageHistory:', error);
      throw error;
    }
  }

  /**
   * Get message statistics for a user
   */
  async getMessageStats(userId: string): Promise<{
    totalSent: number;
    totalFailed: number;
    totalPending: number;
    todaySent: number;
  }> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data, error } = await supabaseClient
        .from('messages')
        .select('status, created_at')
        .eq('sent_by', userId);

      if (error) {
        throw new Error(`Failed to fetch message stats: ${error.message}`);
      }

      const stats = {
        totalSent: 0,
        totalFailed: 0,
        totalPending: 0,
        todaySent: 0,
      };

      data?.forEach((message) => {
        switch (message.status) {
          case 'sent':
            stats.totalSent++;
            if (new Date(message.created_at) >= today) {
              stats.todaySent++;
            }
            break;
          case 'failed':
            stats.totalFailed++;
            break;
          case 'pending':
            stats.totalPending++;
            break;
        }
      });

      return stats;
    } catch (error) {
      console.error('❌ Error in getMessageStats:', error);
      throw error;
    }
  }
}

// Create and export service instance
export const messagingService = new MessagingService();
