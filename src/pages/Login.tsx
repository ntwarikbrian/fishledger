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
  ArrowRight,
  Loader2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { Separator } from "@/components/ui/separator";

const Login = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loginType, setLoginType] = useState<"admin" | "worker">("admin");
  
  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [workerId, setWorkerId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock authentication logic
      if (loginType === "admin") {
        if (email === "admin@aquamanage.com" && password === "admin123") {
          localStorage.setItem("userType", "admin");
          localStorage.setItem("userEmail", email);
          navigate("/");
        } else {
          setError("Invalid admin credentials");
        }
      } else {
        if (workerId && password) {
          // Mock worker authentication
          localStorage.setItem("userType", "worker");
          localStorage.setItem("workerId", workerId);
          navigate("/");
        } else {
          setError("Invalid worker credentials");
        }
      }
    } catch (err) {
      setError("Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-blue-600 rounded-xl shadow-lg">
              <Fish className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              AquaManage
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Welcome back to your fish business
          </p>
        </div>

        {/* Login Form */}
        <Card className="shadow-2xl border-0 bg-white dark:bg-gray-900">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
              Sign In
            </CardTitle>
            <p className="text-gray-600 dark:text-gray-400">
              Choose your account type to continue
            </p>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <Tabs value={loginType} onValueChange={(value) => setLoginType(value as "admin" | "worker")} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8 h-12 bg-gray-100 dark:bg-gray-800">
                <TabsTrigger value="admin" className="h-10 text-sm font-medium">
                  Admin
                </TabsTrigger>
                <TabsTrigger value="worker" className="h-10 text-sm font-medium">
                  Worker
                </TabsTrigger>
              </TabsList>

              <form onSubmit={handleLogin} className="space-y-6">
                <TabsContent value="admin" className="space-y-5 mt-0">
                  {/* Admin Login Fields */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Email Address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-11 h-12 border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-11 pr-11 h-12 border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500"
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
                </TabsContent>

                <TabsContent value="worker" className="space-y-5 mt-0">
                  {/* Worker Login Fields */}
                  <div className="space-y-2">
                    <Label htmlFor="workerId" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Worker ID
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        id="workerId"
                        type="text"
                        placeholder="Enter your Worker ID"
                        value={workerId}
                        onChange={(e) => setWorkerId(e.target.value)}
                        className="pl-11 h-12 border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="workerPassword" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        id="workerPassword"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-11 pr-11 h-12 border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500"
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
                </TabsContent>

                {/* Error Message */}
                {error && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-600 dark:text-red-400 text-center">{error}</p>
                  </div>
                )}

                {/* Login Button */}
                <Button
                  type="submit"
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>

                {/* Forgot Password */}
                <div className="text-center pt-2">
                  <button
                    type="button"
                    className="text-sm text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
                  >
                    Forgot your password?
                  </button>
                </div>
              </form>
            </Tabs>
          </CardContent>
        </Card>

        {/* Registration Link */}
        <div className="text-center mt-8">
          <Separator className="my-6" />
          <p className="text-gray-600 dark:text-gray-400">
            Don't have an admin account?{" "}
            <button
              onClick={() => navigate("/register")}
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium underline underline-offset-4"
            >
              Create one here
            </button>
          </p>
        </div>

        {/* Demo Credentials */}
        <Card className="mt-6 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardContent className="pt-4">
            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3 text-center">Demo Credentials</h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-700 rounded">
                <Badge variant="secondary" className="text-xs">Admin</Badge>
                <span className="text-gray-700 dark:text-gray-300 font-mono text-xs">admin@aquamanage.com / admin123</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-700 rounded">
                <Badge variant="secondary" className="text-xs">Worker</Badge>
                <span className="text-gray-700 dark:text-gray-300 font-mono text-xs">Any Worker ID / any password</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
