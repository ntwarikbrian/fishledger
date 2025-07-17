/**
 * Report Filters Component
 * Provides filtering options for different report types
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar, Filter, X } from 'lucide-react';
import { ReportFilters as IReportFilters, ReportType } from '@/services/reports';

interface ReportFiltersProps {
  reportType: ReportType;
  onApplyFilters: (filters: IReportFilters) => void;
  onClose: () => void;
  isOpen: boolean;
}

const ReportFilters: React.FC<ReportFiltersProps> = ({
  reportType,
  onApplyFilters,
  onClose,
  isOpen
}) => {
  const [filters, setFilters] = useState<IReportFilters>({});

  // Get default date range (last 30 days)
  const getDefaultDateRange = () => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    return {
      dateFrom: thirtyDaysAgo.toISOString().split('T')[0],
      dateTo: today.toISOString().split('T')[0]
    };
  };

  // Initialize filters with default values for reports that require dates
  React.useEffect(() => {
    if (reportType === 'financial' || reportType === 'transactions') {
      setFilters(getDefaultDateRange());
    } else {
      setFilters({});
    }
  }, [reportType]);

  const handleFilterChange = (key: keyof IReportFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleApply = () => {
    onApplyFilters(filters);
    onClose();
  };

  const handleReset = () => {
    if (reportType === 'financial' || reportType === 'transactions') {
      setFilters(getDefaultDateRange());
    } else {
      setFilters({});
    }
  };

  if (!isOpen) return null;

  const renderDateFilters = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="dateFrom">From Date</Label>
        <Input
          id="dateFrom"
          type="date"
          value={filters.dateFrom || ''}
          onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
          className="w-full"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="dateTo">To Date</Label>
        <Input
          id="dateTo"
          type="date"
          value={filters.dateTo || ''}
          onChange={(e) => handleFilterChange('dateTo', e.target.value)}
          className="w-full"
        />
      </div>
    </div>
  );

  const renderPaymentFilters = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="paymentMethod">Payment Method</Label>
        <Select
          value={filters.paymentMethod || ''}
          onValueChange={(value) => handleFilterChange('paymentMethod', value || undefined)}
        >
          <SelectTrigger>
            <SelectValue placeholder="All payment methods" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All payment methods</SelectItem>
            <SelectItem value="cash">Cash</SelectItem>
            <SelectItem value="card">Card</SelectItem>
            <SelectItem value="transfer">Transfer</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="paymentStatus">Payment Status</Label>
        <Select
          value={filters.paymentStatus || ''}
          onValueChange={(value) => handleFilterChange('paymentStatus', value || undefined)}
        >
          <SelectTrigger>
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="refunded">Refunded</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const renderStockFilters = () => (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Checkbox
          id="lowStockOnly"
          checked={filters.lowStockOnly || false}
          onCheckedChange={(checked) => handleFilterChange('lowStockOnly', checked)}
        />
        <Label htmlFor="lowStockOnly">Show only low stock items</Label>
      </div>
    </div>
  );

  const renderTransactionFilters = () => (
    <div className="space-y-2">
      <Label htmlFor="transactionType">Transaction Type</Label>
      <Select
        value={filters.type || ''}
        onValueChange={(value) => handleFilterChange('type', value || undefined)}
      >
        <SelectTrigger>
          <SelectValue placeholder="All transaction types" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">All transaction types</SelectItem>
          <SelectItem value="sale">Sales</SelectItem>
          <SelectItem value="expense">Expenses</SelectItem>
          <SelectItem value="deposit">Deposits</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <CardTitle>Filter {reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Date filters - shown for most reports */}
          {reportType !== 'stock' && (
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Date Range
                {(reportType === 'financial' || reportType === 'transactions') && (
                  <span className="text-red-500">*</span>
                )}
              </Label>
              {renderDateFilters()}
            </div>
          )}

          {/* Report-specific filters */}
          {reportType === 'stock' && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Stock Options</Label>
              {renderStockFilters()}
            </div>
          )}

          {reportType === 'sales' && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Payment Filters</Label>
              {renderPaymentFilters()}
            </div>
          )}

          {reportType === 'transactions' && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Transaction Filters</Label>
              {renderTransactionFilters()}
            </div>
          )}

          {/* Required fields notice */}
          {(reportType === 'financial' || reportType === 'transactions') && (
            <div className="text-sm text-muted-foreground bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
              <span className="text-red-500">*</span> Date range is required for {reportType} reports
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleReset}
              className="flex-1"
            >
              Reset Filters
            </Button>
            <Button
              onClick={handleApply}
              className="flex-1"
              disabled={
                (reportType === 'financial' || reportType === 'transactions') &&
                (!filters.dateFrom || !filters.dateTo)
              }
            >
              Apply Filters
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportFilters;
