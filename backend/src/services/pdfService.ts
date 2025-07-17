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
    const totalRevenue = data.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const totalTax = data.reduce((sum, sale) => sum + sale.taxAmount, 0);
    const totalDiscount = data.reduce((sum, sale) => sum + sale.discountAmount, 0);
    const averageSale = totalSales > 0 ? totalRevenue / totalSales : 0;

    // Add summary section
    currentY = addPDFSummary(doc, 'Sales Summary', [
      { label: 'Total Sales', value: totalSales.toString() },
      { label: 'Total Revenue', value: `$${totalRevenue.toFixed(2)}` },
      { label: 'Total Tax', value: `$${totalTax.toFixed(2)}` },
      { label: 'Total Discount', value: `$${totalDiscount.toFixed(2)}` },
      { label: 'Average Sale', value: `$${averageSale.toFixed(2)}` }
    ], currentY);

    // Prepare table data
    const headers = [
      'Sale ID',
      'Date',
      'Customer',
      'Amount',
      'Payment',
      'Status'
    ];

    const rows = data.map(sale => [
      sale.saleId.substring(0, 8),
      new Date(sale.saleDate).toLocaleDateString(),
      (sale.customerName || 'Walk-in').substring(0, 15),
      `$${sale.totalAmount.toFixed(0)}`,
      sale.paymentMethod.toUpperCase().substring(0, 8),
      sale.paymentStatus.toUpperCase().substring(0, 8)
    ]);

    // Add table
    addPDFTable(doc, headers, rows, {
      columnWidths: [25, 25, 35, 25, 25, 25],
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
      doc.fontSize(14)
         .fillColor('#374151')
         .text('Top Selling Products');

      doc.moveDown(0.5);

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
      doc.fontSize(14)
         .fillColor('#374151')
         .text('Sales by Payment Method');

      doc.moveDown(0.5);

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
  data: ProductReportData[],
  period?: { from: string; to: string }
): Promise<ArrayBuffer> {
  return createPDFDocument((doc) => {
    // Add header
    addPDFHeader(doc, 'Top Selling Products Report', period);

    // Sort products by sales performance and take top items
    const topSellingData = data
      .sort((a, b) => b.totalSold - a.totalSold)
      .slice(0, 20); // Top 20 selling products

    // Add summary
    addPDFSummary(doc, 'Top Selling Products Summary', [
      { label: 'Total Products Analyzed', value: data.length.toString() },
      { label: 'Top Products Shown', value: topSellingData.length.toString() }
    ], 60);

    // Prepare table data
    const headers = [
      'Rank',
      'Product Name',
      'Units Sold',
      'Revenue',
      'Profit Margin',
      'Profit Amount'
    ];

    const rows = topSellingData.map((product, index) => {
      const profit = product.totalRevenue * (product.profitMargin / 100);
      return [
        (index + 1).toString(),
        product.name,
        product.totalSold.toString(),
        `$${product.totalRevenue.toFixed(2)}`,
        `${product.profitMargin.toFixed(1)}%`,
        `$${profit.toFixed(2)}`
      ];
    });

    // Add table
    addPDFTable(doc, headers, rows, {
      columnWidths: [40, 120, 80, 80, 80, 80],
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
  data: SalesReportData[],
  period?: { from: string; to: string }
): Promise<ArrayBuffer> {
  return createPDFDocument((doc) => {
    // Add header
    addPDFHeader(doc, 'Debtor/Credit Report', period);

    // Filter for unpaid and failed sales
    const debtorData = data.filter(sale =>
      sale.paymentStatus === 'pending' || sale.paymentStatus === 'failed'
    );

    const totalOutstanding = debtorData.reduce((sum, sale) => sum + sale.totalAmount, 0);

    // Add summary
    addPDFSummary(doc, 'Outstanding Payments Summary', [
      { label: 'Total Sales Analyzed', value: data.length.toString() },
      { label: 'Outstanding Sales', value: debtorData.length.toString() },
      { label: 'Total Outstanding Amount', value: `$${totalOutstanding.toFixed(2)}` }
    ], 60);

    if (debtorData.length > 0) {
      // Prepare table data
      const headers = [
        'Sale ID',
        'Date',
        'Customer',
        'Amount',
        'Status',
        'Payment Method'
      ];

      const rows = debtorData.map(sale => [
        sale.saleId.substring(0, 8) + '...',
        new Date(sale.saleDate).toLocaleDateString(),
        sale.customerName || 'Walk-in Customer',
        `$${sale.totalAmount.toFixed(2)}`,
        sale.paymentStatus.toUpperCase(),
        sale.paymentMethod.toUpperCase()
      ]);

      // Add table
      addPDFTable(doc, headers, rows, {
        columnWidths: [80, 80, 100, 80, 70, 90],
        startY: doc.y
      });
    } else {
      doc.fontSize(12)
         .fillColor('#059669')
         .text('No outstanding payments found!', { align: 'center' });
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
    addPDFHeader(doc, 'Profit and Loss Report', period);

    // Add financial summary
    let currentY = addPDFSummary(doc, 'Financial Overview', [
      { label: 'Total Sales', value: `$${data.totalSales.toFixed(2)}` },
      { label: 'Total Expenses', value: `$${data.totalExpenses.toFixed(2)}` },
      { label: 'Total Deposits', value: `$${data.totalDeposits.toFixed(2)}` },
      { label: 'Net Profit', value: `$${data.netProfit.toFixed(2)}` },
      { label: 'Sales Count', value: data.salesCount.toString() },
      { label: 'Average Sale Amount', value: `$${data.averageSaleAmount.toFixed(2)}` }
    ], 60);

    // Top Selling Products section
    if (data.topSellingProducts && data.topSellingProducts.length > 0) {
      doc.fontSize(14)
         .fillColor('#374151')
         .text('Top Selling Products');

      doc.moveDown(0.5);

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
      doc.fontSize(14)
         .fillColor('#374151')
         .text('Sales by Payment Method');

      doc.moveDown(0.5);

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
