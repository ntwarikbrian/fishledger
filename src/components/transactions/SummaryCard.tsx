import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface SummaryCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: string;
  valueColor?: string;
  loading?: boolean;
  error?: boolean;
}

/**
 * Reusable summary card component for displaying statistics
 * Used across transactions, deposits, and debtors tabs
 */
export const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  value,
  icon: Icon,
  iconColor = "text-blue-600",
  valueColor = "",
  loading = false,
  error = false,
}) => {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className={`text-2xl font-bold ${valueColor}`}>
              {loading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : error ? (
                <span className="text-red-500 text-sm">Error</span>
              ) : (
                value
              )}
            </p>
          </div>
          <Icon className={`h-8 w-8 ${iconColor}`} />
        </div>
      </CardContent>
    </Card>
  );
};
