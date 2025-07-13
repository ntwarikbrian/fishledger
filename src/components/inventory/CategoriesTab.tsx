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
import { FolderOpen, Edit, Trash2, Search, AlertTriangle } from "lucide-react";
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
  const [isEditCategoryOpen, setIsEditCategoryOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Form states
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
      {/* Search Bar */}
      <Card className="rounded-none border-gray-200 dark:border-gray-700">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 rounded-none border-gray-200 dark:border-gray-700"
            />
          </div>
        </CardContent>
      </Card>

      {/* Categories List */}
      <Card className="rounded-none border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-blue-600" />
            Categories ({filteredCategories.length})
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
                  className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 hover:bg-muted/50 transition-colors shadow-sm"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 flex items-center justify-center">
                        <FolderOpen className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{category.name}</h3>
                        {category.description && (
                          <p className="text-sm text-muted-foreground">{category.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">
                            Created {new Date(category.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* View Products Button - Only show if onCategoryClick is provided */}
                    {onCategoryClick && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onCategoryClick(category.category_id)}
                        className="h-8 px-3 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/30 border-blue-200 dark:border-blue-800 rounded-none"
                        title="View products in this category"
                      >
                        <FolderOpen className="h-3 w-3 mr-1" />
                        View Products
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(category)}
                      className="h-8 w-8 p-0 rounded-none"
                      title="Edit category"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openDeleteConfirmation(category)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 rounded-none"
                      title="Delete category"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Category Dialog */}
      <Dialog open={isEditCategoryOpen} onOpenChange={setIsEditCategoryOpen}>
        <DialogContent className="max-w-md rounded-none border-gray-200 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>
              Update the category information.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editCategoryName">Category Name *</Label>
              <Input
                id="editCategoryName"
                placeholder="e.g., Premium Fish, Fresh Water Fish"
                value={editCategoryForm.name}
                onChange={(e) => setEditCategoryForm({ ...editCategoryForm, name: e.target.value })}
                className="rounded-none border-gray-200 dark:border-gray-700"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editCategoryDescription">Description</Label>
              <Textarea
                id="editCategoryDescription"
                placeholder="Brief description of this category..."
                value={editCategoryForm.description}
                onChange={(e) => setEditCategoryForm({ ...editCategoryForm, description: e.target.value })}
                rows={3}
                className="rounded-none border-gray-200 dark:border-gray-700"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditCategoryOpen(false)} className="rounded-none">
              Cancel
            </Button>
            <Button onClick={handleEditCategory} className="bg-blue-600 hover:bg-blue-700 rounded-none">
              Update Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <AlertDialogContent className="rounded-none border-gray-200 dark:border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{categoryToDelete?.name}"? This action cannot be undone.
              {categoryToDelete?.product_count > 0 && (
                <span className="block mt-2 text-red-600 font-medium">
                  Warning: This category has {categoryToDelete.product_count} products associated with it.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-none">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCategory}
              className="bg-red-600 hover:bg-red-700 rounded-none"
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
