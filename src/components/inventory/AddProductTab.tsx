/**
 * AddProductTab Component
 * Handles all product addition functionality including new products, stock, damaged items, and stock corrections
 */

import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { Fish, AlertTriangle, Plus, Package, Save, Camera, Scan, Upload, X, Calculator } from "lucide-react";
import { categoriesApi, productsApi, stockAdditions, stockCorrections } from "@/lib/api";
import { useProducts } from "@/hooks/use-products";
import { toast } from "sonner";

// Types for the product form
interface ProductCategory {
  category_id: string;
  name: string;
  description?: string;
}

interface CreateProductData {
  name: string;
  category_id: string;
  quantity_box: number;
  box_to_kg_ratio: number;
  quantity_kg: number;
  cost_per_box: number;
  cost_per_kg: number;
  price_per_box: number;
  price_per_kg: number;
  boxed_low_stock_threshold: number;
  expiry_date?: string;
  damaged_reason?: string;
  damaged_date?: string;
  loss_value?: number;
  damaged_approval?: boolean;
}

interface AddProductTabProps {
  isAddProductOpen: boolean;
  setIsAddProductOpen: (open: boolean) => void;
  isAddStockOpen: boolean;
  setIsAddStockOpen: (open: boolean) => void;
  isAddDamagedOpen: boolean;
  setIsAddDamagedOpen: (open: boolean) => void;
  isStockCorrectionOpen: boolean;
  setIsStockCorrectionOpen: (open: boolean) => void;
  isOcrMode: boolean;
  setIsOcrMode: (mode: boolean) => void;
  ocrImage: File | null;
  setOcrImage: (image: File | null) => void;
  ocrResults: any;
  setOcrResults: (results: any) => void;
  isProcessingOcr: boolean;
  setIsProcessingOcr: (processing: boolean) => void;
  processOcrImage: () => void;
  handleCloseAddStock: () => void;
}

