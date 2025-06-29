import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingStateProps {
  type?: 'table' | 'cards' | 'chart' | 'full';
  title?: string;
  description?: string;
  className?: string;
}

/**
 * LoadingState Component
 * 
 * A comprehensive loading state component for different types of content
 * in the reports system.
 * 
 * Features:
 * - Multiple loading state types (table, cards, chart, full)
 * - Skeleton placeholders that match actual content
 * - Animated loading indicators
 * - Customizable titles and descriptions
 */
const LoadingState: React.FC<LoadingStateProps> = ({
  type = 'full',
  title = "Loading Report",
  description = "Please wait while we fetch your data...",
  className
}) => {
  // Table loading skeleton
  const renderTableSkeleton = () => (
    <Card className={className}>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-9 w-24" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Table header */}
        <div className="flex gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-4 flex-1" />
          ))}
        </div>
        
        {/* Table rows */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex gap-4">
            {Array.from({ length: 6 }).map((_, j) => (
              <Skeleton key={j} className="h-8 flex-1" />
            ))}
          </div>
        ))}
        
        {/* Pagination */}
        <div className="flex justify-between items-center pt-4">
          <Skeleton className="h-4 w-32" />
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-8" />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Cards loading skeleton
  const renderCardsSkeleton = () => (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4", className)}>
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-5 w-16" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  // Chart loading skeleton
  const renderChartSkeleton = () => (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5" />
          <Skeleton className="h-6 w-32" />
        </div>
        <Skeleton className="h-4 w-48" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-64 flex items-end justify-between gap-2">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton 
              key={i} 
              className="w-full" 
              style={{ height: `${Math.random() * 80 + 20}%` }}
            />
          ))}
        </div>
        <div className="flex justify-between">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-3 w-8" />
          ))}
        </div>
      </CardContent>
    </Card>
  );

  // Full page loading skeleton
  const renderFullSkeleton = () => (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>

      {/* Summary cards */}
      {renderCardsSkeleton()}

      {/* Main content */}
      {renderTableSkeleton()}
    </div>
  );

  // Centered loading with spinner
  const renderSpinnerLoading = () => (
    <Card className={cn("border-dashed", className)}>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <div className="flex items-center gap-3 mb-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <BarChart3 className="h-8 w-8 text-muted-foreground" />
        </div>
        <CardTitle className="text-lg mb-2">{title}</CardTitle>
        <CardDescription className="text-center max-w-md">
          {description}
        </CardDescription>
        
        {/* Progress dots */}
        <div className="flex gap-1 mt-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="w-2 h-2 bg-primary rounded-full animate-pulse"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );

  // Render based on type
  switch (type) {
    case 'table':
      return renderTableSkeleton();
    case 'cards':
      return renderCardsSkeleton();
    case 'chart':
      return renderChartSkeleton();
    case 'full':
      return renderFullSkeleton();
    default:
      return renderSpinnerLoading();
  }
};

export default LoadingState;
