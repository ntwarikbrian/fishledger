import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Banknote, Plus } from "lucide-react";
import { DepositTableRow } from "./DepositTableRow";
import type { Deposit } from "@/hooks/use-deposits";

interface DepositTableProps {
  deposits: Deposit[];
  onPreview: (deposit: Deposit) => void;
  onDelete: (deposit: Deposit) => void;
  onImageClick: (imageUrl: string) => void;
  addDepositDialog: React.ReactNode;
  isAddDepositOpen: boolean;
  onAddDepositOpenChange: (open: boolean) => void;
}

/**
 * Complete deposit table component with header and actions
 * Displays all deposits in a table format with management actions
 */
export const DepositTable: React.FC<DepositTableProps> = ({
  deposits,
  onPreview,
  onDelete,
  onImageClick,
  addDepositDialog,
  isAddDepositOpen,
  onAddDepositOpenChange,
}) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Banknote className="h-5 w-5" />
              Cash Deposit History
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {deposits.length} deposit(s) found
            </p>
          </div>
          <Dialog open={isAddDepositOpen} onOpenChange={onAddDepositOpenChange}>
            <DialogTrigger asChild>
              <Button size="sm" className="flex items-center gap-2 bg-green-600 hover:bg-green-700">
                <Plus className="h-3 w-3" />
                Add Deposit
              </Button>
            </DialogTrigger>
            {addDepositDialog}
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date & Time</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Deposit ID</TableHead>
                <TableHead>Approval</TableHead>
                <TableHead>Attachments</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deposits.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <Banknote className="h-8 w-8 text-muted-foreground" />
                      <p className="text-muted-foreground">No deposits found</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                deposits.map((deposit) => (
                  <DepositTableRow
                    key={deposit.deposit_id}
                    deposit={deposit}
                    onPreview={onPreview}
                    onDelete={onDelete}
                    onImageClick={onImageClick}
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
