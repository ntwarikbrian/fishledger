import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreditCard, AlertCircle } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";
import type { Debtor } from "@/types/transaction";

interface MarkAsPaidDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  debtors: Debtor[];
  onMarkAsPaid: (debtorName: string, amountPaid: number) => void;
}

interface PaymentForm {
  selectedDebtor: string;
  amountPaid: string;
}

/**
 * Mark as Paid dialog component
 * Allows marking debtor payments with automatic remaining amount calculation
 */
export const MarkAsPaidDialog: React.FC<MarkAsPaidDialogProps> = ({
  open,
  onOpenChange,
  debtors,
  onMarkAsPaid,
}) => {
  const { formatCurrency } = useCurrency();
  const [form, setForm] = useState<PaymentForm>({
    selectedDebtor: "",
    amountPaid: "",
  });

  // Get selected debtor details
  const selectedDebtorData = debtors.find(d => d.clientName === form.selectedDebtor);
  const remainingAmount = selectedDebtorData ? selectedDebtorData.totalOwed - parseFloat(form.amountPaid || "0") : 0;
  const amountPaidNum = parseFloat(form.amountPaid || "0");

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setForm({
        selectedDebtor: "",
        amountPaid: "",
      });
    }
  }, [open]);

  // Handle form submission
  const handleSubmit = () => {
    if (!form.selectedDebtor || !form.amountPaid || amountPaidNum <= 0) {
      return;
    }

    onMarkAsPaid(form.selectedDebtor, amountPaidNum);
    onOpenChange(false);
  };

  // Handle amount paid change
  const handleAmountChange = (value: string) => {
    // Only allow positive numbers
    const numValue = parseFloat(value);
    if (value === "" || (!isNaN(numValue) && numValue >= 0)) {
      setForm(prev => ({ ...prev, amountPaid: value }));
    }
  };

  // Check if payment amount is valid
  const isValidPayment = selectedDebtorData && amountPaidNum > 0 && amountPaidNum <= selectedDebtorData.totalOwed;
  const isOverpayment = selectedDebtorData && amountPaidNum > selectedDebtorData.totalOwed;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <CreditCard className="h-5 w-5 text-green-600" />
            Mark as Paid
          </DialogTitle>
          <DialogDescription className="text-sm">
            Record payment for outstanding debts
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Debtor Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Select Customer *</Label>
            <Select 
              value={form.selectedDebtor} 
              onValueChange={(value) => setForm(prev => ({ ...prev, selectedDebtor: value, amountPaid: "" }))}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Choose customer..." />
              </SelectTrigger>
              <SelectContent>
                {debtors.map((debtor) => (
                  <SelectItem key={debtor.clientName} value={debtor.clientName}>
                    <div className="flex flex-col">
                      <span className="font-medium">{debtor.clientName}</span>
                      <span className="text-xs text-muted-foreground">
                        Owes: {formatCurrency(debtor.totalOwed)}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Outstanding Amount Display */}
          {selectedDebtorData && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Total Owed:</span>
                  <p className="font-semibold text-red-600">
                    {formatCurrency(selectedDebtorData.totalOwed)}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Sales Count:</span>
                  <p className="font-medium">{selectedDebtorData.salesCount}</p>
                </div>
              </div>
            </div>
          )}

          {/* Amount Paid Input */}
          <div className="space-y-2">
            <Label htmlFor="amountPaid" className="text-sm font-medium">
              Amount Paid *
            </Label>
            <Input
              id="amountPaid"
              type="number"
              placeholder="0.00"
              value={form.amountPaid}
              onChange={(e) => handleAmountChange(e.target.value)}
              className="h-9"
              min="0"
              step="0.01"
              disabled={!selectedDebtorData}
            />
          </div>

          {/* Remaining Amount Display */}
          {selectedDebtorData && form.amountPaid && (
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Remaining Amount:</span>
                <span className={`font-semibold ${remainingAmount === 0 ? 'text-green-600' : remainingAmount < 0 ? 'text-red-600' : 'text-orange-600'}`}>
                  {formatCurrency(Math.max(0, remainingAmount))}
                </span>
              </div>
              {remainingAmount === 0 && (
                <p className="text-xs text-green-600 mt-1">✓ Debt will be fully paid</p>
              )}
            </div>
          )}

          {/* Overpayment Warning */}
          {isOverpayment && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200">
              <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Payment exceeds debt amount by {formatCurrency(amountPaidNum - selectedDebtorData!.totalOwed)}
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1 h-9"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 h-9 bg-green-600 hover:bg-green-700"
              onClick={handleSubmit}
              disabled={!isValidPayment}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Mark Paid
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
