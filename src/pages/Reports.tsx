import React, { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Package,
  DollarSign,
  Users,
  Receipt,
  TrendingUp,
  Calendar as CalendarIcon,
  Download,
  FileText,
  Printer,
  Search,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  BarChart3,
  ArrowLeft,
  AlertTriangle,
  RefreshCw
} from "lucide-react";
import { format, subDays, subWeeks, subMonths, startOfDay, endOfDay } from "date-fns";
import { cn } from "@/lib/utils";

// ===== TypeScript Interfaces and Types =====

// Date filter types
export type DateFilterPreset = 'today' | 'week' | 'month' | 'custom';

export interface DateRange {
  from: Date;
  to: Date;
}

export interface DateFilterState {
  preset: DateFilterPreset;
  customRange?: DateRange;
}

// Export types
export type ExportFormat = 'excel' | 'csv' | 'print';

export interface ExportOptions {
  format: ExportFormat;
  filename?: string;
  includeHeaders: boolean;
  dateRange: DateRange;
}

// Period comparison types
export interface PeriodComparison {
  current: number;
  previous: number;
  growth: number;
  growthPercentage: number;
  isPositive: boolean;
}

// Stock Report types
export interface StockMovement {
  id: string;
  productName: string;
  productId: string;
  movementType: 'in' | 'out' | 'adjustment' | 'damaged' | 'expired';
  quantity: number;
  unit: 'kg' | 'box';
  unitWeight?: number; // for boxed items
  reason: string;
  date: string;
  performedBy: string;
  notes?: string;
}

export interface StockReportData {
  movements: StockMovement[];
  summary: {
    totalIn: number;
    totalOut: number;
    currentStock: number;
    adjustments: number;
    damaged: number;
    expired: number;
  };
}

// Sales Report types
export interface SaleItem {
  id: string;
  saleNumber: string;
  productName: string;
  productId: string;
  sellingMethod: 'Weight-based' | 'Boxed' | 'Both';
  quantitySold: number;
  unit: 'kg' | 'box';
  unitPrice: number;
  totalAmount: number;
  sellerName: string;
  sellerId: string;
  customerName: string;
  customerId: string;
  saleDate: string;
  paymentStatus: 'Paid' | 'Pending' | 'Overdue';
  status: 'Completed' | 'Processing' | 'Cancelled';
}

export interface SalesReportData {
  sales: SaleItem[];
  summary: {
    totalRevenue: number;
    totalQuantitySold: number;
    averageOrderValue: number;
    topSellingProduct: string;
    topPerformingWorker: string;
  };
}

// Worker Report types
export interface WorkerPerformance {
  id: string;
  workerId: string;
  workerName: string;
  workerEmail: string;
  totalSales: number;
  totalRevenue: number;
  averageSaleValue: number;
  workingDays: number;
  hoursWorked: number;
  tasksCompleted: number;
  tasksAssigned: number;
  performanceScore: number; // 0-100
  lastActive: string;
}

export interface WorkerReportData {
  workers: WorkerPerformance[];
  summary: {
    totalWorkers: number;
    activeWorkers: number;
    averagePerformance: number;
    topPerformer: string;
    totalHoursWorked: number;
  };
}

// Expense Report types
export interface ExpenseItem {
  id: string;
  title: string;
  description: string;
  amount: number;
  category: string;
  categoryId: string;
  date: string;
  vendor?: string;
  spentBy: string;
  spentById: string;
  receipt?: string;
  status: 'pending' | 'approved' | 'paid' | 'rejected';
  paymentMethod?: string;
}

export interface ExpenseReportData {
  expenses: ExpenseItem[];
  summary: {
    totalExpenses: number;
    averageExpense: number;
    topCategory: string;
    pendingApprovals: number;
    monthlyBudget: number;
    budgetUsed: number;
  };
}

// Profit Report types
export interface ProfitCalculation {
  date: string;
  revenue: number;
  costOfGoods: number;
  operatingExpenses: number;
  grossProfit: number;
  netProfit: number;
  profitMargin: number;
}

export interface ProfitReportData {
  calculations: ProfitCalculation[];
  summary: {
    totalRevenue: number;
    totalCosts: number;
    totalExpenses: number;
    grossProfit: number;
    netProfit: number;
    averageProfitMargin: number;
  };
  comparison: PeriodComparison;
}

// Main report types
export type ReportType = 'stock' | 'sales' | 'worker' | 'expense' | 'profit';

export interface ReportCategory {
  id: ReportType;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
}

// Import report components
import ReportCard from "@/components/reports/ReportCard";
import DateFilter from "@/components/reports/DateFilter";
import StockReport from "@/components/reports/StockReport";
import SalesReport from "@/components/reports/SalesReport";
import WorkerReport from "@/components/reports/WorkerReport";
import ExpenseReport from "@/components/reports/ExpenseReport";
import ProfitReport from "@/components/reports/ProfitReport";
import ErrorBoundary from "@/components/reports/ErrorBoundary";
import LoadingState from "@/components/reports/LoadingState";
import { useToast } from "@/components/ui/use-toast";

