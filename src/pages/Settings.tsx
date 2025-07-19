/**
 * Settings Page Component
 * Comprehensive settings management for user preferences, account details, and system configuration
 */

import React, { useState, useEffect } from 'react';
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  User,
  CreditCard,
  FileText,
  Globe,
  Palette,
  Bell,
  Mail,
  Phone,
  Building,
  Save,
  Loader2
} from 'lucide-react';
import { useTranslation } from "react-i18next";
import { usePageTitle } from "@/hooks/use-page-title";
import { useUserProfile } from "@/hooks/use-user-profile";
import { toast } from "sonner";
import { useCurrency, CURRENCIES, type Currency } from '@/contexts/CurrencyContext';

const Settings: React.FC = () => {
  const { t, i18n } = useTranslation();
  usePageTitle("Settings");

  // Fetch user profile data from database using custom hook
  // This hook automatically fetches data on mount (read-only, no editing)
  const { profile, isLoading: profileLoading, error: profileError } = useUserProfile();

  // Currency context
  const { currency, updateCurrency, isLoading: currencyLoading } = useCurrency();

  // Local state for editing user details
  const [userDetails, setUserDetails] = useState({
    businessName: "",
    ownerName: "",
    email: "",
    phone: ""
  });

  // Update local state when profile data is loaded
  useEffect(() => {
    if (profile) {
      setUserDetails({
        businessName: profile.businessName || "",
        ownerName: profile.ownerName || "",
        email: profile.email || "",
        phone: profile.phoneNumber || ""
      });
    }
  }, [profile]);

  // Settings state
  const [settings, setSettings] = useState({
    language: i18n.language,
    currency: currency,
    theme: localStorage.getItem('theme') || 'light',
    autoReporting: true,
    emailNotifications: true,
    smsNotifications: false,
    lowStockAlerts: true,
    dailyReports: true,
    weeklyReports: true,
    monthlyReports: false
  });

  // Update settings when currency changes from context
  useEffect(() => {
    setSettings(prev => ({
      ...prev,
      currency: currency
    }));
  }, [currency]);

  // Payment status state
  const [paymentStatus, setPaymentStatus] = useState({
    plan: "Premium",
    status: "Active",
    nextBilling: "2024-08-07",
    amount: "$29.99/month"
  });

  // Remove edit functionality - all fields are now read-only
  // const [isEditing, setIsEditing] = useState(false);
  // const [isSaving, setIsSaving] = useState(false);

  // Handle settings change (keeping only settings functionality)
  const handleSettingsChange = async (field: string, value: string | boolean) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));

    // Apply changes immediately for some settings
    if (field === 'language') {
      i18n.changeLanguage(value as string);
      localStorage.setItem('language', value as string);
    }

    if (field === 'theme') {
      localStorage.setItem('theme', value as string);
      // Apply theme change logic here
      document.documentElement.classList.toggle('dark', value === 'dark');
    }

    if (field === 'currency') {
      try {
        await updateCurrency(value as Currency);
      } catch (error) {
        console.error('Failed to update currency:', error);
        // Revert the state change if API call fails
        setSettings(prev => ({
          ...prev,
          currency: currency // revert to previous currency
        }));
      }
    }
  };

  // Removed user details editing functionality
  // All user details are now read-only and fetched from database

  // Save settings
  const handleSaveSettings = async () => {
    try {
      // Save settings to localStorage or API
      Object.entries(settings).forEach(([key, value]) => {
        localStorage.setItem(`setting_${key}`, JSON.stringify(value));
      });
      
      toast.success("Settings saved successfully!");
    } catch (error) {
      toast.error("Failed to save settings. Please try again.");
    }
  };

  // Load settings on component mount
  useEffect(() => {
    const loadedSettings = { ...settings };
    Object.keys(settings).forEach(key => {
      const saved = localStorage.getItem(`setting_${key}`);
      if (saved) {
        try {
          const parsedValue = JSON.parse(saved);
          (loadedSettings as any)[key] = parsedValue;
        } catch (e) {
          // Ignore parsing errors
          console.warn(`Failed to parse setting ${key}:`, e);
        }
      }
    });
    setSettings(loadedSettings);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">{t('settings.title', 'Settings')}</h1>
          <p className="text-muted-foreground">
            {t('settings.description', 'Manage your account settings and preferences')}
          </p>
        </div>

        {/* User Details Section */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                User Details
              </CardTitle>
              <CardDescription>
                View your business and personal information (read-only)
              </CardDescription>
            </div>
          </CardHeader>
            <CardContent className="space-y-6">
              {profileLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                  <span className="ml-2 text-gray-600 dark:text-gray-400">Loading user details...</span>
                </div>
              ) : profileError ? (
                <div className="text-center py-8">
                  <p className="text-red-600 dark:text-red-400 mb-2">Failed to load user details</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{profileError}</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-4">
                    <Avatar className="h-20 w-20">
                      <AvatarFallback className="text-lg">
                        {userDetails.ownerName ? userDetails.ownerName.split(' ').map(n => n[0]).join('') : 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-lg font-semibold">{userDetails.ownerName || 'Loading...'}</h3>
                      <p className="text-gray-600 dark:text-gray-400">{userDetails.businessName || 'Loading...'}</p>
                      <Badge variant="secondary" className="mt-1">Business Owner</Badge>
                    </div>
                  </div>

                  <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="businessName">Business Name</Label>
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-gray-500" />
                    <Input
                      id="businessName"
                      value={userDetails.businessName}
                      disabled={true}
                      readOnly
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ownerName">Owner Name</Label>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <Input
                      id="ownerName"
                      value={userDetails.ownerName}
                      disabled={true}
                      readOnly
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <Input
                      id="email"
                      type="email"
                      value={userDetails.email}
                      disabled={true}
                      readOnly
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <Input
                      id="phone"
                      value={userDetails.phone}
                      disabled={true}
                      readOnly
                    />
                  </div>
                </div>

                {/* All user details are now read-only and fetched from the database */}
                {/* Business Address and Tax ID fields removed as requested */}
              </div>

                </>
              )}
          </CardContent>
        </Card>

        {/* Payment Status Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Status
            </CardTitle>
            <CardDescription>
              Manage your subscription and billing information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Current Plan
                </Label>
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    {paymentStatus.plan}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Status
                </Label>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium">{paymentStatus.status}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Next Billing
                </Label>
                <p className="text-sm font-medium">{paymentStatus.nextBilling}</p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Amount
                </Label>
                <p className="text-sm font-medium">{paymentStatus.amount}</p>
              </div>
            </div>

            <Separator />

            <div className="flex gap-3">
              <Button variant="outline">
                <CreditCard className="h-4 w-4 mr-2" />
                Update Payment Method
              </Button>
              <Button variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                View Billing History
              </Button>
              <Button variant="outline">
                Upgrade Plan
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Automatic Reporting Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Automatic Reporting
            </CardTitle>
            <CardDescription>
              Configure automatic report generation and delivery
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Enable Automatic Reporting</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Automatically generate and send reports
                  </p>
                </div>
                <Switch
                  checked={settings.autoReporting}
                  onCheckedChange={(checked) => handleSettingsChange('autoReporting', checked)}
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <Label className="text-sm font-medium">Report Frequency</Label>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-sm">Daily Reports</Label>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Daily sales and inventory summary
                      </p>
                    </div>
                    <Switch
                      checked={settings.dailyReports}
                      onCheckedChange={(checked) => handleSettingsChange('dailyReports', checked)}
                      disabled={!settings.autoReporting}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-sm">Weekly Reports</Label>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Weekly performance and analytics
                      </p>
                    </div>
                    <Switch
                      checked={settings.weeklyReports}
                      onCheckedChange={(checked) => handleSettingsChange('weeklyReports', checked)}
                      disabled={!settings.autoReporting}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-sm">Monthly Reports</Label>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Comprehensive monthly business report
                      </p>
                    </div>
                    <Switch
                      checked={settings.monthlyReports}
                      onCheckedChange={(checked) => handleSettingsChange('monthlyReports', checked)}
                      disabled={!settings.autoReporting}
                    />
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            <div className="flex justify-end">
              <Button onClick={handleSaveSettings} className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                Save Report Settings
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Language, Currency & Theme Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Language, Currency & Theme
            </CardTitle>
            <CardDescription>
              Customize your language, currency, and appearance preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Language
                </Label>
                <Select
                  value={settings.language}
                  onValueChange={(value) => handleSettingsChange('language', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">🇺🇸 English</SelectItem>
                    <SelectItem value="rw">🇷🇼 Kinyarwanda</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Currency
                </Label>
                <Select
                  value={settings.currency}
                  onValueChange={(value) => handleSettingsChange('currency', value)}
                  disabled={currencyLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">💵 {CURRENCIES.USD.name} ({CURRENCIES.USD.symbol})</SelectItem>
                    <SelectItem value="RWF">🇷🇼 {CURRENCIES.RWF.name} ({CURRENCIES.RWF.symbol})</SelectItem>
                  </SelectContent>
                </Select>
                {currencyLoading && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Updating currency...
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  Theme
                </Label>
                <Select
                  value={settings.theme}
                  onValueChange={(value) => handleSettingsChange('theme', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">☀️ Light</SelectItem>
                    <SelectItem value="dark">🌙 Dark</SelectItem>
                    <SelectItem value="system">💻 System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            <div className="flex justify-end">
              <Button onClick={handleSaveSettings} className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                Save Preferences
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notification Settings
            </CardTitle>
            <CardDescription>
              Manage how you receive notifications and alerts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Email Notifications</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Receive notifications via email
                  </p>
                </div>
                <Switch
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) => handleSettingsChange('emailNotifications', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-sm font-medium">SMS Notifications</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Receive notifications via SMS (Coming Soon)
                  </p>
                </div>
                <Switch
                  checked={settings.smsNotifications}
                  onCheckedChange={(checked) => handleSettingsChange('smsNotifications', checked)}
                  disabled
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Low Stock Alerts</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Get notified when inventory is running low
                  </p>
                </div>
                <Switch
                  checked={settings.lowStockAlerts}
                  onCheckedChange={(checked) => handleSettingsChange('lowStockAlerts', checked)}
                />
              </div>
            </div>

            <Separator />

            <div className="flex justify-end">
              <Button onClick={handleSaveSettings} className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                Save Notification Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Settings;
