import React from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, User, Eye } from "lucide-react";
import { formatDateTime, getPaymentMethodInfo, getPaymentStatusInfo } from "@/utils/transaction-helpers";
import { useCurrency } from "@/contexts/CurrencyContext";
import type { Transaction } from "@/types/transaction";

interface TransactionTableRowProps {
  transaction: Transaction;
  onViewTransaction: (transaction: Transaction) => void;
}

/**
 * Individual transaction table row component
 * Displays transaction details in a table row format
 */
export const TransactionTableRow: React.FC<TransactionTableRowProps> = ({
  transaction,
  onViewTransaction,
}) => {
  const { formatCurrency } = useCurrency();
  const { date, time } = formatDateTime(transaction.date_time);
  const paymentMethodInfo = getPaymentMethodInfo(transaction.payment_method);
  const statusInfo = getPaymentStatusInfo(transaction.payment_status);
  const PaymentIcon = paymentMethodInfo.icon;
  const StatusIcon = statusInfo.icon;

  return (
    <TableRow key={transaction.transaction_id}>
      <TableCell className="font-medium">
        {transaction.transaction_id.slice(0, 8)}...
      </TableCell>
      <TableCell>
        <div className="flex flex-col">
          <span className="text-sm">{date}</span>
          <span className="text-xs text-muted-foreground">{time}</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-blue-600" />
          <span className="truncate max-w-[150px]" title={transaction.product_name}>
            {transaction.product_name}
          </span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-gray-600" />
          <span className="truncate max-w-[120px]" title={transaction.client_name}>
            {transaction.client_name}
          </span>
        </div>
      </TableCell>
      <TableCell>
        <div className="text-sm">
          {transaction.boxes_quantity > 0 && (
            <div>{transaction.boxes_quantity} boxes</div>
          )}
          {transaction.kg_quantity > 0 && (
            <div>{transaction.kg_quantity} kg</div>
          )}
        </div>
      </TableCell>
      <TableCell className="font-semibold">
        {formatCurrency(transaction.total_amount)}
      </TableCell>
      <TableCell>
        <Badge variant="secondary" className={paymentMethodInfo.color}>
          <PaymentIcon className="h-3 w-3 mr-1" />
          {paymentMethodInfo.label}
        </Badge>
      </TableCell>
      <TableCell>
        <Badge variant="secondary" className={statusInfo.color}>
          <StatusIcon className="h-3 w-3 mr-1" />
          {statusInfo.label}
        </Badge>
      </TableCell>
      <TableCell>
        <Button
          onClick={() => onViewTransaction(transaction)}
          size="sm"
          variant="outline"
        >
          <Eye className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
};