const Reports = () => {
  // Hooks
  const { toast } = useToast();

  // State management
  const [activeReport, setActiveReport] = useState<ReportType | null>(null);
  const [dateFilter, setDateFilter] = useState<DateFilterState>({
    preset: 'month',
    customRange: undefined
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Report categories configuration
  const reportCategories: ReportCategory[] = [
    {
      id: 'stock',
      title: 'Stock Report',
      description: 'Track inventory movements - what stock came in, went out, and current remaining quantities',
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30'
    },
    {
      id: 'sales',
      title: 'Sales Report',
      description: 'Detailed sales data showing what was sold (by kg/box), which worker made the sale, and revenue amounts',
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/30'
    },
    {
      id: 'worker',
      title: 'Worker Report',
      description: 'Performance tracking showing which worker sold what products, their work schedules, and individual sales performance metrics',
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30'
    },
    {
      id: 'expense',
      title: 'Expense Report',
      description: 'Financial tracking of all expenditures including what money was spent, on which categories, and by which person',
      icon: Receipt,
      color: 'text-red-600',
      bgColor: 'bg-red-100 dark:bg-red-900/30'
    },
    {
      id: 'profit',
      title: 'Profit Report',
      description: 'Comprehensive profit analysis showing daily/weekly/monthly profit calculations (Revenue - Cost - Expenses)',
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900/30'
    }
  ];

  // Mock statistics for report cards
  const getReportStats = (reportId: ReportType) => {
    switch (reportId) {
      case 'stock':
        return {
          value: '285.5 kg',
          label: 'Current Stock',
          trend: { value: 12.5, isPositive: true }
        };
      case 'sales':
        return {
          value: '₣37,650',
          label: 'Total Revenue',
          trend: { value: 18.3, isPositive: true }
        };
      case 'worker':
        return {
          value: '5 Active',
          label: 'Workers',
          trend: { value: 8.7, isPositive: true }
        };
      case 'expense':
        return {
          value: '₣4,521',
          label: 'Total Expenses',
          trend: { value: -5.2, isPositive: false }
        };
      case 'profit':
        return {
          value: '₣2,358',
          label: 'Net Profit',
          trend: { value: 24.1, isPositive: true }
        };
      default:
        return undefined;
    }
  };

  // Handle report selection with loading and error handling
  const handleReportSelect = async (reportId: ReportType) => {
    try {
      setIsLoading(true);
      setError(null);

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // In a real app, you might fetch report-specific data here
      // const reportData = await fetchReportData(reportId, dateFilter);

      setActiveReport(reportId);

      toast({
        title: "Report loaded successfully",
        description: `${reportCategories.find(cat => cat.id === reportId)?.title} is ready to view.`,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load report';
      setError(errorMessage);

      toast({
        title: "Error loading report",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle back to overview
  const handleBackToOverview = () => {
    setActiveReport(null);
    setError(null);
  };

  // Handle date filter changes with error handling
  const handleDateFilterChange = (newFilter: DateFilterState) => {
    try {
      setDateFilter(newFilter);

      // In a real app, you might refetch data when date filter changes
      // refetchReportData(activeReport, newFilter);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update date filter';
      toast({
        title: "Error updating filter",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // Render specific report component with error boundary
  const renderReportComponent = () => {
    if (!activeReport) return null;

    const commonProps = {
      dateFilter,
      onDateFilterChange: handleDateFilterChange
    };

    // Show loading state
    if (isLoading) {
      return <LoadingState type="full" title="Loading Report" description="Fetching your report data..." />;
    }

    // Show error state
    if (error) {
      return (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="h-12 w-12 text-red-600 mb-4" />
            <CardTitle className="text-red-700 dark:text-red-400 mb-2">
              Failed to Load Report
            </CardTitle>
            <CardDescription className="text-red-600 dark:text-red-300 text-center mb-4">
              {error}
            </CardDescription>
            <Button
              variant="outline"
              onClick={() => handleReportSelect(activeReport)}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      );
    }

    // Render report component wrapped in error boundary
    return (
      <ErrorBoundary>
        {(() => {
          switch (activeReport) {
            case 'stock':
              return <StockReport {...commonProps} />;
            case 'sales':
              return <SalesReport {...commonProps} />;
            case 'worker':
              return <WorkerReport {...commonProps} />;
            case 'expense':
              return <ExpenseReport {...commonProps} />;
            case 'profit':
              return <ProfitReport {...commonProps} />;
            default:
              return null;
          }
        })()}
      </ErrorBoundary>
    );
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {!activeReport ? (
          // Reports Overview
          <>
            {/* Header */}
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-3">
                  <BarChart3 className="h-8 w-8 text-primary" />
                  Reports & Analytics
                </h1>
                <p className="text-muted-foreground mt-2">
                  Comprehensive reporting system for your fish selling business
                </p>
              </div>

              {/* Global date filter */}
              <div className="flex items-center gap-3">
                <DateFilter value={dateFilter} onChange={handleDateFilterChange} />
              </div>
            </div>

            {/* Report Categories Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reportCategories.map((category) => (
                <ReportCard
                  key={category.id}
                  category={category}
                  onClick={() => handleReportSelect(category.id)}
                  stats={getReportStats(category.id)}
                  className="hover:shadow-xl transition-all duration-300"
                />
              ))}
            </div>

            {/* Quick Stats Overview */}
            <Card className="border-2 border-dashed border-muted-foreground/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Quick Overview
                </CardTitle>
                <CardDescription>
                  Key metrics at a glance for the selected period
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">₣37,650</div>
                    <div className="text-sm text-muted-foreground">Total Revenue</div>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">₣4,521</div>
                    <div className="text-sm text-muted-foreground">Total Expenses</div>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-primary">₣2,358</div>
                    <div className="text-sm text-muted-foreground">Net Profit</div>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">285.5kg</div>
                    <div className="text-sm text-muted-foreground">Current Stock</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          // Specific Report View
          <>
            {/* Back Navigation */}
            <div className="flex items-center gap-4 mb-6">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBackToOverview}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Reports
              </Button>

              <div className="flex items-center gap-2">
                {reportCategories.map((category) => (
                  category.id === activeReport && (
                    <Badge key={category.id} variant="secondary" className="gap-2">
                      <category.icon className="h-3 w-3" />
                      {category.title}
                    </Badge>
                  )
                ))}
              </div>
            </div>

            {/* Render Active Report */}
            {renderReportComponent()}
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default Reports;
