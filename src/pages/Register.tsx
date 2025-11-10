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
  Shield
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-md">
        {/* Language Switcher */}
        <div className="flex justify-end mb-4 sm:mb-6">
          <CompactLanguageSwitcher />
        </div>

        {/* Logo and Title */}
        <div className="text-center mb-4 sm:mb-8">
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className="p-2 sm:p-3 bg-green-600 rounded-lg sm:rounded-xl shadow-lg">
              <Fish className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              LocalFishing
            </h1>
          </div>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            {t('auth.createAccountToStart', 'Create your business account to get started')}
          </p>
        </div>

        {/* Multi-Step Registration Form */}
        <Card className="shadow-lg border-0 bg-white dark:bg-gray-800">
          <CardHeader className="text-center pb-4 sm:pb-6 pt-4 sm:pt-6">
            <CardTitle className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
              Create Account - Step {currentStep} of 4
            </CardTitle>
            <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">
              {currentStep === 1 && "Tell us about your business"}
              {currentStep === 2 && "Verify your email address"}
              {currentStep === 3 && "Owner information"}
              {currentStep === 4 && "Secure your account"}
            </p>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
            {/* Progress Indicator */}
            <div className="mb-4 sm:mb-6">
              <div className="flex items-center justify-between mb-2">
                {[1, 2, 3, 4].map((step) => (
                  <div
                    key={step}
                    className={`flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full text-xs sm:text-sm ${
                      step < currentStep
                        ? "bg-green-600 text-white"
                        : step === currentStep
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 dark:bg-gray-700 text-gray-500"
                    }`}
                  >
                    {step < currentStep ? (
                      <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                    ) : (
                      <span className="font-medium">{step}</span>
                    )}
                  </div>
                ))}
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 sm:h-2">
                <div
                  className="bg-blue-600 h-1.5 sm:h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(currentStep / 4) * 100}%` }}
                />
              </div>
            </div>

            <form onSubmit={handleRegister} className="space-y-4 sm:space-y-6">
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

              {/* Step 2: Email with Verification */}
              {currentStep === 2 && (
                <div className="space-y-3 sm:space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-xs sm:text-sm font-medium">
                      Email Address
                    </Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
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
                          className="pl-9 sm:pl-10 h-9 sm:h-11 text-sm"
                          autoFocus
                          required
                          disabled={isEmailVerified}
                        />
                        {isEmailVerified && (
                          <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                        )}
                      </div>
                      {!isEmailVerified && (
                        <Button
                          type="button"
                          onClick={handleSendOtp}
                          disabled={isSendingOtp || !email}
                          className="h-9 sm:h-11 px-3 sm:px-4 bg-blue-600 hover:bg-blue-700 text-xs sm:text-sm whitespace-nowrap"
                        >
                          {isSendingOtp ? (
                            <>
                              <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                            </>
                          ) : (
                            <>
                              <Shield className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
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
                    <div className="space-y-3 p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                        <Mail className="h-4 w-4" />
                        <p className="text-xs sm:text-sm font-medium">Check your email for the verification code</p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="otp" className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                          Enter 6-digit code
                        </Label>
                        <div className="flex justify-center">
                          <InputOTP
                            maxLength={6}
                            value={otp}
                            onChange={(value) => setOtp(value)}
                          >
                            <InputOTPGroup>
                              <InputOTPSlot index={0} className="h-10 w-10 sm:h-12 sm:w-12 text-base sm:text-lg" />
                              <InputOTPSlot index={1} className="h-10 w-10 sm:h-12 sm:w-12 text-base sm:text-lg" />
                              <InputOTPSlot index={2} className="h-10 w-10 sm:h-12 sm:w-12 text-base sm:text-lg" />
                              <InputOTPSlot index={3} className="h-10 w-10 sm:h-12 sm:w-12 text-base sm:text-lg" />
                              <InputOTPSlot index={4} className="h-10 w-10 sm:h-12 sm:w-12 text-base sm:text-lg" />
                              <InputOTPSlot index={5} className="h-10 w-10 sm:h-12 sm:w-12 text-base sm:text-lg" />
                            </InputOTPGroup>
                          </InputOTP>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          type="button"
                          onClick={handleVerifyOtp}
                          disabled={isVerifyingOtp || otp.length !== 6}
                          className="flex-1 h-9 sm:h-10 bg-green-600 hover:bg-green-700 text-xs sm:text-sm"
                        >
                          {isVerifyingOtp ? (
                            <>
                              <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-2 animate-spin" />
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
                          className="h-9 sm:h-10 text-xs sm:text-sm"
                        >
                          Resend
                        </Button>
                      </div>
                    </div>
                  )}

                  {isEmailVerified && (
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                        <CheckCircle className="h-4 w-4" />
                        <p className="text-xs sm:text-sm font-medium">Email verified successfully!</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Owner Name and Phone */}
              {currentStep === 3 && (
                <div className="space-y-4">
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

                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber" className="text-sm font-medium">
                      Phone Number <span className="text-gray-500 text-xs">(Optional)</span>
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 z-10" />
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
                <div className="p-2 sm:p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                    <p className="text-xs sm:text-sm text-red-600 dark:text-red-400">{error}</p>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex gap-2 sm:gap-3">
                {currentStep > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    className="flex-1 h-9 sm:h-11 text-xs sm:text-sm"
                  >
                    <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    Back
                  </Button>
                )}
                
                {currentStep < 4 ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    className="flex-1 h-9 sm:h-11 bg-blue-600 hover:bg-blue-700 text-xs sm:text-sm"
                  >
                    Next
                    <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 h-9 sm:h-11 bg-green-600 hover:bg-green-700 text-xs sm:text-sm"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 animate-spin" />
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
        <div className="text-center mt-4 sm:mt-8 mb-4">
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
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
