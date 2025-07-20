import React from "react";
import { AlertTriangle } from "lucide-react";
import { SummaryCard } from "./SummaryCard";
import { TransactionFiltersCard } from "./TransactionFilters";
import { TransactionTable } from "./TransactionTable";
import { TransactionDetailDialog } from "./TransactionDetailDialog";
import { Receipt, DollarSign, CheckCircle2, Clock } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";
import type { Transaction, TransactionFilters } from "@/types/transaction";

interface TransactionsTabProps {
  // Data
  transactions: Transaction[];
  totalTransactions: number;
  totalTransactionAmount: number;
  paidTransactions: number;
  pendingTransactions: number;
  
  // State
  loading: boolean;
  error: string | null;
  searchTerm: string;
  filters: TransactionFilters;
  selectedTransaction: Transaction | null;
  showTransactionDetail: boolean;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasPrev: boolean;
    hasNext: boolean;
  };
  
  // Handlers
  onSearchChange: (value: string) => void;
  onFilterChange: (key: keyof TransactionFilters, value: string) => void;
  onSearch: () => void;
  onClearFilters: () => void;
  onViewTransaction: (transaction: Transaction) => void;
  onRefresh: () => void;
  onPageChange: (page: number) => void;
  onTransactionDetailClose: (open: boolean) => void;
}

/**
 * Transactions tab content component
 * Contains all transaction-related functionality and UI
 */
export const TransactionsTab: React.FC<TransactionsTabProps> = ({
  transactions,
  totalTransactions,
  totalTransactionAmount,
  paidTransactions,
  pendingTransactions,
  loading,
  error,
  searchTerm,
  filters,
  selectedTransaction,
  showTransactionDetail,
  pagination,
  onSearchChange,
  onFilterChange,
  onSearch,
  onClearFilters,
  onViewTransaction,
  onRefresh,
  onPageChange,
  onTransactionDetailClose,
}) => {
  const { formatCurrency } = useCurrency();

  return (
    <div className="space-y-6">
      {/* Backend Connection Status */}
      {totalTransactions === 0 && !loading && !error && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
            <div>
              <p className="text-sm font-medium text-yellow-800">
                Backend Connected - No transactions found
              </p>
              <p className="text-xs text-yellow-700">
                The system is working correctly. Add some transactions to see them here.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard
          title="Total Transactions"
          value={totalTransactions}
          icon={Receipt}
          iconColor="text-blue-600"
          loading={loading}
          error={!!error}
        />
        <SummaryCard
          title="Total Amount"
          value={formatCurrency(totalTransactionAmount)}
          icon={DollarSign}
          iconColor="text-green-600"
          loading={loading}
          error={!!error}
        />
        <SummaryCard
          title="Paid Transactions"
          value={paidTransactions}
          icon={CheckCircle2}
          iconColor="text-green-600"
          loading={loading}
          error={!!error}
        />
        <SummaryCard
          title="Pending Transactions"
          value={pendingTransactions}
          icon={Clock}
          iconColor="text-yellow-600"
          loading={loading}
          error={!!error}
        />
      </div>

      {/* Filters and Search */}
      <TransactionFiltersCard
        searchTerm={searchTerm}
        filters={filters}
        loading={loading}
        onSearchChange={onSearchChange}
        onFilterChange={onFilterChange}
        onSearch={onSearch}
        onClearFilters={onClearFilters}
      />

      {/* Transactions Table */}
      <TransactionTable
        transactions={transactions}
        loading={loading}
        error={error}
        pagination={pagination}
        onViewTransaction={onViewTransaction}
        onRefresh={onRefresh}
        onPageChange={onPageChange}
      />

      {/* Transaction Detail Dialog */}
      <TransactionDetailDialog
        open={showTransactionDetail}
        onOpenChange={onTransactionDetailClose}
        transaction={selectedTransaction}
      />
    </div>
  );
};
