import React from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Package,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Brain,
  BarChart3,
  PieChart,
  LineChart,
  Activity,
  Eye,
  Download
} from "lucide-react";
import { toast } from "sonner";

/**
 * Reports Page
 *
 * Displays non-clickable report bars for different report categories
 */

const Reports = () => {
  /**
   * Handle viewing a report
   */
  const handleViewReport = (reportType: string, reportTitle: string) => {
    toast.info(`Opening ${reportTitle}...`, {
      description: "Report viewer will be implemented soon"
    });
    console.log(`Viewing ${reportType} report`);
  };

  /**
   * Handle downloading a report as PDF
   */
  const handleDownloadPDF = (reportType: string, reportTitle: string) => {
    toast.success(`Downloading ${reportTitle} PDF...`, {
      description: "PDF generation will be implemented soon"
    });
    console.log(`Downloading ${reportType} report as PDF`);
  };

  // Report categories with their respective icons and descriptions
  const reportCategories = [
    {
      id: "general",
      title: "General Report",
      description: "Comprehensive overview of all business activities and key performance indicators",
      icon: FileText,
      color: "from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30",
      iconColor: "text-blue-600",
      iconBg: "bg-blue-100 dark:bg-blue-900/30"
    },
    {
      id: "stock",
      title: "Stock Report",
      description: "Detailed inventory levels, stock movements, and product availability analysis",
      icon: Package,
      color: "from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30",
      iconColor: "text-green-600",
      iconBg: "bg-green-100 dark:bg-green-900/30"
    },
    {
      id: "sales",
      title: "Sales Report",
      description: "Sales performance metrics, revenue trends, and customer transaction analysis",
      icon: ShoppingCart,
      color: "from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30",
      iconColor: "text-purple-600",
      iconBg: "bg-purple-100 dark:bg-purple-900/30"
    },
    {
      id: "expense",
      title: "Expense Report",
      description: "Business expenditure breakdown, cost analysis, and budget tracking",
      icon: DollarSign,
      color: "from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30",
      iconColor: "text-orange-600",
      iconBg: "bg-orange-100 dark:bg-orange-900/30"
    },
    {
      id: "profit-loss",
      title: "Profit and Loss Report",
      description: "Financial performance analysis including revenue, costs, and net profit calculations",
      icon: TrendingUp,
      color: "from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30",
      iconColor: "text-red-600",
      iconBg: "bg-red-100 dark:bg-red-900/30"
    },
    {
      id: "smart",
      title: "Smart Report",
      description: "AI-powered insights and predictive analytics for business intelligence",
      icon: Brain,
      color: "from-cyan-50 to-teal-50 dark:from-cyan-950/30 dark:to-teal-950/30",
      iconColor: "text-cyan-600",
      iconBg: "bg-cyan-100 dark:bg-cyan-900/30"
    }
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Reports</h1>
          <p className="text-muted-foreground">
            Comprehensive business reporting and analytics dashboard
          </p>
        </div>

        {/* Report Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reportCategories.map((report) => {
            const IconComponent = report.icon;

            return (
              <Card
                key={report.id}
                className={`border-0 shadow-md bg-gradient-to-br ${report.color} hover:shadow-lg transition-all duration-200 cursor-default`}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 ${report.iconBg} rounded-xl flex items-center justify-center`}>
                      <IconComponent className={`h-6 w-6 ${report.iconColor}`} />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                        {report.title}
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                    {report.description}
                  </p>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-2 mb-4">
                    <Button
                      onClick={() => handleViewReport(report.id, report.title)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm h-9"
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View Report
                    </Button>
                    <Button
                      onClick={() => handleDownloadPDF(report.id, report.title)}
                      variant="outline"
                      className="flex-1 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm h-9"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download PDF
                    </Button>
                  </div>

                  {/* Visual indicator that this is a report category */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                      <BarChart3 className="h-3 w-3" />
                      <span>Report Category</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <PieChart className="h-3 w-3 text-gray-400" />
                      <LineChart className="h-3 w-3 text-gray-400" />
                      <Activity className="h-3 w-3 text-gray-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Additional Information */}
        <Card className="border-dashed border-2 border-gray-200 dark:border-gray-700">
          <CardContent className="p-8 text-center">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                <FileText className="h-8 w-8 text-gray-400" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Report Categories Overview
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 max-w-md">
                  These report categories provide comprehensive insights into different aspects of your fish selling business.
                  Each category offers detailed analytics and performance metrics to help you make informed decisions.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Reports;