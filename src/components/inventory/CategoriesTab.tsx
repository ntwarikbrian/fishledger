/**
 * CategoriesTab Component
 * Handles product categories management including create, edit, and delete operations
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { FolderOpen, Edit, Trash2, Search, AlertTriangle, Plus } from "lucide-react";
import { useCategories } from "@/hooks/use-categories";

interface CategoriesTabProps {
  // Function to handle category click for navigation to inventory with filter
  onCategoryClick?: (categoryId: string) => void;
}

const CategoriesTab: React.FC<CategoriesTabProps> = ({ onCategoryClick }) => {
  // Categories hook for data management
  const { 
    categories, 
    loading: categoriesLoading, 
    error: categoriesError, 
    createCategory, 
    updateCategory, 
    deleteCategory 
  } = useCategories();

  // Local state for forms and dialogs
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isEditCategoryOpen, setIsEditCategoryOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Form states
  const [addCategoryForm, setAddCategoryForm] = useState({
    name: '',
    description: ''
  });

  const [editCategoryForm, setEditCategoryForm] = useState({
    name: '',
    description: ''
  });

  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<any>(null);

  // Handle edit category
  const handleEditCategory = async () => {
    if (!editCategoryForm.name.trim() || !editingCategory) {
      toast.error('Category name is required');
      return;
    }

    const success = await updateCategory(editingCategory.category_id, {
      name: editCategoryForm.name.trim(),
      description: editCategoryForm.description.trim() || undefined
    });

    if (success) {
      setEditCategoryForm({ name: '', description: '' });
      setEditingCategory(null);
      setIsEditCategoryOpen(false);
      toast.success('Category updated successfully!');
    } else {
      // Show specific error message if available
      const errorMessage = categoriesError || 'Failed to update category. Please try again.';
      toast.error(errorMessage);
    }
  };

  // Handle add category
  const handleAddCategory = async () => {
    if (!addCategoryForm.name.trim()) {
      toast.error('Category name is required');
      return;
    }

    const success = await createCategory({
      name: addCategoryForm.name.trim(),
      description: addCategoryForm.description.trim() || undefined
    });

    if (success) {
      setAddCategoryForm({ name: '', description: '' });
      setIsAddCategoryOpen(false);
      toast.success('Category created successfully!');
    } else {
      // Show specific error message if available
      const errorMessage = categoriesError || 'Failed to create category. Please try again.';
      toast.error(errorMessage);
    }
  };

  // Handle delete category
  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;

    const result = await deleteCategory(categoryToDelete.category_id);

    if (result.success) {
      setCategoryToDelete(null);
      setIsDeleteConfirmOpen(false);
      toast.success('Category deleted successfully!');
    } else {
      // Show specific error message from the API response
      toast.error(result.error || 'Failed to delete category. Please try again.');
      // Don't close the dialog on error, let user try again or cancel
    }
  };

  // Open edit dialog
  const openEditDialog = (category: any) => {
    setEditingCategory(category);
    setEditCategoryForm({
      name: category.name,
      description: category.description || ''
    });
    setIsEditCategoryOpen(true);
  };

  // Open delete confirmation
  const openDeleteConfirmation = (category: any) => {
    setCategoryToDelete(category);
    setIsDeleteConfirmOpen(true);
  };

  // Filter categories based on search term
  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Search Bar and Add Category Button */}
      <Card className="rounded-xl border-0 shadow-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
        <CardContent className="pt-6">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 rounded-lg border-0 bg-gray-100 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-700 transition-colors"
              />
            </div>
            <Button
              onClick={() => setIsAddCategoryOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 px-4 py-2"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Categories List */}
      <Card className="rounded-xl border-0 shadow-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <FolderOpen className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <span className="text-xl font-bold text-gray-900 dark:text-gray-100">Categories</span>
              <span className="ml-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-sm font-medium">
                {filteredCategories.length}
              </span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {categoriesLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-muted-foreground mt-2">Loading categories...</p>
            </div>
          ) : categoriesError ? (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Error Loading Categories</h3>
              <p className="text-muted-foreground">{categoriesError}</p>
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="text-center py-8">
              <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchTerm ? 'No Categories Found' : 'No Categories Yet'}
              </h3>
              <p className="text-muted-foreground">
                {searchTerm 
                  ? 'Try adjusting your search terms.' 
                  : 'Start by creating your first product category.'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCategories.map((category) => (
                <div
                  key={category.category_id}
                  className={`group relative overflow-hidden rounded-xl bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-700 border-0 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02] p-6 ${
                    onCategoryClick ? 'cursor-pointer hover:bg-gradient-to-r hover:from-blue-50 hover:to-gray-50 dark:hover:from-blue-900/20 dark:hover:to-gray-700' : ''
                  }`}
                  onClick={() => onCategoryClick && onCategoryClick(category.category_id)}
                  title={onCategoryClick ? "Click to view products in this category" : undefined}
                >
                  {/* Background decoration */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-transparent dark:from-blue-900/20 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                  {/* Click indicator */}
                  {onCategoryClick && (
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center">
                        <FolderOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                    </div>
                  )}

                  <div className="relative flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/40 dark:to-blue-800/40 rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow duration-300">
                          <FolderOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                            {category.name}
                          </h3>
                          {category.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                              {category.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                              Created {new Date(category.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="relative flex items-center gap-2 z-10">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent triggering the category click
                          openEditDialog(category);
                        }}
                        className="h-9 w-9 p-0 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 opacity-70 group-hover:opacity-100"
                        title="Edit category"
                      >
                        <Edit className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent triggering the category click
                          openDeleteConfirmation(category);
                        }}
                        className="h-9 w-9 p-0 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 hover:text-red-700 transition-colors duration-200 opacity-70 group-hover:opacity-100"
                        title="Delete category"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Category Dialog */}
      <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
        <DialogContent className="max-w-md rounded-xl border-0 shadow-2xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">Add New Category</DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              Create a new category to organize your products.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="addCategoryName" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Category Name *</Label>
              <Input
                id="addCategoryName"
                placeholder="e.g., Premium Fish, Fresh Water Fish"
                value={addCategoryForm.name}
                onChange={(e) => setAddCategoryForm({ ...addCategoryForm, name: e.target.value })}
                className="rounded-lg border-0 bg-gray-100 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-700 transition-colors"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="addCategoryDescription" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Description</Label>
              <Textarea
                id="addCategoryDescription"
                placeholder="Brief description of this category..."
                value={addCategoryForm.description}
                onChange={(e) => setAddCategoryForm({ ...addCategoryForm, description: e.target.value })}
                rows={3}
                className="rounded-lg border-0 bg-gray-100 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-700 transition-colors resize-none"
              />
            </div>
          </div>
          <DialogFooter className="gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setIsAddCategoryOpen(false);
                setAddCategoryForm({ name: '', description: '' });
              }}
              className="rounded-lg border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddCategory}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={isEditCategoryOpen} onOpenChange={setIsEditCategoryOpen}>
        <DialogContent className="max-w-md rounded-xl border-0 shadow-2xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>
              Update the category information.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editCategoryName" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Category Name *</Label>
              <Input
                id="editCategoryName"
                placeholder="e.g., Premium Fish, Fresh Water Fish"
                value={editCategoryForm.name}
                onChange={(e) => setEditCategoryForm({ ...editCategoryForm, name: e.target.value })}
                className="rounded-lg border-0 bg-gray-100 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-700 transition-colors"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editCategoryDescription" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Description</Label>
              <Textarea
                id="editCategoryDescription"
                placeholder="Brief description of this category..."
                value={editCategoryForm.description}
                onChange={(e) => setEditCategoryForm({ ...editCategoryForm, description: e.target.value })}
                rows={3}
                className="rounded-lg border-0 bg-gray-100 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-700 transition-colors resize-none"
              />
            </div>
          </div>
          <DialogFooter className="gap-3">
            <Button
              variant="outline"
              onClick={() => setIsEditCategoryOpen(false)}
              className="rounded-lg border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditCategory}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
            >
              Update Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <AlertDialogContent className="rounded-xl border-0 shadow-2xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">Delete Category</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600 dark:text-gray-400">
              Are you sure you want to delete "{categoryToDelete?.name}"? This action cannot be undone.
              {categoryToDelete?.product_count > 0 && (
                <span className="block mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 font-medium">
                  ⚠️ Warning: This category has {categoryToDelete.product_count} products associated with it.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3">
            <AlertDialogCancel className="rounded-lg border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCategory}
              className="bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
            >
              Delete Category
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CategoriesTab;
