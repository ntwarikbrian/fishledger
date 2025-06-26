import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Users, 
  PlusCircle, 
  Search, 
  Filter, 
  Edit, 
  Eye, 
  Phone,
  Mail,
  MapPin,
  Building,
  User,
  Store
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

const Customers = () => {
  // Mock data for customers
  const customersData = [
    {
      id: 1,
      name: "Ocean View Restaurant",
      type: "Restaurant",
      contact: "Sarah Johnson",
      email: "sarah@oceanview.com",
      phone: "+1 (555) 123-4567",
      address: "123 Coastal Drive, Seaside City, SC 12345",
      totalOrders: 15,
      totalSpent: 2850.75,
      lastOrderDate: "2024-01-22",
      status: "Active",
      paymentTerms: "Net 30",
      discount: 10,
      notes: "Prefers early morning deliveries"
    },
    {
      id: 2,
      name: "Fresh Market Co",
      type: "Wholesale",
      contact: "Mike Chen",
      email: "mike@freshmarket.com",
      phone: "+1 (555) 234-5678",
      address: "456 Market Street, Commerce City, CC 23456",
      totalOrders: 28,
      totalSpent: 8950.25,
      lastOrderDate: "2024-01-21",
      status: "Active",
      paymentTerms: "Net 15",
      discount: 15,
      notes: "Large volume orders, pickup preferred"
    },
    {
      id: 3,
      name: "John Smith",
      type: "Retail",
      contact: "John Smith",
      email: "john.smith@email.com",
      phone: "+1 (555) 345-6789",
      address: "789 Residential Ave, Hometown, HT 34567",
      totalOrders: 5,
      totalSpent: 245.90,
      lastOrderDate: "2024-01-20",
      status: "Active",
      paymentTerms: "Immediate",
      discount: 0,
      notes: "Regular customer, prefers weekend delivery"
    },
    {
      id: 4,
      name: "Seaside Bistro",
      type: "Restaurant",
      contact: "Emma Rodriguez",
      email: "emma@seasidebistro.com",
      phone: "+1 (555) 456-7890",
      address: "321 Harbor View, Port City, PC 45678",
      totalOrders: 12,
      totalSpent: 1875.50,
      lastOrderDate: "2024-01-22",
      status: "Active",
      paymentTerms: "Net 30",
      discount: 10,
      notes: "Requires call before delivery"
    },
    {
      id: 5,
      name: "Metro Supermarket",
      type: "Wholesale",
      contact: "David Wilson",
      email: "david@metrosuper.com",
      phone: "+1 (555) 567-8901",
      address: "654 Shopping Plaza, Metro City, MC 56789",
      totalOrders: 8,
      totalSpent: 3200.00,
      lastOrderDate: "2024-01-15",
      status: "Inactive",
      paymentTerms: "Net 15",
      discount: 15,
      notes: "Seasonal customer, high volume orders"
    },
    {
      id: 6,
      name: "Maria Garcia",
      type: "Retail",
      contact: "Maria Garcia",
      email: "maria.garcia@email.com",
      phone: "+1 (555) 678-9012",
      address: "987 Family Street, Neighborhood, NH 67890",
      totalOrders: 3,
      totalSpent: 125.75,
      lastOrderDate: "2024-01-18",
      status: "Active",
      paymentTerms: "Immediate",
      discount: 0,
      notes: "New customer, small orders"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800";
      case "Inactive":
        return "bg-yellow-100 text-yellow-800";
      case "Suspended":
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

  const getCustomerTypeIcon = (type: string) => {
    switch (type) {
      case "Wholesale":
        return <Building className="h-4 w-4" />;
      case "Restaurant":
        return <Store className="h-4 w-4" />;
      case "Retail":
        return <User className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  // Customer statistics
  const customerStats = {
    total: customersData.length,
    active: customersData.filter(c => c.status === "Active").length,
    wholesale: customersData.filter(c => c.type === "Wholesale").length,
    restaurant: customersData.filter(c => c.type === "Restaurant").length,
    retail: customersData.filter(c => c.type === "Retail").length,
    totalRevenue: customersData.reduce((sum, c) => sum + c.totalSpent, 0)
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Customer Management</h1>
            <p className="text-muted-foreground">Manage customer relationships and information</p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Customer
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="hover-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{customerStats.total}</div>
              <p className="text-xs text-muted-foreground">{customerStats.active} active</p>
            </CardContent>
          </Card>

          <Card className="hover-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Wholesale</CardTitle>
              <Building className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{customerStats.wholesale}</div>
              <p className="text-xs text-muted-foreground">High volume buyers</p>
            </CardContent>
          </Card>

          <Card className="hover-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Restaurants</CardTitle>
              <Store className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{customerStats.restaurant}</div>
              <p className="text-xs text-muted-foreground">Commercial buyers</p>
            </CardContent>
          </Card>

          <Card className="hover-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <User className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${customerStats.totalRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">From all customers</p>
            </CardContent>
          </Card>
        </div>

        {/* Customer Management */}
        <Tabs defaultValue="list" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="list">Customer List</TabsTrigger>
            <TabsTrigger value="analytics">Customer Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Customer Directory</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Search and Filters */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        placeholder="Search customers..."
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <Select>
                    <SelectTrigger className="w-full md:w-48">
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="retail">Retail</SelectItem>
                      <SelectItem value="wholesale">Wholesale</SelectItem>
                      <SelectItem value="restaurant">Restaurant</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select>
                    <SelectTrigger className="w-full md:w-48">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button variant="outline" className="w-full md:w-auto">
                    <Filter className="mr-2 h-4 w-4" /> Apply Filters
                  </Button>
                </div>

                {/* Customer Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {customersData.map((customer) => (
                    <Card key={customer.id} className="hover-card">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            {getCustomerTypeIcon(customer.type)}
                            <div>
                              <CardTitle className="text-lg">{customer.name}</CardTitle>
                              <p className="text-sm text-muted-foreground">{customer.contact}</p>
                            </div>
                          </div>
                          <div className="flex flex-col gap-1">
                            <Badge className={getCustomerTypeColor(customer.type)}>
                              {customer.type}
                            </Badge>
                            <Badge className={getStatusColor(customer.status)}>
                              {customer.status}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">{customer.email}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">{customer.phone}</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <span className="text-muted-foreground text-xs">{customer.address}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Total Orders:</span>
                            <p className="text-muted-foreground">{customer.totalOrders}</p>
                          </div>
                          <div>
                            <span className="font-medium">Total Spent:</span>
                            <p className="text-muted-foreground">${customer.totalSpent.toFixed(2)}</p>
                          </div>
                          <div>
                            <span className="font-medium">Last Order:</span>
                            <p className="text-muted-foreground">{customer.lastOrderDate}</p>
                          </div>
                          <div>
                            <span className="font-medium">Discount:</span>
                            <p className="text-muted-foreground">{customer.discount}%</p>
                          </div>
                        </div>

                        {customer.notes && (
                          <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                            <strong>Notes:</strong> {customer.notes}
                          </div>
                        )}

                        <div className="flex justify-end gap-2 pt-4">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Customer Type Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-purple-600" />
                        Wholesale
                      </span>
                      <span className="font-medium">{customerStats.wholesale} customers</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-2">
                        <Store className="h-4 w-4 text-blue-600" />
                        Restaurant
                      </span>
                      <span className="font-medium">{customerStats.restaurant} customers</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-2">
                        <User className="h-4 w-4 text-green-600" />
                        Retail
                      </span>
                      <span className="font-medium">{customerStats.retail} customers</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Customers by Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {customersData
                      .sort((a, b) => b.totalSpent - a.totalSpent)
                      .slice(0, 5)
                      .map((customer, index) => (
                        <div key={customer.id} className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">#{index + 1}</span>
                            <span className="text-sm">{customer.name}</span>
                          </div>
                          <span className="font-medium">${customer.totalSpent.toFixed(2)}</span>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Customers;
