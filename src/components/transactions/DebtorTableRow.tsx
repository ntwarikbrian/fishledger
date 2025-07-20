import React from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Phone, Mail } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";
import type { Debtor } from "@/types/transaction";

interface DebtorTableRowProps {
  debtor: Debtor;
  index: number;
  onViewSales: (debtor: Debtor) => void;
}

/**
 * Individual debtor table row component
 * Displays debtor details in a table row format with contact actions
 */
export const DebtorTableRow: React.FC<DebtorTableRowProps> = ({
  debtor,
  index,
  onViewSales,
}) => {
  const { formatCurrency } = useCurrency();

  return (
    <TableRow key={`${debtor.clientName}-${index}`}>
      <TableCell>
        <div>
          <p className="font-medium">{debtor.clientName}</p>
          <p className="text-sm text-muted-foreground">
            {debtor.salesCount} sale{debtor.salesCount !== 1 ? 's' : ''}
          </p>
        </div>
      </TableCell>
      <TableCell>
        <div className="space-y-1">
          {debtor.email && (
            <p className="text-sm">{debtor.email}</p>
          )}
          {debtor.phone && (
            <p className="text-sm text-muted-foreground">{debtor.phone}</p>
          )}
          {!debtor.email && !debtor.phone && (
            <p className="text-sm text-muted-foreground">No contact info</p>
          )}
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="outline">
          {debtor.salesCount}
        </Badge>
      </TableCell>
      <TableCell>
        <span className="font-medium">
          {formatCurrency(debtor.totalAmount)}
        </span>
      </TableCell>
      <TableCell>
        <span className="text-green-600 font-medium">
          {formatCurrency(debtor.totalPaid)}
        </span>
      </TableCell>
      <TableCell>
        <span className="text-red-600 font-bold">
          {formatCurrency(debtor.totalOwed)}
        </span>
      </TableCell>
      <TableCell>
        <span className="text-sm text-muted-foreground">
          {new Date(debtor.lastSaleDate).toLocaleDateString()}
        </span>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            title="View Sales Details"
            onClick={() => onViewSales(debtor)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          {debtor.phone && (
            <Button
              variant="ghost"
              size="sm"
              title="Call Customer"
              onClick={() => window.open(`tel:${debtor.phone}`, '_self')}
            >
              <Phone className="h-4 w-4" />
            </Button>
          )}
          {debtor.email && (
            <Button
              variant="ghost"
              size="sm"
              title="Email Customer"
              onClick={() => window.open(`mailto:${debtor.email}?subject=Payment Reminder&body=Dear ${debtor.clientName}, this is a friendly reminder about your outstanding balance of ${formatCurrency(debtor.totalOwed)}.`, '_blank')}
            >
              <Mail className="h-4 w-4" />
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
};
