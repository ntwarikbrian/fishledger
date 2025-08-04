/**
 * Messaging API Service
 * Handles messaging-related API calls
 */

import { apiClient } from '../client';
import type { ApiResponse } from '../types';

/**
 * Recipient type for messages
 */
export type RecipientType = 'user' | 'worker' | 'contact';

/**
 * Delivery method for messages
 */
export type DeliveryMethod = 'email' | 'sms' | 'whatsapp';

/**
 * Message status
 */
export type MessageStatus = 'sent' | 'failed' | 'pending';

/**
 * Send message request interface
 */
export interface SendMessageRequest {
  recipientIds: string[];
  recipientType: RecipientType;
  subject: string;
  content: string;
  messageType?: 'email' | 'internal';
  deliveryMethod: DeliveryMethod;
}

/**
 * Message send result interface
 */
export interface MessageSendResult {
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
 * Message interface
 */
export interface Message {
  message_id: string;
  recipient_id: string;
  recipient_type: RecipientType;
  recipient_email?: string;
  message_type: 'email' | 'internal';
  delivery_method: DeliveryMethod;
  subject?: string;
  content: string;
  status: MessageStatus;
  error_message?: string;
  sent_at: string;
  delivered_at?: string;
  sent_by: string;
  created_at: string;
  updated_at: string;
}

/**
 * Message statistics interface
 */
export interface MessageStats {
  totalSent: number;
  totalFailed: number;
  totalPending: number;
  todaySent: number;
}

/**
 * Delivery method info interface
 */
export interface DeliveryMethodInfo {
  id: string;
  name: string;
  icon: string;
  enabled: boolean;
  requiresSubject: boolean;
  disabledReason?: string;
}

/**
 * Test email request interface
 */
export interface TestEmailRequest {
  email: string;
}

/**
 * Email test result interface
 */
export interface EmailTestResult {
  success: boolean;
  messageId?: string;
  error?: string;
  details?: any;
}

/**
 * Messaging Service Class
 * Handles all messaging-related API operations
 */
class MessagingService {
  
  /**
   * Send message to multiple recipients
   */
  async sendMessage(data: SendMessageRequest): Promise<ApiResponse<MessageSendResult>> {
    return apiClient.post<MessageSendResult>('/api/messages/send', data);
  }

  /**
   * Get message history
   */
  async getMessageHistory(limit: number = 50, offset: number = 0): Promise<ApiResponse<{
    messages: Message[];
    pagination: {
      limit: number;
      offset: number;
      total: number;
    };
  }>> {
    return apiClient.get<{
      messages: Message[];
      pagination: {
        limit: number;
        offset: number;
        total: number;
      };
    }>(`/api/messages/history?limit=${limit}&offset=${offset}`);
  }

  /**
   * Get message statistics
   */
  async getMessageStats(): Promise<ApiResponse<MessageStats>> {
    return apiClient.get<MessageStats>('/api/messages/stats');
  }

  /**
   * Test email configuration
   */
  async testEmailConfiguration(): Promise<ApiResponse<EmailTestResult>> {
    return apiClient.post<EmailTestResult>('/api/messages/test-email');
  }

  /**
   * Send test email
   */
  async sendTestEmail(data: TestEmailRequest): Promise<ApiResponse<EmailTestResult>> {
    return apiClient.post<EmailTestResult>('/api/messages/send-test-email', data);
  }

  /**
   * Get available delivery methods
   */
  async getDeliveryMethods(): Promise<ApiResponse<DeliveryMethodInfo[]>> {
    return apiClient.get<DeliveryMethodInfo[]>('/api/messages/delivery-methods');
  }

  /**
   * Send message to contacts (helper method)
   */
  async sendMessageToContacts(
    contactIds: string[],
    subject: string,
    content: string,
    deliveryMethod: DeliveryMethod = 'email'
  ): Promise<ApiResponse<MessageSendResult>> {
    return this.sendMessage({
      recipientIds: contactIds,
      recipientType: 'contact',
      subject,
      content,
      messageType: 'email',
      deliveryMethod,
    });
  }

  /**
   * Send message to workers (helper method)
   */
  async sendMessageToWorkers(
    workerIds: string[],
    subject: string,
    content: string,
    deliveryMethod: DeliveryMethod = 'email'
  ): Promise<ApiResponse<MessageSendResult>> {
    return this.sendMessage({
      recipientIds: workerIds,
      recipientType: 'worker',
      subject,
      content,
      messageType: 'internal',
      deliveryMethod,
    });
  }

  /**
   * Send message to users (helper method)
   */
  async sendMessageToUsers(
    userIds: string[],
    subject: string,
    content: string,
    deliveryMethod: DeliveryMethod = 'email'
  ): Promise<ApiResponse<MessageSendResult>> {
    return this.sendMessage({
      recipientIds: userIds,
      recipientType: 'user',
      subject,
      content,
      messageType: 'internal',
      deliveryMethod,
    });
  }

  /**
   * Send bulk promotional message to contacts
   */
  async sendPromotionalMessage(
    contactIds: string[],
    subject: string,
    content: string
  ): Promise<ApiResponse<MessageSendResult>> {
    return this.sendMessageToContacts(contactIds, subject, content, 'email');
  }

  /**
   * Send inventory alert to suppliers
   */
  async sendInventoryAlert(
    supplierContactIds: string[],
    productName: string,
    currentStock: number,
    neededQuantity: number
  ): Promise<ApiResponse<MessageSendResult>> {
    const subject = `Low Stock Alert: ${productName}`;
    const content = `Dear Supplier,

We are running low on ${productName} and would like to place an order.

Current Stock: ${currentStock}
Needed Quantity: ${neededQuantity}

Please let us know your availability and pricing.

Thank you for your continued partnership.

Best regards,
AquaManage Team`;

    return this.sendMessageToContacts(supplierContactIds, subject, content, 'email');
  }

  /**
   * Send order confirmation to customer
   */
  async sendOrderConfirmation(
    customerContactId: string,
    orderDetails: {
      orderId: string;
      totalAmount: number;
      deliveryDate?: string;
    }
  ): Promise<ApiResponse<MessageSendResult>> {
    const subject = `Order Confirmation - ${orderDetails.orderId}`;
    const content = `Dear Customer,

Thank you for your order!

Order ID: ${orderDetails.orderId}
Total Amount: $${orderDetails.totalAmount.toFixed(2)}
${orderDetails.deliveryDate ? `Expected Delivery: ${orderDetails.deliveryDate}` : ''}

We will notify you when your order is ready for pickup/delivery.

Thank you for choosing us!

Best regards,
AquaManage Team`;

    return this.sendMessageToContacts([customerContactId], subject, content, 'email');
  }
}

// Create and export service instance
export const messagingService = new MessagingService();
