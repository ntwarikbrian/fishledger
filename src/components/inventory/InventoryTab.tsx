/**
 * InventoryTab Component
 * Handles the inventory view with different product views and summary cards
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Fish, Search, Filter, Edit, Trash2, Package, Scale, ChevronDown, Eye, AlertTriangle, Calendar, RotateCcw, Plus, Save, DollarSign, TrendingUp, Calculator, FolderOpen } from "lucide-react";
import { useCategories } from "@/hooks/use-categories";

type ViewType = "all" | "low-stock" | "damaged" | "expiry" | "stock-adjustment" | "categories";

interface InventoryTabProps {
  currentView: ViewType;
  setCurrentView: (view: ViewType) => void;
  isAddCategoryOpen: boolean;
  setIsAddCategoryOpen: (open: boolean) => void;
  categoryForm: {
    name: string;
    description: string;
  };
  setCategoryForm: React.Dispatch<React.SetStateAction<{
    name: string;
    description: string;
  }>>;
  handleCreateCategory: () => Promise<void>;
  // Edit category props
  isEditCategoryOpen: boolean;
  setIsEditCategoryOpen: (open: boolean) => void;
  editingCategory: any;
  setEditingCategory: (category: any) => void;
  editCategoryForm: {
    name: string;
    description: string;
  };
  setEditCategoryForm: React.Dispatch<React.SetStateAction<{
    name: string;
    description: string;
  }>>;
  handleEditCategory: () => Promise<void>;
  handleDeleteCategory: (categoryId: string) => Promise<void>;
  // Delete confirmation props
  isDeleteConfirmOpen: boolean;
  setIsDeleteConfirmOpen: (open: boolean) => void;
  categoryToDelete: any;
  setCategoryToDelete: (category: any) => void;
  totals: {
    totalValue: number;
    totalCostPrice: number;
    totalProfit: number;
    profitMargin: number;
  };
}

const InventoryTab: React.FC<InventoryTabProps> = ({
  currentView,
  setCurrentView,
  isAddCategoryOpen,
  setIsAddCategoryOpen,
  categoryForm,
  setCategoryForm,
  handleCreateCategory,
  isEditCategoryOpen,
  setIsEditCategoryOpen,
  editingCategory,
  setEditingCategory,
  editCategoryForm,
  setEditCategoryForm,
  handleEditCategory,
  handleDeleteCategory,
  isDeleteConfirmOpen,
  setIsDeleteConfirmOpen,
  categoryToDelete,
  setCategoryToDelete,
  totals,
}) => {
  // Categories hook
  const { categories, loading: categoriesLoading, error: categoriesError, updateCategory, deleteCategory } = useCategories();

  // Mock data for different views
  const mockProducts = [
    {
      id: 1,
      name: "Atlantic Salmon",
      category: "Premium Fish",
      stock: 45,
      weight: 125.5,
      price: 28.99,
      costPrice: 18.50,
      status: "In Stock",
      supplier: "Ocean Fresh Ltd",
      expiryDate: "2024-02-15",
      lastUpdated: "2024-01-20",
    },
    {
      id: 2,
      name: "Rainbow Trout",
      category: "Fresh Water Fish",
      stock: 12,
      weight: 38.2,
      price: 22.50,
      costPrice: 14.00,
      status: "Low Stock",
      supplier: "Lake Fisheries",
      expiryDate: "2024-02-10",
      lastUpdated: "2024-01-19",
    },
    {
      id: 3,
      name: "Sea Bass",
      category: "White Fish",
      stock: 0,
      weight: 0,
      price: 32.00,
      costPrice: 20.00,
      status: "Out of Stock",
      supplier: "Coastal Catch Co",
      expiryDate: "2024-02-08",
      lastUpdated: "2024-01-18",
    },
  ];

  // Function to get current view title
  const getCurrentViewTitle = () => {
    switch (currentView) {
      case "low-stock": return "Low Stock Items";
      case "damaged": return "Damaged Products";
      case "expiry": return "Products Nearing Expiry";
      case "stock-adjustment": return "Stock Adjustment History";
      case "categories": return "Product Categories Management";
      default: return "Product Inventory Management";
    }
  };

  // Render functions for different views
  const renderAllProductsView = () => (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left py-3 px-2 text-sm font-medium">Product</th>
            <th className="text-left py-3 px-2 text-sm font-medium">Category</th>
            <th className="text-left py-3 px-2 text-sm font-medium">Stock</th>
            <th className="text-left py-3 px-2 text-sm font-medium">Weight</th>
            <th className="text-left py-3 px-2 text-sm font-medium">Price</th>
            <th className="text-left py-3 px-2 text-sm font-medium">Status</th>
            <th className="text-right py-3 px-2 text-sm font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {mockProducts.map((product) => (
            <tr key={product.id} className="border-b hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors">
              <td className="py-3 px-2">
                <div className="flex items-center gap-2">
                  <Fish className="h-4 w-4 text-blue-600" />
                  <div className="font-medium">{product.name}</div>
                </div>
              </td>
              <td className="py-3 px-2 text-sm text-muted-foreground">{product.category}</td>
              <td className="py-3 px-2 text-sm">{product.stock} boxes</td>
              <td className="py-3 px-2 text-sm">{product.weight} kg</td>
              <td className="py-3 px-2 text-sm font-medium">${product.price}/kg</td>
              <td className="py-3 px-2">
                <Badge 
                  variant={product.status === "In Stock" ? "default" : product.status === "Low Stock" ? "secondary" : "destructive"}
                  className="text-xs"
                >
                  {product.status}
                </Badge>
              </td>
              <td className="py-3 px-2">
                <div className="flex justify-end gap-1">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600 hover:text-red-700">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderLowStockView = () => (
    <div className="space-y-4">
      <div className="text-center py-8">
        <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Low Stock Alert</h3>
        <p className="text-muted-foreground">Products that need restocking soon</p>
      </div>
      {renderAllProductsView()}
    </div>
  );

  const renderDamagedView = () => (
    <div className="space-y-4">
      <div className="text-center py-8">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Damaged Products</h3>
        <p className="text-muted-foreground">Products marked as damaged or compromised</p>
      </div>
      <div className="text-center py-4 text-muted-foreground">
        No damaged products recorded
      </div>
    </div>
  );

  const renderExpiryView = () => (
    <div className="space-y-4">
      <div className="text-center py-8">
        <Calendar className="h-12 w-12 text-orange-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Products Nearing Expiry</h3>
        <p className="text-muted-foreground">Products that will expire soon</p>
      </div>
      <div className="text-center py-4 text-muted-foreground">
        No products nearing expiry
      </div>
    </div>
  );

  const renderStockAdjustmentView = () => (
    <div className="space-y-4">
      <div className="text-center py-8">
        <RotateCcw className="h-12 w-12 text-blue-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Stock Adjustment History</h3>
        <p className="text-muted-foreground">Track all stock adjustments and changes</p>
      </div>
      <div className="text-center py-4 text-muted-foreground">
        No stock adjustments recorded
      </div>
    </div>
  );

  const renderCategoriesView = () => (
    <div className="space-y-4">
      {/* Categories Header with Create Button */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold">Product Categories</h3>
          <p className="text-sm text-muted-foreground">Manage product categories and organization</p>
        </div>
        <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" />
              Create Category
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Category</DialogTitle>
              <DialogDescription>
                Add a new product category to organize your inventory
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="categoryName">Category Name *</Label>
                <Input 
                  id="categoryName" 
                  placeholder="e.g., Premium Fish" 
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="categoryDescription">Description</Label>
                <Textarea 
                  id="categoryDescription" 
                  placeholder="Brief description of this category"
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>
              {categoriesError && (
                <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                  {categoriesError}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsAddCategoryOpen(false);
                  setCategoryForm({ name: '', description: '' });
                }}
              >
                Cancel
              </Button>
              <Button 
                className="bg-blue-600 hover:bg-blue-700"
                onClick={handleCreateCategory}
                disabled={categoriesLoading || !categoryForm.name.trim()}
              >
                <Save className="mr-2 h-4 w-4" />
                {categoriesLoading ? 'Creating...' : 'Create Category'}
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
                Update the category information
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="editCategoryName">Category Name *</Label>
                <Input
                  id="editCategoryName"
                  placeholder="e.g., Premium Fish"
                  value={editCategoryForm.name}
                  onChange={(e) => setEditCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editCategoryDescription">Description</Label>
                <Textarea
                  id="editCategoryDescription"
                  placeholder="Brief description of this category"
                  value={editCategoryForm.description}
                  onChange={(e) => setEditCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>
              {categoriesError && (
                <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                  {categoriesError}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditCategoryOpen(false);
                  setEditingCategory(null);
                  setEditCategoryForm({ name: '', description: '' });
                }}
              >
                Cancel
              </Button>
              <Button
                className="bg-blue-600 hover:bg-blue-700"
                onClick={handleEditCategory}
                disabled={categoriesLoading || !editCategoryForm.name.trim()}
              >
                <Save className="mr-2 h-4 w-4" />
                {categoriesLoading ? 'Updating...' : 'Update Category'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Delete Category</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete the category "{categoryToDelete?.name}"? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
                <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-medium">Warning</span>
                </div>
                <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                  This will permanently delete the category and cannot be undone. Make sure no products are using this category.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsDeleteConfirmOpen(false);
                  setCategoryToDelete(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (categoryToDelete) {
                    handleDeleteCategory(categoryToDelete.category_id);
                    setIsDeleteConfirmOpen(false);
                    setCategoryToDelete(null);
                  }
                }}
                disabled={categoriesLoading}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {categoriesLoading ? 'Deleting...' : 'Delete Category'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Categories Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-2 text-sm font-medium">Category Name</th>
              <th className="text-left py-3 px-2 text-sm font-medium">Description</th>
              <th className="text-left py-3 px-2 text-sm font-medium">Products</th>
              <th className="text-left py-3 px-2 text-sm font-medium">Created</th>
              <th className="text-right py-3 px-2 text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categoriesLoading ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-muted-foreground">
                  Loading categories...
                </td>
              </tr>
            ) : categories.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-muted-foreground">
                  No categories found. Create your first category to get started.
                </td>
              </tr>
            ) : (
              categories.map((category) => (
                <tr key={category.category_id} className="border-b hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors">
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2">
                      <FolderOpen className="h-4 w-4 text-purple-600" />
                      <div className="font-medium">{category.name}</div>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-sm text-muted-foreground">
                    {category.description || 'No description'}
                  </td>
                  <td className="py-3 px-2">
                    <Badge variant="outline" className="text-xs">
                      0 products
                    </Badge>
                  </td>
                  <td className="py-3 px-2 text-sm text-muted-foreground">
                    {new Date(category.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-2">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => {
                          setEditingCategory(category);
                          setEditCategoryForm({
                            name: category.name,
                            description: category.description || '',
                          });
                          setIsEditCategoryOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        onClick={() => {
                          setCategoryToDelete(category);
                          setIsDeleteConfirmOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Function to render current view
  const renderCurrentView = () => {
    switch (currentView) {
      case "low-stock": return renderLowStockView();
      case "damaged": return renderDamagedView();
      case "expiry": return renderExpiryView();
      case "stock-adjustment": return renderStockAdjustmentView();
      case "categories": return renderCategoriesView();
      default: return renderAllProductsView();
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{getCurrentViewTitle()}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-row gap-2 mb-6">
            {/* Search Input - takes remaining space */}
            <div className="flex-1 min-w-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search products..."
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filter Dropdown - fixed width */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="shrink-0 px-3">
                  <Filter className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Filter</span>
                  <ChevronDown className="h-4 w-4 sm:ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem>
                  <Package className="mr-2 h-4 w-4" />
                  Both (Boxed & Weight)
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Scale className="mr-2 h-4 w-4" />
                  Weight-based Only
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Package className="mr-2 h-4 w-4" />
                  Boxed Only
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* View Dropdown - fixed width */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="shrink-0 px-3">
                  <Eye className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">View</span>
                  <ChevronDown className="h-4 w-4 sm:ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setCurrentView("all")}>
                  <Fish className="mr-2 h-4 w-4 text-blue-600" />
                  All Products
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setCurrentView("low-stock")}>
                  <AlertTriangle className="mr-2 h-4 w-4 text-yellow-600" />
                  Low Stock
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setCurrentView("damaged")}>
                  <AlertTriangle className="mr-2 h-4 w-4 text-red-600" />
                  Damaged
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setCurrentView("expiry")}>
                  <Calendar className="mr-2 h-4 w-4 text-orange-600" />
                  Expiry
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setCurrentView("stock-adjustment")}>
                  <RotateCcw className="mr-2 h-4 w-4 text-blue-600" />
                  Stock Adjustment
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setCurrentView("categories")}>
                  <FolderOpen className="mr-2 h-4 w-4 text-purple-600" />
                  Categories
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Dynamic View Content */}
          {renderCurrentView()}
        </CardContent>
      </Card>

      {/* Inventory Summary Cards - Below Product List */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-4 text-center">Inventory Financial Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Inventory Value */}
          <Card className="hover-card bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-blue-900 dark:text-blue-100">Total Inventory Value</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                ${totals.totalValue.toLocaleString()}
              </div>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Current selling price value
              </p>
            </CardContent>
          </Card>

          {/* Total Cost Price */}
          <Card className="hover-card bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 border-orange-200 dark:border-orange-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-orange-900 dark:text-orange-100">Total Cost Price</CardTitle>
              <Calculator className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                ${totals.totalCostPrice.toLocaleString()}
              </div>
              <p className="text-xs text-orange-700 dark:text-orange-300">
                Total investment in stock
              </p>
            </CardContent>
          </Card>

          {/* Total Potential Profit */}
          <Card className="hover-card bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-green-900 dark:text-green-100">Potential Profit</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                ${totals.totalProfit.toLocaleString()}
              </div>
              <p className="text-xs text-green-700 dark:text-green-300">
                If all stock is sold
              </p>
            </CardContent>
          </Card>

          {/* Profit Margin */}
          <Card className={`hover-card border-2 ${
            totals.profitMargin >= 30
              ? 'bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20 border-emerald-200 dark:border-emerald-800'
              : totals.profitMargin >= 15
              ? 'bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20 border-yellow-200 dark:border-yellow-800'
              : 'bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20 border-red-200 dark:border-red-800'
          }`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className={`text-sm font-medium ${
                totals.profitMargin >= 30
                  ? 'text-emerald-900 dark:text-emerald-100'
                  : totals.profitMargin >= 15
                  ? 'text-yellow-900 dark:text-yellow-100'
                  : 'text-red-900 dark:text-red-100'
              }`}>
                Profit Margin
              </CardTitle>
              <TrendingUp className={`h-4 w-4 ${
                totals.profitMargin >= 30
                  ? 'text-emerald-600'
                  : totals.profitMargin >= 15
                  ? 'text-yellow-600'
                  : 'text-red-600'
              }`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${
                totals.profitMargin >= 30
                  ? 'text-emerald-900 dark:text-emerald-100'
                  : totals.profitMargin >= 15
                  ? 'text-yellow-900 dark:text-yellow-100'
                  : 'text-red-900 dark:text-red-100'
              }`}>
                {totals.profitMargin}%
              </div>
              <p className={`text-xs ${
                totals.profitMargin >= 30
                  ? 'text-emerald-700 dark:text-emerald-300'
                  : totals.profitMargin >= 15
                  ? 'text-yellow-700 dark:text-yellow-300'
                  : 'text-red-700 dark:text-red-300'
              }`}>
                {totals.profitMargin >= 30 && "Excellent margin"}
                {totals.profitMargin >= 15 && totals.profitMargin < 30 && "Good margin"}
                {totals.profitMargin < 15 && "Low margin"}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default InventoryTab;
