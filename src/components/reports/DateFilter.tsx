import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { format, subDays, subWeeks, subMonths, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { cn } from "@/lib/utils";
import { DateFilterPreset, DateRange, DateFilterState } from "@/pages/Reports";

interface DateFilterProps {
  value: DateFilterState;
  onChange: (filter: DateFilterState) => void;
  className?: string;
}

/**
 * DateFilter Component
 * 
 * A comprehensive date filtering component for reports with preset options
 * and custom date range selection functionality.
 * 
 * Features:
 * - Preset options: Today, This Week, This Month
 * - Custom date range picker
 * - Clear visual indicators for active filters
 * - Responsive design
 */
const DateFilter: React.FC<DateFilterProps> = ({ value, onChange, className }) => {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [tempDateRange, setTempDateRange] = useState<DateRange | undefined>(value.customRange);

  // Get date range based on preset
  const getPresetDateRange = (preset: DateFilterPreset): DateRange => {
    const now = new Date();
    
    switch (preset) {
      case 'today':
        return {
          from: startOfDay(now),
          to: endOfDay(now)
        };
      case 'week':
        return {
          from: startOfWeek(now, { weekStartsOn: 1 }), // Monday start
          to: endOfWeek(now, { weekStartsOn: 1 })
        };
      case 'month':
        return {
          from: startOfMonth(now),
          to: endOfMonth(now)
        };
      case 'custom':
        return value.customRange || {
          from: subDays(now, 7),
          to: now
        };
      default:
        return {
          from: startOfDay(now),
          to: endOfDay(now)
        };
    }
  };

  // Handle preset selection
  const handlePresetChange = (preset: DateFilterPreset) => {
    if (preset === 'custom') {
      setIsCalendarOpen(true);
      onChange({
        preset,
        customRange: tempDateRange || {
          from: subDays(new Date(), 7),
          to: new Date()
        }
      });
    } else {
      onChange({
        preset,
        customRange: undefined
      });
    }
  };

  // Handle custom date range selection
  const handleCustomDateSelect = (range: DateRange | undefined) => {
    if (range?.from && range?.to) {
      setTempDateRange(range);
      onChange({
        preset: 'custom',
        customRange: range
      });
      setIsCalendarOpen(false);
    } else {
      setTempDateRange(range);
    }
  };

  // Clear custom date range
  const clearCustomRange = () => {
    setTempDateRange(undefined);
    onChange({
      preset: 'today',
      customRange: undefined
    });
  };

  // Get current date range for display
  const currentRange = getPresetDateRange(value.preset);
  
  // Format date range for display
  const formatDateRange = (range: DateRange): string => {
    if (value.preset === 'today') {
      return 'Today';
    } else if (value.preset === 'week') {
      return 'This Week';
    } else if (value.preset === 'month') {
      return 'This Month';
    } else {
      return `${format(range.from, 'MMM dd')} - ${format(range.to, 'MMM dd, yyyy')}`;
    }
  };

  return (
    <div className={cn("flex flex-col sm:flex-row gap-3 items-start sm:items-center", className)}>
      {/* Preset Selection */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={value.preset === 'today' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handlePresetChange('today')}
          className="text-xs"
        >
          Today
        </Button>
        <Button
          variant={value.preset === 'week' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handlePresetChange('week')}
          className="text-xs"
        >
          This Week
        </Button>
        <Button
          variant={value.preset === 'month' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handlePresetChange('month')}
          className="text-xs"
        >
          This Month
        </Button>
        
        {/* Custom Date Range Trigger */}
        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant={value.preset === 'custom' ? 'default' : 'outline'}
              size="sm"
              className="text-xs"
            >
              <CalendarIcon className="h-3 w-3 mr-1" />
              Custom
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={tempDateRange}
              onSelect={handleCustomDateSelect}
              numberOfMonths={2}
              className="rounded-md border"
            />
            <div className="p-3 border-t">
              <div className="flex justify-between items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCalendarOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    if (tempDateRange?.from && tempDateRange?.to) {
                      handleCustomDateSelect(tempDateRange);
                    }
                  }}
                  disabled={!tempDateRange?.from || !tempDateRange?.to}
                >
                  Apply
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Current Selection Display */}
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="text-xs">
          {formatDateRange(currentRange)}
        </Badge>
        
        {/* Clear button for custom ranges */}
        {value.preset === 'custom' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearCustomRange}
            className="h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default DateFilter;
