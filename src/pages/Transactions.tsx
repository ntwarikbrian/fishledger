import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Receipt,
  Search,
  Filter,
  DollarSign,
  Smartphone,
  Package,
  Eye,
  Trash2,
  Plus,
  Banknote,
  AlertTriangle,
  Building2,
  ArrowUpCircle,
  Upload,
  Image,
  CheckCircle2,
  Clock,
  X,
  Loader2,
  RefreshCw,
  Calendar,
  User,
  CreditCard,
  FileText,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  TrendingUp,
  Phone,
  Mail
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTransactions } from "@/hooks/use-transactions";
import { useDeposits, type Deposit, type CreateDepositWithImageRequest } from "@/hooks/use-deposits";
import { useDebtors } from "@/hooks/use-debtors";
import { toast } from "sonner";
import type { Transaction, TransactionFilters, Debtor } from "@/types/transaction";
import { PAYMENT_METHODS, PAYMENT_STATUSES, DEPOSIT_TYPES } from "@/types/transaction";
import { useCurrency } from '@/contexts/CurrencyContext';

// Remove the old Deposit interface as we're now using the one from the hook

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

// Note: formatCurrency function removed - now using useCurrency hook

/**
 * Helper function to format date and time
 */
const formatDateTime = (dateTime: string): { date: string; time: string } => {
  const dt = new Date(dateTime);
  return {
    date: dt.toLocaleDateString(),
    time: dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };
};

/**
 * Helper function to get payment method display info
 */
const getPaymentMethodInfo = (method: string | null) => {
  switch (method) {
    case 'momo_pay':
      return { label: 'Mobile Money', icon: Smartphone, color: 'bg-blue-100 text-blue-800' };
    case 'cash':
      return { label: 'Cash', icon: Banknote, color: 'bg-green-100 text-green-800' };
    case 'bank_transfer':
      return { label: 'Bank Transfer', icon: Building2, color: 'bg-purple-100 text-purple-800' };
    default:
      return { label: 'Unknown', icon: CreditCard, color: 'bg-gray-100 text-gray-800' };
  }
};

/**
 * Helper function to get payment status display info
 */
const getPaymentStatusInfo = (status: string) => {
  switch (status) {
    case 'paid':
      return { label: 'Paid', icon: CheckCircle2, color: 'bg-green-100 text-green-800' };
    case 'pending':
      return { label: 'Pending', icon: Clock, color: 'bg-yellow-100 text-yellow-800' };
    case 'partial':
      return { label: 'Partial', icon: AlertTriangle, color: 'bg-orange-100 text-orange-800' };
    default:
      return { label: 'Unknown', icon: AlertTriangle, color: 'bg-gray-100 text-gray-800' };
  }
};

/**
 * Helper function to get status badge component
 */
const getStatusBadge = (status: string) => {
  return status === "completed" ? (
    <Badge variant="default" className="bg-green-500 hover:bg-green-600">
      Completed
    </Badge>
  ) : (
    <Badge variant="secondary" className="bg-yellow-500 text-white hover:bg-yellow-600">
      Pending
    </Badge>
  );
};

/**
 * Helper function to get deposit type badge component
 */
const getDepositTypeBadge = (type: string) => {
  switch (type) {
    case "bank":
      return (
        <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
          <Building2 className="h-3 w-3 mr-1" />
          Bank
        </Badge>
      );
    case "momo":
      return (
        <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100">
          <Smartphone className="h-3 w-3 mr-1" />
          MoMo
        </Badge>
      );
    case "boss":
      return (
        <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100">
          <Eye className="h-3 w-3 mr-1" />
          To
        </Badge>
      );
    case "handed_to_boss":
      return (
        <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100">
          <Eye className="h-3 w-3 mr-1" />
          Handed to Boss
        </Badge>
      );
    default:
      return (
        <Badge variant="secondary">
          Unknown
        </Badge>
      );
  }
};

/**
 * Helper function to get approval status badge component
 */
