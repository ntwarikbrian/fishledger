import React, { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Fish, Search, Filter, Edit, Trash2, Package, Scale, ChevronDown, Eye, AlertTriangle, Calendar, RotateCcw, Archive, Plus, FileText, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type ViewType = "all" | "low-stock" | "damaged" | "expiry" | "stock-adjustment";

const ProductInventory = () => {
  const [currentView, setCurrentView] = useState<ViewType>("all");
  // Mock data for fish product inventory - focused on selling business
  const productData = [
    {
      id: 1,
      name: "Atlantic Salmon",
      category: "Premium Fish",
      stockQuantity: 45, // pieces for boxed
      stockWeight: 120.5, // kg for weight-based
      sellingType: "Both", // Boxed and Weight-based
      pricePerBox: 25.99,
      pricePerKg: 18.50,
      boxWeight: "1.5 kg",
      status: "In Stock",
      expiryDate: "2024-02-15",
      supplier: "Ocean Fresh Ltd",
      lastRestocked: "2024-01-20"
    },
    {
      id: 2,
      name: "Rainbow Trout",
      category: "Fresh Water Fish",
      stockQuantity: 30,
      stockWeight: 85.0,
      sellingType: "Weight-based",
      pricePerBox: 0, // Not sold in boxes
      pricePerKg: 15.75,
      boxWeight: "N/A",
      status: "Low Stock",
      expiryDate: "2024-02-12",
      supplier: "Lake Harvest Co",
      lastRestocked: "2024-01-18"
    },
    {
      id: 3,
      name: "Tilapia Fillets",
      category: "Processed Fish",
      stockQuantity: 60,
      stockWeight: 0, // Only sold in boxes
      sellingType: "Boxed",
      pricePerBox: 12.99,
      pricePerKg: 0,
      boxWeight: "800g",
      status: "In Stock",
      expiryDate: "2024-02-18",
      supplier: "Fresh Catch Processing",
      lastRestocked: "2024-01-22"
    },
    {
      id: 4,
      name: "Sea Bass",
      category: "Premium Fish",
      stockQuantity: 25,
      stockWeight: 75.0,
      sellingType: "Both",
      pricePerBox: 32.50,
      pricePerKg: 22.00,
      boxWeight: "1.2 kg",
      status: "In Stock",
      expiryDate: "2024-02-14",
      supplier: "Coastal Fisheries",
      lastRestocked: "2024-01-21"
    },
    {
      id: 5,
      name: "Cod Fillets",
      category: "White Fish",
      stockQuantity: 0,
      stockWeight: 5.5,
      sellingType: "Weight-based",
      pricePerBox: 0,
      pricePerKg: 24.99,
      boxWeight: "N/A",
      status: "Critical Stock",
      expiryDate: "2024-02-10",
      supplier: "North Sea Catch",
      lastRestocked: "2024-01-15"
    }
  ];

  // Mock data for different views
  const lowStockData = [
    { id: 1, name: 'Rainbow Trout', currentStock: 30, minStock: 50, status: 'Low', color: 'bg-yellow-500', percentage: 60, supplier: 'Lake Harvest Co' },
    { id: 2, name: 'Cod Fillets', currentStock: 5, minStock: 25, status: 'Critical', color: 'bg-red-500', percentage: 20, supplier: 'North Sea Catch' },
    { id: 3, name: 'Mackerel', currentStock: 15, minStock: 40, status: 'Low', color: 'bg-orange-500', percentage: 37, supplier: 'Atlantic Fisheries' }
  ];

  const damagedData = [
    { id: 1, name: 'Atlantic Salmon', quantity: 8, reason: 'Damaged in Transit', date: '2024-01-21', loss: '$160.00', batch: 'AS-2024-003', status: 'Insurance Claim' },
    { id: 2, name: 'Sea Bass', quantity: 6, reason: 'Freezer Malfunction', date: '2024-01-19', loss: '$90.00', batch: 'SB-2024-001', status: 'Disposed' },
    { id: 3, name: 'Tilapia Fillets', quantity: 12, reason: 'Quality Issues', date: '2024-01-18', loss: '$144.00', batch: 'TF-2024-002', status: 'Returned to Supplier' }
  ];

  const expiryData = [
    { id: 1, name: 'Cod Fillets', expiryDate: '2024-02-10', daysLeft: 2, quantity: '5.5 kg', batch: 'CF-2024-001', status: 'Critical', supplier: 'North Sea Catch' },
    { id: 2, name: 'Rainbow Trout', expiryDate: '2024-02-12', daysLeft: 4, quantity: '85 kg', batch: 'RT-2024-002', status: 'Warning', supplier: 'Lake Harvest Co' },
    { id: 3, name: 'Sea Bass', expiryDate: '2024-02-14', daysLeft: 6, quantity: '75 kg', batch: 'SB-2024-003', status: 'Monitor', supplier: 'Coastal Fisheries' }
  ];

  const stockAdjustmentData = [
    { id: 1, product: 'Atlantic Salmon', type: 'Manual Adjustment', oldStock: '120.5 kg', newStock: '115.0 kg', difference: '-5.5 kg', reason: 'Inventory Count Correction', date: '2024-01-22', user: 'John Smith' },
    { id: 2, product: 'Tilapia Fillets', type: 'Damage Write-off', oldStock: '72 boxes', newStock: '60 boxes', difference: '-12 boxes', reason: 'Quality Issues', date: '2024-01-21', user: 'Sarah Johnson' },
    { id: 3, product: 'Sea Bass', type: 'Restock', oldStock: '50.0 kg', newStock: '75.0 kg', difference: '+25.0 kg', reason: 'New Delivery', date: '2024-01-21', user: 'Mike Wilson' }
  ];

  // Helper function to get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "In Stock":
        return "bg-green-100 text-green-800";
      case "Low Stock":
        return "bg-yellow-100 text-yellow-800";
      case "Critical Stock":
        return "bg-red-100 text-red-800";
      case "Out of Stock":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Helper function to get selling type icon
  const getSellingTypeIcon = (type: string) => {
    switch (type) {
      case "Boxed":
        return <Package className="h-4 w-4" />;
      case "Weight-based":
        return <Scale className="h-4 w-4" />;
      case "Both":
        return (
          <div className="flex gap-1">
            <Package className="h-3 w-3" />
            <Scale className="h-3 w-3" />
          </div>
        );
      default:
        return <Fish className="h-4 w-4" />;
    }
  };

  // View rendering functions
  const renderAllProductsView = () => (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left py-3 px-2 text-sm font-medium">Product</th>
            <th className="text-left py-3 px-2 text-sm font-medium">Category</th>
            <th className="text-left py-3 px-2 text-sm font-medium">Stock</th>
            <th className="text-left py-3 px-2 text-sm font-medium">Selling Type</th>
            <th className="text-left py-3 px-2 text-sm font-medium">Pricing</th>
            <th className="text-left py-3 px-2 text-sm font-medium">Status</th>
            <th className="text-left py-3 px-2 text-sm font-medium">Expiry</th>
            <th className="text-right py-3 px-2 text-sm font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {productData.map((product) => (
            <tr key={product.id} className="border-b hover:bg-muted/50">
              <td className="py-3 px-2">
                <div className="flex items-center gap-2">
                  <Fish className="h-4 w-4 text-blue-600" />
                  <div>
                    <span className="font-medium">{product.name}</span>
                    <p className="text-xs text-muted-foreground">{product.supplier}</p>
                  </div>
                </div>
              </td>
              <td className="py-3 px-2 text-sm text-muted-foreground">
                {product.category}
              </td>
              <td className="py-3 px-2">
                <div className="text-sm">
                  {product.sellingType === "Weight-based" ? (
                    <span>{product.stockWeight} kg</span>
                  ) : product.sellingType === "Boxed" ? (
                    <span>{product.stockQuantity} boxes</span>
                  ) : (
                    <div>
                      <div>{product.stockQuantity} boxes</div>
                      <div className="text-xs text-muted-foreground">{product.stockWeight} kg</div>
                    </div>
                  )}
                </div>
              </td>
              <td className="py-3 px-2">
                <div className="flex items-center gap-1">
                  {getSellingTypeIcon(product.sellingType)}
                  <span className="text-sm">{product.sellingType}</span>
                </div>
              </td>
              <td className="py-3 px-2">
                <div className="text-sm">
                  {product.sellingType === "Weight-based" ? (
                    <span>${product.pricePerKg}/kg</span>
                  ) : product.sellingType === "Boxed" ? (
                    <span>${product.pricePerBox}/box</span>
                  ) : (
                    <div>
                      <div>${product.pricePerBox}/box</div>
                      <div className="text-xs text-muted-foreground">${product.pricePerKg}/kg</div>
                    </div>
                  )}
                </div>
              </td>
              <td className="py-3 px-2">
                <Badge className={getStatusColor(product.status)}>
                  {product.status}
                </Badge>
              </td>
              <td className="py-3 px-2 text-sm">
                {product.expiryDate}
              </td>
              <td className="py-3 px-2">
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
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
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left py-3 px-2 text-sm font-medium">Product</th>
            <th className="text-left py-3 px-2 text-sm font-medium">Current Stock</th>
            <th className="text-left py-3 px-2 text-sm font-medium">Minimum Stock</th>
            <th className="text-left py-3 px-2 text-sm font-medium">Stock Level</th>
            <th className="text-left py-3 px-2 text-sm font-medium">Need to Order</th>
            <th className="text-right py-3 px-2 text-sm font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {lowStockData.map((item) => (
            <tr key={item.id} className="border-b hover:bg-yellow-50 dark:hover:bg-yellow-900/10 transition-colors">
              <td className="py-3 px-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <div>
                    <div className="font-medium">{item.name}</div>
                    <p className="text-xs text-muted-foreground">{item.supplier}</p>
                  </div>
                </div>
              </td>
              <td className="py-3 px-2">
                <span className="font-medium">{item.currentStock} units</span>
              </td>
              <td className="py-3 px-2 text-muted-foreground">
                {item.minStock} units
              </td>
              <td className="py-3 px-2">
                <div className="flex items-center gap-2">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 max-w-[100px]">
                    <div
                      className={`h-2 rounded-full ${item.color} transition-all duration-1000 ease-out`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground min-w-[40px]">
                    {item.percentage}%
                  </span>
                </div>
              </td>
              <td className="py-3 px-2 font-medium text-red-600">
                {item.minStock - item.currentStock} units
              </td>
              <td className="py-3 px-2 text-right">
                <Badge className={item.status === 'Critical' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}>
                  {item.status}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderDamagedView = () => (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left py-3 px-2 text-sm font-medium">Product</th>
            <th className="text-left py-3 px-2 text-sm font-medium">Quantity</th>
            <th className="text-left py-3 px-2 text-sm font-medium">Reason</th>
            <th className="text-left py-3 px-2 text-sm font-medium">Date</th>
            <th className="text-left py-3 px-2 text-sm font-medium">Loss Value</th>
            <th className="text-left py-3 px-2 text-sm font-medium">Batch</th>
            <th className="text-right py-3 px-2 text-sm font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {damagedData.map((item) => (
            <tr key={item.id} className="border-b hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors">
              <td className="py-3 px-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <div className="font-medium">{item.name}</div>
                </div>
              </td>
              <td className="py-3 px-2 font-medium">
                {item.quantity} units
              </td>
              <td className="py-3 px-2 text-muted-foreground">
                {item.reason}
              </td>
              <td className="py-3 px-2 text-sm">
                {item.date}
              </td>
              <td className="py-3 px-2 font-medium text-red-600">
                {item.loss}
              </td>
              <td className="py-3 px-2 text-sm text-muted-foreground">
                {item.batch}
              </td>
              <td className="py-3 px-2 text-right">
                <Badge className="bg-red-100 text-red-800">
                  {item.status}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderExpiryView = () => (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left py-3 px-2 text-sm font-medium">Product</th>
            <th className="text-left py-3 px-2 text-sm font-medium">Expiry Date</th>
            <th className="text-left py-3 px-2 text-sm font-medium">Days Left</th>
            <th className="text-left py-3 px-2 text-sm font-medium">Quantity</th>
            <th className="text-left py-3 px-2 text-sm font-medium">Batch</th>
            <th className="text-left py-3 px-2 text-sm font-medium">Supplier</th>
            <th className="text-right py-3 px-2 text-sm font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {expiryData.map((item) => (
            <tr key={item.id} className="border-b hover:bg-orange-50 dark:hover:bg-orange-900/10 transition-colors">
              <td className="py-3 px-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-orange-600" />
                  <div className="font-medium">{item.name}</div>
                </div>
              </td>
              <td className="py-3 px-2 text-sm">
                {item.expiryDate}
              </td>
              <td className="py-3 px-2">
                <span className={`font-medium ${item.daysLeft <= 3 ? 'text-red-600' : item.daysLeft <= 7 ? 'text-orange-600' : 'text-green-600'}`}>
                  {item.daysLeft} days
                </span>
              </td>
              <td className="py-3 px-2 font-medium">
                {item.quantity}
              </td>
              <td className="py-3 px-2 text-sm text-muted-foreground">
                {item.batch}
              </td>
              <td className="py-3 px-2 text-sm text-muted-foreground">
                {item.supplier}
              </td>
              <td className="py-3 px-2 text-right">
                <Badge className={
                  item.status === 'Critical' ? 'bg-red-100 text-red-800' :
                  item.status === 'Warning' ? 'bg-orange-100 text-orange-800' :
                  'bg-yellow-100 text-yellow-800'
                }>
                  {item.status}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderStockAdjustmentView = () => (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left py-3 px-2 text-sm font-medium">Product</th>
            <th className="text-left py-3 px-2 text-sm font-medium">Type</th>
            <th className="text-left py-3 px-2 text-sm font-medium">Old Stock</th>
            <th className="text-left py-3 px-2 text-sm font-medium">New Stock</th>
            <th className="text-left py-3 px-2 text-sm font-medium">Difference</th>
            <th className="text-left py-3 px-2 text-sm font-medium">Reason</th>
            <th className="text-left py-3 px-2 text-sm font-medium">Date</th>
            <th className="text-right py-3 px-2 text-sm font-medium">User</th>
          </tr>
        </thead>
        <tbody>
          {stockAdjustmentData.map((item) => (
            <tr key={item.id} className="border-b hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors">
              <td className="py-3 px-2">
                <div className="flex items-center gap-2">
                  <RotateCcw className="h-4 w-4 text-blue-600" />
                  <div className="font-medium">{item.product}</div>
                </div>
              </td>
              <td className="py-3 px-2">
                <Badge variant="outline" className="text-xs">
                  {item.type}
                </Badge>
              </td>
              <td className="py-3 px-2 text-sm text-muted-foreground">
                {item.oldStock}
              </td>
              <td className="py-3 px-2 text-sm font-medium">
                {item.newStock}
              </td>
              <td className="py-3 px-2">
                <span className={`font-medium ${item.difference.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                  {item.difference}
                </span>
              </td>
              <td className="py-3 px-2 text-sm text-muted-foreground">
                {item.reason}
              </td>
              <td className="py-3 px-2 text-sm">
                {item.date}
              </td>
              <td className="py-3 px-2 text-right text-sm text-muted-foreground">
                {item.user}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

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
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

                {/* Dynamic View Content */}
                {renderCurrentView()}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Add Product Tab Content */}
          <TabsContent value="add" className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Add New Product Square */}
              <Card className="hover-card aspect-square">
                <CardContent className="p-4 h-full flex flex-col items-center justify-center text-center space-y-3">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <Fish className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold">Add New Fish Product</h3>
                    <p className="text-xs text-muted-foreground">
                      Create and add a brand new fish product to your comprehensive inventory system with complete product details, pricing, and specifications
                    </p>
                  </div>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-sm px-4">
                    <Plus className="mr-1 h-3 w-3" />
                    Add Product
                  </Button>
                </CardContent>
              </Card>

              {/* Add New Stock Square */}
              <Card className="hover-card aspect-square">
                <CardContent className="p-4 h-full flex flex-col items-center justify-center text-center space-y-3">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                    <Package className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold">Add Fresh Stock Inventory</h3>
                    <p className="text-xs text-muted-foreground">
                      Increase and replenish inventory stock levels for existing fish products with new arrivals, deliveries, and fresh stock supplies
                    </p>
                  </div>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-sm px-4">
                    <Plus className="mr-1 h-3 w-3" />
                    Add Stock
                  </Button>
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
                  <Button className="bg-blue-600 hover:bg-blue-700 text-sm px-4">
                    <Plus className="mr-1 h-3 w-3" />
                    Add Damaged
                  </Button>
                </CardContent>
              </Card>

              {/* Add Expired Square */}
              <Card className="hover-card aspect-square">
                <CardContent className="p-4 h-full flex flex-col items-center justify-center text-center space-y-3">
                  <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold">Mark Expired Products</h3>
                    <p className="text-xs text-muted-foreground">
                      Identify and mark fish products that have reached their expiration date and handle proper disposal, return, or waste management procedures
                    </p>
                  </div>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-sm px-4">
                    <Plus className="mr-1 h-3 w-3" />
                    Add Expired
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Audit Tab Content */}
          <TabsContent value="audit" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Inventory Audit Trail</CardTitle>
                <p className="text-sm text-muted-foreground">Track all inventory changes and system activities</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Audit Filters */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input placeholder="Search audit logs..." className="pl-10" />
                      </div>
                    </div>
                    <Select>
                      <SelectTrigger className="w-full sm:w-48">
                        <SelectValue placeholder="Filter by action" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Actions</SelectItem>
                        <SelectItem value="add">Product Added</SelectItem>
                        <SelectItem value="update">Product Updated</SelectItem>
                        <SelectItem value="delete">Product Deleted</SelectItem>
                        <SelectItem value="stock">Stock Adjustment</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Audit Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-2 text-sm font-medium">Timestamp</th>
                          <th className="text-left py-3 px-2 text-sm font-medium">Action</th>
                          <th className="text-left py-3 px-2 text-sm font-medium">Product</th>
                          <th className="text-left py-3 px-2 text-sm font-medium">User</th>
                          <th className="text-left py-3 px-2 text-sm font-medium">Changes</th>
                          <th className="text-right py-3 px-2 text-sm font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b hover:bg-muted/50">
                          <td className="py-3 px-2 text-sm">2024-01-22 14:30:15</td>
                          <td className="py-3 px-2">
                            <Badge variant="outline" className="text-green-600">
                              Stock Added
                            </Badge>
                          </td>
                          <td className="py-3 px-2 font-medium">Atlantic Salmon</td>
                          <td className="py-3 px-2 text-sm text-muted-foreground">John Smith</td>
                          <td className="py-3 px-2 text-sm">+25.0 kg added to inventory</td>
                          <td className="py-3 px-2 text-right">
                            <Badge className="bg-green-100 text-green-800">Success</Badge>
                          </td>
                        </tr>
                        <tr className="border-b hover:bg-muted/50">
                          <td className="py-3 px-2 text-sm">2024-01-22 13:15:42</td>
                          <td className="py-3 px-2">
                            <Badge variant="outline" className="text-blue-600">
                              Product Updated
                            </Badge>
                          </td>
                          <td className="py-3 px-2 font-medium">Sea Bass</td>
                          <td className="py-3 px-2 text-sm text-muted-foreground">Sarah Johnson</td>
                          <td className="py-3 px-2 text-sm">Price updated: $20.00 → $22.00/kg</td>
                          <td className="py-3 px-2 text-right">
                            <Badge className="bg-blue-100 text-blue-800">Success</Badge>
                          </td>
                        </tr>
                        <tr className="border-b hover:bg-muted/50">
                          <td className="py-3 px-2 text-sm">2024-01-22 11:45:20</td>
                          <td className="py-3 px-2">
                            <Badge variant="outline" className="text-purple-600">
                              Product Added
                            </Badge>
                          </td>
                          <td className="py-3 px-2 font-medium">Rainbow Trout</td>
                          <td className="py-3 px-2 text-sm text-muted-foreground">Mike Wilson</td>
                          <td className="py-3 px-2 text-sm">New product added to inventory</td>
                          <td className="py-3 px-2 text-right">
                            <Badge className="bg-purple-100 text-purple-800">Success</Badge>
                          </td>
                        </tr>
                        <tr className="border-b hover:bg-muted/50">
                          <td className="py-3 px-2 text-sm">2024-01-21 16:20:33</td>
                          <td className="py-3 px-2">
                            <Badge variant="outline" className="text-red-600">
                              Stock Removed
                            </Badge>
                          </td>
                          <td className="py-3 px-2 font-medium">Tilapia Fillets</td>
                          <td className="py-3 px-2 text-sm text-muted-foreground">Sarah Johnson</td>
                          <td className="py-3 px-2 text-sm">-12 boxes (damaged goods)</td>
                          <td className="py-3 px-2 text-right">
                            <Badge className="bg-red-100 text-red-800">Success</Badge>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default ProductInventory;
