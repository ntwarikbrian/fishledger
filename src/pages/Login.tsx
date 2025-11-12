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
  const [success, setSuccess] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

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
          localStorage.setItem("workerRole", "admin");

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
          const workerData = (response.data as any).worker || response.data.user;
          
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
      {/* Left Side - Branding (Larger) */}
      <div className="hidden lg:flex lg:w-3/5 xl:w-2/3 bg-gradient-to-br from-blue-600 to-purple-700 p-12 flex-col justify-center relative overflow-hidden">
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
              <p className="text-blue-100 text-xl">
                {loginType === "admin" ? "Business Management" : "Team Access"}
              </p>
            </div>
          </div>

          {/* Description based on login type */}
          <div className="mb-12">
            <h2 className="text-3xl font-semibold mb-6">
              {loginType === "admin" ? "Manage Your Business" : "Access Your Workspace"}
            </h2>
            
            <p className="text-blue-100 text-lg leading-relaxed mb-8">
              {loginType === "admin" 
                ? "Track inventory, manage sales, and monitor your business performance with our comprehensive dashboard."
                : "Access your assigned tasks and contribute to your business operations efficiently."}
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-2 gap-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Real-time Analytics</h3>
                <p className="text-blue-100 text-sm">Monitor sales and inventory with live data visualization.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Performance Reports</h3>
                <p className="text-blue-100 text-sm">Generate detailed reports to make informed business decisions.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Team Management</h3>
                <p className="text-blue-100 text-sm">Efficiently manage your team with role-based access control.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                <Package className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Inventory Tracking</h3>
                <p className="text-blue-100 text-sm">Keep track of stock levels with automated alerts.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form (Smaller) */}
      <div className="w-full lg:w-2/5 xl:w-1/3 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo (visible only on small screens) */}
          <div className="lg:hidden text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg">
                <Fish className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                FishLedger
              </h1>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              {loginType === "admin" ? "Business Management" : "Team Access"}
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
                <TabsList className="grid w-full grid-cols-2 mb-6 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                  <TabsTrigger value="admin" className="h-8 text-sm font-medium rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-gray-600 data-[state=active]:shadow-sm data-[state=active]:text-gray-900 dark:data-[state=active]:text-white transition-all">
                    Admin
                  </TabsTrigger>
                  <TabsTrigger value="worker" className="h-8 text-sm font-medium rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-gray-600 data-[state=active]:shadow-sm data-[state=active]:text-gray-900 dark:data-[state=active]:text-white transition-all">
                    Worker
                  </TabsTrigger>
                </TabsList>

                {/* Admin Login Form */}
                <TabsContent value="admin" className="space-y-4 mt-0">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-1">
                      <Label htmlFor="adminEmail" className="text-xs font-medium text-gray-600 dark:text-gray-400">
                        Email Address
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="adminEmail"
                          type="email"
                          placeholder="admin@business.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-10 h-10 text-sm border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg bg-gray-50/50 dark:bg-gray-800/50"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="adminPassword" className="text-xs font-medium text-gray-600 dark:text-gray-400">
                        Password
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="adminPassword"
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

                    {/* Login Button */}
                    <Button
                      type="submit"
                      className="w-full h-10 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-sm"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm">Signing in...</span>
                        </>
                      ) : (
                        <>
                          <span className="text-sm">Sign In</span>
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </form>
                </TabsContent>

                {/* Worker Login Form */}
                <TabsContent value="worker" className="space-y-4 mt-0">
                  <form onSubmit={handleLogin} className="space-y-4">
                    {/* Business Name Field */}
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

                    {/* Email Field */}
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

                    {/* Password Field */}
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

                    {/* Login Button */}
                    <Button
                      type="submit"
                      className="w-full h-10 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-sm"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm">Signing in...</span>
                        </>
                      ) : (
                        <>
                          <span className="text-sm">Sign In</span>
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>

              {/* Forgot Password */}
              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => navigate("/forgot-password")}
                  className="text-xs text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
                >
                  Forgot your password?
                </button>
              </div>
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