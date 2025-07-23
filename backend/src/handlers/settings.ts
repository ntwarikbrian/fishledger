/**
 * Settings handlers for user settings management endpoints
 * Provides endpoints for managing user preferences using Hono framework
 */

import { z } from 'zod';
import type { HonoContext } from '../types/index';

// Request interfaces
export interface UpdateSettingsRequest {
  currency?: 'USD' | 'RWF';
  language?: 'en' | 'rw';
  // Email configuration
  email_address?: string;
  email_name?: string;
  app_password?: string;
  email_host?: string;
  email_port?: number;
  use_tls?: boolean;
  // WhatsApp configuration
  whapi_apikey?: string;
  instance_id?: string;
  whapi_phone_number?: string;
  provider_url?: string;
}

// Validation schemas
const updateSettingsSchema = z.object({
  currency: z.enum(['USD', 'RWF']).optional(),
  language: z.enum(['en', 'rw']).optional(),
  // Email configuration
  email_address: z.string().email().max(255).optional(),
  email_name: z.string().max(200).optional(),
  app_password: z.string().max(255).optional(),
  email_host: z.string().max(255).optional(),
  email_port: z.number().int().min(1).max(65535).optional(),
  use_tls: z.boolean().optional(),
  // WhatsApp configuration
  whapi_apikey: z.string().max(255).optional(),
  instance_id: z.string().max(100).optional(),
  whapi_phone_number: z.string().max(20).optional(),
  provider_url: z.string().url().max(500).optional(),
});

/**
 * Get user settings handler
 */
export const getSettingsHandler = async (c: HonoContext) => {
  try {
    const user = c.get('user');

    if (!user) {
      return c.json({
        success: false,
        error: 'User not authenticated',
        timestamp: new Date().toISOString(),
        requestId: c.get('requestId'),
      }, 401);
    }

    // Get user settings from database
    const { data: settings, error } = await c.get('supabase')
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Database error:', error);
      return c.json({
        success: false,
        error: 'Failed to fetch user settings',
        timestamp: new Date().toISOString(),
        requestId: c.get('requestId'),
      }, 500);
    }

    // If no settings exist, create default settings
    if (!settings) {
      const defaultSettings = {
        user_id: user.id,
        currency: 'USD' as const,
        language: 'en' as const,
        email_host: 'smtp.gmail.com',
        email_port: 587,
        use_tls: true,
      };

      const { data: newSettings, error: createError } = await c.get('supabase')
        .from('user_settings')
        .insert(defaultSettings)
        .select()
        .single();

      if (createError) {
        console.error('Failed to create default settings:', createError);
        return c.json({
          success: false,
          error: 'Failed to create default settings',
          timestamp: new Date().toISOString(),
          requestId: c.get('requestId'),
        }, 500);
      }

      return c.json({
        success: true,
        data: {
          settingId: newSettings.setting_id,
          currency: newSettings.currency,
          language: newSettings.language,
          // Email configuration
          emailAddress: newSettings.email_address,
          emailName: newSettings.email_name,
          appPassword: newSettings.app_password,
          emailHost: newSettings.email_host,
          emailPort: newSettings.email_port,
          useTls: newSettings.use_tls,
          // WhatsApp configuration
          whapiApikey: newSettings.whapi_apikey,
          instanceId: newSettings.instance_id,
          whapiPhoneNumber: newSettings.whapi_phone_number,
          providerUrl: newSettings.provider_url,
          createdAt: newSettings.created_at,
          updatedAt: newSettings.updated_at,
        },
        timestamp: new Date().toISOString(),
        requestId: c.get('requestId'),
      });
    }

    return c.json({
      success: true,
      data: {
        settingId: settings.setting_id,
        currency: settings.currency,
        language: settings.language,
        // Email configuration
        emailAddress: settings.email_address,
        emailName: settings.email_name,
        appPassword: settings.app_password,
        emailHost: settings.email_host,
        emailPort: settings.email_port,
        useTls: settings.use_tls,
        // WhatsApp configuration
        whapiApikey: settings.whapi_apikey,
        instanceId: settings.instance_id,
        whapiPhoneNumber: settings.whapi_phone_number,
        providerUrl: settings.provider_url,
        createdAt: settings.created_at,
        updatedAt: settings.updated_at,
      },
      timestamp: new Date().toISOString(),
      requestId: c.get('requestId'),
    });

  } catch (error) {
    console.error('Get settings error:', error);
    return c.json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString(),
      requestId: c.get('requestId'),
    }, 500);
  }
};

