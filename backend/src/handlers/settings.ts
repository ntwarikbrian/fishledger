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
  timezone?: string;
  date_format?: string;
  theme?: 'light' | 'dark' | 'system';
  email_notifications?: boolean;
  sms_notifications?: boolean;
  low_stock_alerts?: boolean;
  daily_reports?: boolean;
  weekly_reports?: boolean;
  monthly_reports?: boolean;
  auto_reporting?: boolean;
  business_hours_start?: string;
  business_hours_end?: string;
  working_days?: number[];
}

// Validation schemas
const updateSettingsSchema = z.object({
  currency: z.enum(['USD', 'RWF']).optional(),
  language: z.enum(['en', 'rw']).optional(),
  timezone: z.string().max(50).optional(),
  date_format: z.string().max(20).optional(),
  theme: z.enum(['light', 'dark', 'system']).optional(),
  email_notifications: z.boolean().optional(),
  sms_notifications: z.boolean().optional(),
  low_stock_alerts: z.boolean().optional(),
  daily_reports: z.boolean().optional(),
  weekly_reports: z.boolean().optional(),
  monthly_reports: z.boolean().optional(),
  auto_reporting: z.boolean().optional(),
  business_hours_start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/).optional(),
  business_hours_end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/).optional(),
  working_days: z.array(z.number().min(1).max(7)).optional(),
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
        currency: 'USD',
        language: 'en',
        timezone: 'UTC',
        date_format: 'MM/DD/YYYY',
        theme: 'light',
        email_notifications: true,
        sms_notifications: false,
        low_stock_alerts: true,
        daily_reports: true,
        weekly_reports: true,
        monthly_reports: false,
        auto_reporting: true,
        business_hours_start: '08:00:00',
        business_hours_end: '18:00:00',
        working_days: [1, 2, 3, 4, 5], // Monday to Friday
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
          timezone: newSettings.timezone,
          dateFormat: newSettings.date_format,
          theme: newSettings.theme,
          emailNotifications: newSettings.email_notifications,
          smsNotifications: newSettings.sms_notifications,
          lowStockAlerts: newSettings.low_stock_alerts,
          dailyReports: newSettings.daily_reports,
          weeklyReports: newSettings.weekly_reports,
          monthlyReports: newSettings.monthly_reports,
          autoReporting: newSettings.auto_reporting,
          businessHoursStart: newSettings.business_hours_start,
          businessHoursEnd: newSettings.business_hours_end,
          workingDays: newSettings.working_days,
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
        timezone: settings.timezone,
        dateFormat: settings.date_format,
        theme: settings.theme,
        emailNotifications: settings.email_notifications,
        smsNotifications: settings.sms_notifications,
        lowStockAlerts: settings.low_stock_alerts,
        dailyReports: settings.daily_reports,
        weeklyReports: settings.weekly_reports,
        monthlyReports: settings.monthly_reports,
        autoReporting: settings.auto_reporting,
        businessHoursStart: settings.business_hours_start,
        businessHoursEnd: settings.business_hours_end,
        workingDays: settings.working_days,
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
    if (updateData.timezone !== undefined) dbUpdateData.timezone = updateData.timezone;
    if (updateData.date_format !== undefined) dbUpdateData.date_format = updateData.date_format;
    if (updateData.theme !== undefined) dbUpdateData.theme = updateData.theme;
    if (updateData.email_notifications !== undefined) dbUpdateData.email_notifications = updateData.email_notifications;
    if (updateData.sms_notifications !== undefined) dbUpdateData.sms_notifications = updateData.sms_notifications;
    if (updateData.low_stock_alerts !== undefined) dbUpdateData.low_stock_alerts = updateData.low_stock_alerts;
    if (updateData.daily_reports !== undefined) dbUpdateData.daily_reports = updateData.daily_reports;
    if (updateData.weekly_reports !== undefined) dbUpdateData.weekly_reports = updateData.weekly_reports;
    if (updateData.monthly_reports !== undefined) dbUpdateData.monthly_reports = updateData.monthly_reports;
    if (updateData.auto_reporting !== undefined) dbUpdateData.auto_reporting = updateData.auto_reporting;
    if (updateData.business_hours_start !== undefined) dbUpdateData.business_hours_start = updateData.business_hours_start;
    if (updateData.business_hours_end !== undefined) dbUpdateData.business_hours_end = updateData.business_hours_end;
    if (updateData.working_days !== undefined) dbUpdateData.working_days = updateData.working_days;

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
        timezone: updatedSettings.timezone,
        dateFormat: updatedSettings.date_format,
        theme: updatedSettings.theme,
        emailNotifications: updatedSettings.email_notifications,
        smsNotifications: updatedSettings.sms_notifications,
        lowStockAlerts: updatedSettings.low_stock_alerts,
        dailyReports: updatedSettings.daily_reports,
        weeklyReports: updatedSettings.weekly_reports,
        monthlyReports: updatedSettings.monthly_reports,
        autoReporting: updatedSettings.auto_reporting,
        businessHoursStart: updatedSettings.business_hours_start,
        businessHoursEnd: updatedSettings.business_hours_end,
        workingDays: updatedSettings.working_days,
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
