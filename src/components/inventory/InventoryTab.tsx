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
import { Fish, Edit, Trash2, Package, Scale, ChevronDown, Eye, AlertTriangle, Calendar, RotateCcw, DollarSign, TrendingUp, Calculator, FolderOpen, X, Plus } from "lucide-react";
import { useCategories } from "@/hooks/use-categories";
import { useProducts, Product, CreateProductData } from "@/hooks/use-products";
import { stockMovementsApi } from "@/lib/api";
import { toast } from "sonner";

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
  // Add product props
  isAddProductOpen: boolean;
  setIsAddProductOpen: (open: boolean) => void;
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
  isAddProductOpen,
  setIsAddProductOpen,
}) => {
  // Categories hook
  const { categories } = useCategories();

  // Products hook
  const {
    products,
    loading: productsLoading,
    error: productsError,
    fetchProducts,
    getLowStockProducts,
    getExpiringProducts,
    getDamagedProducts,
    fetchDamagedProducts,
    deleteDamagedProduct,
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
  const [editReason, setEditReason] = useState('');

  // State for delete product confirmation dialog
  const [isDeleteProductConfirmOpen, setIsDeleteProductConfirmOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [deleteReason, setDeleteReason] = useState('');



  // State for product details popup
  const [isProductDetailsOpen, setIsProductDetailsOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // State for specialized popups
  const [isLowStockPopupOpen, setIsLowStockPopupOpen] = useState(false);
  const [isDamagedPopupOpen, setIsDamagedPopupOpen] = useState(false);
  const [isExpiryPopupOpen, setIsExpiryPopupOpen] = useState(false);
  const [isStockMovementPopupOpen, setIsStockMovementPopupOpen] = useState(false);
  const [selectedDamagedProduct, setSelectedDamagedProduct] = useState<any>(null);
  const [selectedStockMovement, setSelectedStockMovement] = useState<any>(null);

  // State for view transition animation
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [nextView, setNextView] = useState<ViewType | null>(null);

  // Handle viewing product details
  const handleViewProductDetails = (product: Product) => {
    setSelectedProduct(product);
    setIsProductDetailsOpen(true);
  };

  // Handle specialized popup views
  const handleViewLowStockDetails = (product: Product) => {
    setSelectedProduct(product);
    setIsLowStockPopupOpen(true);
  };

  const handleViewDamagedDetails = (damagedProduct: any) => {
    setSelectedDamagedProduct(damagedProduct);
    setIsDamagedPopupOpen(true);
  };

  const handleViewExpiryDetails = (product: Product) => {
    setSelectedProduct(product);
    setIsExpiryPopupOpen(true);
  };

  const handleViewStockMovementDetails = (movement: any) => {
    setSelectedStockMovement(movement);
    setIsStockMovementPopupOpen(true);
  };

  // Handle deleting damaged product
  const handleDeleteDamagedProduct = async (damageId: string, productName: string) => {
    try {
      const confirmed = window.confirm(
        `Are you sure you want to delete this damaged product record for "${productName}"?\n\nThis will restore the damaged quantity back to the product's stock.`
      );

      if (!confirmed) return;

      const response = await deleteDamagedProduct(damageId);

      if (response.success) {
        toast.success(`Damaged product deleted and stock restored successfully!`);

        // Refresh the damaged products list
        await loadDamagedProducts();

        // Refresh the main products list to show updated stock
        await fetchProducts();
      } else {
        toast.error(`Failed to delete damaged product: ${response.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting damaged product:', error);
      toast.error('An error occurred while deleting the damaged product');
    }
  };

  // Handle animated view transitions
  const handleViewChange = (newView: ViewType) => {
    if (newView === currentView) return;

    setIsTransitioning(true);
    setNextView(newView);

    // Start fade out animation
    setTimeout(() => {
      setCurrentView(newView);
      setNextView(null);

      // Start fade in animation
      setTimeout(() => {
        setIsTransitioning(false);
      }, 50);
    }, 200);
  };

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
    setEditReason(''); // Reset reason field
    setIsEditProductOpen(true);
  };

  // Handle saving edited product
  const handleSaveEditProduct = async () => {
    if (!editingProduct) return;

    // Validate required reason field
    if (!editReason.trim()) {
      alert('Please provide a reason for the changes.');
      return;
    }

    try {
      // Only send the editable fields to the backend
      const editableFields = {
        name: editFormData.name,
        box_to_kg_ratio: editFormData.box_to_kg_ratio,
        cost_per_box: editFormData.cost_per_box,
        cost_per_kg: editFormData.cost_per_kg,
        price_per_box: editFormData.price_per_box,
        price_per_kg: editFormData.price_per_kg,
        reason: editReason.trim() // Include the reason for the edit
      };

      const success = await updateProduct(editingProduct.product_id, editableFields);
      if (success) {
        setIsEditProductOpen(false);
        setEditingProduct(null);
        setEditReason(''); // Reset reason
        // Show success message indicating pending approval
        alert('Product edit request submitted successfully! Changes are pending approval.');
        // Refresh stock movements to show the pending requests
        loadStockMovements();
      } else {
        alert('Failed to submit product edit request. Please try again.');
      }
    } catch (error) {
      console.error('Error updating product:', error);
      alert('An error occurred while updating the product.');
    }
  };

  // Handle opening delete confirmation dialog
  const handleDeleteProductClick = (product: Product) => {
    setProductToDelete(product);
    setDeleteReason(''); // Reset delete reason
    setIsDeleteProductConfirmOpen(true);
  };

  // Handle confirming product deletion request
  const handleConfirmDeleteProduct = async () => {
    if (!productToDelete || !deleteReason.trim()) return;

    try {
      const success = await deleteProduct(productToDelete.product_id, deleteReason.trim());
      if (success) {
        setIsDeleteProductConfirmOpen(false);
        setProductToDelete(null);
        setDeleteReason(''); // Reset reason
        // Show success message indicating pending approval
        alert('Product deletion request submitted successfully! Awaiting approval.');
        // Refresh stock movements to show the pending delete request
        loadStockMovements();
      } else {
        // Get the specific error message from the hook
        const errorMessage = productsError || 'Failed to submit delete request. Please try again.';
        alert(errorMessage);
      }
    } catch (error) {
      console.error('Error submitting delete request:', error);
      alert('An error occurred while submitting the delete request.');
    }
  };

  // Handle approving a pending product edit
  const handleApproveProductEdit = async (movementId: string) => {
    try {
      const response = await stockMovementsApi.approveProductEdit(movementId);
      if (response.success) {
        alert('Product edit approved and applied successfully!');
        // Refresh stock movements and products
        loadStockMovements();
        fetchProducts();
      } else {
        alert(response.error || 'Failed to approve product edit');
      }
    } catch (error) {
      console.error('Error approving product edit:', error);
      alert('An error occurred while approving the product edit.');
    }
  };

  // Handle approving a pending stock addition
  const handleApproveStockAddition = async (movementId: string) => {
    try {
      const response = await stockMovementsApi.approveStockAddition(movementId);
      if (response.success) {
        alert('Stock addition approved and applied successfully!');
        // Refresh stock movements and products
        loadStockMovements();
        fetchProducts();
      } else {
        alert(response.error || 'Failed to approve stock addition');
      }
    } catch (error) {
      console.error('Error approving stock addition:', error);
      alert('An error occurred while approving the stock addition.');
    }
  };

  // Handle rejecting a pending stock addition
  const handleRejectStockAddition = async (movementId: string) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;

    try {
      const response = await stockMovementsApi.rejectStockAddition(movementId, reason);
      if (response.success) {
        alert('Stock addition rejected successfully!');
        // Refresh stock movements
        loadStockMovements();
      } else {
        alert(response.error || 'Failed to reject stock addition');
      }
    } catch (error) {
      console.error('Error rejecting stock addition:', error);
      alert('An error occurred while rejecting the stock addition.');
    }
  };

  // Handle approving a pending stock correction
  const handleApproveStockCorrection = async (movementId: string) => {
    try {
      const response = await stockMovementsApi.approveStockCorrection(movementId);
      if (response.success) {
        alert('Stock correction approved and applied successfully!');
        // Refresh stock movements and products
        loadStockMovements();
        fetchProducts();
      } else {
        alert(response.error || 'Failed to approve stock correction');
      }
    } catch (error) {
      console.error('Error approving stock correction:', error);
      alert('An error occurred while approving the stock correction.');
    }
  };

  // Handle rejecting a pending stock correction
  const handleRejectStockCorrection = async (movementId: string) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;

    try {
      const response = await stockMovementsApi.rejectStockCorrection(movementId, reason);
      if (response.success) {
        alert('Stock correction rejected successfully!');
        // Refresh stock movements
        loadStockMovements();
      } else {
        alert(response.error || 'Failed to reject stock correction');
      }
    } catch (error) {
      console.error('Error rejecting stock correction:', error);
      alert('An error occurred while rejecting the stock correction.');
    }
  };

  // Handle approving a pending product creation
  const handleApproveProductCreate = async (movementId: string) => {
    try {
      const response = await stockMovementsApi.approveProductCreate(movementId);
      if (response.success) {
        alert('Product creation approved and product created successfully!');
        // Refresh stock movements and products
        loadStockMovements();
        fetchProducts();
      } else {
        alert(response.error || 'Failed to approve product creation');
      }
    } catch (error) {
      console.error('Error approving product creation:', error);
      alert('An error occurred while approving the product creation.');
    }
  };

  // Handle rejecting a pending product creation
  const handleRejectProductCreate = async (movementId: string) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;

    try {
      const response = await stockMovementsApi.rejectProductCreate(movementId, reason);
      if (response.success) {
        alert('Product creation rejected successfully!');
        // Refresh stock movements
        loadStockMovements();
      } else {
        alert(response.error || 'Failed to reject product creation');
      }
    } catch (error) {
      console.error('Error rejecting product creation:', error);
      alert('An error occurred while rejecting the product creation.');
    }
  };

  // Handle rejecting a pending product edit
  const handleRejectProductEdit = async (movementId: string) => {
    const reason = prompt('Please provide a reason for rejecting this change:');
    if (!reason) return; // User cancelled

    try {
      const response = await stockMovementsApi.rejectProductEdit(movementId, reason);
      if (response.success) {
        alert('Product edit rejected successfully!');
        // Refresh stock movements
        loadStockMovements();
      } else {
        alert(response.error || 'Failed to reject product edit');
      }
    } catch (error) {
      console.error('Error rejecting product edit:', error);
      alert('An error occurred while rejecting the product edit.');
    }
  };

  // Handle approving a pending product delete request
  const handleApproveProductDelete = async (movementId: string) => {
    const confirmed = confirm('Are you sure you want to approve this product deletion? This action cannot be undone and will permanently delete the product and all related records.');
    if (!confirmed) return;

    try {
      const response = await stockMovementsApi.approveProductDelete(movementId);
      if (response.success) {
        alert('Product deletion approved and executed successfully!');
        // Refresh stock movements and products
        loadStockMovements();
        fetchProducts();
      } else {
        alert(response.error || 'Failed to approve product deletion');
      }
    } catch (error) {
      console.error('Error approving product deletion:', error);
      alert('An error occurred while approving the product deletion.');
    }
  };

  /**
   * Generic handler for approving stock movements from popup
   * Handles all movement types: product_edit, product_delete, new_stock, stock_correction, product_create
   */
  const handleApproveStockMovementFromPopup = async (movement: any) => {
    try {
      let response;
      let confirmMessage = '';

      // Handle different movement types with appropriate confirmation
      switch (movement.movement_type) {
        case 'product_edit':
          response = await stockMovementsApi.approveProductEdit(movement.movement_id);
          break;
        case 'product_delete':
          confirmMessage = 'Are you sure you want to approve this product deletion? This action cannot be undone and will permanently delete the product and all related records.';
          if (!confirm(confirmMessage)) return;
          response = await stockMovementsApi.approveProductDelete(movement.movement_id);
          break;
        case 'new_stock':
          response = await stockMovementsApi.approveStockAddition(movement.movement_id);
          break;
        case 'stock_correction':
          response = await stockMovementsApi.approveStockCorrection(movement.movement_id);
          break;
        case 'product_create':
          response = await stockMovementsApi.approveProductCreate(movement.movement_id);
          break;
        default:
          alert('Unknown movement type');
          return;
      }

      if (response.success) {
        const actionName = movement.movement_type === 'product_edit' ? 'Product edit' :
                          movement.movement_type === 'product_delete' ? 'Product deletion' :
                          movement.movement_type === 'new_stock' ? 'Stock addition' :
                          movement.movement_type === 'stock_correction' ? 'Stock correction' :
                          movement.movement_type === 'product_create' ? 'Product creation' :
                          'Request';

        alert(`${actionName} approved and applied successfully!`);

        // Refresh data and close popup
        loadStockMovements();
        fetchProducts();
        setIsStockMovementPopupOpen(false);
      } else {
        alert(response.error || 'Failed to approve request');
      }
    } catch (error) {
      console.error('Error approving stock movement:', error);
      alert('An error occurred while approving the request.');
    }
  };

  /**
   * Generic handler for rejecting stock movements from popup
   * Handles all movement types: product_edit, product_delete, new_stock, stock_correction, product_create
   * Prompts user for rejection reason before proceeding
   */
  const handleRejectStockMovementFromPopup = async (movement: any) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return; // User cancelled

    try {
      let response;

      // Handle different movement types
      switch (movement.movement_type) {
        case 'product_edit':
          response = await stockMovementsApi.rejectProductEdit(movement.movement_id, reason);
          break;
        case 'product_delete':
          response = await stockMovementsApi.rejectProductDelete(movement.movement_id, reason);
          break;
        case 'new_stock':
          response = await stockMovementsApi.rejectStockAddition(movement.movement_id, reason);
          break;
        case 'stock_correction':
          response = await stockMovementsApi.rejectStockCorrection(movement.movement_id, reason);
          break;
        case 'product_create':
          response = await stockMovementsApi.rejectProductCreate(movement.movement_id, reason);
          break;
        default:
          alert('Unknown movement type');
          return;
      }

      if (response.success) {
        const actionName = movement.movement_type === 'product_edit' ? 'Product edit' :
                          movement.movement_type === 'product_delete' ? 'Product deletion' :
                          movement.movement_type === 'new_stock' ? 'Stock addition' :
                          movement.movement_type === 'stock_correction' ? 'Stock correction' :
                          movement.movement_type === 'product_create' ? 'Product creation' :
                          'Request';

        alert(`${actionName} rejected successfully!`);

        // Refresh data and close popup
        loadStockMovements();
        setIsStockMovementPopupOpen(false);
      } else {
        alert(response.error || 'Failed to reject request');
      }
    } catch (error) {
      console.error('Error rejecting stock movement:', error);
      alert('An error occurred while rejecting the request.');
    }
  };

  // Handle rejecting a pending product delete request
  const handleRejectProductDelete = async (movementId: string) => {
    const reason = prompt('Please provide a reason for rejecting this deletion request:');
    if (!reason) return; // User cancelled

    try {
      const response = await stockMovementsApi.rejectProductDelete(movementId, reason);
      if (response.success) {
        alert('Product deletion request rejected successfully!');
        // Refresh stock movements
        loadStockMovements();
      } else {
        alert(response.error || 'Failed to reject product deletion');
      }
    } catch (error) {
      console.error('Error rejecting product deletion:', error);
      alert('An error occurred while rejecting the product deletion.');
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

  // Function to get current view title and description
  const getCurrentViewInfo = () => {
    switch (currentView) {
      case "low-stock":
        return {
          title: "Low Stock Items",
          description: "Products running low on inventory",
          icon: AlertTriangle,
          color: "text-yellow-600"
        };
      case "damaged":
        return {
          title: "Damaged Products",
          description: "Products reported as damaged",
          icon: AlertTriangle,
          color: "text-red-600"
        };
      case "expiry":
        return {
          title: "Nearing Expiry",
          description: "Products approaching expiration",
          icon: Calendar,
          color: "text-orange-600"
        };
      case "stock-adjustment":
        return {
          title: "Editing Stock & Movements",
          description: "Edit stock and track movements",
          icon: RotateCcw,
          color: "text-indigo-600"
        };
      default:
        return {
          title: "All Products",
          description: "Complete product inventory overview",
          icon: Fish,
          color: "text-blue-600"
        };
    }
  };

  const getCurrentViewTitle = () => {
    switch (currentView) {
      case "low-stock": return "Low Stock Items";
      case "damaged": return "Damaged Products";
      case "expiry": return "Products Nearing Expiry";
      case "stock-adjustment": return "Editing Stock and Movements";
      default: return "Product Inventory Management";
    }
  };



  // Helper function to render products in table format
  const renderProductsTable = (products: Product[]) => {
    return (
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
            {products.map((product) => (
              <tr key={product.product_id} className="border-b hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors">
                {/* Product Name */}
                <td className="py-3 px-2">
                  <div className="flex items-center gap-2">
                    <Fish className="h-4 w-4 text-blue-600" />
                    <button
                      onClick={() => handleViewProductDetails(product)}
                      className="font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors cursor-pointer text-left"
                    >
                      {product.name}
                    </button>
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
    );
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
          <p className="text-muted-foreground mb-4">Start by adding your first fish product to the inventory</p>
          <Button
            onClick={() => setIsAddProductOpen(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
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

        {/* Products Display - Table View */}
        {renderProductsTable(filteredProducts)}
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
              </tr>
            </thead>
            <tbody>
              {lowStockProducts.map((product) => (
                <tr key={product.product_id} className="border-b hover:bg-muted/50">
                  <td className="py-3 px-2 text-sm">
                    <button
                      onClick={() => handleViewLowStockDetails(product)}
                      className="font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors cursor-pointer text-left"
                    >
                      {product.name}
                    </button>
                  </td>
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
                    <button
                      onClick={() => handleViewDamagedDetails(damage)}
                      className="font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors cursor-pointer text-left"
                    >
                      {damage.products?.name || 'Unknown Product'}
                    </button>
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
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleDeleteDamagedProduct(damage.damage_id, damage.products?.name || 'Unknown Product')}
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
                    <td className="py-3 px-2 text-sm">
                      <button
                        onClick={() => handleViewExpiryDetails(product)}
                        className="font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors cursor-pointer text-left"
                      >
                        {product.name}
                      </button>
                    </td>
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
                <SelectItem value="product_edit">Product Info Changes</SelectItem>
                <SelectItem value="product_delete">Delete Requests</SelectItem>
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
                <th className="text-left py-3 px-2 text-sm font-medium w-24">Field/Stock</th>
                <th className="text-left py-3 px-2 text-sm font-medium w-20">Change/Values</th>
                <th className="text-left py-3 px-2 text-sm font-medium w-36">Reason & Details</th>
                <th className="text-left py-3 px-2 text-sm font-medium w-24">Performed By</th>
                <th className="text-left py-3 px-2 text-sm font-medium w-16">Status</th>
                <th className="text-left py-3 px-2 text-sm font-medium w-20">Actions</th>
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
                    <td className="py-3 px-2 text-sm">
                      <button
                        onClick={() => handleViewStockMovementDetails(movement)}
                        className="font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors cursor-pointer text-left"
                      >
                        {movement.products?.name || 'Unknown Product'}
                      </button>
                    </td>
                    <td className="py-3 px-2 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        movement.movement_type === 'damaged' ? 'bg-red-100 text-red-800' :
                        movement.movement_type === 'new_stock' ? 'bg-green-100 text-green-800' :
                        movement.movement_type === 'stock_correction' ? 'bg-blue-100 text-blue-800' :
                        movement.movement_type === 'product_edit' ? 'bg-purple-100 text-purple-800' :
                        movement.movement_type === 'product_delete' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {movement.movement_type === 'product_edit' ? 'PRODUCT EDIT' :
                         movement.movement_type === 'product_delete' ? 'DELETE REQUEST' :
                         movement.movement_type.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-sm">
                      {movement.movement_type === 'product_edit' ? (
                        <div className="text-muted-foreground">
                          <div className="font-medium text-sm">{movement.field_changed?.replace('_', ' ')}</div>
                        </div>
                      ) : movement.movement_type === 'product_delete' ? (
                        <div className="text-muted-foreground">
                          <div className="font-medium text-sm text-red-600">Product Deletion</div>
                        </div>
                      ) : (
                        <div className="space-y-1 text-muted-foreground">
                          <div>{stockBeforeBoxes} boxes</div>
                          <div>{stockBeforeKg} kg</div>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-2 text-sm">
                      {movement.movement_type === 'product_edit' ? (
                        <div className="space-y-1">
                          <div className="text-xs text-muted-foreground">From:</div>
                          <div className="text-red-600 text-xs">{movement.old_value || 'N/A'}</div>
                          <div className="text-xs text-muted-foreground">To:</div>
                          <div className="text-green-600 text-xs">{movement.new_value || 'N/A'}</div>
                        </div>
                      ) : movement.movement_type === 'product_delete' ? (
                        <div className="space-y-1">
                          <div className="text-xs text-muted-foreground">Status:</div>
                          <div className={`text-xs font-medium ${
                            movement.status === 'pending' ? 'text-orange-600' :
                            movement.status === 'completed' ? 'text-red-600' :
                            movement.status === 'rejected' ? 'text-green-600' :
                            'text-gray-600'
                          }`}>
                            {movement.status === 'pending' ? 'AWAITING APPROVAL' :
                             movement.status === 'completed' ? 'DELETED' :
                             movement.status === 'rejected' ? 'REJECTED' :
                             movement.new_value || 'N/A'}
                          </div>
                        </div>
                      ) : (
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
                      )}
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
                      {movement.movement_type === 'product_edit' && (
                        <div className="text-xs mt-1 space-y-1">
                          <div className="text-purple-600 font-medium">
                            Field: {movement.field_changed?.replace('_', ' ') || 'N/A'}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-red-600 bg-red-50 px-1.5 py-0.5 rounded text-xs">
                              From: {movement.old_value || 'N/A'}
                            </span>
                            <span className="text-green-600 bg-green-50 px-1.5 py-0.5 rounded text-xs">
                              To: {movement.new_value || 'N/A'}
                            </span>
                          </div>
                        </div>
                      )}
                      {movement.movement_type === 'product_delete' && (
                        <div className="text-xs mt-1 space-y-1">
                          <div className="text-red-600 font-medium">
                            ⚠️ DELETE REQUEST
                          </div>
                          <div className="text-red-600 bg-red-50 px-1.5 py-0.5 rounded text-xs">
                            Product: {movement.old_value || 'N/A'}
                          </div>
                          <div className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                            movement.status === 'pending' ? 'text-orange-600 bg-orange-50' :
                            movement.status === 'completed' ? 'text-red-600 bg-red-50' :
                            movement.status === 'rejected' ? 'text-green-600 bg-green-50' :
                            'text-gray-600 bg-gray-50'
                          }`}>
                            Status: {movement.status?.toUpperCase() || 'UNKNOWN'}
                          </div>
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
                  <td className="py-3 px-2 text-sm">
                    {movement.status === 'pending' ? (
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 w-7 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                          onClick={() => {
                            if (movement.movement_type === 'product_edit') {
                              handleApproveProductEdit(movement.movement_id);
                            } else if (movement.movement_type === 'product_delete') {
                              handleApproveProductDelete(movement.movement_id);
                            } else if (movement.movement_type === 'new_stock') {
                              handleApproveStockAddition(movement.movement_id);
                            } else if (movement.movement_type === 'stock_correction') {
                              handleApproveStockCorrection(movement.movement_id);
                            } else if (movement.movement_type === 'product_create') {
                              handleApproveProductCreate(movement.movement_id);
                            }
                          }}
                          title={`Approve ${
                            movement.movement_type === 'product_edit' ? 'product edit' :
                            movement.movement_type === 'product_delete' ? 'product deletion' :
                            movement.movement_type === 'new_stock' ? 'stock addition' :
                            movement.movement_type === 'stock_correction' ? 'stock correction' :
                            movement.movement_type === 'product_create' ? 'product creation' :
                            'request'
                          }`}
                        >
                          ✓
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => {
                            if (movement.movement_type === 'product_edit') {
                              handleRejectProductEdit(movement.movement_id);
                            } else if (movement.movement_type === 'product_delete') {
                              handleRejectProductDelete(movement.movement_id);
                            } else if (movement.movement_type === 'new_stock') {
                              handleRejectStockAddition(movement.movement_id);
                            } else if (movement.movement_type === 'stock_correction') {
                              handleRejectStockCorrection(movement.movement_id);
                            } else if (movement.movement_type === 'product_create') {
                              handleRejectProductCreate(movement.movement_id);
                            }
                          }}
                          title={`Reject ${
                            movement.movement_type === 'product_edit' ? 'product edit' :
                            movement.movement_type === 'product_delete' ? 'product deletion' :
                            movement.movement_type === 'new_stock' ? 'stock addition' :
                            movement.movement_type === 'stock_correction' ? 'stock correction' :
                            movement.movement_type === 'product_create' ? 'product creation' :
                            'request'
                          }`}
                        >
                          ✗
                        </Button>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-xs">-</span>
                    )}
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
        <CardContent className="pt-6">
          {/* View Controls - Mobile-Friendly Design */}
          <div className="flex justify-center items-center mb-4">
            {/* Compact View Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="px-3 py-2 h-auto bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-700 hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-800/30 dark:hover:to-indigo-800/30 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <div className="flex items-center gap-2">
                    {(() => {
                      const viewInfo = getCurrentViewInfo();
                      const IconComponent = viewInfo.icon;
                      return (
                        <>
                          <IconComponent className={`h-4 w-4 ${viewInfo.color}`} />
                          <div className="hidden sm:flex sm:flex-col sm:items-start">
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {viewInfo.title}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {viewInfo.description}
                            </span>
                          </div>
                          <span className="sm:hidden text-sm font-medium text-gray-900 dark:text-gray-100">
                            {viewInfo.title}
                          </span>
                          <ChevronDown className="h-3 w-3 text-gray-400 ml-1" />
                        </>
                      );
                    })()}
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-64 sm:w-72 p-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl rounded-lg">
                <div className="space-y-0.5">
                  {/* All Products */}
                  <DropdownMenuItem
                    onClick={() => handleViewChange("all")}
                    className={`p-2.5 rounded-md cursor-pointer transition-all duration-200 ${
                      currentView === "all"
                        ? "bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700"
                        : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-full bg-blue-100 dark:bg-blue-900/50">
                        <Fish className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-gray-900 dark:text-gray-100">All Products</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">Complete inventory overview</div>
                      </div>
                      {currentView === "all" && (
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
                      )}
                    </div>
                  </DropdownMenuItem>

                  {/* Low Stock */}
                  <DropdownMenuItem
                    onClick={() => handleViewChange("low-stock")}
                    className={`p-2.5 rounded-md cursor-pointer transition-all duration-200 ${
                      currentView === "low-stock"
                        ? "bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700"
                        : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-full bg-yellow-100 dark:bg-yellow-900/50">
                        <AlertTriangle className="h-3.5 w-3.5 text-yellow-600 dark:text-yellow-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-gray-900 dark:text-gray-100">Low Stock Items</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">Products running low</div>
                      </div>
                      {currentView === "low-stock" && (
                        <div className="w-1.5 h-1.5 rounded-full bg-yellow-600"></div>
                      )}
                    </div>
                  </DropdownMenuItem>

                  {/* Damaged Products */}
                  <DropdownMenuItem
                    onClick={() => handleViewChange("damaged")}
                    className={`p-2.5 rounded-md cursor-pointer transition-all duration-200 ${
                      currentView === "damaged"
                        ? "bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700"
                        : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-full bg-red-100 dark:bg-red-900/50">
                        <AlertTriangle className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-gray-900 dark:text-gray-100">Damaged Products</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">Products reported as damaged</div>
                      </div>
                      {currentView === "damaged" && (
                        <div className="w-1.5 h-1.5 rounded-full bg-red-600"></div>
                      )}
                    </div>
                  </DropdownMenuItem>

                  {/* Expiry */}
                  <DropdownMenuItem
                    onClick={() => handleViewChange("expiry")}
                    className={`p-2.5 rounded-md cursor-pointer transition-all duration-200 ${
                      currentView === "expiry"
                        ? "bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-700"
                        : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-full bg-orange-100 dark:bg-orange-900/50">
                        <Calendar className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-gray-900 dark:text-gray-100">Nearing Expiry</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">Products approaching expiration</div>
                      </div>
                      {currentView === "expiry" && (
                        <div className="w-1.5 h-1.5 rounded-full bg-orange-600"></div>
                      )}
                    </div>
                  </DropdownMenuItem>

                  {/* Stock Adjustment */}
                  <DropdownMenuItem
                    onClick={() => handleViewChange("stock-adjustment")}
                    className={`p-2.5 rounded-md cursor-pointer transition-all duration-200 ${
                      currentView === "stock-adjustment"
                        ? "bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-700"
                        : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-full bg-indigo-100 dark:bg-indigo-900/50">
                        <RotateCcw className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-gray-900 dark:text-gray-100">Editing Stock & Movements</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">Edit stock and track movements</div>
                      </div>
                      {currentView === "stock-adjustment" && (
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-600"></div>
                      )}
                    </div>
                  </DropdownMenuItem>


                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Dynamic View Content with Animation */}
          <div className="relative">
            {/* Loading overlay during transition */}
            {isTransitioning && (
              <div className="absolute inset-0 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  Loading...
                </div>
              </div>
            )}

            <div
              className={`transition-all duration-300 ease-in-out ${
                isTransitioning
                  ? 'opacity-30 transform translate-y-1 scale-[0.99]'
                  : 'opacity-100 transform translate-y-0 scale-100'
              }`}
            >
              {renderCurrentView()}
            </div>
          </div>
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

      {/* Edit Product Dialog - Smaller and Mobile-Friendly */}
      <Dialog open={isEditProductOpen} onOpenChange={setIsEditProductOpen}>
        <DialogContent className="max-w-sm w-[92vw] max-h-[85vh] overflow-y-auto p-4">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-base font-semibold">Edit Product</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Update product information. Changes require approval.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {/* Product Name */}
            <div className="space-y-1">
              <Label htmlFor="edit-name" className="text-xs font-medium">Product Name</Label>
              <Input
                id="edit-name"
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                placeholder="Enter product name"
                className="h-8 text-sm"
              />
            </div>

            {/* Box to KG Ratio */}
            <div className="space-y-1">
              <Label htmlFor="edit-box-ratio" className="text-xs font-medium">Box to KG Ratio</Label>
              <Input
                id="edit-box-ratio"
                type="number"
                step="0.1"
                min="0.1"
                value={editFormData.box_to_kg_ratio || ''}
                onChange={(e) => {
                  const inputValue = e.target.value;
                  if (inputValue === '') {
                    setEditFormData({ ...editFormData, box_to_kg_ratio: 0 });
                    return;
                  }
                  const value = parseFloat(inputValue);
                  if (!isNaN(value) && value > 0) {
                    setEditFormData({ ...editFormData, box_to_kg_ratio: value });
                  }
                }}
                onBlur={(e) => {
                  // Set default value if empty on blur
                  if (!e.target.value || parseFloat(e.target.value) <= 0) {
                    setEditFormData({ ...editFormData, box_to_kg_ratio: 20 });
                  }
                }}
                placeholder="20.0"
                className="h-8 text-sm"
              />
            </div>

            {/* Cost Pricing */}
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground">Cost Pricing</h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="edit-cost-box" className="text-xs">Cost/Box</Label>
                  <Input
                    id="edit-cost-box"
                    type="number"
                    step="0.01"
                    min="0"
                    value={editFormData.cost_per_box || ''}
                    onChange={(e) => {
                      const inputValue = e.target.value;
                      if (inputValue === '') {
                        setEditFormData({ ...editFormData, cost_per_box: 0 });
                        return;
                      }
                      const value = parseFloat(inputValue);
                      if (!isNaN(value) && value >= 0) {
                        setEditFormData({ ...editFormData, cost_per_box: value });
                      }
                    }}
                    placeholder="0.00"
                    className="h-7 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edit-cost-kg" className="text-xs">Cost/KG</Label>
                  <Input
                    id="edit-cost-kg"
                    type="number"
                    step="0.01"
                    min="0"
                    value={editFormData.cost_per_kg || ''}
                    onChange={(e) => {
                      const inputValue = e.target.value;
                      if (inputValue === '') {
                        setEditFormData({ ...editFormData, cost_per_kg: 0 });
                        return;
                      }
                      const value = parseFloat(inputValue);
                      if (!isNaN(value) && value >= 0) {
                        setEditFormData({ ...editFormData, cost_per_kg: value });
                      }
                    }}
                    placeholder="0.00"
                    className="h-7 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Selling Pricing */}
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground">Selling Pricing</h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="edit-price-box" className="text-xs">Sell/Box</Label>
                  <Input
                    id="edit-price-box"
                    type="number"
                    step="0.01"
                    min="0"
                    value={editFormData.price_per_box || ''}
                    onChange={(e) => {
                      const inputValue = e.target.value;
                      if (inputValue === '') {
                        setEditFormData({ ...editFormData, price_per_box: 0 });
                        return;
                      }
                      const value = parseFloat(inputValue);
                      if (!isNaN(value) && value >= 0) {
                        setEditFormData({ ...editFormData, price_per_box: value });
                      }
                    }}
                    placeholder="0.00"
                    className="h-7 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edit-price-kg" className="text-xs">Sell/KG</Label>
                  <Input
                    id="edit-price-kg"
                    type="number"
                    step="0.01"
                    min="0"
                    value={editFormData.price_per_kg || ''}
                    onChange={(e) => {
                      const inputValue = e.target.value;
                      if (inputValue === '') {
                        setEditFormData({ ...editFormData, price_per_kg: 0 });
                        return;
                      }
                      const value = parseFloat(inputValue);
                      if (!isNaN(value) && value >= 0) {
                        setEditFormData({ ...editFormData, price_per_kg: value });
                      }
                    }}
                    placeholder="0.00"
                    className="h-7 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Reason for Edit - Required */}
            <div className="space-y-1">
              <Label htmlFor="edit-reason" className="text-xs font-medium text-red-600">
                Reason for Changes (Required) *
              </Label>
              <textarea
                id="edit-reason"
                className="flex min-h-[50px] w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                value={editReason}
                onChange={(e) => setEditReason(e.target.value)}
                placeholder="Required: Explain why you're making these changes..."
                required
              />
              <p className="text-xs text-muted-foreground">
                Changes require approval and will be recorded for audit purposes.
              </p>
            </div>
          </div>

          <DialogFooter className="pt-3 flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setIsEditProductOpen(false)}
              className="h-8 text-xs w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveEditProduct}
              disabled={!editReason.trim()}
              className="h-8 text-xs w-full sm:w-auto"
            >
              Submit for Approval
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Low Stock Details Popup */}
      {isLowStockPopupOpen && selectedProduct && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsLowStockPopupOpen(false);
            }
          }}
        >
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-xs w-full max-h-[85vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-t-xl">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                    Low Stock Alert
                  </h2>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Product Details</p>
                </div>
              </div>
              <button
                onClick={() => setIsLowStockPopupOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
              >
                <X className="h-3 w-3" />
              </button>
            </div>

            {/* Content */}
            <div className="p-3 space-y-3">
              {/* Product Name */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Product Name</label>
                <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{selectedProduct.name}</p>
              </div>

              {/* Category */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Category</label>
                <p className="text-sm text-gray-700 dark:text-gray-300">{selectedProduct.product_categories?.name || 'Uncategorized'}</p>
              </div>

              {/* Current Stock - Warning Style */}
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-2">
                <label className="text-xs font-medium text-yellow-700 dark:text-yellow-400 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Current Stock (Low)
                </label>
                <div className="mt-1 grid grid-cols-2 gap-2">
                  <div className="text-center">
                    <span className="text-xs text-gray-600 dark:text-gray-400">Boxes</span>
                    <p className="text-sm font-bold text-yellow-700 dark:text-yellow-400">{selectedProduct.quantity_box}</p>
                  </div>
                  <div className="text-center">
                    <span className="text-xs text-gray-600 dark:text-gray-400">KG</span>
                    <p className="text-sm font-bold text-yellow-700 dark:text-yellow-400">{selectedProduct.quantity_kg}</p>
                  </div>
                </div>
              </div>

              {/* Low Stock Threshold */}
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-2">
                <label className="text-xs font-medium text-red-700 dark:text-red-400">Low Stock Threshold</label>
                <p className="text-sm font-bold text-red-700 dark:text-red-400">{selectedProduct.boxed_low_stock_threshold} boxes</p>
              </div>

              {/* Box Ratio */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-2">
                <label className="text-xs font-medium text-blue-700 dark:text-blue-400">Box Ratio</label>
                <p className="text-sm font-bold text-blue-700 dark:text-blue-400">{selectedProduct.box_to_kg_ratio} kg/box</p>
              </div>

              {/* Pricing Grid */}
              <div className="grid grid-cols-2 gap-2">
                {/* Cost Price */}
                <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-2">
                  <label className="text-xs font-medium text-orange-700 dark:text-orange-400">Cost Price</label>
                  <div className="mt-1 space-y-0.5">
                    <p className="text-xs text-orange-600 dark:text-orange-400">${selectedProduct.cost_per_box.toFixed(2)}/box</p>
                    <p className="text-xs text-orange-600 dark:text-orange-400">${selectedProduct.cost_per_kg.toFixed(2)}/kg</p>
                  </div>
                </div>

                {/* Selling Price */}
                <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-2">
                  <label className="text-xs font-medium text-purple-700 dark:text-purple-400">Selling Price</label>
                  <div className="mt-1 space-y-0.5">
                    <p className="text-xs text-purple-600 dark:text-purple-400">${selectedProduct.price_per_box.toFixed(2)}/box</p>
                    <p className="text-xs text-purple-600 dark:text-purple-400">${selectedProduct.price_per_kg.toFixed(2)}/kg</p>
                  </div>
                </div>
              </div>

              {/* Profit */}
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-2">
                <label className="text-xs font-medium text-green-700 dark:text-green-400 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Profit Margin
                </label>
                <div className="mt-1 grid grid-cols-2 gap-2">
                  <div className="text-center">
                    <span className="text-xs text-gray-600 dark:text-gray-400">Per Box</span>
                    <p className="text-sm font-bold text-green-700 dark:text-green-400">${selectedProduct.profit_per_box.toFixed(2)}</p>
                  </div>
                  <div className="text-center">
                    <span className="text-xs text-gray-600 dark:text-gray-400">Per KG</span>
                    <p className="text-sm font-bold text-green-700 dark:text-green-400">${selectedProduct.profit_per_kg.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <div className="pt-1">
                <button
                  onClick={() => setIsLowStockPopupOpen(false)}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-3 rounded-lg transition-colors text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Damaged Product Details Popup */}
      {isDamagedPopupOpen && selectedDamagedProduct && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsDamagedPopupOpen(false);
            }
          }}
        >
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-xs w-full max-h-[85vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 rounded-t-xl">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-red-100 dark:bg-red-900/30 rounded-full">
                  <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                    Damaged Product
                  </h2>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Product Details</p>
                </div>
              </div>
              <button
                onClick={() => setIsDamagedPopupOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
              >
                <X className="h-3 w-3" />
              </button>
            </div>

            {/* Content */}
            <div className="p-3 space-y-3">
              {/* Product Name */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Product Name</label>
                <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{selectedDamagedProduct.products?.name || 'Unknown Product'}</p>
              </div>

              {/* Quantity */}
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-2">
                <label className="text-xs font-medium text-red-700 dark:text-red-400">Quantity Damaged</label>
                <div className="mt-1 grid grid-cols-2 gap-2">
                  <div className="text-center">
                    <span className="text-xs text-gray-600 dark:text-gray-400">Boxes</span>
                    <p className="text-sm font-bold text-red-700 dark:text-red-400">{selectedDamagedProduct.damaged_boxes || 0}</p>
                  </div>
                  <div className="text-center">
                    <span className="text-xs text-gray-600 dark:text-gray-400">KG</span>
                    <p className="text-sm font-bold text-red-700 dark:text-red-400">{selectedDamagedProduct.damaged_kg || 0}</p>
                  </div>
                </div>
              </div>

              {/* Reason */}
              <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-2">
                <label className="text-xs font-medium text-orange-700 dark:text-orange-400">Reason</label>
                <p className="text-sm text-gray-700 dark:text-gray-300">{selectedDamagedProduct.damaged_reason || 'No reason provided'}</p>
              </div>

              {/* Date */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-2">
                <label className="text-xs font-medium text-blue-700 dark:text-blue-400">Date</label>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {selectedDamagedProduct.damaged_date ? new Date(selectedDamagedProduct.damaged_date).toLocaleDateString() : 'Not specified'}
                </p>
              </div>

              {/* Loss Value */}
              <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-2">
                <label className="text-xs font-medium text-purple-700 dark:text-purple-400">Loss Value</label>
                <p className="text-sm font-bold text-purple-700 dark:text-purple-400">${selectedDamagedProduct.loss_value?.toFixed(2) || '0.00'}</p>
              </div>

              {/* Reported By */}
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-2">
                <label className="text-xs font-medium text-green-700 dark:text-green-400">Reported By</label>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {selectedDamagedProduct.reported_by_user?.owner_name ||
                   selectedDamagedProduct.users?.full_name ||
                   selectedDamagedProduct.users?.owner_name ||
                   'Unknown User'}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-1 flex gap-2">
                <button
                  onClick={async () => {
                    setIsDamagedPopupOpen(false);
                    await handleDeleteDamagedProduct(
                      selectedDamagedProduct.damage_id,
                      selectedDamagedProduct.products?.name || 'Unknown Product'
                    );
                  }}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1"
                >
                  <Trash2 className="h-3 w-3" />
                  Delete
                </button>
                <button
                  onClick={() => setIsDamagedPopupOpen(false)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium py-2 px-3 rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Expiry Details Popup */}
      {isExpiryPopupOpen && selectedProduct && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsExpiryPopupOpen(false);
            }
          }}
        >
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-xs w-full max-h-[85vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-t-xl">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-orange-100 dark:bg-orange-900/30 rounded-full">
                  <Calendar className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                    Expiry Details
                  </h2>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Product Details</p>
                </div>
              </div>
              <button
                onClick={() => setIsExpiryPopupOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
              >
                <X className="h-3 w-3" />
              </button>
            </div>

            {/* Content */}
            <div className="p-3 space-y-3">
              {/* Product Name */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Product Name</label>
                <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{selectedProduct.name}</p>
              </div>

              {/* Category */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Category</label>
                <p className="text-sm text-gray-700 dark:text-gray-300">{selectedProduct.product_categories?.name || 'Uncategorized'}</p>
              </div>

              {/* Current Stock */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-2">
                <label className="text-xs font-medium text-blue-700 dark:text-blue-400">Current Stock</label>
                <div className="mt-1 grid grid-cols-2 gap-2">
                  <div className="text-center">
                    <span className="text-xs text-gray-600 dark:text-gray-400">Boxes</span>
                    <p className="text-sm font-bold text-blue-700 dark:text-blue-400">{selectedProduct.quantity_box}</p>
                  </div>
                  <div className="text-center">
                    <span className="text-xs text-gray-600 dark:text-gray-400">KG</span>
                    <p className="text-sm font-bold text-blue-700 dark:text-blue-400">{selectedProduct.quantity_kg}</p>
                  </div>
                </div>
              </div>

              {/* Expiry Date */}
              <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-2">
                <label className="text-xs font-medium text-orange-700 dark:text-orange-400">Expiry Date</label>
                <p className="text-sm font-bold text-orange-700 dark:text-orange-400">
                  {selectedProduct.expiry_date ? new Date(selectedProduct.expiry_date).toLocaleDateString() : 'No expiry date'}
                </p>
              </div>

              {/* Days Until Expiry */}
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-2">
                <label className="text-xs font-medium text-red-700 dark:text-red-400">Days Until Expiry</label>
                {(() => {
                  if (!selectedProduct.expiry_date) return <p className="text-sm text-gray-500">N/A</p>;

                  const today = new Date();
                  const expiryDate = new Date(selectedProduct.expiry_date);
                  const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

                  const isUrgent = daysUntilExpiry <= 3;
                  const isWarning = daysUntilExpiry <= 7;

                  return (
                    <p className={`text-sm font-bold ${
                      isUrgent ? 'text-red-700 dark:text-red-400' :
                      isWarning ? 'text-orange-700 dark:text-orange-400' :
                      'text-yellow-700 dark:text-yellow-400'
                    }`}>
                      {daysUntilExpiry > 0 ? `${daysUntilExpiry} days` : 'Expired'}
                    </p>
                  );
                })()}
              </div>

              {/* Cost Price & Box Ratio Grid */}
              <div className="grid grid-cols-2 gap-2">
                {/* Cost Price */}
                <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-2">
                  <label className="text-xs font-medium text-purple-700 dark:text-purple-400">Cost Price</label>
                  <div className="mt-1 space-y-0.5">
                    <p className="text-xs text-purple-600 dark:text-purple-400">${selectedProduct.cost_per_box.toFixed(2)}/box</p>
                    <p className="text-xs text-purple-600 dark:text-purple-400">${selectedProduct.cost_per_kg.toFixed(2)}/kg</p>
                  </div>
                </div>

                {/* Box Ratio */}
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-2">
                  <label className="text-xs font-medium text-green-700 dark:text-green-400">Box Ratio</label>
                  <p className="text-sm font-bold text-green-700 dark:text-green-400 mt-1">{selectedProduct.box_to_kg_ratio} kg/box</p>
                </div>
              </div>

              {/* Close Button */}
              <div className="pt-1">
                <button
                  onClick={() => setIsExpiryPopupOpen(false)}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-3 rounded-lg transition-colors text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stock Movement Details Popup */}
      {isStockMovementPopupOpen && selectedStockMovement && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsStockMovementPopupOpen(false);
            }
          }}
        >
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-xs w-full max-h-[85vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-t-xl">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-full">
                  <RotateCcw className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                    Stock Movement
                  </h2>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Movement Details</p>
                </div>
              </div>
              <button
                onClick={() => setIsStockMovementPopupOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
              >
                <X className="h-3 w-3" />
              </button>
            </div>

            {/* Content */}
            <div className="p-3 space-y-3">
              {/* Date */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Date</label>
                <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                  {new Date(selectedStockMovement.created_at).toLocaleDateString()}
                </p>
              </div>

              {/* Product */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-2">
                <label className="text-xs font-medium text-blue-700 dark:text-blue-400">Product</label>
                <p className="text-sm font-bold text-blue-700 dark:text-blue-400">
                  {selectedStockMovement.products?.name || 'Unknown Product'}
                </p>
              </div>

              {/* Type */}
              <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-2">
                <label className="text-xs font-medium text-purple-700 dark:text-purple-400">Type</label>
                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                  selectedStockMovement.movement_type === 'damaged' ? 'bg-red-100 text-red-800' :
                  selectedStockMovement.movement_type === 'new_stock' ? 'bg-green-100 text-green-800' :
                  selectedStockMovement.movement_type === 'stock_correction' ? 'bg-blue-100 text-blue-800' :
                  selectedStockMovement.movement_type === 'product_edit' ? 'bg-purple-100 text-purple-800' :
                  selectedStockMovement.movement_type === 'product_delete' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {selectedStockMovement.movement_type.replace('_', ' ').toUpperCase()}
                </span>
              </div>

              {/* Field/Stock */}
              <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-2">
                <label className="text-xs font-medium text-orange-700 dark:text-orange-400">Field/Stock</label>
                {selectedStockMovement.movement_type === 'product_edit' ? (
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {selectedStockMovement.field_changed || 'Field not specified'}
                  </p>
                ) : (
                  <div className="mt-1 grid grid-cols-2 gap-2">
                    {selectedStockMovement.box_change !== 0 && (
                      <div className="text-center">
                        <span className="text-xs text-gray-600 dark:text-gray-400">Boxes</span>
                        <p className="text-sm font-bold text-orange-700 dark:text-orange-400">
                          {selectedStockMovement.box_change > 0 ? '+' : ''}{selectedStockMovement.box_change}
                        </p>
                      </div>
                    )}
                    {selectedStockMovement.kg_change !== 0 && (
                      <div className="text-center">
                        <span className="text-xs text-gray-600 dark:text-gray-400">KG</span>
                        <p className="text-sm font-bold text-orange-700 dark:text-orange-400">
                          {selectedStockMovement.kg_change > 0 ? '+' : ''}{selectedStockMovement.kg_change}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Change/Values */}
              {selectedStockMovement.movement_type === 'product_edit' && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-2">
                  <label className="text-xs font-medium text-yellow-700 dark:text-yellow-400">Change/Values</label>
                  <div className="mt-1 space-y-1">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      <span className="text-red-600">From:</span> {selectedStockMovement.old_value || 'N/A'}
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      <span className="text-green-600">To:</span> {selectedStockMovement.new_value || 'N/A'}
                    </p>
                  </div>
                </div>
              )}

              {/* Reason & Details */}
              <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-2">
                <label className="text-xs font-medium text-indigo-700 dark:text-indigo-400">Reason & Details</label>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {selectedStockMovement.reason || 'No reason provided'}
                </p>
              </div>

              {/* Performed By */}
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-2">
                <label className="text-xs font-medium text-green-700 dark:text-green-400">Performed By</label>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {selectedStockMovement.users?.full_name ||
                   selectedStockMovement.users?.owner_name ||
                   selectedStockMovement.performed_by_user?.full_name ||
                   selectedStockMovement.performed_by_user?.owner_name ||
                   'Unknown User'}
                </p>
              </div>

              {/* Status */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Status</label>
                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                  selectedStockMovement.status === 'completed' ? 'bg-green-100 text-green-800' :
                  selectedStockMovement.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  selectedStockMovement.status === 'cancelled' ? 'bg-gray-100 text-gray-800' :
                  selectedStockMovement.status === 'rejected' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {selectedStockMovement.status?.toUpperCase() || 'UNKNOWN'}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="pt-1 space-y-2">
                {/* Action buttons based on status */}
                {selectedStockMovement.status === 'pending' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApproveStockMovementFromPopup(selectedStockMovement)}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1"
                    >
                      <Package className="h-3 w-3" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleRejectStockMovementFromPopup(selectedStockMovement)}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1"
                    >
                      <X className="h-3 w-3" />
                      Reject
                    </button>
                  </div>
                )}

                {/* Close Button */}
                <button
                  onClick={() => setIsStockMovementPopupOpen(false)}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-3 rounded-lg transition-colors text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Product Details Popup */}
      {isProductDetailsOpen && selectedProduct && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsProductDetailsOpen(false);
            }
          }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-xs w-full max-h-[80vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-2.5 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <Fish className="h-4 w-4 text-blue-600" />
                <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                  {selectedProduct.name}
                </h2>
              </div>
              <button
                onClick={() => setIsProductDetailsOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 flex-shrink-0"
              >
                <X className="h-3 w-3" />
              </button>
            </div>

            {/* Content */}
            <div className="p-2.5 space-y-2.5">
              {/* Category */}
              <div className="text-center">
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {selectedProduct.product_categories?.name || 'Uncategorized'}
                </p>
              </div>

              {/* Stock Information */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-md p-2">
                <h4 className="text-xs font-medium text-gray-900 dark:text-gray-100 mb-1.5 text-center">Stock</h4>
                <div className="grid grid-cols-2 gap-1.5 text-xs">
                  <div className="text-center">
                    <div className="text-gray-600 dark:text-gray-400">Boxes</div>
                    <div className="font-bold text-blue-600">{selectedProduct.quantity_box}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-600 dark:text-gray-400">Kg</div>
                    <div className="font-bold text-green-600">{selectedProduct.quantity_kg}</div>
                  </div>
                </div>
                <div className="text-center mt-1.5 pt-1.5 border-t border-gray-200 dark:border-gray-600">
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {selectedProduct.box_to_kg_ratio} kg/box
                  </span>
                </div>
              </div>

              {/* Pricing Information */}
              <div className="bg-green-50 dark:bg-green-900/20 rounded-md p-2">
                <h4 className="text-xs font-medium text-gray-900 dark:text-gray-100 mb-1.5 text-center">Pricing</h4>
                <div className="grid grid-cols-2 gap-1.5 text-xs">
                  <div className="text-center">
                    <div className="text-gray-600 dark:text-gray-400">Box Price</div>
                    <div className="font-bold text-green-600">RWF {selectedProduct.price_per_box?.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">Profit: {selectedProduct.profit_per_box?.toLocaleString()}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-600 dark:text-gray-400">Kg Price</div>
                    <div className="font-bold text-green-600">RWF {selectedProduct.price_per_kg?.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">Profit: {selectedProduct.profit_per_kg?.toLocaleString()}</div>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              {(selectedProduct.expiry_date || selectedProduct.damaged_reason) && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-md p-2">
                  <div className="text-xs text-center space-y-1">
                    {selectedProduct.expiry_date && (
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Expires: </span>
                        <span className="font-semibold text-orange-600">
                          {new Date(selectedProduct.expiry_date).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {selectedProduct.damaged_reason && (
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Damage: </span>
                        <span className="font-semibold text-red-600">{selectedProduct.damaged_reason}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-1.5 pt-1">
                <button
                  onClick={() => {
                    setIsProductDetailsOpen(false);
                    handleEditProduct(selectedProduct);
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium py-1.5 px-2 rounded transition-colors flex items-center justify-center gap-1"
                >
                  <Edit className="h-3 w-3" />
                  Edit
                </button>
                <button
                  onClick={() => setIsProductDetailsOpen(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-200 text-xs font-medium py-1.5 px-2 rounded transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Product Request Dialog */}
      <Dialog open={isDeleteProductConfirmOpen} onOpenChange={setIsDeleteProductConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Request Product Deletion</DialogTitle>
            <DialogDescription className="space-y-2">
              <p>Submit a request to delete "{productToDelete?.name}"?</p>
              <p className="text-orange-600 font-medium">
                ⚠️ This will request deletion of the product and ALL related records including:
              </p>
              <ul className="text-sm text-orange-600 ml-4 list-disc">
                <li>Stock movements and history</li>
                <li>Sales records containing this product</li>
                <li>Stock additions and corrections</li>
                <li>All inventory tracking data</li>
              </ul>
              <p className="text-blue-600 font-medium">
                📋 This request requires approval before the deletion is executed.
              </p>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="delete-reason">Reason for Deletion Request (Required)</Label>
              <textarea
                id="delete-reason"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="Explain why this product should be deleted (e.g., 'Discontinued product', 'Duplicate entry', 'Product no longer available')"
                required
              />
              <p className="text-xs text-muted-foreground">
                This reason will be reviewed by management and recorded for audit purposes.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteProductConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDeleteProduct}
              disabled={!deleteReason.trim()}
            >
              Submit Delete Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InventoryTab;
