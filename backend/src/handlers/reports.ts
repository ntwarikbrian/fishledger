/**
 * Report Handlers
 * Handles PDF report generation for various business data
 */

import type { Context } from 'hono';
import type {
  Env,
  Variables,
  ReportRequest,
  StockReportData,
  SalesReportData,
  FinancialReportData,
  TransactionReportData,
  ProductReportData,
  CustomerReportData,
  GeneralReportData,
  TopSellingReportData,
  DebtorCreditReportData,
  ReportResponse,
  ApiResponse
} from '../types';
import {
  generateStockReportPdf,
  generateSalesReportPdf,
  generateFinancialReportPdf,
  generateTransactionReportPdf,
  generateProductReportPdf,
  generateCustomerReportPdf,
  generateGeneralReportPdf,
  generateTopSellingReportPdf,
  generateDebtorCreditReportPdf,
  generateProfitLossReportPdf
} from '../services/pdfService';
import { createSuccessResponse, createHandlerErrorResponse } from '../utils/response';
import { getUserIdFromContext } from '../middleware/data-isolation';

/**
 * Generate General Report PDF
 * GET /api/reports/general/pdf
 */
export async function generateGeneralReport(c: Context<{ Bindings: Env; Variables: Variables }>) {
  try {
    const supabase = c.get('supabase');
    const requestId = c.get('requestId');

    // Get query parameters for filtering
    const dateFrom = c.req.query('dateFrom');
    const dateTo = c.req.query('dateTo');
    const categoryId = c.req.query('categoryId');

    // Fetch all products
    let productsQuery = supabase
      .from('products')
      .select(`
        product_id,
        name,
        quantity_box,
        quantity_kg,
        price_per_box,
        price_per_kg,
        cost_per_box,
        cost_per_kg,
        category_id
      `);

    // Apply category filter
    if (categoryId) {
      productsQuery = productsQuery.eq('category_id', categoryId);
    }

    const { data: products, error: productsError } = await productsQuery;

    if (productsError) {
      throw new Error(`Failed to fetch products: ${productsError.message}`);
    }

    if (!products || products.length === 0) {
      throw new Error('No products found');
    }

    // Process each product to calculate general report data
    const generalReportData: GeneralReportData[] = await Promise.all(
      products.map(async (product) => {
        // Calculate opening stock (current stock - new stock + sales + damaged)
        // For simplicity, we'll use current stock as opening stock
        const openingStock = {
          boxes: product.quantity_box,
          kg: product.quantity_kg
        };

        // Fetch new stock additions for the period
        let stockAdditionsQuery = supabase
          .from('stock_additions')
          .select('boxes_added, kg_added')
          .eq('product_id', product.product_id)
          .eq('status', 'completed');

        if (dateFrom) {
          stockAdditionsQuery = stockAdditionsQuery.gte('delivery_date', dateFrom);
        }
        if (dateTo) {
          stockAdditionsQuery = stockAdditionsQuery.lte('delivery_date', dateTo);
        }

        const { data: stockAdditions } = await stockAdditionsQuery;
        const newStock = stockAdditions?.reduce(
          (acc, addition) => ({
            boxes: acc.boxes + addition.boxes_added,
            kg: acc.kg + addition.kg_added
          }),
          { boxes: 0, kg: 0 }
        ) || { boxes: 0, kg: 0 };

        // Fetch damaged stock for the period
        let damagedQuery = supabase
          .from('stock_movements')
          .select('box_change, kg_change')
          .eq('product_id', product.product_id)
          .eq('movement_type', 'damaged')
          .eq('status', 'completed');

        if (dateFrom) {
          damagedQuery = damagedQuery.gte('created_at', dateFrom);
        }
        if (dateTo) {
          damagedQuery = damagedQuery.lte('created_at', dateTo);
        }

        const { data: damagedMovements } = await damagedQuery;
        const damaged = damagedMovements?.reduce(
          (acc, movement) => ({
            boxes: acc.boxes + Math.abs(movement.box_change || 0),
            kg: acc.kg + Math.abs(movement.kg_change || 0)
          }),
          { boxes: 0, kg: 0 }
        ) || { boxes: 0, kg: 0 };

        // Fetch sales data for the period
        let salesQuery = supabase
          .from('sales')
          .select('boxes_quantity, kg_quantity, total_amount, payment_status')
          .eq('product_id', product.product_id);

        if (dateFrom) {
          salesQuery = salesQuery.gte('date_time', dateFrom);
        }
        if (dateTo) {
          salesQuery = salesQuery.lte('date_time', dateTo);
        }

        const { data: sales } = await salesQuery;

        const salesData = sales?.reduce(
          (acc, sale) => ({
            boxes: acc.boxes + sale.boxes_quantity,
            kg: acc.kg + sale.kg_quantity,
            amount: acc.amount + sale.total_amount
          }),
          { boxes: 0, kg: 0, amount: 0 }
        ) || { boxes: 0, kg: 0, amount: 0 };

        // Calculate unpaid sales
        const unpaidSales = sales?.filter(sale => sale.payment_status === 'pending' || sale.payment_status === 'partial');
        const unpaid = unpaidSales?.reduce(
          (acc, sale) => ({
            boxes: acc.boxes + sale.boxes_quantity,
            kg: acc.kg + sale.kg_quantity,
            amount: acc.amount + sale.total_amount
          }),
          { boxes: 0, kg: 0, amount: 0 }
        ) || { boxes: 0, kg: 0, amount: 0 };

        // Calculate closing stock (opening + new - sales - damaged)
        const closingStock = {
          boxes: openingStock.boxes + newStock.boxes - salesData.boxes - damaged.boxes,
          kg: openingStock.kg + newStock.kg - salesData.kg - damaged.kg
        };

        // Calculate profit
        const boxProfit = product.price_per_box - product.cost_per_box;
        const kgProfit = product.price_per_kg - product.cost_per_kg;
        const totalProfit = (salesData.boxes * boxProfit) + (salesData.kg * kgProfit);

        return {
          productName: product.name,
          openingStock,
          newStock,
          damaged,
          closingStock,
          unpaid,
          sales: salesData,
          unitPrice: {
            boxPrice: product.cost_per_box,
            kgPrice: product.cost_per_kg
          },
          sellingPrice: {
            boxPrice: product.price_per_box,
            kgPrice: product.price_per_kg
          },
          profit: {
            boxProfit,
            kgProfit,
            totalProfit
          },
          totalPrice: salesData.amount
        };
      })
    );

    // Generate PDF
    const period = dateFrom && dateTo ? { from: dateFrom, to: dateTo } : undefined;
    const pdfBuffer = await generateGeneralReportPdf(generalReportData, period);

    // Check if this is for inline viewing or download
    const download = c.req.query('download') === 'true';
    const filename = `general-report-${new Date().toISOString().split('T')[0]}.pdf`;

    // Return PDF response with appropriate headers
    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': download
          ? `attachment; filename="${filename}"`
          : `inline; filename="${filename}"`,
        'Cache-Control': 'no-cache',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });

  } catch (error) {
    console.error('Error generating general report:', error);
    return c.json(
      createHandlerErrorResponse(
        'Failed to generate general report',
        c.get('requestId'),
        error instanceof Error ? error.message : 'Unknown error'
      ),
      500
    );
  }
}

