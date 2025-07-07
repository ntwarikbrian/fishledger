import React, { useState } from "react";
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
  Edit,
  Trash2,
  Plus,
  Banknote,
  Building2,
  ArrowUpCircle,
  Upload,
  Image,
  AlertTriangle,
  CheckCircle2,
  Clock
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

// Mock transaction data with client column
const mockTransactions = [
  {
    id: "TXN-001",
    date: "2024-01-15",
    time: "14:30",
    productName: "Atlantic Salmon",
    quantity: 5,
    unitPrice: 25.00,
    totalAmount: 125.00,
    paymentMethod: "momo",
    clientName: "John Doe",
    status: "completed"
  },
  {
    id: "TXN-002",
    date: "2024-01-15",
    time: "15:45",
    productName: "Sea Bass",
    quantity: 3,
    unitPrice: 30.00,
    totalAmount: 90.00,
    paymentMethod: "cash",
    clientName: "Jane Smith",
    status: "completed"
  },
  {
    id: "TXN-003",
    date: "2024-01-14",
    time: "11:20",
    productName: "Tilapia Fillets",
    quantity: 8,
    unitPrice: 15.00,
    totalAmount: 120.00,
    paymentMethod: "momo",
    clientName: "Mike Johnson",
    status: "completed"
  },
  {
    id: "TXN-004",
    date: "2024-01-14",
    time: "16:10",
    productName: "Rainbow Trout",
    quantity: 2,
    unitPrice: 35.00,
    totalAmount: 70.00,
    paymentMethod: "cash",
    clientName: "Sarah Wilson",
    status: "pending"
  }
];

// Mock cash deposit data with approval workflow and photo attachments
const mockCashDeposits = [
  {
    id: "DEP-001",
    date: "2024-01-15",
    time: "16:30",
    amount: 500.00,
    depositType: "bank",
    accountNumber: "****1234",
    accountName: "Business Account",
    reference: "DEP20240115001",
    status: "completed",
    approvalStatus: "accepted", // accepted, pending, rejected
    approvedBy: "Manager John",
    approvedAt: "2024-01-15 16:45",
    requiresApproval: false, // amounts over $1000 require approval
    notes: "Daily cash deposit",
    attachments: [
      {
        id: "att-001",
        name: "deposit_slip_001.jpg",
        url: "/api/files/deposit_slip_001.jpg",
        type: "image/jpeg",
        size: "245 KB"
      }
    ]
  },
  {
    id: "DEP-002",
    date: "2024-01-14",
    time: "17:15",
    amount: 1500.00, // Large amount requiring approval
    depositType: "momo",
    accountNumber: "****5678",
    accountName: "MoMo Business",
    reference: "MM20240114002",
    status: "pending",
    approvalStatus: "pending",
    approvedBy: null,
    approvedAt: null,
    requiresApproval: true,
    notes: "Weekend sales deposit - requires approval",
    attachments: [
      {
        id: "att-002",
        name: "momo_receipt_002.jpg",
        url: "/api/files/momo_receipt_002.jpg",
        type: "image/jpeg",
        size: "189 KB"
      },
      {
        id: "att-003",
        name: "transaction_summary.pdf",
        url: "/api/files/transaction_summary.pdf",
        type: "application/pdf",
        size: "67 KB"
      }
    ]
  },
  {
    id: "DEP-003",
    date: "2024-01-13",
    time: "15:45",
    amount: 300.00,
    depositType: "bank",
    accountNumber: "****1234",
    accountName: "Business Account",
    reference: "DEP20240113003",
    status: "completed",
    approvalStatus: "accepted",
    approvedBy: "Manager John",
    approvedAt: "2024-01-13 15:45",
    requiresApproval: false,
    notes: "Partial deposit",
    attachments: []
  },
  {
    id: "DEP-004",
    date: "2024-01-12",
    time: "14:20",
    amount: 2500.00, // Large amount - rejected
    depositType: "bank",
    accountNumber: "****1234",
    accountName: "Business Account",
    reference: "DEP20240112004",
    status: "rejected",
    approvalStatus: "rejected",
    approvedBy: "Manager Sarah",
    approvedAt: "2024-01-12 16:30",
    requiresApproval: true,
    notes: "Large deposit - documentation insufficient",
    rejectionReason: "Insufficient supporting documentation",
    attachments: [
      {
        id: "att-004",
        name: "bank_slip_004.jpg",
        url: "/api/files/bank_slip_004.jpg",
        type: "image/jpeg",
        size: "312 KB"
      }
    ]
  },
  {
    id: "DEP-005",
    date: "2024-01-11",
    time: "18:00",
    amount: 800.00,
    depositType: "handed_to_boss",
    accountNumber: "N/A",
    accountName: "Boss - Direct Handover",
    reference: "BOSS20240111005",
    status: "completed",
    approvalStatus: "accepted",
    approvedBy: "Manager John",
    approvedAt: "2024-01-11 18:00",
    requiresApproval: false,
    notes: "Cash handed directly to boss",
    attachments: []
  }
];

