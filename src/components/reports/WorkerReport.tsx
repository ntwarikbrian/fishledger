import React, { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Users, 
  User, 
  DollarSign, 
  Clock,
  CheckCircle,
  Target,
  TrendingUp,
  Award,
  Calendar,
  Activity,
  Star
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import DataTable, { DataTableColumn } from "./DataTable";
import ExportActions from "./ExportActions";
import DateFilter from "./DateFilter";
import { WorkerPerformance, WorkerReportData, DateFilterState } from "@/pages/Reports";

interface WorkerReportProps {
  dateFilter: DateFilterState;
  onDateFilterChange: (filter: DateFilterState) => void;
}

/**
 * WorkerReport Component
 * 
 * Comprehensive worker report showing performance tracking, individual sales
 * metrics, and work schedule data.
 * 
 * Features:
 * - Worker performance tracking
 * - Sales metrics per worker
 * - Task completion rates
 * - Working hours analysis
 * - Performance scoring
 * - Export functionality
 */
const WorkerReport: React.FC<WorkerReportProps> = ({ dateFilter, onDateFilterChange }) => {
  const [performanceFilter, setPerformanceFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("revenue");

  // Mock data for worker performance
  const mockWorkerData: WorkerPerformance[] = [
    {
      id: "WP001",
      workerId: "W001",
      workerName: "John Smith",
      workerEmail: "john.smith@fishsales.com",
      totalSales: 45,
      totalRevenue: 12500.75,
      averageSaleValue: 277.79,
      workingDays: 22,
      hoursWorked: 176,
      tasksCompleted: 18,
      tasksAssigned: 20,
      performanceScore: 92,
      lastActive: "2024-01-22"
    },
    {
      id: "WP002",
      workerId: "W002",
      workerName: "Maria Rodriguez",
      workerEmail: "maria.rodriguez@fishsales.com",
      totalSales: 38,
      totalRevenue: 9850.25,
      averageSaleValue: 259.22,
      workingDays: 20,
      hoursWorked: 160,
      tasksCompleted: 15,
      tasksAssigned: 17,
      performanceScore: 88,
      lastActive: "2024-01-22"
    },
    {
      id: "WP003",
      workerId: "W003",
      workerName: "David Chen",
      workerEmail: "david.chen@fishsales.com",
      totalSales: 32,
      totalRevenue: 8200.50,
      averageSaleValue: 256.27,
      workingDays: 21,
      hoursWorked: 168,
      tasksCompleted: 12,
      tasksAssigned: 15,
      performanceScore: 80,
      lastActive: "2024-01-21"
    },
    {
      id: "WP004",
      workerId: "W004",
      workerName: "Sarah Johnson",
      workerEmail: "sarah.johnson@fishsales.com",
      totalSales: 28,
      totalRevenue: 7100.00,
      averageSaleValue: 253.57,
      workingDays: 18,
      hoursWorked: 144,
      tasksCompleted: 10,
      tasksAssigned: 12,
      performanceScore: 83,
      lastActive: "2024-01-20"
    },
    {
      id: "WP005",
      workerId: "W005",
      workerName: "Michael Brown",
      workerEmail: "michael.brown@fishsales.com",
      totalSales: 22,
      totalRevenue: 5500.25,
      averageSaleValue: 250.01,
      workingDays: 15,
      hoursWorked: 120,
      tasksCompleted: 8,
      tasksAssigned: 10,
      performanceScore: 75,
      lastActive: "2024-01-19"
    }
  ];

  // Filter and sort workers
  const filteredWorkers = useMemo(() => {
    let filtered = mockWorkerData;

    // Filter by performance level
    if (performanceFilter !== "all") {
      switch (performanceFilter) {
        case "excellent":
          filtered = filtered.filter(worker => worker.performanceScore >= 90);
          break;
        case "good":
          filtered = filtered.filter(worker => worker.performanceScore >= 80 && worker.performanceScore < 90);
          break;
        case "average":
          filtered = filtered.filter(worker => worker.performanceScore >= 70 && worker.performanceScore < 80);
          break;
        case "needs-improvement":
          filtered = filtered.filter(worker => worker.performanceScore < 70);
          break;
      }
    }

    // Sort by selected criteria
    switch (sortBy) {
      case "revenue":
        filtered.sort((a, b) => b.totalRevenue - a.totalRevenue);
        break;
      case "sales":
        filtered.sort((a, b) => b.totalSales - a.totalSales);
        break;
      case "performance":
        filtered.sort((a, b) => b.performanceScore - a.performanceScore);
        break;
      case "hours":
        filtered.sort((a, b) => b.hoursWorked - a.hoursWorked);
        break;
      case "name":
        filtered.sort((a, b) => a.workerName.localeCompare(b.workerName));
        break;
    }

    return filtered;
  }, [mockWorkerData, performanceFilter, sortBy]);

  // Calculate summary statistics
  const summary = useMemo(() => {
    const stats = {
      totalWorkers: mockWorkerData.length,
      activeWorkers: mockWorkerData.filter(w => 
        new Date(w.lastActive) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      ).length,
      averagePerformance: mockWorkerData.reduce((sum, w) => sum + w.performanceScore, 0) / mockWorkerData.length,
      topPerformer: mockWorkerData.sort((a, b) => b.performanceScore - a.performanceScore)[0]?.workerName || "N/A",
      totalHoursWorked: mockWorkerData.reduce((sum, w) => sum + w.hoursWorked, 0)
    };

    return stats;
  }, [mockWorkerData]);

  // Get performance level display
  const getPerformanceLevel = (score: number) => {
    if (score >= 90) {
      return {
        label: "Excellent",
        color: "text-green-600",
        bgColor: "bg-green-100 dark:bg-green-900/30",
        icon: Star
      };
    } else if (score >= 80) {
      return {
        label: "Good",
        color: "text-blue-600",
        bgColor: "bg-blue-100 dark:bg-blue-900/30",
        icon: TrendingUp
      };
    } else if (score >= 70) {
      return {
        label: "Average",
        color: "text-yellow-600",
        bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
        icon: Target
      };
    } else {
      return {
        label: "Needs Improvement",
        color: "text-red-600",
        bgColor: "bg-red-100 dark:bg-red-900/30",
        icon: Activity
      };
    }
  };

  // Define table columns
  const columns: DataTableColumn<WorkerPerformance>[] = [
    {
      key: 'workerName',
      title: 'Worker',
      sortable: true,
      searchable: true,
      render: (value, row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
            <User className="h-4 w-4 text-primary" />
          </div>
          <div>
            <div className="font-medium">{value}</div>
            <div className="text-xs text-muted-foreground">{row.workerEmail}</div>
          </div>
        </div>
      )
    },
    {
      key: 'totalSales',
      title: 'Sales Count',
      sortable: true,
      render: (value) => (
        <div className="text-center">
          <div className="text-lg font-bold">{value}</div>
          <div className="text-xs text-muted-foreground">transactions</div>
        </div>
      )
    },
    {
      key: 'totalRevenue',
      title: 'Revenue',
      sortable: true,
      render: (value) => (
        <div className="text-right">
          <div className="text-lg font-bold text-green-600">
            ₣{value.toLocaleString()}
          </div>
        </div>
      )
    },
    {
      key: 'averageSaleValue',
      title: 'Avg Sale',
      sortable: true,
      render: (value) => (
        <div className="text-right">
          <div className="font-medium">₣{value.toFixed(0)}</div>
        </div>
      )
    },
    {
      key: 'hoursWorked',
      title: 'Hours',
      sortable: true,
      render: (value, row) => (
        <div className="text-center">
          <div className="font-medium">{value}h</div>
          <div className="text-xs text-muted-foreground">
            {row.workingDays} days
          </div>
        </div>
      )
    },
    {
      key: 'tasksCompleted',
      title: 'Tasks',
      sortable: true,
      render: (value, row) => {
        const completionRate = (value / row.tasksAssigned) * 100;
        return (
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>{value}/{row.tasksAssigned}</span>
              <span className="text-muted-foreground">{completionRate.toFixed(0)}%</span>
            </div>
            <Progress value={completionRate} className="h-1" />
          </div>
        );
      }
    },
    {
      key: 'performanceScore',
      title: 'Performance',
      sortable: true,
      render: (value) => {
        const level = getPerformanceLevel(value);
        const IconComponent = level.icon;
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className={cn(level.bgColor, level.color)}>
                <IconComponent className="h-3 w-3 mr-1" />
                {value}%
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground">{level.label}</div>
          </div>
        );
      }
    },
    {
      key: 'lastActive',
      title: 'Last Active',
      sortable: true,
      render: (value) => (
        <div className="text-sm text-muted-foreground">
          {format(new Date(value), 'MMM dd, yyyy')}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-blue-600" />
            Worker Report
          </h2>
          <p className="text-muted-foreground mt-1">
            Performance tracking and individual metrics
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <DateFilter value={dateFilter} onChange={onDateFilterChange} />
          
          <Select value={performanceFilter} onValueChange={setPerformanceFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by performance" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Performance</SelectItem>
              <SelectItem value="excellent">Excellent (90%+)</SelectItem>
              <SelectItem value="good">Good (80-89%)</SelectItem>
              <SelectItem value="average">Average (70-79%)</SelectItem>
              <SelectItem value="needs-improvement">Needs Improvement (&lt;70%)</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="revenue">Revenue</SelectItem>
              <SelectItem value="sales">Sales Count</SelectItem>
              <SelectItem value="performance">Performance</SelectItem>
              <SelectItem value="hours">Hours Worked</SelectItem>
              <SelectItem value="name">Name</SelectItem>
            </SelectContent>
          </Select>

          <ExportActions
            data={filteredWorkers}
            columns={columns}
            filename="worker_report"
            dateRange={dateFilter.customRange || { from: new Date(), to: new Date() }}
            reportType="Worker"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              <div>
                <div className="text-sm text-muted-foreground">Total Workers</div>
                <div className="text-lg font-bold text-blue-600">
                  {summary.totalWorkers}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-green-600" />
              <div>
                <div className="text-sm text-muted-foreground">Active Workers</div>
                <div className="text-lg font-bold text-green-600">
                  {summary.activeWorkers}
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
                <div className="text-sm text-muted-foreground">Avg Performance</div>
                <div className="text-lg font-bold text-purple-600">
                  {summary.averagePerformance.toFixed(1)}%
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-orange-600" />
              <div>
                <div className="text-sm text-muted-foreground">Top Performer</div>
                <div className="text-sm font-bold text-orange-600 truncate">
                  {summary.topPerformer}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-indigo-600" />
              <div>
                <div className="text-sm text-muted-foreground">Total Hours</div>
                <div className="text-lg font-bold text-indigo-600">
                  {summary.totalHoursWorked}h
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <DataTable
        data={filteredWorkers}
        columns={columns}
        title="Worker Performance"
        searchPlaceholder="Search workers..."
        pageSize={10}
        emptyMessage="No workers found for the selected criteria"
      />
    </div>
  );
};

export default WorkerReport;
