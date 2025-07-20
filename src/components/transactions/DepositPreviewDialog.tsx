import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Eye, CheckCircle2, X, Clock, ExternalLink } from "lucide-react";
import type { Deposit } from "@/hooks/use-deposits";

interface DepositPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deposit: Deposit | null;
  onImageClick: (imageUrl: string) => void;
}

/**
 * Deposit preview dialog component
 * Displays comprehensive deposit information in a modal
 */
export const DepositPreviewDialog: React.FC<DepositPreviewDialogProps> = ({
  open,
  onOpenChange,
  deposit,
  onImageClick,
}) => {
  if (!deposit) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Deposit Details
          </DialogTitle>
          <DialogDescription>
            View deposit information and status
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Amount</label>
              <p className="text-lg font-semibold text-green-600">${deposit.amount.toFixed(2)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Type</label>
              <p className="text-sm">
                {deposit.deposit_type === 'boss' ? 'TO' : deposit.deposit_type.toUpperCase()}
              </p>
            </div>
          </div>

          {/* Show To field for boss type deposits */}
          {deposit.deposit_type === 'boss' && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">To</label>
              <p className="text-sm">{deposit.to_recipient || 'Boss'}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Account Name</label>
              <p className="text-sm">{deposit.account_name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Account Number</label>
              <p className="text-sm">{deposit.account_number || 'N/A'}</p>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">Date & Time</label>
            <p className="text-sm">{new Date(deposit.date_time).toLocaleString()}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">Approval Status</label>
            <div className="mt-1">
              {deposit.approval === 'approved' ? (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Approved
                </Badge>
              ) : deposit.approval === 'rejected' ? (
                <Badge variant="destructive" className="bg-red-100 text-red-800">
                  <X className="h-3 w-3 mr-1" />
                  Rejected
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                  <Clock className="h-3 w-3 mr-1" />
                  Pending
                </Badge>
              )}
            </div>
          </div>

          {deposit.deposit_image_url && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">Attachment</label>
              <div className="mt-2">
                <img
                  src={deposit.deposit_image_url}
                  alt="Deposit proof"
                  className="w-full h-48 object-cover rounded-lg border cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => onImageClick(deposit.deposit_image_url!)}
                  title="Click to view full size"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-muted-foreground">Deposit ID</label>
            <p className="text-xs font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded">
              {deposit.deposit_id}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
