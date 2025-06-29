# Reports System Documentation

## Overview

The Reports system is a comprehensive reporting solution for the fish selling management system. It provides detailed analytics and insights across five main categories: Stock, Sales, Worker, Expense, and Profit reports.

## Features

### 📦 Stock Report
- **Inventory Movement Tracking**: Monitor what stock came in, went out, and current remaining quantities
- **Movement Types**: Track stock in, stock out, adjustments, damaged, and expired items
- **Real-time Statistics**: View total in/out, current stock, adjustments, damaged, and expired quantities
- **Filtering**: Filter by movement type and date range

### 💰 Sales Report
- **Detailed Sales Data**: View products sold by kg/box with worker information and revenue amounts
- **Selling Method Analysis**: Filter by weight-based, boxed, or mixed selling methods
- **Payment Tracking**: Monitor payment status (paid, pending, overdue)
- **Performance Metrics**: Track top-selling products and top-performing workers

### 👥 Worker Report
- **Performance Tracking**: Monitor individual worker sales metrics and work schedules
- **Task Management**: Track task completion rates and performance scores
- **Revenue Analysis**: View individual worker revenue generation
- **Performance Levels**: Categorize workers by performance (Excellent, Good, Average, Needs Improvement)

### 💸 Expense Report
- **Financial Tracking**: Monitor all expenditures by category and person
- **Category Analysis**: Track spending across different expense categories
- **Status Management**: Monitor expense approval workflow (pending, approved, paid, rejected)
- **Budget Tracking**: Monitor budget utilization with visual indicators

### 📈 Profit Report
- **Comprehensive Analysis**: Calculate daily/weekly/monthly profit (Revenue - Cost - Expenses)
- **Period Comparison**: Compare current vs previous period performance
- **Margin Analysis**: Track profit margins with performance indicators
- **Breakdown Visualization**: View revenue, costs, and profit distribution

## Components

### Core Components

#### `Reports.tsx`
Main reports page with navigation and state management.

#### `ReportCard.tsx`
Beautiful card component for displaying report categories with icons, descriptions, and statistics.

#### `DateFilter.tsx`
Comprehensive date filtering component with preset options (Today, This Week, This Month) and custom date range picker.

#### `DataTable.tsx`
Sortable and searchable data table with pagination, column sorting, and responsive design.

#### `ExportActions.tsx`
Export functionality with Excel, CSV, and Print options, including configuration dialog.

#### `PeriodComparison.tsx`
Visual component for displaying period-over-period comparisons with growth indicators.

### Report Components

- `StockReport.tsx` - Stock inventory and movement tracking
- `SalesReport.tsx` - Sales transactions and revenue analysis
- `WorkerReport.tsx` - Worker performance and metrics
- `ExpenseReport.tsx` - Expense tracking and budget management
- `ProfitReport.tsx` - Profit analysis and margin tracking

### Utility Components

- `ErrorBoundary.tsx` - Error handling and recovery
- `LoadingState.tsx` - Loading states and skeleton placeholders

## Usage

### Basic Usage

```tsx
import Reports from "@/pages/Reports";

// The Reports component handles all navigation and state management
<Reports />
```

### Individual Report Components

```tsx
import StockReport from "@/components/reports/StockReport";

const MyComponent = () => {
  const [dateFilter, setDateFilter] = useState({
    preset: 'month',
    customRange: undefined
  });

  return (
    <StockReport 
      dateFilter={dateFilter}
      onDateFilterChange={setDateFilter}
    />
  );
};
```

### Export Functionality

```tsx
import ExportActions from "@/components/reports/ExportActions";

<ExportActions
  data={reportData}
  columns={tableColumns}
  filename="my_report"
  dateRange={dateRange}
  reportType="Sales"
  onExport={handleCustomExport}
/>
```

## Data Structure

### TypeScript Interfaces

The system uses comprehensive TypeScript interfaces for type safety:

- `StockMovement` - Stock movement data
- `SaleItem` - Sales transaction data
- `WorkerPerformance` - Worker metrics data
- `ExpenseItem` - Expense transaction data
- `ProfitCalculation` - Profit analysis data
- `DateFilterState` - Date filtering state
- `PeriodComparison` - Period comparison data

### Mock Data

All components include comprehensive mock data for demonstration purposes. In a production environment, replace with actual API calls.

## Styling

The system uses:
- **Tailwind CSS** for styling
- **shadcn/ui** components for consistent UI
- **Lucide React** icons for visual elements
- **Responsive design** for all screen sizes
- **Dark mode support** throughout

## Error Handling

- **Error Boundaries** catch and handle component errors
- **Loading States** provide user feedback during data fetching
- **Toast Notifications** for user feedback
- **Retry Mechanisms** for failed operations

## Export Features

### Supported Formats
- **Excel (.xlsx)** - Structured spreadsheet format
- **CSV (.csv)** - Comma-separated values
- **Print** - Print-friendly formatted view

### Export Configuration
- Custom filename selection
- Date range inclusion
- Column header options
- Data filtering before export

## Performance

- **Lazy Loading** for report components
- **Memoized Calculations** for summary statistics
- **Efficient Filtering** with useMemo hooks
- **Pagination** for large datasets

## Accessibility

- **Keyboard Navigation** support
- **Screen Reader** compatible
- **ARIA Labels** for interactive elements
- **Color Contrast** compliance
- **Focus Management** for modals and dialogs

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Future Enhancements

- Real-time data updates
- Advanced charting and visualization
- Custom report builder
- Scheduled report generation
- Email report delivery
- Advanced filtering options
- Data export to cloud storage
- Mobile app integration

## Contributing

When adding new report types:

1. Create a new report component in `src/components/reports/`
2. Add the report type to the `ReportType` union
3. Update the `reportCategories` array in `Reports.tsx`
4. Add the component to the switch statement in `renderReportComponent`
5. Include comprehensive TypeScript interfaces
6. Add error handling and loading states
7. Include export functionality
8. Update this documentation

## Support

For issues or questions about the Reports system, please refer to the main project documentation or contact the development team.
