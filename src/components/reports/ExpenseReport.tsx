import React, { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Receipt, 
  DollarSign, 
  User, 
  Tag,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  TrendingUp,
  CreditCard,
  FileText,
  Building
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import DataTable, { DataTableColumn } from "./DataTable";
import ExportActions from "./ExportActions";
import DateFilter from "./DateFilter";
import { ExpenseItem, ExpenseReportData, DateFilterState } from "@/pages/Reports";

interface ExpenseReportProps {
  dateFilter: DateFilterState;
  onDateFilterChange: (filter: DateFilterState) => void;
}

/**
 * ExpenseReport Component
 * 
 * Comprehensive expense report showing financial tracking of expenditures
 * by category and person.
 * 
 * Features:
 * - Expense tracking by category
 * - Status filtering (pending/approved/paid/rejected)
 * - Spending analysis by person
 * - Budget tracking and utilization
 * - Export functionality
 */
const ExpenseReport: React.FC<ExpenseReportProps> = ({ dateFilter, onDateFilterChange }) => {
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Mock data for expenses
  const mockExpenseData: ExpenseItem[] = [
    {
      id: "E001",
      title: "Fresh Fish Delivery",
      description: "Weekly delivery from Ocean Fresh Ltd - Atlantic Salmon and Sea Bass",
      amount: 2500.00,
      category: "Inventory Purchase",
      categoryId: "CAT001",
      date: "2024-01-22",
      vendor: "Ocean Fresh Ltd",
      spentBy: "John Smith",
      spentById: "W001",
      receipt: "receipt_001.pdf",
      status: "paid",
      paymentMethod: "Bank Transfer"
    },
    {
      id: "E002",
      title: "Refrigeration Unit Maintenance",
      description: "Monthly maintenance and cleaning of cold storage units",
      amount: 450.00,
      category: "Equipment Maintenance",
      categoryId: "CAT002",
      date: "2024-01-21",
      vendor: "CoolTech Services",
      spentBy: "Maria Rodriguez",
      spentById: "W002",
      receipt: "receipt_002.pdf",
      status: "approved",
      paymentMethod: "Credit Card"
    },
    {
      id: "E003",
      title: "Packaging Materials",
      description: "Ice packs, foam boxes, and plastic bags for fish packaging",
      amount: 180.75,
      category: "Packaging Supplies",
      categoryId: "CAT003",
      date: "2024-01-20",
      vendor: "PackPro Supplies",
      spentBy: "David Chen",
      spentById: "W003",
      status: "pending",
      paymentMethod: "Cash"
    },
    {
      id: "E004",
      title: "Fuel for Delivery Vehicles",
      description: "Gasoline for delivery trucks - January 2024",
      amount: 320.50,
      category: "Transportation",
      categoryId: "CAT004",
      date: "2024-01-19",
      vendor: "Shell Gas Station",
      spentBy: "David Chen",
      spentById: "W003",
      receipt: "receipt_004.pdf",
      status: "paid",
      paymentMethod: "Company Card"
    },
    {
      id: "E005",
      title: "Marketing Materials",
      description: "Flyers and business cards for promotional campaign",
      amount: 125.00,
      category: "Marketing",
      categoryId: "CAT005",
      date: "2024-01-18",
      vendor: "PrintMax",
      spentBy: "Sarah Johnson",
      spentById: "W004",
      status: "rejected",
      paymentMethod: "Credit Card"
    },
    {
      id: "E006",
      title: "Office Supplies",
      description: "Stationery, printer paper, and ink cartridges",
      amount: 95.25,
      category: "Office Supplies",
      categoryId: "CAT006",
      date: "2024-01-17",
      vendor: "Office Depot",
      spentBy: "John Smith",
      spentById: "W001",
      receipt: "receipt_006.pdf",
      status: "approved",
      paymentMethod: "Credit Card"
    },
    {
      id: "E007",
      title: "Insurance Premium",
      description: "Monthly business insurance premium payment",
      amount: 850.00,
      category: "Insurance",
      categoryId: "CAT007",
      date: "2024-01-15",
      vendor: "SecureGuard Insurance",
      spentBy: "John Smith",
      spentById: "W001",
      status: "paid",
      paymentMethod: "Bank Transfer"
    }
  ];

  // Filter expenses based on selected criteria
  const filteredExpenses = useMemo(() => {
    let filtered = mockExpenseData;

    if (categoryFilter !== "all") {
      filtered = filtered.filter(expense => expense.category === categoryFilter);
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(expense => expense.status === statusFilter);
    }

    return filtered;
  }, [mockExpenseData, categoryFilter, statusFilter]);

  // Calculate summary statistics
  const summary = useMemo(() => {
    const stats = {
      totalExpenses: 0,
      averageExpense: 0,
      topCategory: "",
      pendingApprovals: 0,
      monthlyBudget: 10000, // Mock budget
      budgetUsed: 0
    };

    const categoryTotals: Record<string, number> = {};

    filteredExpenses.forEach(expense => {
      stats.totalExpenses += expense.amount;
      
      if (expense.status === 'pending') {
        stats.pendingApprovals++;
      }

      // Track category spending
      categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount;
    });

    stats.averageExpense = filteredExpenses.length > 0 ? stats.totalExpenses / filteredExpenses.length : 0;
    stats.budgetUsed = (stats.totalExpenses / stats.monthlyBudget) * 100;

    // Find top spending category
    stats.topCategory = Object.entries(categoryTotals)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || "N/A";

    return stats;
  }, [filteredExpenses]);

  // Get expense status display
  const getStatusDisplay = (status: ExpenseItem['status']) => {
    switch (status) {
      case 'paid':
        return {
          icon: CheckCircle,
          label: 'Paid',
          color: 'text-green-600',
          bgColor: 'bg-green-100 dark:bg-green-900/30'
        };
      case 'approved':
        return {
          icon: CheckCircle,
          label: 'Approved',
          color: 'text-blue-600',
          bgColor: 'bg-blue-100 dark:bg-blue-900/30'
        };
      case 'pending':
        return {
          icon: Clock,
          label: 'Pending',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100 dark:bg-yellow-900/30'
        };
      case 'rejected':
        return {
          icon: XCircle,
          label: 'Rejected',
          color: 'text-red-600',
          bgColor: 'bg-red-100 dark:bg-red-900/30'
        };
      default:
        return {
          icon: AlertTriangle,
          label: status,
          color: 'text-gray-600',
          bgColor: 'bg-gray-100 dark:bg-gray-900/30'
        };
    }
  };

  // Get category icon
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Inventory Purchase':
        return Receipt;
      case 'Equipment Maintenance':
        return Building;
      case 'Transportation':
        return TrendingUp;
      case 'Marketing':
        return FileText;
      case 'Office Supplies':
        return Tag;
      case 'Insurance':
        return CreditCard;
      default:
        return Receipt;
    }
  };

  // Define table columns with responsive design
  const columns: DataTableColumn<ExpenseItem>[] = [
    {
      key: 'date',
      title: 'Date',
      sortable: true,
      className: 'min-w-[100px]',
      render: (value) => (
        <div className="text-xs sm:text-sm">
          {format(new Date(value), 'MMM dd, yyyy')}
        </div>
      )
    },
    {
      key: 'title',
      title: 'Expense',
      sortable: true,
      searchable: true,
      className: 'min-w-[200px]',
      render: (value, row) => {
        const IconComponent = getCategoryIcon(row.category);
        return (
          <div className="flex items-center gap-2">
            <IconComponent className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 flex-shrink-0" />
            <div className="min-w-0">
              <div className="font-medium text-xs sm:text-sm truncate">{value}</div>
              <div className="text-xs text-muted-foreground line-clamp-1 hidden sm:block">
                {row.description}
              </div>
            </div>
          </div>
        );
      }
    },
    {
      key: 'amount',
      title: 'Amount',
      sortable: true,
      className: 'min-w-[100px] text-right',
      render: (value) => (
        <div className="text-right font-bold text-red-600 text-xs sm:text-sm">
          ₣{value.toLocaleString()}
        </div>
      )
    },
    {
      key: 'category',
      title: 'Category',
      sortable: true,
      searchable: true,
      className: 'min-w-[120px] hidden lg:table-cell',
      render: (value) => (
        <Badge variant="outline" className="text-xs truncate max-w-[100px]">
          {value}
        </Badge>
      )
    },
    {
      key: 'spentBy',
      title: 'Spent By',
      sortable: true,
      searchable: true,
      className: 'min-w-[120px] hidden xl:table-cell',
      render: (value) => (
        <div className="flex items-center gap-2">
          <User className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
          <span className="text-xs sm:text-sm truncate">{value}</span>
        </div>
      )
    },
    {
      key: 'vendor',
      title: 'Vendor',
      sortable: true,
      searchable: true,
      className: 'min-w-[120px] hidden 2xl:table-cell',
      render: (value) => value ? (
        <div className="flex items-center gap-2">
          <Building className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
          <span className="text-xs sm:text-sm truncate">{value}</span>
        </div>
      ) : (
        <span className="text-muted-foreground text-xs">-</span>
      )
    },
    {
      key: 'status',
      title: 'Status',
      sortable: true,
      className: 'min-w-[100px]',
      render: (value) => {
        const display = getStatusDisplay(value);
        const IconComponent = display.icon;
        return (
          <Badge variant="secondary" className={cn(display.bgColor, display.color, "text-xs")}>
            <IconComponent className="h-2 w-2 sm:h-3 sm:w-3 mr-1" />
            <span className="hidden sm:inline">{display.label}</span>
            <span className="sm:hidden">
              {value === 'paid' ? '✓' : value === 'approved' ? '👍' : value === 'pending' ? '⏳' : '✗'}
            </span>
          </Badge>
        );
      }
    },
    {
      key: 'paymentMethod',
      title: 'Payment',
      className: 'min-w-[100px] hidden lg:table-cell',
      render: (value) => value ? (
        <div className="text-xs text-muted-foreground truncate">{value}</div>
      ) : (
        <span className="text-muted-foreground text-xs">-</span>
      )
    },
    {
      key: 'receipt',
      title: 'Receipt',
      className: 'min-w-[80px] hidden sm:table-cell',
      render: (value) => value ? (
        <div className="flex items-center gap-1">
          <FileText className="h-3 w-3 text-green-600" />
          <span className="text-xs text-green-600 hidden lg:inline">Available</span>
          <span className="text-xs text-green-600 lg:hidden">✓</span>
        </div>
      ) : (
        <span className="text-xs text-muted-foreground">-</span>
      )
    }
  ];

  // Get unique categories for filter
  const categories = Array.from(new Set(mockExpenseData.map(expense => expense.category)));

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex flex-col gap-4">
        {/* Title Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold flex items-center gap-2">
              <Receipt className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
              Expense Report
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              Financial tracking of expenditures by category and person
            </p>
          </div>

          {/* Export button - visible on larger screens */}
          <div className="hidden lg:block">
            <ExportActions
              data={filteredExpenses}
              columns={columns}
              filename="expense_report"
              dateRange={dateFilter.customRange || { from: new Date(), to: new Date() }}
              reportType="Expense"
            />
          </div>
        </div>

        {/* Filters Section */}
        <div className="flex flex-col gap-3">
          {/* Date Filter - Full width on mobile */}
          <div className="w-full">
            <DateFilter value={dateFilter} onChange={onDateFilterChange} className="w-full" />
          </div>

          {/* Other Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>

            {/* Export button - visible on smaller screens */}
            <div className="lg:hidden sm:col-span-2 lg:col-span-1">
              <ExportActions
                data={filteredExpenses}
                columns={columns}
                filename="expense_report"
                dateRange={dateFilter.customRange || { from: new Date(), to: new Date() }}
                reportType="Expense"
                className="w-full"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex-shrink-0">
                <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs sm:text-sm text-muted-foreground">Total Expenses</div>
                <div className="text-sm sm:text-lg font-bold text-red-600 truncate">
                  ₣{summary.totalExpenses.toLocaleString()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex-shrink-0">
                <Receipt className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs sm:text-sm text-muted-foreground">Avg Expense</div>
                <div className="text-sm sm:text-lg font-bold text-blue-600">
                  ₣{summary.averageExpense.toFixed(0)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex-shrink-0">
                <Tag className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs sm:text-sm text-muted-foreground">Top Category</div>
                <div className="text-xs sm:text-sm font-bold text-purple-600 truncate" title={summary.topCategory}>
                  {summary.topCategory}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex-shrink-0">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs sm:text-sm text-muted-foreground">Pending</div>
                <div className="text-sm sm:text-lg font-bold text-yellow-600">
                  {summary.pendingApprovals}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex-shrink-0">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs sm:text-sm text-muted-foreground">Budget</div>
                <div className="text-sm sm:text-lg font-bold text-orange-600 truncate">
                  ₣{summary.monthlyBudget.toLocaleString()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow sm:col-span-2 lg:col-span-1">
          <CardContent className="p-3 sm:p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm text-muted-foreground">Budget Used</span>
                <span className="text-xs sm:text-sm font-medium">{summary.budgetUsed.toFixed(1)}%</span>
              </div>
              <Progress
                value={summary.budgetUsed}
                className={cn(
                  "h-1.5 sm:h-2",
                  summary.budgetUsed > 90 && "bg-red-100",
                  summary.budgetUsed > 75 && summary.budgetUsed <= 90 && "bg-yellow-100"
                )}
              />
              <div className="text-xs text-muted-foreground">
                ₣{(summary.monthlyBudget * summary.budgetUsed / 100).toFixed(0)} used
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <div className="w-full overflow-hidden">
        <DataTable
          data={filteredExpenses}
          columns={columns}
          title="Expense Transactions"
          searchPlaceholder="Search expenses..."
          pageSize={10}
          emptyMessage="No expenses found for the selected criteria"
          className="min-w-full"
        />
      </div>
    </div>
  );
};

export default ExpenseReport;
