import React, { useState } from "react";
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
import { authAPI } from "@/services/api";

const Register = () => {
  const navigate = useNavigate();
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
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setFieldErrors({});

    // Client-side validation
    const errors: Record<string, string> = {};

    if (!formData.businessName.trim()) {
      errors.businessName = "Business name is required";
    }

    if (!formData.ownerName.trim()) {
      errors.ownerName = "Owner name is required";
    }

    if (!formData.email.trim()) {
      errors.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Please enter a valid email address";
    }

    if (!formData.phone.trim()) {
      errors.phone = "Phone number is required";
    }

    if (!formData.password) {
      errors.password = "Password is required";
    } else if (formData.password.length < 8) {
      errors.password = "Password must be at least 8 characters long";
    }

    if (formData.password !== formData.confirmPassword) {
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
        setError(err.message);
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
              <h1 className="text-5xl font-bold mb-2">AquaManage</h1>
              <p className="text-green-100 text-xl">Complete Fish Business Solution</p>
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
          {/* Mobile Logo (visible only on small screens) */}
          <div className="lg:hidden text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 bg-blue-600 rounded-xl shadow-lg">
                <Fish className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                AquaManage
              </h1>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Create your admin account to get started
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
                      fieldErrors.businessName ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                    }`}
                    required
                  />
                </div>
                {fieldErrors.businessName && (
                  <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {fieldErrors.businessName}
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
                      fieldErrors.ownerName ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                    }`}
                    required
                  />
                </div>
                {fieldErrors.ownerName && (
                  <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {fieldErrors.ownerName}
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
                        fieldErrors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                      }`}
                      required
                    />
                  </div>
                  {fieldErrors.email && (
                    <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {fieldErrors.email}
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
                        fieldErrors.phone ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                      }`}
                      required
                    />
                  </div>
                  {fieldErrors.phone && (
                    <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {fieldErrors.phone}
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
                      className="pl-10 pr-10 h-10 text-sm border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg bg-gray-50/50 dark:bg-gray-800/50"
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
                      className="pl-10 pr-10 h-10 text-sm border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg bg-gray-50/50 dark:bg-gray-800/50"
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
