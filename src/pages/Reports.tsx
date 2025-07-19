import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ReportFilters from "@/components/reports/ReportFilters";
import SalesReportDatePicker from "@/components/reports/SalesReportDatePicker";
import { PDFViewer } from "@/components/ui/pdf-viewer";
import {
  FileText,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  CreditCard,
  BarChart3,
  Eye
} from "lucide-react";
import { toast } from "sonner";
import {
  ReportType,
  ReportFilters as IReportFilters,
  viewReportInPopup,
  getDownloadUrl
} from "@/services/reports";

/**
 * Reports Page
 *
 * Displays non-clickable report bars for different report categories
 */

const Reports = () => {
  const [showFilters, setShowFilters] = useState(false);
  const [showSalesDatePicker, setShowSalesDatePicker] = useState(false);
  const [currentReportType, setCurrentReportType] = useState<ReportType>('sales');
  const [currentReportTitle, setCurrentReportTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPDFViewer, setShowPDFViewer] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string>('');

  /**
   * Handle viewing a report with filters
   */
  const handleViewReport = (reportType: ReportType, reportTitle: string) => {
    setCurrentReportType(reportType);
    setCurrentReportTitle(reportTitle);

    // Show sales date picker for sales report, general filters for others
    if (reportType === 'sales') {
      setShowSalesDatePicker(true);
    } else {
      setShowFilters(true);
    }
  };

  /**
   * Handle applying filters and generating report
   */
  const handleApplyFilters = async (filters: IReportFilters) => {
    setIsLoading(true);
    try {
      // Get PDF URL for popup viewing
      const url = viewReportInPopup(currentReportType, filters);
      setPdfUrl(url);
      setShowPDFViewer(true);
      setShowFilters(false);

      toast.success(`${currentReportTitle} is ready!`, {
        description: "The report is now displayed in the popup viewer"
      });
    } catch (error) {
      console.error(`Error viewing ${currentReportType} report:`, error);
      toast.error(`Failed to view ${currentReportTitle}`, {
        description: error instanceof Error ? error.message : 'An unexpected error occurred'
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle sales report generation with date range
   */
  const handleGenerateSalesReport = async (dateFrom: string, dateTo: string) => {
    setIsLoading(true);
    try {
      // Create filters with selected dates
      const filters: IReportFilters = {
        dateFrom,
        dateTo
      };

      // Get PDF URL for popup viewing
      const url = viewReportInPopup('sales', filters);
      setPdfUrl(url);
      setShowPDFViewer(true);
      setShowSalesDatePicker(false);

      toast.success('Sales Report is ready!', {
        description: `Report generated for ${new Date(dateFrom).toLocaleDateString()} - ${new Date(dateTo).toLocaleDateString()}`
      });
    } catch (error) {
      console.error('Error viewing sales report:', error);
      toast.error('Failed to generate Sales Report', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred'
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle PDF download
   */
  const handleDownloadPDF = () => {
    if (currentReportType) {
      try {
        const downloadUrl = getDownloadUrl(currentReportType, {});
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `${currentReportTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success('Download started!', {
          description: 'The PDF report is being downloaded'
        });
      } catch (error) {
        console.error('Error downloading PDF:', error);
        toast.error('Failed to download PDF', {
          description: error instanceof Error ? error.message : 'An unexpected error occurred'
        });
      }
    }
  };

  // Report categories with their respective icons and descriptions
  const reportCategories = [
    {
      id: "general" as ReportType,
      title: "General Report",
      description: "Comprehensive overview of business operations and key performance indicators",
      icon: FileText,
      color: "from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30",
      iconColor: "text-blue-600",
      iconBg: "bg-blue-100 dark:bg-blue-900/30"
    },
    {
      id: "sales" as ReportType,
      title: "Sales Report",
      description: "Sales performance metrics, revenue trends, and customer transaction analysis",
      icon: ShoppingCart,
      color: "from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30",
      iconColor: "text-purple-600",
      iconBg: "bg-purple-100 dark:bg-purple-900/30"
    },
    {
      id: "top-selling" as ReportType,
      title: "Top Selling",
      description: "Analysis of best-performing products and highest revenue generating items",
      icon: TrendingUp,
      color: "from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30",
      iconColor: "text-green-600",
      iconBg: "bg-green-100 dark:bg-green-900/30"
    },
    {
      id: "debtor-credit" as ReportType,
      title: "Debtor/Credit Report",
      description: "Outstanding debts, credit balances, and accounts receivable analysis",
      icon: CreditCard,
      color: "from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30",
      iconColor: "text-orange-600",
      iconBg: "bg-orange-100 dark:bg-orange-900/30"
    },
    {
      id: "profit-loss" as ReportType,
      title: "Profit and Loss Report",
      description: "Detailed profit and loss statement with revenue, expenses, and net income analysis",
      icon: DollarSign,
      color: "from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30",
      iconColor: "text-red-600",
      iconBg: "bg-red-100 dark:bg-red-900/30"
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

                  {/* Action Button */}
                  <div className="mb-4">
                    <Button
                      onClick={() => handleViewReport(report.id, report.title)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm h-9"
                      disabled={isLoading}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View Reports
                    </Button>
                  </div>

                  {/* Visual indicator that this is a report category */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                      <BarChart3 className="h-3 w-3" />
                      <span>Report Category</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <BarChart3 className="h-3 w-3 text-gray-400" />
                      <TrendingUp className="h-3 w-3 text-gray-400" />
                      <DollarSign className="h-3 w-3 text-gray-400" />
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

        {/* Report Filters Modal */}
        <ReportFilters
          reportType={currentReportType}
          isOpen={showFilters}
          onClose={() => setShowFilters(false)}
          onApplyFilters={handleApplyFilters}
          isLoading={isLoading}
        />

        {/* Sales Report Date Picker Modal */}
        <SalesReportDatePicker
          isOpen={showSalesDatePicker}
          onClose={() => setShowSalesDatePicker(false)}
          onGenerateReport={handleGenerateSalesReport}
          isLoading={isLoading}
        />

        {/* PDF Viewer Modal */}
        <PDFViewer
          isOpen={showPDFViewer}
          onClose={() => setShowPDFViewer(false)}
          pdfUrl={pdfUrl}
          title={currentReportTitle}
          onDownload={handleDownloadPDF}
        />
      </div>
    </AppLayout>
  );
};

export default Reports;