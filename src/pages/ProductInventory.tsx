import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Fish, PlusCircle, Search, Filter, Edit, Trash2, Package, Scale } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ProductInventory = () => {
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

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Product Inventory</h1>
            <p className="text-muted-foreground">Manage fish products, stock levels, and pricing</p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Product
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="hover-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Fish className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{productData.length}</div>
              <p className="text-xs text-muted-foreground">Active products</p>
            </CardContent>
          </Card>

          <Card className="hover-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
              <Package className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {productData.filter(p => p.status === "Low Stock" || p.status === "Critical Stock").length}
              </div>
              <p className="text-xs text-muted-foreground">Need restocking</p>
            </CardContent>
          </Card>

          <Card className="hover-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Stock Value</CardTitle>
              <Scale className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$12,450</div>
              <p className="text-xs text-muted-foreground">Estimated value</p>
            </CardContent>
          </Card>

          <Card className="hover-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
              <Filter className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2</div>
              <p className="text-xs text-muted-foreground">Within 3 days</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <CardTitle>Product Inventory Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search products..."
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="premium">Premium Fish</SelectItem>
                  <SelectItem value="freshwater">Fresh Water Fish</SelectItem>
                  <SelectItem value="processed">Processed Fish</SelectItem>
                  <SelectItem value="white">White Fish</SelectItem>
                </SelectContent>
              </Select>

              <Select>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="in-stock">In Stock</SelectItem>
                  <SelectItem value="low-stock">Low Stock</SelectItem>
                  <SelectItem value="critical">Critical Stock</SelectItem>
                  <SelectItem value="out-of-stock">Out of Stock</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" className="w-full md:w-auto">
                <Filter className="mr-2 h-4 w-4" /> Apply Filters
              </Button>
            </div>

            {/* Product Inventory Table */}
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
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default ProductInventory;