const getApprovalStatusBadge = (approvalStatus: string) => {
  switch (approvalStatus) {
    case "accepted":
      return (
        <Badge variant="default" className="bg-green-500 hover:bg-green-600">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Accepted
        </Badge>
      );
    case "pending":
      return (
        <Badge variant="secondary" className="bg-yellow-500 text-white hover:bg-yellow-600">
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </Badge>
      );
    case "rejected":
      return (
        <Badge variant="destructive" className="bg-red-500 hover:bg-red-600">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Rejected
        </Badge>
      );
    default:
      return (
        <Badge variant="secondary">
          Unknown
        </Badge>
      );
  }
};

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
              <Banknote className="mr-2 h-4 w-4" />
              Deposits
            </TabsTrigger>
            <TabsTrigger value="debtors">
              <AlertTriangle className="mr-2 h-4 w-4" />
              Debtors
            </TabsTrigger>
          </TabsList>

          <TabsContent value="transactions" className="space-y-6">
            {/* Backend Connection Status */}
            {totalTransactions === 0 && !loading && !error && (
              <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">
                      Backend Connected - No transactions found
                    </p>
                    <p className="text-xs text-yellow-700">
                      The system is working correctly. Add some transactions to see them here.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Transactions</p>
                  <p className="text-2xl font-bold">
                    {loading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : error ? (
                      <span className="text-red-500 text-sm">Error</span>
                    ) : (
                      totalTransactions
                    )}
                  </p>
                </div>
                <Receipt className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="text-2xl font-bold">
                    {loading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : error ? (
                      <span className="text-red-500 text-sm">Error</span>
                    ) : (
                      formatCurrency(totalTransactionAmount)
                    )}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Paid Transactions</p>
                  <p className="text-2xl font-bold">
                    {loading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : error ? (
                      <span className="text-red-500 text-sm">Error</span>
                    ) : (
                      paidTransactions
                    )}
                  </p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Transactions</p>
                  <p className="text-2xl font-bold">
                    {loading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : error ? (
                      <span className="text-red-500 text-sm">Error</span>
                    ) : (
                      pendingTransactions
                    )}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters & Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search">Search Transactions</Label>
                <div className="relative">
                  {loading ? (
                    <Loader2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground animate-spin" />
                  ) : (
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  )}
                  <Input
                    id="search"
                    placeholder="Search by product, client, reference..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="pl-10"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Payment Status</Label>
                <Select
                  value={filters.payment_status || 'all'}
                  onValueChange={(value) => handleFilterChange('payment_status', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {PAYMENT_STATUSES.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select
                  value={filters.payment_method || 'all'}
                  onValueChange={(value) => handleFilterChange('payment_method', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Methods" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Methods</SelectItem>
                    {PAYMENT_METHODS.map((method) => (
                      <SelectItem key={method.value} value={method.value}>
                        {method.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Deposit Type</Label>
                <Select
                  value={filters.deposit_type || 'all'}
                  onValueChange={(value) => handleFilterChange('deposit_type', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {DEPOSIT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <Button onClick={handleSearch} disabled={loading}>
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
              <Button onClick={clearFilters} variant="outline" disabled={loading}>
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Transaction History
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {loading ? 'Loading...' : `${filteredTransactions.length} transaction(s) found`}
            </p>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Loading transactions...</span>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Transaction ID</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8">
                          <div className="flex flex-col items-center gap-2">
                            <Receipt className="h-8 w-8 text-muted-foreground" />
                            <p className="text-muted-foreground">
                              {error ? 'Error loading transactions' : 'No transactions found'}
                            </p>
                            {error && (
                              <Button onClick={handleRefresh} variant="outline" size="sm">
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Retry
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTransactions.map((transaction) => {
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
                                onClick={() => handleViewTransaction(transaction)}
                                size="sm"
                                variant="outline"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                  {pagination.total} transactions
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={!pagination.hasPrev || loading}
                    size="sm"
                    variant="outline"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <span className="text-sm">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <Button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={!pagination.hasNext || loading}
                    size="sm"
                    variant="outline"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        {/* Transaction Detail Dialog */}
        <Dialog open={showTransactionDetail} onOpenChange={setShowTransactionDetail}>
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

            {selectedTransaction && (
              <div className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Transaction ID</Label>
                    <p className="text-sm font-mono">{selectedTransaction.transaction_id}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Date & Time</Label>
                    <p className="text-sm">{formatDateTime(selectedTransaction.date_time).date} at {formatDateTime(selectedTransaction.date_time).time}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Product</Label>
                    <p className="text-sm">{selectedTransaction.product_name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Client</Label>
                    <p className="text-sm">{selectedTransaction.client_name}</p>
                  </div>
                </div>

                <Separator />

                {/* Quantity and Amount */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Boxes</Label>
                    <p className="text-sm">{selectedTransaction.boxes_quantity}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Kilograms</Label>
                    <p className="text-sm">{selectedTransaction.kg_quantity}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Total Amount</Label>
                    <p className="text-lg font-semibold">{formatCurrency(selectedTransaction.total_amount)}</p>
                  </div>
                </div>

                <Separator />

                {/* Payment Information */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Payment Status</Label>
                    <div className="mt-1">
                      {(() => {
                        const statusInfo = getPaymentStatusInfo(selectedTransaction.payment_status);
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
                      {selectedTransaction.payment_method && (() => {
                        const methodInfo = getPaymentMethodInfo(selectedTransaction.payment_method);
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
                {(selectedTransaction.deposit_id || selectedTransaction.account_number || selectedTransaction.reference) && (
                  <>
                    <Separator />
                    <div className="grid grid-cols-2 gap-4">
                      {selectedTransaction.deposit_id && (
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Deposit ID</Label>
                          <p className="text-sm font-mono">{selectedTransaction.deposit_id}</p>
                        </div>
                      )}
                      {selectedTransaction.account_number && (
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Account Number</Label>
                          <p className="text-sm">{selectedTransaction.account_number}</p>
                        </div>
                      )}
                      {selectedTransaction.reference && (
                        <div className="col-span-2">
                          <Label className="text-sm font-medium text-muted-foreground">Reference</Label>
                          <p className="text-sm">{selectedTransaction.reference}</p>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* Receipt Image */}
                {selectedTransaction.image_url && (
                  <>
                    <Separator />
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Receipt Image</Label>
                      <div className="mt-2">
                        <img
                          src={selectedTransaction.image_url}
                          alt="Transaction receipt"
                          className="max-w-full h-auto rounded-lg border"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
          </TabsContent>

          <TabsContent value="deposits" className="space-y-6">
            {/* Deposit Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Deposits</p>
                      <p className="text-2xl font-bold">{totalDeposits}</p>
                    </div>
                    <ArrowUpCircle className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Amount</p>
                      <p className="text-2xl font-bold">${totalDepositAmount.toFixed(2)}</p>
                    </div>
                    <DollarSign className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Bank Deposits</p>
                      <p className="text-2xl font-bold">{bankDeposits}</p>
                    </div>
                    <Building2 className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">MoMo Deposits</p>
                      <p className="text-2xl font-bold">{momoDeposits}</p>
                    </div>
                    <Smartphone className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
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
                        onChange={(e) => setDepositSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Deposit Type</Label>
                    <Select value={filterDepositType} onValueChange={setFilterDepositType}>
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
                    <Select value={filterToRecipient} onValueChange={setFilterToRecipient}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Recipients" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Recipients</SelectItem>
                        <SelectItem value="none">No Recipient</SelectItem>
                        {uniqueToRecipients.map((recipient) => (
                          <SelectItem key={recipient} value={recipient!}>
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
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Banknote className="h-5 w-5" />
                      Cash Deposit History
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {filteredDeposits.length} deposit(s) found
                    </p>
                  </div>
                  <Dialog open={isAddDepositOpen} onOpenChange={setIsAddDepositOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="flex items-center gap-2 bg-green-600 hover:bg-green-700">
                        <Plus className="h-3 w-3" />
                        Add Deposit
                      </Button>
                    </DialogTrigger>
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
                              onChange={(e) => setNewDeposit({...newDeposit, amount: e.target.value})}
                            />
                          </div>

                          <div className="space-y-1">
                            <Label className="text-sm">Type *</Label>
                            <Select value={newDeposit.deposit_type} onValueChange={(value) => setNewDeposit({...newDeposit, deposit_type: value, boss_type: ""})}>
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
                              onChange={(e) => setNewDeposit({...newDeposit, boss_type: e.target.value})}
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
                            onChange={(e) => setNewDeposit({...newDeposit, account_name: e.target.value})}
                          />
                        </div>

                        <div className="space-y-1">
                          <Label htmlFor="accountNumber" className="text-sm">Account Number</Label>
                          <Input
                            id="accountNumber"
                            placeholder="123456789 (Optional)"
                            className="h-8"
                            value={newDeposit.account_number}
                            onChange={(e) => setNewDeposit({...newDeposit, account_number: e.target.value})}
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
                                onChange={handleFileUpload}
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
                                  onClick={removeFile}
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
                            onClick={() => setIsAddDepositOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            className="flex-1 h-8 bg-green-600 hover:bg-green-700"
                            onClick={handleAddDeposit}
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
                      {filteredDeposits.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center py-8">
                            <div className="flex flex-col items-center gap-2">
                              <Banknote className="h-8 w-8 text-muted-foreground" />
                              <p className="text-muted-foreground">No deposits found</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredDeposits.map((deposit) => (
                          <TableRow key={deposit.deposit_id}>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="text-sm">{new Date(deposit.date_time).toLocaleDateString()}</span>
                                <span className="text-xs text-muted-foreground">{new Date(deposit.date_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
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
                                    onClick={() => handleImageClick(deposit.deposit_image_url!)}
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
                                  onClick={() => handlePreviewDeposit(deposit)}
                                  title="Preview deposit details"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700"
                                  onClick={() => handleDeleteDepositClick(deposit)}
                                  title="Delete deposit"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="debtors" className="space-y-6">
            {/* Debtor Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Debtors</p>
                      <p className="text-2xl font-bold">{debtors.length}</p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Outstanding</p>
                      <p className="text-2xl font-bold text-red-600">
                        {formatCurrency(debtors.reduce((sum, debtor) => sum + debtor.totalOwed, 0))}
                      </p>
                    </div>
                    <DollarSign className="h-8 w-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Sales Value</p>
                      <p className="text-2xl font-bold">
                        {formatCurrency(debtors.reduce((sum, debtor) => sum + debtor.totalAmount, 0))}
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Amount Paid</p>
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(debtors.reduce((sum, debtor) => sum + debtor.totalPaid, 0))}
                      </p>
                    </div>
                    <CheckCircle2 className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Debtors Table */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-orange-500" />
                      Outstanding Payments
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Customers with unpaid or partially paid sales
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search customers..."
                        value={debtorsFilters.search || ''}
                        onChange={(e) => searchDebtors(e.target.value)}
                        className="pl-8 w-64"
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => refetchDebtors()}
                      disabled={debtorsLoading}
                    >
                      {debtorsLoading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                      Refresh
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Sales Count</TableHead>
                        <TableHead>Total Amount</TableHead>
                        <TableHead>Amount Paid</TableHead>
                        <TableHead>Outstanding</TableHead>
                        <TableHead>Last Sale</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {debtorsLoading ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8">
                            <div className="flex items-center justify-center gap-2">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                              Loading debtors...
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : debtorsError ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8 text-red-600">
                            Error loading debtors: {debtorsError}
                          </TableCell>
                        </TableRow>
                      ) : debtors.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8">
                            <div className="flex flex-col items-center gap-2">
                              <CheckCircle2 className="h-8 w-8 text-green-500" />
                              <p className="text-muted-foreground">No outstanding payments found</p>
                              <p className="text-sm text-muted-foreground">All customers have paid their bills!</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        debtors.map((debtor, index) => (
                          <TableRow key={`${debtor.clientName}-${index}`}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{debtor.clientName}</p>
                                <p className="text-sm text-muted-foreground">
                                  {debtor.salesCount} sale{debtor.salesCount !== 1 ? 's' : ''}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                {debtor.email && (
                                  <p className="text-sm">{debtor.email}</p>
                                )}
                                {debtor.phone && (
                                  <p className="text-sm text-muted-foreground">{debtor.phone}</p>
                                )}
                                {!debtor.email && !debtor.phone && (
                                  <p className="text-sm text-muted-foreground">No contact info</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {debtor.salesCount}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span className="font-medium">
                                {formatCurrency(debtor.totalAmount)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="text-green-600 font-medium">
                                {formatCurrency(debtor.totalPaid)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="text-red-600 font-bold">
                                {formatCurrency(debtor.totalOwed)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-muted-foreground">
                                {new Date(debtor.lastSaleDate).toLocaleDateString()}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  title="View Sales Details"
                                  onClick={() => {
                                    // TODO: Implement view sales details modal
                                    console.log('View sales for:', debtor.clientName);
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                {debtor.phone && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    title="Call Customer"
                                    onClick={() => window.open(`tel:${debtor.phone}`, '_self')}
                                  >
                                    <Phone className="h-4 w-4" />
                                  </Button>
                                )}
                                {debtor.email && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    title="Email Customer"
                                    onClick={() => window.open(`mailto:${debtor.email}?subject=Payment Reminder&body=Dear ${debtor.clientName}, this is a friendly reminder about your outstanding balance of ${formatCurrency(debtor.totalOwed)}.`, '_blank')}
                                  >
                                    <Mail className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Deposit Preview Modal */}
        <Dialog open={isPreviewDepositOpen} onOpenChange={setIsPreviewDepositOpen}>
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
            {selectedDeposit && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Amount</label>
                    <p className="text-lg font-semibold text-green-600">${selectedDeposit.amount.toFixed(2)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Type</label>
                    <p className="text-sm">
                      {selectedDeposit.deposit_type === 'boss' ? 'TO' : selectedDeposit.deposit_type.toUpperCase()}
                    </p>
                  </div>
                </div>

                {/* Show To field for boss type deposits */}
                {selectedDeposit.deposit_type === 'boss' && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">To</label>
                    <p className="text-sm">{selectedDeposit.to_recipient || 'Boss'}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Account Name</label>
                    <p className="text-sm">{selectedDeposit.account_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Account Number</label>
                    <p className="text-sm">{selectedDeposit.account_number || 'N/A'}</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Date & Time</label>
                  <p className="text-sm">{new Date(selectedDeposit.date_time).toLocaleString()}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Approval Status</label>
                  <div className="mt-1">
                    {selectedDeposit.approval === 'approved' ? (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Approved
                      </Badge>
                    ) : selectedDeposit.approval === 'rejected' ? (
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

                {selectedDeposit.deposit_image_url && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Attachment</label>
                    <div className="mt-2">
                      <img
                        src={selectedDeposit.deposit_image_url}
                        alt="Deposit proof"
                        className="w-full h-48 object-cover rounded-lg border cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => handleImageClick(selectedDeposit.deposit_image_url!)}
                        title="Click to view full size"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Deposit ID</label>
                  <p className="text-xs font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded">
                    {selectedDeposit.deposit_id}
                  </p>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Deposit Confirmation Modal */}
        <Dialog open={isDeleteDepositOpen} onOpenChange={setIsDeleteDepositOpen}>
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
            {deletingDeposit && (
              <div className="space-y-4">
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-red-800 dark:text-red-200 mb-2">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="font-medium">Deposit to be deleted:</span>
                  </div>
                  <div className="text-sm space-y-1">
                    <p><strong>Amount:</strong> ${deletingDeposit.amount.toFixed(2)}</p>
                    <p><strong>Type:</strong> {deletingDeposit.deposit_type.toUpperCase()}</p>
                    <p><strong>Account:</strong> {deletingDeposit.account_name}</p>
                    <p><strong>Date:</strong> {new Date(deletingDeposit.date_time).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setIsDeleteDepositOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={confirmDeleteDeposit}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Image Preview Modal */}
        <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] p-0">
            <DialogHeader className="p-6 pb-2">
              <DialogTitle className="flex items-center gap-2">
                <Image className="h-5 w-5" />
                Deposit Image
              </DialogTitle>
              <DialogDescription>
                Click outside or press ESC to close
              </DialogDescription>
            </DialogHeader>
            <div className="px-6 pb-6">
              {selectedImageUrl && (
                <div className="relative">
                  <img
                    src={selectedImageUrl}
                    alt="Deposit proof"
                    className="w-full h-auto max-h-[70vh] object-contain rounded-lg border"
                    style={{ maxHeight: '70vh' }}
                  />
                  <div className="mt-4 flex justify-end">
                    <Button
                      variant="outline"
                      onClick={() => window.open(selectedImageUrl, '_blank')}
                      className="flex items-center gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Open in New Tab
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default Transactions;
