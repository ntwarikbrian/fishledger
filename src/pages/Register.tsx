import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Fish,
  Eye,
  EyeOff,
  User,
  Lock,
  Mail,
  Building,
  Phone,
  CheckCircle,
  ArrowRight,
  Loader2,
  AlertCircle,
  Shield,
  TrendingUp,
  BarChart3,
  Users,
  Package,
  Zap,
  FileText,
  Calculator,
  MessageSquare
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import { CompactLanguageSwitcher } from "@/components/ui/language-switcher";
import { usePageTitle } from "@/hooks/use-page-title";
import { authAPI } from "@/services/api";

// Password strength validation utility
const validatePasswordStrength = (password: string) => {
  const checks = {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
  };

  const score = Object.values(checks).filter(Boolean).length;

  return {
    checks,
    score,
    strength: score < 2 ? 'weak' : score < 4 ? 'medium' : 'strong',
    isValid: checks.length && checks.lowercase && checks.number
  };
};

// Email validation utility
const validateEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return {
    isValid: emailRegex.test(email),
    message: !email ? 'Email is required' :
             !emailRegex.test(email) ? 'Please enter a valid email address' : ''
  };
};

// Business name validation utility
const validateBusinessName = (name: string) => {
  const trimmed = name.trim();
  return {
    isValid: trimmed.length >= 2 && trimmed.length <= 100,
    message: !trimmed ? 'Business name is required' :
             trimmed.length < 2 ? 'Business name must be at least 2 characters' :
             trimmed.length > 100 ? 'Business name must be less than 100 characters' : ''
  };
};

// Phone validation utility
const validatePhone = (phone: string) => {
  const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
  return {
    isValid: phoneRegex.test(phone),
    message: !phone ? 'Phone number is required' :
             !phoneRegex.test(phone) ? 'Please enter a valid phone number' : ''
  };
};

