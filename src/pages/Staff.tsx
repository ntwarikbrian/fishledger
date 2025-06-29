import React, { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
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
  CheckSquare,
  Plus,
  AlertCircle,
  CheckCircle,
  XCircle,
  Timer,
  Flag,
  Search,
  Filter
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

  // State for task management
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    assignedTo: "",
    priority: "",
    dueDate: "",
    category: ""
  });
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);

  // Mock data for existing workers with login and revenue data
  const workersData = [
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

  // Mock data for tasks
  const tasksData = [
    {
      id: 1,
      title: "Update Fish Inventory System",
      description: "Review and update the current fish inventory tracking system to improve accuracy",
      assignedTo: "John Smith",
      assignedToId: 1,
      priority: "High",
      status: "In Progress",
      category: "System Management",
      dueDate: "2024-01-25",
      createdDate: "2024-01-20",
      completedDate: null,
      progress: 65
    },
    {
      id: 2,
      title: "Customer Service Training",
      description: "Complete customer service training module for better customer interaction",
      assignedTo: "Maria Rodriguez",
      assignedToId: 2,
      priority: "Medium",
      status: "Pending",
      category: "Training",
      dueDate: "2024-01-28",
      createdDate: "2024-01-22",
      completedDate: null,
      progress: 0
    },
    {
      id: 3,
      title: "Delivery Route Optimization",
      description: "Analyze and optimize delivery routes to reduce time and fuel costs",
      assignedTo: "David Chen",
      assignedToId: 3,
      priority: "Medium",
      status: "Completed",
      category: "Operations",
      dueDate: "2024-01-20",
      createdDate: "2024-01-15",
      completedDate: "2024-01-19",
      progress: 100
    },
    {
      id: 4,
      title: "Quality Control Checklist Update",
      description: "Update the quality control checklist based on new fish handling standards",
      assignedTo: "John Smith",
      assignedToId: 1,
      priority: "High",
      status: "Overdue",
      category: "Quality Control",
      dueDate: "2024-01-18",
      createdDate: "2024-01-10",
      completedDate: null,
      progress: 30
    },
    {
      id: 5,
      title: "Monthly Sales Report",
      description: "Prepare comprehensive monthly sales report with analytics and insights",
      assignedTo: "Maria Rodriguez",
      assignedToId: 2,
      priority: "Low",
      status: "In Progress",
      category: "Reporting",
      dueDate: "2024-01-30",
      createdDate: "2024-01-23",
      completedDate: null,
      progress: 45
    }
  ];

  // Handle form input changes
  const handleInputChange = (field: string, value: string) => {
    setCreateWorkerForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle ID card files upload (both front and back)
  const handleIdCardUpload = (files: FileList) => {
    // Validate number of files
    if (files.length !== 2) {
      toast({
        title: "Error",
        description: "Please select exactly 2 images (front and back of ID card)",
        variant: "destructive"
      });
      return;
    }

    const fileArray = Array.from(files);

    // Validate file types
    const invalidFiles = fileArray.filter(file => !file.type.startsWith('image/'));
    if (invalidFiles.length > 0) {
      toast({
        title: "Error",
        description: "Please select only image files for ID card",
        variant: "destructive"
      });
      return;
    }

    // Validate file sizes (max 5MB each)
    const oversizedFiles = fileArray.filter(file => file.size > 5 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      toast({
        title: "Error",
        description: "Each image file should be less than 5MB",
        variant: "destructive"
      });
      return;
    }

    // Set files (first as front, second as back)
    const [frontFile, backFile] = fileArray;

    // Create previews for both files
    const frontReader = new FileReader();
    const backReader = new FileReader();

    frontReader.onload = (e) => {
      setIdCardFront(frontFile);
      setIdCardFrontPreview(e.target?.result as string);
    };

    backReader.onload = (e) => {
      setIdCardBack(backFile);
      setIdCardBackPreview(e.target?.result as string);
    };

    frontReader.readAsDataURL(frontFile);
    backReader.readAsDataURL(backFile);

    toast({
      title: "Success",
      description: "ID card images uploaded successfully",
    });
  };

  // Remove all ID cards
  const removeAllIdCards = () => {
    setIdCardFront(null);
    setIdCardBack(null);
    setIdCardFrontPreview(null);
    setIdCardBackPreview(null);
  };

  // Handle create worker form submission
  const handleCreateWorker = (e: React.FormEvent) => {
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

    // Validate ID card attachments
    if (!idCardFront || !idCardBack) {
      toast({
        title: "Error",
        description: "Please attach both front and back of ID card",
        variant: "destructive"
      });
      return;
    }

    // Simulate API call with ID card files
    console.log("Creating worker:", {
      ...createWorkerForm,
      idCardFront: idCardFront.name,
      idCardBack: idCardBack.name
    });

    toast({
      title: "Success",
      description: "Worker account created successfully with ID card attachments",
    });

    // Reset form
    resetForm();
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

  // Task management functions
  const handleTaskInputChange = (field: string, value: string) => {
    setNewTask(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!newTask.title || !newTask.assignedTo || !newTask.dueDate) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    // Simulate API call
    console.log("Creating task:", newTask);

    toast({
      title: "Success",
      description: "Task assigned successfully",
    });

    // Reset task form and close dialog
    setNewTask({
      title: "",
      description: "",
      assignedTo: "",
      priority: "",
      dueDate: "",
      category: ""
    });
    setIsTaskDialogOpen(false);
  };

  const getTaskStatusBadge = (status: string) => {
    switch (status) {
      case "Completed":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Completed</Badge>;
      case "In Progress":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">In Progress</Badge>;
      case "Pending":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>;
      case "Overdue":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Overdue</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "High":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">High</Badge>;
      case "Medium":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Medium</Badge>;
      case "Low":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Low</Badge>;
      default:
        return <Badge variant="secondary">{priority}</Badge>;
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

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Workers Management</h1>
            <p className="text-muted-foreground">Create and manage worker accounts with performance tracking</p>
          </div>
        </div>

        {/* Workers Management Tabs */}
        <Tabs defaultValue="all-workers" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all-workers" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              All Workers
            </TabsTrigger>
            <TabsTrigger value="create-worker" className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Create Worker
            </TabsTrigger>
            <TabsTrigger value="tasks" className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4" />
              Tasks
            </TabsTrigger>
          </TabsList>

          {/* All Workers Tab */}
          <TabsContent value="all-workers" className="space-y-6">
            {/* Workers List */}
            <Card>
              <CardHeader>
                <CardTitle>All Workers</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Manage worker accounts and track their performance
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {workersData.map((worker) => (
                    <div key={worker.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="h-6 w-6 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">{worker.name}</h3>
                            <p className="text-sm text-muted-foreground">{worker.role}</p>
                            <div className="flex items-center gap-2 mt-1">
                              {getStatusBadge(worker.status)}
                              <span className="text-xs text-muted-foreground">
                                Created: {worker.createdDate}
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
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        <div className="space-y-2">
                          <h4 className="font-medium text-muted-foreground">Contact Info</h4>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Mail className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs">{worker.email}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs">{worker.phone}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Building className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs">{worker.department}</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <h4 className="font-medium text-muted-foreground">Login Activity</h4>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs">Last: {worker.lastLogin}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <LogIn className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs">Total: {worker.totalLogins} logins</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <h4 className="font-medium text-muted-foreground">Revenue Performance</h4>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs">Total: ${worker.revenueGenerated.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <TrendingUp className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs">Monthly: ${worker.monthlyRevenue.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs">Salary: ${worker.salary.toLocaleString()}/month</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <h4 className="font-medium text-muted-foreground">Recent Login History</h4>
                          <div className="space-y-1">
                            {worker.loginHistory.slice(0, 3).map((login, index) => (
                              <div key={index} className="text-xs">
                                <span className="text-muted-foreground">{login.date}</span>
                                <span className="ml-2">{login.time}</span>
                                <span className="ml-2 text-blue-600">({login.duration})</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Create Worker Tab */}
          <TabsContent value="create-worker" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Create New Worker Account
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Add a new worker to your fish selling management system
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateWorker} className="space-y-6">
                  {/* Personal Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Personal Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name *</Label>
                        <Input
                          id="name"
                          type="text"
                          placeholder="Enter worker's full name"
                          value={createWorkerForm.name}
                          onChange={(e) => handleInputChange("name", e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address *</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="worker@fishsales.com"
                          value={createWorkerForm.email}
                          onChange={(e) => handleInputChange("email", e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="+1 (555) 123-4567"
                          value={createWorkerForm.phone}
                          onChange={(e) => handleInputChange("phone", e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="password">Password *</Label>
                        <Input
                          id="password"
                          type="password"
                          placeholder="Create a secure password"
                          value={createWorkerForm.password}
                          onChange={(e) => handleInputChange("password", e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Work Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Work Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="salary">Monthly Salary ($)</Label>
                        <Input
                          id="salary"
                          type="number"
                          placeholder="4200"
                          value={createWorkerForm.salary}
                          onChange={(e) => handleInputChange("salary", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* ID Card Attachments */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      ID Card Attachments *
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Please select exactly 2 images: front and back of the worker's ID card (first image = front, second image = back)
                    </p>

                    {/* Single Upload Interface */}
                    {!idCardFrontPreview && !idCardBackPreview ? (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                        <Upload className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <h4 className="text-lg font-semibold mb-2">Upload ID Card Images</h4>
                        <p className="text-sm text-gray-600 mb-2">Select both front and back images at once</p>
                        <p className="text-xs text-gray-500 mb-4">
                          PNG, JPG up to 5MB each • First image = Front, Second image = Back
                        </p>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(e) => {
                            if (e.target.files && e.target.files.length > 0) {
                              handleIdCardUpload(e.target.files);
                            }
                          }}
                          className="hidden"
                          id="id-cards-upload"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="lg"
                          className="cursor-pointer"
                          onClick={() => {
                            const input = document.getElementById('id-cards-upload') as HTMLInputElement;
                            if (input) {
                              input.click();
                            }
                          }}
                        >
                          <Image className="h-5 w-5 mr-2" />
                          Select 2 Images (Front & Back)
                        </Button>
                      </div>
                    ) : (
                      /* Preview Both Images */
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h4 className="text-md font-medium">ID Card Images</h4>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={removeAllIdCards}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="h-4 w-4 mr-1" />
                            Remove All
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Front ID Card Preview */}
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-green-600">✓ Front of ID Card</Label>
                            {idCardFrontPreview && (
                              <div className="relative">
                                <img
                                  src={idCardFrontPreview}
                                  alt="ID Card Front"
                                  className="w-full h-48 object-cover rounded-lg border-2 border-green-300"
                                />
                                <div className="absolute top-2 left-2 bg-green-600 text-white px-2 py-1 rounded text-xs font-medium">
                                  FRONT
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Back ID Card Preview */}
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-green-600">✓ Back of ID Card</Label>
                            {idCardBackPreview && (
                              <div className="relative">
                                <img
                                  src={idCardBackPreview}
                                  alt="ID Card Back"
                                  className="w-full h-48 object-cover rounded-lg border-2 border-green-300"
                                />
                                <div className="absolute top-2 left-2 bg-green-600 text-white px-2 py-1 rounded text-xs font-medium">
                                  BACK
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Re-upload Option */}
                        <div className="text-center pt-4 border-t">
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={(e) => {
                              if (e.target.files && e.target.files.length > 0) {
                                handleIdCardUpload(e.target.files);
                              }
                            }}
                            className="hidden"
                            id="id-cards-reupload"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            className="cursor-pointer"
                            onClick={() => {
                              const input = document.getElementById('id-cards-reupload') as HTMLInputElement;
                              if (input) {
                                input.click();
                              }
                            }}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Replace Images
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Form Actions */}
                  <div className="flex justify-end gap-4 pt-4 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={resetForm}
                    >
                      Clear Form
                    </Button>
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                      <UserPlus className="mr-2 h-4 w-4" />
                      Create Worker Account
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks" className="space-y-6">
            {/* Header with Create Task Button and Overview */}
            <div className="flex justify-between items-start gap-6">
              <div className="flex-1">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h2 className="text-2xl font-bold">Task Management</h2>
                    <p className="text-muted-foreground">Assign and monitor tasks for your workers</p>
                  </div>

                  {/* Create Task Dialog */}
                  <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="mr-2 h-4 w-4" />
                        Create New Task
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <CheckSquare className="h-5 w-5" />
                          Assign New Task
                        </DialogTitle>
                        <DialogDescription>
                          Create and assign a new task to one of your workers
                        </DialogDescription>
                      </DialogHeader>

                      <form onSubmit={handleCreateTask} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="task-title">Task Title *</Label>
                          <Input
                            id="task-title"
                            type="text"
                            placeholder="Enter task title"
                            value={newTask.title}
                            onChange={(e) => handleTaskInputChange("title", e.target.value)}
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="task-description">Description</Label>
                          <Input
                            id="task-description"
                            type="text"
                            placeholder="Task description"
                            value={newTask.description}
                            onChange={(e) => handleTaskInputChange("description", e.target.value)}
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="assign-to">Assign To *</Label>
                            <Select onValueChange={(value) => handleTaskInputChange("assignedTo", value)}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select worker" />
                              </SelectTrigger>
                              <SelectContent>
                                {workersData.map((worker) => (
                                  <SelectItem key={worker.id} value={worker.name}>
                                    {worker.name} - {worker.role}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="priority">Priority</Label>
                            <Select onValueChange={(value) => handleTaskInputChange("priority", value)}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select priority" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="High">High</SelectItem>
                                <SelectItem value="Medium">Medium</SelectItem>
                                <SelectItem value="Low">Low</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="due-date">Due Date *</Label>
                            <Input
                              id="due-date"
                              type="date"
                              value={newTask.dueDate}
                              onChange={(e) => handleTaskInputChange("dueDate", e.target.value)}
                              required
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="category">Category</Label>
                            <Select onValueChange={(value) => handleTaskInputChange("category", value)}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="System Management">System Management</SelectItem>
                                <SelectItem value="Training">Training</SelectItem>
                                <SelectItem value="Operations">Operations</SelectItem>
                                <SelectItem value="Quality Control">Quality Control</SelectItem>
                                <SelectItem value="Reporting">Reporting</SelectItem>
                                <SelectItem value="Customer Service">Customer Service</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="flex justify-end gap-4 pt-4 border-t">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setNewTask({
                                title: "",
                                description: "",
                                assignedTo: "",
                                priority: "",
                                dueDate: "",
                                category: ""
                              });
                              setIsTaskDialogOpen(false);
                            }}
                          >
                            Cancel
                          </Button>
                          <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                            <CheckSquare className="mr-2 h-4 w-4" />
                            Assign Task
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Compact Task Overview */}
                <div className="grid grid-cols-4 gap-3">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-xl font-bold text-blue-600">
                      {tasksData.filter(task => task.status === "In Progress").length}
                    </div>
                    <p className="text-xs text-blue-600">In Progress</p>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 rounded-lg">
                    <div className="text-xl font-bold text-yellow-600">
                      {tasksData.filter(task => task.status === "Pending").length}
                    </div>
                    <p className="text-xs text-yellow-600">Pending</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-xl font-bold text-green-600">
                      {tasksData.filter(task => task.status === "Completed").length}
                    </div>
                    <p className="text-xs text-green-600">Completed</p>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <div className="text-xl font-bold text-red-600">
                      {tasksData.filter(task => task.status === "Overdue").length}
                    </div>
                    <p className="text-xs text-red-600">Overdue</p>
                  </div>
                </div>
              </div>
            </div>

            {/* All Tasks List */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>All Tasks</CardTitle>
                  <div className="flex gap-2">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Search tasks..." className="pl-8 w-64" />
                    </div>
                    <Select>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="overdue">Overdue</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="icon">
                      <Filter className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tasksData.map((task) => (
                    <div key={task.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-lg">{task.title}</h3>
                            {getTaskStatusBadge(task.status)}
                            {getPriorityBadge(task.priority)}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
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
                        </div>
                      </div>

                      {/* Task Details Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                        <div className="space-y-1">
                          <h4 className="font-medium text-muted-foreground">Assigned To</h4>
                          <div className="flex items-center gap-2">
                            <User className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs">{task.assignedTo}</span>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <h4 className="font-medium text-muted-foreground">Due Date</h4>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs">{task.dueDate}</span>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <h4 className="font-medium text-muted-foreground">Category</h4>
                          <div className="flex items-center gap-2">
                            <Flag className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs">{task.category}</span>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <h4 className="font-medium text-muted-foreground">Progress</h4>
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span>{task.progress}%</span>
                              <span className="text-muted-foreground">
                                {task.status === "Completed" ? "Done" : "In Progress"}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  task.status === "Completed" ? "bg-green-600" :
                                  task.status === "Overdue" ? "bg-red-600" :
                                  "bg-blue-600"
                                }`}
                                style={{ width: `${task.progress}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Staff;
