import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  DollarSign, 
  PlusCircle, 
  Search, 
  Filter, 
  Edit, 
  Eye, 
  Calendar,
  TrendingUp,
  TrendingDown,
  Receipt,
  CreditCard,
  Building,
  Truck,
  Fuel,
  Wrench,
  Users,
  FileText
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DocumentAttachmentCompact } from "@/components/ui/document-attachment";

const Expenses = () => {
  // Mock data for expenses
  const expensesData = [
    {
      id: 1,
      description: "Fuel for delivery trucks",
      category: "Transportation",
      amount: 450.75,
      date: "2024-01-22",
      vendor: "City Gas Station",
      paymentMethod: "Credit Card",
      status: "Paid",
      receipt: "RCP-001-2024",
      approvedBy: "John Smith",
      department: "Logistics"
    },
    {
      id: 2,
      description: "Ice machine maintenance",
      category: "Equipment Maintenance",
      amount: 275.00,
      date: "2024-01-21",
      vendor: "Cool Tech Services",
      paymentMethod: "Bank Transfer",
      status: "Paid",
      receipt: "RCP-002-2024",
      approvedBy: "Maria Rodriguez",
      department: "Operations"
    },
    {
      id: 3,
      description: "Office supplies and stationery",
      category: "Office Supplies",
      amount: 125.50,
      date: "2024-01-20",
      vendor: "Office Depot",
      paymentMethod: "Credit Card",
      status: "Pending",
      receipt: "RCP-003-2024",
      approvedBy: "Sarah Johnson",
      department: "Administration"
    },
    {
      id: 4,
      description: "Refrigeration unit repair",
      category: "Equipment Maintenance",
      amount: 850.00,
      date: "2024-01-19",
      vendor: "Arctic Repair Co.",
      paymentMethod: "Check",
      status: "Paid",
      receipt: "RCP-004-2024",
      approvedBy: "John Smith",
      department: "Operations"
    },
    {
      id: 5,
      description: "Marketing materials printing",
      category: "Marketing",
      amount: 320.25,
      date: "2024-01-18",
      vendor: "Print Pro",
      paymentMethod: "Credit Card",
      status: "Pending Approval",
      receipt: "RCP-005-2024",
      approvedBy: "Pending",
      department: "Sales"
    }
  ];

  // Calculate expense statistics
  const expenseStats = {
    totalExpenses: expensesData.reduce((sum, expense) => sum + expense.amount, 0),
    paidExpenses: expensesData.filter(expense => expense.status === "Paid").reduce((sum, expense) => sum + expense.amount, 0),
    pendingExpenses: expensesData.filter(expense => expense.status === "Pending" || expense.status === "Pending Approval").reduce((sum, expense) => sum + expense.amount, 0),
    monthlyAverage: expensesData.reduce((sum, expense) => sum + expense.amount, 0) / 12 // Assuming monthly average
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Paid":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Paid</Badge>;
      case "Pending":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>;
      case "Pending Approval":
        return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">Pending Approval</Badge>;
      case "Rejected":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Transportation":
        return <Truck className="h-4 w-4" />;
      case "Equipment Maintenance":
        return <Wrench className="h-4 w-4" />;
      case "Office Supplies":
        return <FileText className="h-4 w-4" />;
      case "Marketing":
        return <TrendingUp className="h-4 w-4" />;
      case "Utilities":
        return <Building className="h-4 w-4" />;
      case "Staff":
        return <Users className="h-4 w-4" />;
      default:
        return <Receipt className="h-4 w-4" />;
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Expense Management</h1>
            <p className="text-muted-foreground">Track and manage business expenses</p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Expense
          </Button>
        </div>

        {/* Expense Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="hover-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${expenseStats.totalExpenses.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">All recorded expenses</p>
            </CardContent>
          </Card>
          
          <Card className="hover-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Paid Expenses</CardTitle>
              <TrendingDown className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${expenseStats.paidExpenses.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Successfully processed</p>
            </CardContent>
          </Card>
          
          <Card className="hover-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending Expenses</CardTitle>
              <Calendar className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${expenseStats.pendingExpenses.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Awaiting processing</p>
            </CardContent>
          </Card>

          <Card className="hover-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Monthly Average</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${expenseStats.monthlyAverage.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Average per month</p>
            </CardContent>
          </Card>
        </div>

        {/* Expense Management Tabs */}
        <Tabs defaultValue="list" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="list">Expense List</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="reports">Reports & Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Expense Records</CardTitle>
                  <div className="flex gap-2">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Search expenses..." className="pl-8 w-64" />
                    </div>
                    <Select>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="transportation">Transportation</SelectItem>
                        <SelectItem value="maintenance">Equipment Maintenance</SelectItem>
                        <SelectItem value="office">Office Supplies</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="utilities">Utilities</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approval">Pending Approval</SelectItem>
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
                  {expensesData.map((expense) => (
                    <div key={expense.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              {getCategoryIcon(expense.category)}
                            </div>
                            <div>
                              <h3 className="font-semibold">{expense.description}</h3>
                              <p className="text-sm text-muted-foreground">{expense.category}</p>
                            </div>
                            {getStatusBadge(expense.status)}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                                <span className="font-semibold">${expense.amount.toFixed(2)}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span>{expense.date}</span>
                              </div>
                            </div>
                            
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Building className="h-4 w-4 text-muted-foreground" />
                                <span>{expense.vendor}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <CreditCard className="h-4 w-4 text-muted-foreground" />
                                <span>{expense.paymentMethod}</span>
                              </div>
                            </div>
                            
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Receipt className="h-4 w-4 text-muted-foreground" />
                                <span>{expense.receipt}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                <span>{expense.department}</span>
                              </div>
                            </div>
                            
                            <div className="space-y-1">
                              <div className="text-xs text-muted-foreground">Approved by:</div>
                              <div className="font-medium">{expense.approvedBy}</div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-2">
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
                          <DocumentAttachmentCompact
                            entityType="Expense"
                            entityId={expense.receipt}
                            documents={[]}
                            onAttach={(files) => {
                              console.log('Attaching files to expense:', expense.id, files);
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categories" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Expense Categories</CardTitle>
                <p className="text-sm text-muted-foreground">Manage and organize expense categories</p>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Category Management</h3>
                  <p className="text-muted-foreground mb-4">
                    Expense category management features will be implemented here
                  </p>
                  <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Category
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Reports & Analytics</CardTitle>
                <p className="text-sm text-muted-foreground">Analyze expense patterns and generate reports</p>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Expense Analytics</h3>
                  <p className="text-muted-foreground mb-4">
                    Expense reporting and analytics features will be implemented here
                  </p>
                  <Button>
                    <FileText className="mr-2 h-4 w-4" />
                    Generate Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Expenses;
