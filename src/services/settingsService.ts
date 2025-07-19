/**
 * Settings Service
 * Handles API calls for user settings management
 */

import React from 'react';
import { getApiConfig } from '@/config/api';
import type { Currency } from '@/contexts/CurrencyContext';

// Settings interfaces
export interface UserSettings {
  settingId: string;
  currency: Currency;
  language: 'en' | 'rw';
  timezone: string;
  dateFormat: string;
  theme: 'light' | 'dark' | 'system';
  emailNotifications: boolean;
  smsNotifications: boolean;
  lowStockAlerts: boolean;
  dailyReports: boolean;
  weeklyReports: boolean;
  monthlyReports: boolean;
  autoReporting: boolean;
  businessHoursStart: string;
  businessHoursEnd: string;
  workingDays: number[];
  createdAt: string;
  updatedAt: string;
}

export interface UpdateSettingsRequest {
  currency?: Currency;
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

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp: string;
  requestId: string;
}

/**
 * Settings Service Class
 */
class SettingsService {
  private apiConfig = getApiConfig();

  /**
   * Get authentication headers
   */
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  }

  /**
   * Handle API response
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'API request failed');
    }

    return data.data;
  }

  /**
   * Get user settings
   */
  async getSettings(): Promise<UserSettings> {
    try {
      const response = await fetch(`${this.apiConfig.baseUrl}${this.apiConfig.endpoints.settings.get}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      return await this.handleResponse<UserSettings>(response);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch settings');
    }
  }

  /**
   * Update user settings
   */
  async updateSettings(updates: UpdateSettingsRequest): Promise<UserSettings> {
    try {
      const response = await fetch(`${this.apiConfig.baseUrl}${this.apiConfig.endpoints.settings.update}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(updates),
      });

      return await this.handleResponse<UserSettings>(response);
    } catch (error) {
      console.error('Failed to update settings:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to update settings');
    }
  }

  /**
   * Update only currency setting
   */
  async updateCurrency(currency: Currency): Promise<UserSettings> {
    return this.updateSettings({ currency });
  }

  /**
   * Update only language setting
   */
  async updateLanguage(language: 'en' | 'rw'): Promise<UserSettings> {
    return this.updateSettings({ language });
  }

  /**
   * Update only theme setting
   */
  async updateTheme(theme: 'light' | 'dark' | 'system'): Promise<UserSettings> {
    return this.updateSettings({ theme });
  }

  /**
   * Update notification settings
   */
  async updateNotificationSettings(notifications: {
    email_notifications?: boolean;
    sms_notifications?: boolean;
    low_stock_alerts?: boolean;
    daily_reports?: boolean;
    weekly_reports?: boolean;
    monthly_reports?: boolean;
    auto_reporting?: boolean;
  }): Promise<UserSettings> {
    return this.updateSettings(notifications);
  }

  /**
   * Update business hours
   */
  async updateBusinessHours(
    startTime: string,
    endTime: string,
    workingDays?: number[]
  ): Promise<UserSettings> {
    const updates: UpdateSettingsRequest = {
      business_hours_start: startTime,
      business_hours_end: endTime,
    };

    if (workingDays) {
      updates.working_days = workingDays;
    }

    return this.updateSettings(updates);
  }
}

// Export singleton instance
export const settingsService = new SettingsService();

/**
 * React hook for settings management
 */
export const useSettings = () => {
  const [settings, setSettings] = React.useState<UserSettings | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  /**
   * Load settings from API
   */
  const loadSettings = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const userSettings = await settingsService.getSettings();
      setSettings(userSettings);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load settings';
      setError(errorMessage);
      console.error('Settings load error:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Update settings
   */
  const updateSettings = async (updates: UpdateSettingsRequest) => {
    setLoading(true);
    setError(null);
    
    try {
      const updatedSettings = await settingsService.updateSettings(updates);
      setSettings(updatedSettings);
      return updatedSettings;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update settings';
      setError(errorMessage);
      console.error('Settings update error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    settings,
    loading,
    error,
    loadSettings,
    updateSettings,
    refetch: loadSettings,
  };
};

export default settingsService;
