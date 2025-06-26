import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Fish, PlusCircle, Search, Filter, Edit, Trash2, Package, Scale, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ProductCatalog = () => {
  // Mock data for fish product catalog
  const catalogData = [
    {
      id: 1,
      name: "Atlantic Salmon",
      category: "Premium Fish",
      description: "Fresh Atlantic salmon, rich in omega-3 fatty acids. Perfect for grilling, baking, or sashimi.",
      origin: "Norway",
      sellingTypes: ["Boxed", "Weight-based"],
      boxOptions: [
        { weight: "1.5 kg", price: 25.99 },
        { weight: "2.0 kg", price: 34.50 }
      ],
      pricePerKg: 18.50,
      minOrderQty: 1,
      shelfLife: "5 days",
      storageTemp: "0-4°C",
      nutritionInfo: "High in protein, omega-3",
      status: "Active",
      image: "/placeholder.svg"
    },
    {
      id: 2,
      name: "Rainbow Trout",
      category: "Fresh Water Fish",
      description: "Farm-raised rainbow trout with delicate flavor. Ideal for pan-frying or steaming.",
      origin: "Local Farms",
      sellingTypes: ["Weight-based"],
      boxOptions: [],
      pricePerKg: 15.75,
      minOrderQty: 2,
      shelfLife: "4 days",
      storageTemp: "0-4°C",
      nutritionInfo: "Lean protein, vitamin D",
      status: "Active",
      image: "/placeholder.svg"
    },
    {
      id: 3,
      name: "Tilapia Fillets",
      category: "Processed Fish",
      description: "Boneless tilapia fillets, ready to cook. Mild flavor suitable for all cooking methods.",
      origin: "Vietnam",
      sellingTypes: ["Boxed"],
      boxOptions: [
        { weight: "800g", price: 12.99 },
        { weight: "1.2 kg", price: 18.50 }
      ],
      pricePerKg: 0,
      minOrderQty: 5,
      shelfLife: "7 days",
      storageTemp: "0-4°C",
      nutritionInfo: "Low fat, high protein",
      status: "Active",
      image: "/placeholder.svg"
    },
    {
      id: 4,
      name: "Sea Bass",
      category: "Premium Fish",
      description: "Mediterranean sea bass with firm texture and delicate taste. Premium quality fish.",
      origin: "Mediterranean",
      sellingTypes: ["Boxed", "Weight-based"],
      boxOptions: [
        { weight: "1.2 kg", price: 32.50 }
      ],
      pricePerKg: 22.00,
      minOrderQty: 1,
      shelfLife: "5 days",
      storageTemp: "0-4°C",
      nutritionInfo: "High protein, low mercury",
      status: "Active",
      image: "/placeholder.svg"
    },
    {
      id: 5,
      name: "Cod Fillets",
      category: "White Fish",
      description: "Premium cod fillets, sustainably sourced. Perfect for fish and chips or baking.",
      origin: "North Atlantic",
      sellingTypes: ["Weight-based"],
      boxOptions: [],
      pricePerKg: 24.99,
      minOrderQty: 3,
      shelfLife: "6 days",
      storageTemp: "0-4°C",
      nutritionInfo: "Very lean, high protein",
      status: "Seasonal",
      image: "/placeholder.svg"
    }
  ];

  // Pricing tiers for different customer types
  const pricingTiers = [
    {
      customerType: "Retail",
      discount: 0,
      minOrder: 0,
      description: "Standard retail pricing"
    },
    {
      customerType: "Wholesale",
      discount: 15,
      minOrder: 50,
      description: "15% discount for orders over $50"
    },
    {
      customerType: "Restaurant",
      discount: 10,
      minOrder: 100,
      description: "10% discount for orders over $100"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800";
      case "Seasonal":
        return "bg-yellow-100 text-yellow-800";
      case "Discontinued":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Product Catalog</h1>
            <p className="text-muted-foreground">Manage fish products, pricing, and catalog information</p>
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
              <div className="text-2xl font-bold">{catalogData.length}</div>
              <p className="text-xs text-muted-foreground">In catalog</p>
            </CardContent>
          </Card>

          <Card className="hover-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Products</CardTitle>
              <Package className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {catalogData.filter(p => p.status === "Active").length}
              </div>
              <p className="text-xs text-muted-foreground">Currently available</p>
            </CardContent>
          </Card>

          <Card className="hover-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Avg Price/kg</CardTitle>
              <DollarSign className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$19.35</div>
              <p className="text-xs text-muted-foreground">Across all products</p>
            </CardContent>
          </Card>

          <Card className="hover-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Categories</CardTitle>
              <Filter className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">4</div>
              <p className="text-xs text-muted-foreground">Product categories</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="products" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="products">Product Catalog</TabsTrigger>
            <TabsTrigger value="pricing">Pricing Management</TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Product Catalog Management</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Search and Filters */}
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
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="seasonal">Seasonal</SelectItem>
                      <SelectItem value="discontinued">Discontinued</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Product Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {catalogData.map((product) => (
                    <Card key={product.id} className="hover-card">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            <Fish className="h-5 w-5 text-blue-600" />
                            <div>
                              <CardTitle className="text-lg">{product.name}</CardTitle>
                              <p className="text-sm text-muted-foreground">{product.category}</p>
                            </div>
                          </div>
                          <Badge className={getStatusColor(product.status)}>
                            {product.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">{product.description}</p>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Origin:</span>
                            <p className="text-muted-foreground">{product.origin}</p>
                          </div>
                          <div>
                            <span className="font-medium">Shelf Life:</span>
                            <p className="text-muted-foreground">{product.shelfLife}</p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <span className="font-medium text-sm">Selling Options:</span>
                          <div className="flex flex-wrap gap-2">
                            {product.sellingTypes.map((type) => (
                              <Badge key={type} variant="outline" className="text-xs">
                                {type === "Boxed" ? <Package className="h-3 w-3 mr-1" /> : <Scale className="h-3 w-3 mr-1" />}
                                {type}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <span className="font-medium text-sm">Pricing:</span>
                          {product.boxOptions.length > 0 && (
                            <div className="text-sm">
                              {product.boxOptions.map((box, index) => (
                                <div key={index} className="flex justify-between">
                                  <span>{box.weight} box:</span>
                                  <span className="font-medium">${box.price}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          {product.pricePerKg > 0 && (
                            <div className="text-sm flex justify-between">
                              <span>Per kg:</span>
                              <span className="font-medium">${product.pricePerKg}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                            <Trash2 className="h-4 w-4 mr-1" />
                            Remove
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pricing" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Pricing Tiers & Customer Types</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Manage pricing strategies for different customer segments
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {pricingTiers.map((tier, index) => (
                    <Card key={index} className="hover-card">
                      <CardHeader>
                        <CardTitle className="text-lg">{tier.customerType}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-blue-600">
                            {tier.discount}%
                          </div>
                          <p className="text-sm text-muted-foreground">Discount</p>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Min Order:</span>
                            <span className="font-medium">${tier.minOrder}</span>
                          </div>
                        </div>
                        
                        <p className="text-xs text-muted-foreground">{tier.description}</p>
                        
                        <Button variant="outline" className="w-full">
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Pricing
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default ProductCatalog;