const AddProductTab: React.FC<AddProductTabProps> = ({
  isAddProductOpen,
  setIsAddProductOpen,
  isAddStockOpen,
  setIsAddStockOpen,
  isAddDamagedOpen,
  setIsAddDamagedOpen,
  isStockCorrectionOpen,
  setIsStockCorrectionOpen,
  isOcrMode,
  setIsOcrMode,
  ocrImage,
  setOcrImage,
  ocrResults,
  setOcrResults,
  isProcessingOcr,
  setIsProcessingOcr,
  processOcrImage,
  handleCloseAddStock,
}) => {
  // Translation hook
  const { t } = useTranslation();

  // State for product form
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);

  // Products hook for refreshing the list after adding a product
  const { products, fetchProducts } = useProducts();

  // State for damaged product form
  const [damagedFormData, setDamagedFormData] = useState({
    product_id: '',
    damaged_boxes: 0,
    damaged_kg: 0,
    damaged_reason: ''
  });
  const [isSubmittingDamaged, setIsSubmittingDamaged] = useState(false);

  // State for stock addition form
  const [stockAdditionForm, setStockAdditionForm] = useState({
    product_id: '',
    boxes_added: '',
    kg_added: '',
    total_cost: 0,
    delivery_date: new Date().toISOString().split('T')[0], // Default to today
    expiry_date: ''
  });
  const [isSubmittingStock, setIsSubmittingStock] = useState(false);

  // State for stock correction form
  const [stockCorrectionForm, setStockCorrectionForm] = useState({
    product_id: '',
    actual_boxes: '',
    actual_kg: '',
    correction_reason: ''
  });
  const [isSubmittingStockCorrection, setIsSubmittingStockCorrection] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  // Function to calculate total cost based on product cost prices and quantities
  const calculateTotalCost = (productId: string, boxes: string, kg: string) => {
    const selectedProduct = products.find(p => p.product_id === productId);
    if (!selectedProduct) return 0;

    const boxesNum = parseInt(boxes) || 0;
    const kgNum = parseFloat(kg) || 0;

    const boxCost = boxesNum * selectedProduct.cost_per_box;
    const kgCost = kgNum * selectedProduct.cost_per_kg;

    return boxCost + kgCost;
  };

  // Date validation helpers
  const getTodayDate = () => new Date().toISOString().split('T')[0];
  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const [formData, setFormData] = useState<CreateProductData>({
    name: '',
    category_id: '',
    quantity_box: 0,
    box_to_kg_ratio: 0, // User must enter their own value
    quantity_kg: 0,
    cost_per_box: 0,
    cost_per_kg: 0,
    price_per_box: 0,
    price_per_kg: 0,
    boxed_low_stock_threshold: 0, // User must enter their own value
    expiry_date: ''
  });

  // Load categories when component mounts
  useEffect(() => {
    loadCategories();
  }, []);

  /**
   * Load product categories from API
   */
  const loadCategories = async () => {
    try {
      setIsLoadingCategories(true);
      const response = await categoriesApi.getAll();
      if (response.success) {
        setCategories(response.data || []);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setIsLoadingCategories(false);
    }
  };

  /**
   * Handle form input changes with validation
   */
  const handleInputChange = (field: keyof CreateProductData, value: string | number) => {
    // For numeric fields, ensure no negative values
    if (typeof value === 'number' && field !== 'name' && field !== 'category_id' && field !== 'expiry_date') {
      value = Math.max(0, value); // Prevent negative numbers
    }

    setFormData(prev => {
      const newData = {
        ...prev,
        [field]: value
      };

      // Note: Real-time price validation removed to allow users to type freely
      // Final validation will happen on form submission

      return newData;
    });
  };

  /**
   * Handle form submission
   */
  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🚀 Form submitted!', formData);

    try {
      setIsSubmittingProduct(true);

      // Validate required fields
      if (!formData.name || !formData.category_id || !formData.cost_per_box || !formData.cost_per_kg || !formData.price_per_box || !formData.price_per_kg) {
        alert('Please fill in all required fields');
        return;
      }

      // Validate box to kg ratio
      if (formData.box_to_kg_ratio <= 0) {
        alert('Box to kg ratio must be greater than 0');
        return;
      }

      // Validate low stock threshold
      if (formData.boxed_low_stock_threshold <= 0) {
        alert('Low stock threshold must be greater than 0');
        return;
      }

      // Validate that selling prices are higher than cost prices
      if (formData.price_per_box <= formData.cost_per_box) {
        alert('Selling price per box must be higher than cost price per box');
        return;
      }

      if (formData.price_per_kg <= formData.cost_per_kg) {
        alert('Selling price per kg must be higher than cost price per kg');
        return;
      }

      // Prepare data for API call
      const productData = {
        name: formData.name,
        category_id: formData.category_id,
        quantity_box: formData.quantity_box,
        box_to_kg_ratio: formData.box_to_kg_ratio,
        quantity_kg: formData.quantity_kg,
        cost_per_box: formData.cost_per_box,
        cost_per_kg: formData.cost_per_kg,
        price_per_box: formData.price_per_box,
        price_per_kg: formData.price_per_kg,
        boxed_low_stock_threshold: formData.boxed_low_stock_threshold,
        expiry_date: formData.expiry_date
      };

      // Call API to create product
      console.log('📡 Calling API with data:', productData);
      const response = await productsApi.create(productData);
      console.log('📥 API Response:', response);

      if (response.success) {
        console.log('✅ Product created successfully!');
        alert('Product created successfully!');

        // Refresh the products list
        await fetchProducts();

        // Reset form and close dialog
      setFormData({
        name: '',
        category_id: '',
        quantity_box: 0,
        box_to_kg_ratio: 0,
        quantity_kg: 0,
        cost_per_box: 0,
        cost_per_kg: 0,
        price_per_box: 0,
        price_per_kg: 0,
        boxed_low_stock_threshold: 0,
        expiry_date: ''
      });
        setIsAddProductOpen(false);
      } else {
        console.log('❌ API Error:', response);
        alert('Failed to create product: ' + (response.message || 'Unknown error'));
      }

    } catch (error) {
      console.error('❌ Error creating product:', error);
      toast.error('Failed to create product. Please try again.');
    } finally {
      setIsSubmittingProduct(false);
    }
  };

  /**
   * Handle damaged product form submission
   */
  const handleSubmitDamagedProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form data
    if (!damagedFormData.product_id) {
      toast.error('Please select a product');
      return;
    }

    if (!damagedFormData.damaged_reason) {
      toast.error('Please select a damage reason');
      return;
    }

    if (damagedFormData.damaged_boxes <= 0 && damagedFormData.damaged_kg <= 0) {
      toast.error('Please enter at least one damaged quantity (boxes or kg)');
      return;
    }

    try {
      setIsSubmittingDamaged(true);

      const response = await productsApi.recordDamage(damagedFormData.product_id, {
        damaged_boxes: damagedFormData.damaged_boxes,
        damaged_kg: damagedFormData.damaged_kg,
        damaged_reason: damagedFormData.damaged_reason
      });

      if (response.success) {
        toast.success('Damaged product recorded successfully!');

        // Refresh the products list
        await fetchProducts();

        // Reset form and close dialog
        setDamagedFormData({
          product_id: '',
          damaged_boxes: 0,
          damaged_kg: 0,
          damaged_reason: ''
        });
        setIsAddDamagedOpen(false);
      } else {
        toast.error('Failed to record damaged product: ' + (response.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error recording damaged product:', error);
      toast.error('Failed to record damaged product. Please try again.');
    } finally {
      setIsSubmittingDamaged(false);
    }
  };

  // Handle stock addition form submission
  const handleSubmitStockAddition = async (e?: React.FormEvent) => {
    e?.preventDefault();

    // Validation
    if (!stockAdditionForm.product_id) {
      toast.error('Please select a product');
      return;
    }

    const boxesAdded = parseInt(stockAdditionForm.boxes_added) || 0;
    const kgAdded = parseFloat(stockAdditionForm.kg_added) || 0;

    if (boxesAdded <= 0 && kgAdded <= 0) {
      toast.error('Please enter at least one quantity (boxes or kg)');
      return;
    }

    if (stockAdditionForm.total_cost < 0) {
      toast.error('Total cost cannot be negative');
      return;
    }

    setIsSubmittingStock(true);

    try {
      const response = await stockAdditions.create({
        product_id: stockAdditionForm.product_id,
        boxes_added: boxesAdded,
        kg_added: kgAdded,
        total_cost: stockAdditionForm.total_cost,
        delivery_date: stockAdditionForm.delivery_date
      });

      if (response.success) {
        toast.success('Stock added successfully!');

        // Refresh the products list
        await fetchProducts();

        // Reset form and close dialog
        setStockAdditionForm({
          product_id: '',
          boxes_added: '',
          kg_added: '',
          total_cost: 0,
          delivery_date: new Date().toISOString().split('T')[0],
          expiry_date: ''
        });
        setIsAddStockOpen(false);
      } else {
        toast.error('Failed to add stock: ' + (response.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error adding stock:', error);
      toast.error('Failed to add stock. Please try again.');
    } finally {
      setIsSubmittingStock(false);
    }
  };

  /**
   * Handle stock correction form submission
   */
  const handleSubmitStockCorrection = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stockCorrectionForm.product_id || !stockCorrectionForm.correction_reason.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!stockCorrectionForm.actual_boxes && !stockCorrectionForm.actual_kg) {
      toast.error('Please enter at least one actual quantity (boxes or kg)');
      return;
    }

    setIsSubmittingStockCorrection(true);

    try {
      // Calculate adjustments based on current vs actual quantities
      const currentBoxes = selectedProduct?.quantity_box || 0;
      const currentKg = selectedProduct?.quantity_kg || 0;
      const actualBoxes = parseInt(stockCorrectionForm.actual_boxes) || 0;
      const actualKg = parseFloat(stockCorrectionForm.actual_kg) || 0;

      const boxAdjustment = actualBoxes - currentBoxes;
      const kgAdjustment = actualKg - currentKg;

      // Create stock correction
      const response = await stockCorrections.create({
        product_id: stockCorrectionForm.product_id,
        box_adjustment: boxAdjustment,
        kg_adjustment: kgAdjustment,
        correction_reason: stockCorrectionForm.correction_reason.trim()
      });

      if (response.success) {
        toast.success('Stock correction applied successfully!');

        // Refresh products list
        await fetchProducts();

        // Reset form
        setStockCorrectionForm({
          product_id: '',
          actual_boxes: '',
          actual_kg: '',
          correction_reason: ''
        });
        setSelectedProduct(null);
        setIsStockCorrectionOpen(false);
      } else {
        toast.error('Failed to apply stock correction: ' + (response.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error submitting stock correction:', error);
      toast.error('Failed to apply stock correction');
    } finally {
      setIsSubmittingStockCorrection(false);
    }
  };

  /**
   * Handle product selection for stock correction
   */
  const handleProductSelect = (productId: string) => {
    const product = products.find(p => p.product_id === productId);
    setSelectedProduct(product);
    setStockCorrectionForm(prev => ({
      ...prev,
      product_id: productId,
      actual_boxes: product?.quantity_box?.toString() || '',
      actual_kg: product?.quantity_kg?.toString() || ''
    }));
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Add New Product Square */}
        <Card className="hover-card aspect-square">
          <CardContent className="p-4 h-full flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Fish className="h-6 w-6 text-blue-600" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold">{t("inventory.addProduct.cardTitle")}</h3>
              <p className="text-xs text-muted-foreground">
                {t("inventory.addProduct.cardDescription")}
              </p>
            </div>
            <Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-sm px-4">
                  <Plus className="mr-1 h-3 w-3" />
                  Add Product
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
                <DialogHeader className="pb-3">
                  <DialogTitle className="text-lg">Add New Fish Product</DialogTitle>
                  <DialogDescription className="text-sm">
                    Create a new fish product with pricing and inventory details.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmitProduct} className="space-y-3">
                  {/* Basic Information */}
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <Label htmlFor="productName" className="text-sm font-medium">Product Name *</Label>
                      <Input
                        id="productName"
                        placeholder="e.g., Atlantic Salmon"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className="h-8 text-sm"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="category" className="text-sm font-medium">Category *</Label>
                      <Select
                        value={formData.category_id}
                        onValueChange={(value) => handleInputChange('category_id', value)}
                      >
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue placeholder={isLoadingCategories ? "Loading..." : "Select category"} />
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
                  </div>

                  {/* Inventory Quantities */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <Label htmlFor="boxedQuantity" className="text-xs font-medium">Boxed Qty</Label>
                      <Input
                        id="boxedQuantity"
                        type="number"
                        min="0"
                        placeholder="0"
                        value={formData.quantity_box === 0 ? '' : formData.quantity_box}
                        onChange={(e) => handleInputChange('quantity_box', e.target.value === '' ? 0 : parseInt(e.target.value) || 0)}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="boxToKgRatio" className="text-xs font-medium">Box to Kg *</Label>
                      <Input
                        id="boxToKgRatio"
                        type="number"
                        step="0.1"
                        min="0"
                        placeholder="e.g., 20.0"
                        value={formData.box_to_kg_ratio === 0 ? '' : formData.box_to_kg_ratio}
                        onChange={(e) => handleInputChange('box_to_kg_ratio', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                        className="h-8 text-sm"
                        required
                      />
                      <p className="text-xs text-muted-foreground">Weight per box in kg (must be &gt; 0)</p>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="weightQuantity" className="text-xs font-medium">Weight (kg)</Label>
                      <Input
                        id="weightQuantity"
                        type="number"
                        step="0.1"
                        min="0"
                        placeholder="0.0"
                        value={formData.quantity_kg === 0 ? '' : formData.quantity_kg}
                        onChange={(e) => handleInputChange('quantity_kg', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>

                  {/* Cost Prices */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label htmlFor="costPriceBox" className="text-xs font-medium">Cost/Box ($) *</Label>
                      <Input
                        id="costPriceBox"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={formData.cost_per_box === 0 ? '' : formData.cost_per_box}
                        onChange={(e) => handleInputChange('cost_per_box', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                        className="h-8 text-sm"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="costPriceKg" className="text-xs font-medium">Cost/Kg ($) *</Label>
                      <Input
                        id="costPriceKg"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={formData.cost_per_kg === 0 ? '' : formData.cost_per_kg}
                        onChange={(e) => handleInputChange('cost_per_kg', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                        className="h-8 text-sm"
                        required
                      />
                    </div>
                  </div>

                  {/* Selling Prices */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label htmlFor="sellingPriceBox" className="text-xs font-medium">Sell/Box ($) *</Label>
                      <Input
                        id="sellingPriceBox"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={formData.price_per_box === 0 ? '' : formData.price_per_box}
                        onChange={(e) => handleInputChange('price_per_box', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                        className="h-8 text-sm"
                        required
                      />
                      {formData.cost_per_box > 0 && formData.price_per_box > 0 && (
                        formData.price_per_box > formData.cost_per_box ? (
                          <p className="text-xs text-green-600 leading-tight">
                            +${(formData.price_per_box - formData.cost_per_box).toFixed(2)}
                          </p>
                        ) : (
                          <p className="text-xs text-red-600 leading-tight">
                            ⚠️ Must be higher than cost price
                          </p>
                        )
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="sellingPriceKg" className="text-xs font-medium">Sell/Kg ($) *</Label>
                      <Input
                        id="sellingPriceKg"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={formData.price_per_kg === 0 ? '' : formData.price_per_kg}
                        onChange={(e) => handleInputChange('price_per_kg', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                        className="h-8 text-sm"
                        required
                      />
                      {formData.cost_per_kg > 0 && formData.price_per_kg > 0 && (
                        formData.price_per_kg > formData.cost_per_kg ? (
                          <p className="text-xs text-green-600 leading-tight">
                            +${(formData.price_per_kg - formData.cost_per_kg).toFixed(2)}
                          </p>
                        ) : (
                          <p className="text-xs text-red-600 leading-tight">
                            ⚠️ Must be higher than cost price
                          </p>
                        )
                      )}
                    </div>
                  </div>

                  {/* Additional Settings */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label htmlFor="lowStockThreshold" className="text-xs font-medium">Low Stock Alert</Label>
                      <Input
                        id="lowStockThreshold"
                        type="number"
                        min="0"
                        placeholder="e.g., 10"
                        value={formData.boxed_low_stock_threshold === 0 ? '' : formData.boxed_low_stock_threshold}
                        onChange={(e) => handleInputChange('boxed_low_stock_threshold', e.target.value === '' ? 0 : parseInt(e.target.value) || 0)}
                        className="h-8 text-sm"
                      />
                      <p className="text-xs text-muted-foreground">Alert when stock falls below this number</p>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="expiryDate" className="text-xs font-medium">Expiry Date</Label>
                      <Input
                        id="expiryDate"
                        type="date"
                        value={formData.expiry_date}
                        onChange={(e) => handleInputChange('expiry_date', e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>

                  {/* Form Buttons */}
                  <div className="flex justify-end space-x-2 pt-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsAddProductOpen(false)}
                      disabled={isSubmittingProduct}
                      className="h-8 px-3 text-sm"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 h-8 px-3 text-sm"
                      disabled={isSubmittingProduct}
                    >
                      {isSubmittingProduct ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                          Creating...
                        </>
                      ) : (
                        <>
                          <Save className="mr-1 h-3 w-3" />
                          Add Product
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Add Stock Square */}
        <Card className="hover-card aspect-square">
          <CardContent className="p-4 h-full flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <Package className="h-6 w-6 text-green-600" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold">Add Stock to Existing Product</h3>
              <p className="text-xs text-muted-foreground">
                Increase inventory levels for existing fish products when new shipments arrive or stock is replenished from suppliers
              </p>
            </div>
            <Dialog open={isAddStockOpen} onOpenChange={setIsAddStockOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-sm px-4">
                  <Plus className="mr-1 h-3 w-3" />
                  Add Stock
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-green-600" />
                    Add Stock to Product
                  </DialogTitle>
                  <DialogDescription>
                    Add new stock to an existing product. Use OCR to scan delivery documents for faster data entry.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmitStockAddition} className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2">
                      <Scan className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-900 dark:text-blue-100">OCR Mode</span>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => alert('Feature Coming Soon!')}
                      className="h-7 px-3 text-xs"
                    >
                      Enable
                    </Button>
                  </div>

                  {/* Form Fields */}
                    <div className="space-y-2">
                      <div className="space-y-1">
                        <Label htmlFor="stockProduct" className="text-xs font-medium">Select Product *</Label>
                        <Select
                          value={stockAdditionForm.product_id}
                          onValueChange={(value) => setStockAdditionForm(prev => ({
                            ...prev,
                            product_id: value,
                            total_cost: calculateTotalCost(value, prev.boxes_added, prev.kg_added)
                          }))}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Choose product" />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map((product) => (
                              <SelectItem key={product.product_id} value={product.product_id}>
                                {product.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label htmlFor="addBoxes" className="text-xs font-medium">Boxes</Label>
                          <Input
                            id="addBoxes"
                            type="number"
                            min="0"
                            placeholder="0"
                            className="h-8 text-xs"
                            value={stockAdditionForm.boxes_added}
                            onChange={(e) => {
                              const newBoxes = e.target.value;
                              setStockAdditionForm(prev => ({
                                ...prev,
                                boxes_added: newBoxes,
                                total_cost: calculateTotalCost(prev.product_id, newBoxes, prev.kg_added)
                              }));
                            }}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="addKg" className="text-xs font-medium">KG Stock</Label>
                          <Input
                            id="addKg"
                            type="number"
                            min="0"
                            step="0.1"
                            placeholder="0.0"
                            className="h-8 text-xs"
                            value={stockAdditionForm.kg_added}
                            onChange={(e) => {
                              const newKg = e.target.value;
                              setStockAdditionForm(prev => ({
                                ...prev,
                                kg_added: newKg,
                                total_cost: calculateTotalCost(prev.product_id, prev.boxes_added, newKg)
                              }));
                            }}
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="totalCost" className="text-xs font-medium">Total Cost (Auto-calculated)</Label>
                        <Input
                          id="totalCost"
                          type="text"
                          placeholder="0.00"
                          className="h-8 text-xs bg-gray-50 dark:bg-gray-800"
                          value={`$${stockAdditionForm.total_cost.toFixed(2)}`}
                          readOnly
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label htmlFor="deliveryDate" className="text-xs font-medium">Delivery Date</Label>
                          <Input
                            id="deliveryDate"
                            type="date"
                            max={getTodayDate()}
                            className="h-8 text-xs"
                            value={stockAdditionForm.delivery_date}
                            onChange={(e) => setStockAdditionForm(prev => ({
                              ...prev,
                              delivery_date: e.target.value
                            }))}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="expiryDate" className="text-xs font-medium">Expiry Date</Label>
                          <Input
                            id="expiryDate"
                            type="date"
                            min={getTomorrowDate()}
                            className="h-8 text-xs"
                            value={stockAdditionForm.expiry_date}
                            onChange={(e) => setStockAdditionForm(prev => ({
                              ...prev,
                              expiry_date: e.target.value
                            }))}
                          />
                        </div>
                      </div>


                    </div>
                </form>
                <DialogFooter className="gap-2 pt-3">
                  <Button type="button" variant="outline" onClick={handleCloseAddStock} className="h-8 px-3 text-xs">
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSubmitStockAddition}
                    disabled={isSubmittingStock}
                    className="bg-blue-600 hover:bg-blue-700 h-8 px-3 text-xs disabled:opacity-50"
                  >
                    <Package className="mr-1 h-3 w-3" />
                    {isSubmittingStock ? 'Adding...' : 'Add Stock'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Add Damaged Square */}
        <Card className="hover-card aspect-square">
          <CardContent className="p-4 h-full flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold">Record Damaged Products</h3>
              <p className="text-xs text-muted-foreground">
                Document and record damaged, spoiled, or compromised fish products and automatically remove them from available sellable inventory
              </p>
            </div>
            <Dialog open={isAddDamagedOpen} onOpenChange={setIsAddDamagedOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-sm px-4">
                  <Plus className="mr-1 h-3 w-3" />
                  Add Damaged
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Record Damaged Products</DialogTitle>
                  <DialogDescription>
                    Document damaged products and remove them from available inventory.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmitDamagedProduct} className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="damagedProduct">Select Product *</Label>
                      <Select
                        value={damagedFormData.product_id}
                        onValueChange={(value) => setDamagedFormData({...damagedFormData, product_id: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose product" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((product) => (
                            <SelectItem key={product.product_id} value={product.product_id}>
                              {product.name} (Boxes: {product.quantity_box}, KG: {product.quantity_kg})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="damagedBoxes">Damaged Boxes</Label>
                        <Input
                          id="damagedBoxes"
                          type="number"
                          min="0"
                          placeholder="0"
                          value={damagedFormData.damaged_boxes === 0 ? '' : damagedFormData.damaged_boxes}
                          onChange={(e) => setDamagedFormData({...damagedFormData, damaged_boxes: e.target.value === '' ? 0 : parseInt(e.target.value) || 0})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="damagedKg">Damaged Weight (kg)</Label>
                        <Input
                          id="damagedKg"
                          type="number"
                          step="0.1"
                          min="0"
                          placeholder="0.0"
                          value={damagedFormData.damaged_kg === 0 ? '' : damagedFormData.damaged_kg}
                          onChange={(e) => setDamagedFormData({...damagedFormData, damaged_kg: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0})}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="damageReason">Damage Reason *</Label>
                      <Input
                        id="damageReason"
                        type="text"
                        placeholder="e.g., Freezer malfunction, Damaged in transit, Quality issues..."
                        value={damagedFormData.damaged_reason}
                        onChange={(e) => setDamagedFormData({...damagedFormData, damaged_reason: e.target.value})}
                        className="w-full"
                      />
                    </div>
                  </div>
                </form>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddDamagedOpen(false)}
                    disabled={isSubmittingDamaged}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-red-600 hover:bg-red-700"
                    disabled={isSubmittingDamaged}
                    onClick={handleSubmitDamagedProduct}
                  >
                    {isSubmittingDamaged ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Recording...
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="mr-2 h-4 w-4" />
                        Record Damage
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Stock Correction Square */}
        <Card className="hover-card aspect-square">
          <CardContent className="p-4 h-full flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <Calculator className="h-6 w-6 text-purple-600" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold">Stock Correction</h3>
              <p className="text-xs text-muted-foreground">
                Adjust inventory quantities to correct discrepancies between system records and actual physical stock counts
              </p>
            </div>
            <Dialog open={isStockCorrectionOpen} onOpenChange={setIsStockCorrectionOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-sm px-4">
                  <Plus className="mr-1 h-3 w-3" />
                  Correct Stock
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Stock Correction</DialogTitle>
                  <DialogDescription>
                    Adjust inventory quantities to match actual physical stock counts.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmitStockCorrection} className="space-y-4">
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="correctionProduct">Select Product *</Label>
                      <Select
                        value={stockCorrectionForm.product_id}
                        onValueChange={handleProductSelect}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose product" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((product) => (
                            <SelectItem key={product.product_id} value={product.product_id}>
                              {product.name} (Boxes: {product.quantity_box}, KG: {product.quantity_kg})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedProduct && (
                      <div className="p-3 bg-muted rounded-lg text-sm">
                        <p><strong>Current Stock:</strong> {selectedProduct.quantity_box} boxes, {selectedProduct.quantity_kg} kg</p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="actualBoxes">Actual Boxes</Label>
                        <Input
                          id="actualBoxes"
                          type="number"
                          min="0"
                          placeholder="0"
                          value={stockCorrectionForm.actual_boxes}
                          onChange={(e) => setStockCorrectionForm(prev => ({
                            ...prev,
                            actual_boxes: e.target.value
                          }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="actualKg">Actual Weight (kg)</Label>
                        <Input
                          id="actualKg"
                          type="number"
                          step="0.1"
                          min="0"
                          placeholder="0.0"
                          value={stockCorrectionForm.actual_kg}
                          onChange={(e) => setStockCorrectionForm(prev => ({
                            ...prev,
                            actual_kg: e.target.value
                          }))}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="correctionReason">Reason for Correction *</Label>
                      <Input
                        id="correctionReason"
                        type="text"
                        placeholder="e.g., Theft, Physical count discrepancy, System error..."
                        className="w-full"
                        value={stockCorrectionForm.correction_reason}
                        onChange={(e) => setStockCorrectionForm(prev => ({
                          ...prev,
                          correction_reason: e.target.value
                        }))}
                      />
                    </div>
                  </div>
                </form>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsStockCorrectionOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700"
                    disabled={isSubmittingStockCorrection}
                    onClick={handleSubmitStockCorrection}
                  >
                    <Calculator className="mr-2 h-4 w-4" />
                    {isSubmittingStockCorrection ? 'Applying...' : 'Apply Correction'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>


      </div>
    </div>
  );
};

export default AddProductTab;
