import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Scale, Edit, Eye, Plus, FileText, ShoppingCart, Package, Fish, Calculator, Truck, CreditCard, Calendar, MapPin, DollarSign, Hash, AlertTriangle, CheckCircle, Box, Trash2, X, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "react-i18next";
import { usePageTitle } from "@/hooks/use-page-title";
import { useState, useEffect } from "react";
import { inventoryService, SaleRequest, InventoryPreview } from "@/lib/api/services/inventory";
import { useProducts } from "@/hooks/use-products";
import { useSales } from "@/hooks/use-sales";
import { useAudits, type AuditRecord } from "@/hooks/use-audits";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const Sales = () => {
  const { t } = useTranslation();
  usePageTitle('navigation.sales', 'Sales');

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

  // Sale form state
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

  // Edit form state
  const [editForm, setEditForm] = useState({
    boxes_quantity: 0,
    kg_quantity: 0,
    payment_status: 'pending' as 'paid' | 'pending' | 'partial',
    payment_method: '' as 'momo_pay' | 'cash' | 'bank_transfer' | '',
    amount_paid: 0,
    client_name: '',
    email_address: '',
    phone: '',
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

  // Calculate total amount when quantities or prices change
  const calculateTotal = () => {
    return (saleForm.boxes_quantity * saleForm.box_price) + (saleForm.kg_quantity * saleForm.kg_price);
  };

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

  // Auto-populate prices when product is selected
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
      parts.push(`$${sale.box_price}/box`);
    }
    if (sale.kg_quantity > 0 && sale.kg_price > 0) {
      parts.push(`$${sale.kg_price}/kg`);
    }
    return parts.join(', ') || 'N/A';
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
      case 'payment_update': return 'Payment Update';
      case 'deletion': return 'Deletion';
      default: return type;
    }
  };

  const getAuditTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'quantity_change': return 'bg-blue-100 text-blue-800';
      case 'payment_update': return 'bg-purple-100 text-purple-800';
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
    } else if (audit.audit_type === 'payment_update') {
      if (audit.old_values && audit.new_values) {
        const oldStatus = audit.old_values.payment_status;
        const newStatus = audit.new_values.payment_status;
        if (oldStatus !== newStatus) {
          details.push(`${oldStatus} → ${newStatus}`);
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
      payment_status: sale.payment_status || 'pending',
      payment_method: sale.payment_method || '',
      amount_paid: sale.amount_paid || 0,
      client_name: sale.client_name || '',
      email_address: sale.email_address || '',
      phone: sale.phone || '',
      reason: '', // Reset reason for new edit
    });
    setIsEditModalOpen(true);
  };

  // Handle delete sale
  const handleDeleteSale = (sale: any) => {
    setDeletingSale(sale);
    setIsDeleteModalOpen(true);
  };

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

      // For pending/partial payments, client details are required
      if ((editForm.payment_status === 'pending' || editForm.payment_status === 'partial') &&
          !editForm.client_name) {
        alert('Client name is required for pending/partial payments');
        return;
      }

      // Prepare update data with proper typing and validation including reason
      const updateData = {
        boxes_quantity: editForm.boxes_quantity,
        kg_quantity: editForm.kg_quantity,
        payment_status: editForm.payment_status,
        payment_method: editForm.payment_method as 'momo_pay' | 'cash' | 'bank_transfer',
        amount_paid: editForm.amount_paid,
        reason: editForm.reason.trim(), // Include reason for audit
        // Only include client details if they have values
        ...(editForm.client_name && { client_name: editForm.client_name.trim() }),
        ...(editForm.email_address && { email_address: editForm.email_address.trim() }),
        ...(editForm.phone && { phone: editForm.phone.trim() }),
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
          payment_status: 'pending',
          payment_method: '',
          amount_paid: 0,
          client_name: '',
          email_address: '',
          phone: '',
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
                  <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">Create New Sale</h2>
                  <p className="text-xs text-gray-600 dark:text-gray-300">Add a new fish sales transaction</p>
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
                    <CardTitle className="text-base text-emerald-900 dark:text-emerald-100">Product Details</CardTitle>
                    <p className="text-xs text-emerald-700 dark:text-emerald-300">Select fish type and configure selling parameters</p>
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
                    <Select value={saleForm.product_id} onValueChange={(value) => setSaleForm({...saleForm, product_id: value})}>
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
                              {product.name} - ${product.price_per_kg.toFixed(2)}/kg, ${product.price_per_box.toFixed(2)}/box
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    {selectedProduct && (
                      <div className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-2 rounded">
                        <div className="grid grid-cols-2 gap-2">
                          <div>Stock: {selectedProduct.quantity_box} boxes, {selectedProduct.quantity_kg} kg</div>
                          <div>Box ratio: {selectedProduct.box_to_kg_ratio} kg/box</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Quantity Selection - Boxes and Kg */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Boxes Quantity */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                        <Box className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                        Boxes Quantity
                      </Label>
                      <div className="relative">
                        <Input
                          placeholder="0"
                          type="number"
                          min="0"
                          value={saleForm.boxes_quantity || ''}
                          onChange={(e) => setSaleForm({...saleForm, boxes_quantity: parseInt(e.target.value) || 0})}
                          className="pl-3 pr-12 py-2.5"
                        />
                        <div className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 text-xs">
                          boxes
                        </div>
                      </div>
                      {selectedProduct && saleForm.boxes_quantity > 0 && (
                        <div className="text-xs text-blue-600 dark:text-blue-400">
                          Available: {selectedProduct.quantity_box} boxes
                        </div>
                      )}
                    </div>

                    {/* Kg Quantity */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                        <Scale className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                        Kg Quantity
                      </Label>
                      <div className="relative">
                        <Input
                          placeholder="0.0"
                          type="number"
                          min="0"
                          step="0.1"
                          value={saleForm.kg_quantity || ''}
                          onChange={(e) => setSaleForm({...saleForm, kg_quantity: parseFloat(e.target.value) || 0})}
                          className="pl-3 pr-8 py-2.5"
                        />
                        <div className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 text-xs">
                          kg
                        </div>
                      </div>
                      {selectedProduct && saleForm.kg_quantity > 0 && (
                        <div className="text-xs text-green-600 dark:text-green-400">
                          Available: {selectedProduct.quantity_kg} kg
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Pricing Section */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Box Price */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                        <DollarSign className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                        Price per Box
                      </Label>
                      <div className="relative">
                        <Input
                          placeholder="0.00"
                          type="number"
                          value={saleForm.box_price || ''}
                          readOnly
                          className="pl-8 pr-3 py-2.5 bg-gray-50 dark:bg-gray-700 cursor-not-allowed"
                        />
                        <div className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 text-xs">
                          $
                        </div>
                      </div>
                      {selectedProduct && (
                        <div className="text-xs text-blue-600 dark:text-blue-400">
                          Suggested: ${selectedProduct.price_per_box}
                        </div>
                      )}
                    </div>

                    {/* KG Price */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                        <DollarSign className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                        Price per KG
                      </Label>
                      <div className="relative">
                        <Input
                          placeholder="0.00"
                          type="number"
                          value={saleForm.kg_price || ''}
                          readOnly
                          className="pl-8 pr-3 py-2.5 bg-gray-50 dark:bg-gray-700 cursor-not-allowed"
                        />
                        <div className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 text-xs">
                          $
                        </div>
                      </div>
                      {selectedProduct && (
                        <div className="text-xs text-green-600 dark:text-green-400">
                          Suggested: ${selectedProduct.price_per_kg}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Stock Display and Total Calculation */}
                {selectedProduct && (
                  <div className="mt-4 space-y-3">
                    {/* Current Stock Display */}
                    <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900 dark:to-indigo-900 rounded-md border border-blue-200 dark:border-blue-700">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Package className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <span className="font-medium text-blue-700 dark:text-blue-300 text-sm">Current Stock - {selectedProduct.name}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex justify-between">
                          <span className="text-blue-600 dark:text-blue-400">Boxes Available:</span>
                          <span className="font-medium text-blue-700 dark:text-blue-300">{selectedProduct.quantity_box}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-600 dark:text-blue-400">KG Available:</span>
                          <span className="font-medium text-blue-700 dark:text-blue-300">{selectedProduct.quantity_kg}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sale Preview and Total Calculation */}
                {selectedProduct && (saleForm.boxes_quantity > 0 || saleForm.kg_quantity > 0) && (
                  <div className="mt-4 space-y-3">
                    {/* Price Breakdown */}
                    <div className="p-3 bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-800 dark:to-slate-800 rounded-md border border-gray-200 dark:border-gray-700">
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 mb-2">
                          <Calculator className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                          <span className="font-medium text-gray-700 dark:text-gray-300 text-sm">Price Breakdown</span>
                        </div>

                        {saleForm.boxes_quantity > 0 && (
                          <div className="flex justify-between text-sm">
                            <span>{saleForm.boxes_quantity} boxes × ${saleForm.box_price}</span>
                            <span className="font-medium">${(saleForm.boxes_quantity * saleForm.box_price).toFixed(2)}</span>
                          </div>
                        )}

                        {saleForm.kg_quantity > 0 && (
                          <div className="flex justify-between text-sm">
                            <span>{saleForm.kg_quantity} kg × ${saleForm.kg_price}</span>
                            <span className="font-medium">${(saleForm.kg_quantity * saleForm.kg_price).toFixed(2)}</span>
                          </div>
                        )}

                        <div className="border-t pt-2 flex justify-between">
                          <span className="font-medium text-gray-700 dark:text-gray-300">Total Amount</span>
                          <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                            ${calculateTotal().toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Stock Validation Display */}
                    {selectedProduct && (saleForm.boxes_quantity > 0 || saleForm.kg_quantity > 0) && (
                      <div className={`p-3 rounded-md border ${
                        (saleForm.boxes_quantity <= selectedProduct.quantity_box && saleForm.kg_quantity <= selectedProduct.quantity_kg)
                          ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800'
                          : 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800'
                      }`}>
                        <div className="flex items-center gap-2 mb-2">
                          {(saleForm.boxes_quantity <= selectedProduct.quantity_box && saleForm.kg_quantity <= selectedProduct.quantity_kg) ? (
                            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                          )}
                          <span className={`font-medium text-sm ${
                            (saleForm.boxes_quantity <= selectedProduct.quantity_box && saleForm.kg_quantity <= selectedProduct.quantity_kg)
                              ? 'text-green-700 dark:text-green-300'
                              : 'text-red-700 dark:text-red-300'
                          }`}>
                            {(saleForm.boxes_quantity <= selectedProduct.quantity_box && saleForm.kg_quantity <= selectedProduct.quantity_kg)
                              ? 'Stock available for sale'
                              : 'Insufficient stock'}
                          </span>
                        </div>

                        <div className="text-xs space-y-1">
                          <div>After sale: {selectedProduct.quantity_box - saleForm.boxes_quantity} boxes, {selectedProduct.quantity_kg - saleForm.kg_quantity} kg remaining</div>
                          {saleForm.boxes_quantity > selectedProduct.quantity_box && (
                            <div className="text-red-600 dark:text-red-400">• Insufficient boxes: need {saleForm.boxes_quantity}, have {selectedProduct.quantity_box}</div>
                          )}
                          {saleForm.kg_quantity > selectedProduct.quantity_kg && (
                            <div className="text-red-600 dark:text-red-400">• Insufficient kg: need {saleForm.kg_quantity}, have {selectedProduct.quantity_kg}</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

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
                    <Select value={saleForm.payment_method} onValueChange={(value) => setSaleForm({...saleForm, payment_method: value as '' | 'momo_pay' | 'cash' | 'bank_transfer'})}>
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
                    <Select value={saleForm.payment_status} onValueChange={(value: 'paid' | 'pending' | 'partial') => {
                      // Clear client info when switching to paid (since it's not needed)
                      const updatedForm = { ...saleForm, payment_status: value };
                      if (value === 'paid') {
                        updatedForm.client_name = '';
                        updatedForm.email_address = '';
                        updatedForm.phone = '';
                      }
                      setSaleForm(updatedForm);
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
                        value={saleForm.amount_paid}
                        onChange={(e) => setSaleForm({...saleForm, amount_paid: parseFloat(e.target.value) || 0})}
                        placeholder="Enter amount already paid"
                        className="w-full"
                      />
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Total Amount: ${((saleForm.boxes_quantity * saleForm.box_price) + (saleForm.kg_quantity * saleForm.kg_price)).toFixed(2)} |
                        Remaining: ${Math.max(0, ((saleForm.boxes_quantity * saleForm.box_price) + (saleForm.kg_quantity * saleForm.kg_price)) - saleForm.amount_paid).toFixed(2)}
                      </div>
                    </div>
                  )}

                  {/* Payment Status Indicator */}
                  <div className="mt-3 p-2 bg-violet-50 dark:bg-violet-950 rounded-md border border-violet-200 dark:border-violet-800">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 bg-violet-500 dark:bg-violet-400 rounded-full"></div>
                      <span className="text-xs font-medium text-violet-800 dark:text-violet-200">
                        {saleForm.payment_status === 'paid'
                          ? 'Payment is complete - no client information required'
                          : saleForm.payment_status === 'partial'
                          ? 'Partial payment - client information required for follow-up'
                          : 'Payment pending - client information required for tracking'
                        }
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Client Information Card - Only show for pending/partial payments, not for paid */}
              {(saleForm.payment_status === 'pending' || saleForm.payment_status === 'partial') && (
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
                        value={saleForm.client_name}
                        onChange={(e) => setSaleForm({...saleForm, client_name: e.target.value})}
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
                        value={saleForm.email_address}
                        onChange={(e) => setSaleForm({...saleForm, email_address: e.target.value})}
                        className="w-full"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Phone Number
                      </Label>
                      <Input
                        placeholder="+1 (555) 123-4567"
                        value={saleForm.phone}
                        onChange={(e) => setSaleForm({...saleForm, phone: e.target.value})}
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
                    <h3 className="font-medium text-gray-900 dark:text-gray-100 text-sm">Ready to create this sale?</h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Review all details before confirming</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
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
                      }}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-200 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 text-sm"
                    >
                      Clear Form
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSubmitSale}
                      disabled={isSubmitting || !saleForm.product_id}
                      className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 dark:from-blue-500 dark:to-indigo-500 dark:hover:from-blue-600 dark:hover:to-indigo-600 text-white font-medium rounded-md shadow-md hover:shadow-lg transition-all duration-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white mr-1.5"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <Plus className="mr-1.5 h-3.5 w-3.5" />
                          Create Sale
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
                        <th className="text-left py-3 px-2 text-sm font-medium">Sale ID</th>
                        <th className="text-left py-3 px-2 text-sm font-medium">Product</th>
                        <th className="text-left py-3 px-2 text-sm font-medium">Quantity</th>
                        <th className="text-left py-3 px-2 text-sm font-medium">Price</th>
                        <th className="text-left py-3 px-2 text-sm font-medium">Total Amount</th>
                        <th className="text-left py-3 px-2 text-sm font-medium">Payment Status</th>
                        <th className="text-left py-3 px-2 text-sm font-medium">Payment Method</th>
                        <th className="text-left py-3 px-2 text-sm font-medium">Performed By</th>
                        <th className="text-right py-3 px-2 text-sm font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {salesLoading ? (
                        <tr>
                          <td colSpan={9} className="py-8 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                              Loading sales...
                            </div>
                          </td>
                        </tr>
                      ) : salesError ? (
                        <tr>
                          <td colSpan={9} className="py-8 text-center text-red-600">
                            Error loading sales: {salesError}
                          </td>
                        </tr>
                      ) : sales.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="py-8 text-center text-gray-500">
                            No sales found
                          </td>
                        </tr>
                      ) : (
                        sales.map((sale) => (
                          <tr key={sale.id} className="border-b hover:bg-muted/50">
                            <td className="py-3 px-2 font-medium">#{sale.id.slice(-8)}</td>
                            <td className="py-3 px-2">
                              <div>
                                <span className="font-medium">{sale.products?.name || 'Unknown Product'}</span>
                                {sale.products?.product_categories && (
                                  <p className="text-xs text-muted-foreground">
                                    {sale.products.product_categories.name}
                                  </p>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-2">{formatQuantity(sale)}</td>
                            <td className="py-3 px-2 text-sm">{formatPrice(sale)}</td>
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
                              {sale.users?.owner_name || 'Unknown User'}
                            </td>
                            <td className="py-3 px-2">
                              <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="sm" title="View Details">
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto">
              <h3 className="text-lg font-semibold mb-4">Edit Sale #{editingSale.id.slice(-8)}</h3>

              {/* Sale Info (Read-only) */}
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h4 className="font-medium mb-2">Sale Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Product:</span>
                    <span className="ml-2 font-medium">{editingSale.products?.name || 'Unknown Product'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Quantity:</span>
                    <span className="ml-2 font-medium">{formatQuantity(editingSale)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Total Amount:</span>
                    <span className="ml-2 font-medium">${editingSale.total_amount.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Date:</span>
                    <span className="ml-2 font-medium">{new Date(editingSale.date_time).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Editable Fields */}
              <div className="space-y-4">
                {/* Quantity Editing */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Boxes Quantity</label>
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      value={editForm.boxes_quantity}
                      onChange={(e) => setEditForm({...editForm, boxes_quantity: parseInt(e.target.value) || 0})}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">KG Quantity</label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editForm.kg_quantity}
                      onChange={(e) => setEditForm({...editForm, kg_quantity: parseFloat(e.target.value) || 0})}
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Payment Status */}
                <div>
                  <label className="block text-sm font-medium mb-2">Payment Status</label>
                  <select
                    value={editForm.payment_status}
                    onChange={(e) => setEditForm({...editForm, payment_status: e.target.value as any})}
                    className="w-full p-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-600"
                  >
                    <option value="pending">Pending</option>
                    <option value="partial">Partial</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-sm font-medium mb-2">Payment Method</label>
                  <select
                    value={editForm.payment_method}
                    onChange={(e) => setEditForm({...editForm, payment_method: e.target.value as any})}
                    className="w-full p-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-600"
                  >
                    <option value="">Select Payment Method</option>
                    <option value="momo_pay">Mobile Money</option>
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Bank Transfer</option>
                  </select>
                </div>

                {/* Amount Paid - Only show for partial payments */}
                {editForm.payment_status === 'partial' && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Amount Paid</label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editForm.amount_paid}
                      onChange={(e) => setEditForm({...editForm, amount_paid: parseFloat(e.target.value) || 0})}
                      placeholder="Enter amount paid"
                      className="w-full"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Remaining: ${((editForm.boxes_quantity * (editingSale.box_price || 0)) + (editForm.kg_quantity * (editingSale.kg_price || 0)) - editForm.amount_paid).toFixed(2)}
                    </p>
                  </div>
                )}

                {/* Client Details - Only show for pending/partial payments */}
                {(editForm.payment_status === 'pending' || editForm.payment_status === 'partial') && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-2">Client Name *</label>
                      <Input
                        value={editForm.client_name}
                        onChange={(e) => setEditForm({...editForm, client_name: e.target.value})}
                        placeholder="Enter client name"
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Email Address</label>
                      <Input
                        type="email"
                        value={editForm.email_address}
                        onChange={(e) => setEditForm({...editForm, email_address: e.target.value})}
                        placeholder="Enter email address"
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Phone Number</label>
                      <Input
                        value={editForm.phone}
                        onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                        placeholder="Enter phone number"
                        className="w-full"
                      />
                    </div>
                  </>
                )}

                {/* Reason for Edit - Required */}
                <div>
                  <label className="block text-sm font-medium mb-2">Reason for Edit *</label>
                  <textarea
                    value={editForm.reason}
                    onChange={(e) => setEditForm({...editForm, reason: e.target.value})}
                    placeholder="Please provide a reason for this edit..."
                    className="w-full p-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-600"
                    rows={3}
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingSale(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={saveEditedSale}
                >
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
                    <span className="text-sm font-medium">#{auditAction.audit.sale_id.slice(-8)}</span>
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
      </div>
    </AppLayout>
  );
};

export default Sales;
