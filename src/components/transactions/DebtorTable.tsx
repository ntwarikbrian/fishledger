import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, Search, CheckCircle2, CreditCard } from "lucide-react";
import { DebtorTableRow } from "./DebtorTableRow";
import type { Debtor } from "@/types/transaction";

interface DebtorTableProps {
  debtors: Debtor[];
  loading: boolean;
  error: string | null;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onMarkAsPaid: () => void;
  onViewSales: (debtor: Debtor) => void;
}

/**
 * Complete debtor table component with search and actions
 * Displays all debtors with outstanding payments
 */
export const DebtorTable: React.FC<DebtorTableProps> = ({
  debtors,
  loading,
  error,
  searchValue,
  onSearchChange,
  onMarkAsPaid,
  onViewSales,
}) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Outstanding Payments
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Customers with unpaid or partially paid sales
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search customers..."
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-8 w-64"
              />
            </div>
            <Button
              variant="default"
              size="sm"
              onClick={onMarkAsPaid}
              className="bg-green-600 hover:bg-green-700"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Mark as Paid
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Sales Count</TableHead>
                <TableHead>Total Amount</TableHead>
                <TableHead>Amount Paid</TableHead>
                <TableHead>Outstanding</TableHead>
                <TableHead>Last Sale</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      Loading debtors...
                    </div>
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-red-600">
                    Error loading debtors: {error}
                  </TableCell>
                </TableRow>
              ) : debtors.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <CheckCircle2 className="h-8 w-8 text-green-500" />
                      <p className="text-muted-foreground">No outstanding payments found</p>
                      <p className="text-sm text-muted-foreground">All customers have paid their bills!</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                debtors.map((debtor, index) => (
                  <DebtorTableRow
                    key={`${debtor.clientName}-${index}`}
                    debtor={debtor}
                    index={index}
                    onViewSales={onViewSales}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