const Transactions = () => {
  const [transactions] = useState(mockTransactions);
  const [cashDeposits] = useState(mockCashDeposits);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPayment, setFilterPayment] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [selectedDeposit, setSelectedDeposit] = useState<any>(null);

  // Deposit filters
  const [depositSearchTerm, setDepositSearchTerm] = useState("");
  const [filterDepositType, setFilterDepositType] = useState("all");

  // Add deposit modal state
  const [isAddDepositOpen, setIsAddDepositOpen] = useState(false);
  const [newDeposit, setNewDeposit] = useState({
    amount: "",
    depositType: "bank",
    accountName: "",
    reference: "",
    notes: "",
    attachments: [] as File[]
  });
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  // Filter transactions based on search and filters
  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch =
      transaction.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPayment = filterPayment === "all" || transaction.paymentMethod === filterPayment;
    const matchesStatus = filterStatus === "all" || transaction.status === filterStatus;

    return matchesSearch && matchesPayment && matchesStatus;
  });

  // Filter deposits based on search and filters
  const filteredDeposits = cashDeposits.filter(deposit => {
    const matchesSearch =
      deposit.reference.toLowerCase().includes(depositSearchTerm.toLowerCase()) ||
      deposit.accountName.toLowerCase().includes(depositSearchTerm.toLowerCase()) ||
      deposit.id.toLowerCase().includes(depositSearchTerm.toLowerCase());

    const matchesType = filterDepositType === "all" || deposit.depositType === filterDepositType;

    return matchesSearch && matchesType;
  });

  // Calculate summary statistics
  const totalTransactions = filteredTransactions.length;
  const totalRevenue = filteredTransactions.reduce((sum, t) => sum + t.totalAmount, 0);
  const momoTransactions = filteredTransactions.filter(t => t.paymentMethod === "momo").length;
  const cashTransactions = filteredTransactions.filter(t => t.paymentMethod === "cash").length;
  
  // Calculate deposit statistics
  const totalDeposits = filteredDeposits.length;
  const totalDepositAmount = filteredDeposits.reduce((sum, d) => sum + d.amount, 0);
  const bankDeposits = filteredDeposits.filter(d => d.depositType === "bank").length;
  const momoDeposits = filteredDeposits.filter(d => d.depositType === "momo").length;

  const getPaymentBadge = (method: string) => {
    return method === "momo" ? (
      <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
        <Smartphone className="h-3 w-3 mr-1" />
        MoMo Pay
      </Badge>
    ) : (
      <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
        <DollarSign className="h-3 w-3 mr-1" />
        Cash
      </Badge>
    );
  };

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setNewDeposit({
      ...newDeposit,
      attachments: [...newDeposit.attachments, ...files]
    });
  };

  // Remove uploaded file
  const removeFile = (index: number) => {
    const updatedFiles = newDeposit.attachments.filter((_, i) => i !== index);
    setNewDeposit({
      ...newDeposit,
      attachments: updatedFiles
    });
  };

  // Check if deposit requires approval (amounts over $1000)
  const requiresApproval = (amount: number) => amount > 1000;

  // Handle add deposit form submission
  const handleAddDeposit = () => {
    const depositAmount = parseFloat(newDeposit.amount);
    const needsApproval = requiresApproval(depositAmount);

    // Here you would typically send the data to your backend
    console.log("New deposit:", {
      ...newDeposit,
      amount: depositAmount,
      requiresApproval: needsApproval,
      approvalStatus: needsApproval ? "pending" : "accepted",
      status: needsApproval ? "pending" : "completed"
    });

    // Reset form and close modal
    setNewDeposit({
      amount: "",
      depositType: "bank",
      accountName: "",
      reference: "",
      notes: "",
      attachments: []
    });
    setIsAddDepositOpen(false);

    // Show appropriate message based on approval requirement
    if (needsApproval) {
      alert("Deposit submitted for approval. Large deposits require manager approval.");
    } else {
      alert("Deposit added successfully!");
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Receipt className="h-8 w-8 text-blue-600" />
            Transactions & Deposits
          </h1>
          <p className="text-muted-foreground">Track sales transactions and cash deposits</p>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="transactions" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="transactions" className="flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Transactions
            </TabsTrigger>
            <TabsTrigger value="deposits" className="flex items-center gap-2">
              <Banknote className="h-4 w-4" />
              Cash Deposits
            </TabsTrigger>
          </TabsList>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Transactions</p>
                      <p className="text-2xl font-bold">{totalTransactions}</p>
                    </div>
                    <Receipt className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Revenue</p>
                      <p className="text-2xl font-bold">${totalRevenue.toFixed(2)}</p>
                    </div>
                    <DollarSign className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">MoMo Payments</p>
                      <p className="text-2xl font-bold">{momoTransactions}</p>
                    </div>
                    <Smartphone className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Cash Payments</p>
                      <p className="text-2xl font-bold">{cashTransactions}</p>
                    </div>
                    <DollarSign className="h-8 w-8 text-blue-600" />
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="search">Search Transactions</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="search"
                        placeholder="Search by product, client, or ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Payment Method</Label>
                    <Select value={filterPayment} onValueChange={setFilterPayment}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Methods" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Methods</SelectItem>
                        <SelectItem value="momo">MoMo Pay</SelectItem>
                        <SelectItem value="cash">Cash</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>


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
                  {filteredTransactions.length} transaction(s) found
                </p>
              </CardHeader>
              <CardContent>
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
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTransactions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8">
                            <div className="flex flex-col items-center gap-2">
                              <Receipt className="h-8 w-8 text-muted-foreground" />
                              <p className="text-muted-foreground">No transactions found</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredTransactions.map((transaction) => (
                          <TableRow key={transaction.id}>
                            <TableCell className="font-medium">{transaction.id}</TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="text-sm">{transaction.date}</span>
                                <span className="text-xs text-muted-foreground">{transaction.time}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Package className="h-4 w-4 text-blue-600" />
                                {transaction.productName}
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">{transaction.clientName}</TableCell>
                            <TableCell>{transaction.quantity} kg</TableCell>
                            <TableCell className="font-semibold">${transaction.totalAmount.toFixed(2)}</TableCell>
                            <TableCell>{getPaymentBadge(transaction.paymentMethod)}</TableCell>
                            <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Cash Deposits Tab */}
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
                        <SelectItem value="handed_to_boss">Handed to Boss</SelectItem>
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
                            <Select value={newDeposit.depositType} onValueChange={(value) => setNewDeposit({...newDeposit, depositType: value})}>
                              <SelectTrigger className="h-8">
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="bank">Bank</SelectItem>
                                <SelectItem value="momo">MoMo</SelectItem>
                                <SelectItem value="handed_to_boss">To Boss</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <Label htmlFor="accountName" className="text-sm">Account Name *</Label>
                          <Input
                            id="accountName"
                            placeholder="Business Account"
                            className="h-8"
                            value={newDeposit.accountName}
                            onChange={(e) => setNewDeposit({...newDeposit, accountName: e.target.value})}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label htmlFor="reference" className="text-sm">Reference</Label>
                            <Input
                              id="reference"
                              placeholder="DEP001"
                              className="h-8"
                              value={newDeposit.reference}
                              onChange={(e) => setNewDeposit({...newDeposit, reference: e.target.value})}
                            />
                          </div>

                          <div className="space-y-1">
                            <Label htmlFor="notes" className="text-sm">Notes</Label>
                            <Input
                              id="notes"
                              placeholder="Optional"
                              className="h-8"
                              value={newDeposit.notes}
                              onChange={(e) => setNewDeposit({...newDeposit, notes: e.target.value})}
                            />
                          </div>
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
                                multiple
                                accept="image/*,.pdf"
                                className="hidden"
                                onChange={handleFileUpload}
                              />
                            </label>
                          </div>

                          {/* Display uploaded files */}
                          {newDeposit.attachments.length > 0 && (
                            <div className="space-y-1">
                              {newDeposit.attachments.map((file, index) => (
                                <div key={index} className="flex items-center justify-between p-1 bg-gray-50 rounded text-xs">
                                  <div className="flex items-center gap-1">
                                    <Image className="h-3 w-3 text-blue-600" />
                                    <span className="truncate max-w-[120px]">{file.name}</span>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeFile(index)}
                                    className="h-4 w-4 p-0 text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="h-2 w-2" />
                                  </Button>
                                </div>
                              ))}
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
                            disabled={!newDeposit.amount || !newDeposit.accountName}
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
                        <TableHead>Account</TableHead>
                        <TableHead>Reference</TableHead>
                        <TableHead>Approval</TableHead>
                        <TableHead>Attachments</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredDeposits.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8">
                            <div className="flex flex-col items-center gap-2">
                              <Banknote className="h-8 w-8 text-muted-foreground" />
                              <p className="text-muted-foreground">No deposits found</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredDeposits.map((deposit) => (
                          <TableRow key={deposit.id}>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="text-sm">{deposit.date}</span>
                                <span className="text-xs text-muted-foreground">{deposit.time}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-semibold text-green-600">${deposit.amount.toFixed(2)}</span>
                                {deposit.requiresApproval && (
                                  <span className="text-xs text-orange-600">Requires Approval</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>{getDepositTypeBadge(deposit.depositType)}</TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="text-sm font-medium">{deposit.accountName}</span>
                                <span className="text-xs text-muted-foreground">{deposit.accountNumber}</span>
                              </div>
                            </TableCell>
                            <TableCell className="font-mono text-sm">{deposit.reference}</TableCell>
                            <TableCell>{getApprovalStatusBadge(deposit.approvalStatus)}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                {deposit.attachments.length > 0 ? (
                                  <>
                                    <Image className="h-4 w-4 text-blue-600" />
                                    <span className="text-sm text-blue-600">{deposit.attachments.length}</span>
                                  </>
                                ) : (
                                  <span className="text-xs text-muted-foreground">None</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button variant="ghost" size="sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
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
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Transactions;

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
