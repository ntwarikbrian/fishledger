import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import WorkerDashboard from "@/pages/WorkerDashboard";

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check if user is authenticated
    const userType = localStorage.getItem("userType");
    
    if (!userType) {
      // User is not authenticated, redirect to login
      navigate("/login");
    }
  }, [navigate]);

  // Check authentication status
  const userType = localStorage.getItem("userType");
  
  if (!userType) {
    // Show loading or redirect (the useEffect will handle the redirect)
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950 dark:via-indigo-950 dark:to-purple-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // If user is a worker and trying to access the main dashboard, show worker dashboard instead
  if (userType === "worker" && location.pathname === "/") {
    return <WorkerDashboard />;
  }

  // If user is a worker trying to access admin-only routes, redirect to worker dashboard
  if (userType === "worker" && location.pathname !== "/") {
    // List of admin-only routes that workers should not access
    const adminOnlyRoutes = [
      "/inventory", "/sales", "/customers", "/transactions", 
      "/staff", "/expenses", "/documents", "/reports", "/settings", "/help"
    ];
    
    if (adminOnlyRoutes.some(route => location.pathname.startsWith(route))) {
      return <WorkerDashboard />;
    }
  }

  // User is authenticated and authorized, render the protected content
  return <>{children}</>;
};

export default AuthGuard;
