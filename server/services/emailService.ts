/**
 * Email Service
 * Handles email sending functionality using nodemailer
 */

import nodemailer from 'nodemailer';
import { emailConfig } from '../config/environment.js';
import { supabaseClient } from '../config/supabase-client.js';

/**
 * Email sending options interface
 */
export interface EmailOptions {
  to: string;
  subject: string;
  content: string;
  html?: string;
  from?: string;
  fromName?: string;
}

/**
 * Email sending result interface
 */
export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  details?: any;
}

/**
 * Message settings interface from database
 */
interface MessageSettings {
  email_host: string;
  email_port: number;
  email_user: string;
  email_password: string;
  email_from: string;
  email_from_name: string;
  email_use_tls: boolean;
  email_use_ssl: boolean;
  default_signature?: string;
}

/**
 * Email Service Class
 * Manages email configuration and sending
 */
export class EmailService {
  private defaultSettings: MessageSettings;

  constructor() {
    // Debug: Log raw environment values
    console.log('🔍 Debug - Raw email environment values:');
    console.log('   EMAIL_HOST:', process.env.EMAIL_HOST);
    console.log('   EMAIL_PORT:', process.env.EMAIL_PORT);
    console.log('   EMAIL_USER:', process.env.EMAIL_USER);
    console.log('   EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '***SET***' : 'NOT SET');
    console.log('   EMAIL_FROM:', process.env.EMAIL_FROM);

    console.log('🔍 Debug - Parsed emailConfig values:');
    console.log('   emailConfig.host:', emailConfig.host);
    console.log('   emailConfig.port:', emailConfig.port);
    console.log('   emailConfig.user:', emailConfig.user);
    console.log('   emailConfig.password:', emailConfig.password ? '***SET***' : 'NOT SET');
    console.log('   emailConfig.from:', emailConfig.from);

    // Email settings from environment variables only
    this.defaultSettings = {
      email_host: emailConfig.host || 'smtp.gmail.com',
      email_port: emailConfig.port || 587,
      email_user: emailConfig.user || '',
      email_password: emailConfig.password || '',
      email_from: emailConfig.from || emailConfig.user || '',
      email_from_name: 'AquaManage System',
      email_use_tls: true,
      email_use_ssl: false,
    };

    // Validate that we have the required email configuration from environment
    if (!emailConfig.user || !emailConfig.password) {
      console.error('❌ Email configuration missing! Please set EMAIL_USER and EMAIL_PASSWORD environment variables.');
      console.log('📧 Required environment variables:');
      console.log('   EMAIL_USER=your_email@gmail.com');
      console.log('   EMAIL_PASSWORD=your_app_password');
      console.log('   EMAIL_FROM=your_email@gmail.com (optional, defaults to EMAIL_USER)');
      console.log('   EMAIL_HOST=smtp.gmail.com (optional, defaults to Gmail)');
      console.log('   EMAIL_PORT=587 (optional, defaults to 587)');
      console.log('');
      console.log('💡 Make sure to restart the server after adding environment variables!');
    } else {
      console.log('✅ Email configuration loaded from environment variables');
      console.log('📧 Email settings:');
      console.log(`   Host: ${this.defaultSettings.email_host}`);
      console.log(`   Port: ${this.defaultSettings.email_port}`);
      console.log(`   User: ${this.defaultSettings.email_user}`);
      console.log(`   From: ${this.defaultSettings.email_from}`);
    }
  }

  /**
   * Get user's email settings from database
   */
  private async getUserEmailSettings(userId: string): Promise<MessageSettings | null> {
    try {
      const { data, error } = await supabaseClient
        .from('message_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error || !data) {
        console.log('📧 No custom email settings found for user, using defaults');
        return null;
      }

      return data as MessageSettings;
    } catch (error) {
      console.error('❌ Error fetching user email settings:', error);
      return null;
    }
  }

  /**
   * Create nodemailer transporter with given settings
   */
  private createTransporter(settings: MessageSettings): nodemailer.Transporter {
    console.log('📧 Creating email transporter with settings:', {
      host: settings.email_host,
      port: settings.email_port,
      user: settings.email_user,
      secure: settings.email_use_ssl,
      tls: settings.email_use_tls
    });

    const transportConfig: any = {
      host: settings.email_host,
      port: settings.email_port,
      secure: settings.email_use_ssl, // true for 465, false for other ports
      auth: {
        user: settings.email_user,
        pass: settings.email_password,
      },
    };

    // Add TLS configuration for Gmail and other providers
    if (settings.email_use_tls && !settings.email_use_ssl) {
      transportConfig.tls = {
        rejectUnauthorized: false,
      };
    }

    // Special configuration for Gmail
    if (settings.email_host === 'smtp.gmail.com') {
      transportConfig.secure = false; // Use STARTTLS
      transportConfig.requireTLS = true;
      transportConfig.tls = {
        rejectUnauthorized: false,
      };
    }

    try {
      return nodemailer.createTransport(transportConfig);
    } catch (error) {
      console.error('❌ Error creating email transporter:', error);
      throw new Error(`Failed to create email transporter: ${error}`);
    }
  }

  /**
   * Initialize transporter with user settings or defaults
   */
  private async initializeTransporter(userId?: string): Promise<nodemailer.Transporter> {
    let settings = this.defaultSettings;

    // Try to get user-specific settings if userId provided
    if (userId) {
      const userSettings = await this.getUserEmailSettings(userId);
      if (userSettings) {
        settings = userSettings;
        console.log('📧 Using user-specific email settings');
      }
    }

    return this.createTransporter(settings);
  }

  /**
   * Send email using the configured transporter
   */
  async sendEmail(options: EmailOptions, userId?: string): Promise<EmailResult> {
    try {
      console.log('📧 Attempting to send email to:', options.to);

      // Validate email options
      if (!options.to || !options.subject || !options.content) {
        throw new Error('Missing required email fields: to, subject, or content');
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(options.to)) {
        throw new Error(`Invalid email address: ${options.to}`);
      }

      // Initialize transporter with appropriate settings
      const transporter = await this.initializeTransporter(userId);

      // Get settings for from address
      let settings = this.defaultSettings;
      if (userId) {
        const userSettings = await this.getUserEmailSettings(userId);
        if (userSettings) {
          settings = userSettings;
        }
      }

      // Validate that we have email credentials from environment
      if (!emailConfig.user || !emailConfig.password) {
        throw new Error('Email credentials not configured. Please set EMAIL_USER and EMAIL_PASSWORD environment variables.');
      }

      // Validate that settings have the credentials (either from user settings or environment)
      if (!settings.email_user || !settings.email_password) {
        throw new Error('Email credentials missing. Please check your email configuration.');
      }

      // Prepare email content with signature if available
      let emailContent = options.content;
      let emailHtml = options.html;

      if (settings.default_signature) {
        emailContent += '\n\n' + settings.default_signature;
        if (emailHtml) {
          emailHtml += '<br><br>' + settings.default_signature.replace(/\n/g, '<br>');
        }
      }

      // Prepare mail options
      const mailOptions = {
        from: `"${options.fromName || settings.email_from_name}" <${options.from || settings.email_from}>`,
        to: options.to,
        subject: options.subject,
        text: emailContent,
        html: emailHtml || emailContent.replace(/\n/g, '<br>'),
      };

      console.log('📧 Sending email with options:', {
        from: mailOptions.from,
        to: mailOptions.to,
        subject: mailOptions.subject,
        host: settings.email_host,
        port: settings.email_port,
      });

      // Send the email
      const result = await transporter.sendMail(mailOptions);

      console.log('✅ Email sent successfully:', result.messageId);

      return {
        success: true,
        messageId: result.messageId,
        details: result,
      };
    } catch (error: any) {
      console.error('❌ Error sending email:', error);

      // Provide more specific error messages
      let errorMessage = 'Failed to send email';

      if (error.code === 'EAUTH') {
        errorMessage = 'Email authentication failed. Please check your email credentials.';
      } else if (error.code === 'ECONNECTION') {
        errorMessage = 'Failed to connect to email server. Please check your internet connection.';
      } else if (error.code === 'ETIMEDOUT') {
        errorMessage = 'Email sending timed out. Please try again.';
      } else if (error.responseCode === 535) {
        errorMessage = 'Invalid email credentials. Please check your email username and password.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      return {
        success: false,
        error: errorMessage,
        details: error,
      };
    }
  }

  /**
   * Test email configuration
   */
  async testEmailConfiguration(userId?: string): Promise<EmailResult> {
    try {
      const transporter = await this.initializeTransporter(userId);
      
      // Verify the connection
      await transporter.verify();
      
      console.log('✅ Email configuration test successful');
      
      return {
        success: true,
        messageId: 'test-connection-successful',
      };
    } catch (error: any) {
      console.error('❌ Email configuration test failed:', error);
      
      return {
        success: false,
        error: error.message || 'Email configuration test failed',
        details: error,
      };
    }
  }

  /**
   * Send test email
   */
  async sendTestEmail(toEmail: string, userId?: string): Promise<EmailResult> {
    const testEmailOptions: EmailOptions = {
      to: toEmail,
      subject: 'Test Email from AquaManage System',
      content: 'This is a test email to verify that your email configuration is working correctly.\n\nIf you received this email, your email settings are properly configured!',
    };

    return this.sendEmail(testEmailOptions, userId);
  }
}

// Create and export service instance
export const emailService = new EmailService();
