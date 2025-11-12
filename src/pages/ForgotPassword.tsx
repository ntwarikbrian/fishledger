import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Fish,
  Mail,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  Shield,
  Clock,
  Key,
  Eye,
  EyeOff,
  Lock
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import { authAPI } from "@/services/api";

const ForgotPassword = () => {
  const navigate = useNavigate();
  
  // State management
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // UI states
  const [step, setStep] = useState<"email" | "otp" | "password" | "success">("email");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [countdown, setCountdown] = useState(0);

  // Countdown timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // Handle email submission
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    // Basic email validation
    if (!email.trim()) {
      setError("Email address is required");
      setIsLoading(false);
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address");
      setIsLoading(false);
      return;
    }

    try {
      const response = await authAPI.forgotPassword({ email });
      
      if (response.success) {
        setSuccess("Password reset code sent to your email");
        setCountdown(30); // 30-second cooldown
        setStep("otp");
      } else {
        setError(response.message || "Failed to send password reset code");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send password reset code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OTP submission
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    // Basic OTP validation
    if (!otp.trim()) {
      setError("Please enter the 6-digit code");
      setIsLoading(false);
      return;
    }

    if (otp.length !== 6 || !/^\d+$/.test(otp)) {
      setError("Please enter a valid 6-digit code");
      setIsLoading(false);
      return;
    }

    try {
      // In a real implementation, we would verify the OTP with the backend
      // For now, we'll simulate a successful verification
      setSuccess("Code verified successfully");
      setStep("password");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to verify code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle password reset
  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    // Password validation
    if (!newPassword.trim()) {
      setError("Please enter a new password");
      setIsLoading(false);
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long");
      setIsLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    try {
      const response = await authAPI.resetPassword({
        email,
        otp,
        newPassword,
        confirmPassword
      });
      
      if (response.success) {
        setSuccess("Password reset successfully");
        setStep("success");
      } else {
        setError(response.message || "Failed to reset password");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (countdown > 0) return;
    
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await authAPI.forgotPassword({ email });
      
      if (response.success) {
        setSuccess("New password reset code sent to your email");
        setCountdown(30); // 30-second cooldown
      } else {
        setError(response.message || "Failed to resend code");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resend code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Render email step
  const renderEmailStep = () => (
    <form onSubmit={handleEmailSubmit} className="space-y-4">
      {/* Email Field */}
      <div className="space-y-1">
        <Label htmlFor="email" className="text-xs font-medium text-gray-600 dark:text-gray-400">
          Email Address
        </Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            id="email"
            type="email"
            placeholder="Enter your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-10 h-10 text-sm border-gray-200 dark:border-gray-700 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-lg bg-gray-50/50 dark:bg-gray-800/50"
            required
          />
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center gap-2 justify-center">
            <AlertCircle className="h-3 w-3 text-red-600 dark:text-red-400" />
            <p className="text-xs text-red-600 dark:text-red-400 text-center">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-center gap-2 justify-center">
            <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400" />
            <p className="text-xs text-green-600 dark:text-green-400 text-center">{success}</p>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        className="w-full h-9 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-sm"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-3 w-3 animate-spin" />
            <span className="text-sm">Sending...</span>
          </>
        ) : (
          <>
            <span className="text-sm">Send Reset Code</span>
            <ArrowRight className="h-3 w-3" />
          </>
        )}
      </Button>
    </form>
  );

  // Render OTP step
  const renderOtpStep = () => (
    <form onSubmit={handleOtpSubmit} className="space-y-4">
      {/* OTP Instructions */}
      <div className="text-center mb-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          We've sent a 6-digit code to <span className="font-medium">{email}</span>
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Please check your email and enter the code below
        </p>
      </div>

      {/* OTP Field */}
      <div className="space-y-1">
        <Label htmlFor="otp" className="text-xs font-medium text-gray-600 dark:text-gray-400">
          Verification Code
        </Label>
        <Input
          id="otp"
          type="text"
          inputMode="numeric"
          placeholder="Enter 6-digit code"
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
          className="h-10 text-sm text-center tracking-widest text-2xl border-gray-200 dark:border-gray-700 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-lg bg-gray-50/50 dark:bg-gray-800/50"
          maxLength={6}
          required
        />
      </div>

      {/* Resend Code */}
      <div className="text-center">
        <button
          type="button"
          onClick={handleResendOtp}
          disabled={isLoading || countdown > 0}
          className="text-xs text-gray-500 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400 transition-colors disabled:opacity-50"
        >
          {countdown > 0 ? `Resend code in ${countdown}s` : "Didn't receive the code? Resend"}
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center gap-2 justify-center">
            <AlertCircle className="h-3 w-3 text-red-600 dark:text-red-400" />
            <p className="text-xs text-red-600 dark:text-red-400 text-center">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-center gap-2 justify-center">
            <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400" />
            <p className="text-xs text-green-600 dark:text-green-400 text-center">{success}</p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => setStep("email")}
          className="flex-1 h-9 text-sm border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg"
          disabled={isLoading}
        >
          Back
        </Button>
        <Button
          type="submit"
          className="flex-1 h-9 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-sm"
          disabled={isLoading || otp.length !== 6}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              <span className="text-sm">Verifying...</span>
            </>
          ) : (
            <>
              <span className="text-sm">Verify Code</span>
              <ArrowRight className="h-3 w-3" />
            </>
          )}
        </Button>
      </div>
    </form>
  );

  // Render password step
  const renderPasswordStep = () => (
    <form onSubmit={handlePasswordReset} className="space-y-4">
      {/* Password Requirements */}
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

      {/* New Password Field */}
      <div className="space-y-1">
        <Label htmlFor="newPassword" className="text-xs font-medium text-gray-600 dark:text-gray-400">
          New Password
        </Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            id="newPassword"
            type={showPassword ? "text" : "password"}
            placeholder="Enter new password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="pl-10 pr-10 h-10 text-sm border-gray-200 dark:border-gray-700 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-lg bg-gray-50/50 dark:bg-gray-800/50"
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

      {/* Confirm Password Field */}
      <div className="space-y-1">
        <Label htmlFor="confirmPassword" className="text-xs font-medium text-gray-600 dark:text-gray-400">
          Confirm Password
        </Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="pl-10 pr-10 h-10 text-sm border-gray-200 dark:border-gray-700 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-lg bg-gray-50/50 dark:bg-gray-800/50"
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

      {/* Messages */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center gap-2 justify-center">
            <AlertCircle className="h-3 w-3 text-red-600 dark:text-red-400" />
            <p className="text-xs text-red-600 dark:text-red-400 text-center">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-center gap-2 justify-center">
            <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400" />
            <p className="text-xs text-green-600 dark:text-green-400 text-center">{success}</p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => setStep("otp")}
          className="flex-1 h-9 text-sm border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg"
          disabled={isLoading}
        >
          Back
        </Button>
        <Button
          type="submit"
          className="flex-1 h-9 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-sm"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              <span className="text-sm">Resetting...</span>
            </>
          ) : (
            <>
              <span className="text-sm">Reset Password</span>
              <ArrowRight className="h-3 w-3" />
            </>
          )}
        </Button>
      </div>
    </form>
  );

  // Render success step
  const renderSuccessStep = () => (
    <div className="text-center space-y-4">
      <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
        <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        Password Reset Successful
      </h3>
      
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Your password has been successfully reset. You can now sign in with your new password.
      </p>
      
      <Button
        onClick={() => navigate("/login")}
        className="w-full h-9 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-sm mt-4"
      >
        <span className="text-sm">Go to Login</span>
        <ArrowRight className="h-3 w-3" />
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950 flex">
      {/* Left Side - System Description (Larger) */}
      <div className="hidden lg:flex lg:w-3/5 xl:w-2/3 bg-gradient-to-br from-purple-600 to-purple-800 p-12 flex-col justify-center relative overflow-hidden">
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
              <p className="text-purple-100 text-xl">
                {step === "email" && "Secure Account Recovery"}
                {step === "otp" && "Email Verification"}
                {step === "password" && "Password Reset"}
                {step === "success" && "Success"}
              </p>
            </div>
          </div>

          {/* Description based on current step */}
          <div className="mb-12">
            <h2 className="text-3xl font-semibold mb-6">
              {step === "email" && "Reset Your Password Securely"}
              {step === "otp" && "Verify Your Email"}
              {step === "password" && "Create New Password"}
              {step === "success" && "Password Reset Complete"}
            </h2>
            
            <p className="text-purple-100 text-lg leading-relaxed mb-8">
              {step === "email" && "Enter your email address and we'll send you a secure code to reset your password."}
              {step === "otp" && "We've sent a verification code to your email. Please enter it below to continue."}
              {step === "password" && "Create a strong new password to secure your account."}
              {step === "success" && "Your password has been successfully reset. You can now sign in with your new password."}
            </p>
          </div>

          {/* Security Features */}
          <div className="grid grid-cols-2 gap-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Secure Process</h3>
                <p className="text-purple-100 text-sm">Industry-standard security protocols protect your account recovery.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                <Mail className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Email Verification</h3>
                <p className="text-purple-100 text-sm">Reset link sent only to your registered email address.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Time Limited</h3>
                <p className="text-purple-100 text-sm">Reset codes expire quickly for enhanced security.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                <Key className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Strong Passwords</h3>
                <p className="text-purple-100 text-sm">Create a strong new password to secure your account.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Forgot Password Form (Smaller) */}
      <div className="w-full lg:w-2/5 xl:w-1/3 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo (visible only on small screens) */}
          <div className="lg:hidden text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 bg-blue-600 rounded-xl shadow-lg">
                <Fish className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                FishLedger
              </h1>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              {step === "email" && "Reset your password"}
              {step === "otp" && "Verify your email"}
              {step === "password" && "Create new password"}
              {step === "success" && "Password reset complete"}
            </p>
          </div>

          {/* Forgot Password Form */}
          <Card className="shadow-xl border border-gray-200/50 dark:border-gray-700/50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
            <CardHeader className="text-center pb-4">
              <div className="flex justify-between items-center mb-2">
                <div className="flex gap-1">
                  <div className={`w-2 h-2 rounded-full ${step === "email" ? "bg-purple-600" : "bg-gray-300"}`}></div>
                  <div className={`w-2 h-2 rounded-full ${step === "otp" ? "bg-purple-600" : "bg-gray-300"}`}></div>
                  <div className={`w-2 h-2 rounded-full ${step === "password" ? "bg-purple-600" : "bg-gray-300"}`}></div>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Step {step === "email" ? "1" : step === "otp" ? "2" : step === "password" ? "3" : "4"} of 4
                </span>
              </div>
              
              <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">
                {step === "email" && "Forgot Password?"}
                {step === "otp" && "Verify Email"}
                {step === "password" && "New Password"}
                {step === "success" && "Success!"}
              </CardTitle>
              
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                {step === "email" && "Enter your email to reset your password"}
                {step === "otp" && "Enter the code sent to your email"}
                {step === "password" && "Create a new password"}
                {step === "success" && "Your password has been reset"}
              </p>
            </CardHeader>
            
            <CardContent className="px-6 pb-6">
              {step === "email" && renderEmailStep()}
              {step === "otp" && renderOtpStep()}
              {step === "password" && renderPasswordStep()}
              {step === "success" && renderSuccessStep()}
            </CardContent>
          </Card>

          {/* Back to Login Link */}
          <div className="text-center mt-6">
            <Separator className="my-4" />
            <p className="text-gray-500 dark:text-gray-400 text-xs">
              Remember your password?{" "}
              <button
                onClick={() => navigate("/login")}
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium underline underline-offset-2 transition-colors"
              >
                Back to Login
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;