/**
 * Update user settings handler
 */
export const updateSettingsHandler = async (c: HonoContext) => {
  try {
    const user = c.get('user');

    if (!user) {
      return c.json({
        success: false,
        error: 'User not authenticated',
        timestamp: new Date().toISOString(),
        requestId: c.get('requestId'),
      }, 401);
    }

    // Parse and validate request body
    const body = await c.req.json();
    const validationResult = updateSettingsSchema.safeParse(body);

    if (!validationResult.success) {
      return c.json({
        success: false,
        error: 'Invalid request data',
        details: validationResult.error.errors,
        timestamp: new Date().toISOString(),
        requestId: c.get('requestId'),
      }, 400);
    }

    const updateData = validationResult.data;

    // Convert camelCase to snake_case for database
    const dbUpdateData: any = {};
    if (updateData.currency !== undefined) dbUpdateData.currency = updateData.currency;
    if (updateData.language !== undefined) dbUpdateData.language = updateData.language;
    // Email configuration
    if (updateData.email_address !== undefined) dbUpdateData.email_address = updateData.email_address;
    if (updateData.email_name !== undefined) dbUpdateData.email_name = updateData.email_name;
    if (updateData.app_password !== undefined) dbUpdateData.app_password = updateData.app_password;
    if (updateData.email_host !== undefined) dbUpdateData.email_host = updateData.email_host;
    if (updateData.email_port !== undefined) dbUpdateData.email_port = updateData.email_port;
    if (updateData.use_tls !== undefined) dbUpdateData.use_tls = updateData.use_tls;
    // WhatsApp configuration
    if (updateData.whapi_apikey !== undefined) dbUpdateData.whapi_apikey = updateData.whapi_apikey;
    if (updateData.instance_id !== undefined) dbUpdateData.instance_id = updateData.instance_id;
    if (updateData.whapi_phone_number !== undefined) dbUpdateData.whapi_phone_number = updateData.whapi_phone_number;
    if (updateData.provider_url !== undefined) dbUpdateData.provider_url = updateData.provider_url;

    // Update settings in database
    const { data: updatedSettings, error } = await c.get('supabase')
      .from('user_settings')
      .update(dbUpdateData)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Failed to update settings:', error);
      return c.json({
        success: false,
        error: 'Failed to update settings',
        timestamp: new Date().toISOString(),
        requestId: c.get('requestId'),
      }, 500);
    }

    return c.json({
      success: true,
      message: 'Settings updated successfully',
      data: {
        settingId: updatedSettings.setting_id,
        currency: updatedSettings.currency,
        language: updatedSettings.language,
        // Email configuration
        emailAddress: updatedSettings.email_address,
        emailName: updatedSettings.email_name,
        appPassword: updatedSettings.app_password,
        emailHost: updatedSettings.email_host,
        emailPort: updatedSettings.email_port,
        useTls: updatedSettings.use_tls,
        // WhatsApp configuration
        whapiApikey: updatedSettings.whapi_apikey,
        instanceId: updatedSettings.instance_id,
        whapiPhoneNumber: updatedSettings.whapi_phone_number,
        providerUrl: updatedSettings.provider_url,
        updatedAt: updatedSettings.updated_at,
      },
      timestamp: new Date().toISOString(),
      requestId: c.get('requestId'),
    });

  } catch (error) {
    console.error('Update settings error:', error);
    return c.json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString(),
      requestId: c.get('requestId'),
    }, 500);
  }
};