/**
 * Generate Stock Report PDF
 * GET /api/reports/stock/pdf
 */
export async function generateStockReport(c: Context<{ Bindings: Env; Variables: Variables }>) {
  try {
    const supabase = c.get('supabase');
    const requestId = c.get('requestId');

    // Get query parameters for filtering
    const dateFrom = c.req.query('dateFrom');
    const dateTo = c.req.query('dateTo');
    const categoryId = c.req.query('categoryId');
    const lowStockOnly = c.req.query('lowStockOnly') === 'true';

    // Build query for stock data
    let query = supabase
      .from('products')
      .select(`
        product_id,
        name,
        quantity_box,
        quantity_kg,
        boxed_low_stock_threshold,
        price_per_box,
        price_per_kg,
        cost_per_box,
        cost_per_kg,
        category_id
      `);

    // Apply filters
    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    if (lowStockOnly) {
      query = query.lt('stock_quantity', 'min_stock_level');
    }

    const { data: products, error } = await query;

    if (error) {
      console.error('Error fetching stock data:', error);
      return c.json(createHandlerErrorResponse('Failed to fetch stock data', requestId, error.message), 500);
    }

    if (!products || products.length === 0) {
      return c.json(createHandlerErrorResponse('No stock data found', requestId), 404);
    }

    // Transform data for PDF generation
    const stockData: StockReportData[] = products.map(product => {
      // Calculate total stock value (boxes + kg)
      const boxValue = product.quantity_box * product.cost_per_box;
      const kgValue = product.quantity_kg * product.cost_per_kg;
      const stockValue = boxValue + kgValue;

      // Calculate total stock in kg equivalent for status determination
      const totalStockKg = (product.quantity_box * 20) + product.quantity_kg; // Assuming 20kg per box
      const lowStockThresholdKg = product.boxed_low_stock_threshold * 20;

      let status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'overstock' = 'in_stock';

      if (totalStockKg === 0) {
        status = 'out_of_stock';
      } else if (product.quantity_box < product.boxed_low_stock_threshold) {
        status = 'low_stock';
      }

      return {
        productId: product.product_id,
        productName: product.name,
        sku: `${product.quantity_box}B/${product.quantity_kg}KG`, // Use box/kg as SKU equivalent
        category: 'Fish Products', // Simplified category
        currentStock: totalStockKg,
        minStockLevel: lowStockThresholdKg,
        maxStockLevel: lowStockThresholdKg * 2, // Estimate max as 2x min
        stockValue,
        lastMovementDate: new Date().toISOString(), // Use current date as placeholder
        status,
      };
    });

    // Generate PDF
    const period = dateFrom && dateTo ? { from: dateFrom, to: dateTo } : undefined;
    const pdfBuffer = await generateStockReportPdf(stockData, period);

    // Return PDF response
    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="stock-report-${new Date().toISOString().split('T')[0]}.pdf"`,
        'Cache-Control': 'no-cache',
      },
    });

  } catch (error) {
    console.error('Error generating stock report:', error);
    const requestId = c.get('requestId');
    return c.json(
      createHandlerErrorResponse(
        'Failed to generate stock report',
        requestId,
        error instanceof Error ? error.message : 'Unknown error'
      ),
      500
    );
  }
}

/**
 * Generate Sales Report PDF
 * GET /api/reports/sales/pdf
 */
export async function generateSalesReport(c: Context<{ Bindings: Env; Variables: Variables }>) {
  try {
    const supabase = c.get('supabase');
    const requestId = c.get('requestId');

    // Get query parameters for filtering
    const dateFrom = c.req.query('dateFrom');
    const dateTo = c.req.query('dateTo');
    const paymentMethod = c.req.query('paymentMethod');
    const paymentStatus = c.req.query('paymentStatus');

    // Build query for sales data with joins to get product and user information
    let query = supabase
      .from('sales')
      .select(`
        id,
        date_time,
        client_name,
        total_amount,
        payment_method,
        payment_status,
        boxes_quantity,
        kg_quantity,
        box_price,
        kg_price,
        products!inner(
          name,
          cost_per_box,
          cost_per_kg
        ),
        users!inner(
          owner_name
        )
      `)
      .order('date_time', { ascending: false });

    // Apply date filters
    if (dateFrom) {
      query = query.gte('date_time', dateFrom);
    }
    if (dateTo) {
      query = query.lte('date_time', dateTo);
    }

    // Apply other filters
    if (paymentMethod) {
      query = query.eq('payment_method', paymentMethod);
    }
    if (paymentStatus) {
      query = query.eq('payment_status', paymentStatus);
    }

    const { data: sales, error } = await query;

    if (error) {
      console.error('Error fetching sales data:', error);
      return c.json(createHandlerErrorResponse('Failed to fetch sales data', requestId, error.message), 500);
    }

    if (!sales || sales.length === 0) {
      // Generate an empty report with a message indicating no data was found
      const period = dateFrom && dateTo ? { from: dateFrom, to: dateTo } : undefined;
      const emptyPdfBuffer = await generateSalesReportPdf([], period);

      // Return PDF response with appropriate headers
      return new Response(emptyPdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `inline; filename="sales-report-${new Date().toISOString().split('T')[0]}.pdf"`,
          'Cache-Control': 'no-cache',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    // Transform data for PDF generation with new structure
    const salesData: SalesReportData[] = sales.map(sale => {
      // Calculate profit for this sale
      const product = Array.isArray(sale.products) ? sale.products[0] : sale.products;
      const user = Array.isArray(sale.users) ? sale.users[0] : sale.users;
      const boxProfit = sale.boxes_quantity * (sale.box_price - (product?.cost_per_box || 0));
      const kgProfit = sale.kg_quantity * (sale.kg_price - (product?.cost_per_kg || 0));
      const totalProfit = boxProfit + kgProfit;

      // Format quantity sold display
      const quantityParts = [];
      if (sale.boxes_quantity > 0) {
        quantityParts.push(`${sale.boxes_quantity} boxes`);
      }
      if (sale.kg_quantity > 0) {
        quantityParts.push(`${sale.kg_quantity} kg`);
      }
      const quantitySold = quantityParts.join(', ') || '0';

      // Format unit price display (cost price from products table)
      const costPriceParts = [];
      if (sale.boxes_quantity > 0) {
        costPriceParts.push(`$${(product?.cost_per_box || 0).toFixed(2)}/box`);
      }
      if (sale.kg_quantity > 0) {
        costPriceParts.push(`$${(product?.cost_per_kg || 0).toFixed(2)}/kg`);
      }
      const unitPrice = costPriceParts.join(', ') || '$0.00';

      // Format selling price display (actual selling prices)
      const sellingPriceParts = [];
      if (sale.boxes_quantity > 0) {
        sellingPriceParts.push(`$${sale.box_price.toFixed(2)}/box`);
      }
      if (sale.kg_quantity > 0) {
        sellingPriceParts.push(`$${sale.kg_price.toFixed(2)}/kg`);
      }
      const sellingPrice = sellingPriceParts.join(', ') || '$0.00';

      return {
        productName: product?.name || 'Unknown Product',
        quantitySold,
        clientName: sale.client_name || 'Walk-in Customer',
        unitPrice, // Now shows cost price
        sellingPrice, // Now shows actual selling price
        profit: totalProfit,
        total: sale.total_amount,
        seller: user?.owner_name || 'Unknown Seller',
        paymentStatus: sale.payment_status,
        saleDate: sale.date_time,
        paymentMethod: sale.payment_method,
      };
    });

    // Generate PDF
    const period = dateFrom && dateTo ? { from: dateFrom, to: dateTo } : undefined;
    const pdfBuffer = await generateSalesReportPdf(salesData, period);

    // Check if this is for inline viewing or download
    const download = c.req.query('download') === 'true';
    const filename = `sales-report-${new Date().toISOString().split('T')[0]}.pdf`;

    // Return PDF response with appropriate headers
    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': download
          ? `attachment; filename="${filename}"`
          : `inline; filename="${filename}"`,
        'Cache-Control': 'no-cache',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });

  } catch (error) {
    console.error('Error generating sales report:', error);
    const requestId = c.get('requestId');
    return c.json(
      createHandlerErrorResponse(
        'Failed to generate sales report',
        requestId,
        error instanceof Error ? error.message : 'Unknown error'
      ),
      500
    );
  }
}

/**
 * Generate Financial Report PDF
 * GET /api/reports/financial/pdf
 */
export async function generateFinancialReport(c: Context<{ Bindings: Env; Variables: Variables }>) {
  try {
    const supabase = c.get('supabase');
    const requestId = c.get('requestId');

    // Get query parameters for filtering
    const dateFrom = c.req.query('dateFrom');
    const dateTo = c.req.query('dateTo');

    if (!dateFrom || !dateTo) {
      return c.json(createHandlerErrorResponse('Date range is required for financial reports', requestId), 400);
    }

    // Fetch sales data
    const { data: salesData, error: salesError } = await supabase
      .from('sales')
      .select('total_amount, payment_method, boxes_quantity, kg_quantity, product_id')
      .gte('date_time', dateFrom)
      .lte('date_time', dateTo)
      .eq('payment_status', 'paid');

    if (salesError) {
      console.error('Error fetching sales data:', salesError);
      return c.json(createHandlerErrorResponse('Failed to fetch sales data', requestId, salesError.message), 500);
    }

    // Fetch expenses data
    const { data: expensesData, error: expensesError } = await supabase
      .from('expenses')
      .select('amount')
      .gte('date', dateFrom)
      .lte('date', dateTo)
      .eq('status', 'paid');

    if (expensesError) {
      console.error('Error fetching expenses data:', expensesError);
      return c.json(createHandlerErrorResponse('Failed to fetch expenses data', requestId, expensesError.message), 500);
    }

    // Fetch deposits data
    const { data: depositsData, error: depositsError } = await supabase
      .from('deposits')
      .select('amount')
      .gte('date_time', dateFrom)
      .lte('date_time', dateTo)
      .eq('approval', 'approved');

    if (depositsError) {
      console.error('Error fetching deposits data:', depositsError);
      return c.json(createHandlerErrorResponse('Failed to fetch deposits data', requestId, depositsError.message), 500);
    }

    // Calculate financial metrics
    const totalSales = salesData?.reduce((sum, sale) => sum + sale.total_amount, 0) || 0;
    const totalExpenses = expensesData?.reduce((sum, expense) => sum + expense.amount, 0) || 0;
    const totalDeposits = depositsData?.reduce((sum, deposit) => sum + deposit.amount, 0) || 0;
    const netProfit = totalSales - totalExpenses;

    const salesCount = salesData?.length || 0;
    const expenseCount = expensesData?.length || 0;
    const depositCount = depositsData?.length || 0;
    const averageSaleAmount = salesCount > 0 ? totalSales / salesCount : 0;

    // Calculate top selling products
    const productSales = new Map<string, { name: string; quantity: number; revenue: number }>();

    salesData?.forEach(sale => {
      const productName = `Product-${sale.product_id}`;
      const existing = productSales.get(productName) || { name: productName, quantity: 0, revenue: 0 };
      // Convert boxes and kg to unified quantity (assuming 20kg per box)
      existing.quantity += sale.boxes_quantity + (sale.kg_quantity / 20);
      existing.revenue += sale.total_amount;
      productSales.set(productName, existing);
    });

    const topSellingProducts = Array.from(productSales.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10)
      .map(product => ({
        productId: '', // We don't have product ID in this query
        productName: product.name,
        quantitySold: product.quantity,
        totalRevenue: product.revenue,
      }));

    // Calculate sales by payment method
    const paymentMethodSales = new Map<string, { count: number; amount: number }>();
    
    salesData?.forEach(sale => {
      const method = sale.payment_method;
      const existing = paymentMethodSales.get(method) || { count: 0, amount: 0 };
      existing.count += 1;
      existing.amount += sale.total_amount;
      paymentMethodSales.set(method, existing);
    });

    const salesByPaymentMethod = Array.from(paymentMethodSales.entries()).map(([method, data]) => ({
      paymentMethod: method as any,
      transactionCount: data.count,
      totalAmount: data.amount,
    }));

    // Create financial report data
    const financialData: FinancialReportData = {
      period: `${dateFrom} to ${dateTo}`,
      totalSales,
      totalExpenses,
      totalDeposits,
      netProfit,
      salesCount,
      expenseCount,
      depositCount,
      averageSaleAmount,
      topSellingProducts,
      salesByPaymentMethod,
    };

    // Generate PDF
    const period = { from: dateFrom, to: dateTo };
    const pdfBuffer = await generateFinancialReportPdf(financialData, period);

    // Check if this is for inline viewing or download
    const download = c.req.query('download') === 'true';
    const filename = `financial-report-${new Date().toISOString().split('T')[0]}.pdf`;

    // Return PDF response with appropriate headers
    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': download
          ? `attachment; filename="${filename}"`
          : `inline; filename="${filename}"`,
        'Cache-Control': 'no-cache',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });

  } catch (error) {
    console.error('Error generating financial report:', error);
    const requestId = c.get('requestId');
    return c.json(
      createHandlerErrorResponse(
        'Failed to generate financial report',
        requestId,
        error instanceof Error ? error.message : 'Unknown error'
      ),
      500
    );
  }
}

/**
 * Generate Transaction Report PDF
 * GET /api/reports/transactions/pdf
 */
export async function generateTransactionReport(c: Context<{ Bindings: Env; Variables: Variables }>) {
  try {
    const supabase = c.get('supabase');
    const requestId = c.get('requestId');

    // Get query parameters for filtering
    const dateFrom = c.req.query('dateFrom');
    const dateTo = c.req.query('dateTo');
    const transactionType = c.req.query('type'); // 'sale', 'expense', 'deposit'

    if (!dateFrom || !dateTo) {
      return c.json(createHandlerErrorResponse('Date range is required for transaction reports', requestId), 400);
    }

    const transactions: TransactionReportData[] = [];

    // Fetch sales transactions
    if (!transactionType || transactionType === 'sale') {
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select('id, date_time, client_name, total_amount, payment_method')
        .gte('date_time', dateFrom)
        .lte('date_time', dateTo)
        .eq('payment_status', 'paid');

      if (salesError) {
        console.error('Error fetching sales transactions:', salesError);
        return c.json(createHandlerErrorResponse('Failed to fetch sales transactions', requestId, salesError.message), 500);
      }

      salesData?.forEach(sale => {
        transactions.push({
          transactionId: sale.id,
          date: sale.date_time,
          type: 'sale',
          description: `Sale to ${sale.client_name || 'Walk-in Customer'}`,
          amount: sale.total_amount,
          paymentMethod: sale.payment_method,
          category: 'Sales',
          reference: sale.id,
        });
      });
    }

    // Fetch expense transactions
    if (!transactionType || transactionType === 'expense') {
      const { data: expensesData, error: expensesError } = await supabase
        .from('expenses')
        .select('expense_id, date, title, amount, category_id')
        .gte('date', dateFrom)
        .lte('date', dateTo)
        .eq('status', 'paid');

      if (expensesError) {
        console.error('Error fetching expense transactions:', expensesError);
        return c.json(createHandlerErrorResponse('Failed to fetch expense transactions', requestId, expensesError.message), 500);
      }

      expensesData?.forEach(expense => {
        transactions.push({
          transactionId: expense.expense_id,
          date: expense.date,
          type: 'expense',
          description: expense.title,
          amount: expense.amount,
          paymentMethod: 'cash', // Default since expenses don't have payment method in schema
          category: 'Business Expense',
          reference: expense.expense_id,
        });
      });
    }

    // Fetch deposit transactions
    if (!transactionType || transactionType === 'deposit') {
      const { data: depositsData, error: depositsError } = await supabase
        .from('deposits')
        .select('deposit_id, date_time, account_name, amount, deposit_type')
        .gte('date_time', dateFrom)
        .lte('date_time', dateTo)
        .eq('approval', 'approved');

      if (depositsError) {
        console.error('Error fetching deposit transactions:', depositsError);
        return c.json(createHandlerErrorResponse('Failed to fetch deposit transactions', requestId, depositsError.message), 500);
      }

      depositsData?.forEach(deposit => {
        transactions.push({
          transactionId: deposit.deposit_id,
          date: deposit.date_time,
          type: 'deposit',
          description: `Deposit to ${deposit.account_name}`,
          amount: deposit.amount,
          paymentMethod: deposit.deposit_type,
          category: 'Deposits',
          reference: deposit.deposit_id,
        });
      });
    }

    // Sort transactions by date (newest first)
    transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (transactions.length === 0) {
      return c.json(createHandlerErrorResponse('No transactions found for the specified period', requestId), 404);
    }

    // Generate PDF
    const period = { from: dateFrom, to: dateTo };
    const pdfBuffer = await generateTransactionReportPdf(transactions, period);

    // Return PDF response
    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="transaction-report-${new Date().toISOString().split('T')[0]}.pdf"`,
        'Cache-Control': 'no-cache',
      },
    });

  } catch (error) {
    console.error('Error generating transaction report:', error);
    const requestId = c.get('requestId');
    return c.json(
      createHandlerErrorResponse(
        'Failed to generate transaction report',
        requestId,
        error instanceof Error ? error.message : 'Unknown error'
      ),
      500
    );
  }
}

