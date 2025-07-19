/**
 * ProductInventory Component (Refactored)
 * Main inventory management page with tabbed interface
 * Separated into individual components for better maintainability
 */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import AppLayout from "@/components/layout/AppLayout";
import { Package, Plus, FolderOpen } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCategories } from "@/hooks/use-categories";
import { useProducts } from "@/hooks/use-products";
import InventoryTab from "@/components/inventory/InventoryTab";
import AddProductTab from "@/components/inventory/AddProductTab";
import CategoriesTab from "@/components/inventory/CategoriesTab";
import { usePageTitle } from "@/hooks/use-page-title";

type ViewType = "all" | "low-stock" | "damaged" | "expiry" | "stock-adjustment" | "categories";
type InventoryViewType = "all" | "low-stock" | "damaged" | "expiry" | "stock-adjustment";

const ProductInventory = () => {
  const { t } = useTranslation();
  usePageTitle('navigation.inventory', 'Product Inventory');

  // View state
  const [currentView, setCurrentView] = useState<ViewType>("all");

  // Active tab state for dynamic header content
  const [activeTab, setActiveTab] = useState("categories");

  // Category filtering state
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(undefined);

  // Function to get header content based on active tab
  const getHeaderContent = () => {
    switch (activeTab) {
      case "inventory":
        return {
          title: t("inventory.headers.productInventory"),
          description: t("inventory.headers.manageProducts")
        };
      case "add":
        return {
          title: t("inventory.headers.addProductsStock"),
          description: t("inventory.headers.createNewProducts")
        };
      case "categories":
        return {
          title: t("inventory.headers.productCategories"),
          description: t("inventory.headers.organizeProducts")
        };
      default:
        return {
          title: t("inventory.headers.productInventory"),
          description: t("inventory.headers.manageProducts")
        };
    }
  };

  // Convert ViewType to InventoryViewType for InventoryTab
  const getInventoryView = (view: ViewType): InventoryViewType => {
    return view === "categories" ? "all" : view;
  };

  // Handle view changes for InventoryTab
  const handleInventoryViewChange = (view: InventoryViewType) => {
    setCurrentView(view);
  };
  
  // Dialog states
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isAddStockOpen, setIsAddStockOpen] = useState(false);
  const [isAddDamagedOpen, setIsAddDamagedOpen] = useState(false);
  const [isStockCorrectionOpen, setIsStockCorrectionOpen] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);

  // OCR-related state
  const [isOcrMode, setIsOcrMode] = useState(false);
  const [ocrImage, setOcrImage] = useState<File | null>(null);
  const [ocrResults, setOcrResults] = useState<any>(null);
  const [isProcessingOcr, setIsProcessingOcr] = useState(false);

  // Categories hook
  const { createCategory, updateCategory, deleteCategory } = useCategories();

  // Form state for creating categories
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
  });

  // Edit category state
  const [isEditCategoryOpen, setIsEditCategoryOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [editCategoryForm, setEditCategoryForm] = useState({
    name: '',
    description: '',
  });

  // Delete confirmation state
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<any>(null);

  // Handle category form submission
  const handleCreateCategory = async () => {
    if (!categoryForm.name.trim()) {
      return;
    }

    const success = await createCategory({
      name: categoryForm.name.trim(),
      description: categoryForm.description.trim() || undefined,
    });

    if (success) {
      setCategoryForm({ name: '', description: '' });
      setIsAddCategoryOpen(false);
    }
  };

  // Handle edit category form submission
  const handleEditCategory = async () => {
    if (!editCategoryForm.name.trim() || !editingCategory) {
      return;
    }

    const success = await updateCategory(editingCategory.category_id, {
      name: editCategoryForm.name.trim(),
      description: editCategoryForm.description.trim() || undefined,
    });

    if (success) {
      setEditCategoryForm({ name: '', description: '' });
      setEditingCategory(null);
      setIsEditCategoryOpen(false);
    }
  };

  // Handle delete category
  const handleDeleteCategory = async (categoryId: string) => {
    const success = await deleteCategory(categoryId);
    if (success) {
      // Category list will be automatically refreshed by the hook
    }
  };

  // Mock OCR processing function
  const processOcrImage = () => {
    setIsProcessingOcr(true);
    // Simulate OCR processing
    setTimeout(() => {
      setOcrResults({
        productName: "Atlantic Salmon",
        quantity: "25",
        weight: "125.5",
        expiryDate: "2024-02-15",
      });
      setIsProcessingOcr(false);
    }, 2000);
  };

  // Handle closing add stock dialog
  const handleCloseAddStock = () => {
    setIsAddStockOpen(false);
    setIsOcrMode(false);
    setOcrImage(null);
    setOcrResults(null);
    setIsProcessingOcr(false);
  };

  // Products hook for real calculations
  const {
    products,
    calculateTotalValue,
    calculateTotalCost,
    calculateTotalProfit,
    fetchDamagedProducts
  } = useProducts();

  // State for damaged products data
  const [damagedProducts, setDamagedProducts] = useState<any[]>([]);

  // Memoized function to load damaged products (prevents infinite loop)
  const loadDamagedProducts = useCallback(async () => {
    try {
      const damaged = await fetchDamagedProducts();
      setDamagedProducts(damaged);
    } catch (error) {
      console.error('Error loading damaged products:', error);
      setDamagedProducts([]);
    }
  }, [fetchDamagedProducts]);

  // Fetch damaged products data only once on mount
  useEffect(() => {
    loadDamagedProducts();
  }, [loadDamagedProducts]);

  // Memoized damaged stats calculation
  const damagedStats = useMemo(() => {
    const totalDamagedValue = damagedProducts.reduce((total, damage) => total + (damage.loss_value || 0), 0);
    const totalDamagedItems = damagedProducts.reduce((total, damage) => total + (damage.damaged_boxes || 0), 0);
    const totalDamagedWeight = damagedProducts.reduce((total, damage) => total + (damage.damaged_kg || 0), 0);

    return {
      totalDamagedValue,
      totalDamagedItems,
      totalDamagedWeight,
      damagedCount: damagedProducts.length
    };
  }, [damagedProducts]);

  // Memoized totals calculation
  const totals = useMemo(() => {
    const totalValue = calculateTotalValue();
    const totalCostPrice = calculateTotalCost();
    const totalProfit = calculateTotalProfit();
    const profitMargin = totalValue > 0 ? ((totalProfit / totalValue) * 100) : 0;

    return {
      totalValue,
      totalCostPrice,
      totalProfit,
      profitMargin: Math.round(profitMargin * 10) / 10, // Round to 1 decimal place
      damagedStats,
    };
  }, [calculateTotalValue, calculateTotalCost, calculateTotalProfit, damagedStats]);

  // Category filtering functions
  const handleCategoryClick = (categoryId: string) => {
    // Switch to inventory tab and set category filter
    setActiveTab("inventory");
    setSelectedCategoryId(categoryId);
    setCurrentView("all"); // Reset to all products view when filtering by category
  };

  const handleClearCategoryFilter = () => {
    setSelectedCategoryId(undefined);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Dynamic Header */}
        <div>
          <h1 className="text-3xl font-bold">{getHeaderContent().title}</h1>
          <p className="text-muted-foreground">{getHeaderContent().description}</p>
        </div>

        {/* Product Management Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="categories">
              <FolderOpen className="mr-2 h-4 w-4" />
              {t("inventory.tabs.categories")}
            </TabsTrigger>
            <TabsTrigger value="add">
              <Plus className="mr-2 h-4 w-4" />
              {t("inventory.tabs.addProduct")}
            </TabsTrigger>
            <TabsTrigger value="inventory">
              <Package className="mr-2 h-4 w-4" />
              {t("inventory.tabs.inventory")}
            </TabsTrigger>
          </TabsList>

          {/* Categories Tab Content */}
          <TabsContent value="categories" className="space-y-6">
            <CategoriesTab onCategoryClick={handleCategoryClick} />
          </TabsContent>

          {/* Add Product Tab Content */}
          <TabsContent value="add" className="space-y-6">
            <AddProductTab
              isAddProductOpen={isAddProductOpen}
              setIsAddProductOpen={setIsAddProductOpen}
              isAddStockOpen={isAddStockOpen}
              setIsAddStockOpen={setIsAddStockOpen}
              isAddDamagedOpen={isAddDamagedOpen}
              setIsAddDamagedOpen={setIsAddDamagedOpen}
              isStockCorrectionOpen={isStockCorrectionOpen}
              setIsStockCorrectionOpen={setIsStockCorrectionOpen}
              isOcrMode={isOcrMode}
              setIsOcrMode={setIsOcrMode}
              ocrImage={ocrImage}
              setOcrImage={setOcrImage}
              ocrResults={ocrResults}
              setOcrResults={setOcrResults}
              isProcessingOcr={isProcessingOcr}
              setIsProcessingOcr={setIsProcessingOcr}
              processOcrImage={processOcrImage}
              handleCloseAddStock={handleCloseAddStock}
            />
          </TabsContent>

          {/* Inventory Tab Content */}
          <TabsContent value="inventory" className="space-y-4">
            <InventoryTab
              currentView={getInventoryView(currentView)}
              setCurrentView={handleInventoryViewChange}
              isAddCategoryOpen={isAddCategoryOpen}
              setIsAddCategoryOpen={setIsAddCategoryOpen}
              categoryForm={categoryForm}
              setCategoryForm={setCategoryForm}
              handleCreateCategory={handleCreateCategory}
              isEditCategoryOpen={isEditCategoryOpen}
              setIsEditCategoryOpen={setIsEditCategoryOpen}
              editingCategory={editingCategory}
              setEditingCategory={setEditingCategory}
              editCategoryForm={editCategoryForm}
              setEditCategoryForm={setEditCategoryForm}
              handleEditCategory={handleEditCategory}
              handleDeleteCategory={handleDeleteCategory}
              isDeleteConfirmOpen={isDeleteConfirmOpen}
              setIsDeleteConfirmOpen={setIsDeleteConfirmOpen}
              categoryToDelete={categoryToDelete}
              setCategoryToDelete={setCategoryToDelete}
              totals={totals}
              selectedCategoryId={selectedCategoryId}
              onClearCategoryFilter={handleClearCategoryFilter}
              isAddProductOpen={isAddProductOpen}
              setIsAddProductOpen={setIsAddProductOpen}
            />
          </TabsContent>

        </Tabs>
      </div>
    </AppLayout>
  );
};

export default ProductInventory;
