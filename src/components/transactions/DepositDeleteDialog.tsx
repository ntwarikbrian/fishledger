import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2, AlertTriangle } from "lucide-react";
import type { Deposit } from "@/hooks/use-deposits";

interface DepositDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deposit: Deposit | null;
  onConfirmDelete: () => void;
}

/**
 * Deposit delete confirmation dialog component
 * Provides confirmation dialog for deleting deposits
 */
export const DepositDeleteDialog: React.FC<DepositDeleteDialogProps> = ({
  open,
  onOpenChange,
  deposit,
  onConfirmDelete,
}) => {
  if (!deposit) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <Trash2 className="h-5 w-5" />
            Delete Deposit
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this deposit? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
            <div className="flex items-center gap-2 text-red-800 dark:text-red-200 mb-2">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium">Deposit to be deleted:</span>
            </div>
            <div className="text-sm space-y-1">
              <p><strong>Amount:</strong> ${deposit.amount.toFixed(2)}</p>
              <p><strong>Type:</strong> {deposit.deposit_type.toUpperCase()}</p>
              <p><strong>Account:</strong> {deposit.account_name}</p>
              <p><strong>Date:</strong> {new Date(deposit.date_time).toLocaleDateString()}</p>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={onConfirmDelete}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