/**
 * Generate Product Report PDF
 * GET /api/reports/products/pdf
 */
export async function generateProductReport(c: Context<{ Bindings: Env; Variables: Variables }>) {
  try {
    const supabase = c.get('supabase');
    const requestId = c.get('requestId');

    // Get query parameters for filtering
    const dateFrom = c.req.query('dateFrom');
    const dateTo = c.req.query('dateTo');
    const categoryId = c.req.query('categoryId');

    // Build query for product data
    let query = supabase
      .from('products')
      .select(`
        product_id,
        name,
        quantity_box,
        quantity_kg,
        price_per_box,
        price_per_kg,
        cost_per_box,
        cost_per_kg,
        created_at,
        category_id
      `);

    // Apply category filter
    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    const { data: products, error } = await query;

    if (error) {
      console.error('Error fetching product data:', error);
      return c.json(createHandlerErrorResponse('Failed to fetch product data', requestId, error.message), 500);
    }

    if (!products || products.length === 0) {
      return c.json(createHandlerErrorResponse('No product data found', requestId), 404);
    }

    // Transform data for PDF generation
    const productData: ProductReportData[] = products.map(product => {
      // Calculate current stock in kg equivalent
      const currentStockKg = (product.quantity_box * 20) + product.quantity_kg;

      // Calculate average price and cost
      const avgPrice = (product.price_per_box + product.price_per_kg) / 2;
      const avgCost = (product.cost_per_box + product.cost_per_kg) / 2;

      // Calculate profit margin
      const profitMargin = avgPrice > 0 ? ((avgPrice - avgCost) / avgPrice) * 100 : 0;

      return {
        productId: product.product_id,
        name: product.name,
        sku: `${product.quantity_box}B/${product.quantity_kg}KG`,
        category: 'Fish Products',
        price: avgPrice,
        cost: avgCost,
        currentStock: currentStockKg,
        totalSold: 0, // Would need separate sales query to calculate
        totalRevenue: 0, // Would need separate sales query to calculate
        profitMargin,
        lastSaleDate: undefined, // Would need separate sales query to calculate
        createdAt: product.created_at,
      };
    });

    // Generate PDF
    const period = dateFrom && dateTo ? { from: dateFrom, to: dateTo } : undefined;
    const pdfBuffer = await generateProductReportPdf(productData, period);

    // Return PDF response
    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="product-report-${new Date().toISOString().split('T')[0]}.pdf"`,
        'Cache-Control': 'no-cache',
      },
    });

  } catch (error) {
    console.error('Error generating product report:', error);
    const requestId = c.get('requestId');
    return c.json(
      createHandlerErrorResponse(
        'Failed to generate product report',
        requestId,
        error instanceof Error ? error.message : 'Unknown error'
      ),
      500
    );
  }
}

/**
 * Generate Customer Report PDF
 * GET /api/reports/customers/pdf
 */
export async function generateCustomerReport(c: Context<{ Bindings: Env; Variables: Variables }>) {
  try {
    const supabase = c.get('supabase');
    const requestId = c.get('requestId');

    // Get query parameters for filtering
    const dateFrom = c.req.query('dateFrom');
    const dateTo = c.req.query('dateTo');

    // Build query for customer data
    let query = supabase
      .from('sales')
      .select(`
        client_name,
        email_address,
        phone,
        total_amount,
        date_time,
        payment_status
      `)
      .eq('payment_status', 'paid')
      .not('client_name', 'is', null);

    // Apply date filters
    if (dateFrom) {
      query = query.gte('date_time', dateFrom);
    }
    if (dateTo) {
      query = query.lte('date_time', dateTo);
    }

    const { data: sales, error } = await query;

    if (error) {
      console.error('Error fetching customer data:', error);
      return c.json(createHandlerErrorResponse('Failed to fetch customer data', requestId, error.message), 500);
    }

    if (!sales || sales.length === 0) {
      return c.json(createHandlerErrorResponse('No customer data found', requestId), 404);
    }

    // Group sales by customer
    const customerMap = new Map<string, {
      name: string;
      email?: string;
      phone?: string;
      purchases: number;
      totalSpent: number;
      firstPurchase: string;
      lastPurchase: string;
    }>();

    sales.forEach(sale => {
      const customerKey = sale.client_name.toLowerCase();
      const existing = customerMap.get(customerKey);

      if (existing) {
        existing.purchases += 1;
        existing.totalSpent += sale.total_amount;
        existing.lastPurchase = sale.date_time > existing.lastPurchase ? sale.date_time : existing.lastPurchase;
        existing.firstPurchase = sale.date_time < existing.firstPurchase ? sale.date_time : existing.firstPurchase;
        // Update contact info if available
        if (sale.email_address && !existing.email) {
          existing.email = sale.email_address;
        }
        if (sale.phone && !existing.phone) {
          existing.phone = sale.phone;
        }
      } else {
        customerMap.set(customerKey, {
          name: sale.client_name,
          email: sale.email_address,
          phone: sale.phone,
          purchases: 1,
          totalSpent: sale.total_amount,
          firstPurchase: sale.date_time,
          lastPurchase: sale.date_time,
        });
      }
    });

    // Transform data for PDF generation
    const customerData: CustomerReportData[] = Array.from(customerMap.values())
      .map(customer => ({
        customerName: customer.name,
        customerEmail: customer.email,
        customerPhone: customer.phone,
        totalPurchases: customer.purchases,
        totalSpent: customer.totalSpent,
        averageOrderValue: customer.totalSpent / customer.purchases,
        firstPurchaseDate: customer.firstPurchase,
        lastPurchaseDate: customer.lastPurchase,
      }))
      .sort((a, b) => b.totalSpent - a.totalSpent); // Sort by total spent (highest first)

    // Generate PDF
    const period = dateFrom && dateTo ? { from: dateFrom, to: dateTo } : undefined;
    const pdfBuffer = await generateCustomerReportPdf(customerData, period);

    // Return PDF response
    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="customer-report-${new Date().toISOString().split('T')[0]}.pdf"`,
        'Cache-Control': 'no-cache',
      },
    });

  } catch (error) {
    console.error('Error generating customer report:', error);
    const requestId = c.get('requestId');
    return c.json(
      createHandlerErrorResponse(
        'Failed to generate customer report',
        requestId,
        error instanceof Error ? error.message : 'Unknown error'
      ),
      500
    );
  }
}

