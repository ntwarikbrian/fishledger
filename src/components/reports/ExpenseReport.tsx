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

  // Define table columns
  const columns: DataTableColumn<ExpenseItem>[] = [
    {
      key: 'date',
      title: 'Date',
      sortable: true,
      render: (value) => format(new Date(value), 'MMM dd, yyyy')
    },
    {
      key: 'title',
      title: 'Expense',
      sortable: true,
      searchable: true,
      render: (value, row) => {
        const IconComponent = getCategoryIcon(row.category);
        return (
          <div className="flex items-center gap-2">
            <IconComponent className="h-4 w-4 text-blue-600" />
            <div>
              <div className="font-medium">{value}</div>
              <div className="text-xs text-muted-foreground line-clamp-1">
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
      render: (value) => (
        <div className="text-right font-bold text-red-600">
          ₣{value.toLocaleString()}
        </div>
      )
    },
    {
      key: 'category',
      title: 'Category',
      sortable: true,
      searchable: true,
      render: (value) => (
        <Badge variant="outline" className="text-xs">
          {value}
        </Badge>
      )
    },
    {
      key: 'spentBy',
      title: 'Spent By',
      sortable: true,
      searchable: true,
      render: (value) => (
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{value}</span>
        </div>
      )
    },
    {
      key: 'vendor',
      title: 'Vendor',
      sortable: true,
      searchable: true,
      render: (value) => value ? (
        <div className="flex items-center gap-2">
          <Building className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{value}</span>
        </div>
      ) : (
        <span className="text-muted-foreground">-</span>
      )
    },
    {
      key: 'status',
      title: 'Status',
      sortable: true,
      render: (value) => {
        const display = getStatusDisplay(value);
        const IconComponent = display.icon;
        return (
          <Badge variant="secondary" className={cn(display.bgColor, display.color)}>
            <IconComponent className="h-3 w-3 mr-1" />
            {display.label}
          </Badge>
        );
      }
    },
    {
      key: 'paymentMethod',
      title: 'Payment',
      render: (value) => value ? (
        <div className="text-xs text-muted-foreground">{value}</div>
      ) : (
        <span className="text-muted-foreground">-</span>
      )
    },
    {
      key: 'receipt',
      title: 'Receipt',
      render: (value) => value ? (
        <div className="flex items-center gap-1">
          <FileText className="h-3 w-3 text-green-600" />
          <span className="text-xs text-green-600">Available</span>
        </div>
      ) : (
        <span className="text-xs text-muted-foreground">None</span>
      )
    }
  ];

  // Get unique categories for filter
  const categories = Array.from(new Set(mockExpenseData.map(expense => expense.category)));

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Receipt className="h-6 w-6 text-red-600" />
            Expense Report
          </h2>
          <p className="text-muted-foreground mt-1">
            Financial tracking of expenditures by category and person
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <DateFilter value={dateFilter} onChange={onDateFilterChange} />
          
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-48">
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
            <SelectTrigger className="w-48">
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

          <ExportActions
            data={filteredExpenses}
            columns={columns}
            filename="expense_report"
            dateRange={dateFilter.customRange || { from: new Date(), to: new Date() }}
            reportType="Expense"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-red-600" />
              <div>
                <div className="text-sm text-muted-foreground">Total Expenses</div>
                <div className="text-lg font-bold text-red-600">
                  ₣{summary.totalExpenses.toLocaleString()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Receipt className="h-4 w-4 text-blue-600" />
              <div>
                <div className="text-sm text-muted-foreground">Avg Expense</div>
                <div className="text-lg font-bold text-blue-600">
                  ₣{summary.averageExpense.toFixed(0)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-purple-600" />
              <div>
                <div className="text-sm text-muted-foreground">Top Category</div>
                <div className="text-sm font-bold text-purple-600 truncate">
                  {summary.topCategory}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              <div>
                <div className="text-sm text-muted-foreground">Pending</div>
                <div className="text-lg font-bold text-yellow-600">
                  {summary.pendingApprovals}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-orange-600" />
              <div>
                <div className="text-sm text-muted-foreground">Budget</div>
                <div className="text-lg font-bold text-orange-600">
                  ₣{summary.monthlyBudget.toLocaleString()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Budget Used</span>
                <span className="text-sm font-medium">{summary.budgetUsed.toFixed(1)}%</span>
              </div>
              <Progress 
                value={summary.budgetUsed} 
                className={cn(
                  "h-2",
                  summary.budgetUsed > 90 && "bg-red-100",
                  summary.budgetUsed > 75 && summary.budgetUsed <= 90 && "bg-yellow-100"
                )}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <DataTable
        data={filteredExpenses}
        columns={columns}
        title="Expense Transactions"
        searchPlaceholder="Search expenses..."
        pageSize={15}
        emptyMessage="No expenses found for the selected criteria"
      />
    </div>
  );
};

export default ExpenseReport;
