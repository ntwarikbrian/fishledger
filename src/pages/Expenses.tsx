import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
  RefreshCw,
  Car,
  Utensils,
  Zap,
  Wifi,
  Phone,
  Wrench,
  ShoppingCart,
  Users,
  Briefcase,
  Save,
  Loader2
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
import { useExpenseCategories } from "@/hooks/use-expense-categories";
import { useExpenses } from "@/hooks/use-expenses";
import { toast } from "sonner";
import { useCurrency } from '@/contexts/CurrencyContext';

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
  const location = useLocation();
  const navigate = useNavigate();
  const { formatCurrency } = useCurrency();

  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<string>("categories"); // Track active tab for dynamic header - Categories is now default

  // State for category deletion error popup
  const [showDeleteErrorPopup, setShowDeleteErrorPopup] = useState(false);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState('');
  const [failedDeleteCategory, setFailedDeleteCategory] = useState<any>(null);

  // Set active tab based on URL
  useEffect(() => {
    const path = location.pathname;
    if (path === '/expenses/add-expenses') {
      setActiveTab('add-expense');
    } else if (path === '/expenses/all-expenses') {
      setActiveTab('all-expenses');
    } else if (path === '/expenses') {
      setActiveTab('categories'); // Default to categories tab
    }
  }, [location.pathname]);

  // Form state for adding categories
  const [categoryForm, setCategoryForm] = useState({
    category_name: '',
    description: '',
    budget: ''
  });

  // Form state for adding expenses
  const [expenseForm, setExpenseForm] = useState({
    title: '',
    amount: '',
    category_id: '',
    date: new Date().toISOString().split('T')[0],
    status: 'pending',
    receipt_url: ''
  });

  // Receipt file state
  const [selectedReceiptFile, setSelectedReceiptFile] = useState<File | null>(null);

  // Loading state for expense submission
  const [isSubmittingExpense, setIsSubmittingExpense] = useState(false);

  // Edit/Delete state for categories
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [isEditCategoryOpen, setIsEditCategoryOpen] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<any>(null);
  const [isDeleteCategoryOpen, setIsDeleteCategoryOpen] = useState(false);

  // Edit/Delete state for expenses
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const [isEditExpenseOpen, setIsEditExpenseOpen] = useState(false);
  const [deletingExpense, setDeletingExpense] = useState<any>(null);
  const [isDeleteExpenseOpen, setIsDeleteExpenseOpen] = useState(false);

  // Loading states for expense operations
  const [isUpdatingExpense, setIsUpdatingExpense] = useState(false);
  const [isDeletingExpense, setIsDeletingExpense] = useState(false);

  // Loading states for category operations
  const [isUpdatingCategory, setIsUpdatingCategory] = useState(false);
  const [isDeletingCategory, setIsDeletingCategory] = useState(false);

  // Receipt popup state
  const [isReceiptPopupOpen, setIsReceiptPopupOpen] = useState(false);
  const [selectedReceiptUrl, setSelectedReceiptUrl] = useState<string>('');

  // Use expense categories hook
  const {
    categories: backendCategories,
    loading: categoriesLoading,
    error: categoriesError,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory
  } = useExpenseCategories();

  // Use expenses hook
  const {
    expenses,
    loading: expensesLoading,
    error: expensesError,
    fetchExpenses,
    createExpense,
    createExpenseWithFile,
    updateExpense,
    deleteExpense
  } = useExpenses();

  // Handle category form submission
  const handleCreateCategory = async () => {
    if (!categoryForm.category_name.trim()) {
      toast.error('Category name is required');
      return;
    }

    const budgetValue = categoryForm.budget ? parseFloat(categoryForm.budget) : 0;
    if (categoryForm.budget && (isNaN(budgetValue) || budgetValue < 0)) {
      toast.error('Budget must be a positive number');
      return;
    }

    const success = await createCategory({
      category_name: categoryForm.category_name.trim(),
      description: categoryForm.description.trim() || undefined,
      budget: budgetValue,
    });

    if (success) {
      setCategoryForm({ category_name: '', description: '', budget: '' });
      setIsAddCategoryOpen(false);
      toast.success('Category created successfully');
      // Refresh expenses to update category bars
      await fetchExpenses();
    } else {
      toast.error('Failed to create category');
    }
  };

  // Handle expense form submission
  const handleCreateExpense = async () => {
    // Validate required fields
    if (!expenseForm.title.trim()) {
      toast.error('Expense title is required');
      return;
    }

    if (!expenseForm.amount || parseFloat(expenseForm.amount) <= 0) {
      toast.error('Amount must be greater than 0');
      return;
    }

    if (!expenseForm.category_id) {
      toast.error('Please select a category');
      return;
    }

    if (!expenseForm.date) {
      toast.error('Date is required');
      return;
    }

    try {
      setIsSubmittingExpense(true);

      const expenseData = {
        title: expenseForm.title.trim(),
        amount: parseFloat(expenseForm.amount),
        category_id: expenseForm.category_id,
        date: expenseForm.date,
        status: expenseForm.status,
        receipt_url: expenseForm.receipt_url || null
      };

      // Use the new API method that handles file uploads
      const success = await createExpenseWithFile(expenseData, selectedReceiptFile || undefined);

      if (success) {
        // Reset form
        setExpenseForm({
          title: '',
          amount: '',
          category_id: '',
          date: new Date().toISOString().split('T')[0],
          status: 'pending',
          receipt_url: ''
        });
        setSelectedReceiptFile(null);

        toast.success('Expense added successfully!');
        // Refresh categories to update category bars
        await fetchCategories();
      } else {
        toast.error('Failed to create expense. Please try again.');
      }
    } catch (error) {
      console.error('Error creating expense:', error);
      toast.error('Failed to create expense. Please try again.');
    } finally {
      setIsSubmittingExpense(false);
    }
  };

  // Handle category edit
  const handleEditCategory = (category: any) => {
    setEditingCategory(category);
    setCategoryForm({
      category_name: category.category_name,
      description: category.description || '',
      budget: category.budget.toString()
    });
    setIsEditCategoryOpen(true);
  };

  // Handle category update
  const handleUpdateCategory = async () => {
    if (!editingCategory) return;

    if (!categoryForm.category_name.trim()) {
      toast.error('Category name is required');
      return;
    }

    const budgetValue = categoryForm.budget ? parseFloat(categoryForm.budget) : 0;
    if (categoryForm.budget && (isNaN(budgetValue) || budgetValue < 0)) {
      toast.error('Budget must be a positive number');
      return;
    }

    try {
      setIsUpdatingCategory(true);

      const success = await updateCategory(editingCategory.category_id, {
        category_name: categoryForm.category_name.trim(),
        description: categoryForm.description.trim() || undefined,
        budget: budgetValue,
      });

      if (success) {
        setCategoryForm({ category_name: '', description: '', budget: '' });
        setIsEditCategoryOpen(false);
        setEditingCategory(null);
        toast.success('Category updated successfully!');
        // Refresh expenses to update category bars
        await fetchExpenses();
      }
    } finally {
      setIsUpdatingCategory(false);
    }
  };

  // Handle category delete
  const handleDeleteCategory = (category: any) => {
    setDeletingCategory(category);
    setIsDeleteCategoryOpen(true);
  };

  // Confirm category deletion
  const confirmDeleteCategory = async () => {
    if (!deletingCategory) return;

    try {
      setIsDeletingCategory(true);

      const result = await deleteCategory(deletingCategory.category_id);

      if (result.success) {
        // Success: close dialog, show success message, and refresh categories
        setIsDeleteCategoryOpen(false);
        setDeletingCategory(null);
        toast.success('Category deleted successfully!');
        // Refresh both categories and expenses to update category bars
        await Promise.all([fetchCategories(), fetchExpenses()]);
      } else {
        // Failure: close delete dialog and show error popup (NO refresh)
        setIsDeleteCategoryOpen(false);
        setDeletingCategory(null);

        // Set up error popup data
        setFailedDeleteCategory(deletingCategory);
        setDeleteErrorMessage(result.error || 'Failed to delete category');
        setShowDeleteErrorPopup(true);

        // DO NOT refresh categories list - this was the main issue
      }
    } finally {
      setIsDeletingCategory(false);
    }
  };

  // Handle expense edit
  const handleEditExpense = (expense: any) => {
    setEditingExpense(expense);
    setExpenseForm({
      title: expense.title,
      amount: expense.amount.toString(),
      category_id: expense.category_id,
      date: expense.date,
      status: expense.status,
      receipt_url: expense.receipt_url || ''
    });
    setIsEditExpenseOpen(true);
  };

  // Handle expense update
  const handleUpdateExpense = async () => {
    if (!editingExpense) return;

    if (!expenseForm.title.trim()) {
      toast.error('Expense title is required');
      return;
    }

    if (!expenseForm.amount || parseFloat(expenseForm.amount) <= 0) {
      toast.error('Amount must be greater than 0');
      return;
    }

    try {
      setIsUpdatingExpense(true);

      const success = await updateExpense(editingExpense.expense_id, {
        title: expenseForm.title.trim(),
        amount: parseFloat(expenseForm.amount),
        category_id: expenseForm.category_id,
        date: expenseForm.date,
        status: expenseForm.status
      });

      if (success) {
        // Reset form and close popup
        setExpenseForm({
          title: '',
          amount: '',
          category_id: '',
          date: new Date().toISOString().split('T')[0],
          status: 'pending',
          receipt_url: ''
        });
        setIsEditExpenseOpen(false);
        setEditingExpense(null);

        // Show success message
        toast.success('Expense updated successfully!');

        // Refresh both expenses table and categories to update category bars
        await Promise.all([fetchExpenses(), fetchCategories()]);
      }
    } finally {
      setIsUpdatingExpense(false);
    }
  };

  // Handle expense delete
  const handleDeleteExpense = (expense: any) => {
    setDeletingExpense(expense);
    setIsDeleteExpenseOpen(true);
  };

  // Confirm expense deletion
  const confirmDeleteExpense = async () => {
    if (!deletingExpense) return;

    try {
      setIsDeletingExpense(true);

      const success = await deleteExpense(deletingExpense.expense_id);
      if (success) {
        // Close popup and reset state
        setIsDeleteExpenseOpen(false);
        setDeletingExpense(null);

        // Show success message
        toast.success('Expense deleted successfully!');

        // Refresh both expenses table and categories to update category bars
        await Promise.all([fetchExpenses(), fetchCategories()]);
      }
    } finally {
      setIsDeletingExpense(false);
    }
  };



  // Handle receipt file selection
  const handleReceiptFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type (only specific receipt formats allowed)
    const allowedReceiptTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/gif'
    ];

    if (!allowedReceiptTypes.includes(file.type.toLowerCase())) {
      toast.error('Upload required image format. Only JPEG, GIF, PNG, and WebP are allowed.');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setSelectedReceiptFile(file);
    toast.success('Receipt file selected successfully!');
  };

  // Function to handle category click - redirect to all expenses with filter
  const handleCategoryClick = (categoryId: string) => {
    setActiveTab("all-expenses"); // Switch to all expenses tab
    setSelectedFilter(categoryId); // Set the category filter
    navigate('/expenses/all-expenses'); // Navigate to all expenses URL
  };

  // Function to handle receipt click - open receipt popup
  const handleReceiptClick = (receiptUrl: string) => {
    setSelectedReceiptUrl(receiptUrl);
    setIsReceiptPopupOpen(true);
  };

  // Function to get filter label for display
  const getFilterLabel = () => {
    if (selectedFilter === "all") return "All Expenses";
    if (selectedFilter === "pending") return "Pending Expenses";
    if (selectedFilter === "no-receipt") return "Expenses Without Receipts";

    // Find category name
    const category = backendCategories.find(cat => cat.category_id === selectedFilter);
    return category ? `${category.category_name} Expenses` : "Filtered Expenses";
  };

  // Function to get header content based on active tab
  const getHeaderContent = () => {
    switch (activeTab) {
      case "categories":
        return {
          title: "Expense Categories",
          description: "Organize and manage expense categories with budget allocations"
        };
      case "add-expense":
        return {
          title: "Add New Expense",
          description: "Record and track new business expenses with receipt uploads"
        };
      case "all-expenses":
        return {
          title: "All Expenses",
          description: "View and manage all your business expenses in one place"
        };
      default:
        return {
          title: "Expense Categories",
          description: "Organize and manage expense categories with budget allocations"
        };
    }
  };

  // Function to get icon for category based on name
  const getCategoryIcon = (categoryName: string) => {
    const name = categoryName.toLowerCase();
    if (name.includes('office') || name.includes('supplies')) return Briefcase;
    if (name.includes('utilities') || name.includes('electricity') || name.includes('water')) return Zap;
    if (name.includes('transport') || name.includes('fuel') || name.includes('vehicle')) return Car;
    if (name.includes('maintenance') || name.includes('repair')) return Wrench;
    if (name.includes('marketing') || name.includes('advertising')) return TrendingUp;
    if (name.includes('food') || name.includes('beverage') || name.includes('meal')) return Utensils;
    if (name.includes('equipment')) return ShoppingCart;
    if (name.includes('staff') || name.includes('salary') || name.includes('employee')) return Users;
    if (name.includes('phone') || name.includes('internet') || name.includes('communication')) return Phone;
    return Tag; // Default icon
  };

  // Function to get color for category based on name
  const getCategoryColor = (categoryName: string) => {
    const name = categoryName.toLowerCase();
    if (name.includes('office') || name.includes('supplies')) return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
    if (name.includes('utilities')) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
    if (name.includes('transport')) return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
    if (name.includes('maintenance')) return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400";
    if (name.includes('marketing')) return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400";
    if (name.includes('food')) return "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400";
    return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"; // Default color
  };

  // Calculate spent amounts per category from expenses
  const calculateSpentByCategory = (categoryId: string): number => {
    return expenses
      .filter(expense => expense.category_id === categoryId && expense.status !== 'rejected')
      .reduce((total, expense) => total + expense.amount, 0);
  };

  // Transform backend categories to display format with real spent amounts
  const displayCategories = backendCategories.map(category => {
    const spent = calculateSpentByCategory(category.category_id);
    return {
      id: category.category_id,
      name: category.category_name,
      description: category.description || '',
      icon: getCategoryIcon(category.category_name),
      color: getCategoryColor(category.category_name),
      totalBudget: category.budget > 0 ? category.budget : undefined,
      spent: spent
    };
  });





  // Filter expenses by selected filter (category, status, or receipt)
  const filteredExpenses = (() => {
    if (selectedFilter === "all") {
      return expenses;
    } else if (selectedFilter === "pending") {
      return expenses.filter(expense => expense.status === "pending");
    } else if (selectedFilter === "no-receipt") {
      return expenses.filter(expense => !expense.receipt_url || expense.receipt_url.trim() === "");
    } else {
      // Assume it's a category ID
      return expenses.filter(expense => expense.category_id === selectedFilter);
    }
  })();

  // Calculate total expenses
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const monthlyBudget = backendCategories.reduce((sum, cat) => sum + (cat.budget || 0), 0);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Dynamic Header - Changes based on active tab */}
        <div>
          <h1 className="text-3xl font-bold">{getHeaderContent().title}</h1>
          <p className="text-muted-foreground">{getHeaderContent().description}</p>
        </div>


        {/* Expense Management Tabs */}
        <Tabs value={activeTab} className="w-full" onValueChange={(value) => {
          setActiveTab(value);
          // Update URL based on tab selection
          if (value === 'categories') {
            navigate('/expenses');
          } else if (value === 'add-expense') {
            navigate('/expenses/add-expenses');
          } else if (value === 'all-expenses') {
            navigate('/expenses/all-expenses');
          }
        }}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="categories">
              <Tag className="mr-2 h-4 w-4" />
              Categories
            </TabsTrigger>
            <TabsTrigger value="add-expense">
              <Plus className="mr-2 h-4 w-4" />
              Add Expenses
            </TabsTrigger>
            <TabsTrigger value="all-expenses">
              <FileText className="mr-2 h-4 w-4" />
              All Expenses
            </TabsTrigger>
          </TabsList>

          {/* Categories Tab */}
          <TabsContent value="categories" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                  <div>
                    <CardTitle>Expense Categories</CardTitle>
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
                            value={categoryForm.category_name}
                            onChange={(e) => setCategoryForm(prev => ({ ...prev, category_name: e.target.value }))}
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
                            value={categoryForm.description}
                            onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
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
                            value={categoryForm.budget}
                            onChange={(e) => setCategoryForm(prev => ({ ...prev, budget: e.target.value }))}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsAddCategoryOpen(false);
                            setCategoryForm({ category_name: '', description: '', budget: '' });
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          className="bg-blue-600 hover:bg-blue-700"
                          onClick={handleCreateCategory}
                          disabled={categoriesLoading || !categoryForm.category_name.trim()}
                        >
                          {categoriesLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Creating...
                            </>
                          ) : (
                            <>
                              <Save className="mr-2 h-4 w-4" />
                              Create Category
                            </>
                          )}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  {/* Edit Category Dialog */}
                  <Dialog open={isEditCategoryOpen} onOpenChange={setIsEditCategoryOpen}>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Edit Category</DialogTitle>
                        <DialogDescription>
                          Update the expense category details
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="edit-category-name" className="text-right">
                            Name
                          </Label>
                          <Input
                            id="edit-category-name"
                            placeholder="Category name"
                            className="col-span-3"
                            value={categoryForm.category_name}
                            onChange={(e) => setCategoryForm(prev => ({ ...prev, category_name: e.target.value }))}
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="edit-category-description" className="text-right">
                            Description
                          </Label>
                          <Textarea
                            id="edit-category-description"
                            placeholder="Category description"
                            className="col-span-3"
                            value={categoryForm.description}
                            onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="edit-category-budget" className="text-right">
                            Budget
                          </Label>
                          <Input
                            id="edit-category-budget"
                            type="number"
                            placeholder="0.00"
                            className="col-span-3"
                            value={categoryForm.budget}
                            onChange={(e) => setCategoryForm(prev => ({ ...prev, budget: e.target.value }))}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsEditCategoryOpen(false)}
                          disabled={isUpdatingCategory}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          onClick={handleUpdateCategory}
                          disabled={isUpdatingCategory || !categoryForm.category_name.trim()}
                        >
                          {isUpdatingCategory ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Updating...
                            </>
                          ) : (
                            <>
                              <Save className="mr-2 h-4 w-4" />
                              Update Category
                            </>
                          )}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  {/* Delete Category Dialog */}
                  <Dialog open={isDeleteCategoryOpen} onOpenChange={setIsDeleteCategoryOpen}>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Delete Category</DialogTitle>
                        <DialogDescription>
                          Are you sure you want to delete "{deletingCategory?.category_name}"? This action cannot be undone.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsDeleteCategoryOpen(false)}
                          disabled={isDeletingCategory}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          onClick={confirmDeleteCategory}
                          disabled={isDeletingCategory}
                        >
                          {isDeletingCategory ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Deleting...
                            </>
                          ) : (
                            <>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Category
                            </>
                          )}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {categoriesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-muted-foreground">Loading categories...</span>
                  </div>
                ) : categoriesError ? (
                  <div className="text-center py-8">
                    <p className="text-red-600 dark:text-red-400">{categoriesError}</p>
                  </div>
                ) : displayCategories.length === 0 ? (
                  <div className="text-center py-8">
                    <Tag className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-2 text-sm font-semibold">No categories found</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Get started by creating your first expense category.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="mb-4">
                      <p className="text-sm text-muted-foreground text-center">
                        💡 Click on any category to view its expenses
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {displayCategories.map((category) => {
                      const IconComponent = category.icon;
                      const budgetUsed = category.totalBudget ? (category.spent / category.totalBudget) * 100 : 0;

                      return (
                        <Card
                          key={category.id}
                          className="hover:shadow-md transition-all duration-200 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:scale-[1.02] border-l-4 border-l-transparent hover:border-l-blue-500"
                          onClick={() => handleCategoryClick(category.id)}
                          title="Click to view expenses for this category"
                        >
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
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditCategory(backendCategories.find(cat => cat.category_id === category.id));
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteCategory(backendCategories.find(cat => cat.category_id === category.id));
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="font-medium text-green-600">Spent: {formatCurrency(category.spent)}</span>
                                {category.totalBudget && (
                                  <span className="text-muted-foreground">Budget: {formatCurrency(category.totalBudget)}</span>
                                )}
                              </div>

                              {category.totalBudget ? (
                                <>
                                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                                    <div
                                      className={`h-2.5 rounded-full transition-all duration-300 ${
                                        budgetUsed > 100 ? 'bg-red-500' :
                                        budgetUsed > 90 ? 'bg-orange-500' :
                                        budgetUsed > 70 ? 'bg-yellow-500' : 'bg-green-500'
                                      }`}
                                      style={{ width: `${Math.min(budgetUsed, 100)}%` }}
                                    ></div>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <p className={`text-xs font-medium ${
                                      budgetUsed > 100 ? 'text-red-600' :
                                      budgetUsed > 90 ? 'text-orange-600' :
                                      budgetUsed > 70 ? 'text-yellow-600' : 'text-green-600'
                                    }`}>
                                      {budgetUsed.toFixed(1)}% used
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {formatCurrency(category.totalBudget - category.spent)} remaining
                                    </p>
                                  </div>
                                  {budgetUsed > 100 && (
                                    <p className="text-xs text-red-600 font-medium">
                                      ⚠️ Over budget by {formatCurrency(category.spent - category.totalBudget)}
                                    </p>
                                  )}
                                </>
                              ) : (
                                <p className="text-xs text-muted-foreground">No budget set</p>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* All Expenses Tab */}
          <TabsContent value="all-expenses" className="space-y-4">
            {/* Compact Overview Cards - Only in All Expenses Tab */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Expenses Card */}
              <Card className="border-0 shadow-md bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 hover:shadow-lg transition-all duration-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                        <DollarSign className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Total Expenses</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(totalExpenses)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-green-600 dark:text-green-400 font-medium">This month</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Monthly Budget Card */}
              <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 hover:shadow-lg transition-all duration-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                        <Receipt className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Monthly Budget</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(monthlyBudget)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                        {monthlyBudget > 0 ? ((totalExpenses / monthlyBudget) * 100).toFixed(1) : '0.0'}% used
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Budget Remaining Card */}
              <Card className="border-0 shadow-md bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30 hover:shadow-lg transition-all duration-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                        <Tag className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Budget Remaining</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                          {formatCurrency(monthlyBudget > 0 ? (monthlyBudget - totalExpenses) : 0)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-xs font-medium ${
                        monthlyBudget > 0 && totalExpenses > monthlyBudget ? 'text-red-600' :
                        monthlyBudget > 0 && (totalExpenses / monthlyBudget) > 0.9 ? 'text-orange-600' :
                        'text-green-600'
                      }`}>
                        {monthlyBudget > 0 ? (
                          totalExpenses > monthlyBudget ? 'Over Budget' :
                          (totalExpenses / monthlyBudget) > 0.9 ? 'Near Limit' : 'On Track'
                        ) : 'No Budget'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Categories Count Card */}
              <Card className="border-0 shadow-md bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 hover:shadow-lg transition-all duration-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
                        <Tag className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Categories</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">{backendCategories.length}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                        {displayCategories.filter(cat => cat.spent > 0).length} active
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                  <div>
                    <CardTitle>All Expenses</CardTitle>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        fetchExpenses();
                        toast.success('Expenses refreshed');
                      }}
                      className="flex items-center gap-2"
                      title="Refresh expenses data"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Refresh
                    </Button>
                    <div className="relative w-full sm:w-64">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search expenses..."
                        className="pl-10 w-full"
                      />
                    </div>
                    <Select value={selectedFilter} onValueChange={setSelectedFilter}>
                      <SelectTrigger className="w-[200px]">
                        <Filter className="mr-2 h-4 w-4" />
                        <SelectValue placeholder="Filter expenses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Expenses</SelectItem>

                        {/* Status Filters */}
                        <SelectItem value="pending">
                          <div className="flex items-center">
                            <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                            Pending Status
                          </div>
                        </SelectItem>

                        {/* Receipt Filters */}
                        <SelectItem value="no-receipt">
                          <div className="flex items-center">
                            <Receipt className="mr-2 h-4 w-4 text-gray-400" />
                            No Receipt
                          </div>
                        </SelectItem>

                        {/* Category Filters */}
                        {backendCategories.length > 0 && (
                          <>
                            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-t mt-1">
                              Categories
                            </div>
                            {backendCategories.map((category) => (
                              <SelectItem key={category.category_id} value={category.category_id}>
                                <div className="flex items-center">
                                  <Tag className="mr-2 h-4 w-4 text-blue-500" />
                                  {category.category_name}
                                </div>
                              </SelectItem>
                            ))}
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Filter Indicator */}
                {selectedFilter !== "all" && (
                  <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Filter className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                          Showing: {getFilterLabel()}
                        </span>
                        <span className="text-xs text-blue-600 dark:text-blue-400">
                          ({filteredExpenses.length} {filteredExpenses.length === 1 ? 'expense' : 'expenses'})
                        </span>
                      </div>
                      <button
                        onClick={() => setSelectedFilter("all")}
                        className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 underline"
                      >
                        Clear filter
                      </button>
                    </div>
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-2 text-sm font-medium">Expense</th>
                        <th className="text-left py-3 px-2 text-sm font-medium">Category</th>
                        <th className="text-left py-3 px-2 text-sm font-medium">Amount</th>
                        <th className="text-left py-3 px-2 text-sm font-medium">Date</th>
                        <th className="text-left py-3 px-2 text-sm font-medium">Receipt</th>
                        <th className="text-left py-3 px-2 text-sm font-medium">Status</th>
                        <th className="text-left py-3 px-2 text-sm font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredExpenses.map((expense) => {
                        const category = expense.expense_categories;
                        return (
                          <tr key={expense.expense_id} className="border-b hover:bg-muted/50">
                            <td className="py-3 px-2">
                              <div>
                                <div className="font-medium text-sm">{expense.title}</div>
                                <div className="text-xs text-muted-foreground">
                                  Added by {expense.users?.owner_name || 'Unknown'}
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-2">
                              {category && (
                                <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                                  {category.category_name}
                                </Badge>
                              )}
                            </td>
                            <td className="py-3 px-2">
                              <span className="font-medium">{formatCurrency(expense.amount)}</span>
                            </td>
                            <td className="py-3 px-2">
                              <div className="flex items-center text-sm">
                                <Calendar className="mr-1 h-3 w-3" />
                                {new Date(expense.date).toLocaleDateString()}
                              </div>
                            </td>
                            <td className="py-3 px-2">
                              {expense.receipt_url && expense.receipt_url.trim() !== '' ? (
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleReceiptClick(expense.receipt_url!)}
                                    className="flex items-center text-blue-600 hover:text-blue-700 text-sm hover:underline"
                                    title="View receipt"
                                  >
                                    <FileText className="mr-1 h-3 w-3" />
                                    View
                                  </button>
                                  <button
                                    onClick={() => {
                                      // Copy URL to clipboard
                                      navigator.clipboard.writeText(expense.receipt_url!);
                                      toast.success('Receipt URL copied to clipboard');
                                    }}
                                    className="text-gray-400 hover:text-gray-600 text-xs"
                                    title="Copy receipt URL"
                                  >
                                    📋
                                  </button>
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground">No receipt</span>
                              )}
                            </td>
                            <td className="py-3 px-2">
                              <Badge
                                variant="secondary"
                                className={`${
                                  expense.status === 'paid' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                  expense.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                  'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                }`}
                              >
                                {expense.status.charAt(0).toUpperCase() + expense.status.slice(1)}
                              </Badge>
                            </td>
                            <td className="py-3 px-2">
                              <div className="flex space-x-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditExpense(expense)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700"
                                  onClick={() => handleDeleteExpense(expense)}
                                >
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
                      {selectedFilter === "all"
                        ? "Get started by adding your first expense."
                        : selectedFilter === "pending"
                        ? "No pending expenses found."
                        : selectedFilter === "no-receipt"
                        ? "No expenses without receipts found."
                        : "No expenses found for the selected filter."}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Add Expense Tab */}
          <TabsContent value="add-expense" className="space-y-4">


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
                          value={expenseForm.title}
                          onChange={(e) => setExpenseForm({...expenseForm, title: e.target.value})}
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
                          value={expenseForm.amount}
                          onChange={(e) => setExpenseForm({...expenseForm, amount: e.target.value})}
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
                      <Select value={expenseForm.category_id} onValueChange={(value) => setExpenseForm({...expenseForm, category_id: value})}>
                        <SelectTrigger className="h-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all bg-white dark:bg-gray-800">
                          <div className="flex items-center">
                            <Tag className="mr-2 h-4 w-4 text-gray-400" />
                            <SelectValue placeholder="Select category" />
                          </div>
                        </SelectTrigger>
                        <SelectContent className="rounded-lg">
                          {backendCategories.map((category) => (
                            <SelectItem key={category.category_id} value={category.category_id}>
                              <div className="flex items-center space-x-2">
                                <Tag className="h-4 w-4" />
                                <span>{category.category_name}</span>
                              </div>
                            </SelectItem>
                          ))}
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
                          value={expenseForm.date}
                          onChange={(e) => setExpenseForm({...expenseForm, date: e.target.value})}
                          className="pl-10 h-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all bg-white dark:bg-gray-800"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Row 3: Status and Receipt */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="group">
                      <Label htmlFor="expense-status" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">
                        Status
                      </Label>
                      <Select value={expenseForm.status} onValueChange={(value) => setExpenseForm({...expenseForm, status: value})}>
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
                          <SelectItem value="paid">
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span>Paid</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="group">
                      <Label htmlFor="expense-receipt" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">
                        Receipt (Optional)
                      </Label>
                      <div className="relative">
                        <div className="border border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-3 text-center hover:border-blue-400 transition-colors bg-gray-50/50 dark:bg-gray-800/50">
                          {selectedReceiptFile ? (
                            <div className="flex items-center justify-center space-x-2">
                              <FileText className="h-4 w-4 text-green-600" />
                              <span className="text-sm text-green-600">{selectedReceiptFile.name}</span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center space-x-2">
                              <FileText className="h-4 w-4 text-blue-600" />
                              <span className="text-sm text-gray-600 dark:text-gray-400">Select receipt (JPEG, GIF, PNG, WebP only)</span>
                            </div>
                          )}
                          <Input
                            id="expense-receipt"
                            type="file"
                            accept=".jpg,.jpeg,.png,.webp,.gif"
                            onChange={handleReceiptFileChange}

                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                          />
                        </div>
                        {expenseForm.receipt_url && (
                          <div className="mt-2">
                            <a
                              href={expenseForm.receipt_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:text-blue-700 underline"
                            >
                              View uploaded receipt
                            </a>
                          </div>
                        )}
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
                  <Button
                    onClick={handleCreateExpense}
                    disabled={isSubmittingExpense}
                    className="h-9 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmittingExpense ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Expense
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit Expense Dialog */}
        <Dialog open={isEditExpenseOpen} onOpenChange={setIsEditExpenseOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Expense</DialogTitle>
              <DialogDescription>
                Update the expense details
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-expense-title">Expense Title *</Label>
                  <Input
                    id="edit-expense-title"
                    placeholder="Enter expense title"
                    value={expenseForm.title}
                    onChange={(e) => setExpenseForm({...expenseForm, title: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-expense-amount">Amount *</Label>
                  <Input
                    id="edit-expense-amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({...expenseForm, amount: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category *</Label>
                  <Select value={expenseForm.category_id} onValueChange={(value) => setExpenseForm({...expenseForm, category_id: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {backendCategories.map((category) => (
                        <SelectItem key={category.category_id} value={category.category_id}>
                          {category.category_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-expense-date">Date *</Label>
                  <Input
                    id="edit-expense-date"
                    type="date"
                    value={expenseForm.date}
                    onChange={(e) => setExpenseForm({...expenseForm, date: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={expenseForm.status} onValueChange={(value) => setExpenseForm({...expenseForm, status: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditExpenseOpen(false)}
                disabled={isUpdatingExpense}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleUpdateExpense}
                disabled={isUpdatingExpense || !expenseForm.title.trim() || !expenseForm.amount || parseFloat(expenseForm.amount) <= 0}
              >
                {isUpdatingExpense ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Update Expense
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Expense Dialog */}
        <Dialog open={isDeleteExpenseOpen} onOpenChange={setIsDeleteExpenseOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Delete Expense</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{deletingExpense?.title}"? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDeleteExpenseOpen(false)}
                disabled={isDeletingExpense}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={confirmDeleteExpense}
                disabled={isDeletingExpense}
              >
                {isDeletingExpense ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Expense
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Category Deletion Error Popup */}
        <Dialog open={showDeleteErrorPopup} onOpenChange={setShowDeleteErrorPopup}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                  <Trash2 className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-semibold text-red-900 dark:text-red-100">
                    Cannot Delete Category
                  </DialogTitle>
                  <DialogDescription className="text-red-700 dark:text-red-300">
                    This category is currently in use
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="py-4">
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
                <p className="text-sm text-red-800 dark:text-red-200 mb-3">
                  The category <strong>"{failedDeleteCategory?.category_name}"</strong> cannot be deleted because it is being used by one or more expenses.
                </p>

                <div className="text-sm text-red-700 dark:text-red-300">
                  <p className="font-medium mb-2">To delete this category, you need to:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Delete all expenses that use this category, or</li>
                    <li>Change those expenses to use a different category</li>
                  </ul>
                </div>
              </div>

              <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm text-blue-800 dark:text-blue-200">
                    Want to see which expenses use this category?
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowDeleteErrorPopup(false);
                    setActiveTab('all-expenses');
                    setSelectedFilter(failedDeleteCategory?.category_id || 'all');
                    navigate('/expenses/all-expenses');
                  }}
                  className="text-blue-600 border-blue-300 hover:bg-blue-100 dark:text-blue-400 dark:border-blue-600 dark:hover:bg-blue-950/30"
                >
                  View Expenses
                </Button>
              </div>
            </div>

            <DialogFooter>
              <Button
                onClick={() => setShowDeleteErrorPopup(false)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Got it
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Receipt Popup Dialog */}
        <Dialog open={isReceiptPopupOpen} onOpenChange={setIsReceiptPopupOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle>Receipt Preview</DialogTitle>
              <DialogDescription>
                View the uploaded receipt image
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-center items-center p-4 bg-gray-50 dark:bg-gray-900 rounded-lg max-h-[70vh] overflow-auto">
              {selectedReceiptUrl ? (
                <img
                  src={selectedReceiptUrl}
                  alt="Receipt"
                  className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const errorDiv = document.createElement('div');
                    errorDiv.className = 'text-center text-red-600 p-8';
                    errorDiv.innerHTML = `
                      <div class="flex flex-col items-center space-y-2">
                        <svg class="w-12 h-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                        </svg>
                        <p class="text-sm font-medium">Failed to load receipt image</p>
                        <p class="text-xs text-gray-500">The image may be corrupted or the URL is invalid</p>
                      </div>
                    `;
                    target.parentNode?.appendChild(errorDiv);
                  }}
                />
              ) : (
                <div className="text-center text-gray-500 p-8">
                  <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p>No receipt to display</p>
                </div>
              )}
            </div>
            <div className="flex justify-between items-center pt-4">
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (selectedReceiptUrl) {
                      navigator.clipboard.writeText(selectedReceiptUrl);
                      toast.success('Receipt URL copied to clipboard');
                    }
                  }}
                  disabled={!selectedReceiptUrl}
                >
                  📋 Copy URL
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (selectedReceiptUrl) {
                      window.open(selectedReceiptUrl, '_blank');
                    }
                  }}
                  disabled={!selectedReceiptUrl}
                >
                  🔗 Open in New Tab
                </Button>
              </div>
              <Button onClick={() => setIsReceiptPopupOpen(false)}>
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default Expenses;
