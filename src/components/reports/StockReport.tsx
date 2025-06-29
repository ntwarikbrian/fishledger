import React, { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Package, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  RotateCcw,
  Calendar,
  User,
  FileText
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import DataTable, { DataTableColumn } from "./DataTable";
import ExportActions from "./ExportActions";
import DateFilter from "./DateFilter";
import { StockMovement, StockReportData, DateFilterState } from "@/pages/Reports";

interface StockReportProps {
  dateFilter: DateFilterState;
  onDateFilterChange: (filter: DateFilterState) => void;
}

/**
 * StockReport Component
 * 
 * Comprehensive stock report showing inventory movements, tracking what stock
 * came in, went out, and current remaining quantities.
 * 
 * Features:
 * - Stock movement tracking (in/out/adjustments/damaged/expired)
 * - Movement type filtering
 * - Summary statistics
 * - Export functionality
 * - Responsive data table
 */
const StockReport: React.FC<StockReportProps> = ({ dateFilter, onDateFilterChange }) => {
  const [movementTypeFilter, setMovementTypeFilter] = useState<string>("all");

  // Mock data for stock movements
  const mockStockMovements: StockMovement[] = [
    {
      id: "SM001",
      productName: "Atlantic Salmon",
      productId: "P001",
      movementType: "in",
      quantity: 50,
      unit: "kg",
      reason: "New stock delivery",
      date: "2024-01-22",
      performedBy: "John Smith",
      notes: "Fresh delivery from Ocean Fresh Ltd"
    },
    {
      id: "SM002",
      productName: "Rainbow Trout",
      productId: "P002",
      movementType: "out",
      quantity: 15.5,
      unit: "kg",
      reason: "Sale to Fresh Fish Market",
      date: "2024-01-22",
      performedBy: "Maria Rodriguez",
      notes: "Sale #SALE-001"
    },
    {
      id: "SM003",
      productName: "Tilapia Fillets",
      productId: "P003",
      movementType: "in",
      quantity: 30,
      unit: "box",
      unitWeight: 0.8,
      reason: "Restocking",
      date: "2024-01-21",
      performedBy: "David Chen",
      notes: "24kg total weight"
    },
    {
      id: "SM004",
      productName: "Sea Bass",
      productId: "P004",
      movementType: "damaged",
      quantity: 3,
      unit: "box",
      unitWeight: 1.2,
      reason: "Damaged during transport",
      date: "2024-01-21",
      performedBy: "John Smith",
      notes: "Insurance claim filed"
    },
    {
      id: "SM005",
      productName: "Cod Fillets",
      productId: "P005",
      movementType: "expired",
      quantity: 2.5,
      unit: "kg",
      reason: "Past expiry date",
      date: "2024-01-20",
      performedBy: "Maria Rodriguez",
      notes: "Disposed according to regulations"
    },
    {
      id: "SM006",
      productName: "Atlantic Salmon",
      productId: "P001",
      movementType: "adjustment",
      quantity: -2,
      unit: "kg",
      reason: "Inventory correction",
      date: "2024-01-20",
      performedBy: "John Smith",
      notes: "Physical count discrepancy"
    },
    {
      id: "SM007",
      productName: "Rainbow Trout",
      productId: "P002",
      movementType: "out",
      quantity: 8.5,
      unit: "kg",
      reason: "Sale to Local Fish Shop",
      date: "2024-01-19",
      performedBy: "David Chen",
      notes: "Sale #SALE-004"
    }
  ];

  // Filter movements based on selected type
  const filteredMovements = useMemo(() => {
    if (movementTypeFilter === "all") return mockStockMovements;
    return mockStockMovements.filter(movement => movement.movementType === movementTypeFilter);
  }, [mockStockMovements, movementTypeFilter]);

  // Calculate summary statistics
  const summary = useMemo(() => {
    const stats = {
      totalIn: 0,
      totalOut: 0,
      currentStock: 0,
      adjustments: 0,
      damaged: 0,
      expired: 0
    };

    mockStockMovements.forEach(movement => {
      const weight = movement.unit === 'box' && movement.unitWeight 
        ? movement.quantity * movement.unitWeight 
        : movement.quantity;

      switch (movement.movementType) {
        case 'in':
          stats.totalIn += weight;
          stats.currentStock += weight;
          break;
        case 'out':
          stats.totalOut += weight;
          stats.currentStock -= weight;
          break;
        case 'adjustment':
          stats.adjustments += Math.abs(weight);
          stats.currentStock += weight; // Can be negative
          break;
        case 'damaged':
          stats.damaged += weight;
          stats.currentStock -= weight;
          break;
        case 'expired':
          stats.expired += weight;
          stats.currentStock -= weight;
          break;
      }
    });

    return stats;
  }, [mockStockMovements]);

  // Get movement type icon and color
  const getMovementTypeDisplay = (type: StockMovement['movementType']) => {
    switch (type) {
      case 'in':
        return {
          icon: TrendingUp,
          label: 'Stock In',
          color: 'text-green-600',
          bgColor: 'bg-green-100 dark:bg-green-900/30'
        };
      case 'out':
        return {
          icon: TrendingDown,
          label: 'Stock Out',
          color: 'text-blue-600',
          bgColor: 'bg-blue-100 dark:bg-blue-900/30'
        };
      case 'adjustment':
        return {
          icon: RotateCcw,
          label: 'Adjustment',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100 dark:bg-yellow-900/30'
        };
      case 'damaged':
        return {
          icon: XCircle,
          label: 'Damaged',
          color: 'text-red-600',
          bgColor: 'bg-red-100 dark:bg-red-900/30'
        };
      case 'expired':
        return {
          icon: AlertTriangle,
          label: 'Expired',
          color: 'text-orange-600',
          bgColor: 'bg-orange-100 dark:bg-orange-900/30'
        };
      default:
        return {
          icon: Package,
          label: 'Unknown',
          color: 'text-gray-600',
          bgColor: 'bg-gray-100 dark:bg-gray-900/30'
        };
    }
  };

  // Define table columns
  const columns: DataTableColumn<StockMovement>[] = [
    {
      key: 'date',
      title: 'Date',
      sortable: true,
      render: (value) => format(new Date(value), 'MMM dd, yyyy')
    },
    {
      key: 'productName',
      title: 'Product',
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
      key: 'movementType',
      title: 'Type',
      sortable: true,
      render: (value) => {
        const display = getMovementTypeDisplay(value);
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
      key: 'quantity',
      title: 'Quantity',
      sortable: true,
      render: (value, row) => {
        const totalWeight = row.unit === 'box' && row.unitWeight 
          ? `${value} ${row.unit} (${(value * row.unitWeight).toFixed(1)}kg)`
          : `${value} ${row.unit}`;
        return (
          <div className="text-right">
            <div className="font-medium">{totalWeight}</div>
            {row.unit === 'box' && row.unitWeight && (
              <div className="text-xs text-muted-foreground">
                {row.unitWeight}kg per box
              </div>
            )}
          </div>
        );
      }
    },
    {
      key: 'reason',
      title: 'Reason',
      searchable: true,
      render: (value) => (
        <div className="max-w-48 truncate" title={value}>
          {value}
        </div>
      )
    },
    {
      key: 'performedBy',
      title: 'Performed By',
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
      key: 'notes',
      title: 'Notes',
      render: (value) => value ? (
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <div className="max-w-32 truncate text-xs text-muted-foreground" title={value}>
            {value}
          </div>
        </div>
      ) : (
        <span className="text-muted-foreground">-</span>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Package className="h-6 w-6 text-blue-600" />
            Stock Report
          </h2>
          <p className="text-muted-foreground mt-1">
            Track inventory movements and stock levels
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <DateFilter value={dateFilter} onChange={onDateFilterChange} />
          
          <Select value={movementTypeFilter} onValueChange={setMovementTypeFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Movements</SelectItem>
              <SelectItem value="in">Stock In</SelectItem>
              <SelectItem value="out">Stock Out</SelectItem>
              <SelectItem value="adjustment">Adjustments</SelectItem>
              <SelectItem value="damaged">Damaged</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>

          <ExportActions
            data={filteredMovements}
            columns={columns}
            filename="stock_report"
            dateRange={dateFilter.customRange || { from: new Date(), to: new Date() }}
            reportType="Stock"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <div>
                <div className="text-sm text-muted-foreground">Total In</div>
                <div className="text-lg font-bold text-green-600">
                  {summary.totalIn.toFixed(1)} kg
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-blue-600" />
              <div>
                <div className="text-sm text-muted-foreground">Total Out</div>
                <div className="text-lg font-bold text-blue-600">
                  {summary.totalOut.toFixed(1)} kg
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              <div>
                <div className="text-sm text-muted-foreground">Current Stock</div>
                <div className="text-lg font-bold">
                  {summary.currentStock.toFixed(1)} kg
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4 text-yellow-600" />
              <div>
                <div className="text-sm text-muted-foreground">Adjustments</div>
                <div className="text-lg font-bold text-yellow-600">
                  {summary.adjustments.toFixed(1)} kg
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-600" />
              <div>
                <div className="text-sm text-muted-foreground">Damaged</div>
                <div className="text-lg font-bold text-red-600">
                  {summary.damaged.toFixed(1)} kg
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <div>
                <div className="text-sm text-muted-foreground">Expired</div>
                <div className="text-lg font-bold text-orange-600">
                  {summary.expired.toFixed(1)} kg
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <DataTable
        data={filteredMovements}
        columns={columns}
        title="Stock Movements"
        searchPlaceholder="Search movements..."
        pageSize={15}
        emptyMessage="No stock movements found for the selected criteria"
      />
    </div>
  );
};

export default StockReport;
