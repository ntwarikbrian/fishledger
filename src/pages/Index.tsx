
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Fish, Package, ShoppingCart, TrendingUp, AlertTriangle, DollarSign, Users, Clock, Sparkles, Waves, ChevronDown, Activity, Archive, BarChart3, Check } from "lucide-react";
import { useEffect, useState } from "react";

const Dashboard = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentView, setCurrentView] = useState('top-selling');

  useEffect(() => {
    // Trigger animations on mount
    setIsVisible(true);

    // Update time every minute
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // View options for the dropdown
  const viewOptions = [
    {
      id: 'top-selling',
      label: 'Top Selling Fish',
      icon: TrendingUp,
      description: 'Best performing fish products this month'
    },
    {
      id: 'recent-activity',
      label: 'Recent Sales Activity',
      icon: Activity,
      description: 'Overview of the latest sales and order activities'
    },
    {
      id: 'low-stock',
      label: 'Low Stock Items',
      icon: Archive,
      description: 'Fish products with low inventory levels'
    },
    {
      id: 'revenue-by-product',
      label: 'Revenue by Product',
      icon: BarChart3,
      description: 'Products sorted by revenue performance'
    }
  ];

  const getCurrentViewData = () => {
    const currentViewOption = viewOptions.find(option => option.id === currentView);
    return currentViewOption || viewOptions[0];
  };

  // Data for different views
  const topSellingData = [
    {
      name: 'Atlantic Salmon',
      sales: 245,
      revenue: '$4,890',
      growth: '+18%',
      stock: 'In Stock',
      color: 'bg-blue-500',
      percentage: 85
    },
    {
      name: 'Rainbow Trout',
      sales: 189,
      revenue: '$3,780',
      growth: '+12%',
      stock: 'In Stock',
      color: 'bg-purple-500',
      percentage: 70
    },
    {
      name: 'Tilapia Fillets',
      sales: 156,
      revenue: '$2,340',
      growth: '+8%',
      stock: 'Low Stock',
      color: 'bg-green-500',
      percentage: 55
    },
    {
      name: 'Sea Bass',
      sales: 134,
      revenue: '$2,010',
      growth: '+15%',
      stock: 'In Stock',
      color: 'bg-orange-500',
      percentage: 48
    },
    {
      name: 'Cod Fillets',
      sales: 98,
      revenue: '$1,470',
      growth: '+5%',
      stock: 'In Stock',
      color: 'bg-indigo-500',
      percentage: 35
    }
  ];

  const recentActivityData = [
    { activity: 'New Order', customer: 'Ocean View Restaurant', product: 'Atlantic Salmon (15kg)', amount: '$277.50', date: 'Jan 22, 2024', status: 'Processing' },
    { activity: 'Order Delivered', customer: 'Fresh Market Co', product: 'Tilapia Fillets (20 boxes)', amount: '$259.80', date: 'Jan 22, 2024', status: 'Completed' },
    { activity: 'Payment Received', customer: 'John Smith', product: 'Atlantic Salmon (2 boxes)', amount: '$51.98', date: 'Jan 21, 2024', status: 'Completed' },
    { activity: 'Order Cancelled', customer: 'Metro Supermarket', product: 'Rainbow Trout (30kg)', amount: '$401.63', date: 'Jan 21, 2024', status: 'Cancelled' },
    { activity: 'New Customer', customer: 'Seaside Bistro', product: 'Registration', amount: '-', date: 'Jan 20, 2024', status: 'Active' }
  ];

  const lowStockData = [
    { name: 'Tilapia Fillets', currentStock: 12, minStock: 50, status: 'Critical', color: 'bg-red-500', percentage: 24 },
    { name: 'Cod Fillets', currentStock: 18, minStock: 40, status: 'Low', color: 'bg-yellow-500', percentage: 45 },
    { name: 'Mackerel', currentStock: 25, minStock: 60, status: 'Low', color: 'bg-orange-500', percentage: 42 },
    { name: 'Sardines', currentStock: 8, minStock: 30, status: 'Critical', color: 'bg-red-500', percentage: 27 },
    { name: 'Tuna Steaks', currentStock: 15, minStock: 35, status: 'Low', color: 'bg-yellow-500', percentage: 43 }
  ];

  const revenueByProductData = [
    { name: 'Atlantic Salmon', revenue: '$4,890', orders: 245, avgOrder: '$19.96', color: 'bg-blue-500', percentage: 100 },
    { name: 'Rainbow Trout', revenue: '$3,780', orders: 189, avgOrder: '$20.00', color: 'bg-purple-500', percentage: 77 },
    { name: 'Tilapia Fillets', revenue: '$2,340', orders: 156, avgOrder: '$15.00', color: 'bg-green-500', percentage: 48 },
    { name: 'Sea Bass', revenue: '$2,010', orders: 134, avgOrder: '$15.00', color: 'bg-orange-500', percentage: 41 },
    { name: 'Cod Fillets', revenue: '$1,470', orders: 98, avgOrder: '$15.00', color: 'bg-indigo-500', percentage: 30 }
  ];

  // Render functions for different views
  const renderTopSellingView = () => (
    <div className="space-y-4">
      {topSellingData.map((fish, index) => (
        <div key={index} className="group p-4 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/50 hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/20 dark:hover:to-purple-900/20 transition-all duration-300 hover:shadow-md">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${fish.color} animate-pulse`} />
              <div>
                <h3 className="font-semibold text-gray-800 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {fish.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {fish.sales} units sold
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="font-bold text-gray-800 dark:text-gray-200">
                {fish.revenue}
              </div>
              <div className="flex items-center gap-1 text-sm">
                <span className="text-green-600 font-medium">{fish.growth}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  fish.stock === 'In Stock'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                }`}>
                  {fish.stock}
                </span>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${fish.color} transition-all duration-1000 ease-out`}
                style={{ width: `${fish.percentage}%` }}
              />
            </div>
            <div className="absolute right-0 -top-6 text-xs text-muted-foreground">
              {fish.percentage}% of target
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderRecentActivityView = () => (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left py-3 px-2 text-sm">Activity</th>
            <th className="text-left py-3 px-2 text-sm">Customer</th>
            <th className="text-left py-3 px-2 text-sm">Product</th>
            <th className="text-left py-3 px-2 text-sm">Amount</th>
            <th className="text-left py-3 px-2 text-sm">Date</th>
            <th className="text-right py-3 px-2 text-sm">Status</th>
          </tr>
        </thead>
        <tbody>
          {recentActivityData.map((activity, index) => (
            <tr key={index} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
              <td className="py-3 px-2">
                <div className="flex items-center gap-2">
                  {activity.activity === 'New Order' && <ShoppingCart className="h-4 w-4 text-blue-600" />}
                  {activity.activity === 'Order Delivered' && <Package className="h-4 w-4 text-green-600" />}
                  {activity.activity === 'Payment Received' && <DollarSign className="h-4 w-4 text-green-600" />}
                  {activity.activity === 'Order Cancelled' && <AlertTriangle className="h-4 w-4 text-red-600" />}
                  {activity.activity === 'New Customer' && <Users className="h-4 w-4 text-purple-600" />}
                  <div>
                    <div className="font-medium">{activity.activity}</div>
                  </div>
                </div>
              </td>
              <td className="py-3 px-2">{activity.customer}</td>
              <td className="py-3 px-2 text-muted-foreground">{activity.product}</td>
              <td className="py-3 px-2 font-medium">{activity.amount}</td>
              <td className="py-3 px-2">{activity.date}</td>
              <td className="py-3 px-2 text-right">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                  activity.status === 'Completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                  activity.status === 'Processing' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                  activity.status === 'Active' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' :
                  activity.status === 'Cancelled' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                  'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                }`}>
                  {activity.status}
                </span>
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
            <th className="text-left py-3 px-2 text-sm">Product</th>
            <th className="text-left py-3 px-2 text-sm">Current Stock</th>
            <th className="text-left py-3 px-2 text-sm">Minimum Stock</th>
            <th className="text-left py-3 px-2 text-sm">Stock Level</th>
            <th className="text-left py-3 px-2 text-sm">Need to Order</th>
            <th className="text-right py-3 px-2 text-sm">Status</th>
          </tr>
        </thead>
        <tbody>
          {lowStockData.map((item, index) => (
            <tr key={index} className="border-b hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors">
              <td className="py-3 px-2">
                <div className="flex items-center gap-2">
                  <Archive className="h-4 w-4 text-red-600" />
                  <div>
                    <div className="font-medium">{item.name}</div>
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
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                  item.status === 'Critical'
                    ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                }`}>
                  {item.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderRevenueByProductView = () => (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left py-3 px-2 text-sm">Product</th>
            <th className="text-left py-3 px-2 text-sm">Total Revenue</th>
            <th className="text-left py-3 px-2 text-sm">Orders</th>
            <th className="text-left py-3 px-2 text-sm">Avg Order Value</th>
            <th className="text-left py-3 px-2 text-sm">Performance</th>
            <th className="text-right py-3 px-2 text-sm">Rank</th>
          </tr>
        </thead>
        <tbody>
          {revenueByProductData.map((product, index) => (
            <tr key={index} className="border-b hover:bg-green-50 dark:hover:bg-green-900/10 transition-colors">
              <td className="py-3 px-2">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-green-600" />
                  <div>
                    <div className="font-medium">{product.name}</div>
                  </div>
                </div>
              </td>
              <td className="py-3 px-2">
                <span className="font-bold text-lg text-green-600">{product.revenue}</span>
              </td>
              <td className="py-3 px-2 text-muted-foreground">
                {product.orders} orders
              </td>
              <td className="py-3 px-2 font-medium">
                {product.avgOrder}
              </td>
              <td className="py-3 px-2">
                <div className="flex items-center gap-2">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 max-w-[100px]">
                    <div
                      className={`h-2 rounded-full ${product.color} transition-all duration-1000 ease-out`}
                      style={{ width: `${product.percentage}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground min-w-[40px]">
                    {product.percentage}%
                  </span>
                </div>
              </td>
              <td className="py-3 px-2 text-right">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  index === 0 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                  index === 1 ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                  index === 2 ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' :
                  'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                }`}>
                  #{index + 1}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderCurrentView = () => {
    switch (currentView) {
      case 'top-selling':
        return renderTopSellingView();
      case 'recent-activity':
        return renderRecentActivityView();
      case 'low-stock':
        return renderLowStockView();
      case 'revenue-by-product':
        return renderRevenueByProductView();
      default:
        return renderTopSellingView();
    }
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const formatTime = () => {
    return currentTime.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = () => {
    return currentTime.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <AppLayout>
      <div className="space-y-4">
        {/* Beautiful Welcome Section */}
        <div className="relative overflow-hidden welcome-glow rounded-3xl">
          {/* Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/20 dark:via-indigo-950/20 dark:to-purple-950/20 rounded-3xl" />

          {/* Animated Background Elements */}
          <div className="absolute inset-0 overflow-hidden rounded-3xl">
            <div className="floating-element absolute -top-2 -right-2 w-16 h-16 bg-blue-200/30 dark:bg-blue-800/20 rounded-full" />
            <div className="floating-element absolute top-4 right-8 w-12 h-12 bg-purple-200/30 dark:bg-purple-800/20 rounded-full" />
            <div className="floating-element absolute bottom-2 left-4 w-14 h-14 bg-indigo-200/30 dark:bg-indigo-800/20 rounded-full" />
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-blue-100/10 to-purple-100/10 dark:from-blue-900/10 dark:to-purple-900/10 rounded-full blur-3xl animate-pulse" />
          </div>

          {/* Content */}
          <div className="relative p-4 md:p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              {/* Welcome Text */}
              <div className="space-y-2">
                <div className={`transform transition-all duration-1000 ease-out ${
                  isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
                }`}>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="relative">
                      <Waves className="h-6 w-6 text-blue-500 animate-pulse" />
                      <Sparkles className="h-3 w-3 text-yellow-400 absolute -top-0.5 -right-0.5 animate-spin" style={{ animationDuration: '3s' }} />
                    </div>
                    <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">
                      FishSell Pro
                    </span>
                  </div>

                  <h1 className="text-2xl lg:text-3xl font-bold leading-tight">
                    <span className="gradient-text">
                      {getGreeting()}, Admin!
                    </span>
                    <span className="ml-2 text-gray-800 dark:text-gray-100">👋</span>
                  </h1>

                  <p className="text-sm text-muted-foreground/80 font-medium">
                    Ready to dive into today's fish sales insights
                  </p>
                </div>
              </div>

              {/* Time and Date */}
              <div className={`transform transition-all duration-1000 ease-out ${
                isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
              }`} style={{ transitionDelay: '200ms' }}>
                <div className="text-right lg:text-right">
                  <div className="text-xl lg:text-2xl font-bold text-gray-800 dark:text-gray-200 mb-0.5">
                    {formatTime()}
                  </div>
                  <div className="text-xs text-muted-foreground font-medium">
                    {formatDate()}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats Bar */}
            <div className={`mt-4 transform transition-all duration-1000 ease-out ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            }`} style={{ transitionDelay: '400ms' }}>
              <div className="flex flex-wrap gap-2 text-xs">
                <div className="group flex items-center gap-1.5 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm px-3 py-1.5 rounded-full hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-300 cursor-pointer hover:scale-105">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse group-hover:animate-bounce" />
                  <span className="font-medium">System Online</span>
                </div>
                <div className="group flex items-center gap-1.5 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm px-3 py-1.5 rounded-full hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-300 cursor-pointer hover:scale-105">
                  <Fish className="h-3 w-3 text-blue-500 group-hover:animate-pulse" />
                  <span className="font-medium">12 Products Active</span>
                </div>
                <div className="group flex items-center gap-1.5 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm px-3 py-1.5 rounded-full hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-300 cursor-pointer hover:scale-105">
                  <TrendingUp className="h-3 w-3 text-green-500 group-hover:animate-bounce" />
                  <span className="font-medium">Sales Up 15%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="hover-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$18,450</div>
              <p className="text-xs text-muted-foreground">+15% from last month</p>
            </CardContent>
          </Card>

          <Card className="hover-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Products in Stock</CardTitle>
              <Package className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">5 different fish types</p>
            </CardContent>
          </Card>

          <Card className="hover-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8</div>
              <p className="text-xs text-muted-foreground">Need processing</p>
            </CardContent>
          </Card>

          <Card className="hover-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
              <Users className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24</div>
              <p className="text-xs text-muted-foreground">6 new this month</p>
            </CardContent>
          </Card>
        </div>
        
        {/* Dynamic Data View Card */}
        <Card className="hover-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {(() => {
                  const IconComponent = getCurrentViewData().icon;
                  return <IconComponent className="h-5 w-5 text-green-600" />;
                })()}
                <div>
                  <CardTitle>{getCurrentViewData().label}</CardTitle>
                  <CardDescription>{getCurrentViewData().description}</CardDescription>
                </div>
              </div>

              {/* View Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    View
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {viewOptions.map((option) => {
                    const IconComponent = option.icon;
                    return (
                      <DropdownMenuItem
                        key={option.id}
                        onClick={() => setCurrentView(option.id)}
                        className="flex items-center gap-3 cursor-pointer"
                      >
                        <IconComponent className="h-4 w-4" />
                        <span className="flex-1">{option.label}</span>
                        {currentView === option.id && (
                          <Check className="h-4 w-4 text-green-600" />
                        )}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent>
            <div className="transition-all duration-300 ease-in-out">
              {renderCurrentView()}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
