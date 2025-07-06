import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Scale, Edit, Eye, Plus, FileText, ShoppingCart, Package, Fish, Calculator, Truck, CreditCard, Calendar, MapPin, DollarSign, Hash } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "react-i18next";
import { usePageTitle } from "@/hooks/use-page-title";

const Sales = () => {
  const { t } = useTranslation();
  usePageTitle('navigation.sales', 'Sales');

  // Mock data for sales with both selling methods
  const salesData = [
    {
      id: 1,
      saleNumber: "SALE-001",
      customer: "Fresh Fish Market",
      customerType: "Retail",
      product: "Atlantic Salmon",
      sellingMethod: "Weight-based",
      quantity: "15.5 kg",
      unitPrice: 18.50,
      totalAmount: 286.75,
      saleDate: "2024-01-20",
      deliveryDate: "2024-01-22",
      status: "Delivered",
      paymentStatus: "Paid"
    },
    {
      id: 2,
      saleNumber: "SALE-002",
      customer: "Ocean Restaurant",
      customerType: "Restaurant",
      product: "Sea Bass",
      sellingMethod: "Boxed",
      quantity: "5 boxes (1.2kg each)",
      unitPrice: 32.50,
      totalAmount: 146.25, // After 10% restaurant discount
      saleDate: "2024-01-21",
      deliveryDate: "2024-01-23",
      status: "Processing",
      paymentStatus: "Pending"
    },
    {
      id: 3,
      saleNumber: "SALE-003",
      customer: "Seafood Wholesale Co.",
      customerType: "Wholesale",
      product: "Tilapia Fillets",
      sellingMethod: "Boxed",
      quantity: "20 boxes (800g each)",
      unitPrice: 12.99,
      totalAmount: 220.83, // After 15% wholesale discount
      saleDate: "2024-01-19",
      deliveryDate: "2024-01-21",
      status: "Delivered",
      paymentStatus: "Paid"
    },
    {
      id: 4,
      saleNumber: "SALE-004",
      customer: "Local Fish Shop",
      customerType: "Retail",
      product: "Rainbow Trout",
      sellingMethod: "Weight-based",
      quantity: "8.5 kg",
      unitPrice: 15.75,
      totalAmount: 133.88,
      saleDate: "2024-01-22",
      deliveryDate: "2024-01-24",
      status: "Confirmed",
      paymentStatus: "Pending"
    },
    {
      id: 5,
      saleNumber: "SALE-005",
      customer: "Metro Supermarket",
      customerType: "Wholesale",
      product: "Atlantic Salmon",
      sellingMethod: "Both",
      quantity: "10 boxes + 25kg loose",
      unitPrice: 0, // Mixed pricing
      totalAmount: 598.25, // After 15% wholesale discount
      saleDate: "2024-01-23",
      deliveryDate: "2024-01-25",
      status: "Processing",
      paymentStatus: "Pending"
    }
  ];



  const getStatusColor = (status: string) => {
    switch (status) {
      case "Delivered":
        return "bg-green-100 text-green-800";
      case "Processing":
        return "bg-blue-100 text-blue-800";
      case "Confirmed":
        return "bg-yellow-100 text-yellow-800";
      case "Cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "Paid":
        return "bg-green-100 text-green-800";
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "Overdue":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getCustomerTypeColor = (type: string) => {
    switch (type) {
      case "Wholesale":
        return "bg-purple-100 text-purple-800";
      case "Restaurant":
        return "bg-blue-100 text-blue-800";
      case "Retail":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getSellingMethodIcon = (method: string) => {
    switch (method) {
      case "Boxed":
        return <Package className="h-4 w-4 text-blue-600" />;
      case "Weight-based":
        return <Scale className="h-4 w-4 text-green-600" />;
      case "Both":
        return (
          <div className="flex gap-1">
            <Package className="h-3 w-3 text-blue-600" />
            <Scale className="h-3 w-3 text-green-600" />
          </div>
        );
      default:
        return <ShoppingCart className="h-4 w-4 text-gray-600" />;
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

          <TabsContent value="add-sale" className="space-y-4">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-lg p-4 border border-blue-100 dark:border-blue-800">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-600 dark:bg-blue-500 rounded-md">
                  <Plus className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Create New Sale</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Add a new fish sales transaction</p>
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
              <CardContent className="p-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Fish Type Selection */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                      <Fish className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                      Fish Type
                    </label>
                    <select className="w-full p-2.5 border border-gray-200 dark:border-gray-600 rounded-md focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-1 focus:ring-emerald-200 dark:focus:ring-emerald-800 transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm">
                      <option value="">Choose fish variety...</option>
                      <option value="salmon">🐟 Atlantic Salmon</option>
                      <option value="seabass">🐠 Sea Bass</option>
                      <option value="tilapia">🐡 Tilapia Fillets</option>
                      <option value="trout">🎣 Rainbow Trout</option>
                    </select>
                  </div>

                  {/* Selling Method */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                      <Scale className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                      Selling Method
                    </label>
                    <select className="w-full p-2.5 border border-gray-200 dark:border-gray-600 rounded-md focus:border-blue-500 dark:focus:border-blue-400 focus:ring-1 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm">
                      <option value="">Select selling method...</option>
                      <option value="weight">⚖️ Weight-based (per kg)</option>
                      <option value="boxed">📦 Boxed (per box)</option>
                      <option value="both">🔄 Both methods</option>
                    </select>
                  </div>

                  {/* Quantity */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                      <Hash className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                      Quantity
                    </label>
                    <div className="relative">
                      <Input
                        placeholder="Enter quantity"
                        type="number"
                        step="0.1"
                        className="pl-3 pr-10 py-2.5 border border-gray-200 dark:border-gray-600 rounded-md focus:border-purple-500 dark:focus:border-purple-400 focus:ring-1 focus:ring-purple-200 dark:focus:ring-purple-800 transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                      />
                      <div className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 text-xs">
                        units
                      </div>
                    </div>
                  </div>

                  {/* Unit Price */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                      <DollarSign className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                      Unit Price
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
                      <Input
                        placeholder="0.00"
                        type="number"
                        step="0.01"
                        className="pl-8 pr-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-md focus:border-green-500 dark:focus:border-green-400 focus:ring-1 focus:ring-green-200 dark:focus:ring-green-800 transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Total Calculation Display */}
                <div className="mt-4 p-3 bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-800 dark:to-slate-800 rounded-md border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Calculator className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      <span className="font-medium text-gray-700 dark:text-gray-300 text-sm">Estimated Total</span>
                    </div>
                    <div className="text-lg font-bold text-gray-900 dark:text-gray-100">$0.00</div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Quantity × Unit Price = Total Amount</p>
                </div>
              </CardContent>
            </Card>

            {/* Delivery & Payment Information */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Delivery Information Card */}
              <Card className="border-0 shadow-md bg-white dark:bg-gray-800">
                <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950 dark:to-amber-950 rounded-t-lg border-b border-orange-100 dark:border-orange-800 p-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-orange-600 dark:bg-orange-500 rounded-md">
                      <Truck className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-base text-orange-900 dark:text-orange-100">Delivery Details</CardTitle>
                      <p className="text-xs text-orange-700 dark:text-orange-300">Configure delivery schedule and location</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  <div className="space-y-2">
                    <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                      <Calendar className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
                      Delivery Date
                    </label>
                    <Input
                      type="date"
                      className="w-full p-2.5 border border-gray-200 dark:border-gray-600 rounded-md focus:border-orange-500 dark:focus:border-orange-400 focus:ring-1 focus:ring-orange-200 dark:focus:ring-orange-800 transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                      <MapPin className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
                      Delivery Address
                    </label>
                    <Input
                      placeholder="Enter delivery address..."
                      className="w-full p-2.5 border border-gray-200 dark:border-gray-600 rounded-md focus:border-orange-500 dark:focus:border-orange-400 focus:ring-1 focus:ring-orange-200 dark:focus:ring-orange-800 transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                    />
                  </div>

                  {/* Delivery Status Indicator */}
                  <div className="mt-3 p-2 bg-orange-50 dark:bg-orange-950 rounded-md border border-orange-200 dark:border-orange-800">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 bg-orange-500 dark:bg-orange-400 rounded-full"></div>
                      <span className="text-xs font-medium text-orange-800 dark:text-orange-200">Delivery Scheduled</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Information Card */}
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
                <CardContent className="p-4 space-y-3">
                  <div className="space-y-2">
                    <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                      <CreditCard className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
                      Payment Method
                    </label>
                    <select className="w-full p-2.5 border border-gray-200 dark:border-gray-600 rounded-md focus:border-violet-500 dark:focus:border-violet-400 focus:ring-1 focus:ring-violet-200 dark:focus:ring-violet-800 transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm">
                      <option value="">Choose payment method...</option>
                      <option value="cash">💵 Cash Payment</option>
                      <option value="card">💳 Credit/Debit Card</option>
                      <option value="bank">🏦 Bank Transfer</option>
                      <option value="check">📝 Check</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                      <DollarSign className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
                      Payment Status
                    </label>
                    <select className="w-full p-2.5 border border-gray-200 dark:border-gray-600 rounded-md focus:border-violet-500 dark:focus:border-violet-400 focus:ring-1 focus:ring-violet-200 dark:focus:ring-violet-800 transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm">
                      <option value="pending">⏳ Pending Payment</option>
                      <option value="paid">✅ Fully Paid</option>
                      <option value="partial">⚠️ Partial Payment</option>
                    </select>
                  </div>

                  {/* Payment Status Indicator */}
                  <div className="mt-3 p-2 bg-violet-50 dark:bg-violet-950 rounded-md border border-violet-200 dark:border-violet-800">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 bg-violet-500 dark:bg-violet-400 rounded-full"></div>
                      <span className="text-xs font-medium text-violet-800 dark:text-violet-200">Payment Pending</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Action Buttons */}
            <Card className="border-0 shadow-md bg-white dark:bg-gray-800">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
                  <div className="text-left">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100 text-sm">Ready to create this sale?</h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Review all details before confirming</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-200 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 text-sm"
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 dark:from-blue-500 dark:to-indigo-500 dark:hover:from-blue-600 dark:hover:to-indigo-600 text-white font-medium rounded-md shadow-md hover:shadow-lg transition-all duration-200 text-sm"
                    >
                      <Plus className="mr-1.5 h-3.5 w-3.5" />
                      Create Sale
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
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search sales..."
                      className="pl-10 w-full"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-2 text-sm font-medium">Sale #</th>
                        <th className="text-left py-3 px-2 text-sm font-medium">Customer</th>
                        <th className="text-left py-3 px-2 text-sm font-medium">Product</th>
                        <th className="text-left py-3 px-2 text-sm font-medium">Selling Method</th>
                        <th className="text-left py-3 px-2 text-sm font-medium">Quantity</th>
                        <th className="text-left py-3 px-2 text-sm font-medium">Total</th>
                        <th className="text-left py-3 px-2 text-sm font-medium">Delivery</th>
                        <th className="text-left py-3 px-2 text-sm font-medium">Status</th>
                        <th className="text-right py-3 px-2 text-sm font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {salesData.map((sale) => (
                        <tr key={sale.id} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-2 font-medium">{sale.saleNumber}</td>
                          <td className="py-3 px-2">
                            <div>
                              <span className="font-medium">{sale.customer}</span>
                              <p className="text-xs text-muted-foreground">
                                <Badge className={getCustomerTypeColor(sale.customerType)} variant="outline">
                                  {sale.customerType}
                                </Badge>
                              </p>
                            </div>
                          </td>
                          <td className="py-3 px-2 text-muted-foreground">{sale.product}</td>
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-2">
                              {getSellingMethodIcon(sale.sellingMethod)}
                              <span className="text-sm">{sale.sellingMethod}</span>
                            </div>
                          </td>
                          <td className="py-3 px-2">{sale.quantity}</td>
                          <td className="py-3 px-2 font-medium">${sale.totalAmount.toFixed(2)}</td>
                          <td className="py-3 px-2 text-sm">{sale.deliveryDate}</td>
                          <td className="py-3 px-2">
                            <Badge className={getStatusColor(sale.status)}>
                              {sale.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-2">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
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
                  {/* Audit Filters */}
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center">
                    <div className="relative w-full sm:w-64">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search audit logs..."
                        className="pl-10 w-full"
                      />
                    </div>
                    <select className="p-2 border rounded-md w-full sm:w-auto bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-600">
                      <option value="">All Actions</option>
                      <option value="created">Sale Created</option>
                      <option value="modified">Sale Modified</option>
                      <option value="deleted">Sale Deleted</option>
                      <option value="payment">Payment Updated</option>
                    </select>
                    <Input type="date" className="w-full sm:w-40" />
                  </div>

                  {/* Audit Log Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-2 text-sm font-medium">Timestamp</th>
                          <th className="text-left py-3 px-2 text-sm font-medium">Sale #</th>
                          <th className="text-left py-3 px-2 text-sm font-medium">Action</th>
                          <th className="text-left py-3 px-2 text-sm font-medium">User</th>
                          <th className="text-left py-3 px-2 text-sm font-medium">Changes</th>
                          <th className="text-left py-3 px-2 text-sm font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b hover:bg-muted/50">
                          <td className="py-3 px-2 text-sm">2024-01-23 14:30:25</td>
                          <td className="py-3 px-2 font-medium">SALE-005</td>
                          <td className="py-3 px-2">
                            <Badge className="bg-blue-100 text-blue-800">Created</Badge>
                          </td>
                          <td className="py-3 px-2">Admin User</td>
                          <td className="py-3 px-2 text-sm">New sale created for Metro Supermarket</td>
                          <td className="py-3 px-2">
                            <Badge className="bg-green-100 text-green-800">Success</Badge>
                          </td>
                        </tr>
                        <tr className="border-b hover:bg-muted/50">
                          <td className="py-3 px-2 text-sm">2024-01-22 16:45:12</td>
                          <td className="py-3 px-2 font-medium">SALE-004</td>
                          <td className="py-3 px-2">
                            <Badge className="bg-yellow-100 text-yellow-800">Modified</Badge>
                          </td>
                          <td className="py-3 px-2">Worker 1</td>
                          <td className="py-3 px-2 text-sm">Updated delivery date from 2024-01-23 to 2024-01-24</td>
                          <td className="py-3 px-2">
                            <Badge className="bg-green-100 text-green-800">Success</Badge>
                          </td>
                        </tr>
                        <tr className="border-b hover:bg-muted/50">
                          <td className="py-3 px-2 text-sm">2024-01-21 11:20:08</td>
                          <td className="py-3 px-2 font-medium">SALE-002</td>
                          <td className="py-3 px-2">
                            <Badge className="bg-purple-100 text-purple-800">Payment</Badge>
                          </td>
                          <td className="py-3 px-2">Admin User</td>
                          <td className="py-3 px-2 text-sm">Payment status updated to Pending</td>
                          <td className="py-3 px-2">
                            <Badge className="bg-green-100 text-green-800">Success</Badge>
                          </td>
                        </tr>
                        <tr className="border-b hover:bg-muted/50">
                          <td className="py-3 px-2 text-sm">2024-01-20 09:15:33</td>
                          <td className="py-3 px-2 font-medium">SALE-001</td>
                          <td className="py-3 px-2">
                            <Badge className="bg-green-100 text-green-800">Delivered</Badge>
                          </td>
                          <td className="py-3 px-2">Worker 2</td>
                          <td className="py-3 px-2 text-sm">Sale marked as delivered and payment confirmed</td>
                          <td className="py-3 px-2">
                            <Badge className="bg-green-100 text-green-800">Success</Badge>
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

export default Sales;
