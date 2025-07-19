/**
 * PDF Generation Service
 * Handles PDF creation for various report types using jsPDF
 * Optimized for Cloudflare Workers compatibility
 */

import type {
  StockReportData,
  SalesReportData,
  FinancialReportData,
  TransactionReportData,
  ProductReportData,
  CustomerReportData,
  GeneralReportData,
  TopSellingReportData,
  DebtorCreditReportData,
  ReportType,
} from '../types';

// jsPDF instance for PDF generation
let jsPDF: any;

/**
 * Initialize jsPDF for Cloudflare Workers
 */
async function initializeJsPDF() {
  if (!jsPDF) {
    try {
      // Import jsPDF for Workers compatibility
      const jsPDFModule = await import('jspdf');
      jsPDF = jsPDFModule.default || jsPDFModule.jsPDF;

      if (!jsPDF) {
        throw new Error('jsPDF module not found');
      }

    } catch (error) {
      console.error('Error initializing jsPDF:', error);
      throw new Error(`Failed to initialize PDF generation service: ${(error as Error).message}`);
    }
  }
  return jsPDF;
}

/**
 * Create a PDF document and return as ArrayBuffer
 */
async function createPDFDocument(contentGenerator: (doc: any) => void): Promise<ArrayBuffer> {
  const jsPDFClass = await initializeJsPDF();

  // Create new jsPDF instance
  const doc = new jsPDFClass({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  try {
    // Generate content using the provided generator function
    contentGenerator(doc);

    // Get PDF as ArrayBuffer
    const pdfOutput = doc.output('arraybuffer');
    return pdfOutput;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error(`Failed to generate PDF: ${(error as Error).message}`);
  }
}

/**
 * jsPDF Helper Functions
 */

/**
 * Add header to PDF document
 */
function addPDFHeader(doc: any, title: string, period?: { from: string; to: string }) {
  let currentY = 20;

  // Company header
  doc.setFontSize(20);
  doc.setTextColor(37, 99, 235); // #2563eb
  doc.text('Local Fishing Inventory System', 105, currentY, { align: 'center' });

  currentY += 15;
  doc.setFontSize(16);
  doc.setTextColor(55, 65, 81); // #374151
  doc.text(title, 105, currentY, { align: 'center' });

  if (period) {
    currentY += 10;
    doc.setFontSize(12);
    doc.setTextColor(107, 114, 128); // #6b7280
    doc.text(`Period: ${period.from} to ${period.to}`, 105, currentY, { align: 'center' });
  }

  return currentY + 20; // Return next Y position
}

/**
 * Add footer to PDF document
 */
function addPDFFooter(doc: any) {
  const pageHeight = 297; // A4 height in mm
  const footerY = pageHeight - 20;

  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128); // #6b7280
  doc.text(`Generated on ${new Date().toLocaleString()}`, 20, footerY);
  doc.text('Local Fishing Inventory System', 190, footerY, { align: 'right' });
}

/**
 * Add a table to PDF document
 */
function addPDFTable(doc: any, headers: string[], rows: string[][], options: {
  startX?: number;
  startY?: number;
  columnWidths?: number[];
} = {}) {
  const startX = options.startX || 20;
  let currentY = options.startY || 60;
  const columnWidths = options.columnWidths || headers.map(() => 25);
  const rowHeight = 8;

  // Draw header
  doc.setFillColor(37, 99, 235); // #2563eb
  doc.rect(startX, currentY, columnWidths.reduce((sum, width) => sum + width, 0), rowHeight, 'F');

  doc.setTextColor(255, 255, 255); // white
  doc.setFontSize(10);

  let currentX = startX;
  headers.forEach((header, index) => {
    const width = columnWidths[index] || 25;
    doc.text(header, currentX + 2, currentY + 5);
    currentX += width;
  });

  currentY += rowHeight;

  // Draw rows
  rows.forEach((row, rowIndex) => {
    if (rowIndex % 2 === 1) {
      doc.setFillColor(248, 250, 252); // #f8fafc
      doc.rect(startX, currentY, columnWidths.reduce((sum, width) => sum + width, 0), rowHeight, 'F');
    }

    doc.setTextColor(55, 65, 81); // #374151
    doc.setFontSize(9);

    currentX = startX;
    row.forEach((cell, cellIndex) => {
      const width = columnWidths[cellIndex] || 25;
      // Truncate text if too long
      const maxLength = Math.floor(width / 2);
      const displayText = cell.length > maxLength ? cell.substring(0, maxLength - 3) + '...' : cell;
      doc.text(displayText, currentX + 2, currentY + 5);
      currentX += width;
    });

    currentY += rowHeight;
  });

  return currentY + 5; // Return next Y position
}

/**
 * Add summary section to PDF
 */
function addPDFSummary(doc: any, title: string, items: { label: string; value: string }[], startY: number) {
  let currentY = startY;

  doc.setFontSize(14);
  doc.setTextColor(55, 65, 81); // #374151
  doc.text(title, 20, currentY);

  currentY += 10;

  items.forEach(item => {
    doc.setFontSize(11);
    doc.setTextColor(107, 114, 128); // #6b7280
    doc.text(`${item.label}: ${item.value}`, 20, currentY);
    currentY += 6;
  });

  return currentY + 10; // Return next Y position
}

/**
 * Generate Stock Report PDF
 */
export async function generateStockReportPdf(
  data: StockReportData[],
  period?: { from: string; to: string }
): Promise<ArrayBuffer> {
  return createPDFDocument((doc) => {
    // Add header
    let currentY = addPDFHeader(doc, 'Stock Report', period);

    // Calculate summary statistics
    const totalProducts = data.length;
    const lowStockItems = data.filter(item => item.status === 'low_stock').length;
    const outOfStockItems = data.filter(item => item.status === 'out_of_stock').length;
    const totalStockValue = data.reduce((sum, item) => sum + item.stockValue, 0);

    // Add summary section
    currentY = addPDFSummary(doc, 'Stock Summary', [
      { label: 'Total Products', value: totalProducts.toString() },
      { label: 'Low Stock Items', value: lowStockItems.toString() },
      { label: 'Out of Stock Items', value: outOfStockItems.toString() },
      { label: 'Total Stock Value', value: `$${totalStockValue.toFixed(2)}` }
    ], currentY);

    // Prepare table data
    const headers = [
      'Product',
      'SKU',
      'Category',
      'Stock',
      'Min',
      'Max',
      'Value',
      'Status'
    ];

    const rows = data.map(item => [
      item.productName.substring(0, 15),
      item.sku.substring(0, 10),
      item.category.substring(0, 10),
      item.currentStock.toString(),
      item.minStockLevel.toString(),
      item.maxStockLevel.toString(),
      `$${item.stockValue.toFixed(0)}`,
      item.status.replace('_', ' ').toUpperCase().substring(0, 8)
    ]);

    // Add table
    addPDFTable(doc, headers, rows, {
      columnWidths: [25, 20, 20, 15, 15, 15, 20, 20],
      startY: currentY
    });

    // Add footer
    addPDFFooter(doc);
  });
}

/**
 * Generate Sales Report PDF
 */
export async function generateSalesReportPdf(
  data: SalesReportData[],
  period?: { from: string; to: string }
): Promise<ArrayBuffer> {
  return createPDFDocument((doc) => {
    // Add header
    let currentY = addPDFHeader(doc, 'Sales Report', period);

    // Calculate summary statistics
    const totalSales = data.length;
    const totalRevenue = data.reduce((sum, sale) => sum + sale.total, 0);
    const totalProfit = data.reduce((sum, sale) => sum + sale.profit, 0);

    // Calculate payment method amounts (handle database payment method values)
    const paymentMethods = data.reduce((acc, sale) => {
      const method = sale.paymentMethod.toLowerCase();
      if (!acc[method]) {
        acc[method] = 0;
      }
      acc[method] += sale.total;
      return acc;
    }, {} as Record<string, number>);

    // Map database payment method values to display amounts
    const momoAmount = paymentMethods['momo_pay'] || paymentMethods['momo'] || 0;
    const cashAmount = paymentMethods['cash'] || 0;
    const bankTransferAmount = paymentMethods['bank_transfer'] || paymentMethods['bank transfer'] || 0;

    // Add summary section with payment method amounts instead of averages
    currentY = addPDFSummary(doc, 'Sales Summary', [
      { label: 'Total Sales', value: totalSales.toString() },
      { label: 'Total Revenue', value: `$${totalRevenue.toFixed(2)}` },
      { label: 'Total Profit', value: `$${totalProfit.toFixed(2)}` },
      { label: 'Momo Amount', value: `$${momoAmount.toFixed(2)}` },
      { label: 'Cash Amount', value: `$${cashAmount.toFixed(2)}` },
      { label: 'Bank Transfer Amount', value: `$${bankTransferAmount.toFixed(2)}` }
    ], currentY);

    // Handle empty data case
    if (data.length === 0) {
      // Add a message for empty data using jsPDF API
      doc.setFontSize(14);
      doc.setTextColor(102, 102, 102); // #666666
      doc.text('No sales data found for the selected date range.', 105, currentY + 40, { align: 'center' });

      doc.setFontSize(12);
      doc.text('Try selecting a different date range or check if there are any sales recorded.', 105, currentY + 60, { align: 'center' });

      // Add footer and return early
      addPDFFooter(doc);
      return;
    }

    // Prepare table data with shortened column headers to reduce space
    const headers = [
      'Product',
      'Quantity',
      'Client',
      'Unit Price',
      'Selling',
      'Profit',
      'Total',
      'Seller',
      'Status',
      'Method'
    ];

    const rows = data.map(sale => [
      sale.productName.substring(0, 20), // Increased space to show full product names
      sale.quantitySold.substring(0, 15), // Increased space for quantity display
      sale.clientName.substring(0, 15), // Increased space for client names
      sale.unitPrice.substring(0, 20), // Increased space for unit prices
      sale.sellingPrice.substring(0, 20), // Increased space for selling prices
      `$${sale.profit.toFixed(2)}`,
      `$${sale.total.toFixed(2)}`,
      sale.seller.substring(0, 15), // Increased space for seller names
      sale.paymentStatus.toUpperCase().substring(0, 10), // Increased space for status
      sale.paymentMethod.toUpperCase().substring(0, 12) // Increased space for payment method
    ]);

    // Add table with much wider column widths to prevent truncation
    addPDFTable(doc, headers, rows, {
      columnWidths: [25, 20, 18, 25, 25, 18, 18, 18, 15, 18], // Total: 200 (much wider columns)
      startX: 10, // Reduced left margin to accommodate wider table
      startY: currentY
    });

    // Add footer
    addPDFFooter(doc);
  });
}

/**
 * Generate Financial Report PDF
 */
export async function generateFinancialReportPdf(
  data: FinancialReportData,
  period?: { from: string; to: string }
): Promise<ArrayBuffer> {
  return createPDFDocument((doc) => {
    // Add header
    addPDFHeader(doc, 'Financial Report', period);

    // Add financial summary
    addPDFSummary(doc, 'Financial Overview', [
      { label: 'Total Sales', value: `$${data.totalSales.toFixed(2)}` },
      { label: 'Total Expenses', value: `$${data.totalExpenses.toFixed(2)}` },
      { label: 'Total Deposits', value: `$${data.totalDeposits.toFixed(2)}` },
      { label: 'Net Profit', value: `$${data.netProfit.toFixed(2)}` },
      { label: 'Sales Count', value: data.salesCount.toString() },
      { label: 'Average Sale Amount', value: `$${data.averageSaleAmount.toFixed(2)}` }
    ], 60);

    // Top Selling Products section
    if (data.topSellingProducts && data.topSellingProducts.length > 0) {
      doc.setFontSize(14);
      doc.setTextColor(55, 65, 81); // #374151
      doc.text('Top Selling Products', 20, doc.y || 100);

      doc.y = (doc.y || 100) + 10;

      const productHeaders = ['Product Name', 'Quantity Sold', 'Revenue'];
      const productRows = data.topSellingProducts.map(product => [
        product.productName,
        product.quantitySold.toString(),
        `$${product.totalRevenue.toFixed(2)}`
      ]);

      addPDFTable(doc, productHeaders, productRows, {
        columnWidths: [200, 100, 100],
        startY: doc.y
      });
    }

    // Payment Methods section
    if (data.salesByPaymentMethod && data.salesByPaymentMethod.length > 0) {
      doc.setFontSize(14);
      doc.setTextColor(55, 65, 81); // #374151
      doc.text('Sales by Payment Method', 20, doc.y || 120);

      doc.y = (doc.y || 120) + 10;

      const paymentHeaders = ['Payment Method', 'Transaction Count', 'Total Amount'];
      const paymentRows = data.salesByPaymentMethod.map(method => [
        method.paymentMethod.toUpperCase(),
        method.transactionCount.toString(),
        `$${method.totalAmount.toFixed(2)}`
      ]);

      addPDFTable(doc, paymentHeaders, paymentRows, {
        columnWidths: [150, 125, 125],
        startY: doc.y
      });
    }

    // Add footer
    addPDFFooter(doc);
  });
}

/**
 * Generate Transaction Report PDF
 */
export async function generateTransactionReportPdf(
  data: TransactionReportData[],
  period?: { from: string; to: string }
): Promise<ArrayBuffer> {
  return createPDFDocument((doc) => {
    // Add header
    addPDFHeader(doc, 'Transaction Report', period);

    // Calculate summary statistics
    const totalTransactions = data.length;
    const salesTransactions = data.filter(t => t.type === 'sale');
    const expenseTransactions = data.filter(t => t.type === 'expense');
    const depositTransactions = data.filter(t => t.type === 'deposit');

    const totalAmount = data.reduce((sum, t) => sum + t.amount, 0);

    // Add summary section
    addPDFSummary(doc, 'Transaction Summary', [
      { label: 'Total Transactions', value: totalTransactions.toString() },
      { label: 'Sales Transactions', value: salesTransactions.length.toString() },
      { label: 'Expense Transactions', value: expenseTransactions.length.toString() },
      { label: 'Deposit Transactions', value: depositTransactions.length.toString() },
      { label: 'Total Amount', value: `$${totalAmount.toFixed(2)}` }
    ], 60);

    // Prepare table data
    const headers = [
      'Date',
      'Type',
      'Description',
      'Amount',
      'Payment Method',
      'Category'
    ];

    const rows = data.map(transaction => [
      new Date(transaction.date).toLocaleDateString(),
      transaction.type.toUpperCase(),
      transaction.description,
      `$${transaction.amount.toFixed(2)}`,
      transaction.paymentMethod?.toUpperCase() || 'N/A',
      transaction.category || 'N/A'
    ]);

    // Add table
    addPDFTable(doc, headers, rows, {
      columnWidths: [70, 60, 120, 70, 80, 80],
      startY: doc.y
    });

    // Add footer
    addPDFFooter(doc);
  });
}

/**
 * Generate Product Report PDF
 */
export async function generateProductReportPdf(
  data: ProductReportData[],
  period?: { from: string; to: string }
): Promise<ArrayBuffer> {
  return createPDFDocument((doc) => {
    // Add header
    addPDFHeader(doc, 'Product Report', period);

    // Calculate summary statistics
    const totalProducts = data.length;
    const totalRevenue = data.reduce((sum, product) => sum + product.totalRevenue, 0);
    const averagePrice = data.reduce((sum, product) => sum + product.price, 0) / totalProducts;

    // Add summary section
    addPDFSummary(doc, 'Product Summary', [
      { label: 'Total Products', value: totalProducts.toString() },
      { label: 'Total Revenue', value: `$${totalRevenue.toFixed(2)}` },
      { label: 'Average Price', value: `$${averagePrice.toFixed(2)}` }
    ], 60);

    // Prepare table data
    const headers = [
      'Product Name',
      'SKU',
      'Category',
      'Price',
      'Current Stock',
      'Total Sold',
      'Revenue',
      'Profit Margin'
    ];

    const rows = data.map(product => [
      product.name,
      product.sku,
      product.category,
      `$${product.price.toFixed(2)}`,
      product.currentStock.toString(),
      product.totalSold.toString(),
      `$${product.totalRevenue.toFixed(2)}`,
      `${product.profitMargin.toFixed(1)}%`
    ]);

    // Add table
    addPDFTable(doc, headers, rows, {
      columnWidths: [80, 60, 70, 60, 60, 60, 70, 70],
      startY: doc.y
    });

    // Add footer
    addPDFFooter(doc);
  });
}

/**
 * Generate Customer Report PDF
 */
export async function generateCustomerReportPdf(
  data: CustomerReportData[],
  period?: { from: string; to: string }
): Promise<ArrayBuffer> {
  return createPDFDocument((doc) => {
    // Add header
    addPDFHeader(doc, 'Customer Report', period);

    // Add summary section
    addPDFSummary(doc, 'Customer Summary', [
      { label: 'Total Customers', value: data.length.toString() }
    ], 60);

    // Prepare table data
    const headers = [
      'Customer ID',
      'Name',
      'Email',
      'Phone',
      'Total Orders',
      'Total Spent'
    ];

    const rows = data.map(customer => [
      customer.customerId?.substring(0, 8) + '...' || 'N/A',
      customer.customerName,
      customer.customerEmail || 'N/A',
      customer.customerPhone || 'N/A',
      customer.totalPurchases.toString(),
      `$${customer.totalSpent.toFixed(2)}`
    ]);

    // Add table
    addPDFTable(doc, headers, rows, {
      columnWidths: [80, 100, 120, 80, 70, 80],
      startY: doc.y
    });

    // Add footer
    addPDFFooter(doc);
  });
}

/**
 * Generate General Report PDF
 */
export async function generateGeneralReportPdf(
  data: GeneralReportData[],
  period?: { from: string; to: string }
): Promise<ArrayBuffer> {
  return createPDFDocument((doc) => {
    // Add header
    let currentY = addPDFHeader(doc, 'General Report', period);

    // Calculate summary statistics
    const totalRevenue = data.reduce((sum, item) => sum + item.totalPrice, 0);
    const totalProfit = data.reduce((sum, item) => sum + item.profit.totalProfit, 0);
    const totalSalesAmount = data.reduce((sum, item) => sum + item.sales.amount, 0);

    // Add summary section
    currentY = addPDFSummary(doc, 'Business Summary', [
      { label: 'Total Products', value: data.length.toString() },
      { label: 'Total Revenue', value: `$${totalRevenue.toFixed(2)}` },
      { label: 'Total Profit', value: `$${totalProfit.toFixed(2)}` },
      { label: 'Total Sales Amount', value: `$${totalSalesAmount.toFixed(2)}` }
    ], currentY);

    // Prepare table data
    const headers = [
      'Product',
      'Opening',
      'New',
      'Damaged',
      'Closing',
      'Sales',
      'Profit'
    ];

    const rows = data.map(item => [
      item.productName.substring(0, 15),
      `${item.openingStock.boxes}B`,
      `${item.newStock.boxes}B`,
      `${item.damaged.boxes}B`,
      `${item.closingStock.boxes}B`,
      `$${item.sales.amount.toFixed(0)}`,
      `$${item.profit.totalProfit.toFixed(0)}`
    ]);

    // Add table
    addPDFTable(doc, headers, rows, {
      columnWidths: [30, 20, 20, 20, 20, 25, 25],
      startY: currentY
    });

    // Add footer
    addPDFFooter(doc);
  });
}

/**
 * Generate Top Selling Report PDF
 */
export async function generateTopSellingReportPdf(
  data: TopSellingReportData[],
  period?: { from: string; to: string }
): Promise<ArrayBuffer> {
  return createPDFDocument((doc) => {
    // Add header
    addPDFHeader(doc, 'Top Selling Products Report', period);

    // Prepare table data with the requested columns only
    const headers = [
      'Product',
      'Total Sold',
      'Total Revenue',
      'Damaged Rate'
    ];

    const rows = data.map((product) => {
      return [
        product.product || 'N/A',
        product.totalSold?.toString() || '0',
        `$${(product.totalRevenue || 0).toFixed(2)}`,
        `${(product.damageRate || 0).toFixed(2)}%`
      ];
    });

    // Add table directly after header with properly centered and sized columns
    // A4 page width is ~210mm, with 20mm margins on each side = 170mm usable width
    // Center the table by using startX and balanced column widths
    addPDFTable(doc, headers, rows, {
      columnWidths: [60, 35, 50, 35], // Total: 180 units - fits well within 170mm usable width
      startX: 25, // Start further from left edge to center the table
      startY: doc.y
    });

    // Add footer
    addPDFFooter(doc);
  });
}

/**
 * Generate Debtor/Credit Report PDF
 */
export async function generateDebtorCreditReportPdf(
  data: DebtorCreditReportData[],
  period?: { from: string; to: string }
): Promise<ArrayBuffer> {
  return createPDFDocument((doc) => {
    // Add header
    let currentY = addPDFHeader(doc, 'Debtor/Credit Report', period);

    if (data.length > 0) {
      // Prepare table data with the requested columns (email after phone)
      const headers = [
        'Client Name',
        'Amount Owed',
        'Amount Paid',
        'Phone Number',
        'Email'
      ];

      const rows = data.map(debtor => [
        debtor.clientName,
        `$${debtor.amountOwed.toFixed(2)}`,
        `$${debtor.amountPaid.toFixed(2)}`,
        debtor.phoneNumber,
        debtor.email
      ]);

      // Add table with properly sized columns that don't touch page edges
      // A4 page width is ~210mm, with generous margins to prevent cutoff
      // Total width must be much smaller to ensure email column is fully visible
      addPDFTable(doc, headers, rows, {
        columnWidths: [35, 30, 30, 35, 40], // Total: 170 units - significantly reduced
        startX: 25, // More left margin to center the table
        startY: currentY + 10
      });
    } else {
      doc.setFontSize(12);
      doc.setTextColor(5, 150, 105); // #059669
      doc.text('No outstanding payments found!', 105, currentY + 20, { align: 'center' });
    }

    // Add footer
    addPDFFooter(doc);
  });
}

/**
 * Generate Profit and Loss Report PDF
 */
export async function generateProfitLossReportPdf(
  data: FinancialReportData,
  period?: { from: string; to: string }
): Promise<ArrayBuffer> {
  return createPDFDocument((doc) => {
    // Add header
    let currentY = addPDFHeader(doc, 'Profit and Loss Report', period);

    // Add profit and loss items in list format as requested
    currentY = addPDFSummary(doc, 'Profit and Loss Statement', [
      { label: 'Total Revenue', value: `$${data.totalSales.toFixed(2)}` },
      { label: 'Cost of Stock', value: `$${(data.costOfStock || 0).toFixed(2)}` },
      { label: 'Damaged Value', value: `$${(data.damagedValue || 0).toFixed(2)}` },
      { label: 'Total Expenses', value: `$${data.totalExpenses.toFixed(2)}` },
      { label: 'Total Profit', value: `$${data.netProfit.toFixed(2)}` }
    ], currentY);

    // Add footer
    addPDFFooter(doc);
  });
}
