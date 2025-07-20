import React from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Trash2, Image, CheckCircle2, X, Clock } from "lucide-react";
import { getDepositTypeBadge } from "@/utils/transaction-helpers";
import type { Deposit } from "@/hooks/use-deposits";

interface DepositTableRowProps {
  deposit: Deposit;
  onPreview: (deposit: Deposit) => void;
  onDelete: (deposit: Deposit) => void;
  onImageClick: (imageUrl: string) => void;
}

/**
 * Individual deposit table row component
 * Displays deposit details in a table row format
 */
export const DepositTableRow: React.FC<DepositTableRowProps> = ({
  deposit,
  onPreview,
  onDelete,
  onImageClick,
}) => {
  return (
    <TableRow key={deposit.deposit_id}>
      <TableCell>
        <div className="flex flex-col">
          <span className="text-sm">{new Date(deposit.date_time).toLocaleDateString()}</span>
          <span className="text-xs text-muted-foreground">
            {new Date(deposit.date_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-col">
          <span className="font-semibold text-green-600">${deposit.amount.toFixed(2)}</span>
        </div>
      </TableCell>
      <TableCell>{getDepositTypeBadge(deposit.deposit_type)}</TableCell>
      <TableCell>
        <div className="flex flex-col">
          <span className="text-sm font-medium">
            {deposit.deposit_type === 'boss' && deposit.to_recipient
              ? deposit.to_recipient
              : deposit.deposit_type === 'boss'
                ? 'Boss'
                : '-'
            }
          </span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-col">
          <span className="text-sm font-medium">{deposit.account_name}</span>
          <span className="text-xs text-muted-foreground">{deposit.account_number || 'N/A'}</span>
        </div>
      </TableCell>
      <TableCell className="font-mono text-sm">{deposit.deposit_id}</TableCell>
      <TableCell>
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
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          {deposit.deposit_image_url ? (
            <button
              onClick={() => onImageClick(deposit.deposit_image_url!)}
              className="flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
              title="Click to view image"
            >
              <Image className="h-4 w-4" />
              <span className="text-sm">1</span>
            </button>
          ) : (
            <span className="text-xs text-muted-foreground">None</span>
          )}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onPreview(deposit)}
            title="Preview deposit details"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-red-600 hover:text-red-700"
            onClick={() => onDelete(deposit)}
            title="Delete deposit"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};
