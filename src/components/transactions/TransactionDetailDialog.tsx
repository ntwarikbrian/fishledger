import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Receipt } from "lucide-react";
import { formatDateTime, getPaymentMethodInfo, getPaymentStatusInfo } from "@/utils/transaction-helpers";
import { useCurrency } from "@/contexts/CurrencyContext";
import type { Transaction } from "@/types/transaction";

interface TransactionDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: Transaction | null;
}

/**
 * Transaction detail dialog component
 * Displays comprehensive transaction information in a modal
 */
export const TransactionDetailDialog: React.FC<TransactionDetailDialogProps> = ({
  open,
  onOpenChange,
  transaction,
}) => {
  const { formatCurrency } = useCurrency();

  if (!transaction) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Transaction Details
          </DialogTitle>
          <DialogDescription>
            Comprehensive transaction information and details
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Transaction ID</Label>
              <p className="text-sm font-mono">{transaction.transaction_id}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Date & Time</Label>
              <p className="text-sm">{formatDateTime(transaction.date_time).date} at {formatDateTime(transaction.date_time).time}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Product</Label>
              <p className="text-sm">{transaction.product_name}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Client</Label>
              <p className="text-sm">{transaction.client_name}</p>
            </div>
          </div>

          <Separator />

          {/* Quantity and Amount */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Boxes</Label>
              <p className="text-sm">{transaction.boxes_quantity}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Kilograms</Label>
              <p className="text-sm">{transaction.kg_quantity}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Total Amount</Label>
              <p className="text-lg font-semibold">{formatCurrency(transaction.total_amount)}</p>
            </div>
          </div>

          <Separator />

          {/* Payment Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Payment Status</Label>
              <div className="mt-1">
                {(() => {
                  const statusInfo = getPaymentStatusInfo(transaction.payment_status);
                  const StatusIcon = statusInfo.icon;
                  return (
                    <Badge variant="secondary" className={statusInfo.color}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {statusInfo.label}
                    </Badge>
                  );
                })()}
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Payment Method</Label>
              <div className="mt-1">
                {transaction.payment_method && (() => {
                  const methodInfo = getPaymentMethodInfo(transaction.payment_method);
                  const MethodIcon = methodInfo.icon;
                  return (
                    <Badge variant="secondary" className={methodInfo.color}>
                      <MethodIcon className="h-3 w-3 mr-1" />
                      {methodInfo.label}
                    </Badge>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Additional Information */}
          {(transaction.deposit_id || transaction.account_number || transaction.reference) && (
            <>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                {transaction.deposit_id && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Deposit ID</Label>
                    <p className="text-sm font-mono">{transaction.deposit_id}</p>
                  </div>
                )}
                {transaction.account_number && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Account Number</Label>
                    <p className="text-sm">{transaction.account_number}</p>
                  </div>
                )}
                {transaction.reference && (
                  <div className="col-span-2">
                    <Label className="text-sm font-medium text-muted-foreground">Reference</Label>
                    <p className="text-sm">{transaction.reference}</p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Receipt Image */}
          {transaction.image_url && (
            <>
              <Separator />
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Receipt Image</Label>
                <div className="mt-2">
                  <img
                    src={transaction.image_url}
                    alt="Transaction receipt"
                    className="max-w-full h-auto rounded-lg border"
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
