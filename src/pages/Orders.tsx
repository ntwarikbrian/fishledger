import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  ShoppingCart, 
  PlusCircle, 
  Search, 
  Filter, 
  Edit, 
  Eye, 
  Package, 
  Scale, 
  Clock,
  CheckCircle,
  XCircle,
  Truck
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Orders = () => {
  // Mock data for orders
  const ordersData = [
    {
      id: 1,
      orderNumber: "ORD-2024-001",
      customer: "Ocean View Restaurant",
      customerType: "Restaurant",
      orderDate: "2024-01-22",
      deliveryDate: "2024-01-24",
      status: "Processing",
      items: [
        { product: "Atlantic Salmon", type: "Weight-based", quantity: "15 kg", price: 277.50 },
        { product: "Sea Bass", type: "Boxed", quantity: "5 boxes", price: 162.50 }
      ],
      totalAmount: 440.00,
      paymentStatus: "Paid",
      deliveryMethod: "Delivery",
      notes: "Deliver to back entrance"
    },
    {
      id: 2,
      orderNumber: "ORD-2024-002",
      customer: "Fresh Market Co",
      customerType: "Wholesale",
      orderDate: "2024-01-21",
      deliveryDate: "2024-01-23",
      status: "Ready for Pickup",
      items: [
        { product: "Tilapia Fillets", type: "Boxed", quantity: "20 boxes", price: 259.80 },
        { product: "Rainbow Trout", type: "Weight-based", quantity: "25 kg", price: 393.75 }
      ],
      totalAmount: 653.55, // After 15% wholesale discount
      paymentStatus: "Pending",
      deliveryMethod: "Pickup",
      notes: "Customer will collect at 2 PM"
    },
    {
      id: 3,
      orderNumber: "ORD-2024-003",
      customer: "John Smith",
      customerType: "Retail",
      orderDate: "2024-01-20",
      deliveryDate: "2024-01-22",
      status: "Delivered",
      items: [
        { product: "Atlantic Salmon", type: "Boxed", quantity: "2 boxes", price: 51.98 }
      ],
      totalAmount: 51.98,
      paymentStatus: "Paid",
      deliveryMethod: "Delivery",
      notes: ""
    },
    {
      id: 4,
      orderNumber: "ORD-2024-004",
      customer: "Seaside Bistro",
      customerType: "Restaurant",
      orderDate: "2024-01-22",
      deliveryDate: "2024-01-25",
      status: "Pending",
      items: [
        { product: "Cod Fillets", type: "Weight-based", quantity: "8 kg", price: 199.92 },
        { product: "Sea Bass", type: "Weight-based", quantity: "6 kg", price: 132.00 }
      ],
      totalAmount: 298.73, // After 10% restaurant discount
      paymentStatus: "Pending",
      deliveryMethod: "Delivery",
      notes: "Call before delivery"
    },
    {
      id: 5,
      orderNumber: "ORD-2024-005",
      customer: "Metro Supermarket",
      customerType: "Wholesale",
      orderDate: "2024-01-19",
      deliveryDate: "2024-01-21",
      status: "Cancelled",
      items: [
        { product: "Rainbow Trout", type: "Weight-based", quantity: "30 kg", price: 472.50 }
      ],
      totalAmount: 401.63, // After 15% wholesale discount
      paymentStatus: "Refunded",
      deliveryMethod: "Delivery",
      notes: "Customer cancelled due to oversupply"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "Processing":
        return "bg-blue-100 text-blue-800";
      case "Ready for Pickup":
        return "bg-purple-100 text-purple-800";
      case "Delivered":
        return "bg-green-100 text-green-800";
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
      case "Refunded":
        return "bg-blue-100 text-blue-800";
      case "Overdue":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Pending":
        return <Clock className="h-4 w-4" />;
      case "Processing":
        return <Package className="h-4 w-4" />;
      case "Ready for Pickup":
        return <CheckCircle className="h-4 w-4" />;
      case "Delivered":
        return <Truck className="h-4 w-4" />;
      case "Cancelled":
        return <XCircle className="h-4 w-4" />;
      default:
        return <ShoppingCart className="h-4 w-4" />;
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Order Management</h1>
            <p className="text-muted-foreground">Manage customer orders and fulfillment</p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <PlusCircle className="mr-2 h-4 w-4" /> Create New Order
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="hover-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{ordersData.length}</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>

          <Card className="hover-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {ordersData.filter(o => o.status === "Pending" || o.status === "Processing").length}
              </div>
              <p className="text-xs text-muted-foreground">Need attention</p>
            </CardContent>
          </Card>

          <Card className="hover-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <Package className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${ordersData.filter(o => o.status !== "Cancelled").reduce((sum, o) => sum + o.totalAmount, 0).toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">From active orders</p>
            </CardContent>
          </Card>

          <Card className="hover-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
              <Scale className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${(ordersData.filter(o => o.status !== "Cancelled").reduce((sum, o) => sum + o.totalAmount, 0) / 
                   ordersData.filter(o => o.status !== "Cancelled").length).toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">Per order</p>
            </CardContent>
          </Card>
        </div>

        {/* Orders Management */}
        <Card>
          <CardHeader>
            <CardTitle>Order Management</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search orders..."
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="ready">Ready for Pickup</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              <Select>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Customer type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Customers</SelectItem>
                  <SelectItem value="retail">Retail</SelectItem>
                  <SelectItem value="wholesale">Wholesale</SelectItem>
                  <SelectItem value="restaurant">Restaurant</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" className="w-full md:w-auto">
                <Filter className="mr-2 h-4 w-4" /> Apply Filters
              </Button>
            </div>

            {/* Orders Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 text-sm font-medium">Order #</th>
                    <th className="text-left py-3 px-2 text-sm font-medium">Customer</th>
                    <th className="text-left py-3 px-2 text-sm font-medium">Date</th>
                    <th className="text-left py-3 px-2 text-sm font-medium">Items</th>
                    <th className="text-left py-3 px-2 text-sm font-medium">Total</th>
                    <th className="text-left py-3 px-2 text-sm font-medium">Status</th>
                    <th className="text-left py-3 px-2 text-sm font-medium">Payment</th>
                    <th className="text-right py-3 px-2 text-sm font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {ordersData.map((order) => (
                    <tr key={order.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(order.status)}
                          <span className="font-medium">{order.orderNumber}</span>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <div>
                          <span className="font-medium">{order.customer}</span>
                          <p className="text-xs text-muted-foreground">{order.customerType}</p>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-sm">
                        <div>
                          <div>Order: {order.orderDate}</div>
                          <div className="text-xs text-muted-foreground">
                            Delivery: {order.deliveryDate}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <div className="text-sm">
                          <div>{order.items.length} item(s)</div>
                          <div className="text-xs text-muted-foreground">
                            {order.items[0].product}
                            {order.items.length > 1 && ` +${order.items.length - 1} more`}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-2 font-medium">
                        ${order.totalAmount.toFixed(2)}
                      </td>
                      <td className="py-3 px-2">
                        <Badge className={getStatusColor(order.status)}>
                          {order.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-2">
                        <Badge className={getPaymentStatusColor(order.paymentStatus)}>
                          {order.paymentStatus}
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
      </div>
    </AppLayout>
  );
};

export default Orders;
