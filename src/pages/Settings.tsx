/**
 * Settings Page Component
 * Comprehensive settings management for user preferences, account details, and system configuration
 */

import React, { useState, useEffect } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  User, 
  CreditCard, 
  FileText, 
  Globe, 
  Palette, 
  Bell, 
  Shield, 
  Mail,
  Phone,
  Building,
  Save,
  Edit,
  Check,
  X
} from 'lucide-react';
import { useTranslation } from "react-i18next";
import { usePageTitle } from "@/hooks/use-page-title";
import { toast } from "sonner";

const Settings: React.FC = () => {
  const { t, i18n } = useTranslation();
  usePageTitle("Settings");

  // User details state
  const [userDetails, setUserDetails] = useState({
    businessName: "AquaFresh Fish Market",
    ownerName: "John Doe",
    email: "john@aquafresh.com",
    phone: "+1-555-0123",
    address: "123 Harbor Street, Fishing District",
    taxId: "TAX-123456789"
  });

  // Settings state
  const [settings, setSettings] = useState({
    language: i18n.language,
    theme: localStorage.getItem('theme') || 'light',
    autoReporting: true,
    emailNotifications: true,
    smsNotifications: false,
    lowStockAlerts: true,
    dailyReports: true,
    weeklyReports: true,
    monthlyReports: false
  });

  // Payment status state
  const [paymentStatus, setPaymentStatus] = useState({
    plan: "Premium",
    status: "Active",
    nextBilling: "2024-08-07",
    amount: "$29.99/month"
  });

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Handle user details change
  const handleUserDetailsChange = (field: string, value: string) => {
    setUserDetails(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle settings change
  const handleSettingsChange = (field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));

    // Apply changes immediately for some settings
    if (field === 'language') {
      i18n.changeLanguage(value);
      localStorage.setItem('language', value);
    }
    
    if (field === 'theme') {
      localStorage.setItem('theme', value);
      // Apply theme change logic here
      document.documentElement.classList.toggle('dark', value === 'dark');
    }
  };

  // Save user details
  const handleSaveUserDetails = async () => {
    setIsSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success("User details updated successfully!");
      setIsEditing(false);
    } catch (error) {
      toast.error("Failed to update user details. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

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
          loadedSettings[key as keyof typeof settings] = JSON.parse(saved);
        } catch (e) {
          // Ignore parsing errors
        }
      }
    });
    setSettings(loadedSettings);
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {t('settings.title', 'Settings')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t('settings.description', 'Manage your account settings and preferences')}
          </p>
        </div>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Billing
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Reports
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Preferences
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    User Details
                  </CardTitle>
                  <CardDescription>
                    Manage your business and personal information
                  </CardDescription>
                </div>
                <Button
                  variant={isEditing ? "outline" : "default"}
                  onClick={() => setIsEditing(!isEditing)}
                  className="flex items-center gap-2"
                >
                  {isEditing ? (
                    <>
                      <X className="h-4 w-4" />
                      Cancel
                    </>
                  ) : (
                    <>
                      <Edit className="h-4 w-4" />
                      Edit
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src="/placeholder-avatar.jpg" />
                  <AvatarFallback className="text-lg">
                    {userDetails.ownerName.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">{userDetails.ownerName}</h3>
                  <p className="text-gray-600 dark:text-gray-400">{userDetails.businessName}</p>
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
                      onChange={(e) => handleUserDetailsChange('businessName', e.target.value)}
                      disabled={!isEditing}
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
                      onChange={(e) => handleUserDetailsChange('ownerName', e.target.value)}
                      disabled={!isEditing}
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
                      onChange={(e) => handleUserDetailsChange('email', e.target.value)}
                      disabled={!isEditing}
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
                      onChange={(e) => handleUserDetailsChange('phone', e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">Business Address</Label>
                  <Input
                    id="address"
                    value={userDetails.address}
                    onChange={(e) => handleUserDetailsChange('address', e.target.value)}
                    disabled={!isEditing}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="taxId">Tax ID / Business License</Label>
                  <Input
                    id="taxId"
                    value={userDetails.taxId}
                    onChange={(e) => handleUserDetailsChange('taxId', e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              {isEditing && (
                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveUserDetails}
                    disabled={isSaving}
                    className="flex items-center gap-2"
                  >
                    {isSaving ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing" className="space-y-6">
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
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-6">
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

                <Separator />

                <div className="flex justify-end">
                  <Button onClick={handleSaveSettings} className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    Save Report Settings
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Language & Theme
              </CardTitle>
              <CardDescription>
                Customize your language and appearance preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
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

                <Separator />

                <div className="flex justify-end">
                  <Button onClick={handleSaveSettings} className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    Save Notification Settings
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
