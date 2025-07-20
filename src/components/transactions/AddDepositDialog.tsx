import React from "react";
import { DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Image, Trash2, AlertTriangle } from "lucide-react";

interface NewDepositForm {
  amount: string;
  deposit_type: string;
  account_name: string;
  account_number: string;
  boss_type: string;
  image: File | null;
}

interface AddDepositDialogProps {
  newDeposit: NewDepositForm;
  onDepositChange: (deposit: NewDepositForm) => void;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: () => void;
  onSubmit: () => void;
  onCancel: () => void;
}

/**
 * Add deposit dialog component
 * Provides form for creating new deposits with file upload
 */
export const AddDepositDialog: React.FC<AddDepositDialogProps> = ({
  newDeposit,
  onDepositChange,
  onFileUpload,
  onRemoveFile,
  onSubmit,
  onCancel,
}) => {
  return (
    <DialogContent className="max-w-sm">
      <DialogHeader>
        <DialogTitle className="text-lg">Add Deposit</DialogTitle>
        <DialogDescription className="text-sm">
          Record cash deposit
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="amount" className="text-sm">Amount *</Label>
            <Input
              id="amount"
              type="number"
              placeholder="0.00"
              className="h-8"
              value={newDeposit.amount}
              onChange={(e) => onDepositChange({...newDeposit, amount: e.target.value})}
            />
          </div>

          <div className="space-y-1">
            <Label className="text-sm">Type *</Label>
            <Select 
              value={newDeposit.deposit_type} 
              onValueChange={(value) => onDepositChange({...newDeposit, deposit_type: value, boss_type: ""})}
            >
              <SelectTrigger className="h-8">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bank">Bank</SelectItem>
                <SelectItem value="momo">MoMo</SelectItem>
                <SelectItem value="boss">To</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Conditional boss type field */}
        {newDeposit.deposit_type === 'boss' && (
          <div className="space-y-1">
            <Label htmlFor="bossType" className="text-sm">To (Specify) *</Label>
            <Input
              id="bossType"
              placeholder="e.g., boss, manager, supervisor"
              className="h-8"
              value={newDeposit.boss_type}
              onChange={(e) => onDepositChange({...newDeposit, boss_type: e.target.value})}
            />
          </div>
        )}

        <div className="space-y-1">
          <Label htmlFor="accountName" className="text-sm">Account Name *</Label>
          <Input
            id="accountName"
            placeholder="Business Account"
            className="h-8"
            value={newDeposit.account_name}
            onChange={(e) => onDepositChange({...newDeposit, account_name: e.target.value})}
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="accountNumber" className="text-sm">Account Number</Label>
          <Input
            id="accountNumber"
            placeholder="123456789 (Optional)"
            className="h-8"
            value={newDeposit.account_number}
            onChange={(e) => onDepositChange({...newDeposit, account_number: e.target.value})}
          />
        </div>

        {/* Photo Upload Section */}
        <div className="space-y-1">
          <Label className="text-sm">Photos (Optional)</Label>
          <div className="border border-dashed border-gray-300 rounded p-2">
            <label htmlFor="file-upload" className="cursor-pointer block text-center">
              <Upload className="mx-auto h-4 w-4 text-gray-400 mb-1" />
              <span className="text-xs text-blue-600 hover:text-blue-500">
                Upload slip photos
              </span>
              <input
                id="file-upload"
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={onFileUpload}
              />
            </label>
          </div>

          {/* Display uploaded file */}
          {newDeposit.image && (
            <div className="space-y-1">
              <div className="flex items-center justify-between p-1 bg-gray-50 rounded text-xs">
                <div className="flex items-center gap-1">
                  <Image className="h-3 w-3 text-blue-600" />
                  <span className="truncate max-w-[120px]">{newDeposit.image.name}</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onRemoveFile}
                  className="h-4 w-4 p-0 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-2 w-2" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Approval Warning for Large Amounts */}
        {parseFloat(newDeposit.amount) > 1000 && (
          <div className="p-2 bg-yellow-50 border border-yellow-200 rounded">
            <div className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 text-yellow-600" />
              <span className="text-xs font-medium text-yellow-800">
                Requires approval (over $1,000)
              </span>
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-8"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            className="flex-1 h-8 bg-green-600 hover:bg-green-700"
            onClick={onSubmit}
            disabled={
              !newDeposit.amount ||
              !newDeposit.account_name ||
              !newDeposit.deposit_type ||
              (newDeposit.deposit_type === 'boss' && !newDeposit.boss_type)
            }
          >
            Add Deposit
          </Button>
        </div>
      </div>
    </DialogContent>
  );
};