const Register = () => {
  const { t } = useTranslation();
  usePageTitle('auth.registerTitle', 'Register');

  const navigate = useNavigate();

  // Redirect admin users to login with Google OAuth
  React.useEffect(() => {
    // Show a message and redirect to login for Google OAuth
    setTimeout(() => {
      navigate('/login', { 
        state: { 
          message: 'Business owners now sign up automatically with Google. Please use the Admin tab to sign in with Google.',
          tab: 'admin'
        }
      });
    }, 3000);
  }, [navigate]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState({
    businessName: "",
    ownerName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Validation states
  const [passwordStrength, setPasswordStrength] = useState(validatePasswordStrength(""));
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [isCheckingBusinessName, setIsCheckingBusinessName] = useState(false);
  const [validationStates, setValidationStates] = useState({
    email: { isValid: false, message: "" },
    businessName: { isValid: false, message: "" },
    phone: { isValid: false, message: "" },
    ownerName: { isValid: false, message: "" }
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear field-specific error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({
        ...prev,
        [field]: ""
      }));
    }

    // Clear general error
    if (error) {
      setError("");
    }

    // Real-time validation
    switch (field) {
      case 'password':
        setPasswordStrength(validatePasswordStrength(value));
        break;
      case 'email':
        const emailValidation = validateEmail(value);
        setValidationStates(prev => ({
          ...prev,
          email: emailValidation
        }));
        break;
      case 'businessName':
        const businessValidation = validateBusinessName(value);
        setValidationStates(prev => ({
          ...prev,
          businessName: businessValidation
        }));
        break;
      case 'phone':
        const phoneValidation = validatePhone(value);
        setValidationStates(prev => ({
          ...prev,
          phone: phoneValidation
        }));
        break;
      case 'ownerName':
        const ownerValidation = {
          isValid: value.trim().length >= 2 && value.trim().length <= 100,
          message: !value.trim() ? 'Owner name is required' :
                   value.trim().length < 2 ? 'Owner name must be at least 2 characters' :
                   value.trim().length > 100 ? 'Owner name must be less than 100 characters' : ''
        };
        setValidationStates(prev => ({
          ...prev,
          ownerName: ownerValidation
        }));
        break;
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setFieldErrors({});

    // Enhanced client-side validation
    const errors: Record<string, string> = {};

    // Validate business name
    const businessValidation = validateBusinessName(formData.businessName);
    if (!businessValidation.isValid) {
      errors.businessName = businessValidation.message;
    }

    // Validate owner name
    if (!formData.ownerName.trim()) {
      errors.ownerName = "Owner name is required";
    } else if (formData.ownerName.trim().length < 2) {
      errors.ownerName = "Owner name must be at least 2 characters";
    }

    // Validate email
    const emailValidation = validateEmail(formData.email);
    if (!emailValidation.isValid) {
      errors.email = emailValidation.message;
    }

    // Validate phone
    const phoneValidation = validatePhone(formData.phone);
    if (!phoneValidation.isValid) {
      errors.phone = phoneValidation.message;
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(formData.password);
    if (!formData.password) {
      errors.password = "Password is required";
    } else if (!passwordValidation.isValid) {
      errors.password = "Password must be at least 8 characters and contain letters and numbers";
    }

    // Validate password confirmation
    if (!formData.confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setIsLoading(false);
      return;
    }

    try {
      // Call real API
      const response = await authAPI.register({
        business_name: formData.businessName,
        owner_name: formData.ownerName,
        email_address: formData.email,
        phone_number: formData.phone,
        password: formData.password,
        confirm_password: formData.confirmPassword,
      });

      if (response.success) {
        setSuccess(true);

        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          navigate("/");
        }, 2000);
      } else {
        setError(response.message || "Registration failed");
      }

    } catch (err) {
      if (err instanceof Error) {
        const errorMessage = err.message;

        // Handle specific backend errors with user-friendly messages
        if (errorMessage.includes('Email already registered') || errorMessage.includes('email already exists')) {
          setFieldErrors({ email: 'This email is already registered. Please use a different email or try logging in.' });
        } else if (errorMessage.includes('Business name already taken') || errorMessage.includes('business name already exists')) {
          setFieldErrors({ businessName: 'This business name is already taken. Please choose a different name.' });
        } else if (errorMessage.includes('Password validation failed') || errorMessage.includes('password too weak')) {
          setFieldErrors({ password: 'Password is too weak. Please use a stronger password with letters and numbers.' });
        } else if (errorMessage.includes('Too many authentication attempts') || errorMessage.includes('Too many requests')) {
          setError('Too many registration attempts. Please wait a few minutes and try again.');
        } else if (errorMessage.includes('Rate limit') || errorMessage.includes('rate limit')) {
          setError('Please wait a moment before trying again.');
        } else if (errorMessage.includes('Validation failed')) {
          setError('Please check your information and try again.');
        } else if (errorMessage.includes('Network error') || errorMessage.includes('fetch')) {
          setError('Network error. Please check your internet connection and try again.');
        } else if (errorMessage.includes('Server error')) {
          setError('Server is temporarily unavailable. Please try again later.');
        } else {
          setError(errorMessage);
        }
      } else {
        setError("Registration failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl border-0 bg-white dark:bg-gray-900">
          <CardContent className="pt-8 pb-8 text-center space-y-6">
            <div className="flex justify-center">
              <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-full">
                <CheckCircle className="h-16 w-16 text-green-600" />
              </div>
            </div>
            <div className="space-y-3">
              <h2 className="text-2xl font-bold text-green-900 dark:text-green-100">Welcome to AquaManage!</h2>
              <p className="text-green-700 dark:text-green-300">
                Your admin account for <strong>{formData.businessName}</strong> has been created successfully.
              </p>
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-sm text-green-600 dark:text-green-400">
                  You're being redirected to your dashboard...
                </p>
              </div>
            </div>
            <Button
              onClick={() => navigate("/")}
              className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-medium flex items-center justify-center gap-2"
            >
              Go to Dashboard
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950 flex">
      {/* Left Side - System Description (Larger) */}
      <div className="hidden lg:flex lg:w-3/5 xl:w-2/3 bg-gradient-to-br from-green-600 to-green-800 p-12 flex-col justify-center relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-32 h-32 bg-white rounded-full"></div>
          <div className="absolute bottom-32 right-16 w-24 h-24 bg-white rounded-full"></div>
          <div className="absolute top-1/2 right-1/3 w-16 h-16 bg-white rounded-full"></div>
        </div>

        <div className="relative z-10 text-white">
          {/* Logo and Title */}
          <div className="flex items-center gap-4 mb-8">
            <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
              <Fish className="h-12 w-12 text-white" />
            </div>
            <div>
              <h1 className="text-5xl font-bold mb-2">LocalFishing</h1>
              <p className="text-green-100 text-xl">{t('auth.completeBusinessSolution', 'Complete Fish Business Solution')}</p>
            </div>
          </div>

          {/* Description */}
          <div className="mb-12">
            <h2 className="text-3xl font-semibold mb-6">Everything You Need to Manage Your Fish Business</h2>
            <p className="text-green-100 text-lg leading-relaxed mb-8">
              Join thousands of fish business owners who trust AquaManage to streamline their operations.
              From inventory management to sales tracking, expense monitoring to team coordination -
              we've got everything covered in one powerful platform.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-2 gap-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                <Package className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Smart Inventory</h3>
                <p className="text-green-100 text-sm">Track stock levels, manage both boxed and weight-based products with automated alerts.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Sales Analytics</h3>
                <p className="text-green-100 text-sm">Detailed reports, profit analysis, and business insights to grow your revenue.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                <Calculator className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Quick Math Tools</h3>
                <p className="text-green-100 text-sm">Built-in calculators for purchase costs, profit margins, and pricing strategies.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Team Management</h3>
                <p className="text-green-100 text-sm">Manage workers, assign tasks, track performance with role-based permissions.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Document Storage</h3>
                <p className="text-green-100 text-sm">Organize receipts, contracts, and business documents in secure folders.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                <MessageSquare className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Communication Hub</h3>
                <p className="text-green-100 text-sm">Contact management, messaging, and automated notifications for your business.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Registration Form (Smaller) */}
      <div className="w-full lg:w-2/5 xl:w-1/3 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Language Switcher */}
          <div className="flex justify-end mb-4">
            <CompactLanguageSwitcher />
          </div>

          {/* Mobile Logo (visible only on small screens) */}
          <div className="lg:hidden text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 bg-blue-600 rounded-xl shadow-lg">
                <Fish className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                LocalFishing
              </h1>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              {t('auth.createAccountToStart', 'Create your admin account to get started')}
            </p>
          </div>

        {/* Registration Form */}
        <Card className="shadow-xl border border-gray-200/50 dark:border-gray-700/50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">
              Create Account
            </CardTitle>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Set up your business account
            </p>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <form onSubmit={handleRegister} className="space-y-4">
              {/* Business Name */}
              <div className="space-y-1">
                <Label htmlFor="businessName" className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Business Name *
                </Label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="businessName"
                    type="text"
                    placeholder="Your Fish Business"
                    value={formData.businessName}
                    onChange={(e) => handleInputChange("businessName", e.target.value)}
                    className={`pl-10 h-10 text-sm border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg bg-gray-50/50 dark:bg-gray-800/50 ${
                      fieldErrors.businessName ? 'border-red-500 focus:border-red-500 focus:ring-red-500' :
                      formData.businessName && validationStates.businessName.isValid ? 'border-green-500' : ''
                    }`}
                    required
                  />
                  {formData.businessName && validationStates.businessName.isValid && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500">
                      ✓
                    </div>
                  )}
                </div>
                {fieldErrors.businessName && (
                  <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {fieldErrors.businessName}
                  </p>
                )}
                {!fieldErrors.businessName && validationStates.businessName.message && (
                  <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {validationStates.businessName.message}
                  </p>
                )}
              </div>

              {/* Owner Name */}
              <div className="space-y-1">
                <Label htmlFor="ownerName" className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Owner Name *
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="ownerName"
                    type="text"
                    placeholder="Your Full Name"
                    value={formData.ownerName}
                    onChange={(e) => handleInputChange("ownerName", e.target.value)}
                    className={`pl-10 h-10 text-sm border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg bg-gray-50/50 dark:bg-gray-800/50 ${
                      fieldErrors.ownerName ? 'border-red-500 focus:border-red-500 focus:ring-red-500' :
                      formData.ownerName && validationStates.ownerName.isValid ? 'border-green-500' : ''
                    }`}
                    required
                  />
                  {formData.ownerName && validationStates.ownerName.isValid && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500">
                      ✓
                    </div>
                  )}
                </div>
                {fieldErrors.ownerName && (
                  <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {fieldErrors.ownerName}
                  </p>
                )}
                {!fieldErrors.ownerName && validationStates.ownerName.message && (
                  <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {validationStates.ownerName.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Email */}
                <div className="space-y-1">
                  <Label htmlFor="email" className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    Email Address *
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      className={`pl-10 h-10 text-sm border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg bg-gray-50/50 dark:bg-gray-800/50 ${
                        fieldErrors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500' :
                        formData.email && validationStates.email.isValid ? 'border-green-500' : ''
                      }`}
                      required
                    />
                    {formData.email && validationStates.email.isValid && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500">
                        ✓
                      </div>
                    )}
                  </div>
                  {fieldErrors.email && (
                    <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {fieldErrors.email}
                    </p>
                  )}
                  {!fieldErrors.email && validationStates.email.message && (
                    <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {validationStates.email.message}
                    </p>
                  )}
                </div>

                {/* Phone */}
                <div className="space-y-1">
                  <Label htmlFor="phone" className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    Phone Number *
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+1 (555) 123-4567"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      className={`pl-10 h-10 text-sm border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg bg-gray-50/50 dark:bg-gray-800/50 ${
                        fieldErrors.phone ? 'border-red-500 focus:border-red-500 focus:ring-red-500' :
                        formData.phone && validationStates.phone.isValid ? 'border-green-500' : ''
                      }`}
                      required
                    />
                    {formData.phone && validationStates.phone.isValid && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500">
                        ✓
                      </div>
                    )}
                  </div>
                  {fieldErrors.phone && (
                    <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {fieldErrors.phone}
                    </p>
                  )}
                  {!fieldErrors.phone && validationStates.phone.message && (
                    <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {validationStates.phone.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Password */}
                <div className="space-y-1">
                  <Label htmlFor="password" className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    Password *
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => handleInputChange("password", e.target.value)}
                      className={`pl-10 pr-10 h-10 text-sm border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg bg-gray-50/50 dark:bg-gray-800/50 ${
                        fieldErrors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500' :
                        formData.password && passwordStrength.isValid ? 'border-green-500' : ''
                      }`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  {/* Password Strength Indicator */}
                  {formData.password && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full transition-all duration-300 ${
                              passwordStrength.strength === 'weak' ? 'bg-red-500 w-1/3' :
                              passwordStrength.strength === 'medium' ? 'bg-yellow-500 w-2/3' :
                              'bg-green-500 w-full'
                            }`}
                          />
                        </div>
                        <span className={`text-xs font-medium ${
                          passwordStrength.strength === 'weak' ? 'text-red-600 dark:text-red-400' :
                          passwordStrength.strength === 'medium' ? 'text-yellow-600 dark:text-yellow-400' :
                          'text-green-600 dark:text-green-400'
                        }`}>
                          {passwordStrength.strength === 'weak' ? 'Weak' :
                           passwordStrength.strength === 'medium' ? 'Medium' : 'Strong'}
                        </span>
                      </div>

                      {/* Password Requirements */}
                      <div className="grid grid-cols-2 gap-1 text-xs">
                        <div className={`flex items-center gap-1 ${passwordStrength.checks.length ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`}>
                          {passwordStrength.checks.length ? '✓' : '○'} 8+ characters
                        </div>
                        <div className={`flex items-center gap-1 ${passwordStrength.checks.lowercase ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`}>
                          {passwordStrength.checks.lowercase ? '✓' : '○'} Lowercase
                        </div>
                        <div className={`flex items-center gap-1 ${passwordStrength.checks.number ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`}>
                          {passwordStrength.checks.number ? '✓' : '○'} Number
                        </div>
                        <div className={`flex items-center gap-1 ${passwordStrength.checks.uppercase ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`}>
                          {passwordStrength.checks.uppercase ? '✓' : '○'} Uppercase
                        </div>
                      </div>
                    </div>
                  )}

                  {fieldErrors.password && (
                    <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {fieldErrors.password}
                    </p>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-1">
                  <Label htmlFor="confirmPassword" className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    Confirm Password *
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                      className={`pl-10 pr-10 h-10 text-sm border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg bg-gray-50/50 dark:bg-gray-800/50 ${
                        fieldErrors.confirmPassword ? 'border-red-500 focus:border-red-500 focus:ring-red-500' :
                        formData.confirmPassword && formData.password === formData.confirmPassword ? 'border-green-500' : ''
                      }`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  {/* Password Match Indicator */}
                  {formData.confirmPassword && (
                    <div className="flex items-center gap-1 text-xs">
                      {formData.password === formData.confirmPassword ? (
                        <span className="text-green-600 dark:text-green-400 flex items-center gap-1">
                          ✓ Passwords match
                        </span>
                      ) : (
                        <span className="text-red-600 dark:text-red-400 flex items-center gap-1">
                          ✗ Passwords don't match
                        </span>
                      )}
                    </div>
                  )}

                  {fieldErrors.confirmPassword && (
                    <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {fieldErrors.confirmPassword}
                    </p>
                  )}
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-center gap-2 justify-center">
                    <AlertCircle className="h-3 w-3 text-red-600 dark:text-red-400" />
                    <p className="text-xs text-red-600 dark:text-red-400 text-center">{error}</p>
                  </div>
                </div>
              )}

              {/* Register Button */}
              <Button
                type="submit"
                className="w-full h-9 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-sm"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span className="text-sm">Creating Account...</span>
                  </>
                ) : (
                  <>
                    <span className="text-sm">Create Account</span>
                    <ArrowRight className="h-3 w-3" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

          {/* Login Link */}
          <div className="text-center mt-6">
            <Separator className="my-4" />
            <p className="text-gray-500 dark:text-gray-400 text-xs">
              Already have an account?{" "}
              <button
                onClick={() => navigate("/login")}
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium underline underline-offset-2 transition-colors"
              >
                Sign in here
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
