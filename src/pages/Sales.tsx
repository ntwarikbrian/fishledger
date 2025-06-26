import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TrendingUp, PlusCircle, Search, DollarSign, Package, Users, ShoppingCart, Scale, Edit, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Sales = () => {
  // Mock data for sales with both selling methods
  const salesData = [
    {
      id: 1,
      orderNumber: "ORD-001",
      customer: "Fresh Fish Market",
      customerType: "Retail",
      product: "Atlantic Salmon",
      sellingMethod: "Weight-based",
      quantity: "15.5 kg",
      unitPrice: 18.50,
      totalAmount: 286.75,
      orderDate: "2024-01-20",
      deliveryDate: "2024-01-22",
      status: "Delivered",
      paymentStatus: "Paid"
    },
    {
      id: 2,
      orderNumber: "ORD-002",
      customer: "Ocean Restaurant",
      customerType: "Restaurant",
      product: "Sea Bass",
      sellingMethod: "Boxed",
      quantity: "5 boxes (1.2kg each)",
      unitPrice: 32.50,
      totalAmount: 146.25, // After 10% restaurant discount
      orderDate: "2024-01-21",
      deliveryDate: "2024-01-23",
      status: "Processing",
      paymentStatus: "Pending"
    },
    {
      id: 3,
      orderNumber: "ORD-003",
      customer: "Seafood Wholesale Co.",
      customerType: "Wholesale",
      product: "Tilapia Fillets",
      sellingMethod: "Boxed",
      quantity: "20 boxes (800g each)",
      unitPrice: 12.99,
      totalAmount: 220.83, // After 15% wholesale discount
      orderDate: "2024-01-19",
      deliveryDate: "2024-01-21",
      status: "Delivered",
      paymentStatus: "Paid"
    },
    {
      id: 4,
      orderNumber: "ORD-004",
      customer: "Local Fish Shop",
      customerType: "Retail",
      product: "Rainbow Trout",
      sellingMethod: "Weight-based",
      quantity: "8.5 kg",
      unitPrice: 15.75,
      totalAmount: 133.88,
      orderDate: "2024-01-22",
      deliveryDate: "2024-01-24",
      status: "Confirmed",
      paymentStatus: "Pending"
    },
    {
      id: 5,
      orderNumber: "ORD-005",
      customer: "Metro Supermarket",
      customerType: "Wholesale",
      product: "Atlantic Salmon",
      sellingMethod: "Both",
      quantity: "10 boxes + 25kg loose",
      unitPrice: 0, // Mixed pricing
      totalAmount: 598.25, // After 15% wholesale discount
      orderDate: "2024-01-23",
      deliveryDate: "2024-01-25",
      status: "Processing",
      paymentStatus: "Pending"
    }
  ];

  const customers = [
    {
      id: 1,
      name: "Fresh Fish Market",
      type: "Retail",
      totalOrders: 15,
      totalSpent: 28500.00,
      lastOrder: "2024-01-20",
      status: "Active",
      contact: "john@freshfish.com"
    },
    {
      id: 2,
      name: "Ocean Restaurant",
      type: "Restaurant",
      totalOrders: 8,
      totalSpent: 12400.00,
      lastOrder: "2024-01-21",
      status: "Active",
      contact: "chef@oceanrest.com"
    },
    {
      id: 3,
      name: "Seafood Wholesale Co.",
      type: "Wholesale",
      totalOrders: 25,
      totalSpent: 45600.00,
      lastOrder: "2024-01-19",
      status: "Active",
      contact: "orders@seafoodwholesale.com"
    },
    {
      id: 4,
      name: "Local Fish Shop",
      type: "Retail",
      totalOrders: 12,
      totalSpent: 18200.00,
      lastOrder: "2024-01-22",
      status: "Active",
      contact: "info@localfish.com"
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
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Sales & Distribution</h1>
            <p className="text-muted-foreground">Manage sales orders and customer relationships</p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <PlusCircle className="mr-2 h-4 w-4" /> New Sale Order
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="hover-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${salesData.reduce((sum, sale) => sum + sale.totalAmount, 0).toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">From {salesData.length} orders</p>
            </CardContent>
          </Card>
          
          <Card className="hover-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Boxed Sales</CardTitle>
              <Package className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {salesData.filter(s => s.sellingMethod === "Boxed" || s.sellingMethod === "Both").length}
              </div>
              <p className="text-xs text-muted-foreground">Orders with boxes</p>
            </CardContent>
          </Card>

          <Card className="hover-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Weight-based Sales</CardTitle>
              <Scale className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {salesData.filter(s => s.sellingMethod === "Weight-based" || s.sellingMethod === "Both").length}
              </div>
              <p className="text-xs text-muted-foreground">Orders by weight</p>
            </CardContent>
          </Card>
          
          <Card className="hover-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
              <Users className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">4</div>
              <p className="text-xs text-muted-foreground">All customers active</p>
            </CardContent>
          </Card>
        </div>

        {/* Sales Management Tabs */}
        <Card>
          <CardHeader>
            <CardTitle>Sales Management</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="orders" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="orders">Sales Orders</TabsTrigger>
                <TabsTrigger value="customers">Customer Management</TabsTrigger>
              </TabsList>
              
              <TabsContent value="orders" className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search orders..."
                      className="pl-10 w-64"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-2 text-sm font-medium">Order #</th>
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
                          <td className="py-3 px-2 font-medium">{sale.orderNumber}</td>
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
              </TabsContent>
              
              <TabsContent value="customers" className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search customers..."
                      className="pl-10 w-64"
                    />
                  </div>
                  <Button variant="outline">
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Customer
                  </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {customers.map((customer) => (
                    <Card key={customer.id} className="hover-card">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{customer.name}</CardTitle>
                            <p className="text-sm text-muted-foreground">{customer.contact}</p>
                          </div>
                          <Badge className={getCustomerTypeColor(customer.type)}>
                            {customer.type}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Total Orders:</span>
                            <p className="text-muted-foreground">{customer.totalOrders}</p>
                          </div>
                          <div>
                            <span className="font-medium">Total Spent:</span>
                            <p className="text-muted-foreground">${customer.totalSpent.toFixed(2)}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Last Order:</span>
                            <p className="text-muted-foreground">{customer.lastOrder}</p>
                          </div>
                          <div>
                            <span className="font-medium">Status:</span>
                            <Badge className="bg-green-100 text-green-800 ml-2">
                              {customer.status}
                            </Badge>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="flex-1">
                            View Orders
                          </Button>
                          <Button variant="outline" size="sm" className="flex-1">
                            New Order
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Sales;
