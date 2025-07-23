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
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  BarChart3,
  Users,
  Package,
  Shield,
  Zap
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import { authAPI } from "@/services/api";
import { CompactLanguageSwitcher } from "@/components/ui/language-switcher";
import { usePageTitle } from "@/hooks/use-page-title";

const Login = () => {
  const { t } = useTranslation();
  usePageTitle('auth.loginTitle', 'Login');

  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loginType, setLoginType] = useState<"admin" | "worker">("admin");
  
  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [workerId, setWorkerId] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      if (loginType === "admin") {
        // Admin login using real API
        const response = await authAPI.login({
          email: email,
          password: password,
        });

        if (response.success && response.data) {
          // Store user type and navigate to dashboard
          localStorage.setItem("userType", "admin");
          localStorage.setItem("userEmail", response.data.user.email);
          localStorage.setItem("businessName", response.data.user.businessName);
          localStorage.setItem("ownerName", response.data.user.ownerName);

          navigate("/");
        } else {
          setError(response.message || "Login failed");
        }
      } else {
        // Worker login using real API
        const response = await authAPI.workerLogin({
          email: workerId, // Using workerId as email for workers
          password: password,
          business_name: businessName, // Include business name for worker login
        });

        if (response.success && response.data) {
          // Worker login response has different structure: response.data.worker instead of response.data.user
          const workerData = response.data.worker || response.data.user;
          
          if (workerData && workerData.email) {
            localStorage.setItem("userType", "worker");
            localStorage.setItem("workerId", workerId);
            localStorage.setItem("userEmail", workerData.email);
            localStorage.setItem("workerFullName", workerData.fullName || workerData.full_name || "");
            localStorage.setItem("businessName", businessName);
            localStorage.setItem("workerRole", workerData.role || "employee");
            localStorage.setItem("businessId", workerData.businessId || "");

            navigate("/");
          } else {
            console.error("Worker data structure issue:", response.data);
            setError("Login successful but worker data is incomplete. Please try again.");
          }
        } else {
          setError(response.message || "Worker login failed");
        }
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Login failed. Please check your connection and try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950 flex">
      {/* Left Side - System Description (Larger) */}
      <div className="hidden lg:flex lg:w-3/5 xl:w-2/3 bg-gradient-to-br from-blue-600 to-blue-800 p-12 flex-col justify-center relative overflow-hidden">
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
              <p className="text-blue-100 text-xl">{t('auth.systemDescription', 'Fish Business Management System')}</p>
            </div>
          </div>

          {/* Description */}
          <div className="mb-12">
            <h2 className="text-3xl font-semibold mb-6">Streamline Your Fish Business Operations</h2>
            <p className="text-blue-100 text-lg leading-relaxed mb-8">
              Take control of your fish selling business with our comprehensive management system.
              From inventory tracking to sales analytics, we provide everything you need to grow
              your business efficiently and profitably.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-2 gap-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                <Package className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Inventory Management</h3>
                <p className="text-blue-100 text-sm">Track your fish stock, manage both boxed and weight-based sales with real-time updates.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Sales Analytics</h3>
                <p className="text-blue-100 text-sm">Comprehensive reports and analytics to understand your business performance.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Team Management</h3>
                <p className="text-blue-100 text-sm">Manage your workers, assign tasks, and track performance with role-based access.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Profit Tracking</h3>
                <p className="text-blue-100 text-sm">Monitor expenses, calculate profits, and optimize your business operations.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form (Smaller) */}
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
              {t('auth.welcomeBack', 'Welcome back to your fish business')}
            </p>
          </div>

        {/* Login Form */}
        <Card className="shadow-xl border border-gray-200/50 dark:border-gray-700/50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">
              {t('common.welcome', 'Welcome Back')}
            </CardTitle>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              {t('auth.signInToAccount', 'Sign in to your account')}
            </p>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <Tabs value={loginType} onValueChange={(value) => setLoginType(value as "admin" | "worker")} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6 h-10 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-1">
                <TabsTrigger value="admin" className="h-8 text-xs font-medium rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-sm data-[state=active]:text-gray-900 dark:data-[state=active]:text-white transition-all">
                  Admin
                </TabsTrigger>
                <TabsTrigger value="worker" className="h-8 text-xs font-medium rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-sm data-[state=active]:text-gray-900 dark:data-[state=active]:text-white transition-all">
                  Worker
                </TabsTrigger>
              </TabsList>

              <form onSubmit={handleLogin} className="space-y-4">
                <TabsContent value="admin" className="space-y-4 mt-0">
                  {/* Admin Login Fields */}
                  <div className="space-y-1">
                    <Label htmlFor="email" className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      Email Address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="admin@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 h-10 text-sm border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg bg-gray-50/50 dark:bg-gray-800/50"
                        required
                      />
                    </div>
                  </div>

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
                </TabsContent>

                <TabsContent value="worker" className="space-y-4 mt-0">
                  {/* Worker Login Fields */}
                  <div className="space-y-1">
                    <Label htmlFor="businessName" className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      Business Name
                    </Label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="businessName"
                        type="text"
                        placeholder="Your Business Name"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        className="pl-10 h-10 text-sm border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg bg-gray-50/50 dark:bg-gray-800/50"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="workerEmail" className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      Email Address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="workerEmail"
                        type="email"
                        placeholder="worker@company.com"
                        value={workerId}
                        onChange={(e) => setWorkerId(e.target.value)}
                        className="pl-10 h-10 text-sm border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg bg-gray-50/50 dark:bg-gray-800/50"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="workerPassword" className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="workerPassword"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
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
                </TabsContent>

                {/* Error Message */}
                {error && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <div className="flex items-center gap-2 justify-center">
                      <AlertCircle className="h-3 w-3 text-red-600 dark:text-red-400" />
                      <p className="text-xs text-red-600 dark:text-red-400 text-center">{error}</p>
                    </div>
                  </div>
                )}

                {/* Login Button */}
                <Button
                  type="submit"
                  className="w-full h-9 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-sm"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span className="text-sm">Signing in...</span>
                    </>
                  ) : (
                    <>
                      <span className="text-sm">Sign In</span>
                      <ArrowRight className="h-3 w-3" />
                    </>
                  )}
                </Button>

                {/* Forgot Password */}
                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => navigate("/forgot-password")}
                    className="text-xs text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
                  >
                    Forgot your password?
                  </button>
                </div>
              </form>
            </Tabs>
          </CardContent>
        </Card>

          {/* Registration Link */}
          <div className="text-center mt-6">
            <Separator className="my-4" />
            <p className="text-gray-500 dark:text-gray-400 text-xs">
              Don't have an account?{" "}
              <button
                onClick={() => navigate("/register")}
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium underline underline-offset-2 transition-colors"
              >
                Create one here
              </button>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Login;
