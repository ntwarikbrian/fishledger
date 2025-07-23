
// Import i18n configuration - must be imported before any components that use translations
import './i18n';

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import Dashboard from "./pages/Index";
import WorkerDashboard from "./pages/WorkerDashboard";
import ProductInventory from "./pages/ProductInventory";
import Sales from "./pages/Sales";
import Customers from "./pages/Customers";
import Transactions from "./pages/Transactions";
import Staff from "./pages/Staff";
import Expenses from "./pages/Expenses";
import Documents from "./pages/Documents";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Help from "./pages/Help";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import NotFound from "./pages/NotFound";
import AuthGuard from "./components/auth/AuthGuard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <CurrencyProvider>
        <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Authentication Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* Protected Main Application Routes */}
            <Route path="/" element={<AuthGuard><Dashboard /></AuthGuard>} />
            <Route path="/inventory" element={<AuthGuard><ProductInventory /></AuthGuard>} />
            <Route path="/sales" element={<AuthGuard><Sales /></AuthGuard>} />
            <Route path="/customers" element={<AuthGuard><Customers /></AuthGuard>} />
            <Route path="/transactions" element={<AuthGuard><Transactions /></AuthGuard>} />
            <Route path="/transactions/deposits" element={<AuthGuard><Transactions /></AuthGuard>} />
            <Route path="/transactions/debtors" element={<AuthGuard><Transactions /></AuthGuard>} />
            <Route path="/staff" element={<AuthGuard><Staff /></AuthGuard>} />
            <Route path="/expenses" element={<AuthGuard><Expenses /></AuthGuard>} />
            <Route path="/expenses/add-expenses" element={<AuthGuard><Expenses /></AuthGuard>} />
            <Route path="/expenses/all-expenses" element={<AuthGuard><Expenses /></AuthGuard>} />
            <Route path="/documents" element={<AuthGuard><Documents /></AuthGuard>} />
            <Route path="/reports" element={<AuthGuard><Reports /></AuthGuard>} />
            <Route path="/settings" element={<AuthGuard><Settings /></AuthGuard>} />
            <Route path="/help" element={<AuthGuard><Help /></AuthGuard>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        </TooltipProvider>
      </CurrencyProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
