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
  CheckCircle,
  Phone,
  Shield,
  Users
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { CompactLanguageSwitcher } from "@/components/ui/language-switcher";
import { usePageTitle } from "@/hooks/use-page-title";
import { authAPI } from "@/services/api";
import { toast } from "sonner";
import PhoneInput from 'react-phone-number-input';
import { isPossiblePhoneNumber } from 'libphonenumber-js';
import 'react-phone-number-input/style.css';
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import PostRegistrationSetup from "@/components/auth/PostRegistrationSetup";

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
  const [showPostRegistrationSetup, setShowPostRegistrationSetup] = useState(false);

  // Form data
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // OTP verification states
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otp, setOtp] = useState("");
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

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
        if (!isEmailVerified) {
          setError("Please verify your email address");
          return false;
        }
        return true;
      
      case 3:
        if (!ownerName.trim() || ownerName.length < 2) {
          setError("Owner name must be at least 2 characters");
          return false;
        }
        if (phoneNumber && !isPossiblePhoneNumber(phoneNumber)) {
          setError("Please enter a valid phone number");
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

  const handleSendOtp = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email)) {
      setError("Please enter a valid email address first");
      return;
    }

    setIsSendingOtp(true);
    setError("");

    try {
      const response = await authAPI.sendOtp({ email, businessName });
      if (response.success) {
        setShowOtpInput(true);
        toast.success("Verification code sent to your email!");
      } else {
        setError(response.message || "Failed to send verification code");
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to send verification code. Please try again.");
      }
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      setError("Please enter the 6-digit code");
      return;
    }

    setIsVerifyingOtp(true);
    setError("");

    try {
      const response = await authAPI.verifyOtp({ email, otp });
      if (response.success) {
        setIsEmailVerified(true);
        setShowOtpInput(false);
        toast.success("Email verified successfully!");
      } else {
        setError(response.message || "Invalid verification code");
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to verify code. Please try again.");
      }
    } finally {
      setIsVerifyingOtp(false);
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
        phone_number: phoneNumber || undefined,
        password: password,
        confirm_password: confirmPassword,
      });

      if (response.success) {
        // Instead of navigating to login, show the post-registration setup
        setShowPostRegistrationSetup(true);
        toast.success("Account created successfully!");
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

  const handleSetupComplete = () => {
    setShowPostRegistrationSetup(false);
    // User will be navigated to dashboard from the PostRegistrationSetup component
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950 flex">
      {/* Left Side - Branding (Larger) */}
      <div className="hidden lg:flex lg:w-3/5 xl:w-2/3 bg-gradient-to-br from-green-600 to-teal-700 p-12 flex-col justify-center relative overflow-hidden">
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
              <h1 className="text-5xl font-bold mb-2">FishLedger</h1>
              <p className="text-green-100 text-xl">
                {currentStep === 1 && "Business Registration"}
                {currentStep === 2 && "Email Verification"}
                {currentStep === 3 && "Owner Information"}
                {currentStep === 4 && "Account Security"}
                {showPostRegistrationSetup && "Account Setup"}
              </p>
            </div>
          </div>

          {/* Description based on current step */}
          <div className="mb-12">
            <h2 className="text-3xl font-semibold mb-6">
              {currentStep === 1 && "Tell Us About Your Business"}
              {currentStep === 2 && "Verify Your Email Address"}
              {currentStep === 3 && "Owner Information"}
              {currentStep === 4 && "Secure Your Account"}
              {showPostRegistrationSetup && "Customize Your Experience"}
            </h2>
            
            <p className="text-green-100 text-lg leading-relaxed mb-8">
              {currentStep === 1 && "Start by telling us the name of your fish business to get set up."}
              {currentStep === 2 && "We'll send a verification code to your email to confirm your identity."}
              {currentStep === 3 && "Provide your personal information and contact details."}
              {currentStep === 4 && "Create a strong password to protect your business account."}
              {showPostRegistrationSetup && "Set your preferences to get the most out of FishLedger."}
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-2 gap-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Secure Platform</h3>
                <p className="text-green-100 text-sm">Enterprise-grade security to protect your business data.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                <Building className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Business Management</h3>
                <p className="text-green-100 text-sm">Comprehensive tools to manage your fish business operations.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Real-time Analytics</h3>
                <p className="text-green-100 text-sm">Track sales and inventory with live data visualization.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Team Management</h3>
                <p className="text-green-100 text-sm">Efficiently manage your team with role-based access control.</p>
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
              <div className="p-3 bg-green-600 rounded-xl shadow-lg">
                <Fish className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                FishLedger
              </h1>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              {currentStep === 1 && "Business Registration"}
              {currentStep === 2 && "Email Verification"}
              {currentStep === 3 && "Owner Information"}
              {currentStep === 4 && "Account Security"}
              {showPostRegistrationSetup && "Account Setup"}
            </p>
          </div>

          {/* Multi-Step Registration Form */}
          <Card className="shadow-xl border border-gray-200/50 dark:border-gray-700/50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
            <CardHeader className="text-center pb-4">
              <div className="flex justify-between items-center mb-2">
                <div className="flex gap-1">
                  <div className={`w-2 h-2 rounded-full ${currentStep >= 1 ? "bg-green-600" : "bg-gray-300"}`}></div>
                  <div className={`w-2 h-2 rounded-full ${currentStep >= 2 ? "bg-green-600" : "bg-gray-300"}`}></div>
                  <div className={`w-2 h-2 rounded-full ${currentStep >= 3 ? "bg-green-600" : "bg-gray-300"}`}></div>
                  <div className={`w-2 h-2 rounded-full ${currentStep >= 4 ? "bg-green-600" : "bg-gray-300"}`}></div>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Step {currentStep} of 4
                </span>
              </div>
              
              <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">
                Create Account
              </CardTitle>
              
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                {currentStep === 1 && "Tell us about your business"}
                {currentStep === 2 && "Verify your email address"}
                {currentStep === 3 && "Owner information"}
                {currentStep === 4 && "Secure your account"}
              </p>
            </CardHeader>
            
            <CardContent className="px-6 pb-6">
              <form onSubmit={handleRegister} className="space-y-4">
                {/* Step 1: Business Name */}
                {currentStep === 1 && (
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <Label htmlFor="businessName" className="text-xs font-medium text-gray-600 dark:text-gray-400">
                        Business Name
                      </Label>
                      <div className="relative">
                        <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="businessName"
                          type="text"
                          placeholder="Enter your business name"
                          value={businessName}
                          onChange={(e) => setBusinessName(e.target.value)}
                          className="pl-10 h-10 text-sm border-gray-200 dark:border-gray-700 focus:border-green-500 focus:ring-1 focus:ring-green-500 rounded-lg bg-gray-50/50 dark:bg-gray-800/50"
                          autoFocus
                          required
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Email with Verification */}
                {currentStep === 2 && (
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <Label htmlFor="email" className="text-xs font-medium text-gray-600 dark:text-gray-400">
                        Email Address
                      </Label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            id="email"
                            type="email"
                            placeholder="your@email.com"
                            value={email}
                            onChange={(e) => {
                              setEmail(e.target.value);
                              setIsEmailVerified(false);
                              setShowOtpInput(false);
                              setOtp("");
                            }}
                            className="pl-10 h-10 text-sm border-gray-200 dark:border-gray-700 focus:border-green-500 focus:ring-1 focus:ring-green-500 rounded-lg bg-gray-50/50 dark:bg-gray-800/50"
                            autoFocus
                            required
                            disabled={isEmailVerified}
                          />
                          {isEmailVerified && (
                            <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-600" />
                          )}
                        </div>
                        {!isEmailVerified && (
                          <Button
                            type="button"
                            onClick={handleSendOtp}
                            disabled={isSendingOtp || !email}
                            className="h-10 px-3 bg-green-600 hover:bg-green-700 text-xs whitespace-nowrap rounded-lg"
                          >
                            {isSendingOtp ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                              </>
                            ) : (
                              <>
                                <Shield className="h-4 w-4 mr-1" />
                                <span className="hidden sm:inline">Verify</span>
                                <span className="sm:hidden">Send</span>
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* OTP Input */}
                    {showOtpInput && !isEmailVerified && (
                      <div className="space-y-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                        <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                          <Mail className="h-4 w-4" />
                          <p className="text-xs font-medium">Check your email for the verification code</p>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="otp" className="text-xs font-medium text-gray-700 dark:text-gray-300">
                            Enter 6-digit code
                          </Label>
                          <div className="flex justify-center">
                            <InputOTP
                              maxLength={6}
                              value={otp}
                              onChange={(value) => setOtp(value)}
                            >
                              <InputOTPGroup>
                                <InputOTPSlot index={0} className="h-12 w-10 text-lg" />
                                <InputOTPSlot index={1} className="h-12 w-10 text-lg" />
                                <InputOTPSlot index={2} className="h-12 w-10 text-lg" />
                                <InputOTPSlot index={3} className="h-12 w-10 text-lg" />
                                <InputOTPSlot index={4} className="h-12 w-10 text-lg" />
                                <InputOTPSlot index={5} className="h-12 w-10 text-lg" />
                              </InputOTPGroup>
                            </InputOTP>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            type="button"
                            onClick={handleVerifyOtp}
                            disabled={isVerifyingOtp || otp.length !== 6}
                            className="flex-1 h-10 bg-green-600 hover:bg-green-700 text-xs rounded-lg"
                          >
                            {isVerifyingOtp ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Verifying...
                              </>
                            ) : (
                              "Verify Code"
                            )}
                          </Button>
                          <Button
                            type="button"
                            onClick={handleSendOtp}
                            disabled={isSendingOtp}
                            variant="outline"
                            className="h-10 text-xs rounded-lg"
                          >
                            Resend
                          </Button>
                        </div>
                      </div>
                    )}

                    {isEmailVerified && (
                      <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                        <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                          <CheckCircle className="h-4 w-4" />
                          <p className="text-xs font-medium">Email verified successfully!</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 3: Owner Name and Phone */}
                {currentStep === 3 && (
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <Label htmlFor="ownerName" className="text-xs font-medium text-gray-600 dark:text-gray-400">
                        Owner's Full Name
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="ownerName"
                          type="text"
                          placeholder="John Doe"
                          value={ownerName}
                          onChange={(e) => setOwnerName(e.target.value)}
                          className="pl-10 h-10 text-sm border-gray-200 dark:border-gray-700 focus:border-green-500 focus:ring-1 focus:ring-green-500 rounded-lg bg-gray-50/50 dark:bg-gray-800/50"
                          autoFocus
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="phoneNumber" className="text-xs font-medium text-gray-600 dark:text-gray-400">
                        Phone Number <span className="text-gray-500 text-xs">(Optional)</span>
                      </Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
                        <PhoneInput
                          id="phoneNumber"
                          international
                          defaultCountry="RW"
                          value={phoneNumber}
                          onChange={(value) => setPhoneNumber(value || "")}
                          className="phone-input-wrapper"
                          placeholder="+250 788 123 456"
                        />
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Include country code (e.g., +250 for Rwanda)
                      </p>
                    </div>
                  </div>
                )}

                {/* Step 4: Password */}
                {currentStep === 4 && (
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <Label htmlFor="password" className="text-xs font-medium text-gray-600 dark:text-gray-400">
                        Password
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-10 pr-10 h-10 text-sm border-gray-200 dark:border-gray-700 focus:border-green-500 focus:ring-1 focus:ring-green-500 rounded-lg bg-gray-50/50 dark:bg-gray-800/50"
                          autoFocus
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="confirmPassword" className="text-xs font-medium text-gray-600 dark:text-gray-400">
                        Confirm Password
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="pl-10 pr-10 h-10 text-sm border-gray-200 dark:border-gray-700 focus:border-green-500 focus:ring-1 focus:ring-green-500 rounded-lg bg-gray-50/50 dark:bg-gray-800/50"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                      <h3 className="text-xs font-medium text-blue-800 dark:text-blue-200 mb-1">Password Requirements</h3>
                      <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                        <li className="flex items-center gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                          At least 8 characters long
                        </li>
                        <li className="flex items-center gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                          Include uppercase and lowercase letters
                        </li>
                        <li className="flex items-center gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                          Include at least one number
                        </li>
                      </ul>
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <div className="flex items-center gap-2 justify-center">
                      <AlertCircle className="h-3 w-3 text-red-600 dark:text-red-400" />
                      <p className="text-xs text-red-600 dark:text-red-400 text-center">{error}</p>
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
                      className="flex-1 h-10 text-sm border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back
                    </Button>
                  )}
                  
                  {currentStep < 4 ? (
                    <Button
                      type="button"
                      onClick={handleNext}
                      className="flex-1 h-10 bg-green-600 hover:bg-green-700 text-sm rounded-lg"
                    >
                      Next
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 h-10 bg-green-600 hover:bg-green-700 text-sm rounded-lg"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          <span className="hidden sm:inline">Creating Account...</span>
                          <span className="sm:hidden">Creating...</span>
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
          <div className="text-center mt-6">
            <p className="text-gray-500 dark:text-gray-400 text-xs">
              Already have an account?{" "}
              <button
                onClick={() => navigate("/login")}
                className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 font-medium underline underline-offset-2 transition-colors"
              >
                Sign in here
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* Post Registration Setup Popup */}
      {showPostRegistrationSetup && (
        <PostRegistrationSetup 
          isOpen={showPostRegistrationSetup}
          onComplete={handleSetupComplete}
          businessName={businessName}
        />
      )}
    </div>
  );
};

export default Register;