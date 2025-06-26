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
  Truck,
  BarChart3,
  Receipt,
  FileText,
  AlertTriangle,
  FolderOpen
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

const Sales = () => {
  // Mock data for sales
  const salesData = [
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
            <h1 className="text-3xl font-bold">Sales Management</h1>
            <p className="text-muted-foreground">Track all sales whether box-based or by weight</p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Sale
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="hover-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
              <ShoppingCart className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{salesData.length}</div>
              <p className="text-xs text-muted-foreground">All time sales</p>
            </CardContent>
          </Card>

          <Card className="hover-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Boxed Sales</CardTitle>
              <Package className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {salesData.filter(s => s.items.some(item => item.type === "Boxed")).length}
              </div>
              <p className="text-xs text-muted-foreground">Box-based sales</p>
            </CardContent>
          </Card>

          <Card className="hover-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Weight Sales</CardTitle>
              <Scale className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {salesData.filter(s => s.items.some(item => item.type === "Weight-based")).length}
              </div>
              <p className="text-xs text-muted-foreground">Kilogram sales</p>
            </CardContent>
          </Card>

          <Card className="hover-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <BarChart3 className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${salesData.reduce((sum, sale) => sum + sale.totalAmount, 0).toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">From all sales</p>
            </CardContent>
          </Card>
        </div>

        {/* Sales Management */}
        <Card>
          <CardHeader>
            <CardTitle>Sales Management</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="add-sale" className="w-full">
              <TabsList className="grid w-full grid-cols-7">
                <TabsTrigger value="add-sale">➕ Add Sale</TabsTrigger>
                <TabsTrigger value="history">📊 Sales History</TabsTrigger>
                <TabsTrigger value="invoice">🧾 Invoice Generator</TabsTrigger>
                <TabsTrigger value="boxed">📦 Boxed Sales</TabsTrigger>
                <TabsTrigger value="kg">⚖️ Kg Sales</TabsTrigger>
                <TabsTrigger value="damaged">❌ Damaged/Returned</TabsTrigger>
                <TabsTrigger value="receipts">📁 Receipts & Audit</TabsTrigger>
              </TabsList>

              <TabsContent value="add-sale" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Add New Sale</h3>
                  <Button className="bg-green-600 hover:bg-green-700">
                    <PlusCircle className="mr-2 h-4 w-4" /> Create Sale
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Customer</label>
                      <Input placeholder="Select or add customer" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Sale Type</label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select sale type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="boxed">Boxed Sale</SelectItem>
                          <SelectItem value="weight">Weight-based Sale</SelectItem>
                          <SelectItem value="mixed">Mixed Sale</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Payment Method</label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="card">Card</SelectItem>
                          <SelectItem value="transfer">Bank Transfer</SelectItem>
                          <SelectItem value="credit">Credit</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Notes</label>
                      <Input placeholder="Additional notes" />
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="history" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Sales History</h3>
                  <div className="flex gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search sales..."
                        className="pl-10 w-64"
                      />
                    </div>
                    <Button variant="outline">
                      <Filter className="mr-2 h-4 w-4" /> Filter
                    </Button>
                  </div>
                </div>

                {/* Sales History Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-2 text-sm font-medium">Sale #</th>
                        <th className="text-left py-3 px-2 text-sm font-medium">Customer</th>
                        <th className="text-left py-3 px-2 text-sm font-medium">Date</th>
                        <th className="text-left py-3 px-2 text-sm font-medium">Type</th>
                        <th className="text-left py-3 px-2 text-sm font-medium">Items</th>
                        <th className="text-left py-3 px-2 text-sm font-medium">Total</th>
                        <th className="text-left py-3 px-2 text-sm font-medium">Payment</th>
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
                              <p className="text-xs text-muted-foreground">{sale.customerType}</p>
                            </div>
                          </td>
                          <td className="py-3 px-2 text-sm text-muted-foreground">
                            {sale.orderDate}
                          </td>
                          <td className="py-3 px-2">
                            <Badge variant="outline">
                              {sale.items.some(item => item.type === "Boxed") && sale.items.some(item => item.type === "Weight-based")
                                ? "Mixed"
                                : sale.items[0]?.type || "N/A"}
                            </Badge>
                          </td>
                          <td className="py-3 px-2">
                            <div className="text-sm">
                              <div className="font-medium">{sale.items[0]?.product}</div>
                              <div className="text-xs text-muted-foreground">
                                {sale.items[0]?.quantity}
                                {sale.items.length > 1 && ` +${sale.items.length - 1} more`}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-2 font-medium">
                            ${sale.totalAmount.toFixed(2)}
                          </td>
                          <td className="py-3 px-2">
                            <Badge className={sale.paymentStatus === "Paid" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                              {sale.paymentStatus}
                            </Badge>
                          </td>
                          <td className="py-3 px-2">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Receipt className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>

              <TabsContent value="invoice" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Customer Invoice Generator</h3>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <FileText className="mr-2 h-4 w-4" /> Generate Invoice
                  </Button>
                </div>
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4" />
                  <p>Select a customer and sale to generate an invoice</p>
                </div>
              </TabsContent>

              <TabsContent value="boxed" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Boxed Sales</h3>
                  <div className="text-sm text-muted-foreground">
                    Total: {salesData.filter(s => s.items.some(item => item.type === "Boxed")).length} sales
                  </div>
                </div>
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4" />
                  <p>View all box-based fish sales</p>
                </div>
              </TabsContent>

              <TabsContent value="kg" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Kilogram Sales</h3>
                  <div className="text-sm text-muted-foreground">
                    Total: {salesData.filter(s => s.items.some(item => item.type === "Weight-based")).length} sales
                  </div>
                </div>
                <div className="text-center py-8 text-muted-foreground">
                  <Scale className="h-12 w-12 mx-auto mb-4" />
                  <p>View all weight-based fish sales</p>
                </div>
              </TabsContent>

              <TabsContent value="damaged" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Damaged/Returned Items</h3>
                  <Button variant="outline">
                    <AlertTriangle className="mr-2 h-4 w-4" /> Report Damage
                  </Button>
                </div>
                <div className="text-center py-8 text-muted-foreground">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
                  <p>Track damaged or returned fish products</p>
                </div>
              </TabsContent>

              <TabsContent value="receipts" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Receipts & Audit Trail</h3>
                  <Button variant="outline">
                    <FolderOpen className="mr-2 h-4 w-4" /> View Archive
                  </Button>
                </div>
                <div className="text-center py-8 text-muted-foreground">
                  <FolderOpen className="h-12 w-12 mx-auto mb-4" />
                  <p>Access all receipts and transaction records</p>
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
