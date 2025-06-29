import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReportCategory } from "@/pages/Reports";

interface ReportCardProps {
  category: ReportCategory;
  isActive?: boolean;
  onClick: () => void;
  stats?: {
    value: string;
    label: string;
    trend?: {
      value: number;
      isPositive: boolean;
    };
  };
  className?: string;
}

/**
 * ReportCard Component
 * 
 * A beautiful card component for displaying report categories with icons,
 * descriptions, statistics, and navigation functionality.
 * 
 * Features:
 * - Category icon and description
 * - Optional statistics display with trends
 * - Hover effects and animations
 * - Active state indication
 * - Responsive design
 */
const ReportCard: React.FC<ReportCardProps> = ({ 
  category, 
  isActive = false, 
  onClick, 
  stats,
  className 
}) => {
  const IconComponent = category.icon;

  return (
    <Card 
      className={cn(
        "group cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.02] border-2",
        isActive 
          ? "border-primary shadow-md ring-2 ring-primary/20" 
          : "border-border hover:border-primary/50",
        className
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {/* Icon with background */}
            <div 
              className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center transition-colors duration-300",
                category.bgColor,
                "group-hover:scale-110"
              )}
            >
              <IconComponent 
                className={cn(
                  "h-6 w-6 transition-colors duration-300",
                  category.color
                )} 
              />
            </div>
            
            <div className="flex-1">
              <CardTitle className="text-lg font-semibold group-hover:text-primary transition-colors duration-300">
                {category.title}
              </CardTitle>
              <CardDescription className="text-sm mt-1 line-clamp-2">
                {category.description}
              </CardDescription>
            </div>
          </div>

          {/* Arrow indicator */}
          <ArrowRight 
            className={cn(
              "h-5 w-5 text-muted-foreground transition-all duration-300",
              "group-hover:text-primary group-hover:translate-x-1",
              isActive && "text-primary"
            )} 
          />
        </div>
      </CardHeader>

      {/* Statistics section (optional) */}
      {stats && (
        <CardContent className="pt-0">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-foreground">
                {stats.value}
              </div>
              <div className="text-sm text-muted-foreground">
                {stats.label}
              </div>
            </div>

            {/* Trend indicator */}
            {stats.trend && (
              <div className="flex items-center gap-1">
                {stats.trend.isPositive ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                )}
                <Badge 
                  variant="secondary"
                  className={cn(
                    "text-xs font-medium",
                    stats.trend.isPositive 
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
                      : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  )}
                >
                  {stats.trend.isPositive ? '+' : ''}{stats.trend.value}%
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      )}

      {/* Active indicator */}
      {isActive && (
        <div className="absolute top-2 right-2">
          <div className="w-3 h-3 bg-primary rounded-full animate-pulse" />
        </div>
      )}
    </Card>
  );
};

export default ReportCard;
