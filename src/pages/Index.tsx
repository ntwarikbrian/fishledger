
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Fish, Package, ShoppingCart, TrendingUp, AlertTriangle, DollarSign, Users, Clock, Sparkles, Waves } from "lucide-react";
import { useEffect, useState } from "react";

const Dashboard = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Trigger animations on mount
    setIsVisible(true);

    // Update time every minute
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

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
        
        {/* Recent Sales Activities */}
        <Card className="hover-card">
          <CardHeader>
            <CardTitle>Recent Sales Activities</CardTitle>
            <CardDescription>Overview of the latest sales and order activities</CardDescription>
          </CardHeader>
          <CardContent>
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
                  {[
                    { activity: 'New Order', customer: 'Ocean View Restaurant', product: 'Atlantic Salmon (15kg)', amount: '$277.50', date: 'Jan 22, 2024', status: 'Processing' },
                    { activity: 'Order Delivered', customer: 'Fresh Market Co', product: 'Tilapia Fillets (20 boxes)', amount: '$259.80', date: 'Jan 22, 2024', status: 'Completed' },
                    { activity: 'Payment Received', customer: 'John Smith', product: 'Atlantic Salmon (2 boxes)', amount: '$51.98', date: 'Jan 21, 2024', status: 'Completed' },
                    { activity: 'Order Cancelled', customer: 'Metro Supermarket', product: 'Rainbow Trout (30kg)', amount: '$401.63', date: 'Jan 21, 2024', status: 'Cancelled' },
                    { activity: 'New Customer', customer: 'Seaside Bistro', product: 'Registration', amount: '-', date: 'Jan 20, 2024', status: 'Active' }
                  ].map((activity, index) => (
                      <tr key={index} className="border-b">
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
                            activity.status === 'Completed' ? 'bg-green-100 text-green-800' :
                            activity.status === 'Processing' ? 'bg-blue-100 text-blue-800' :
                            activity.status === 'Active' ? 'bg-purple-100 text-purple-800' :
                            activity.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {activity.status}
                          </span>
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

export default Dashboard;