/**
 * Generate Top Selling Report PDF
 * GET /api/reports/top-selling/pdf
 */
export async function generateTopSellingReport(c: Context<{ Bindings: Env; Variables: Variables }>) {
  try {
    const supabase = c.get('supabase');

    // Get query parameters for filtering
    const dateFrom = c.req.query('dateFrom');
    const dateTo = c.req.query('dateTo');
    const categoryId = c.req.query('categoryId');

    // Fetch all products with category information
    let productsQuery = supabase
      .from('products')
      .select(`
        product_id,
        name,
        quantity_box,
        quantity_kg,
        box_to_kg_ratio,
        price_per_box,
        price_per_kg,
        cost_per_box,
        cost_per_kg,
        created_at,
        category_id
      `);

    // Apply category filter
    if (categoryId) {
      productsQuery = productsQuery.eq('category_id', categoryId);
    }

    const { data: products, error: productsError } = await productsQuery;

    if (productsError) {
      throw new Error(`Failed to fetch products: ${productsError.message}`);
    }

    if (!products || products.length === 0) {
      throw new Error('No products found');
    }

    // Calculate top selling data for each product
    const topSellingData: TopSellingReportData[] = await Promise.all(
      products.map(async (product) => {
        // Get sales data for this product within the date range
        let salesQuery = supabase
          .from('sales')
          .select('boxes_quantity, kg_quantity, total_amount, date_time')
          .eq('product_id', product.product_id)
          .eq('payment_status', 'paid');

        // Apply date filters
        if (dateFrom) {
          salesQuery = salesQuery.gte('date_time', dateFrom);
        }
        if (dateTo) {
          salesQuery = salesQuery.lte('date_time', dateTo);
        }

        const { data: sales } = await salesQuery;

        // Get damaged products data for this product within the date range with data isolation
        const userId = getUserIdFromContext(c);
        let damagedQuery = supabase
          .from('damaged_products')
          .select('damaged_boxes, damaged_kg, damaged_date')
          .eq('product_id', product.product_id)
          .eq('damaged_approval', true)
          .eq('user_id', userId);

        // Apply date filters for damaged products
        if (dateFrom) {
          damagedQuery = damagedQuery.gte('damaged_date', dateFrom);
        }
        if (dateTo) {
          damagedQuery = damagedQuery.lte('damaged_date', dateTo);
        }

        const { data: damagedProducts } = await damagedQuery;

        // Calculate total sold (convert kg to boxes using ratio for consistency)
        const boxToKgRatio = product.box_to_kg_ratio || 20; // Default to 20kg per box
        const totalSoldBoxes = sales?.reduce((sum, sale) => sum + sale.boxes_quantity, 0) || 0;
        const totalSoldKg = sales?.reduce((sum, sale) => sum + sale.kg_quantity, 0) || 0;
        const totalSold = totalSoldBoxes + (totalSoldKg / boxToKgRatio);

        // Calculate total revenue
        const totalRevenue = sales?.reduce((sum, sale) => sum + sale.total_amount, 0) || 0;

        // Calculate total damaged quantity
        const totalDamagedBoxes = damagedProducts?.reduce((sum, damaged) => sum + damaged.damaged_boxes, 0) || 0;
        const totalDamagedKg = damagedProducts?.reduce((sum, damaged) => sum + damaged.damaged_kg, 0) || 0;
        const totalDamaged = totalDamagedBoxes + (totalDamagedKg / boxToKgRatio);

        // Calculate damage rate as percentage
        // Damage rate = (damaged quantity / (sold quantity + damaged quantity)) * 100
        const totalHandled = totalSold + totalDamaged;
        const damageRate = totalHandled > 0 ? (totalDamaged / totalHandled) * 100 : 0;

        return {
          product: product.name,
          totalSold: parseFloat(totalSold.toFixed(2)),
          totalRevenue: parseFloat(totalRevenue.toFixed(2)),
          damageRate: parseFloat(damageRate.toFixed(2))
        };
      })
    );

    // Filter out products with no sales and sort by total sold
    const filteredData = topSellingData
      .filter(item => item.totalSold > 0)
      .sort((a, b) => b.totalSold - a.totalSold)
      .slice(0, 20); // Top 20 selling products

    // Generate PDF
    const period = dateFrom && dateTo ? { from: dateFrom, to: dateTo } : undefined;
    const pdfBuffer = await generateTopSellingReportPdf(filteredData, period);

    // Check if this is for inline viewing or download
    const download = c.req.query('download') === 'true';
    const filename = `top-selling-report-${new Date().toISOString().split('T')[0]}.pdf`;

    // Return PDF response with appropriate headers
    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': download
          ? `attachment; filename="${filename}"`
          : `inline; filename="${filename}"`,
        'Cache-Control': 'no-cache',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });

  } catch (error) {
    console.error('Error generating top selling report:', error);
    return c.json(
      createHandlerErrorResponse(
        'Failed to generate top selling report',
        c.get('requestId'),
        error instanceof Error ? error.message : 'Unknown error'
      ),
      500
    );
  }
}

