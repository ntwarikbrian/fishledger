import React, { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  DollarSign, 
  Package, 
  User, 
  TrendingUp,
  ShoppingCart,
  Scale,
  Box,
  CheckCircle,
  Clock,
  XCircle,
  CreditCard
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import DataTable, { DataTableColumn } from "./DataTable";
import ExportActions from "./ExportActions";
import DateFilter from "./DateFilter";
import { SaleItem, SalesReportData, DateFilterState } from "@/pages/Reports";

interface SalesReportProps {
  dateFilter: DateFilterState;
  onDateFilterChange: (filter: DateFilterState) => void;
}

/**
 * SalesReport Component
 * 
 * Comprehensive sales report showing detailed sales data with products sold
 * by kg/box, worker information, and revenue amounts.
 * 
 * Features:
 * - Sales transaction tracking
 * - Selling method filtering (Weight-based/Boxed/Both)
 * - Payment status filtering
 * - Worker performance tracking
 * - Revenue analysis
 * - Export functionality
 */
const SalesReport: React.FC<SalesReportProps> = ({ dateFilter, onDateFilterChange }) => {
  const [sellingMethodFilter, setSellingMethodFilter] = useState<string>("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>("all");

  // Mock data for sales
  const mockSalesData: SaleItem[] = [
    {
      id: "S001",
      saleNumber: "SALE-001",
      productName: "Atlantic Salmon",
      productId: "P001",
      sellingMethod: "Weight-based",
      quantitySold: 15.5,
      unit: "kg",
      unitPrice: 18.50,
      totalAmount: 286.75,
      sellerName: "John Smith",
      sellerId: "W001",
      customerName: "Fresh Fish Market",
      customerId: "C001",
      saleDate: "2024-01-22",
      paymentStatus: "Paid",
      status: "Completed"
    },
    {
      id: "S002",
      saleNumber: "SALE-002",
      productName: "Sea Bass",
      productId: "P004",
      sellingMethod: "Boxed",
      quantitySold: 5,
      unit: "box",
      unitPrice: 32.50,
      totalAmount: 146.25,
      sellerName: "Maria Rodriguez",
      sellerId: "W002",
      customerName: "Ocean Restaurant",
      customerId: "C002",
      saleDate: "2024-01-21",
      paymentStatus: "Pending",
      status: "Processing"
    },
    {
      id: "S003",
      saleNumber: "SALE-003",
      productName: "Tilapia Fillets",
      productId: "P003",
      sellingMethod: "Boxed",
      quantitySold: 20,
      unit: "box",
      unitPrice: 12.99,
      totalAmount: 220.83,
      sellerName: "David Chen",
      sellerId: "W003",
      customerName: "Seafood Wholesale Co.",
      customerId: "C003",
      saleDate: "2024-01-21",
      paymentStatus: "Paid",
      status: "Completed"
    },
    {
      id: "S004",
      saleNumber: "SALE-004",
      productName: "Rainbow Trout",
      productId: "P002",
      sellingMethod: "Weight-based",
      quantitySold: 8.5,
      unit: "kg",
      unitPrice: 15.75,
      totalAmount: 133.88,
      sellerName: "John Smith",
      sellerId: "W001",
      customerName: "Local Fish Shop",
      customerId: "C004",
      saleDate: "2024-01-20",
      paymentStatus: "Pending",
      status: "Completed"
    },
    {
      id: "S005",
      saleNumber: "SALE-005",
      productName: "Atlantic Salmon",
      productId: "P001",
      sellingMethod: "Both",
      quantitySold: 35,
      unit: "mixed",
      unitPrice: 0,
      totalAmount: 598.25,
      sellerName: "Maria Rodriguez",
      sellerId: "W002",
      customerName: "Metro Supermarket",
      customerId: "C005",
      saleDate: "2024-01-19",
      paymentStatus: "Paid",
      status: "Completed"
    },
    {
      id: "S006",
      saleNumber: "SALE-006",
      productName: "Cod Fillets",
      productId: "P005",
      sellingMethod: "Weight-based",
      quantitySold: 12.0,
      unit: "kg",
      unitPrice: 24.99,
      totalAmount: 299.88,
      sellerName: "David Chen",
      sellerId: "W003",
      customerName: "Premium Seafood",
      customerId: "C006",
      saleDate: "2024-01-18",
      paymentStatus: "Overdue",
      status: "Completed"
    }
  ];

  // Filter sales based on selected criteria
  const filteredSales = useMemo(() => {
    let filtered = mockSalesData;

    if (sellingMethodFilter !== "all") {
      filtered = filtered.filter(sale => sale.sellingMethod === sellingMethodFilter);
    }

    if (paymentStatusFilter !== "all") {
      filtered = filtered.filter(sale => sale.paymentStatus === paymentStatusFilter);
    }

    return filtered;
  }, [mockSalesData, sellingMethodFilter, paymentStatusFilter]);

  // Calculate summary statistics
  const summary = useMemo(() => {
    const stats = {
      totalRevenue: 0,
      totalQuantitySold: 0,
      averageOrderValue: 0,
      topSellingProduct: "",
      topPerformingWorker: ""
    };

    const productSales: Record<string, number> = {};
    const workerSales: Record<string, number> = {};

    filteredSales.forEach(sale => {
      stats.totalRevenue += sale.totalAmount;
      stats.totalQuantitySold += sale.quantitySold;

      // Track product sales
      productSales[sale.productName] = (productSales[sale.productName] || 0) + sale.totalAmount;

      // Track worker sales
      workerSales[sale.sellerName] = (workerSales[sale.sellerName] || 0) + sale.totalAmount;
    });

    stats.averageOrderValue = filteredSales.length > 0 ? stats.totalRevenue / filteredSales.length : 0;

    // Find top selling product
    stats.topSellingProduct = Object.entries(productSales)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || "N/A";

    // Find top performing worker
    stats.topPerformingWorker = Object.entries(workerSales)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || "N/A";

    return stats;
  }, [filteredSales]);

  // Get selling method icon and display
  const getSellingMethodDisplay = (method: SaleItem['sellingMethod']) => {
    switch (method) {
      case 'Weight-based':
        return {
          icon: Scale,
          label: 'Weight (kg)',
          color: 'text-green-600',
          bgColor: 'bg-green-100 dark:bg-green-900/30'
        };
      case 'Boxed':
        return {
          icon: Box,
          label: 'Boxed',
          color: 'text-blue-600',
          bgColor: 'bg-blue-100 dark:bg-blue-900/30'
        };
      case 'Both':
        return {
          icon: Package,
          label: 'Mixed',
          color: 'text-purple-600',
          bgColor: 'bg-purple-100 dark:bg-purple-900/30'
        };
      default:
        return {
          icon: Package,
          label: method,
          color: 'text-gray-600',
          bgColor: 'bg-gray-100 dark:bg-gray-900/30'
        };
    }
  };

  // Get payment status display
  const getPaymentStatusDisplay = (status: SaleItem['paymentStatus']) => {
    switch (status) {
      case 'Paid':
        return {
          icon: CheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-100 dark:bg-green-900/30'
        };
      case 'Pending':
        return {
          icon: Clock,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100 dark:bg-yellow-900/30'
        };
      case 'Overdue':
        return {
          icon: XCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-100 dark:bg-red-900/30'
        };
      default:
        return {
          icon: CreditCard,
          color: 'text-gray-600',
          bgColor: 'bg-gray-100 dark:bg-gray-900/30'
        };
    }
  };

  // Define table columns
  const columns: DataTableColumn<SaleItem>[] = [
    {
      key: 'saleDate',
      title: 'Date',
      sortable: true,
      render: (value) => format(new Date(value), 'MMM dd, yyyy')
    },
    {
      key: 'saleNumber',
      title: 'Sale #',
      sortable: true,
      searchable: true,
      render: (value) => (
        <div className="font-mono text-sm font-medium">{value}</div>
      )
    },
    {
      key: 'productName',
      title: 'Item',
      sortable: true,
      searchable: true,
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-blue-600" />
          <div>
            <div className="font-medium">{value}</div>
            <div className="text-xs text-muted-foreground">ID: {row.productId}</div>
          </div>
        </div>
      )
    },
    {
      key: 'quantitySold',
      title: 'Qty Sold',
      sortable: true,
      render: (value, row) => (
        <div className="text-right">
          <div className="font-medium">
            {value} {row.unit === 'mixed' ? 'units' : row.unit}
          </div>
        </div>
      )
    },
    {
      key: 'sellingMethod',
      title: 'Unit',
      sortable: true,
      render: (value) => {
        const display = getSellingMethodDisplay(value);
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
      key: 'unitPrice',
      title: 'Unit Price',
      sortable: true,
      render: (value, row) => (
        <div className="text-right">
          {row.sellingMethod === 'Both' ? (
            <span className="text-xs text-muted-foreground">Mixed</span>
          ) : (
            <span className="font-medium">₣{value.toFixed(2)}</span>
          )}
        </div>
      )
    },
    {
      key: 'totalAmount',
      title: 'Total',
      sortable: true,
      render: (value) => (
        <div className="text-right font-bold text-green-600">
          ₣{value.toLocaleString()}
        </div>
      )
    },
    {
      key: 'sellerName',
      title: 'Seller',
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
      key: 'customerName',
      title: 'Customer',
      sortable: true,
      searchable: true,
      render: (value) => (
        <div className="max-w-32 truncate" title={value}>
          {value}
        </div>
      )
    },
    {
      key: 'paymentStatus',
      title: 'Payment',
      sortable: true,
      render: (value) => {
        const display = getPaymentStatusDisplay(value);
        const IconComponent = display.icon;
        return (
          <Badge variant="secondary" className={cn(display.bgColor, display.color)}>
            <IconComponent className="h-3 w-3 mr-1" />
            {value}
          </Badge>
        );
      }
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-green-600" />
            Sales Report
          </h2>
          <p className="text-muted-foreground mt-1">
            Detailed sales data and revenue analysis
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <DateFilter value={dateFilter} onChange={onDateFilterChange} />
          
          <Select value={sellingMethodFilter} onValueChange={setSellingMethodFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Methods</SelectItem>
              <SelectItem value="Weight-based">Weight-based</SelectItem>
              <SelectItem value="Boxed">Boxed</SelectItem>
              <SelectItem value="Both">Mixed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by payment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Payments</SelectItem>
              <SelectItem value="Paid">Paid</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>

          <ExportActions
            data={filteredSales}
            columns={columns}
            filename="sales_report"
            dateRange={dateFilter.customRange || { from: new Date(), to: new Date() }}
            reportType="Sales"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <div>
                <div className="text-sm text-muted-foreground">Total Revenue</div>
                <div className="text-lg font-bold text-green-600">
                  ₣{summary.totalRevenue.toLocaleString()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-blue-600" />
              <div>
                <div className="text-sm text-muted-foreground">Total Sales</div>
                <div className="text-lg font-bold text-blue-600">
                  {filteredSales.length}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-600" />
              <div>
                <div className="text-sm text-muted-foreground">Avg Order Value</div>
                <div className="text-lg font-bold text-purple-600">
                  ₣{summary.averageOrderValue.toFixed(0)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-orange-600" />
              <div>
                <div className="text-sm text-muted-foreground">Top Product</div>
                <div className="text-sm font-bold text-orange-600 truncate">
                  {summary.topSellingProduct}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-indigo-600" />
              <div>
                <div className="text-sm text-muted-foreground">Top Seller</div>
                <div className="text-sm font-bold text-indigo-600 truncate">
                  {summary.topPerformingWorker}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <DataTable
        data={filteredSales}
        columns={columns}
        title="Sales Transactions"
        searchPlaceholder="Search sales..."
        pageSize={15}
        emptyMessage="No sales found for the selected criteria"
      />
    </div>
  );
};

export default SalesReport;
