import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Fish,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Building,
  Mail,
  User,
  Lock,
  Eye,
  EyeOff,
  CheckCircle
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { CompactLanguageSwitcher } from "@/components/ui/language-switcher";
import { usePageTitle } from "@/hooks/use-page-title";
import { authAPI } from "@/services/api";
import { toast } from "sonner";

type RegistrationStep = 1 | 2 | 3 | 4;

const Register = () => {
  const { t } = useTranslation();
  usePageTitle('auth.registerTitle', 'Register');

  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<RegistrationStep>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form data
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const validateStep = (step: RegistrationStep): boolean => {
    setError("");
    
    switch (step) {
      case 1:
        if (!businessName.trim() || businessName.length < 2) {
          setError("Business name must be at least 2 characters");
          return false;
        }
        return true;
      
      case 2:
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email.trim() || !emailRegex.test(email)) {
          setError("Please enter a valid email address");
          return false;
        }
        return true;
      
      case 3:
        if (!ownerName.trim() || ownerName.length < 2) {
          setError("Owner name must be at least 2 characters");
          return false;
        }
        return true;
      
      case 4:
        if (!password || password.length < 8) {
          setError("Password must be at least 8 characters");
          return false;
        }
        if (password !== confirmPassword) {
          setError("Passwords do not match");
          return false;
        }
        return true;
      
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 4) as RegistrationStep);
    }
  };

  const handleBack = () => {
    setError("");
    setCurrentStep((prev) => Math.max(prev - 1, 1) as RegistrationStep);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep(4)) {
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await authAPI.register({
        business_name: businessName,
        email_address: email,
        owner_name: ownerName,
        password: password,
        confirm_password: confirmPassword,
      });

      if (response.success) {
        toast.success("Account created successfully! Please login.");
        navigate("/login");
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Language Switcher */}
        <div className="flex justify-end mb-6">
          <CompactLanguageSwitcher />
        </div>

        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-green-600 rounded-xl shadow-lg">
              <Fish className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              LocalFishing
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            {t('auth.createAccountToStart', 'Create your business account to get started')}
          </p>
        </div>

        {/* Multi-Step Registration Form */}
        <Card className="shadow-lg border-0 bg-white dark:bg-gray-800">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">
              Create Account - Step {currentStep} of 4
            </CardTitle>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              {currentStep === 1 && "Tell us about your business"}
              {currentStep === 2 && "What's your email address?"}
              {currentStep === 3 && "Who's the business owner?"}
              {currentStep === 4 && "Secure your account"}
            </p>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            {/* Progress Indicator */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                {[1, 2, 3, 4].map((step) => (
                  <div
                    key={step}
                    className={`flex items-center justify-center w-8 h-8 rounded-full ${
                      step < currentStep
                        ? "bg-green-600 text-white"
                        : step === currentStep
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 dark:bg-gray-700 text-gray-500"
                    }`}
                  >
                    {step < currentStep ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <span className="text-sm font-medium">{step}</span>
                    )}
                  </div>
                ))}
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(currentStep / 4) * 100}%` }}
                />
              </div>
            </div>

            <form onSubmit={handleRegister} className="space-y-6">
              {/* Step 1: Business Name */}
              {currentStep === 1 && (
                <div className="space-y-2">
                  <Label htmlFor="businessName" className="text-sm font-medium">
                    Business Name
                  </Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="businessName"
                      type="text"
                      placeholder="Enter your business name"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className="pl-10 h-11"
                      autoFocus
                      required
                    />
                  </div>
                </div>
              )}

              {/* Step 2: Email */}
              {currentStep === 2 && (
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-11"
                      autoFocus
                      required
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Owner Name */}
              {currentStep === 3 && (
                <div className="space-y-2">
                  <Label htmlFor="ownerName" className="text-sm font-medium">
                    Owner's Full Name
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="ownerName"
                      type="text"
                      placeholder="John Doe"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      className="pl-10 h-11"
                      autoFocus
                      required
                    />
                  </div>
                </div>
              )}

              {/* Step 4: Password */}
              {currentStep === 4 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-10 h-11"
                        autoFocus
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-sm font-medium">
                      Confirm Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pl-10 pr-10 h-11"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Password must be at least 8 characters long
                  </p>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex gap-3">
                {currentStep > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    className="flex-1 h-11"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                )}
                
                {currentStep < 4 ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    className="flex-1 h-11 bg-blue-600 hover:bg-blue-700"
                  >
                    Next
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 h-11 bg-green-600 hover:bg-green-700"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      "Create Account"
                    )}
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Login Link */}
        <div className="text-center mt-8">
          <p className="text-gray-500 dark:text-gray-400">
            Already have an account?{" "}
            <button
              onClick={() => navigate("/login")}
              className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 font-medium transition-colors"
            >
              Sign in here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