/**
 * Generate Debtor/Credit Report PDF
 * GET /api/reports/debtor-credit/pdf
 */
export async function generateDebtorCreditReport(c: Context<{ Bindings: Env; Variables: Variables }>) {
  try {
    const supabase = c.get('supabase');

    // Get query parameters for filtering
    const dateFrom = c.req.query('dateFrom');
    const dateTo = c.req.query('dateTo');

    // First, let's check if there are any sales records at all
    const { data: allSales, error: allSalesError } = await supabase
      .from('sales')
      .select('id, payment_status, remaining_amount')
      .limit(5);

    console.log(`🔍 Total sales check: found ${allSales?.length || 0} sales records`);
    if (allSales && allSales.length > 0) {
      console.log('📋 Sample sales data:', allSales.map(s => ({
        id: s.id.slice(0, 8),
        status: s.payment_status,
        remaining: s.remaining_amount
      })));
    }

    // Build query for unpaid/partial sales with client contact information
    // Try multiple approaches to find outstanding payments
    let query = supabase
      .from('sales')
      .select(`
        id,
        date_time,
        client_name,
        total_amount,
        amount_paid,
        remaining_amount,
        payment_method,
        payment_status,
        phone,
        email_address
      `);

    // Apply filters - try different approaches
    // First try: payment status based
    query = query.in('payment_status', ['pending', 'partial']);

    // If no date filters, don't apply them to get all records
    if (dateFrom) {
      query = query.gte('date_time', dateFrom);
    }
    if (dateTo) {
      query = query.lte('date_time', dateTo);
    }

    query = query.order('date_time', { ascending: false });

    // Apply date filters
    if (dateFrom) {
      query = query.gte('date_time', dateFrom);
    }
    if (dateTo) {
      query = query.lte('date_time', dateTo);
    }

    const { data: sales, error } = await query;

    if (error) {
      console.error('❌ Error fetching sales data for debtor report:', error);
      throw new Error(`Failed to fetch sales data: ${error.message}`);
    }

    console.log(`📊 Found ${sales?.length || 0} sales records for debtor report`);

    // If no results with payment status filter, try with remaining_amount filter
    if (!sales || sales.length === 0) {
      console.log('🔄 No results with payment status filter, trying remaining_amount > 0...');

      const { data: salesByAmount, error: amountError } = await supabase
        .from('sales')
        .select(`
          id,
          date_time,
          client_name,
          total_amount,
          amount_paid,
          remaining_amount,
          payment_method,
          payment_status,
          phone,
          email_address
        `)
        .gt('remaining_amount', 0)
        .order('date_time', { ascending: false });

      if (amountError) {
        console.error('❌ Error with remaining_amount query:', amountError);
      } else {
        console.log(`💰 Found ${salesByAmount?.length || 0} sales with remaining_amount > 0`);
        // Use this data if we found any
        if (salesByAmount && salesByAmount.length > 0) {
          const debtorData: DebtorCreditReportData[] = salesByAmount.map(sale => ({
            clientName: sale.client_name || 'Walk-in Customer',
            amountOwed: sale.remaining_amount || 0,
            amountPaid: sale.amount_paid || 0,
            phoneNumber: sale.phone || 'N/A',
            email: sale.email_address || 'N/A',
          }));

          const period = dateFrom && dateTo ? { from: dateFrom, to: dateTo } : undefined;
          const pdfBuffer = await generateDebtorCreditReportPdf(debtorData, period);

          const download = c.req.query('download') === 'true';
          const filename = `debtor-credit-report-${new Date().toISOString().split('T')[0]}.pdf`;

          return new Response(pdfBuffer, {
            headers: {
              'Content-Type': 'application/pdf',
              'Content-Disposition': download
                ? `attachment; filename="${filename}"`
                : `inline; filename="${filename}"`,
              'Cache-Control': 'no-cache',
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type',
            },
          });
        }
      }
    }

    if (!sales || sales.length === 0) {
      console.log('⚠️ No sales data found for debtor report');
      // Return empty data instead of throwing error to show "No outstanding payments found" message
      const emptyData: DebtorCreditReportData[] = [];
      const period = dateFrom && dateTo ? { from: dateFrom, to: dateTo } : undefined;
      const pdfBuffer = await generateDebtorCreditReportPdf(emptyData, period);

      const download = c.req.query('download') === 'true';
      const filename = `debtor-credit-report-${new Date().toISOString().split('T')[0]}.pdf`;

      return new Response(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': download
            ? `attachment; filename="${filename}"`
            : `inline; filename="${filename}"`,
          'Cache-Control': 'no-cache',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    // Transform data for debtor/credit report with new structure
    const debtorData: DebtorCreditReportData[] = sales
      .filter(sale => {
        // Additional filter to ensure we only include records with actual outstanding amounts
        const hasOutstanding = (sale.remaining_amount && sale.remaining_amount > 0) ||
                              sale.payment_status === 'pending' ||
                              sale.payment_status === 'partial';
        console.log(`🔍 Sale ${sale.id}: status=${sale.payment_status}, remaining=${sale.remaining_amount}, hasOutstanding=${hasOutstanding}`);
        return hasOutstanding;
      })
      .map(sale => {
        return {
          clientName: sale.client_name || 'Walk-in Customer',
          amountOwed: sale.remaining_amount || 0, // Outstanding balance
          amountPaid: sale.amount_paid || 0, // Amount already paid
          phoneNumber: sale.phone || 'N/A', // Client phone number
          email: sale.email_address || 'N/A', // Client email address
        };
      });

    console.log(`💰 Filtered to ${debtorData.length} records with outstanding payments`);

    // Generate PDF
    const period = dateFrom && dateTo ? { from: dateFrom, to: dateTo } : undefined;
    const pdfBuffer = await generateDebtorCreditReportPdf(debtorData, period);

    // Check if this is for inline viewing or download
    const download = c.req.query('download') === 'true';
    const filename = `debtor-credit-report-${new Date().toISOString().split('T')[0]}.pdf`;

    // Return PDF response with appropriate headers
    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': download
          ? `attachment; filename="${filename}"`
          : `inline; filename="${filename}"`,
        'Cache-Control': 'no-cache',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });

  } catch (error) {
    console.error('Error generating debtor/credit report:', error);
    return c.json(
      createHandlerErrorResponse(
        'Failed to generate debtor/credit report',
        c.get('requestId'),
        error instanceof Error ? error.message : 'Unknown error'
      ),
      500
    );
  }
}

