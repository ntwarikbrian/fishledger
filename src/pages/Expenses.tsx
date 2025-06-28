import React, { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  DollarSign,
  Plus,
  FileText,
  Search,
  Edit,
  Trash2,
  Calendar,
  Receipt,
  TrendingUp,
  Filter,
  Tag,
  Building,
  Car,
  Utensils,
  Zap,
  Wifi,
  Phone,
  Wrench,
  ShoppingCart,
  Users,
  Briefcase
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Types for expenses
interface ExpenseCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  totalBudget?: number;
  spent: number;
}

interface Expense {
  id: string;
  title: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  receipt?: string;
  vendor?: string;
  status: 'pending' | 'approved' | 'paid' | 'rejected';
}

const Expenses = () => {
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Mock data for expense categories
  const expenseCategories: ExpenseCategory[] = [
    {
      id: "office-supplies",
      name: "Office Supplies",
      description: "Stationery, equipment, and office materials",
      icon: Briefcase,
      color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
      totalBudget: 2000,
      spent: 1250
    },
    {
      id: "utilities",
      name: "Utilities",
      description: "Electricity, water, internet, and phone bills",
      icon: Zap,
      color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
      totalBudget: 1500,
      spent: 890
    },
    {
      id: "transportation",
      name: "Transportation",
      description: "Vehicle maintenance, fuel, and delivery costs",
      icon: Car,
      color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      totalBudget: 3000,
      spent: 2100
    },
    {
      id: "maintenance",
      name: "Maintenance & Repairs",
      description: "Equipment repairs and facility maintenance",
      icon: Wrench,
      color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
      totalBudget: 2500,
      spent: 1800
    },
    {
      id: "marketing",
      name: "Marketing & Advertising",
      description: "Promotional materials and advertising costs",
      icon: TrendingUp,
      color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
      totalBudget: 1800,
      spent: 950
    },
    {
      id: "food-beverage",
      name: "Food & Beverage",
      description: "Staff meals and business entertainment",
      icon: Utensils,
      color: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400",
      totalBudget: 800,
      spent: 420
    }
  ];

  // Mock data for expenses
  const expenses: Expense[] = [
    {
      id: "exp-001",
      title: "Office Printer Paper",
      description: "A4 paper for office printing needs",
      amount: 85.50,
      category: "office-supplies",
      date: "2024-01-15",
      vendor: "Office Depot",
      status: "paid"
    },
    {
      id: "exp-002",
      title: "Monthly Internet Bill",
      description: "High-speed internet service for January",
      amount: 120.00,
      category: "utilities",
      date: "2024-01-10",
      vendor: "TechNet ISP",
      status: "paid"
    },
    {
      id: "exp-003",
      title: "Vehicle Fuel",
      description: "Fuel for delivery truck",
      amount: 95.75,
      category: "transportation",
      date: "2024-01-12",
      vendor: "Shell Gas Station",
      status: "approved"
    },
    {
      id: "exp-004",
      title: "Refrigeration Unit Repair",
      description: "Emergency repair for main storage refrigerator",
      amount: 450.00,
      category: "maintenance",
      date: "2024-01-08",
      vendor: "CoolTech Repairs",
      status: "pending"
    },
    {
      id: "exp-005",
      title: "Social Media Ads",
      description: "Facebook and Instagram advertising campaign",
      amount: 200.00,
      category: "marketing",
      date: "2024-01-05",
      vendor: "Meta Business",
      status: "paid"
    }
  ];

  // Get category by ID
  const getCategoryById = (id: string) => {
    return expenseCategories.find(cat => cat.id === id);
  };

  // Filter expenses by category
  const filteredExpenses = selectedCategory === "all"
    ? expenses
    : expenses.filter(expense => expense.category === selectedCategory);

  // Calculate total expenses
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const monthlyBudget = expenseCategories.reduce((sum, cat) => sum + (cat.totalBudget || 0), 0);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Expenses Management</h1>
          <p className="text-muted-foreground">Track and manage business expenses across different categories</p>
        </div>



        {/* Expense Management Tabs */}
        <Tabs defaultValue="all-expenses" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all-expenses">
              <FileText className="mr-2 h-4 w-4" />
              All Expenses
            </TabsTrigger>
            <TabsTrigger value="add-expense">
              <Plus className="mr-2 h-4 w-4" />
              Add Expenses
            </TabsTrigger>
            <TabsTrigger value="categories">
              <Tag className="mr-2 h-4 w-4" />
              Categories
            </TabsTrigger>
          </TabsList>

          {/* Categories Tab */}
          <TabsContent value="categories" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                  <div>
                    <CardTitle>Expense Categories</CardTitle>
                    <p className="text-sm text-muted-foreground">Manage expense categories and budgets</p>
                  </div>
                  <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Category
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Add New Category</DialogTitle>
                        <DialogDescription>
                          Create a new expense category with budget allocation
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="category-name" className="text-right">
                            Name
                          </Label>
                          <Input
                            id="category-name"
                            placeholder="Category name"
                            className="col-span-3"
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="category-description" className="text-right">
                            Description
                          </Label>
                          <Textarea
                            id="category-description"
                            placeholder="Category description"
                            className="col-span-3"
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="category-budget" className="text-right">
                            Budget
                          </Label>
                          <Input
                            id="category-budget"
                            type="number"
                            placeholder="0.00"
                            className="col-span-3"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                          Create Category
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {expenseCategories.map((category) => {
                    const IconComponent = category.icon;
                    const budgetUsed = category.totalBudget ? (category.spent / category.totalBudget) * 100 : 0;

                    return (
                      <Card key={category.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                                <IconComponent className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-sm">{category.name}</h3>
                                <p className="text-xs text-muted-foreground">{category.description}</p>
                              </div>
                            </div>
                            <div className="flex space-x-1">
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Spent: ${category.spent.toFixed(2)}</span>
                              {category.totalBudget && (
                                <span>Budget: ${category.totalBudget.toFixed(2)}</span>
                              )}
                            </div>
                            {category.totalBudget && (
                              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full ${
                                    budgetUsed > 90 ? 'bg-red-500' :
                                    budgetUsed > 70 ? 'bg-yellow-500' : 'bg-green-500'
                                  }`}
                                  style={{ width: `${Math.min(budgetUsed, 100)}%` }}
                                ></div>
                              </div>
                            )}
                            <p className="text-xs text-muted-foreground">
                              {category.totalBudget ? `${budgetUsed.toFixed(1)}% of budget used` : 'No budget set'}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* All Expenses Tab */}
          <TabsContent value="all-expenses" className="space-y-4">
            {/* Overview Cards - Only in All Expenses Tab */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${totalExpenses.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground">This month</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Monthly Budget</CardTitle>
                  <Receipt className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${monthlyBudget.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground">
                    {((totalExpenses / monthlyBudget) * 100).toFixed(1)}% used
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Categories</CardTitle>
                  <Tag className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{expenseCategories.length}</div>
                  <p className="text-xs text-muted-foreground">Active categories</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                  <div>
                    <CardTitle>All Expenses</CardTitle>
                    <p className="text-sm text-muted-foreground">View and manage all expense records</p>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative w-full sm:w-64">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search expenses..."
                        className="pl-10 w-full"
                      />
                    </div>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="w-[180px]">
                        <Filter className="mr-2 h-4 w-4" />
                        <SelectValue placeholder="Filter by category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {expenseCategories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-2 text-sm font-medium">Expense</th>
                        <th className="text-left py-3 px-2 text-sm font-medium">Category</th>
                        <th className="text-left py-3 px-2 text-sm font-medium">Amount</th>
                        <th className="text-left py-3 px-2 text-sm font-medium">Date</th>
                        <th className="text-left py-3 px-2 text-sm font-medium">Status</th>
                        <th className="text-left py-3 px-2 text-sm font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredExpenses.map((expense) => {
                        const category = getCategoryById(expense.category);
                        return (
                          <tr key={expense.id} className="border-b hover:bg-muted/50">
                            <td className="py-3 px-2">
                              <div>
                                <div className="font-medium text-sm">{expense.title}</div>
                                <div className="text-xs text-muted-foreground">{expense.description}</div>
                              </div>
                            </td>
                            <td className="py-3 px-2">
                              {category && (
                                <Badge variant="secondary" className={category.color}>
                                  {category.name}
                                </Badge>
                              )}
                            </td>
                            <td className="py-3 px-2">
                              <span className="font-medium">${expense.amount.toFixed(2)}</span>
                            </td>
                            <td className="py-3 px-2">
                              <div className="flex items-center text-sm">
                                <Calendar className="mr-1 h-3 w-3" />
                                {new Date(expense.date).toLocaleDateString()}
                              </div>
                            </td>
                            <td className="py-3 px-2">
                              <Badge
                                variant="secondary"
                                className={`${
                                  expense.status === 'paid' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                  expense.status === 'approved' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                                  expense.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                  'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                }`}
                              >
                                {expense.status.charAt(0).toUpperCase() + expense.status.slice(1)}
                              </Badge>
                            </td>
                            <td className="py-3 px-2">
                              <div className="flex space-x-1">
                                <Button variant="ghost" size="sm">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {filteredExpenses.length === 0 && (
                  <div className="text-center py-8">
                    <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-2 text-sm font-semibold">No expenses found</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {selectedCategory === "all"
                        ? "Get started by adding your first expense."
                        : "No expenses found for the selected category."}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Add Expense Tab */}
          <TabsContent value="add-expense" className="space-y-4">
            {/* Compact Header */}
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add New Expense</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Record your business expense quickly</p>
            </div>

            {/* Compact Form Card */}
            <Card className="max-w-2xl mx-auto shadow-lg border-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Row 1: Title and Amount */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="group">
                      <Label htmlFor="expense-title" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">
                        Expense Title *
                      </Label>
                      <div className="relative">
                        <Receipt className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                        <Input
                          id="expense-title"
                          placeholder="Enter expense title"
                          className="pl-10 h-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all bg-white dark:bg-gray-800"
                        />
                      </div>
                    </div>

                    <div className="group">
                      <Label htmlFor="expense-amount" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">
                        Amount *
                      </Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-600" />
                        <Input
                          id="expense-amount"
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          className="pl-10 h-10 font-medium border border-gray-300 dark:border-gray-600 rounded-lg focus:border-green-500 focus:ring-1 focus:ring-green-500/30 transition-all bg-white dark:bg-gray-800"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Row 2: Category and Date */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="group">
                      <Label htmlFor="expense-category" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">
                        Category *
                      </Label>
                      <Select>
                        <SelectTrigger className="h-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all bg-white dark:bg-gray-800">
                          <div className="flex items-center">
                            <Tag className="mr-2 h-4 w-4 text-gray-400" />
                            <SelectValue placeholder="Select category" />
                          </div>
                        </SelectTrigger>
                        <SelectContent className="rounded-lg">
                          {expenseCategories.map((category) => {
                            const IconComponent = category.icon;
                            return (
                              <SelectItem key={category.id} value={category.id}>
                                <div className="flex items-center space-x-2">
                                  <IconComponent className="h-4 w-4" />
                                  <span>{category.name}</span>
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="group">
                      <Label htmlFor="expense-date" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">
                        Date *
                      </Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                        <Input
                          id="expense-date"
                          type="date"
                          className="pl-10 h-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all bg-white dark:bg-gray-800"
                          defaultValue={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Row 3: Description */}
                  <div className="group">
                    <Label htmlFor="expense-description" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">
                      Description
                    </Label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                      <Textarea
                        id="expense-description"
                        placeholder="Brief description of the expense..."
                        className="pl-10 pt-2.5 min-h-[80px] border border-gray-300 dark:border-gray-600 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all bg-white dark:bg-gray-800 resize-none"
                        rows={3}
                      />
                    </div>
                  </div>

                  {/* Row 4: Status and Receipt */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="group">
                      <Label htmlFor="expense-status" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">
                        Status
                      </Label>
                      <Select defaultValue="pending">
                        <SelectTrigger className="h-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all bg-white dark:bg-gray-800">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-lg">
                          <SelectItem value="pending">
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                              <span>Pending</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="approved">
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              <span>Approved</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="paid">
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span>Paid</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="rejected">
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                              <span>Rejected</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="group">
                      <Label htmlFor="expense-receipt" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">
                        Receipt
                      </Label>
                      <div className="relative">
                        <div className="border border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-3 text-center hover:border-blue-400 transition-colors bg-gray-50/50 dark:bg-gray-800/50">
                          <div className="flex items-center justify-center space-x-2">
                            <FileText className="h-4 w-4 text-blue-600" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">Upload file</span>
                          </div>
                          <Input
                            id="expense-receipt"
                            type="file"
                            accept="image/*,.pdf"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    variant="outline"
                    className="h-9 px-6 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                  >
                    Cancel
                  </Button>
                  <Button className="h-9 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-lg shadow-md hover:shadow-lg transition-all">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Expense
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
