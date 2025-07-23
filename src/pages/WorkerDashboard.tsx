/**
 * Worker Dashboard Page
 * A beautiful dashboard specifically designed for workers with limited but focused functionality
 * Maintains design consistency with admin dashboard but shows worker-relevant information
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Fish,
  Package,
  ShoppingCart,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  User,
  Settings,
  LogOut,
  Bell,
  Eye,
  Activity,
  BarChart3,
  FileText,
  Target,
  Award,
  Zap,
  DollarSign
} from 'lucide-react';
import { usePageTitle } from '@/hooks/use-page-title';
import { CompactLanguageSwitcher } from '@/components/ui/language-switcher';
import { useNavigate } from 'react-router-dom';

interface WorkerStats {
  todaySales: number;
  weekSales: number;
  monthSales: number;
  tasksCompleted: number;
  tasksTotal: number;
  revenue: number;
}

interface RecentActivity {
  id: string;
  type: 'sale' | 'task' | 'inventory' | 'notification';
  title: string;
  description: string;
  timestamp: string;
  status: 'completed' | 'pending' | 'warning';
  amount?: number;
}

const WorkerDashboard = () => {
  const { t } = useTranslation();
  usePageTitle('worker.dashboardTitle', 'Worker Dashboard');
  const navigate = useNavigate();

  // Get worker info from localStorage
  const workerFullName = localStorage.getItem('workerFullName') || 'Worker';
  const workerEmail = localStorage.getItem('userEmail') || '';
  const businessName = localStorage.getItem('businessName') || 'Business';
  const workerRole = localStorage.getItem('workerRole') || 'employee';

  const [stats, setStats] = useState<WorkerStats>({
    todaySales: 0,
    weekSales: 0,
    monthSales: 0,
    tasksCompleted: 8,
    tasksTotal: 12,
    revenue: 0
  });

  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([
    {
      id: '1',
      type: 'sale',
      title: 'Fish Sale Completed',
      description: 'Sold 2kg Salmon to Customer #C001',
      timestamp: '2 hours ago',
      status: 'completed',
      amount: 45.00
    },
    {
      id: '2',
      type: 'task',
      title: 'Inventory Update',
      description: 'Updated stock levels for Tuna',
      timestamp: '4 hours ago',
      status: 'completed'
    },
    {
      id: '3',
      type: 'inventory',
      title: 'Low Stock Alert',
      description: 'Mackerel stock is running low',
      timestamp: '6 hours ago',
      status: 'warning'
    },
    {
      id: '4',
      type: 'sale',
      title: 'Large Order Processed',
      description: 'Processed order for Restaurant #R005',
      timestamp: '1 day ago',
      status: 'completed',
      amount: 120.00
    }
  ]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'sale':
        return <ShoppingCart className="h-4 w-4" />;
      case 'task':
        return <CheckCircle className="h-4 w-4" />;
      case 'inventory':
        return <Package className="h-4 w-4" />;
      case 'notification':
        return <Bell className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 dark:text-green-400';
      case 'pending':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'warning':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const taskCompletionPercentage = Math.round((stats.tasksCompleted / stats.tasksTotal) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Title */}
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-600 rounded-lg shadow-lg">
                <Fish className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  LocalFishing
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Worker Dashboard
                </p>
              </div>
            </div>

            {/* User Info and Actions */}
            <div className="flex items-center gap-4">
              <CompactLanguageSwitcher />
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {workerFullName}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {businessName}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                Welcome back, {workerFullName.split(' ')[0]}! 👋
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Here's what's happening with your work today
              </p>
            </div>
            <Badge 
              variant="secondary" 
              className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 capitalize"
            >
              {workerRole}
            </Badge>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Today's Sales */}
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Today's Sales</p>
                  <p className="text-2xl font-bold">{stats.todaySales}</p>
                  <p className="text-blue-100 text-xs">transactions</p>
                </div>
                <div className="p-3 bg-white/20 rounded-full">
                  <ShoppingCart className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Week Sales */}
          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">This Week</p>
                  <p className="text-2xl font-bold">{stats.weekSales}</p>
                  <p className="text-green-100 text-xs">total sales</p>
                </div>
                <div className="p-3 bg-white/20 rounded-full">
                  <TrendingUp className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Task Progress */}
          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Tasks Progress</p>
                  <p className="text-2xl font-bold">{taskCompletionPercentage}%</p>
                  <p className="text-purple-100 text-xs">{stats.tasksCompleted}/{stats.tasksTotal} completed</p>
                </div>
                <div className="p-3 bg-white/20 rounded-full">
                  <Target className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Revenue Contribution */}
          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">Revenue Impact</p>
                  <p className="text-2xl font-bold">${stats.revenue}</p>
                  <p className="text-orange-100 text-xs">this month</p>
                </div>
                <div className="p-3 bg-white/20 rounded-full">
                  <DollarSign className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Activities */}
          <Card className="lg:col-span-2 shadow-lg border-gray-200 dark:border-gray-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-blue-600" />
                    Recent Activities
                  </CardTitle>
                  <CardDescription>
                    Your recent work activities and achievements
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.map((activity, index) => (
                  <div key={activity.id}>
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-full bg-gray-100 dark:bg-gray-800 ${getStatusColor(activity.status)}`}>
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {activity.title}
                          </p>
                          {activity.amount && (
                            <span className="text-sm font-bold text-green-600 dark:text-green-400">
                              +${activity.amount.toFixed(2)}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {activity.description}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3" />
                          {activity.timestamp}
                        </p>
                      </div>
                    </div>
                    {index < recentActivities.length - 1 && (
                      <Separator className="mt-4" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions & Info */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card className="shadow-lg border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-blue-600" />
                  Quick Actions
                </CardTitle>
                <CardDescription>
                  Common tasks you can perform
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start" variant="outline">
                  <ShoppingCart className="h-4 w-4 mr-3" />
                  Record Sale
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Package className="h-4 w-4 mr-3" />
                  Check Inventory
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <BarChart3 className="h-4 w-4 mr-3" />
                  View Reports
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <FileText className="h-4 w-4 mr-3" />
                  Daily Tasks
                </Button>
              </CardContent>
            </Card>

            {/* Performance Summary */}
            <Card className="shadow-lg border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-blue-600" />
                  Performance
                </CardTitle>
                <CardDescription>
                  Your work performance this month
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Task Completion</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{taskCompletionPercentage}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${taskCompletionPercentage}%` }}
                  ></div>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Sales Target</span>
                    <span className="text-sm font-bold text-green-600 dark:text-green-400">85%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Quality Score</span>
                    <span className="text-sm font-bold text-blue-600 dark:text-blue-400">9.2/10</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Attendance</span>
                    <span className="text-sm font-bold text-purple-600 dark:text-purple-400">100%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Worker Info */}
            <Card className="shadow-lg border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-600" />
                  Worker Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Name</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{workerFullName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Email</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{workerEmail}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Role</span>
                  <Badge variant="secondary" className="capitalize">{workerRole}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Business</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{businessName}</span>
                </div>
                
                <Separator className="my-4" />
                
                <Button className="w-full" variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Profile Settings
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default WorkerDashboard;
