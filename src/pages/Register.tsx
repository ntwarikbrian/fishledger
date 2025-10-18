import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Fish,
  AlertCircle
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { CompactLanguageSwitcher } from "@/components/ui/language-switcher";
import { usePageTitle } from "@/hooks/use-page-title";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";


const Register = () => {
  const { t } = useTranslation();
  usePageTitle('auth.registerTitle', 'Register');

  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGoogleSignUp = async () => {
    setIsLoading(true);
    setError("");
    
    try {
      // This will be handled by the GoogleSignInButton component
      // The actual Google OAuth flow will be managed there
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

        {/* Registration Form */}
        <Card className="shadow-lg border-0 bg-white dark:bg-gray-800">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">
              Create Account
            </CardTitle>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Sign up with your Google account
            </p>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                  Business owners, create your account with Google
                </p>
              </div>
              
              <GoogleSignInButton 
                onSuccess={() => {
                  // Navigation handled by GoogleSignInButton
                }}
                onError={(error) => {
                  setError(error);
                }}
                className="h-10 text-sm font-medium"
              />
              
              <div className="text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Secure authentication via Google OAuth
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-3 w-3 text-red-600 dark:text-red-400" />
                    <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
                  </div>
                </div>
              )}
            </div>
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
