/**
 * InventoryTab Component
 * Handles the inventory view with different product views and summary cards
 */

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Fish, Edit, Trash2, Package, Scale, ChevronDown, Eye, AlertTriangle, Calendar, RotateCcw, DollarSign, TrendingUp, Calculator, FolderOpen } from "lucide-react";
import { useCategories } from "@/hooks/use-categories";
import { useProducts, Product, CreateProductData } from "@/hooks/use-products";
import { stockMovementsApi } from "@/lib/api";

type ViewType = "all" | "low-stock" | "damaged" | "expiry" | "stock-adjustment";

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
    damagedStats: {
      totalDamagedValue: number;
      totalDamagedItems: number;
      totalDamagedWeight: number;
      damagedCount: number;
    };
  };
  // Category filtering props
  selectedCategoryId?: string;
  onClearCategoryFilter?: () => void;
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
  selectedCategoryId,
  onClearCategoryFilter,
}) => {
  // Categories hook
  const { categories } = useCategories();

  // Products hook
  const {
    products,
    loading: productsLoading,
    error: productsError,
    getLowStockProducts,
    getExpiringProducts,
    getDamagedProducts,
    fetchDamagedProducts,
    updateProduct,
    deleteProduct
  } = useProducts();

  // State for damaged products
  const [damagedProducts, setDamagedProducts] = useState<any[]>([]);
  const [loadingDamaged, setLoadingDamaged] = useState(false);

  // State for stock movements
  const [stockMovements, setStockMovements] = useState<any[]>([]);
  const [loadingMovements, setLoadingMovements] = useState(false);
  const [movementsError, setMovementsError] = useState<string | null>(null);
  const [movementTypeFilter, setMovementTypeFilter] = useState<string>('all');

  // State for edit product dialog
  const [isEditProductOpen, setIsEditProductOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editFormData, setEditFormData] = useState<CreateProductData>({
    name: '',
    category_id: '',
    quantity_box: 0,
    box_to_kg_ratio: 20,
    quantity_kg: 0,
    cost_per_box: 0,
    cost_per_kg: 0,
    price_per_box: 0,
    price_per_kg: 0,
    boxed_low_stock_threshold: 10,
    expiry_date: '',
    damaged_reason: '',
    damaged_date: '',
    loss_value: 0,
    damaged_approval: false
  });

  // State for delete product confirmation dialog
  const [isDeleteProductConfirmOpen, setIsDeleteProductConfirmOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // Handle opening edit product dialog
  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setEditFormData({
      name: product.name,
      category_id: product.category_id,
      quantity_box: product.quantity_box,
      box_to_kg_ratio: product.box_to_kg_ratio,
      quantity_kg: product.quantity_kg,
      cost_per_box: product.cost_per_box,
      cost_per_kg: product.cost_per_kg,
      price_per_box: product.price_per_box,
      price_per_kg: product.price_per_kg,
      boxed_low_stock_threshold: product.boxed_low_stock_threshold,
      expiry_date: product.expiry_date || '',
      damaged_reason: product.damaged_reason || '',
      damaged_date: product.damaged_date || '',
      loss_value: product.loss_value || 0,
      damaged_approval: product.damaged_approval || false
    });
    setIsEditProductOpen(true);
  };

  // Handle saving edited product
  const handleSaveEditProduct = async () => {
    if (!editingProduct) return;

    try {
      // Only send the editable fields to the backend
      const editableFields = {
        name: editFormData.name,
        category_id: editFormData.category_id,
        box_to_kg_ratio: editFormData.box_to_kg_ratio,
        cost_per_box: editFormData.cost_per_box,
        cost_per_kg: editFormData.cost_per_kg,
        price_per_box: editFormData.price_per_box,
        price_per_kg: editFormData.price_per_kg
      };

      const success = await updateProduct(editingProduct.product_id, editableFields);
      if (success) {
        setIsEditProductOpen(false);
        setEditingProduct(null);
        // Show success message (you can replace with toast notification)
        alert('Product updated successfully!');
      } else {
        alert('Failed to update product. Please try again.');
      }
    } catch (error) {
      console.error('Error updating product:', error);
      alert('An error occurred while updating the product.');
    }
  };

  // Handle opening delete confirmation dialog
  const handleDeleteProductClick = (product: Product) => {
    setProductToDelete(product);
    setIsDeleteProductConfirmOpen(true);
  };

  // Handle confirming product deletion
  const handleConfirmDeleteProduct = async () => {
    if (!productToDelete) return;

    try {
      const success = await deleteProduct(productToDelete.product_id);
      if (success) {
        setIsDeleteProductConfirmOpen(false);
        setProductToDelete(null);
        // Show success message (you can replace with toast notification)
        alert('Product and all related records deleted successfully!');
      } else {
        // Get the specific error message from the hook
        const errorMessage = error || 'Failed to delete product. Please try again.';
        alert(errorMessage);
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('An error occurred while deleting the product.');
    }
  };



  // Load damaged products when damaged view is selected
  const loadDamagedProducts = async () => {
    setLoadingDamaged(true);
    try {
      const damaged = await fetchDamagedProducts();
      setDamagedProducts(damaged);
    } catch (error) {
      console.error('Error loading damaged products:', error);
    } finally {
      setLoadingDamaged(false);
    }
  };

  // Load damaged products when view changes to damaged
  useEffect(() => {
    if (currentView === 'damaged') {
      loadDamagedProducts();
    }
  }, [currentView]);

  // Load stock movements when view changes to stock adjustment
  useEffect(() => {
    if (currentView === 'stock-adjustment') {
      loadStockMovements();
    }
  }, [currentView]);

  const loadStockMovements = async (filterType?: string) => {
    setLoadingMovements(true);
    setMovementsError(null);
    try {
      const params: any = { limit: 50 };
      const currentFilter = filterType || movementTypeFilter;

      if (currentFilter && currentFilter !== 'all') {
        params.movement_type = currentFilter;
      }

      const response = await stockMovementsApi.getAll(params);
      if (response.success && response.data) {
        setStockMovements(response.data);
      } else {
        setMovementsError(response.error || 'Failed to load stock movements');
      }
    } catch (error) {
      console.error('Error loading stock movements:', error);
      setMovementsError('Failed to load stock movements');
    } finally {
      setLoadingMovements(false);
    }
  };

  // Function to get current view title
  const getCurrentViewTitle = () => {
    switch (currentView) {
      case "low-stock": return "Low Stock Items";
      case "damaged": return "Damaged Products";
      case "expiry": return "Products Nearing Expiry";
      case "stock-adjustment": return "Stock Adjustment History";
      default: return "Product Inventory Management";
    }
  };

  // Render functions for different views
  const renderAllProductsView = () => {
    if (productsLoading) {
      return (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-muted-foreground mt-2">Loading products...</p>
        </div>
      );
    }

    if (productsError) {
      return (
        <div className="text-center py-8">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Error Loading Products</h3>
          <p className="text-muted-foreground">{productsError}</p>
        </div>
      );
    }

    // Filter products by selected category if one is selected
    const filteredProducts = selectedCategoryId
      ? products.filter(product => product.category_id === selectedCategoryId)
      : products;

    // Get the selected category name for display
    const selectedCategory = selectedCategoryId
      ? categories.find(cat => cat.category_id === selectedCategoryId)
      : null;

    if (products.length === 0) {
      return (
        <div className="text-center py-8">
          <Fish className="h-12 w-12 text-blue-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Products Found</h3>
          <p className="text-muted-foreground">Start by adding your first fish product to the inventory</p>
        </div>
      );
    }

    if (filteredProducts.length === 0 && selectedCategoryId) {
      return (
        <div className="text-center py-8">
          <Fish className="h-12 w-12 text-blue-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Products Found in Category</h3>
          <p className="text-muted-foreground">
            No products found in "{selectedCategory?.name}" category
          </p>
          {onClearCategoryFilter && (
            <Button
              variant="outline"
              onClick={onClearCategoryFilter}
              className="mt-4 rounded-none"
            >
              Clear Filter
            </Button>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Category Filter Display */}
        {selectedCategoryId && selectedCategory && onClearCategoryFilter && (
          <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 shadow-sm">
            <div className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Filtered by category: <strong>{selectedCategory.name}</strong>
              </span>
              <span className="text-xs text-blue-600 dark:text-blue-400">
                ({filteredProducts.length} products)
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearCategoryFilter}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-none"
            >
              Clear Filter
            </Button>
          </div>
        )}

        {/* Products Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-2 text-sm font-medium">Product Name</th>
                <th className="text-left py-3 px-2 text-sm font-medium">Category</th>
                <th className="text-left py-3 px-2 text-sm font-medium">Boxes</th>
                <th className="text-left py-3 px-2 text-sm font-medium">KG Stock</th>
                <th className="text-left py-3 px-2 text-sm font-medium">Box Ratio</th>
                <th className="text-left py-3 px-2 text-sm font-medium">Pricing</th>
                <th className="text-left py-3 px-2 text-sm font-medium">Cost</th>
                <th className="text-left py-3 px-2 text-sm font-medium">Profit</th>
                <th className="text-right py-3 px-2 text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.product_id} className="border-b hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors">
                  {/* Product Name */}
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2">
                      <Fish className="h-4 w-4 text-blue-600" />
                      <div className="font-medium">{product.name}</div>
                    </div>
                  </td>

                  {/* Category */}
              <td className="py-3 px-2 text-sm text-muted-foreground">
                {product.product_categories?.name || 'Uncategorized'}
              </td>

              {/* Boxes */}
              <td className="py-3 px-2 text-sm">
                <div className="flex items-center gap-1">
                  <Package className="h-3 w-3 text-blue-600" />
                  <span className="font-medium">{product.quantity_box}</span>
                </div>
              </td>

              {/* KG Stock */}
              <td className="py-3 px-2 text-sm">
                <div className="flex items-center gap-1">
                  <Scale className="h-3 w-3 text-green-600" />
                  <span className="font-medium">{product.quantity_kg} kg</span>
                </div>
              </td>

              {/* Box Ratio */}
              <td className="py-3 px-2 text-sm text-muted-foreground">
                {product.box_to_kg_ratio} kg/box
              </td>

              {/* Pricing */}
              <td className="py-3 px-2 text-sm">
                <div className="space-y-1">
                  <div className="text-xs text-blue-600 font-medium">${product.price_per_box.toFixed(2)}/box</div>
                  <div className="text-xs text-green-600 font-medium">${product.price_per_kg.toFixed(2)}/kg</div>
                </div>
              </td>

              {/* Cost */}
              <td className="py-3 px-2 text-sm">
                <div className="space-y-1">
                  <div className="text-xs text-orange-600">${product.cost_per_box.toFixed(2)}/box</div>
                  <div className="text-xs text-orange-500">${product.cost_per_kg.toFixed(2)}/kg</div>
                </div>
              </td>

              {/* Profit */}
              <td className="py-3 px-2 text-sm">
                <div className="space-y-1">
                  <div className="text-xs text-emerald-600 font-medium">
                    ${(product.price_per_box - product.cost_per_box).toFixed(2)}/box
                  </div>
                  <div className="text-xs text-emerald-500 font-medium">
                    ${(product.price_per_kg - product.cost_per_kg).toFixed(2)}/kg
                  </div>
                </div>
              </td>

              {/* Actions */}
              <td className="py-3 px-2">
                <div className="flex justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => handleEditProduct(product)}
                    title="Edit product"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                    onClick={() => handleDeleteProductClick(product)}
                    title="Delete product"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    </div>
    );
  };

  const renderLowStockView = () => {
    const lowStockProducts = getLowStockProducts();

    if (productsLoading) {
      return (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600 mx-auto"></div>
          <p className="text-muted-foreground mt-2">Loading low stock products...</p>
        </div>
      );
    }

    if (lowStockProducts.length === 0) {
      return (
        <div className="text-center py-8">
          <AlertTriangle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">All Stock Levels Good</h3>
          <p className="text-muted-foreground">No products are currently running low on stock</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="text-center py-4">
          <AlertTriangle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
          <h3 className="text-lg font-semibold mb-1">Low Stock Alert</h3>
          <p className="text-sm text-muted-foreground">
            {lowStockProducts.length} product(s) need restocking soon
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-2 text-sm font-medium">Product Name</th>
                <th className="text-left py-3 px-2 text-sm font-medium">Category</th>
                <th className="text-left py-3 px-2 text-sm font-medium">Current Stock</th>
                <th className="text-left py-3 px-2 text-sm font-medium">Low Stock Threshold</th>
                <th className="text-left py-3 px-2 text-sm font-medium">Box Ratio</th>
                <th className="text-left py-3 px-2 text-sm font-medium">Pricing</th>
                <th className="text-left py-3 px-2 text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {lowStockProducts.map((product) => (
                <tr key={product.product_id} className="border-b hover:bg-muted/50">
                  <td className="py-3 px-2 text-sm font-medium">{product.name}</td>
                  <td className="py-3 px-2 text-sm">{product.product_categories?.name || 'Uncategorized'}</td>
                  <td className="py-3 px-2 text-sm">
                    <div className="space-y-1">
                      <div className="text-yellow-600 font-medium">{product.quantity_box} boxes</div>
                      <div className="text-yellow-600">{product.quantity_kg} kg</div>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-sm">
                    <div className="text-red-600 font-medium">{product.boxed_low_stock_threshold} boxes</div>
                  </td>
                  <td className="py-3 px-2 text-sm">{product.box_to_kg_ratio} kg/box</td>
                  <td className="py-3 px-2 text-sm">
                    <div className="space-y-1">
                      <div>${product.price_per_box.toFixed(2)}/box</div>
                      <div>${product.price_per_kg.toFixed(2)}/kg</div>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-sm">
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditProduct(product)}
                        className="h-8 px-2"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setProductToDelete(product);
                          setIsDeleteProductConfirmOpen(true);
                        }}
                        className="h-8 px-2 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderDamagedView = () => {
    if (loadingDamaged) {
      return (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
          <p className="text-muted-foreground mt-2">Loading damaged products...</p>
        </div>
      );
    }

    if (damagedProducts.length === 0) {
      return (
        <div className="text-center py-8">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Damaged Products</h3>
          <p className="text-muted-foreground">No damaged products have been recorded yet</p>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-2 text-sm font-medium">Product Name</th>
              <th className="text-left py-3 px-2 text-sm font-medium">Quantity</th>
              <th className="text-left py-3 px-2 text-sm font-medium">Reason</th>
              <th className="text-left py-3 px-2 text-sm font-medium">Date</th>
              <th className="text-left py-3 px-2 text-sm font-medium">Loss Value</th>
              <th className="text-left py-3 px-2 text-sm font-medium">Status</th>
              <th className="text-left py-3 px-2 text-sm font-medium">Reported By</th>
              <th className="text-left py-3 px-2 text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {damagedProducts.map((damage) => (
              <tr key={damage.damage_id} className="border-b hover:bg-muted/50">
                <td className="py-3 px-2">
                  <div>
                    <div className="font-medium">{damage.products?.name || 'Unknown Product'}</div>
                    <div className="text-sm text-muted-foreground">
                      {damage.products?.product_categories?.name || 'No Category'}
                    </div>
                  </div>
                </td>
                <td className="py-3 px-2">
                  <div className="text-sm">
                    {damage.damaged_boxes > 0 && (
                      <div>{damage.damaged_boxes} boxes</div>
                    )}
                    {damage.damaged_kg > 0 && (
                      <div>{damage.damaged_kg} kg</div>
                    )}
                    {damage.damaged_boxes === 0 && damage.damaged_kg === 0 && (
                      <div className="text-muted-foreground">No quantity</div>
                    )}
                  </div>
                </td>
                <td className="py-3 px-2">
                  <div>
                    <span className="text-sm">{damage.damaged_reason || 'No reason provided'}</span>
                    {damage.description && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {damage.description}
                      </div>
                    )}
                  </div>
                </td>
                <td className="py-3 px-2">
                  <span className="text-sm">
                    {damage.damaged_date ? new Date(damage.damaged_date).toLocaleDateString() : 'No date'}
                  </span>
                </td>
                <td className="py-3 px-2">
                  <span className="text-sm font-medium text-red-600">
                    ${damage.loss_value?.toFixed(2) || '0.00'}
                  </span>
                </td>
                <td className="py-3 px-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    damage.damaged_approval
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                  }`}>
                    {damage.damaged_approval ? 'Approved' : 'Pending'}
                  </span>
                </td>
                <td className="py-3 px-2">
                  <span className="text-sm">
                    {damage.reported_by_user?.owner_name || 'Unknown'}
                  </span>
                </td>
                <td className="py-3 px-2">
                  <div className="flex items-center gap-2">
                    {!damage.damaged_approval && (
                      <Button size="sm" variant="outline" className="text-green-600 hover:text-green-700">
                        Approve
                      </Button>
                    )}
                    <Button size="sm" variant="outline" className="text-blue-600 hover:text-blue-700">
                      <Eye className="h-3 w-3" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderExpiryView = () => {
    // Show all products with expiry dates, sorted by expiry date (soonest first)
    const productsWithExpiry = products
      .filter(product => product.expiry_date)
      .sort((a, b) => {
        const dateA = new Date(a.expiry_date || '').getTime();
        const dateB = new Date(b.expiry_date || '').getTime();
        return dateA - dateB;
      });

    if (productsLoading) {
      return (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
          <p className="text-muted-foreground mt-2">Loading products with expiry dates...</p>
        </div>
      );
    }

    if (productsWithExpiry.length === 0) {
      return (
        <div className="text-center py-8">
          <Calendar className="h-12 w-12 text-blue-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Products with Expiry Dates</h3>
          <p className="text-muted-foreground">No products have expiry dates set in the system</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="text-center py-4">
          <Calendar className="h-8 w-8 text-orange-500 mx-auto mb-2" />
          <h3 className="text-lg font-semibold mb-1">Product Expiry Tracking</h3>
          <p className="text-sm text-muted-foreground">
            {productsWithExpiry.length} product(s) with expiry dates
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-2 text-sm font-medium">Product Name</th>
                <th className="text-left py-3 px-2 text-sm font-medium">Category</th>
                <th className="text-left py-3 px-2 text-sm font-medium">Current Stock</th>
                <th className="text-left py-3 px-2 text-sm font-medium">Expiry Date</th>
                <th className="text-left py-3 px-2 text-sm font-medium">Days Until Expiry</th>
                <th className="text-left py-3 px-2 text-sm font-medium">Box Ratio</th>
                <th className="text-left py-3 px-2 text-sm font-medium">Pricing</th>
                <th className="text-left py-3 px-2 text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {productsWithExpiry.map((product) => {
                const expiryDate = new Date(product.expiry_date || '');
                const today = new Date();
                const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                const isUrgent = daysUntilExpiry <= 3;
                const isWarning = daysUntilExpiry <= 7;

                return (
                  <tr key={product.product_id} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-2 text-sm font-medium">{product.name}</td>
                    <td className="py-3 px-2 text-sm">{product.product_categories?.name || 'Uncategorized'}</td>
                    <td className="py-3 px-2 text-sm">
                      <div className="space-y-1">
                        <div>{product.quantity_box} boxes</div>
                        <div>{product.quantity_kg} kg</div>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-sm">
                      {product.expiry_date ? new Date(product.expiry_date).toLocaleDateString() : 'No expiry date'}
                    </td>
                    <td className="py-3 px-2 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        isUrgent ? 'bg-red-100 text-red-800' :
                        isWarning ? 'bg-orange-100 text-orange-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {daysUntilExpiry > 0 ? `${daysUntilExpiry} days` : 'Expired'}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-sm">{product.box_to_kg_ratio} kg/box</td>
                    <td className="py-3 px-2 text-sm">
                      <div className="space-y-1">
                        <div>${product.price_per_box.toFixed(2)}/box</div>
                        <div>${product.price_per_kg.toFixed(2)}/kg</div>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-sm">
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditProduct(product)}
                          className="h-8 px-2"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setProductToDelete(product);
                            setIsDeleteProductConfirmOpen(true);
                          }}
                          className="h-8 px-2 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderStockAdjustmentView = () => {
    if (loadingMovements) {
      return (
        <div className="space-y-4">
          <div className="text-center py-8">
            <RotateCcw className="h-12 w-12 text-blue-500 mx-auto mb-4 animate-spin" />
            <h3 className="text-lg font-semibold mb-2">Loading Stock Movements...</h3>
            <p className="text-muted-foreground">Please wait while we fetch the data</p>
          </div>
        </div>
      );
    }

    if (movementsError) {
      return (
        <div className="space-y-4">
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Error Loading Stock Movements</h3>
            <p className="text-muted-foreground">{movementsError}</p>
            <Button onClick={() => loadStockMovements()} className="mt-4">
              Try Again
            </Button>
          </div>
        </div>
      );
    }

    if (stockMovements.length === 0) {
      return (
        <div className="space-y-4">
          <div className="text-center py-8">
            <RotateCcw className="h-12 w-12 text-blue-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Stock Movement History</h3>
            <p className="text-muted-foreground">Track all stock adjustments and changes</p>
          </div>
          <div className="text-center py-4 text-muted-foreground">
            No stock movements recorded yet
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="text-center py-4">
          <RotateCcw className="h-8 w-8 text-blue-500 mx-auto mb-2" />
          <h3 className="text-lg font-semibold mb-1">Stock Movement History</h3>
          <p className="text-sm text-muted-foreground">
            {stockMovements.length} movement(s) found
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="movementFilter" className="text-sm font-medium">Filter by type:</Label>
            <Select value={movementTypeFilter} onValueChange={(value) => {
              setMovementTypeFilter(value);
              loadStockMovements(value);
            }}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All movements" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Movements</SelectItem>
                <SelectItem value="new_stock">New Stock</SelectItem>
                <SelectItem value="damaged">Damaged</SelectItem>
                <SelectItem value="stock_correction">Stock Corrections</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadStockMovements()}
            disabled={loadingMovements}
          >
            <RotateCcw className={`h-4 w-4 mr-2 ${loadingMovements ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-2 text-sm font-medium w-20">Date</th>
                <th className="text-left py-3 px-2 text-sm font-medium w-28">Product</th>
                <th className="text-left py-3 px-2 text-sm font-medium w-24">Type</th>
                <th className="text-left py-3 px-2 text-sm font-medium w-24">Stock Before</th>
                <th className="text-left py-3 px-2 text-sm font-medium w-20">Change</th>
                <th className="text-left py-3 px-2 text-sm font-medium w-36">Reason & Details</th>
                <th className="text-left py-3 px-2 text-sm font-medium w-24">Performed By</th>
                <th className="text-left py-3 px-2 text-sm font-medium w-16">Status</th>
              </tr>
            </thead>
            <tbody>
              {stockMovements.map((movement) => {
                // Calculate stock before the change
                const currentBoxes = movement.products?.quantity_box || 0;
                const currentKg = movement.products?.quantity_kg || 0;
                const stockBeforeBoxes = currentBoxes - movement.box_change;
                const stockBeforeKg = currentKg - movement.kg_change;

                return (
                  <tr key={movement.movement_id} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-2 text-sm">
                      {new Date(movement.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-2 text-sm font-medium">
                      {movement.products?.name || 'Unknown Product'}
                    </td>
                    <td className="py-3 px-2 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        movement.movement_type === 'damaged' ? 'bg-red-100 text-red-800' :
                        movement.movement_type === 'new_stock' ? 'bg-green-100 text-green-800' :
                        movement.movement_type === 'stock_correction' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {movement.movement_type.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-sm">
                      <div className="space-y-1 text-muted-foreground">
                        <div>{stockBeforeBoxes} boxes</div>
                        <div>{stockBeforeKg} kg</div>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-sm">
                      <div className="space-y-1">
                        {movement.box_change !== 0 && (
                          <div className={movement.box_change > 0 ? 'text-green-600' : 'text-red-600'}>
                            {movement.box_change > 0 ? '+' : ''}{movement.box_change}
                          </div>
                        )}
                        {movement.kg_change !== 0 && (
                          <div className={movement.kg_change > 0 ? 'text-green-600' : 'text-red-600'}>
                            {movement.kg_change > 0 ? '+' : ''}{movement.kg_change}
                          </div>
                        )}
                      </div>
                    </td>
                  <td className="py-3 px-2 text-sm text-muted-foreground">
                    <div className="max-w-xs">
                      {movement.reason || 'No reason provided'}
                      {movement.movement_type === 'new_stock' && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Added: {movement.box_change > 0 && `${movement.box_change} boxes`}
                          {movement.box_change > 0 && movement.kg_change > 0 && ', '}
                          {movement.kg_change > 0 && `${movement.kg_change} kg`}
                        </div>
                      )}
                      {movement.movement_type === 'stock_correction' && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Adjustment: {movement.box_change !== 0 && `${movement.box_change > 0 ? '+' : ''}${movement.box_change} boxes`}
                          {movement.box_change !== 0 && movement.kg_change !== 0 && ', '}
                          {movement.kg_change !== 0 && `${movement.kg_change > 0 ? '+' : ''}${movement.kg_change} kg`}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-2 text-sm">
                    {movement.users?.owner_name || movement.users?.business_name || 'Unknown'}
                  </td>
                  <td className="py-3 px-2 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      movement.status === 'completed' ? 'bg-green-100 text-green-800' :
                      movement.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {movement.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Categories view removed - now handled by dedicated CategoriesTab component


  // Function to render current view
  const renderCurrentView = () => {
    switch (currentView) {
      case "low-stock": return renderLowStockView();
      case "damaged": return renderDamagedView();
      case "expiry": return renderExpiryView();
      case "stock-adjustment": return renderStockAdjustmentView();
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
          {/* View Dropdown - centered */}
          <div className="flex justify-center mb-6">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="px-4">
                  <Eye className="h-4 w-4 mr-2" />
                  View
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-48">
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
                Current selling price value • {products.length} products
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
                {totals.profitMargin.toFixed(1)}% margin • If all stock is sold
              </p>
            </CardContent>
          </Card>

          {/* Damaged Value Stats */}
          <Card className={`hover-card border-2 ${
            totals.damagedStats.totalDamagedValue <= 1000
              ? 'bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20 border-emerald-200 dark:border-emerald-800'
              : totals.damagedStats.totalDamagedValue <= 5000
              ? 'bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20 border-yellow-200 dark:border-yellow-800'
              : 'bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20 border-red-200 dark:border-red-800'
          }`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className={`text-sm font-medium ${
                totals.damagedStats.totalDamagedValue <= 1000
                  ? 'text-emerald-900 dark:text-emerald-100'
                  : totals.damagedStats.totalDamagedValue <= 5000
                  ? 'text-yellow-900 dark:text-yellow-100'
                  : 'text-red-900 dark:text-red-100'
              }`}>
                Damaged Value
              </CardTitle>
              <AlertTriangle className={`h-4 w-4 ${
                totals.damagedStats.totalDamagedValue <= 1000
                  ? 'text-emerald-600'
                  : totals.damagedStats.totalDamagedValue <= 5000
                  ? 'text-yellow-600'
                  : 'text-red-600'
              }`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${
                totals.damagedStats.totalDamagedValue <= 1000
                  ? 'text-emerald-900 dark:text-emerald-100'
                  : totals.damagedStats.totalDamagedValue <= 5000
                  ? 'text-yellow-900 dark:text-yellow-100'
                  : 'text-red-900 dark:text-red-100'
              }`}>
                ${totals.damagedStats.totalDamagedValue.toLocaleString()}
              </div>
              <p className={`text-xs ${
                totals.damagedStats.totalDamagedValue <= 1000
                  ? 'text-emerald-700 dark:text-emerald-300'
                  : totals.damagedStats.totalDamagedValue <= 5000
                  ? 'text-yellow-700 dark:text-yellow-300'
                  : 'text-red-700 dark:text-red-300'
              }`}>
                {totals.damagedStats.damagedCount === 0
                  ? "No damage incidents"
                  : `${totals.damagedStats.damagedCount} incidents • ${totals.damagedStats.totalDamagedItems} boxes • ${totals.damagedStats.totalDamagedWeight.toFixed(1)}kg`
                }
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Product Dialog */}
      <Dialog open={isEditProductOpen} onOpenChange={setIsEditProductOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>
              Update product name, category, box ratio, and pricing information. Inventory quantities and other fields can be managed separately.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">Basic Information</h4>
              <div className="grid grid-cols-1 gap-4">
                {/* Product Name */}
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Product Name</Label>
                  <Input
                    id="edit-name"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    placeholder="Enter product name"
                  />
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <Label htmlFor="edit-category">Category</Label>
                  <Select
                    value={editFormData.category_id}
                    onValueChange={(value) => setEditFormData({ ...editFormData, category_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.category_id} value={category.category_id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Box to KG Ratio */}
                <div className="space-y-2">
                  <Label htmlFor="edit-box-ratio">Box to KG Ratio</Label>
                  <Input
                    id="edit-box-ratio"
                    type="number"
                    step="0.1"
                    value={editFormData.box_to_kg_ratio}
                    onChange={(e) => setEditFormData({ ...editFormData, box_to_kg_ratio: parseFloat(e.target.value) || 20 })}
                    placeholder="20.0"
                  />
                </div>
              </div>
            </div>

            {/* Cost Pricing */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">Cost Pricing</h4>
              <div className="grid grid-cols-2 gap-4">
                {/* Cost Price per Box */}
                <div className="space-y-2">
                  <Label htmlFor="edit-cost-box">Cost per Box</Label>
                  <Input
                    id="edit-cost-box"
                    type="number"
                    step="0.01"
                    value={editFormData.cost_per_box}
                    onChange={(e) => setEditFormData({ ...editFormData, cost_per_box: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                  />
                </div>

                {/* Cost Price per KG */}
                <div className="space-y-2">
                  <Label htmlFor="edit-cost-kg">Cost per KG</Label>
                  <Input
                    id="edit-cost-kg"
                    type="number"
                    step="0.01"
                    value={editFormData.cost_per_kg}
                    onChange={(e) => setEditFormData({ ...editFormData, cost_per_kg: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            {/* Selling Pricing */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">Selling Pricing</h4>
              <div className="grid grid-cols-2 gap-4">
                {/* Selling Price per Box */}
                <div className="space-y-2">
                  <Label htmlFor="edit-price-box">Selling per Box</Label>
                  <Input
                    id="edit-price-box"
                    type="number"
                    step="0.01"
                    value={editFormData.price_per_box}
                    onChange={(e) => setEditFormData({ ...editFormData, price_per_box: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                  />
                </div>

                {/* Selling Price per KG */}
                <div className="space-y-2">
                  <Label htmlFor="edit-price-kg">Selling per KG</Label>
                  <Input
                    id="edit-price-kg"
                    type="number"
                    step="0.01"
                    value={editFormData.price_per_kg}
                    onChange={(e) => setEditFormData({ ...editFormData, price_per_kg: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditProductOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEditProduct}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Product Confirmation Dialog */}
      <Dialog open={isDeleteProductConfirmOpen} onOpenChange={setIsDeleteProductConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription className="space-y-2">
              <p>Are you sure you want to delete "{productToDelete?.name}"?</p>
              <p className="text-red-600 font-medium">
                ⚠️ This will permanently delete the product and ALL related records including:
              </p>
              <ul className="text-sm text-red-600 ml-4 list-disc">
                <li>Stock movements and history</li>
                <li>Sales records containing this product</li>
                <li>Stock additions and corrections</li>
                <li>All inventory tracking data</li>
              </ul>
              <p className="text-red-600 font-medium">This action cannot be undone.</p>
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteProductConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDeleteProduct}>
              Delete Product & All Records
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InventoryTab;