/**
 * Generate Profit and Loss Report PDF
 * GET /api/reports/profit-loss/pdf
 */
export async function generateProfitLossReport(c: Context<{ Bindings: Env; Variables: Variables }>) {
  try {
    const supabase = c.get('supabase');

    // Get query parameters for filtering
    const dateFrom = c.req.query('dateFrom');
    const dateTo = c.req.query('dateTo');

    if (!dateFrom || !dateTo) {
      throw new Error('Both dateFrom and dateTo are required for profit and loss report');
    }

    // Reuse the financial report logic
    // Get sales data with product cost information for accurate cost calculation
    let salesQuery = supabase
      .from('sales')
      .select(`
        total_amount,
        payment_status,
        date_time,
        boxes_quantity,
        kg_quantity,
        box_price,
        kg_price,
        product_id,
        products!inner(
          cost_per_box,
          cost_per_kg
        )
      `)
      .eq('payment_status', 'paid')
      .gte('date_time', dateFrom)
      .lte('date_time', dateTo);

    const { data: sales, error: salesError } = await salesQuery;

    if (salesError) {
      throw new Error(`Failed to fetch sales data: ${salesError.message}`);
    }

    // Get expenses data (using transactions table if available, otherwise use a placeholder)
    let expensesQuery = supabase
      .from('transactions')
      .select('total_amount, date_time')
      .eq('transaction_type', 'expense')
      .gte('date_time', dateFrom)
      .lte('date_time', dateTo);

    const { data: expenses } = await expensesQuery;

    // Get deposits data
    let depositsQuery = supabase
      .from('transactions')
      .select('total_amount, date_time')
      .eq('transaction_type', 'deposit')
      .gte('date_time', dateFrom)
      .lte('date_time', dateTo);

    const { data: deposits } = await depositsQuery;

    // Calculate totals
    const totalSales = sales?.reduce((sum, sale) => sum + sale.total_amount, 0) || 0;
    const totalExpenses = expenses?.reduce((sum, expense) => sum + expense.total_amount, 0) || 0;
    const totalDeposits = deposits?.reduce((sum, deposit) => sum + deposit.total_amount, 0) || 0;

    // Calculate cost of stock (cost of goods sold) using actual product costs
    const costOfStock = sales?.reduce((sum, sale) => {
      // Get actual cost from products table
      const product = Array.isArray(sale.products) ? sale.products[0] : sale.products;
      const boxCost = product?.cost_per_box || 0;
      const kgCost = product?.cost_per_kg || 0;

      // Calculate total cost for this sale
      const totalCost = (sale.boxes_quantity * boxCost) + (sale.kg_quantity * kgCost);
      return sum + totalCost;
    }, 0) || 0;

    // Get damaged products value for the period with data isolation
    const userId = getUserIdFromContext(c);
    const { data: damagedProducts } = await supabase
      .from('damaged_products')
      .select('loss_value, damaged_date')
      .eq('damaged_approval', true)
      .eq('user_id', userId)
      .gte('damaged_date', dateFrom)
      .lte('damaged_date', dateTo);

    const damagedValue = damagedProducts?.reduce((sum, damaged) => sum + damaged.loss_value, 0) || 0;

    // Calculate total profit (revenue - cost of stock - damaged value - expenses)
    const totalProfit = totalSales - costOfStock - damagedValue - totalExpenses;

    // Create financial report data with new structure
    const financialData: FinancialReportData = {
      period: `${dateFrom} to ${dateTo}`,
      totalSales, // This will be "Total Revenue"
      totalExpenses,
      totalDeposits,
      netProfit: totalProfit, // This will be "Total Profit"
      salesCount: sales?.length || 0,
      expenseCount: expenses?.length || 0,
      depositCount: deposits?.length || 0,
      averageSaleAmount: sales && sales.length > 0 ? totalSales / sales.length : 0,
      topSellingProducts: [],
      salesByPaymentMethod: [],
      // Add new fields for profit and loss report
      costOfStock,
      damagedValue,
    };

    // Generate PDF
    const period = { from: dateFrom, to: dateTo };
    const pdfBuffer = await generateProfitLossReportPdf(financialData, period);

    // Return PDF response
    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="profit-loss-report-${new Date().toISOString().split('T')[0]}.pdf"`,
        'Cache-Control': 'no-cache',
      },
    });

  } catch (error) {
    console.error('Error generating profit and loss report:', error);
    return c.json(
      createHandlerErrorResponse(
        'Failed to generate profit and loss report',
        c.get('requestId'),
        error instanceof Error ? error.message : 'Unknown error'
      ),
      500
    );
  }
}
