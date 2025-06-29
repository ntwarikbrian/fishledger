import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  ArrowUp,
  ArrowDown,
  Calendar,
  DollarSign
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PeriodComparison as PeriodComparisonType } from "@/pages/Reports";

interface PeriodComparisonProps {
  title: string;
  description?: string;
  comparison: PeriodComparisonType;
  currentLabel?: string;
  previousLabel?: string;
  format?: 'currency' | 'number' | 'percentage';
  currency?: string;
  className?: string;
  showProgress?: boolean;
  icon?: React.ComponentType<any>;
}

/**
 * PeriodComparison Component
 * 
 * A beautiful component to display period-over-period comparisons with visual
 * indicators, growth percentages, and trend analysis.
 * 
 * Features:
 * - Current vs previous period comparison
 * - Growth percentage calculation with visual indicators
 * - Trend arrows and color coding
 * - Progress bar visualization
 * - Multiple format support (currency, number, percentage)
 * - Customizable labels and styling
 */
const PeriodComparison: React.FC<PeriodComparisonProps> = ({
  title,
  description,
  comparison,
  currentLabel = "Current Period",
  previousLabel = "Previous Period",
  format = 'currency',
  currency = '₣',
  className,
  showProgress = false,
  icon: IconComponent = DollarSign
}) => {
  // Format value based on type
  const formatValue = (value: number): string => {
    switch (format) {
      case 'currency':
        return `${currency}${value.toLocaleString()}`;
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'number':
      default:
        return value.toLocaleString();
    }
  };

  // Get trend color classes
  const getTrendColor = (isPositive: boolean) => {
    return isPositive 
      ? "text-green-600 dark:text-green-400"
      : "text-red-600 dark:text-red-400";
  };

  // Get trend background color classes
  const getTrendBgColor = (isPositive: boolean) => {
    return isPositive
      ? "bg-green-100 dark:bg-green-900/30"
      : "bg-red-100 dark:bg-red-900/30";
  };

  // Get trend icon
  const getTrendIcon = () => {
    if (comparison.growth === 0) {
      return <Minus className="h-4 w-4" />;
    }
    return comparison.isPositive 
      ? <TrendingUp className="h-4 w-4" />
      : <TrendingDown className="h-4 w-4" />;
  };

  // Calculate progress percentage for visualization
  const progressPercentage = comparison.previous > 0 
    ? Math.min((comparison.current / comparison.previous) * 100, 200) // Cap at 200%
    : 100;

  return (
    <Card className={cn("relative overflow-hidden", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <IconComponent className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">{title}</CardTitle>
              {description && (
                <CardDescription className="text-sm mt-1">
                  {description}
                </CardDescription>
              )}
            </div>
          </div>

          {/* Growth badge */}
          <Badge 
            variant="secondary"
            className={cn(
              "gap-1 font-medium",
              getTrendBgColor(comparison.isPositive),
              getTrendColor(comparison.isPositive)
            )}
          >
            {getTrendIcon()}
            {comparison.growth === 0 ? '0%' : `${comparison.isPositive ? '+' : ''}${comparison.growthPercentage.toFixed(1)}%`}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Current Period */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              {currentLabel}
            </span>
            <div className="flex items-center gap-1">
              <ArrowUp className={cn("h-3 w-3", getTrendColor(comparison.isPositive))} />
              <span className="text-xs text-muted-foreground">Current</span>
            </div>
          </div>
          <div className="text-2xl font-bold text-foreground">
            {formatValue(comparison.current)}
          </div>
        </div>

        {/* Progress bar (optional) */}
        {showProgress && (
          <div className="space-y-2">
            <Progress 
              value={progressPercentage} 
              className="h-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0</span>
              <span>{formatValue(comparison.previous * 2)}</span>
            </div>
          </div>
        )}

        {/* Previous Period */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              {previousLabel}
            </span>
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Previous</span>
            </div>
          </div>
          <div className="text-lg font-semibold text-muted-foreground">
            {formatValue(comparison.previous)}
          </div>
        </div>

        {/* Growth Analysis */}
        <div className="pt-3 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Growth</span>
            <div className="flex items-center gap-2">
              <span className={cn("text-sm font-medium", getTrendColor(comparison.isPositive))}>
                {formatValue(Math.abs(comparison.growth))}
              </span>
              {comparison.growth !== 0 && (
                <div className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                  getTrendBgColor(comparison.isPositive),
                  getTrendColor(comparison.isPositive)
                )}>
                  {comparison.isPositive ? (
                    <ArrowUp className="h-3 w-3" />
                  ) : (
                    <ArrowDown className="h-3 w-3" />
                  )}
                  {Math.abs(comparison.growthPercentage).toFixed(1)}%
                </div>
              )}
            </div>
          </div>

          {/* Growth description */}
          <div className="mt-2 text-xs text-muted-foreground">
            {comparison.growth === 0 ? (
              "No change from previous period"
            ) : comparison.isPositive ? (
              `Increased by ${formatValue(comparison.growth)} compared to previous period`
            ) : (
              `Decreased by ${formatValue(Math.abs(comparison.growth))} compared to previous period`
            )}
          </div>
        </div>
      </CardContent>

      {/* Decorative gradient overlay */}
      <div className={cn(
        "absolute top-0 right-0 w-32 h-32 opacity-5 rounded-full blur-3xl",
        comparison.isPositive ? "bg-green-500" : "bg-red-500"
      )} />
    </Card>
  );
};

export default PeriodComparison;
