import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, TrendingUp, BarChart3, PieChart, Calendar, DollarSign, Users, Package, ShoppingCart } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Reports = () => {
  // Mock data for fish selling business reports
  const reportTypes = [
    {
      id: 1,
      name: "Sales Performance Report",
      description: "Revenue analysis, top products, and sales trends by selling method",
      icon: TrendingUp,
      lastGenerated: "2024-01-22",
      frequency: "Daily"
    },
    {
      id: 2,
      name: "Inventory Turnover Report",
      description: "Stock levels, expiry tracking, and inventory movement analysis",
      icon: BarChart3,
      lastGenerated: "2024-01-21",
      frequency: "Weekly"
    },
    {
      id: 3,
      name: "Customer Analytics Report",
      description: "Customer segmentation, purchase patterns, and loyalty analysis",
      icon: Users,
      lastGenerated: "2024-01-20",
      frequency: "Monthly"
    },
    {
      id: 4,
      name: "Profit Margin Analysis",
      description: "Product profitability, pricing optimization, and cost analysis",
      icon: DollarSign,
      lastGenerated: "2024-01-22",
      frequency: "Weekly"
    },
    {
      id: 5,
      name: "Order Fulfillment Report",
      description: "Order processing times, delivery performance, and customer satisfaction",
      icon: ShoppingCart,
      lastGenerated: "2024-01-21",
      frequency: "Daily"
    },
    {
      id: 6,
      name: "Product Performance Report",
      description: "Best-selling products, seasonal trends, and demand forecasting",
      icon: Package,
      lastGenerated: "2024-01-19",
      frequency: "Monthly"
    }
  ];

  const quickStats = [
    {
      title: "Monthly Revenue",
      value: "$18,450",
      change: "+15%",
      period: "vs last month",
      icon: DollarSign
    },
    {
      title: "Orders Processed",
      value: "127",
      change: "+23%",
      period: "vs last month",
      icon: ShoppingCart
    },
    {
      title: "Active Customers",
      value: "24",
      change: "+8%",
      period: "vs last month",
      icon: Users
    },
    {
      title: "Inventory Turnover",
      value: "2.4x",
      change: "+12%",
      period: "vs last month",
      icon: Package
    }
  ];

  const recentReports = [
    {
      id: 1,
      name: "Daily Sales Performance - Jan 22",
      type: "Sales",
      generatedDate: "2024-01-22 09:00",
      size: "2.3 MB",
      format: "PDF"
    },
    {
      id: 2,
      name: "Weekly Customer Analytics - Week 3",
      type: "Customer",
      generatedDate: "2024-01-21 18:30",
      size: "1.8 MB",
      format: "Excel"
    },
    {
      id: 3,
      name: "Inventory Turnover Report - Jan 2024",
      type: "Inventory",
      generatedDate: "2024-01-20 16:45",
      size: "3.1 MB",
      format: "PDF"
    },
    {
      id: 4,
      name: "Profit Margin Analysis - Q1 2024",
      type: "Financial",
      generatedDate: "2024-01-19 14:20",
      size: "2.7 MB",
      format: "Excel"
    },
    {
      id: 5,
      name: "Order Fulfillment Report - Jan 22",
      type: "Operations",
      generatedDate: "2024-01-22 15:30",
      size: "1.5 MB",
      format: "PDF"
    }
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Reports & Analytics</h1>
            <p className="text-muted-foreground">Generate comprehensive reports and analyze your fish selling business performance</p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <FileText className="mr-2 h-4 w-4" /> Generate Custom Report
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickStats.map((stat, index) => (
            <Card key={index} className="hover-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  <span className={stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}>
                    {stat.change}
                  </span> {stat.period}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Reports Management */}
        <Card>
          <CardHeader>
            <CardTitle>Reports Management</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="generate" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="generate">Generate Reports</TabsTrigger>
                <TabsTrigger value="recent">Recent Reports</TabsTrigger>
              </TabsList>
              
              <TabsContent value="generate" className="space-y-6">
                {/* Report Generation Controls */}
                <div className="flex flex-col md:flex-row gap-4 p-4 bg-muted/50 rounded-lg">
                  <div className="flex-1">
                    <label className="text-sm font-medium mb-2 block">Report Type</label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select report type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="inventory">Fish Inventory Report</SelectItem>
                        <SelectItem value="health">Health & Mortality Report</SelectItem>
                        <SelectItem value="feeding">Feeding Cost Analysis</SelectItem>
                        <SelectItem value="sales">Sales Performance Report</SelectItem>
                        <SelectItem value="tanks">Tank Utilization Report</SelectItem>
                        <SelectItem value="financial">Financial Summary</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex-1">
                    <label className="text-sm font-medium mb-2 block">Date Range</label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select date range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="week">This Week</SelectItem>
                        <SelectItem value="month">This Month</SelectItem>
                        <SelectItem value="quarter">This Quarter</SelectItem>
                        <SelectItem value="year">This Year</SelectItem>
                        <SelectItem value="custom">Custom Range</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex-1">
                    <label className="text-sm font-medium mb-2 block">Format</label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pdf">PDF</SelectItem>
                        <SelectItem value="excel">Excel</SelectItem>
                        <SelectItem value="csv">CSV</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-end">
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      <FileText className="mr-2 h-4 w-4" /> Generate
                    </Button>
                  </div>
                </div>

                {/* Available Report Types */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {reportTypes.map((report) => (
                    <Card key={report.id} className="hover-card">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <report.icon className="h-8 w-8 text-blue-600" />
                            <div>
                              <CardTitle className="text-base">{report.name}</CardTitle>
                              <p className="text-xs text-muted-foreground mt-1">
                                {report.description}
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Last Generated:</span>
                          <span>{report.lastGenerated}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Frequency:</span>
                          <span>{report.frequency}</span>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="flex-1">
                            <Calendar className="mr-2 h-3 w-3" /> Schedule
                          </Button>
                          <Button variant="outline" size="sm" className="flex-1">
                            <FileText className="mr-2 h-3 w-3" /> Generate
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="recent" className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-2 text-sm font-medium">Report Name</th>
                        <th className="text-left py-3 px-2 text-sm font-medium">Type</th>
                        <th className="text-left py-3 px-2 text-sm font-medium">Generated</th>
                        <th className="text-left py-3 px-2 text-sm font-medium">Size</th>
                        <th className="text-left py-3 px-2 text-sm font-medium">Format</th>
                        <th className="text-right py-3 px-2 text-sm font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentReports.map((report) => (
                        <tr key={report.id} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-blue-600" />
                              <span className="font-medium">{report.name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-2 text-muted-foreground">{report.type}</td>
                          <td className="py-3 px-2 text-sm">{report.generatedDate}</td>
                          <td className="py-3 px-2">{report.size}</td>
                          <td className="py-3 px-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                              {report.format}
                            </span>
                          </td>
                          <td className="py-3 px-2">
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" size="sm">
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button variant="outline" size="sm">
                                View
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Reports;
