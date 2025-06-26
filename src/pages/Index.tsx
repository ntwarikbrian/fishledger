
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Fish, Package, ShoppingCart, TrendingUp, AlertTriangle, DollarSign, Users, Clock } from "lucide-react";

const Dashboard = () => {
  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Fish Sales Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, Sales Manager</p>
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
