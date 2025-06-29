import React, { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  TrendingUp, 
  DollarSign, 
  Receipt,
  Calculator,
  BarChart3,
  PieChart,
  Target,
  AlertTriangle,
  CheckCircle
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import DataTable, { DataTableColumn } from "./DataTable";
import ExportActions from "./ExportActions";
import DateFilter from "./DateFilter";
import PeriodComparison from "./PeriodComparison";
import { ProfitCalculation, ProfitReportData, DateFilterState, PeriodComparison as PeriodComparisonType } from "@/pages/Reports";

interface ProfitReportProps {
  dateFilter: DateFilterState;
  onDateFilterChange: (filter: DateFilterState) => void;
}

/**
 * ProfitReport Component
 * 
 * Comprehensive profit report showing profit analysis with daily/weekly/monthly
 * calculations (Revenue - Cost - Expenses).
 * 
 * Features:
 * - Profit calculation breakdown
 * - Period-over-period comparison
 * - Profit margin analysis
 * - Revenue vs cost analysis
 * - Export functionality
 */
const ProfitReport: React.FC<ProfitReportProps> = ({ dateFilter, onDateFilterChange }) => {
  const [groupBy, setGroupBy] = useState<string>("daily");

  // Mock data for profit calculations
  const mockProfitData: ProfitCalculation[] = [
    {
      date: "2024-01-22",
      revenue: 1850.75,
      costOfGoods: 1200.50,
      operatingExpenses: 320.25,
      grossProfit: 650.25,
      netProfit: 330.00,
      profitMargin: 17.84
    },
    {
      date: "2024-01-21",
      revenue: 2100.25,
      costOfGoods: 1350.00,
      operatingExpenses: 280.50,
      grossProfit: 750.25,
      netProfit: 469.75,
      profitMargin: 22.37
    },
    {
      date: "2024-01-20",
      revenue: 1650.00,
      costOfGoods: 1050.75,
      operatingExpenses: 195.00,
      grossProfit: 599.25,
      netProfit: 404.25,
      profitMargin: 24.50
    },
    {
      date: "2024-01-19",
      revenue: 2250.50,
      costOfGoods: 1480.25,
      operatingExpenses: 350.75,
      grossProfit: 770.25,
      netProfit: 419.50,
      profitMargin: 18.64
    },
    {
      date: "2024-01-18",
      revenue: 1950.75,
      costOfGoods: 1280.50,
      operatingExpenses: 290.25,
      grossProfit: 670.25,
      netProfit: 380.00,
      profitMargin: 19.49
    },
    {
      date: "2024-01-17",
      revenue: 1750.25,
      costOfGoods: 1150.00,
      operatingExpenses: 245.50,
      grossProfit: 600.25,
      netProfit: 354.75,
      profitMargin: 20.27
    },
    {
      date: "2024-01-16",
      revenue: 2050.00,
      costOfGoods: 1320.75,
      operatingExpenses: 310.00,
      grossProfit: 729.25,
      netProfit: 419.25,
      profitMargin: 20.45
    }
  ];

  // Group data based on selected period
  const groupedData = useMemo(() => {
    // For this demo, we'll return daily data
    // In a real implementation, you'd group by week/month
    return mockProfitData;
  }, [mockProfitData, groupBy]);

  // Calculate summary statistics
  const summary = useMemo(() => {
    const stats = {
      totalRevenue: 0,
      totalCosts: 0,
      totalExpenses: 0,
      grossProfit: 0,
      netProfit: 0,
      averageProfitMargin: 0
    };

    groupedData.forEach(item => {
      stats.totalRevenue += item.revenue;
      stats.totalCosts += item.costOfGoods;
      stats.totalExpenses += item.operatingExpenses;
      stats.grossProfit += item.grossProfit;
      stats.netProfit += item.netProfit;
    });

    stats.averageProfitMargin = groupedData.length > 0 
      ? groupedData.reduce((sum, item) => sum + item.profitMargin, 0) / groupedData.length 
      : 0;

    return stats;
  }, [groupedData]);

  // Mock period comparison data
  const periodComparison: PeriodComparisonType = {
    current: summary.netProfit,
    previous: 2100.50, // Mock previous period
    growth: summary.netProfit - 2100.50,
    growthPercentage: ((summary.netProfit - 2100.50) / 2100.50) * 100,
    isPositive: summary.netProfit > 2100.50
  };

  // Get profit margin status
  const getProfitMarginStatus = (margin: number) => {
    if (margin >= 25) {
      return {
        icon: CheckCircle,
        label: 'Excellent',
        color: 'text-green-600',
        bgColor: 'bg-green-100 dark:bg-green-900/30'
      };
    } else if (margin >= 15) {
      return {
        icon: Target,
        label: 'Good',
        color: 'text-blue-600',
        bgColor: 'bg-blue-100 dark:bg-blue-900/30'
      };
    } else if (margin >= 5) {
      return {
        icon: AlertTriangle,
        label: 'Fair',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-100 dark:bg-yellow-900/30'
      };
    } else {
      return {
        icon: AlertTriangle,
        label: 'Poor',
        color: 'text-red-600',
        bgColor: 'bg-red-100 dark:bg-red-900/30'
      };
    }
  };

  // Define table columns
  const columns: DataTableColumn<ProfitCalculation>[] = [
    {
      key: 'date',
      title: 'Date',
      sortable: true,
      render: (value) => format(new Date(value), 'MMM dd, yyyy')
    },
    {
      key: 'revenue',
      title: 'Revenue',
      sortable: true,
      render: (value) => (
        <div className="text-right font-medium text-green-600">
          ₣{value.toLocaleString()}
        </div>
      )
    },
    {
      key: 'costOfGoods',
      title: 'Cost of Goods',
      sortable: true,
      render: (value) => (
        <div className="text-right font-medium text-orange-600">
          ₣{value.toLocaleString()}
        </div>
      )
    },
    {
      key: 'operatingExpenses',
      title: 'Operating Expenses',
      sortable: true,
      render: (value) => (
        <div className="text-right font-medium text-red-600">
          ₣{value.toLocaleString()}
        </div>
      )
    },
    {
      key: 'grossProfit',
      title: 'Gross Profit',
      sortable: true,
      render: (value) => (
        <div className="text-right font-bold text-blue-600">
          ₣{value.toLocaleString()}
        </div>
      )
    },
    {
      key: 'netProfit',
      title: 'Net Profit',
      sortable: true,
      render: (value) => (
        <div className="text-right font-bold text-primary">
          ₣{value.toLocaleString()}
        </div>
      )
    },
    {
      key: 'profitMargin',
      title: 'Profit Margin',
      sortable: true,
      render: (value) => {
        const status = getProfitMarginStatus(value);
        const IconComponent = status.icon;
        return (
          <div className="flex items-center justify-end gap-2">
            <Badge variant="secondary" className={cn(status.bgColor, status.color)}>
              <IconComponent className="h-3 w-3 mr-1" />
              {value.toFixed(1)}%
            </Badge>
          </div>
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
            <BarChart3 className="h-6 w-6 text-green-600" />
            Profit Report
          </h2>
          <p className="text-muted-foreground mt-1">
            Comprehensive profit analysis and margin tracking
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <DateFilter value={dateFilter} onChange={onDateFilterChange} />
          
          <Select value={groupBy} onValueChange={setGroupBy}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Group by period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>

          <ExportActions
            data={groupedData}
            columns={columns}
            filename="profit_report"
            dateRange={dateFilter.customRange || { from: new Date(), to: new Date() }}
            reportType="Profit"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
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
              <Receipt className="h-4 w-4 text-orange-600" />
              <div>
                <div className="text-sm text-muted-foreground">Total Costs</div>
                <div className="text-lg font-bold text-orange-600">
                  ₣{summary.totalCosts.toLocaleString()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calculator className="h-4 w-4 text-red-600" />
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
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <div>
                <div className="text-sm text-muted-foreground">Gross Profit</div>
                <div className="text-lg font-bold text-blue-600">
                  ₣{summary.grossProfit.toLocaleString()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              <div>
                <div className="text-sm text-muted-foreground">Net Profit</div>
                <div className="text-lg font-bold text-primary">
                  ₣{summary.netProfit.toLocaleString()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-purple-600" />
              <div>
                <div className="text-sm text-muted-foreground">Avg Margin</div>
                <div className="text-lg font-bold text-purple-600">
                  {summary.averageProfitMargin.toFixed(1)}%
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Period Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PeriodComparison
          title="Net Profit Comparison"
          description="Current period vs previous period"
          comparison={periodComparison}
          currentLabel="This Period"
          previousLabel="Previous Period"
          format="currency"
          currency="₣"
          showProgress={true}
          icon={BarChart3}
        />

        {/* Profit Breakdown Chart Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-blue-600" />
              Profit Breakdown
            </CardTitle>
            <CardDescription>
              Revenue, costs, and profit distribution
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Revenue</span>
                <span className="font-medium text-green-600">
                  ₣{summary.totalRevenue.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Cost of Goods</span>
                <span className="font-medium text-orange-600">
                  -₣{summary.totalCosts.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Operating Expenses</span>
                <span className="font-medium text-red-600">
                  -₣{summary.totalExpenses.toLocaleString()}
                </span>
              </div>
              <div className="border-t pt-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Net Profit</span>
                  <span className="font-bold text-primary">
                    ₣{summary.netProfit.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <DataTable
        data={groupedData}
        columns={columns}
        title="Profit Analysis"
        searchPlaceholder="Search profit data..."
        pageSize={15}
        emptyMessage="No profit data found for the selected criteria"
      />
    </div>
  );
};

export default ProfitReport;
