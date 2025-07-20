import React, { useState } from "react";
import { AlertTriangle, DollarSign, TrendingUp, CheckCircle2 } from "lucide-react";
import { SummaryCard } from "./SummaryCard";
import { DebtorTable } from "./DebtorTable";
import { MarkAsPaidDialog } from "./MarkAsPaidDialog";
import { useCurrency } from "@/contexts/CurrencyContext";
import type { Debtor } from "@/types/transaction";

interface DebtorsTabProps {
  // Data
  debtors: Debtor[];

  // State
  loading: boolean;
  error: string | null;
  searchValue: string;

  // Handlers
  onSearchChange: (value: string) => void;
  onMarkAsPaid: (debtorName: string, amountPaid: number) => void;
  onViewSales: (debtor: Debtor) => void;
}

/**
 * Debtors tab content component
 * Contains all debtor-related functionality and UI
 */
export const DebtorsTab: React.FC<DebtorsTabProps> = ({
  debtors,
  loading,
  error,
  searchValue,
  onSearchChange,
  onMarkAsPaid,
  onViewSales,
}) => {
  const { formatCurrency } = useCurrency();
  const [isMarkAsPaidOpen, setIsMarkAsPaidOpen] = useState(false);

  // Calculate summary statistics
  const totalDebtors = debtors.length;
  const totalOutstanding = debtors.reduce((sum, debtor) => sum + debtor.totalOwed, 0);
  const totalSalesValue = debtors.reduce((sum, debtor) => sum + debtor.totalAmount, 0);
  const totalPaid = debtors.reduce((sum, debtor) => sum + debtor.totalPaid, 0);

  return (
    <div className="space-y-6">
      {/* Debtor Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard
          title="Total Debtors"
          value={totalDebtors}
          icon={AlertTriangle}
          iconColor="text-orange-500"
        />
        <SummaryCard
          title="Total Outstanding"
          value={formatCurrency(totalOutstanding)}
          icon={DollarSign}
          iconColor="text-red-500"
          valueColor="text-red-600"
        />
        <SummaryCard
          title="Total Sales Value"
          value={formatCurrency(totalSalesValue)}
          icon={TrendingUp}
          iconColor="text-blue-500"
        />
        <SummaryCard
          title="Amount Paid"
          value={formatCurrency(totalPaid)}
          icon={CheckCircle2}
          iconColor="text-green-500"
          valueColor="text-green-600"
        />
      </div>

      {/* Debtors Table */}
      <DebtorTable
        debtors={debtors}
        loading={loading}
        error={error}
        searchValue={searchValue}
        onSearchChange={onSearchChange}
        onMarkAsPaid={() => setIsMarkAsPaidOpen(true)}
        onViewSales={onViewSales}
      />

      {/* Mark as Paid Dialog */}
      <MarkAsPaidDialog
        open={isMarkAsPaidOpen}
        onOpenChange={setIsMarkAsPaidOpen}
        debtors={debtors}
        onMarkAsPaid={onMarkAsPaid}
      />
    </div>
  );
};
