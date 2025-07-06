import React, { useState } from "react";
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
  Key
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Separator } from "@/components/ui/separator";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

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
      // Simulate API call (since this is UI only)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate success
      setSuccess(true);
    } catch (err) {
      setError("Failed to send reset email. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
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
                <h1 className="text-5xl font-bold mb-2">AquaManage</h1>
                <p className="text-purple-100 text-xl">Secure Account Recovery</p>
              </div>
            </div>

            {/* Description */}
            <div className="mb-12">
              <h2 className="text-3xl font-semibold mb-6">Account Security & Recovery</h2>
              <p className="text-purple-100 text-lg leading-relaxed mb-8">
                Your account security is our priority. We use industry-standard encryption 
                and secure recovery methods to protect your business data and ensure you 
                can always regain access to your fish management system.
              </p>
            </div>

            {/* Security Features */}
            <div className="grid grid-cols-2 gap-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Secure Recovery</h3>
                  <p className="text-purple-100 text-sm">Email-based password reset with time-limited secure tokens.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                  <Key className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Encrypted Data</h3>
                  <p className="text-purple-100 text-sm">All passwords are encrypted and never stored in plain text.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Quick Recovery</h3>
                  <p className="text-purple-100 text-sm">Fast and efficient password reset process to get you back to work.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                  <Mail className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Email Verification</h3>
                  <p className="text-purple-100 text-sm">Secure email verification ensures only you can reset your password.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Success Message (Smaller) */}
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
                Password reset instructions sent
              </p>
            </div>

            {/* Success Card */}
            <Card className="shadow-xl border border-gray-200/50 dark:border-gray-700/50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">
                  Check Your Email
                </CardTitle>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  Password reset instructions sent
                </p>
              </CardHeader>
              <CardContent className="px-6 pb-6 text-center">
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    We've sent password reset instructions to:
                  </p>
                  <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {email}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Please check your email and follow the instructions to reset your password. 
                    The link will expire in 15 minutes for security reasons.
                  </p>
                </div>

                <div className="mt-6 space-y-3">
                  <Button
                    onClick={() => navigate("/login")}
                    className="w-full h-9 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-sm"
                  >
                    <ArrowLeft className="h-3 w-3" />
                    <span className="text-sm">Back to Login</span>
                  </Button>
                  
                  <button
                    onClick={() => {
                      setSuccess(false);
                      setEmail("");
                    }}
                    className="w-full text-xs text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
                  >
                    Didn't receive the email? Try again
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

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
              <h1 className="text-5xl font-bold mb-2">AquaManage</h1>
              <p className="text-purple-100 text-xl">Secure Account Recovery</p>
            </div>
          </div>

          {/* Description */}
          <div className="mb-12">
            <h2 className="text-3xl font-semibold mb-6">Reset Your Password Securely</h2>
            <p className="text-purple-100 text-lg leading-relaxed mb-8">
              Forgot your password? No worries! Enter your email address and we'll send you 
              secure instructions to reset your password and regain access to your fish 
              business management system.
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
                <p className="text-purple-100 text-sm">Reset links expire quickly for enhanced security.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                <Key className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">New Password</h3>
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
                AquaManage
              </h1>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Reset your password
            </p>
          </div>

          {/* Forgot Password Form */}
          <Card className="shadow-xl border border-gray-200/50 dark:border-gray-700/50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">
                Forgot Password?
              </CardTitle>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Enter your email to reset your password
              </p>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <form onSubmit={handleSubmit} className="space-y-4">
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

                {/* Error Message */}
                {error && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <div className="flex items-center gap-2 justify-center">
                      <AlertCircle className="h-3 w-3 text-red-600 dark:text-red-400" />
                      <p className="text-xs text-red-600 dark:text-red-400 text-center">{error}</p>
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
                      <span className="text-sm">Send Reset Link</span>
                      <ArrowRight className="h-3 w-3" />
                    </>
                  )}
                </Button>
              </form>
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
