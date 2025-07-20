import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Receipt, RefreshCw } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTransactions } from "@/hooks/use-transactions";
import { useDeposits, type Deposit, type CreateDepositWithImageRequest } from "@/hooks/use-deposits";
import { useDebtors } from "@/hooks/use-debtors";
import { toast } from "sonner";
import type { Transaction, TransactionFilters, Debtor } from "@/types/transaction";
import { useCurrency } from '@/contexts/CurrencyContext';
import { transactionsAPI } from "@/services/api";

// Import extracted components
import { TransactionsTab } from "@/components/transactions/TransactionsTab";
import { DepositsTab } from "@/components/transactions/DepositsTab";
import { DebtorsTab } from "@/components/transactions/DebtorsTab";
import { ImagePreviewModal } from "@/components/transactions/ImagePreviewModal";

/**
 * New deposit form interface
 */
interface NewDepositForm {
  amount: string;
  deposit_type: string;
  account_name: string;
  account_number: string;
  boss_type: string; // For when deposit_type is "boss", specify the type (boss, manager, etc.)
  image: File | null;
}

const Transactions = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { formatCurrency } = useCurrency();

  // Get current tab from URL
  const getCurrentTab = () => {
    const path = location.pathname;
    if (path.includes('/deposits')) {
      return 'deposits';
    } else if (path.includes('/debtors')) {
      return 'debtors';
    }
    return 'transactions';
  };

  const [activeTab, setActiveTab] = useState(getCurrentTab());

  // Handle tab change with URL navigation
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === 'deposits') {
      navigate('/transactions/deposits');
    } else if (value === 'debtors') {
      navigate('/transactions/debtors');
    } else {
      navigate('/transactions');
    }
  };

  // Update tab when URL changes
  useEffect(() => {
    const currentTab = getCurrentTab();
    if (currentTab !== activeTab) {
      setActiveTab(currentTab);
    }
  }, [location.pathname, activeTab]);

  // Use the transaction hook for state management
  const {
    transactions,
    loading,
    error,
    pagination,
    filters,
    fetchTransactions,
    searchTransactions,
    setFilters,
    clearFilters,
    refetch,
  } = useTransactions();

  // Initialize deposits hook
  const {
    deposits: realDeposits,
    stats: depositStats,
    loading: depositsLoading,
    fetchDeposits,
    fetchStats: fetchDepositStats,
    createDepositWithImage,
    getDeposit,
    deleteDeposit,
  } = useDeposits();

  // Initialize debtors hook
  const {
    debtors,
    loading: debtorsLoading,
    error: debtorsError,
    pagination: debtorsPagination,
    filters: debtorsFilters,
    fetchDebtors,
    searchDebtors,
    setFilters: setDebtorsFilters,
    clearFilters: clearDebtorsFilters,
    refetch: refetchDebtors,
  } = useDebtors();

  // Fetch deposits data when deposits tab becomes active
  useEffect(() => {
    if (activeTab === 'deposits') {
      fetchDeposits();
      fetchDepositStats();
    } else if (activeTab === 'debtors') {
      fetchDebtors();
    }
  }, [activeTab, fetchDeposits, fetchDepositStats, fetchDebtors]);

  // Local state for UI
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showTransactionDetail, setShowTransactionDetail] = useState(false);

  // Deposit management state
  const [depositSearchTerm, setDepositSearchTerm] = useState("");
  const [filterDepositType, setFilterDepositType] = useState("all");
  const [filterToRecipient, setFilterToRecipient] = useState("all");
  const [isAddDepositOpen, setIsAddDepositOpen] = useState(false);
  const [newDeposit, setNewDeposit] = useState<NewDepositForm>({
    amount: "",
    deposit_type: "",
    account_name: "",
    account_number: "",
    boss_type: "",
    image: null
  });

  // State for deposit preview and delete
  const [isPreviewDepositOpen, setIsPreviewDepositOpen] = useState(false);
  const [isDeleteDepositOpen, setIsDeleteDepositOpen] = useState(false);
  const [selectedDeposit, setSelectedDeposit] = useState<Deposit | null>(null);
  const [deletingDeposit, setDeletingDeposit] = useState<Deposit | null>(null);

  // State for image popup
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);

  // Initialize data on component mount
  useEffect(() => {
    const initializeData = async () => {
      try {
        // Fetch only transactions data (stats will be calculated from table data)
        await fetchTransactions();

        // Initialize deposits data only if on deposits tab
        if (getCurrentTab() === 'deposits') {
          fetchDeposits();
          fetchDepositStats();
        } else if (getCurrentTab() === 'debtors') {
          fetchDebtors();
        }
      } catch (error) {
        console.error('Error initializing transaction data:', error);
      }
    };

    initializeData();
  }, []); // Empty dependency array to run only once

  // Computed transaction statistics from table data (no API calls, with null checks)
  const totalTransactions = transactions?.length || 0;
  const totalTransactionAmount = transactions?.reduce((sum, transaction) => sum + transaction.total_amount, 0) || 0;
  const paidTransactions = transactions?.filter(t => t.payment_status === 'paid').length || 0;
  const pendingTransactions = transactions?.filter(t => t.payment_status === 'pending').length || 0;
  const partialTransactions = transactions?.filter(t => t.payment_status === 'partial').length || 0;

  // Computed values for deposit statistics using real data (with null checks)
  const totalDeposits = realDeposits?.length || 0;
  const totalDepositAmount = realDeposits?.reduce((sum, deposit) => sum + deposit.amount, 0) || 0;
  const bankDeposits = realDeposits?.filter(d => d.deposit_type === 'bank').length || 0;
  const momoDeposits = realDeposits?.filter(d => d.deposit_type === 'momo').length || 0;
  const bossDeposits = realDeposits?.filter(d => d.deposit_type === 'boss').length || 0;

  // Get unique to_recipient values for filter options
  const uniqueToRecipients = Array.from(
    new Set(
      realDeposits
        ?.filter(d => d.deposit_type === 'boss' && d.to_recipient)
        .map(d => d.to_recipient)
        .filter(Boolean)
    )
  ).sort();

  // Filter deposits based on search and type (with null check)
  const filteredDeposits = realDeposits?.filter(deposit => {
    const matchesSearch = depositSearchTerm === "" ||
      deposit.account_name.toLowerCase().includes(depositSearchTerm.toLowerCase()) ||
      (deposit.account_number && deposit.account_number.toLowerCase().includes(depositSearchTerm.toLowerCase())) ||
      (deposit.to_recipient && deposit.to_recipient.toLowerCase().includes(depositSearchTerm.toLowerCase())) ||
      deposit.deposit_id.toLowerCase().includes(depositSearchTerm.toLowerCase());

    const matchesType = filterDepositType === "all" || deposit.deposit_type === filterDepositType;

    const matchesToRecipient = filterToRecipient === "all" ||
      (filterToRecipient === "none" && (!deposit.to_recipient || deposit.to_recipient === "")) ||
      (deposit.to_recipient && deposit.to_recipient.toLowerCase() === filterToRecipient.toLowerCase());

    return matchesSearch && matchesType && matchesToRecipient;
  }) || [];

  // Handle search with automatic debouncing
  const handleSearch = async () => {
    try {
      if (searchTerm.trim()) {
        await searchTransactions(searchTerm.trim());
      } else {
        await fetchTransactions();
      }
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  // Auto-search when search term changes (debounced)
  useEffect(() => {
    // Only search if component is mounted and not in initial loading state
    if (searchTerm !== undefined) {
      handleSearch();
    }
  }, [searchTerm]); // This will trigger the debounced search

  // Handle filter changes
  const handleFilterChange = (key: keyof TransactionFilters, value: string) => {
    const newValue = value === 'all' ? undefined : value;
    setFilters({ [key]: newValue });
  };

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    fetchTransactions(newPage, pagination?.limit || 10);
  };

  // Handle transaction detail view
  const handleViewTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowTransactionDetail(true);
  };

  // Handle refresh
  const handleRefresh = async () => {
    await refetch();
    toast.success('Data refreshed successfully');
  };

  // Handle file upload for deposits
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files[0]) {
      setNewDeposit(prev => ({
        ...prev,
        image: files[0]
      }));
    }
  };

  // Remove file from attachments
  const removeFile = () => {
    setNewDeposit(prev => ({
      ...prev,
      image: null
    }));
  };

  // Handle add deposit
  const handleAddDeposit = async () => {
    if (!newDeposit.amount || !newDeposit.account_name || !newDeposit.deposit_type) {
      toast.error('Please fill in required fields');
      return;
    }

    // Additional validation for boss type
    if (newDeposit.deposit_type === 'boss' && !newDeposit.boss_type) {
      toast.error('Please specify who you are giving the deposit to');
      return;
    }

    try {
      const amount = parseFloat(newDeposit.amount);

      const depositData: CreateDepositWithImageRequest = {
        amount,
        deposit_type: newDeposit.deposit_type as 'bank' | 'momo' | 'boss',
        account_name: newDeposit.account_name,
        account_number: newDeposit.account_number || undefined,
        to_recipient: newDeposit.deposit_type === 'boss' ? newDeposit.boss_type : undefined,
        image: newDeposit.image || undefined,
      };

      await createDepositWithImage(depositData);

      // Reset form
      setNewDeposit({
        amount: "",
        deposit_type: "",
        account_name: "",
        account_number: "",
        boss_type: "",
        image: null
      });

      setIsAddDepositOpen(false);

      // Note: Auto-refresh is now handled by the hook

    } catch (error) {
      console.error('Error adding deposit:', error);
      // Error is already handled by the hook
    }
  };

  // Handle deposit preview
  const handlePreviewDeposit = (deposit: Deposit) => {
    setSelectedDeposit(deposit);
    setIsPreviewDepositOpen(true);
  };

  // Handle deposit delete click
  const handleDeleteDepositClick = (deposit: Deposit) => {
    setDeletingDeposit(deposit);
    setIsDeleteDepositOpen(true);
  };

  // Confirm deposit deletion
  const confirmDeleteDeposit = async () => {
    if (!deletingDeposit) return;

    try {
      await deleteDeposit(deletingDeposit.deposit_id);
      setIsDeleteDepositOpen(false);
      setDeletingDeposit(null);
      // Note: Auto-refresh is now handled by the hook
    } catch (error) {
      console.error('Error deleting deposit:', error);
      // Error is already handled by the hook
    }
  };

  // Handle image click to show in modal
  const handleImageClick = (imageUrl: string) => {
    setSelectedImageUrl(imageUrl);
    setIsImageModalOpen(true);
  };

  // Calculate filtered transactions for display
  const filteredTransactions = transactions;

  // Handle mark as paid functionality
  const handleMarkAsPaid = async (debtorName: string, amountPaid: number) => {
    try {
      console.log(`Marking ${debtorName} as paid: ${formatCurrency(amountPaid)}`);

      // Call the API to mark as paid
      const response = await transactionsAPI.markAsPaid({
        client_name: debtorName,
        amount_paid: amountPaid,
        payment_method: 'cash', // Default to cash, could be made configurable
        reference: `Payment recorded via dashboard on ${new Date().toLocaleDateString()}`,
      });

      if (response.success) {
        const { data } = response;
        toast.success(
          `Payment of ${formatCurrency(amountPaid)} recorded for ${debtorName}. ${data.updated_sales} sale(s) updated.`,
          {
            duration: 5000,
            description: data.remaining_outstanding > 0
              ? `Remaining outstanding: ${formatCurrency(data.remaining_outstanding)}`
              : 'All debts cleared!',
          }
        );

        // Refresh debtors data to reflect the payment
        refetchDebtors();
      } else {
        throw new Error(response.message || 'Failed to record payment');
      }
    } catch (error: any) {
      console.error('Error marking as paid:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to record payment. Please try again.';
      toast.error(errorMessage, {
        duration: 6000,
      });
    }
  };

  // Show error message if there's an error (only once per error)
  useEffect(() => {
    if (error) {
      console.error('Transaction error:', error);
      toast.error(error, {
        duration: 5000, // Show for 5 seconds
        action: {
          label: 'Retry',
          onClick: handleRefresh,
        },
      });
    }
  }, [error, handleRefresh]);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Receipt className="h-8 w-8 text-blue-600" />
              Transaction Management
            </h1>
            <p className="text-muted-foreground">Comprehensive transaction tracking and management</p>
          </div>
          <Button onClick={handleRefresh} disabled={loading} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Transaction Management Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="transactions">
              <Receipt className="mr-2 h-4 w-4" />
              Transactions
            </TabsTrigger>
            <TabsTrigger value="deposits">
              <Receipt className="mr-2 h-4 w-4" />
              Deposits
            </TabsTrigger>
            <TabsTrigger value="debtors">
              <Receipt className="mr-2 h-4 w-4" />
              Debtors
            </TabsTrigger>
          </TabsList>

          <TabsContent value="transactions">
            <TransactionsTab
              transactions={filteredTransactions}
              totalTransactions={totalTransactions}
              totalTransactionAmount={totalTransactionAmount}
              paidTransactions={paidTransactions}
              pendingTransactions={pendingTransactions}
              loading={loading}
              error={error}
              searchTerm={searchTerm}
              filters={filters}
              selectedTransaction={selectedTransaction}
              showTransactionDetail={showTransactionDetail}
              pagination={pagination}
              onSearchChange={setSearchTerm}
              onFilterChange={handleFilterChange}
              onSearch={handleSearch}
              onClearFilters={clearFilters}
              onViewTransaction={handleViewTransaction}
              onRefresh={handleRefresh}
              onPageChange={handlePageChange}
              onTransactionDetailClose={setShowTransactionDetail}
            />
          </TabsContent>


          <TabsContent value="deposits">
            <DepositsTab
              deposits={filteredDeposits}
              totalDeposits={totalDeposits}
              totalDepositAmount={totalDepositAmount}
              bankDeposits={bankDeposits}
              momoDeposits={momoDeposits}
              uniqueToRecipients={uniqueToRecipients}
              depositSearchTerm={depositSearchTerm}
              filterDepositType={filterDepositType}
              filterToRecipient={filterToRecipient}
              isAddDepositOpen={isAddDepositOpen}
              newDeposit={newDeposit}
              isPreviewDepositOpen={isPreviewDepositOpen}
              isDeleteDepositOpen={isDeleteDepositOpen}
              selectedDeposit={selectedDeposit}
              deletingDeposit={deletingDeposit}
              onDepositSearchChange={setDepositSearchTerm}
              onFilterDepositTypeChange={setFilterDepositType}
              onFilterToRecipientChange={setFilterToRecipient}
              onAddDepositOpenChange={setIsAddDepositOpen}
              onNewDepositChange={setNewDeposit}
              onFileUpload={handleFileUpload}
              onRemoveFile={removeFile}
              onAddDeposit={handleAddDeposit}
              onPreviewDeposit={handlePreviewDeposit}
              onDeleteDeposit={handleDeleteDepositClick}
              onConfirmDeleteDeposit={confirmDeleteDeposit}
              onImageClick={handleImageClick}
              onPreviewDepositOpenChange={setIsPreviewDepositOpen}
              onDeleteDepositOpenChange={setIsDeleteDepositOpen}
            />
          </TabsContent>

          <TabsContent value="debtors">
            <DebtorsTab
              debtors={debtors}
              loading={debtorsLoading}
              error={debtorsError}
              searchValue={debtorsFilters.search || ''}
              onSearchChange={searchDebtors}
              onMarkAsPaid={handleMarkAsPaid}
              onViewSales={(debtor) => {
                // TODO: Implement view sales details modal
                console.log('View sales for:', debtor.clientName);
              }}
            />
          </TabsContent>
        </Tabs>

        {/* Image Preview Modal */}
        <ImagePreviewModal
          open={isImageModalOpen}
          onOpenChange={setIsImageModalOpen}
          imageUrl={selectedImageUrl}
        />
      </div>
    </AppLayout>
  );
};

export default Transactions;