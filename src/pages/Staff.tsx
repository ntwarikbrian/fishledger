import React, { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Users,
  UserPlus,
  Eye,
  Edit,
  Trash2,
  Calendar,
  DollarSign,
  Clock,
  LogIn,
  TrendingUp,
  User,
  Mail,
  Lock,
  Building,
  Phone,
  Upload,
  Image,
  X,
  CreditCard,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Package,
  ShoppingCart,
  CreditCard as TransactionIcon,
  Receipt
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import {
  createWorker,
  getAllWorkers,
  updateWorkerPermissions,
  getWorkerPermissions,
  type Worker,
  type CreateWorkerData,
  type WorkerPermissions
} from "@/services/workerService";

const Staff = () => {
  // State for create worker form
  const [createWorkerForm, setCreateWorkerForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    salary: ""
  });

  // State for ID card attachments
  const [idCardFront, setIdCardFront] = useState<File | null>(null);
  const [idCardBack, setIdCardBack] = useState<File | null>(null);
  const [idCardFrontPreview, setIdCardFrontPreview] = useState<string | null>(null);
  const [idCardBackPreview, setIdCardBackPreview] = useState<string | null>(null);

  // State for create worker dialog
  const [isCreateWorkerDialogOpen, setIsCreateWorkerDialogOpen] = useState(false);

  // State for ID document popup
  const [isIdDocumentDialogOpen, setIsIdDocumentDialogOpen] = useState(false);
  const [selectedWorkerForId, setSelectedWorkerForId] = useState<Worker | null>(null);

  // State for selected worker in roles and permissions
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);

  // State for workers data and loading
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [isLoadingWorkers, setIsLoadingWorkers] = useState(false);
  const [isCreatingWorker, setIsCreatingWorker] = useState(false);
  const [isSavingPermissions, setIsSavingPermissions] = useState(false);

  // State for permissions management
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    productInventory: false,
    sales: false,
    transactions: false,
    expenses: false
  });

  const [permissions, setPermissions] = useState<Record<string, Record<string, boolean>>>({
    productInventory: {
      viewProducts: false,
      createProduct: false,
      editProduct: false,
      deleteProduct: false,
      manageCategories: false,
      viewStock: false,
      updateStock: false,
      viewReports: false
    },
    sales: {
      viewSales: false,
      createSale: false,
      editSale: false,
      deleteSale: false,
      manageSalesReports: false,
      viewCustomers: false,
      managePayments: false
    },
    transactions: {
      viewTransactions: false,
      createTransaction: false,
      editTransaction: false,
      deleteTransaction: false,
      manageDeposits: false,
      viewFinancialReports: false,
      manageDebtors: false
    },
    expenses: {
      viewExpenses: false,
      createExpense: false,
      editExpense: false,
      deleteExpense: false,
      manageCategories: false,
      viewExpenseReports: false,
      approveExpenses: false
    }
  });

  // Load workers data on component mount
  useEffect(() => {
    loadWorkers();
  }, []);

  // Load workers from API
  const loadWorkers = async () => {
    setIsLoadingWorkers(true);
    try {
      const response = await getAllWorkers();
      if (response.success && response.data) {
        setWorkers(response.data);
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to load workers",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load workers",
        variant: "destructive"
      });
    } finally {
      setIsLoadingWorkers(false);
    }
  };

  // Mock data for existing workers with login and revenue data (fallback)
  const mockWorkersData = [
    {
      id: 1,
      name: "John Smith",
      email: "john.smith@fishsales.com",
      phone: "+1 (555) 123-4567",
      role: "Sales Manager",
      department: "Sales",
      salary: 4583, // Monthly salary
      status: "Active",
      createdDate: "2023-01-15",
      lastLogin: "2024-01-22 14:30",
      totalLogins: 245,
      revenueGenerated: 125000,
      monthlyRevenue: 18500,
      loginHistory: [
        { date: "2024-01-22", time: "14:30", duration: "8h 15m" },
        { date: "2024-01-21", time: "09:00", duration: "8h 30m" },
        { date: "2024-01-20", time: "08:45", duration: "9h 00m" }
      ]
    },
    {
      id: 2,
      name: "Maria Rodriguez",
      email: "maria.rodriguez@fishsales.com",
      phone: "+1 (555) 234-5678",
      role: "Fish Handler",
      department: "Operations",
      salary: 3500, // Monthly salary
      status: "Active",
      createdDate: "2023-03-20",
      lastLogin: "2024-01-22 13:45",
      totalLogins: 198,
      revenueGenerated: 85000,
      monthlyRevenue: 12300,
      loginHistory: [
        { date: "2024-01-22", time: "13:45", duration: "7h 45m" },
        { date: "2024-01-21", time: "08:30", duration: "8h 00m" },
        { date: "2024-01-19", time: "09:15", duration: "8h 15m" }
      ]
    },
    {
      id: 3,
      name: "David Chen",
      email: "david.chen@fishsales.com",
      phone: "+1 (555) 345-6789",
      role: "Delivery Driver",
      department: "Logistics",
      salary: 3167, // Monthly salary
      status: "Active",
      createdDate: "2023-06-10",
      lastLogin: "2024-01-22 10:20",
      totalLogins: 156,
      revenueGenerated: 65000,
      monthlyRevenue: 9800,
      loginHistory: [
        { date: "2024-01-22", time: "10:20", duration: "6h 30m" },
        { date: "2024-01-21", time: "11:00", duration: "7h 00m" },
        { date: "2024-01-20", time: "10:45", duration: "6h 45m" }
      ]
    }
  ];



  // Handle form input changes
  const handleInputChange = (field: string, value: string) => {
    setCreateWorkerForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle individual ID card file upload (step by step)
  const handleIdCardUpload = (file: File, cardType: 'front' | 'back') => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Please select only image files for ID card",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast({
        title: "Error",
        description: "Image must be smaller than 5MB",
        variant: "destructive"
      });
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      if (cardType === 'front') {
        setIdCardFront(file);
        setIdCardFrontPreview(e.target?.result as string);
      } else {
        setIdCardBack(file);
        setIdCardBackPreview(e.target?.result as string);
      }
    };

    reader.readAsDataURL(file);

    toast({
      title: "Success",
      description: `ID card ${cardType} uploaded successfully`,
    });
  };



  // Handle create worker form submission
  const handleCreateWorker = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!createWorkerForm.name || !createWorkerForm.email || !createWorkerForm.password) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    // ID card attachments are now optional
    // No validation needed since they're optional

    setIsCreatingWorker(true);

    try {
      const workerData: CreateWorkerData = {
        full_name: createWorkerForm.name,
        email: createWorkerForm.email,
        password: createWorkerForm.password,
        phone_number: createWorkerForm.phone || undefined,
        monthly_salary: createWorkerForm.salary ? parseFloat(createWorkerForm.salary) : undefined,
        id_card_front: idCardFront,
        id_card_back: idCardBack
      };

      const response = await createWorker(workerData);

      if (response.success) {
        toast({
          title: "Success",
          description: response.message || "Worker account created successfully",
        });

        // Reset form and close dialog
        resetForm();
        setIsCreateWorkerDialogOpen(false);

        // Reload workers list
        await loadWorkers();
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to create worker account",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsCreatingWorker(false);
    }
  };

  // Reset form function
  const resetForm = () => {
    setCreateWorkerForm({
      name: "",
      email: "",
      password: "",
      phone: "",
      salary: ""
    });
    setIdCardFront(null);
    setIdCardBack(null);
    setIdCardFrontPreview(null);
    setIdCardBackPreview(null);
  };

  // Permission management functions
  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const togglePermission = (section: string, permission: string) => {
    setPermissions(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [permission]: !prev[section][permission]
      }
    }));
  };

  const savePermissions = async () => {
    if (!selectedWorker) return;

    setIsSavingPermissions(true);

    try {
      const response = await updateWorkerPermissions(selectedWorker.worker_id, permissions);

      if (response.success) {
        toast({
          title: "Success",
          description: response.message || `Permissions updated for ${selectedWorker.full_name}`,
        });
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to update permissions",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsSavingPermissions(false);
    }
  };

  // Load permissions when worker is selected
  const loadWorkerPermissions = async (worker: Worker) => {
    setSelectedWorker(worker);

    // Reset expanded sections
    setExpandedSections({
      productInventory: false,
      sales: false,
      transactions: false,
      expenses: false
    });

    try {
      const response = await getWorkerPermissions(worker.worker_id);

      if (response.success && response.data) {
        setPermissions(response.data);
      } else {
        // Set default permissions if none exist
        setPermissions({
          productInventory: {
            viewProducts: false,
            createProduct: false,
            editProduct: false,
            deleteProduct: false,
            manageCategories: false,
            viewStock: false,
            updateStock: false,
            viewReports: false
          },
          sales: {
            viewSales: false,
            createSale: false,
            editSale: false,
            deleteSale: false,
            manageSalesReports: false,
            viewCustomers: false,
            managePayments: false
          },
          transactions: {
            viewTransactions: false,
            createTransaction: false,
            editTransaction: false,
            deleteTransaction: false,
            manageDeposits: false,
            viewFinancialReports: false,
            manageDebtors: false
          },
          expenses: {
            viewExpenses: false,
            createExpense: false,
            editExpense: false,
            deleteExpense: false,
            manageCategories: false,
            viewExpenseReports: false,
            approveExpenses: false
          }
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load worker permissions",
        variant: "destructive"
      });
    }
  };



  // Get status badge component
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Active":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>;
      case "Inactive":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Inactive</Badge>;
      case "On Leave":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">On Leave</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Function to handle opening ID document popup
  const handleViewIdDocuments = (worker: Worker) => {
    setSelectedWorkerForId(worker);
    setIsIdDocumentDialogOpen(true);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Workers Management</h1>
            <p className="text-muted-foreground">Add and manage worker accounts with performance tracking</p>
          </div>
        </div>

        {/* Workers Management Tabs */}
        <Tabs defaultValue="all-workers" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="all-workers" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              All Workers
            </TabsTrigger>
            <TabsTrigger value="roles-permissions" className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Roles & Permissions
            </TabsTrigger>
          </TabsList>

          {/* All Workers Tab */}
          <TabsContent value="all-workers" className="space-y-6">
            {/* Workers List */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>All Workers</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Manage worker accounts and track their performance
                    </p>
                  </div>
                  <Dialog open={isCreateWorkerDialogOpen} onOpenChange={setIsCreateWorkerDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-blue-600 hover:bg-blue-700">
                        <UserPlus className="mr-2 h-4 w-4" />
                        Add Worker
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
                      <DialogHeader className="pb-3">
                        <DialogTitle className="flex items-center gap-2 text-lg">
                          <UserPlus className="h-4 w-4" />
                          Add Worker
                        </DialogTitle>
                        <DialogDescription className="text-sm">
                          Create a new worker account
                        </DialogDescription>
                      </DialogHeader>

                      <form onSubmit={handleCreateWorker} className="space-y-3">
                        {/* Basic Information */}
                        <div className="space-y-3">
                          <div className="space-y-2">
                            <Label htmlFor="name" className="text-sm font-medium">Full Name *</Label>
                            <Input
                              id="name"
                              type="text"
                              placeholder="Enter full name"
                              value={createWorkerForm.name}
                              onChange={(e) => handleInputChange("name", e.target.value)}
                              className="h-9"
                              required
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="email" className="text-sm font-medium">Email Address *</Label>
                            <Input
                              id="email"
                              type="email"
                              placeholder="worker@example.com"
                              value={createWorkerForm.email}
                              onChange={(e) => handleInputChange("email", e.target.value)}
                              className="h-9"
                              required
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="phone" className="text-sm font-medium">Phone Number</Label>
                            <Input
                              id="phone"
                              type="tel"
                              placeholder="+1234567890"
                              value={createWorkerForm.phone}
                              onChange={(e) => handleInputChange("phone", e.target.value)}
                              className="h-9"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="password" className="text-sm font-medium">Password *</Label>
                            <Input
                              id="password"
                              type="password"
                              placeholder="Create password"
                              value={createWorkerForm.password}
                              onChange={(e) => handleInputChange("password", e.target.value)}
                              className="h-9"
                              required
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="salary" className="text-sm font-medium">Monthly Salary ($)</Label>
                            <Input
                              id="salary"
                              type="number"
                              placeholder="4200"
                              value={createWorkerForm.salary}
                              onChange={(e) => handleInputChange("salary", e.target.value)}
                              className="h-9"
                            />
                          </div>
                        </div>

                        {/* ID Card Attachments */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium flex items-center gap-2">
                            <CreditCard className="h-3 w-3" />
                            ID Card Images (Optional)
                          </Label>
                          <div className="grid grid-cols-2 gap-2">
                            {/* Front ID Card */}
                            <div>
                              {!idCardFrontPreview ? (
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-2 text-center hover:border-gray-400 transition-colors">
                                  <Upload className="h-4 w-4 text-gray-400 mx-auto mb-1" />
                                  <p className="text-xs text-gray-600 mb-1">Front</p>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                      if (e.target.files && e.target.files[0]) {
                                        handleIdCardUpload(e.target.files[0], 'front');
                                      }
                                    }}
                                    className="hidden"
                                    id="id-card-front-upload"
                                  />
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="cursor-pointer h-7 text-xs"
                                    onClick={() => {
                                      const input = document.getElementById('id-card-front-upload') as HTMLInputElement;
                                      if (input) {
                                        input.click();
                                      }
                                    }}
                                  >
                                    <Upload className="h-3 w-3 mr-1" />
                                    Choose
                                  </Button>
                                </div>
                              ) : (
                                <div className="relative">
                                  <img
                                    src={idCardFrontPreview}
                                    alt="ID Card Front"
                                    className="w-full h-16 object-cover rounded-lg border-2 border-green-300"
                                  />
                                  <div className="absolute top-1 left-1 bg-green-600 text-white px-1 py-0.5 rounded text-xs font-medium">
                                    FRONT
                                  </div>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="absolute top-1 right-1 h-5 w-5 p-0"
                                    onClick={() => {
                                      setIdCardFront(null);
                                      setIdCardFrontPreview(null);
                                    }}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              )}
                            </div>

                            {/* Back ID Card */}
                            <div>
                              {!idCardBackPreview ? (
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-2 text-center hover:border-gray-400 transition-colors">
                                  <Upload className="h-4 w-4 text-gray-400 mx-auto mb-1" />
                                  <p className="text-xs text-gray-600 mb-1">Back</p>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                      if (e.target.files && e.target.files[0]) {
                                        handleIdCardUpload(e.target.files[0], 'back');
                                      }
                                    }}
                                    className="hidden"
                                    id="id-card-back-upload"
                                  />
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="cursor-pointer h-7 text-xs"
                                    onClick={() => {
                                      const input = document.getElementById('id-card-back-upload') as HTMLInputElement;
                                      if (input) {
                                        input.click();
                                      }
                                    }}
                                  >
                                    <Upload className="h-3 w-3 mr-1" />
                                    Choose
                                  </Button>
                                </div>
                              ) : (
                                <div className="relative">
                                  <img
                                    src={idCardBackPreview}
                                    alt="ID Card Back"
                                    className="w-full h-16 object-cover rounded-lg border-2 border-green-300"
                                  />
                                  <div className="absolute top-1 left-1 bg-green-600 text-white px-1 py-0.5 rounded text-xs font-medium">
                                    BACK
                                  </div>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="absolute top-1 right-1 h-6 w-6 p-0"
                                    onClick={() => {
                                      setIdCardBack(null);
                                      setIdCardBackPreview(null);
                                    }}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Form Actions */}
                        <div className="flex justify-end gap-2 pt-3 border-t">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              resetForm();
                              setIsCreateWorkerDialogOpen(false);
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="submit"
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700"
                            disabled={isCreatingWorker}
                          >
                            <UserPlus className="mr-1 h-3 w-3" />
                            {isCreatingWorker ? 'Adding...' : 'Add Worker'}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {isLoadingWorkers ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Loading workers...</p>
                    </div>
                  ) : workers.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No workers found. Create your first worker to get started.</p>
                    </div>
                  ) : (
                    workers.map((worker) => (
                    <div key={worker.worker_id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="h-6 w-6 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">{worker.full_name}</h3>
                            <p className="text-sm text-muted-foreground">Worker</p>
                            <div className="flex items-center gap-2 mt-1">
                              {getStatusBadge("Active")}
                              <span className="text-xs text-muted-foreground">
                                Created: {new Date(worker.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>

                      {/* Worker Details Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                        <div className="space-y-2">
                          <h4 className="font-medium text-muted-foreground">Contact Info</h4>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Mail className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs">{worker.email}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs">{worker.phone_number || 'Not provided'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs">Joined: {new Date(worker.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <h4 className="font-medium text-muted-foreground">Revenue Performance</h4>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs">Total: ${worker.total_revenue_generated.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs">Salary: ${worker.monthly_salary?.toLocaleString() || 'Not set'}/month</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <h4 className="font-medium text-muted-foreground">ID Documents</h4>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <CreditCard className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs flex items-center gap-1">
                                {worker.id_card_front_url && worker.id_card_back_url ? (
                                  <>
                                    <CheckCircle className="h-3 w-3 text-green-600" />
                                    <span className="text-green-600 font-medium">Complete</span>
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="h-3 w-3 text-orange-600" />
                                    <span className="text-orange-600 font-medium">Incomplete</span>
                                  </>
                                )}
                              </span>
                            </div>
                            {(worker.id_card_front_url || worker.id_card_back_url) && (
                              <div
                                className="text-xs text-blue-600 cursor-pointer hover:underline flex items-center gap-1"
                                onClick={() => handleViewIdDocuments(worker)}
                              >
                                <Eye className="h-3 w-3" />
                                View ID Cards
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Roles and Permissions Tab */}
          <TabsContent value="roles-permissions" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Worker Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Select Worker
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Choose a worker to view their roles and permissions
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Worker List */}
                  <div className="space-y-2">
                    {isLoadingWorkers ? (
                      <div className="text-center py-4">
                        <p className="text-muted-foreground">Loading workers...</p>
                      </div>
                    ) : workers.length === 0 ? (
                      <div className="text-center py-4">
                        <p className="text-muted-foreground">No workers found.</p>
                      </div>
                    ) : (
                      workers.map((worker) => (
                        <div
                          key={worker.worker_id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                          onClick={() => loadWorkerPermissions(worker)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <User className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium">{worker.full_name}</p>
                              <p className="text-sm text-muted-foreground">{worker.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">Worker</Badge>
                            {selectedWorker?.worker_id === worker.worker_id && (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Worker Permissions Preview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {selectedWorker ? `${selectedWorker.full_name}'s Permissions` : 'Worker Permissions'}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {selectedWorker ? `View and manage permissions for ${selectedWorker.full_name}` : 'Select a worker to view their permissions'}
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedWorker ? (
                    <>
                      {/* Worker Info */}
                      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">{selectedWorker.full_name}</p>
                          <p className="text-sm text-muted-foreground">{selectedWorker.email}</p>
                          <Badge variant="outline" className="mt-1">Sales Worker</Badge>
                        </div>
                      </div>

                      {/* Permission Categories */}
                      <div className="space-y-3">
                        {/* Product Inventory Permissions */}
                        <div className="border rounded-lg">
                          <button
                            onClick={() => toggleSection('productInventory')}
                            className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4 text-blue-600" />
                              <span className="font-medium">Product Inventory</span>
                            </div>
                            {expandedSections.productInventory ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </button>
                          {expandedSections.productInventory && (
                            <div className="p-3 border-t bg-muted/20 space-y-3">
                              <div className="grid grid-cols-1 gap-2">
                                {[
                                  { key: 'viewProducts', label: 'View Products' },
                                  { key: 'createProduct', label: 'Create Product' },
                                  { key: 'editProduct', label: 'Edit Product' },
                                  { key: 'deleteProduct', label: 'Delete Product' },
                                  { key: 'manageCategories', label: 'Manage Categories' },
                                  { key: 'viewStock', label: 'View Stock' },
                                  { key: 'updateStock', label: 'Update Stock' },
                                  { key: 'viewReports', label: 'View Reports' }
                                ].map((permission) => (
                                  <div key={permission.key} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`productInventory-${permission.key}`}
                                      checked={permissions.productInventory[permission.key]}
                                      onCheckedChange={() => togglePermission('productInventory', permission.key)}
                                    />
                                    <Label htmlFor={`productInventory-${permission.key}`} className="text-sm">
                                      {permission.label}
                                    </Label>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Sales Permissions */}
                        <div className="border rounded-lg">
                          <button
                            onClick={() => toggleSection('sales')}
                            className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <ShoppingCart className="h-4 w-4 text-green-600" />
                              <span className="font-medium">Sales</span>
                            </div>
                            {expandedSections.sales ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </button>
                          {expandedSections.sales && (
                            <div className="p-3 border-t bg-muted/20 space-y-3">
                              <div className="grid grid-cols-1 gap-2">
                                {[
                                  { key: 'viewSales', label: 'View Sales' },
                                  { key: 'createSale', label: 'Create Sale' },
                                  { key: 'editSale', label: 'Edit Sale' },
                                  { key: 'deleteSale', label: 'Delete Sale' },
                                  { key: 'manageSalesReports', label: 'Manage Sales Reports' },
                                  { key: 'viewCustomers', label: 'View Customers' },
                                  { key: 'managePayments', label: 'Manage Payments' }
                                ].map((permission) => (
                                  <div key={permission.key} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`sales-${permission.key}`}
                                      checked={permissions.sales[permission.key]}
                                      onCheckedChange={() => togglePermission('sales', permission.key)}
                                    />
                                    <Label htmlFor={`sales-${permission.key}`} className="text-sm">
                                      {permission.label}
                                    </Label>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Transactions Permissions */}
                        <div className="border rounded-lg">
                          <button
                            onClick={() => toggleSection('transactions')}
                            className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <TransactionIcon className="h-4 w-4 text-purple-600" />
                              <span className="font-medium">Transactions</span>
                            </div>
                            {expandedSections.transactions ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </button>
                          {expandedSections.transactions && (
                            <div className="p-3 border-t bg-muted/20 space-y-3">
                              <div className="grid grid-cols-1 gap-2">
                                {[
                                  { key: 'viewTransactions', label: 'View Transactions' },
                                  { key: 'createTransaction', label: 'Create Transaction' },
                                  { key: 'editTransaction', label: 'Edit Transaction' },
                                  { key: 'deleteTransaction', label: 'Delete Transaction' },
                                  { key: 'manageDeposits', label: 'Manage Deposits' },
                                  { key: 'viewFinancialReports', label: 'View Financial Reports' },
                                  { key: 'manageDebtors', label: 'Manage Debtors' }
                                ].map((permission) => (
                                  <div key={permission.key} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`transactions-${permission.key}`}
                                      checked={permissions.transactions[permission.key]}
                                      onCheckedChange={() => togglePermission('transactions', permission.key)}
                                    />
                                    <Label htmlFor={`transactions-${permission.key}`} className="text-sm">
                                      {permission.label}
                                    </Label>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Expenses Permissions */}
                        <div className="border rounded-lg">
                          <button
                            onClick={() => toggleSection('expenses')}
                            className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <Receipt className="h-4 w-4 text-orange-600" />
                              <span className="font-medium">Expenses</span>
                            </div>
                            {expandedSections.expenses ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </button>
                          {expandedSections.expenses && (
                            <div className="p-3 border-t bg-muted/20 space-y-3">
                              <div className="grid grid-cols-1 gap-2">
                                {[
                                  { key: 'viewExpenses', label: 'View Expenses' },
                                  { key: 'createExpense', label: 'Create Expense' },
                                  { key: 'editExpense', label: 'Edit Expense' },
                                  { key: 'deleteExpense', label: 'Delete Expense' },
                                  { key: 'manageCategories', label: 'Manage Categories' },
                                  { key: 'viewExpenseReports', label: 'View Expense Reports' },
                                  { key: 'approveExpenses', label: 'Approve Expenses' }
                                ].map((permission) => (
                                  <div key={permission.key} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`expenses-${permission.key}`}
                                      checked={permissions.expenses[permission.key]}
                                      onCheckedChange={() => togglePermission('expenses', permission.key)}
                                    />
                                    <Label htmlFor={`expenses-${permission.key}`} className="text-sm">
                                      {permission.label}
                                    </Label>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Save Permissions Button */}
                      <div className="pt-4 border-t">
                        <Button
                          onClick={savePermissions}
                          className="w-full bg-blue-600 hover:bg-blue-700"
                          disabled={isSavingPermissions}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          {isSavingPermissions ? 'Saving...' : `Save ${selectedWorker.full_name}'s Permissions`}
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Select a worker from the left to view their roles and permissions</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* ID Document Popup Dialog */}
        <Dialog open={isIdDocumentDialogOpen} onOpenChange={setIsIdDocumentDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                ID Documents - {selectedWorkerForId?.full_name}
              </DialogTitle>
              <DialogDescription>
                View worker's identification documents
              </DialogDescription>
            </DialogHeader>

            {selectedWorkerForId && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Front ID Card */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-medium">ID Card - Front</h3>
                    {selectedWorkerForId.id_card_front_url ? (
                      <div className="border rounded-lg overflow-hidden">
                        <img
                          src={selectedWorkerForId.id_card_front_url}
                          alt="ID Card Front"
                          className="w-full h-auto object-contain max-h-96 rounded-lg"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              parent.innerHTML = `
                                <div class="flex flex-col items-center justify-center p-8 text-gray-500">
                                  <svg class="h-12 w-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                                  </svg>
                                  <p>Failed to load image</p>
                                </div>
                              `;
                            }
                          }}
                        />
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                        <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500">No front ID card uploaded</p>
                      </div>
                    )}
                  </div>

                  {/* Back ID Card */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-medium">ID Card - Back</h3>
                    {selectedWorkerForId.id_card_back_url ? (
                      <div className="border rounded-lg overflow-hidden">
                        <img
                          src={selectedWorkerForId.id_card_back_url}
                          alt="ID Card Back"
                          className="w-full h-auto object-contain max-h-96 rounded-lg"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              parent.innerHTML = `
                                <div class="flex flex-col items-center justify-center p-8 text-gray-500">
                                  <svg class="h-12 w-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                                  </svg>
                                  <p>Failed to load image</p>
                                </div>
                              `;
                            }
                          }}
                        />
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                        <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500">No back ID card uploaded</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Worker Information */}
                <div className="border-t pt-4">
                  <h3 className="text-lg font-medium mb-3">Worker Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-600">Full Name:</span>
                      <span className="ml-2">{selectedWorkerForId.full_name}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Email:</span>
                      <span className="ml-2">{selectedWorkerForId.email}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Phone:</span>
                      <span className="ml-2">{selectedWorkerForId.phone_number || 'Not provided'}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Joined:</span>
                      <span className="ml-2">{new Date(selectedWorkerForId.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button variant="outline" onClick={() => setIsIdDocumentDialogOpen(false)}>
                    Close
                  </Button>
                  {selectedWorkerForId.id_card_front_url && (
                    <Button
                      variant="outline"
                      onClick={() => window.open(selectedWorkerForId.id_card_front_url, '_blank')}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Front Full Size
                    </Button>
                  )}
                  {selectedWorkerForId.id_card_back_url && (
                    <Button
                      variant="outline"
                      onClick={() => window.open(selectedWorkerForId.id_card_back_url, '_blank')}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Back Full Size
                    </Button>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default Staff;
