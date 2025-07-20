import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowUpCircle, DollarSign, Building2, Smartphone, Filter, Search } from "lucide-react";
import { SummaryCard } from "./SummaryCard";
import { DepositTable } from "./DepositTable";
import { AddDepositDialog } from "./AddDepositDialog";
import { DepositPreviewDialog } from "./DepositPreviewDialog";
import { DepositDeleteDialog } from "./DepositDeleteDialog";
import type { Deposit } from "@/hooks/use-deposits";

interface NewDepositForm {
  amount: string;
  deposit_type: string;
  account_name: string;
  account_number: string;
  boss_type: string;
  image: File | null;
}

interface DepositsTabProps {
  // Data
  deposits: Deposit[];
  totalDeposits: number;
  totalDepositAmount: number;
  bankDeposits: number;
  momoDeposits: number;
  uniqueToRecipients: string[];
  
  // State
  depositSearchTerm: string;
  filterDepositType: string;
  filterToRecipient: string;
  isAddDepositOpen: boolean;
  newDeposit: NewDepositForm;
  isPreviewDepositOpen: boolean;
  isDeleteDepositOpen: boolean;
  selectedDeposit: Deposit | null;
  deletingDeposit: Deposit | null;
  
  // Handlers
  onDepositSearchChange: (value: string) => void;
  onFilterDepositTypeChange: (value: string) => void;
  onFilterToRecipientChange: (value: string) => void;
  onAddDepositOpenChange: (open: boolean) => void;
  onNewDepositChange: (deposit: NewDepositForm) => void;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: () => void;
  onAddDeposit: () => void;
  onPreviewDeposit: (deposit: Deposit) => void;
  onDeleteDeposit: (deposit: Deposit) => void;
  onConfirmDeleteDeposit: () => void;
  onImageClick: (imageUrl: string) => void;
  onPreviewDepositOpenChange: (open: boolean) => void;
  onDeleteDepositOpenChange: (open: boolean) => void;
}

/**
 * Deposits tab content component
 * Contains all deposit-related functionality and UI
 */
export const DepositsTab: React.FC<DepositsTabProps> = ({
  deposits,
  totalDeposits,
  totalDepositAmount,
  bankDeposits,
  momoDeposits,
  uniqueToRecipients,
  depositSearchTerm,
  filterDepositType,
  filterToRecipient,
  isAddDepositOpen,
  newDeposit,
  isPreviewDepositOpen,
  isDeleteDepositOpen,
  selectedDeposit,
  deletingDeposit,
  onDepositSearchChange,
  onFilterDepositTypeChange,
  onFilterToRecipientChange,
  onAddDepositOpenChange,
  onNewDepositChange,
  onFileUpload,
  onRemoveFile,
  onAddDeposit,
  onPreviewDeposit,
  onDeleteDeposit,
  onConfirmDeleteDeposit,
  onImageClick,
  onPreviewDepositOpenChange,
  onDeleteDepositOpenChange,
}) => {
  return (
    <div className="space-y-6">
      {/* Deposit Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard
          title="Total Deposits"
          value={totalDeposits}
          icon={ArrowUpCircle}
          iconColor="text-green-600"
        />
        <SummaryCard
          title="Total Amount"
          value={`$${totalDepositAmount.toFixed(2)}`}
          icon={DollarSign}
          iconColor="text-green-600"
        />
        <SummaryCard
          title="Bank Deposits"
          value={bankDeposits}
          icon={Building2}
          iconColor="text-blue-600"
        />
        <SummaryCard
          title="MoMo Deposits"
          value={momoDeposits}
          icon={Smartphone}
          iconColor="text-purple-600"
        />
      </div>

      {/* Deposit Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Deposit Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="depositSearch">Search Deposits</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="depositSearch"
                  placeholder="Search by reference, account, or ID..."
                  value={depositSearchTerm}
                  onChange={(e) => onDepositSearchChange(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Deposit Type</Label>
              <Select value={filterDepositType} onValueChange={onFilterDepositTypeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="bank">Bank</SelectItem>
                  <SelectItem value="momo">MoMo</SelectItem>
                  <SelectItem value="boss">To</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>To Recipient</Label>
              <Select value={filterToRecipient} onValueChange={onFilterToRecipientChange}>
                <SelectTrigger>
                  <SelectValue placeholder="All Recipients" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Recipients</SelectItem>
                  <SelectItem value="none">No Recipient</SelectItem>
                  {uniqueToRecipients.map((recipient) => (
                    <SelectItem key={recipient} value={recipient}>
                      {recipient}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Deposits Table */}
      <DepositTable
        deposits={deposits}
        onPreview={onPreviewDeposit}
        onDelete={onDeleteDeposit}
        onImageClick={onImageClick}
        addDepositDialog={
          <AddDepositDialog
            newDeposit={newDeposit}
            onDepositChange={onNewDepositChange}
            onFileUpload={onFileUpload}
            onRemoveFile={onRemoveFile}
            onSubmit={onAddDeposit}
            onCancel={() => onAddDepositOpenChange(false)}
          />
        }
        isAddDepositOpen={isAddDepositOpen}
        onAddDepositOpenChange={onAddDepositOpenChange}
      />

      {/* Deposit Preview Modal */}
      <DepositPreviewDialog
        open={isPreviewDepositOpen}
        onOpenChange={onPreviewDepositOpenChange}
        deposit={selectedDeposit}
        onImageClick={onImageClick}
      />

      {/* Delete Deposit Confirmation Modal */}
      <DepositDeleteDialog
        open={isDeleteDepositOpen}
        onOpenChange={onDeleteDepositOpenChange}
        deposit={deletingDeposit}
        onConfirmDelete={onConfirmDeleteDeposit}
      />
    </div>
  );
};
