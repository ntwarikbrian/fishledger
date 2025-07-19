import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Scale, Edit, Eye, Plus, FileText, ShoppingCart, Package, Fish, Calculator, Truck, CreditCard, Calendar, MapPin, DollarSign, Hash, AlertTriangle, CheckCircle, Box, Trash2, X, Check, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "react-i18next";
import { usePageTitle } from "@/hooks/use-page-title";
import { useState, useEffect } from "react";
import { useCurrency } from '@/contexts/CurrencyContext';
import { inventoryService, SaleRequest, FishSaleRequest, FishSaleResult, InventoryPreview } from "@/lib/api/services/inventory";
import { useProducts } from "@/hooks/use-products";
import { useSales } from "@/hooks/use-sales";
import { useAudits, type AuditRecord } from "@/hooks/use-audits";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const Sales = () => {
  const { t } = useTranslation();
  usePageTitle('navigation.sales', 'Sales');
  const { formatCurrency } = useCurrency();

  // Products hook for real data
  const { products, loading: productsLoading } = useProducts();

  // Sales hook for real data
  const { sales, loading: salesLoading, error: salesError, refetch: refetchSales } = useSales();

  // Audits hook for real audit data
  const {
    audits,
    loading: auditsLoading,
    error: auditsError,
    filters: auditFilters,
    setFilters: setAuditFilters,
    refetch: refetchAudits,
    approveAudit,
    rejectAudit
  } = useAudits();

  // Fish sale form state (new algorithm)
  const [fishSaleForm, setFishSaleForm] = useState({
    product_id: '',
    requested_kg: 0,
    requested_boxes: 0,
    amount_paid: 0,
    client_name: '',
    email_address: '',
    phone: '',
    payment_method: 'cash' as 'momo_pay' | 'cash' | 'bank_transfer' | '',
    payment_status: 'paid' as 'paid' | 'pending' | 'partial'
  });

  // Legacy sale form state (for backward compatibility)
  const [saleForm, setSaleForm] = useState({
    product_id: '',
    boxes_quantity: 0,
    kg_quantity: 0,
    box_price: 0,
    kg_price: 0,
    amount_paid: 0,
    client_name: '',
    email_address: '',
    phone: '',
    payment_method: '' as 'momo_pay' | 'cash' | 'bank_transfer' | '',
    payment_status: 'paid' as 'paid' | 'pending' | 'partial'
  });

  // Edit and delete state
  const [editingSale, setEditingSale] = useState<any>(null);
  const [deletingSale, setDeletingSale] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Sale details popup state
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [isSaleDetailsPopupOpen, setIsSaleDetailsPopupOpen] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({
    boxes_quantity: 0,
    kg_quantity: 0,
    payment_method: '' as 'momo_pay' | 'cash' | 'bank_transfer' | '',
    reason: '', // Reason for the edit
  });

  // Audit approval/rejection state
  const [auditAction, setAuditAction] = useState<{
    audit: AuditRecord | null;
    type: 'approve' | 'reject' | null;
    reason: string;
    isModalOpen: boolean;
  }>({
    audit: null,
    type: null,
    reason: '',
    isModalOpen: false,
  });

  // Form submission state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Products are now loaded from the database via useProducts hook

  // Remove old preview logic - no longer needed with new schema

  // Calculate total amount for fish sale (new algorithm)
  const calculateFishSaleTotal = () => {
    const selectedProduct = products.find(p => p.product_id === fishSaleForm.product_id);
    if (!selectedProduct) return 0;

    let total = 0;

    // Add kg amount
    if (fishSaleForm.requested_kg > 0) {
      total += fishSaleForm.requested_kg * selectedProduct.price_per_kg;
    }

    // Add box amount
    if (fishSaleForm.requested_boxes > 0) {
      total += fishSaleForm.requested_boxes * selectedProduct.price_per_box;
    }

    return total;
  };

  // Calculate total amount when quantities or prices change (legacy)
  const calculateTotal = () => {
    return (saleForm.boxes_quantity * saleForm.box_price) + (saleForm.kg_quantity * saleForm.kg_price);
  };

  // Fish sale submission handler (new algorithm)
  const handleSubmitFishSale = async () => {
    setIsSubmitting(true);

    try {
      // Validate fish sale form
      const validation = inventoryService.validateFishSaleRequest(fishSaleForm as FishSaleRequest);
      if (!validation.isValid) {
        alert(`Validation errors:\n${validation.errors.join('\n')}`);
        return;
      }

      console.log('🐟 Submitting fish sale:', fishSaleForm);
      console.log('🐟 Fish sale form validation check:', {
        product_id: !!fishSaleForm.product_id,
        requested_kg: fishSaleForm.requested_kg,
        requested_boxes: fishSaleForm.requested_boxes,
        payment_method: fishSaleForm.payment_method,
        payment_status: fishSaleForm.payment_status
      });

      const result = await inventoryService.createFishSale(fishSaleForm as FishSaleRequest);

      if (result.success) {
        // Reset form and show success
        setFishSaleForm({
          product_id: '',
          requested_kg: 0,
          requested_boxes: 0,
          amount_paid: 0,
          client_name: '',
          email_address: '',
          phone: '',
          payment_method: '',
          payment_status: 'paid'
        });

        // Show detailed success message with algorithm info
        let message = `🐟 Fish sale completed successfully!\n\n`;
        message += `Sale ID: ${result.data?.id}\n`;

        // Show what was sold
        const soldItems = [];
        if (result.algorithm?.result?.sold_kg > 0) {
          soldItems.push(`${result.algorithm.result.sold_kg}kg`);
        }
        if (result.algorithm?.result?.sold_boxes > 0) {
          soldItems.push(`${result.algorithm.result.sold_boxes} box(es)`);
        }
        message += `Sold: ${soldItems.join(' + ')}\n`;
        message += `Total: ${formatCurrency(result.algorithm?.result?.total_amount || 0)}\n`;

        if (result.algorithm?.steps) {
          message += `\nAlgorithm steps:\n${result.algorithm.steps.join('\n')}`;
        }

        if (result.stockInfo) {
          message += `\nStock after sale:\n`;
          message += `Boxes: ${result.stockInfo.after.boxes}\n`;
          message += `Kg: ${result.stockInfo.after.kg}`;
        }

        alert(message);
        handleSaleSuccess();
      } else {
        alert(`Fish sale failed: ${result.error}`);
      }
    } catch (error: any) {
      console.error('Error creating fish sale:', error);

      // Try to extract validation errors from the response
      let errorMessage = 'Unknown error';
      if (error.message) {
        errorMessage = error.message;
      }

      // If it's an ApiClientError with validation details
      if (error.name === 'ApiClientError' && error.details && error.details.validationErrors) {
        const validationErrors = error.details.validationErrors;
        errorMessage = `Validation failed:\n${validationErrors.map((err: any) => `• ${err.field}: ${err.message}`).join('\n')}`;
      }

      alert(`Fish sale failed: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Legacy sale submission handler
  const handleSubmitSale = async () => {
    // Validate form before submission
    const validation = inventoryService.validateSaleRequest(saleForm as any);
    if (!validation.isValid) {
      alert(`Validation errors:\n${validation.errors.join('\n')}`);
      return;
    }

    // Check if selected product has sufficient stock
    if (selectedProduct) {
      if (saleForm.boxes_quantity > selectedProduct.quantity_box) {
        alert(`Insufficient box stock. Available: ${selectedProduct.quantity_box}, Requested: ${saleForm.boxes_quantity}`);
        return;
      }
      if (saleForm.kg_quantity > selectedProduct.quantity_kg) {
        alert(`Insufficient kg stock. Available: ${selectedProduct.quantity_kg}, Requested: ${saleForm.kg_quantity}`);
        return;
      }
    }

    // Ensure payment method is set
    if (!saleForm.payment_method) {
      alert('Please select a payment method');
      return;
    }

    // Validate client info for pending/partial payments (not required for paid)
    if ((saleForm.payment_status === 'pending' || saleForm.payment_status === 'partial') && !saleForm.client_name.trim()) {
      alert('Client name is required for pending or partial payments');
      return;
    }

    setIsSubmitting(true);
    try {
      // Prepare sale data - remove empty client fields for paid transactions
      const saleData = { ...saleForm };
      if (saleData.payment_status === 'paid') {
        // For paid transactions, ensure client fields are not sent if empty
        if (!saleData.client_name?.trim()) delete saleData.client_name;
        if (!saleData.email_address?.trim()) delete saleData.email_address;
        if (!saleData.phone?.trim()) delete saleData.phone;
      }

      const result = await inventoryService.createSale(saleData as SaleRequest);
      if (result.success) {
        // Reset form and show success
        setSaleForm({
          product_id: '',
          boxes_quantity: 0,
          kg_quantity: 0,
          box_price: 0,
          kg_price: 0,
          amount_paid: 0,
          client_name: '',
          email_address: '',
          phone: '',
          payment_method: '',
          payment_status: 'pending'
        });

        // Show success message and refresh sales list
        const message = `Sale created successfully!\n\nSale ID: ${result.id}\nBoxes sold: ${result.boxes_quantity}\nKg sold: ${result.kg_quantity}\nTotal amount: $${result.total_amount?.toFixed(2)}`;
        alert(message);
        handleSaleSuccess();
      } else {
        alert(`Sale failed: ${result.error}`);
      }
    } catch (error: any) {
      console.error('Error creating sale:', error);
      alert(`Error creating sale: ${error.message || 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedProduct = products.find(p => p.product_id === saleForm.product_id);
  const selectedFishProduct = products.find(p => p.product_id === fishSaleForm.product_id);

  // Auto-populate prices when product is selected (legacy)
  useEffect(() => {
    if (selectedProduct && saleForm.product_id && (!saleForm.box_price && !saleForm.kg_price)) {
      setSaleForm(prev => ({
        ...prev,
        box_price: selectedProduct.price_per_box || 0,
        kg_price: selectedProduct.price_per_kg || 0
      }));
    }
  }, [selectedProduct, saleForm.product_id]);

  // Helper functions for displaying data
  const formatQuantity = (sale: any) => {
    const parts = [];
    if (sale.boxes_quantity > 0) {
      parts.push(`${sale.boxes_quantity} boxes`);
    }
    if (sale.kg_quantity > 0) {
      parts.push(`${sale.kg_quantity} kg`);
    }
    return parts.join(' + ') || '0';
  };

  const formatPrice = (sale: any) => {
    const parts = [];
    if (sale.boxes_quantity > 0 && sale.box_price > 0) {
      parts.push(`${formatCurrency(sale.box_price)}/box`);
    }
    if (sale.kg_quantity > 0 && sale.kg_price > 0) {
      parts.push(`${formatCurrency(sale.kg_price)}/kg`);
    }
    return parts.join(', ') || 'N/A';
  };

  // Helper function to calculate and format total profit for the sale
  const formatProfit = (sale: any) => {
    let totalProfit = 0;

    // Calculate total profit from boxes: (profit per box) × (quantity of boxes)
    if (sale.boxes_quantity > 0 && sale.profit_per_box !== undefined && sale.profit_per_box !== null) {
      totalProfit += sale.boxes_quantity * sale.profit_per_box;
    }

    // Calculate total profit from kg: (profit per kg) × (quantity of kg)
    if (sale.kg_quantity > 0 && sale.profit_per_kg !== undefined && sale.profit_per_kg !== null) {
      totalProfit += sale.kg_quantity * sale.profit_per_kg;
    }

    return formatCurrency(totalProfit);
  };

  const formatPaymentMethod = (method: string) => {
    switch (method) {
      case 'momo_pay':
        return 'Mobile Money';
      case 'cash':
        return 'Cash';
      case 'bank_transfer':
        return 'Bank Transfer';
      default:
        return 'N/A';
    }
  };



  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "partial":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPaymentMethodColor = (method: string) => {
    switch (method) {
      case "momo_pay":
        return "bg-blue-100 text-blue-800";
      case "cash":
        return "bg-green-100 text-green-800";
      case "bank_transfer":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Utility functions for audit formatting
  const formatAuditType = (type: string) => {
    switch (type) {
      case 'quantity_change': return 'Quantity Change';
      case 'payment_method_change': return 'Payment Method Change';
      case 'deletion': return 'Deletion';
      default: return type;
    }
  };

  const getAuditTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'quantity_change': return 'bg-blue-100 text-blue-800';
      case 'payment_method_change': return 'bg-purple-100 text-purple-800';
      case 'deletion': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getApprovalStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatChangedDetails = (audit: AuditRecord) => {
    const details = [];

    if (audit.audit_type === 'quantity_change') {
      if (audit.boxes_change !== 0) {
        details.push(`Boxes: ${audit.boxes_change > 0 ? '+' : ''}${audit.boxes_change}`);
      }
      if (audit.kg_change !== 0) {
        details.push(`KG: ${audit.kg_change > 0 ? '+' : ''}${audit.kg_change}`);
      }
    } else if (audit.audit_type === 'payment_method_change') {
      if (audit.old_values && audit.new_values) {
        const oldMethod = audit.old_values.payment_method;
        const newMethod = audit.new_values.payment_method;
        if (oldMethod !== newMethod) {
          const formatPaymentMethod = (method: string) => {
            switch (method) {
              case 'momo_pay': return 'Mobile Money';
              case 'cash': return 'Cash';
              case 'bank_transfer': return 'Bank Transfer';
              default: return method;
            }
          };
          details.push(`${formatPaymentMethod(oldMethod)} → ${formatPaymentMethod(newMethod)}`);
        }
      }
    } else if (audit.audit_type === 'deletion') {
      details.push('Sale marked for deletion');
    }

    if (details.length === 0) {
      return audit.reason || 'No details available';
    }

    return details.join(', ');
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  // Handle successful sale creation - refresh sales list
  const handleSaleSuccess = () => {
    refetchSales();
  };

  // Handle audit approval/rejection
  const handleAuditApprove = (audit: AuditRecord) => {
    setAuditAction({
      audit,
      type: 'approve',
      reason: '',
      isModalOpen: true,
    });
  };

  const handleAuditReject = (audit: AuditRecord) => {
    setAuditAction({
      audit,
      type: 'reject',
      reason: '',
      isModalOpen: true,
    });
  };

  const confirmAuditAction = async () => {
    if (!auditAction.audit || !auditAction.type || !auditAction.reason.trim()) {
      alert('Please provide a reason for your decision');
      return;
    }

    try {
      let success = false;
      if (auditAction.type === 'approve') {
        success = await approveAudit(auditAction.audit.audit_id, auditAction.reason);
      } else {
        success = await rejectAudit(auditAction.audit.audit_id, auditAction.reason);
      }

      if (success) {
        alert(`Audit record ${auditAction.type}d successfully`);
        setAuditAction({
          audit: null,
          type: null,
          reason: '',
          isModalOpen: false,
        });
      }
    } catch (error) {
      console.error('Error processing audit action:', error);
      alert('Failed to process audit action. Please try again.');
    }
  };

  // Handle edit sale
  const handleEditSale = (sale: any) => {
    setEditingSale(sale);
    // Pre-populate edit form with current sale data
    setEditForm({
      boxes_quantity: sale.boxes_quantity || 0,
      kg_quantity: sale.kg_quantity || 0,
      payment_method: sale.payment_method || '',
      reason: '', // Reset reason for new edit
    });
    setIsEditModalOpen(true);
  };

  // Handle delete sale
  const handleDeleteSale = (sale: any) => {
    setDeletingSale(sale);
    setIsDeleteModalOpen(true);
  };

  // Handle view sale details
  const handleViewSaleDetails = (sale: any) => {
    setSelectedSale(sale);
    setIsSaleDetailsPopupOpen(true);
  };

  // Handle escape key to close popup
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isSaleDetailsPopupOpen) {
        setIsSaleDetailsPopupOpen(false);
      }
    };

    if (isSaleDetailsPopupOpen) {
      document.addEventListener('keydown', handleEscapeKey);
      // Prevent body scroll when popup is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'unset';
    };
  }, [isSaleDetailsPopupOpen]);

  // State for delete reason
  const [deleteReason, setDeleteReason] = useState('');

  // Confirm delete sale
  const confirmDeleteSale = async () => {
    if (!deletingSale) return;

    if (!deleteReason.trim()) {
      alert('Reason for deletion is required');
      return;
    }

    try {
      // Use the inventory service with reason for audit-based deletion
      const result = await inventoryService.deleteSale(deletingSale.id, { reason: deleteReason.trim() });

      if (result.success) {
        alert('Delete request submitted successfully! The sale will be deleted after admin approval.');
        refetchSales();
        refetchAudits(); // Refresh audits to show new request
        setIsDeleteModalOpen(false);
        setDeletingSale(null);
        setDeleteReason('');
      } else {
        alert(`Failed to submit delete request: ${result.error || 'Unknown error occurred'}`);
      }
    } catch (error) {
      console.error('Error submitting delete request:', error);
      if (error instanceof TypeError && error.message.includes('fetch')) {
        alert('Network error: Unable to connect to server. Please check your connection.');
      } else {
        alert('Failed to submit delete request. Please try again.');
      }
    }
  };

  // Save edited sale
  const saveEditedSale = async () => {
    if (!editingSale) return;

    try {
      // Validate edit form
      if (!editForm.payment_method) {
        alert('Payment method is required');
        return;
      }

      if (!editForm.reason.trim()) {
        alert('Reason for edit is required');
        return;
      }

      // Validate quantities
      if (editForm.boxes_quantity <= 0 && editForm.kg_quantity <= 0) {
        alert('At least one quantity (boxes or kg) must be greater than 0');
        return;
      }

      // Prepare update data with proper typing and validation including reason
      const updateData = {
        boxes_quantity: editForm.boxes_quantity,
        kg_quantity: editForm.kg_quantity,
        payment_method: editForm.payment_method as 'momo_pay' | 'cash' | 'bank_transfer',
        reason: editForm.reason.trim(), // Include reason for audit
      };

      console.log('Sending update data:', updateData); // Debug log

      // Use the inventory service for proper error handling and authentication
      const result = await inventoryService.updateSale(editingSale.id, updateData);

      if (result.success) {
        alert('Edit request submitted successfully! Changes will be applied after admin approval.');
        refetchSales();
        refetchAudits(); // Refresh audits to show new request
        setIsEditModalOpen(false);
        setEditingSale(null);
        // Reset edit form
        setEditForm({
          boxes_quantity: 0,
          kg_quantity: 0,
          payment_method: '',
          reason: '',
        });
      } else {
        console.error('Sale update failed:', result);
        alert(`Failed to submit edit request: ${result.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      console.error('Error updating sale:', error);

      // Try to extract more specific error information
      let errorMessage = 'Failed to update sale. Please try again.';
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.details?.validationErrors) {
        const validationErrors = error.response.data.details.validationErrors;
        errorMessage = `Validation errors: ${validationErrors.map((e: any) => `${e.field}: ${e.message}`).join(', ')}`;
      } else if (error.message) {
        errorMessage = error.message;
      }

      alert(errorMessage);
    }
  };



  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Sales & Distribution</h1>
          <p className="text-muted-foreground">Manage sales transactions and customer relationships</p>
        </div>

        {/* Sales Management Tabs */}
        <Tabs defaultValue="manage-sales" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="add-sale">
              <Plus className="mr-2 h-4 w-4" />
              Add Sale
            </TabsTrigger>
            <TabsTrigger value="manage-sales">
              <ShoppingCart className="mr-2 h-4 w-4" />
              Manage Sales
            </TabsTrigger>
            <TabsTrigger value="audit-sales">
              <FileText className="mr-2 h-4 w-4" />
              Audit Sales
            </TabsTrigger>
          </TabsList>

          <TabsContent value="add-sale" className="space-y-3">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-lg p-3 border border-blue-100 dark:border-blue-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-600 dark:bg-blue-500 rounded-md">
                  <Plus className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">🐟 Fish Sales (Smart Algorithm)</h2>
                  <p className="text-xs text-gray-600 dark:text-gray-300">Customer requests kg, system automatically handles box conversion</p>
                </div>
              </div>
            </div>

            {/* Product Information Card */}
            <Card className="border-0 shadow-md bg-white dark:bg-gray-800">
              <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 rounded-t-lg border-b border-emerald-100 dark:border-emerald-800 p-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-emerald-600 dark:bg-emerald-500 rounded-md">
                    <Fish className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-base text-emerald-900 dark:text-emerald-100">Product & Quantity</CardTitle>
                    <p className="text-xs text-emerald-700 dark:text-emerald-300">Select fish type and enter requested kg amount</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-3">
                <div className="space-y-3">
                  {/* Fish Product Selection */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                      <Fish className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                      Fish Product
                    </Label>
                    <Select value={fishSaleForm.product_id} onValueChange={(value) => setFishSaleForm({...fishSaleForm, product_id: value})}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select fish type" />
                      </SelectTrigger>
                      <SelectContent>
                        {productsLoading ? (
                          <SelectItem value="loading" disabled>Loading products...</SelectItem>
                        ) : products.length === 0 ? (
                          <SelectItem value="no-products" disabled>No products available</SelectItem>
                        ) : (
                          products.map((product) => (
                            <SelectItem key={product.product_id} value={product.product_id}>
                              {product.name} - {formatCurrency(product.price_per_kg)}/kg
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    {selectedFishProduct && (
                      <div className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-2 rounded">
                        <div className="grid grid-cols-2 gap-2">
                          <div>📦 Stock: {selectedFishProduct.quantity_box} boxes, {selectedFishProduct.quantity_kg} kg</div>
                          <div>⚖️ Box ratio: {selectedFishProduct.box_to_kg_ratio} kg/box</div>
                          <div>💰 Price: {formatCurrency(selectedFishProduct.price_per_kg)}/kg</div>
                          <div>📊 Total available: {(selectedFishProduct.quantity_kg + (selectedFishProduct.quantity_box * selectedFishProduct.box_to_kg_ratio)).toFixed(1)} kg</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Requested Kg Quantity */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                      <Scale className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                      Requested Kg Amount
                    </Label>
                    <div className="relative">
                      <Input
                        placeholder="0.0"
                        type="number"
                        min="0.1"
                        step="0.1"
                        value={fishSaleForm.requested_kg || ''}
                        onChange={(e) => setFishSaleForm({...fishSaleForm, requested_kg: parseFloat(e.target.value) || 0})}
                        className="pl-3 pr-8 py-2.5"
                      />
                      <div className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 text-xs">
                        kg
                      </div>
                    </div>
                    {selectedFishProduct && fishSaleForm.requested_kg > 0 && (
                      <div className="text-xs space-y-1">
                        <div className="text-green-600 dark:text-green-400">
                          💰 Total: {formatCurrency(calculateFishSaleTotal())}
                        </div>
                        {fishSaleForm.requested_kg > (selectedFishProduct.quantity_kg + (selectedFishProduct.quantity_box * selectedFishProduct.box_to_kg_ratio)) && (
                          <div className="text-red-600 dark:text-red-400">
                            ⚠️ Insufficient stock! Available: {(selectedFishProduct.quantity_kg + (selectedFishProduct.quantity_box * selectedFishProduct.box_to_kg_ratio)).toFixed(1)} kg
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Requested Box Quantity */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                      <Package className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                      Requested Box Amount
                    </Label>
                    <div className="relative">
                      <Input
                        placeholder="0"
                        type="number"
                        min="0"
                        step="1"
                        value={fishSaleForm.requested_boxes || ''}
                        onChange={(e) => setFishSaleForm({...fishSaleForm, requested_boxes: parseInt(e.target.value) || 0})}
                        className="pl-3 pr-12 py-2.5"
                      />
                      <div className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 text-xs">
                        boxes
                      </div>
                    </div>
                    {selectedFishProduct && fishSaleForm.requested_boxes > 0 && (
                      <div className="text-xs space-y-1">
                        <div className="text-blue-600 dark:text-blue-400">
                          📦 Equivalent: {(fishSaleForm.requested_boxes * selectedFishProduct.box_to_kg_ratio).toFixed(1)} kg
                        </div>
                        <div className="text-green-600 dark:text-green-400">
                          💰 Box Total: {formatCurrency(fishSaleForm.requested_boxes * selectedFishProduct.price_per_box)}
                        </div>
                        {fishSaleForm.requested_boxes > selectedFishProduct.quantity_box && (
                          <div className="text-red-600 dark:text-red-400">
                            ⚠️ Insufficient box stock! Available: {selectedFishProduct.quantity_box} boxes
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                </div>
              </CardContent>
            </Card>

            {/* Algorithm Preview Card */}
            {selectedFishProduct && (fishSaleForm.requested_kg > 0 || fishSaleForm.requested_boxes > 0) && (
              <Card className="border-0 shadow-md bg-white dark:bg-gray-800">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 rounded-t-lg border-b border-purple-100 dark:border-purple-800 p-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-purple-600 dark:bg-purple-500 rounded-md">
                      <Package className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-base text-purple-900 dark:text-purple-100">🧠 Algorithm Preview</CardTitle>
                      <p className="text-xs text-purple-700 dark:text-purple-300">How the system will fulfill this order</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-3">
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="space-y-2">
                        {fishSaleForm.requested_kg > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Requested kg:</span>
                            <span className="font-medium">{fishSaleForm.requested_kg} kg</span>
                          </div>
                        )}
                        {fishSaleForm.requested_boxes > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Requested boxes:</span>
                            <span className="font-medium">{fishSaleForm.requested_boxes} boxes</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Available loose kg:</span>
                          <span className="font-medium">{selectedFishProduct.quantity_kg} kg</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Available boxes:</span>
                          <span className="font-medium">{selectedFishProduct.quantity_box} boxes</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Total available:</span>
                          <span className="font-medium">{(selectedFishProduct.quantity_kg + (selectedFishProduct.quantity_box * selectedFishProduct.box_to_kg_ratio)).toFixed(1)} kg</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Price per kg:</span>
                          <span className="font-medium">{formatCurrency(selectedFishProduct.price_per_kg)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Price per box:</span>
                          <span className="font-medium">{formatCurrency(selectedFishProduct.price_per_box)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-green-600 dark:text-green-400 font-medium">Total amount:</span>
                          <span className="font-bold text-green-600 dark:text-green-400">{formatCurrency(calculateFishSaleTotal())}</span>
                        </div>
                      </div>
                    </div>

                    {/* Algorithm Steps Preview */}
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">🔄 Algorithm Steps:</h4>
                      <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                        {/* Box requests */}
                        {fishSaleForm.requested_boxes > 0 && (
                          <div>📦 Use {fishSaleForm.requested_boxes} box(es) directly</div>
                        )}

                        {/* Kg requests */}
                        {fishSaleForm.requested_kg > 0 && (
                          <>
                            {fishSaleForm.requested_kg <= selectedFishProduct.quantity_kg ? (
                              <div>⚖️ Use {fishSaleForm.requested_kg}kg from loose stock</div>
                            ) : (
                              <>
                                <div>⚖️ Use {selectedFishProduct.quantity_kg}kg from loose stock</div>
                                <div>📦➡️⚖️ Convert {Math.ceil((fishSaleForm.requested_kg - selectedFishProduct.quantity_kg) / selectedFishProduct.box_to_kg_ratio)} box(es) to get remaining {(fishSaleForm.requested_kg - selectedFishProduct.quantity_kg).toFixed(1)}kg</div>
                              </>
                            )}
                          </>
                        )}

                        {/* Show if no requests */}
                        {fishSaleForm.requested_kg === 0 && fishSaleForm.requested_boxes === 0 && (
                          <div className="text-gray-400">Enter kg or box quantity to see algorithm steps</div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}



            {/* Payment Information */}
            <div className={`grid grid-cols-1 ${(saleForm.payment_status === 'pending' || saleForm.payment_status === 'partial') ? 'lg:grid-cols-2' : ''} gap-3`}>
              {/* Payment Information Card - Always show first */}
              <Card className="border-0 shadow-md bg-white dark:bg-gray-800">
                <CardHeader className="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950 dark:to-purple-950 rounded-t-lg border-b border-violet-100 dark:border-violet-800 p-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-violet-600 dark:bg-violet-500 rounded-md">
                      <CreditCard className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-base text-violet-900 dark:text-violet-100">Payment Information</CardTitle>
                      <p className="text-xs text-violet-700 dark:text-violet-300">Set payment method and status</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-3 space-y-3">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                      <CreditCard className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
                      Payment Method
                    </Label>
                    <Select value={fishSaleForm.payment_method} onValueChange={(value) => setFishSaleForm({...fishSaleForm, payment_method: value as '' | 'momo_pay' | 'cash' | 'bank_transfer'})}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Choose payment method..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="momo_pay">📱 Mobile Money Payment</SelectItem>
                        <SelectItem value="cash">� Cash Payment</SelectItem>

                        <SelectItem value="bank_transfer">🏦 Bank Transfer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                      <CheckCircle className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
                      Payment Status
                    </Label>
                    <Select value={fishSaleForm.payment_status} onValueChange={(value: 'paid' | 'pending' | 'partial') => {
                      // Clear client info when switching to paid (since it's not needed)
                      const updatedForm = { ...fishSaleForm, payment_status: value };
                      if (value === 'paid') {
                        updatedForm.client_name = '';
                        updatedForm.email_address = '';
                        updatedForm.phone = '';
                      }
                      setFishSaleForm(updatedForm);
                    }}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Choose payment status..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">⏳ Pending (requires client info)</SelectItem>
                        <SelectItem value="paid">✅ Paid (no client info needed)</SelectItem>
                        <SelectItem value="partial">⚠️ Partial Payment (requires client info)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Amount Paid - Only show for partial payments */}
                  {saleForm.payment_status === 'partial' && (
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                        <DollarSign className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                        Amount Paid
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={fishSaleForm.amount_paid}
                        onChange={(e) => setFishSaleForm({...fishSaleForm, amount_paid: parseFloat(e.target.value) || 0})}
                        placeholder="Enter amount already paid"
                        className="w-full"
                      />
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Total Amount: {formatCurrency(calculateFishSaleTotal())} |
                        Remaining: {formatCurrency(Math.max(0, calculateFishSaleTotal() - fishSaleForm.amount_paid))}
                      </div>
                    </div>
                  )}

                  {/* Payment Status Indicator */}
                  <div className="mt-3 p-2 bg-violet-50 dark:bg-violet-950 rounded-md border border-violet-200 dark:border-violet-800">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 bg-violet-500 dark:bg-violet-400 rounded-full"></div>
                      <span className="text-xs font-medium text-violet-800 dark:text-violet-200">
                        {fishSaleForm.payment_status === 'paid'
                          ? 'Payment is complete - no client information required'
                          : fishSaleForm.payment_status === 'partial'
                          ? 'Partial payment - client information required for follow-up'
                          : 'Payment pending - client information required for tracking'
                        }
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Client Information Card - Only show for pending/partial payments, not for paid */}
              {(fishSaleForm.payment_status === 'pending' || fishSaleForm.payment_status === 'partial') && (
                <Card className="border-0 shadow-md bg-white dark:bg-gray-800">
                  <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950 dark:to-amber-950 rounded-t-lg border-b border-orange-100 dark:border-orange-800 p-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-orange-600 dark:bg-orange-500 rounded-md">
                        <Truck className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-base text-orange-900 dark:text-orange-100">Client Information</CardTitle>
                        <p className="text-xs text-orange-700 dark:text-orange-300">Required for pending/partial payments (not needed for paid)</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 space-y-3">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Client Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        placeholder="Enter client name..."
                        value={fishSaleForm.client_name}
                        onChange={(e) => setFishSaleForm({...fishSaleForm, client_name: e.target.value})}
                        className="w-full"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Email Address
                      </Label>
                      <Input
                        type="email"
                        placeholder="client@example.com"
                        value={fishSaleForm.email_address}
                        onChange={(e) => setFishSaleForm({...fishSaleForm, email_address: e.target.value})}
                        className="w-full"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Phone Number
                      </Label>
                      <Input
                        placeholder="+1 (555) 123-4567"
                        value={fishSaleForm.phone}
                        onChange={(e) => setFishSaleForm({...fishSaleForm, phone: e.target.value})}
                        className="w-full"
                      />
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Action Buttons */}
            <Card className="border-0 shadow-md bg-white dark:bg-gray-800">
              <CardContent className="p-3">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
                  <div className="text-left">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100 text-sm">🐟 Ready to create this fish sale?</h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Using smart algorithm - system will handle box conversion automatically</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFishSaleForm({
                          product_id: '',
                          requested_kg: 0,
                          requested_boxes: 0,
                          amount_paid: 0,
                          client_name: '',
                          email_address: '',
                          phone: '',
                          payment_method: '',
                          payment_status: 'paid'
                        });
                      }}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-200 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 text-sm"
                    >
                      Clear Form
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSubmitFishSale}
                      disabled={isSubmitting || !fishSaleForm.product_id || (!fishSaleForm.requested_kg && !fishSaleForm.requested_boxes) || !fishSaleForm.payment_method}
                      className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 dark:from-blue-500 dark:to-indigo-500 dark:hover:from-blue-600 dark:hover:to-indigo-600 text-white font-medium rounded-md shadow-md hover:shadow-lg transition-all duration-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white mr-1.5"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <Fish className="mr-1.5 h-3.5 w-3.5" />
                          Create Fish Sale
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="manage-sales" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                  <div>
                    <CardTitle>Manage Sales</CardTitle>
                    <p className="text-sm text-muted-foreground">View and manage all sales transactions</p>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative w-full sm:w-64">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search sales..."
                        className="pl-10 w-full"
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={refetchSales}
                      disabled={salesLoading}
                      className="flex items-center gap-2"
                    >
                      {salesLoading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                      ) : (
                        <ShoppingCart className="h-4 w-4" />
                      )}
                      Refresh
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-2 text-sm font-medium">Product</th>
                        <th className="text-left py-3 px-2 text-sm font-medium">Quantity</th>
                        <th className="text-left py-3 px-2 text-sm font-medium">Price</th>
                        <th className="text-left py-3 px-2 text-sm font-medium" title="Total profit for this sale (selling price - cost price) × quantity">Profit</th>
                        <th className="text-left py-3 px-2 text-sm font-medium">Total Amount</th>
                        <th className="text-left py-3 px-2 text-sm font-medium">Status</th>
                        <th className="text-left py-3 px-2 text-sm font-medium">Payment Method</th>
                        <th className="text-left py-3 px-2 text-sm font-medium">Time</th>
                        <th className="text-left py-3 px-2 text-sm font-medium">Performed By</th>
                        <th className="text-right py-3 px-2 text-sm font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {salesLoading ? (
                        <tr>
                          <td colSpan={10} className="py-8 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                              Loading sales...
                            </div>
                          </td>
                        </tr>
                      ) : salesError ? (
                        <tr>
                          <td colSpan={10} className="py-8 text-center text-red-600">
                            Error loading sales: {salesError}
                          </td>
                        </tr>
                      ) : sales.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="py-8 text-center text-gray-500">
                            No sales found
                          </td>
                        </tr>
                      ) : (
                        sales.map((sale) => (
                          <tr key={sale.id} className="border-b hover:bg-muted/50">
                            <td className="py-3 px-2">
                              <div>
                                <button
                                  className="font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer text-left"
                                  onClick={() => handleViewSaleDetails(sale)}
                                  title="Click to view sale details"
                                >
                                  {sale.products?.name || 'Unknown Product'}
                                </button>
                                {sale.products?.product_categories && (
                                  <p className="text-xs text-muted-foreground">
                                    {sale.products.product_categories.name}
                                  </p>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-2">{formatQuantity(sale)}</td>
                            <td className="py-3 px-2 text-sm">{formatPrice(sale)}</td>
                            <td className="py-3 px-2 text-sm text-green-600 font-medium">{formatProfit(sale)}</td>
                            <td className="py-3 px-2 font-medium">${sale.total_amount.toFixed(2)}</td>
                            <td className="py-3 px-2">
                              <Badge className={getPaymentStatusColor(sale.payment_status)}>
                                {sale.payment_status.charAt(0).toUpperCase() + sale.payment_status.slice(1)}
                              </Badge>
                            </td>
                            <td className="py-3 px-2">
                              <Badge className={getPaymentMethodColor(sale.payment_method || '')} variant="outline">
                                {formatPaymentMethod(sale.payment_method || '')}
                              </Badge>
                            </td>
                            <td className="py-3 px-2 text-sm">
                              {new Date(sale.date_time).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: true
                              })}
                            </td>
                            <td className="py-3 px-2 text-sm">
                              {sale.users?.owner_name || 'Unknown User'}
                            </td>
                            <td className="py-3 px-2">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  title="View Details"
                                  onClick={() => handleViewSaleDetails(sale)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  title="Edit Sale"
                                  onClick={() => handleEditSale(sale)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  title="Delete Sale"
                                  onClick={() => handleDeleteSale(sale)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audit-sales" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Sales Audit Trail</CardTitle>
                <p className="text-sm text-muted-foreground">Track all sales activities and modifications</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Search Bar */}
                  <div className="flex justify-center">
                    <div className="relative w-full max-w-md">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search audit logs..."
                        className="pl-10 w-full"
                        disabled
                      />
                    </div>
                  </div>

                  {/* Audit Log Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-2 text-sm font-medium">Timestamp</th>
                          <th className="text-left py-3 px-2 text-sm font-medium">Product</th>
                          <th className="text-left py-3 px-2 text-sm font-medium">Action Type</th>
                          <th className="text-left py-3 px-2 text-sm font-medium">Changed Details</th>
                          <th className="text-left py-3 px-2 text-sm font-medium">Reason</th>
                          <th className="text-left py-3 px-2 text-sm font-medium">Performed By</th>
                          <th className="text-left py-3 px-2 text-sm font-medium">Status</th>
                          <th className="text-right py-3 px-2 text-sm font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {auditsLoading ? (
                          <tr>
                            <td colSpan={8} className="py-8 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                <span className="text-gray-500">Loading audit records...</span>
                              </div>
                            </td>
                          </tr>
                        ) : auditsError ? (
                          <tr>
                            <td colSpan={8} className="py-8 text-center">
                              <div className="text-red-500">
                                <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                                <p>Error loading audit records: {auditsError}</p>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={refetchAudits}
                                  className="mt-2"
                                >
                                  Try Again
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ) : audits.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="py-8 text-center text-gray-500">
                              No audit records found
                            </td>
                          </tr>
                        ) : (
                          audits.map((audit) => (
                            <tr key={audit.audit_id} className="border-b hover:bg-muted/50">
                              <td className="py-3 px-2 text-sm">{formatTimestamp(audit.timestamp)}</td>
                              <td className="py-3 px-2 font-medium">
                                {audit.product_info?.name || 'Unknown Product'}
                                {audit.sale_id === null && (
                                  <span className="ml-2 text-xs text-red-600 bg-red-100 px-1 py-0.5 rounded">
                                    DELETED
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-2">
                                <Badge className={getAuditTypeBadgeColor(audit.audit_type)}>
                                  {formatAuditType(audit.audit_type)}
                                </Badge>
                              </td>
                              <td className="py-3 px-2 text-sm">{formatChangedDetails(audit)}</td>
                              <td className="py-3 px-2 text-sm max-w-xs truncate" title={audit.reason}>
                                {audit.reason}
                              </td>
                              <td className="py-3 px-2">
                                {audit.performed_by_user?.owner_name || audit.users?.owner_name || 'Unknown User'}
                              </td>
                              <td className="py-3 px-2">
                                <Badge className={getApprovalStatusBadgeColor(audit.approval_status)}>
                                  {audit.approval_status.charAt(0).toUpperCase() + audit.approval_status.slice(1)}
                                </Badge>
                              </td>
                              <td className="py-3 px-2">
                                <div className="flex justify-end gap-2">
                                  {audit.approval_status === 'pending' ? (
                                    <>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        title="Approve"
                                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                        onClick={() => handleAuditApprove(audit)}
                                      >
                                        <Check className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        title="Reject"
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                        onClick={() => handleAuditReject(audit)}
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                    </>
                                  ) : (
                                    <span className="text-sm text-gray-500">
                                      {audit.approval_status === 'approved' ? 'Approved' : 'Rejected'} by {audit.approved_by_user?.owner_name || 'Unknown'}
                                    </span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Delete Confirmation Modal */}
        {isDeleteModalOpen && deletingSale && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-100 dark:bg-red-900 rounded-full">
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-lg font-semibold">Confirm Delete Sale</h3>
              </div>

              <div className="mb-6">
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  This will submit a delete request for admin approval. Please provide a reason for deletion.
                </p>

                {/* Sale Details */}
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Sale ID:</span>
                    <span className="text-sm font-medium">#{deletingSale.id.slice(-8)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Product:</span>
                    <span className="text-sm font-medium">{deletingSale.products?.name || 'Unknown Product'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Quantity:</span>
                    <span className="text-sm font-medium">{formatQuantity(deletingSale)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Total Amount:</span>
                    <span className="text-sm font-medium">${deletingSale.total_amount.toFixed(2)}</span>
                  </div>
                </div>

                {/* Reason for deletion */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">
                    Reason for Deletion *
                  </label>
                  <textarea
                    value={deleteReason}
                    onChange={(e) => setDeleteReason(e.target.value)}
                    placeholder="Enter reason for deleting this sale..."
                    className="w-full p-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-600"
                    rows={3}
                  />
                </div>

                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Note:</strong> Stock quantities ({deletingSale.boxes_quantity} boxes, {deletingSale.kg_quantity} kg)
                    will be restored after admin approval.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setDeletingSale(null);
                    setDeleteReason('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={confirmDeleteSale}
                  disabled={!deleteReason.trim()}
                >
                  Submit Delete Request
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Sale Modal */}
        {isEditModalOpen && editingSale && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Edit Sale</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">#{editingSale.id.slice(-8)}</p>
                </div>
                <button
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingSale(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-4 space-y-4">
                {/* Sale Summary */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {editingSale.products?.name || 'Unknown Product'}
                    </h4>
                    <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                      {formatCurrency(editingSale.total_amount)}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {formatQuantity(editingSale)} • {new Date(editingSale.date_time).toLocaleDateString()}
                  </div>
                </div>

                {/* Editable Fields */}
                <div className="space-y-4">
                  {/* Quantity Editing */}
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Quantities</label>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Boxes</label>
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          value={editForm.boxes_quantity}
                          onChange={(e) => setEditForm({...editForm, boxes_quantity: parseInt(e.target.value) || 0})}
                          className="text-sm"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Kilograms</label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={editForm.kg_quantity}
                          onChange={(e) => setEditForm({...editForm, kg_quantity: parseFloat(e.target.value) || 0})}
                          className="text-sm"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  </div>



                  {/* Payment Method */}
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Payment Method</label>
                    <Select value={editForm.payment_method} onValueChange={(value) => setEditForm({...editForm, payment_method: value as any})}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4" />
                            Cash
                          </div>
                        </SelectItem>
                        <SelectItem value="momo_pay">
                          <div className="flex items-center gap-2">
                            <CreditCard className="w-4 h-4" />
                            Mobile Money
                          </div>
                        </SelectItem>
                        <SelectItem value="bank_transfer">
                          <div className="flex items-center gap-2">
                            <Truck className="w-4 h-4" />
                            Bank Transfer
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>





                  {/* Reason for Edit - Required */}
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                      Reason for Edit <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={editForm.reason}
                      onChange={(e) => setEditForm({...editForm, reason: e.target.value})}
                      placeholder="Please provide a reason for this edit..."
                      className="w-full p-3 text-sm border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      rows={2}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex gap-2 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingSale(null);
                  }}
                  className="flex-1 text-sm"
                  size="sm"
                >
                  Cancel
                </Button>
                <Button
                  onClick={saveEditedSale}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm"
                  size="sm"
                  disabled={!editForm.reason.trim()}
                >
                  <Check className="w-4 h-4 mr-1" />
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Audit Approval/Rejection Modal */}
        {auditAction.isModalOpen && auditAction.audit && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">
                {auditAction.type === 'approve' ? 'Approve' : 'Reject'} Audit Record
              </h3>

              <div className="mb-4">
                <p className="text-gray-600 dark:text-gray-300 mb-2">
                  Are you sure you want to {auditAction.type} this audit record?
                </p>
                {auditAction.type === 'reject' && (
                  <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md p-3 mb-4">
                    <p className="text-sm text-red-800 dark:text-red-200">
                      <strong>Note:</strong> Rejecting this audit will revert the changes made to the sale record.
                      {auditAction.audit?.audit_type === 'deletion' && ' The sale will be restored if it was marked for deletion.'}
                    </p>
                  </div>
                )}

                {/* Audit Details */}
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Sale ID:</span>
                    <span className="text-sm font-medium">
                      {auditAction.audit.sale_id
                        ? `#${auditAction.audit.sale_id.slice(-8)}`
                        : 'DELETED SALE'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Action:</span>
                    <span className="text-sm font-medium">{formatAuditType(auditAction.audit.audit_type)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Performed By:</span>
                    <span className="text-sm font-medium">{auditAction.audit.performed_by_user?.owner_name || 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Reason:</span>
                    <span className="text-sm font-medium">{auditAction.audit.reason}</span>
                  </div>
                </div>

                {/* Approval/Rejection Reason */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {auditAction.type === 'approve' ? 'Approval' : 'Rejection'} Reason *
                  </label>
                  <textarea
                    value={auditAction.reason}
                    onChange={(e) => setAuditAction({...auditAction, reason: e.target.value})}
                    placeholder={`Enter reason for ${auditAction.type}...`}
                    className="w-full p-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-600"
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setAuditAction({
                    audit: null,
                    type: null,
                    reason: '',
                    isModalOpen: false,
                  })}
                >
                  Cancel
                </Button>
                <Button
                  variant={auditAction.type === 'approve' ? 'default' : 'destructive'}
                  onClick={confirmAuditAction}
                  disabled={!auditAction.reason.trim()}
                >
                  {auditAction.type === 'approve' ? 'Approve' : 'Reject'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Sale Details Popup */}
        {isSaleDetailsPopupOpen && selectedSale && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setIsSaleDetailsPopupOpen(false);
              }
            }}
          >
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-sm sm:max-w-md w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                    Sale Details
                  </h2>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    #{selectedSale.id.slice(-8)}
                  </p>
                </div>
                <button
                  onClick={() => setIsSaleDetailsPopupOpen(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Content */}
              <div className="p-3 space-y-3">
                {/* Product & Sale Summary */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2.5">
                  <div className="flex items-start justify-between mb-1.5">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate">
                        {selectedSale.products?.name || 'Unknown Product'}
                      </h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                        {selectedSale.products?.product_categories?.name || 'N/A'}
                      </p>
                    </div>
                    <div className="text-right ml-2">
                      <p className="text-base font-bold text-green-600 dark:text-green-400">
                        {formatCurrency(selectedSale.total_amount)}
                      </p>
                      <Badge className={`${getPaymentStatusColor(selectedSale.payment_status)} text-xs`}>
                        {selectedSale.payment_status.charAt(0).toUpperCase() + selectedSale.payment_status.slice(1)}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Qty:</span>
                      <p className="font-medium text-gray-900 dark:text-gray-100 text-xs">
                        {formatQuantity(selectedSale)}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Price:</span>
                      <p className="font-medium text-gray-900 dark:text-gray-100 text-xs">
                        {formatPrice(selectedSale)}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Profit:</span>
                      <p className="font-medium text-green-600 dark:text-green-400 text-xs">
                        {formatProfit(selectedSale)}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Total:</span>
                      <p className="font-medium text-gray-900 dark:text-gray-100 text-xs">
                        {formatCurrency(selectedSale.total_amount)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Profit Breakdown */}
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-2.5">
                  <h4 className="text-xs font-medium text-gray-900 dark:text-gray-100 mb-1.5 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-green-600 dark:text-green-400" />
                    Profit Breakdown
                  </h4>
                  <div className="space-y-1 text-xs">
                    {selectedSale.boxes_quantity > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">
                          Boxes ({selectedSale.boxes_quantity} × {formatCurrency(selectedSale.profit_per_box || 0)}):
                        </span>
                        <span className="text-green-600 dark:text-green-400 font-medium">
                          {formatCurrency((selectedSale.boxes_quantity * (selectedSale.profit_per_box || 0)))}
                        </span>
                      </div>
                    )}
                    {selectedSale.kg_quantity > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">
                          Kg ({selectedSale.kg_quantity} × {formatCurrency(selectedSale.profit_per_kg || 0)}):
                        </span>
                        <span className="text-green-600 dark:text-green-400 font-medium">
                          {formatCurrency((selectedSale.kg_quantity * (selectedSale.profit_per_kg || 0)))}
                        </span>
                      </div>
                    )}
                    <div className="border-t border-green-200 dark:border-green-700 pt-1 mt-1">
                      <div className="flex justify-between">
                        <span className="text-gray-900 dark:text-gray-100 font-medium">Total Profit:</span>
                        <span className="text-green-600 dark:text-green-400 font-bold">
                          {formatProfit(selectedSale)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Information */}
                {(selectedSale.remaining_amount > 0 || (selectedSale.amount_paid > 0 && selectedSale.amount_paid !== selectedSale.total_amount)) && (
                  <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-2.5">
                    <h4 className="text-xs font-medium text-gray-900 dark:text-gray-100 mb-1.5 flex items-center gap-1">
                      <DollarSign className="h-3 w-3 text-orange-600 dark:text-orange-400" />
                      Payment Details
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Paid:</span>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {formatCurrency(selectedSale.amount_paid || 0)}
                        </p>
                      </div>
                      {selectedSale.remaining_amount > 0 && (
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Remaining:</span>
                          <p className="font-medium text-orange-600 dark:text-orange-400">
                            {formatCurrency(selectedSale.remaining_amount)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Payment Method & Client */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2.5">
                  <div className="flex items-center justify-between mb-1.5">
                    <h4 className="text-xs font-medium text-gray-900 dark:text-gray-100">
                      Payment & Client
                    </h4>
                    <Badge className={`${getPaymentMethodColor(selectedSale.payment_method || '')} text-xs`} variant="outline">
                      {formatPaymentMethod(selectedSale.payment_method || '')}
                    </Badge>
                  </div>

                  {(selectedSale.client_name || selectedSale.email_address || selectedSale.phone) && (
                    <div className="space-y-1 text-xs">
                      {selectedSale.client_name && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Client:</span>
                          <span className="text-gray-900 dark:text-gray-100 font-medium">
                            {selectedSale.client_name}
                          </span>
                        </div>
                      )}
                      {selectedSale.email_address && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Email:</span>
                          <span className="text-gray-900 dark:text-gray-100 text-right break-all">
                            {selectedSale.email_address}
                          </span>
                        </div>
                      )}
                      {selectedSale.phone && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Phone:</span>
                          <span className="text-gray-900 dark:text-gray-100">
                            {selectedSale.phone}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Sale Information */}
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-2.5">
                  <h4 className="text-xs font-medium text-gray-900 dark:text-gray-100 mb-1.5 flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                    Sale Info
                  </h4>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Date & Time:</span>
                      <span className="text-gray-900 dark:text-gray-100 font-medium text-right">
                        {new Date(selectedSale.date_time).toLocaleDateString()} at {new Date(selectedSale.date_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Sold by:</span>
                      <span className="text-gray-900 dark:text-gray-100 font-medium">
                        {selectedSale.users?.owner_name || 'Unknown User'}
                      </span>
                    </div>
                    {selectedSale.users?.business_name && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Business:</span>
                        <span className="text-gray-900 dark:text-gray-100 text-right">
                          {selectedSale.users.business_name}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex gap-2 p-3 border-t border-gray-200 dark:border-gray-700">
                <Button
                  variant="outline"
                  onClick={() => setIsSaleDetailsPopupOpen(false)}
                  className="flex-1 text-sm"
                  size="sm"
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    setIsSaleDetailsPopupOpen(false);
                    handleEditSale(selectedSale);
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm"
                  size="sm"
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Sales;
