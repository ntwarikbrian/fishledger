/**
 * ProductInventory Component (Refactored)
 * Main inventory management page with tabbed interface
 * Separated into individual components for better maintainability
 */

import React, { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Package, Plus, FileText } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCategories } from "@/hooks/use-categories";
import InventoryTab from "@/components/inventory/InventoryTab";
import AddProductTab from "@/components/inventory/AddProductTab";
import AuditTab from "@/components/inventory/AuditTab";

type ViewType = "all" | "low-stock" | "damaged" | "expiry" | "stock-adjustment" | "categories";

const ProductInventory = () => {
  // View state
  const [currentView, setCurrentView] = useState<ViewType>("all");
  
  // Dialog states
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isAddStockOpen, setIsAddStockOpen] = useState(false);
  const [isAddDamagedOpen, setIsAddDamagedOpen] = useState(false);
  const [isAddExpiredOpen, setIsAddExpiredOpen] = useState(false);
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

  // Mock totals data
  const totals = {
    totalValue: 45250,
    totalCostPrice: 28900,
    totalProfit: 16350,
    profitMargin: 36,
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Product Inventory</h1>
          <p className="text-muted-foreground">Manage fish products, stock levels, and pricing</p>
        </div>

        {/* Product Management Tabs */}
        <Tabs defaultValue="inventory" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="inventory">
              <Package className="mr-2 h-4 w-4" />
              Inventory
            </TabsTrigger>
            <TabsTrigger value="add">
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </TabsTrigger>
            <TabsTrigger value="audit">
              <FileText className="mr-2 h-4 w-4" />
              Audit
            </TabsTrigger>
          </TabsList>

          {/* Inventory Tab Content */}
          <TabsContent value="inventory" className="space-y-4">
            <InventoryTab
              currentView={currentView}
              setCurrentView={setCurrentView}
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
            />
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
              isAddExpiredOpen={isAddExpiredOpen}
              setIsAddExpiredOpen={setIsAddExpiredOpen}
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

          {/* Audit Tab Content */}
          <TabsContent value="audit" className="space-y-4">
            <AuditTab />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default ProductInventory;
