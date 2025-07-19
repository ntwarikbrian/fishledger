/**
 * Sales Report Date Picker Component
 * A dedicated popup for selecting date ranges for sales reports
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, X, FileText, Download } from 'lucide-react';
import { toast } from 'sonner';

interface SalesReportDatePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerateReport: (dateFrom: string, dateTo: string) => void;
  isLoading?: boolean;
}

/**
 * Sales Report Date Picker Component
 * 
 * Provides a clean interface for selecting date ranges for sales reports
 * with validation and user-friendly date selection
 */
const SalesReportDatePicker: React.FC<SalesReportDatePickerProps> = ({
  isOpen,
  onClose,
  onGenerateReport,
  isLoading = false
}) => {
  const [selectedRange, setSelectedRange] = useState<'today' | 'week' | 'month' | 'custom'>('today');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];

  /**
   * Reset form when modal opens
   */
  React.useEffect(() => {
    if (isOpen) {
      setSelectedRange('today');
      setDateFrom('');
      setDateTo('');
    }
  }, [isOpen]);

  /**
   * Calculate date range based on selection
   */
  const calculateDateRange = (range: 'today' | 'week' | 'month' | 'custom') => {
    const now = new Date();
    let from: string;
    let to: string = today;

    switch (range) {
      case 'today':
        from = today;
        break;
      case 'week':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
        from = weekStart.toISOString().split('T')[0];
        break;
      case 'month':
        from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        break;
      case 'custom':
        // For custom, we'll use the manually entered dates
        return { from: dateFrom, to: dateTo };
      default:
        from = today;
    }

    return { from, to };
  };

  /**
   * Handle preset range selection
   */
  const handleRangeSelection = (range: 'today' | 'week' | 'month' | 'custom') => {
    setSelectedRange(range);

    if (range !== 'custom') {
      // For preset ranges, generate the report immediately
      const { from, to } = calculateDateRange(range);
      onGenerateReport(from, to);
    }
  };

  /**
   * Handle custom date form submission
   */
  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate date inputs for custom range
    if (!dateFrom || !dateTo) {
      toast.error('Please select both start and end dates');
      return;
    }

    // Validate date range
    if (new Date(dateFrom) > new Date(dateTo)) {
      toast.error('Start date cannot be after end date');
      return;
    }

    // Check if date range is not too far in the future
    if (new Date(dateFrom) > new Date(today)) {
      toast.error('Start date cannot be in the future');
      return;
    }

    // Generate the report
    onGenerateReport(dateFrom, dateTo);
  };

  /**
   * Handle closing the modal and reset form
   */
  const handleClose = () => {
    setSelectedRange('today');
    setDateFrom('');
    setDateTo('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-sm bg-white dark:bg-gray-800 shadow-xl">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Sales Report Date Range
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Select the date range for your sales report
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Date Range Selection Buttons */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Select Date Range</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={selectedRange === 'today' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleRangeSelection('today')}
                disabled={isLoading}
                className="h-10 flex flex-col items-center justify-center text-xs"
              >
                <span className="font-medium">Today</span>
                <span className="text-[10px] opacity-70">{new Date().toLocaleDateString()}</span>
              </Button>

              <Button
                type="button"
                variant={selectedRange === 'week' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleRangeSelection('week')}
                disabled={isLoading}
                className="h-10 flex flex-col items-center justify-center text-xs"
              >
                <span className="font-medium">This Week</span>
                <span className="text-[10px] opacity-70">Last 7 days</span>
              </Button>

              <Button
                type="button"
                variant={selectedRange === 'month' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleRangeSelection('month')}
                disabled={isLoading}
                className="h-10 flex flex-col items-center justify-center text-xs"
              >
                <span className="font-medium">This Month</span>
                <span className="text-[10px] opacity-70">{new Date().toLocaleDateString('en-US', { month: 'long' })}</span>
              </Button>

              <Button
                type="button"
                variant={selectedRange === 'custom' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleRangeSelection('custom')}
                disabled={isLoading}
                className="h-10 flex flex-col items-center justify-center text-xs"
              >
                <span className="font-medium">Custom</span>
                <span className="text-[10px] opacity-70">Pick dates</span>
              </Button>
            </div>
          </div>

          {/* Custom Date Range Form - Only show when Custom is selected */}
          {selectedRange === 'custom' && (
            <form onSubmit={handleCustomSubmit} className="space-y-3">
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="dateFrom" className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    From Date
                  </Label>
                  <Input
                    id="dateFrom"
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    max={today}
                    className="w-full"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateTo" className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    To Date
                  </Label>
                  <Input
                    id="dateTo"
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    max={today}
                    min={dateFrom}
                    className="w-full"
                    required
                  />
                </div>
              </div>

              {/* Action Buttons for Custom Range */}
              <div className="flex gap-2 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1"
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={isLoading || !dateFrom || !dateTo}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Generating...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Download className="h-4 w-4" />
                      Generate Report
                    </div>
                  )}
                </Button>
              </div>

              {/* Date Range Preview for Custom */}
              {dateFrom && dateTo && (
                <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Selected Range:</strong> {new Date(dateFrom).toLocaleDateString()} - {new Date(dateTo).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                    {Math.ceil((new Date(dateTo).getTime() - new Date(dateFrom).getTime()) / (1000 * 60 * 60 * 24)) + 1} days
                  </p>
                </div>
              )}
            </form>
          )}

          {/* Loading State for Preset Ranges */}
          {isLoading && selectedRange !== 'custom' && (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Generating report...</span>
              </div>
            </div>
          )}

          {/* Close Button for Preset Ranges */}
          {selectedRange !== 'custom' && !isLoading && (
            <div className="flex justify-center pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="px-8"
              >
                Close
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SalesReportDatePicker;
