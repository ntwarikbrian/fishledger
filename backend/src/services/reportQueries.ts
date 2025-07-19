/**
 * Report Database Queries Service
 * Centralized database queries for report generation
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../config/supabase';
import type {
  StockReportData,
  SalesReportData,
  FinancialReportData,
  TransactionReportData,
  ProductReportData,
  CustomerReportData,
  ReportFilters,
} from '../types';

/**
 * Fetch stock report data from database
 */
export async function fetchStockReportData(
  supabase: SupabaseClient<Database>,
  filters: {
    dateFrom?: string;
    dateTo?: string;
    categoryId?: string;
    lowStockOnly?: boolean;
  }
): Promise<StockReportData[]> {
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
  if (filters.categoryId) {
    query = query.eq('category_id', filters.categoryId);
  }

  if (filters.lowStockOnly) {
    query = query.lt('stock_quantity', 'min_stock_level');
  }

  const { data: products, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch stock data: ${error.message}`);
  }

  if (!products) {
    return [];
  }

  // Transform data
  return products.map(product => {
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
      sku: `${product.quantity_box}B/${product.quantity_kg}KG`,
      category: 'Fish Products',
      currentStock: totalStockKg,
      minStockLevel: lowStockThresholdKg,
      maxStockLevel: lowStockThresholdKg * 2,
      stockValue,
      lastMovementDate: new Date().toISOString(),
      status,
    };
  });
}

/**
 * Fetch sales report data from database
 */
export async function fetchSalesReportData(
  supabase: SupabaseClient<Database>,
  filters: {
    dateFrom?: string;
    dateTo?: string;
    paymentMethod?: string;
    paymentStatus?: string;
  }
): Promise<SalesReportData[]> {
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
  if (filters.dateFrom) {
    query = query.gte('date_time', filters.dateFrom);
  }
  if (filters.dateTo) {
    query = query.lte('date_time', filters.dateTo);
  }

  // Apply other filters
  if (filters.paymentMethod) {
    query = query.eq('payment_method', filters.paymentMethod);
  }
  if (filters.paymentStatus) {
    query = query.eq('payment_status', filters.paymentStatus);
  }

  const { data: sales, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch sales data: ${error.message}`);
  }

  if (!sales) {
    return [];
  }

  // Transform data with new structure
  return sales.map(sale => {
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
}

/**
 * Fetch financial report data from database
 */
export async function fetchFinancialReportData(
  supabase: SupabaseClient<Database>,
  dateFrom: string,
  dateTo: string
): Promise<FinancialReportData> {
  // Fetch sales data
  const { data: salesData, error: salesError } = await supabase
    .from('sales')
    .select('total_amount, payment_method, boxes_quantity, kg_quantity, product_id')
    .gte('date_time', dateFrom)
    .lte('date_time', dateTo)
    .eq('payment_status', 'paid');

  if (salesError) {
    throw new Error(`Failed to fetch sales data: ${salesError.message}`);
  }

  // Fetch expenses data
  const { data: expensesData, error: expensesError } = await supabase
    .from('expenses')
    .select('amount')
    .gte('date', dateFrom)
    .lte('date', dateTo)
    .eq('status', 'paid');

  if (expensesError) {
    throw new Error(`Failed to fetch expenses data: ${expensesError.message}`);
  }

  // Fetch deposits data
  const { data: depositsData, error: depositsError } = await supabase
    .from('deposits')
    .select('amount')
    .gte('date_time', dateFrom)
    .lte('date_time', dateTo)
    .eq('approval', 'approved');

  if (depositsError) {
    throw new Error(`Failed to fetch deposits data: ${depositsError.message}`);
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

  return {
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
}

/**
 * Fetch transaction report data from database
 */
export async function fetchTransactionReportData(
  supabase: SupabaseClient<Database>,
  dateFrom: string,
  dateTo: string,
  transactionType?: string
): Promise<TransactionReportData[]> {
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
      throw new Error(`Failed to fetch sales transactions: ${salesError.message}`);
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
      throw new Error(`Failed to fetch expense transactions: ${expensesError.message}`);
    }

    expensesData?.forEach(expense => {
      transactions.push({
        transactionId: expense.expense_id,
        date: expense.date,
        type: 'expense',
        description: expense.title,
        amount: expense.amount,
        paymentMethod: 'cash',
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
      throw new Error(`Failed to fetch deposit transactions: ${depositsError.message}`);
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
  return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/**
 * Fetch product report data from database
 */
export async function fetchProductReportData(
  supabase: SupabaseClient<Database>,
  filters: {
    dateFrom?: string;
    dateTo?: string;
    categoryId?: string;
  }
): Promise<ProductReportData[]> {
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
  if (filters.categoryId) {
    query = query.eq('category_id', filters.categoryId);
  }

  const { data: products, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch product data: ${error.message}`);
  }

  if (!products) {
    return [];
  }

  // Transform data
  return products.map(product => {
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
}

/**
 * Fetch customer report data from database
 */
export async function fetchCustomerReportData(
  supabase: SupabaseClient<Database>,
  filters: {
    dateFrom?: string;
    dateTo?: string;
  }
): Promise<CustomerReportData[]> {
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
  if (filters.dateFrom) {
    query = query.gte('date_time', filters.dateFrom);
  }
  if (filters.dateTo) {
    query = query.lte('date_time', filters.dateTo);
  }

  const { data: sales, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch customer data: ${error.message}`);
  }

  if (!sales) {
    return [];
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

  // Transform data
  return Array.from(customerMap.values())
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
}
