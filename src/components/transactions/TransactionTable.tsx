import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Receipt, Loader2, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { TransactionTableRow } from "./TransactionTableRow";
import type { Transaction } from "@/types/transaction";

interface TransactionTableProps {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasPrev: boolean;
    hasNext: boolean;
  };
  onViewTransaction: (transaction: Transaction) => void;
  onRefresh: () => void;
  onPageChange: (page: number) => void;
}

/**
 * Complete transaction table component with header, body, and pagination
 * Handles loading states, empty states, and error states
 */
export const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  loading,
  error,
  pagination,
  onViewTransaction,
  onRefresh,
  onPageChange,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5" />
          Transaction History
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {loading ? 'Loading...' : `${transactions.length} transaction(s) found`}
        </p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading transactions...</span>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <Receipt className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">
                          {error ? 'Error loading transactions' : 'No transactions found'}
                        </p>
                        {error && (
                          <Button onClick={onRefresh} variant="outline" size="sm">
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Retry
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((transaction) => (
                    <TransactionTableRow
                      key={transaction.transaction_id}
                      transaction={transaction}
                      onViewTransaction={onViewTransaction}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
              {pagination.total} transactions
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => onPageChange(pagination.page - 1)}
                disabled={!pagination.hasPrev || loading}
                size="sm"
                variant="outline"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <span className="text-sm">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                onClick={() => onPageChange(pagination.page + 1)}
                disabled={!pagination.hasNext || loading}
                size="sm"
                variant="outline"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
