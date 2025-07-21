/**
 * Dashboard Analytics Handler
 * Provides comprehensive dashboard statistics and analytics
 */

import type { Context } from 'hono';
import type { Env, Variables } from '../types/index';
import {
  getUserIdFromContext,
  createUserFilteredQuery,
  addUserIdToInsertData,
  validateUserIdInUpdateData
} from '../middleware/data-isolation';
// Response utilities are handled directly with c.json()

type HonoContext = Context<{ Bindings: Env; Variables: Variables }>;

/**
 * Interface for dashboard statistics
 */
interface DashboardStats {
  totalRevenue: number;
  totalProfit: number;
  totalExpenses: number;
  productsInStock: number;
  lowStockItems: number;
  damagedItems: number;
  revenueGrowth: number;
  profitMargin: number;
}

/**
 * Interface for revenue chart data
 */
interface RevenueChartData {
  month: string;
  profit: number;
  invest: number;
  isCurrentMonth: boolean;
}

/**
 * Interface for financial overview data
 */
interface FinancialOverviewData {
  name: string;
  value: number;
  amount: number;
  color: string;
  icon: string;
}

/**
 * Get comprehensive dashboard statistics
 */
export const getDashboardStatsHandler = async (c: HonoContext) => {
  try {
    console.log('🔄 getDashboardStatsHandler called');

    // Check authentication
    const user = c.get('user');
    if (!user) {
      return c.json({
        success: false,
        error: 'Authentication required',
        timestamp: new Date().toISOString(),
        requestId: c.get('requestId') || 'unknown'
      }, 401);
    }

    const supabase = c.get('supabase');
    console.log('🗄️ Supabase client available:', !!supabase);

    // Get current date for calculations
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    // Calculate date ranges
    const currentMonthStart = new Date(currentYear, currentMonth, 1).toISOString();
    const currentMonthEnd = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59).toISOString();
    const lastMonthStart = new Date(lastMonthYear, lastMonth, 1).toISOString();
    const lastMonthEnd = new Date(lastMonthYear, lastMonth + 1, 0, 23, 59, 59).toISOString();

    console.log('📅 Date ranges:', {
      currentMonthStart,
      currentMonthEnd,
      lastMonthStart,
      lastMonthEnd
    });

    // Fetch current month sales data with user filtering
    const { data: currentSales, error: currentSalesError } = await createUserFilteredQuery(c, 'sales', 'total_amount, boxes_quantity, kg_quantity, box_price, kg_price')
      .gte('date_time', currentMonthStart)
      .lte('date_time', currentMonthEnd);

    if (currentSalesError) {
      console.error('❌ Error fetching current sales:', currentSalesError);
      throw new Error(`Failed to fetch current sales: ${currentSalesError.message}`);
    }

    // Fetch last month sales data for growth calculation
    const { data: lastMonthSales, error: lastMonthSalesError } = await createUserFilteredQuery(c, 'sales', 'total_amount')
      .gte('date_time', lastMonthStart)
      .lte('date_time', lastMonthEnd);

    if (lastMonthSalesError) {
      console.error('❌ Error fetching last month sales:', lastMonthSalesError);
      throw new Error(`Failed to fetch last month sales: ${lastMonthSalesError.message}`);
    }

    // Fetch current month expenses with user filtering
    const { data: currentExpenses, error: expensesError } = await createUserFilteredQuery(c, 'expenses', 'amount')
      .gte('date', currentMonthStart.split('T')[0])
      .lte('date', currentMonthEnd.split('T')[0]);

    if (expensesError) {
      console.error('❌ Error fetching expenses:', expensesError);
      throw new Error(`Failed to fetch expenses: ${expensesError.message}`);
    }

    // Fetch products data for stock information with user filtering
    const { data: products, error: productsError } = await createUserFilteredQuery(c, 'products', 'quantity_box, quantity_kg, boxed_low_stock_threshold, cost_per_box, cost_per_kg');

    if (productsError) {
      console.error('❌ Error fetching products:', productsError);
      throw new Error(`Failed to fetch products: ${productsError.message}`);
    }

    // Fetch damaged products data with user filtering
    // Handle both cases: with and without user_id column for backward compatibility
    const userId = getUserIdFromContext(c);
    let damagedProducts: any[] = [];
    let damagedError: any = null;

    try {
      // Try to use direct user_id filtering first (after migration)
      const { data, error } = await createUserFilteredQuery(c, 'damaged_products', 'damaged_boxes, damaged_kg')
        .eq('damaged_approval', true);

      damagedProducts = data || [];
      damagedError = error;
    } catch (error: any) {
      // If user_id column doesn't exist, fall back to JOIN query
      if (error.message?.includes('user_id does not exist')) {
        console.log('🔄 Falling back to JOIN query for damaged_products (user_id column not found)');
        const { data, error: joinError } = await c.get('supabase')
          .from('damaged_products')
          .select(`
            damaged_boxes,
            damaged_kg,
            products!inner(user_id)
          `)
          .eq('damaged_approval', true)
          .eq('products.user_id', userId);

        damagedProducts = data || [];
        damagedError = joinError;
      } else {
        damagedError = error;
      }
    }

    if (damagedError) {
      console.error('❌ Error fetching damaged products:', damagedError);
      throw new Error(`Failed to fetch damaged products: ${damagedError.message}`);
    }

    // Calculate statistics
    const totalRevenue = (currentSales || []).reduce((sum, sale: any) => {
      // Ensure sale is a valid object with total_amount property
      if (!sale || typeof sale !== 'object' || !sale.total_amount) {
        return sum;
      }
      const amount = parseFloat(sale.total_amount?.toString() || '0');
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);

    const lastMonthRevenue = (lastMonthSales || []).reduce((sum, sale: any) => {
      // Ensure sale is a valid object with total_amount property
      if (!sale || typeof sale !== 'object' || !sale.total_amount) {
        return sum;
      }
      const amount = parseFloat(sale.total_amount?.toString() || '0');
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);

    // Calculate profit (revenue - cost of goods sold)
    const totalCost = (currentSales || []).reduce((sum, sale: any) => {
      // Ensure sale is a valid object with required properties
      if (!sale || typeof sale !== 'object') {
        return sum;
      }
      const boxesCost = (sale.boxes_quantity || 0) * parseFloat(sale.box_price?.toString() || '0');
      const kgCost = (sale.kg_quantity || 0) * parseFloat(sale.kg_price?.toString() || '0');
      return sum + boxesCost + kgCost;
    }, 0);

    const totalProfit = totalRevenue - totalCost;

    const totalExpenses = (currentExpenses || []).reduce((sum, expense: any) => {
      // Ensure expense is a valid object with amount property
      if (!expense || typeof expense !== 'object' || !expense.amount) {
        return sum;
      }
      const amount = parseFloat(expense.amount?.toString() || '0');
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);

    const productsInStock = (products || []).length;

    // Calculate low stock items with proper type checking
    const lowStockItems = (products || []).filter((product: any) => {
      // Ensure product is a valid object with required properties
      if (!product || typeof product !== 'object') {
        return false;
      }
      const quantityBox = parseInt(product.quantity_box?.toString() || '0');
      const threshold = parseInt(product.boxed_low_stock_threshold?.toString() || '0');
      return quantityBox <= threshold;
    }).length;

    // Calculate damaged items with proper type checking
    const damagedItems = (damagedProducts || []).reduce((sum, damaged: any) => {
      // Ensure damaged is a valid object with damaged_boxes property
      if (!damaged || typeof damaged !== 'object' || !damaged.damaged_boxes) {
        return sum;
      }
      const damagedBoxes = parseInt(damaged.damaged_boxes?.toString() || '0');
      return sum + (isNaN(damagedBoxes) ? 0 : damagedBoxes);
    }, 0);

    // Calculate revenue growth percentage
    const revenueGrowth = lastMonthRevenue > 0 
      ? ((totalRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
      : 0;

    // Calculate profit margin
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    const stats: DashboardStats = {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalProfit: Math.round(totalProfit * 100) / 100,
      totalExpenses: Math.round(totalExpenses * 100) / 100,
      productsInStock,
      lowStockItems,
      damagedItems,
      revenueGrowth: Math.round(revenueGrowth * 100) / 100,
      profitMargin: Math.round(profitMargin * 100) / 100
    };

    console.log('✅ Dashboard stats calculated:', stats);

    return c.json({
      success: true,
      data: stats,
      message: 'Dashboard statistics retrieved successfully',
      timestamp: new Date().toISOString(),
      requestId: c.get('requestId') || 'unknown'
    });

  } catch (error) {
    console.error('❌ Error in getDashboardStatsHandler:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch dashboard statistics',
      timestamp: new Date().toISOString(),
      requestId: c.get('requestId') || 'unknown'
    }, 500);
  }
};

/**
 * Get revenue chart data for different time periods
 * Supports: week, month, 6months
 */
export const getRevenueChartHandler = async (c: HonoContext) => {
  try {
    console.log('🔄 getRevenueChartHandler called');

    // Check authentication
    const user = c.get('user');
    if (!user) {
      return c.json({
        success: false,
        error: 'Authentication required',
        timestamp: new Date().toISOString(),
        requestId: c.get('requestId') || 'unknown'
      }, 401);
    }

    const supabase = c.get('supabase');

    // Get filter parameter (default to 'month')
    const period = c.req.query('period') || 'month';
    console.log('📊 Revenue chart period:', period);

    // Validate period parameter
    if (!['week', 'month', '6months'].includes(period)) {
      return c.json({
        success: false,
        error: 'Invalid period. Must be one of: week, month, 6months',
        timestamp: new Date().toISOString(),
        requestId: c.get('requestId') || 'unknown'
      }, 400);
    }

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    const chartData: RevenueChartData[] = [];
    let periods: Array<{ label: string; start: string; end: string; isCurrent: boolean }> = [];

    // Generate periods based on filter
    if (period === 'week') {
      // Last 7 days
      for (let i = 6; i >= 0; i--) {
        const targetDate = new Date(currentDate);
        targetDate.setDate(currentDate.getDate() - i);

        const dayStart = new Date(targetDate);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(targetDate);
        dayEnd.setHours(23, 59, 59, 999);

        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const label = dayNames[targetDate.getDay()] || 'Unknown';

        periods.push({
          label,
          start: dayStart.toISOString(),
          end: dayEnd.toISOString(),
          isCurrent: i === 0
        });
      }
    } else if (period === 'month') {
      // Last 4 weeks
      for (let i = 3; i >= 0; i--) {
        const weekStart = new Date(currentDate);
        weekStart.setDate(currentDate.getDate() - (i * 7) - 6);
        weekStart.setHours(0, 0, 0, 0);

        const weekEnd = new Date(currentDate);
        weekEnd.setDate(currentDate.getDate() - (i * 7));
        weekEnd.setHours(23, 59, 59, 999);

        const label = `Week ${4 - i}`;

        periods.push({
          label,
          start: weekStart.toISOString(),
          end: weekEnd.toISOString(),
          isCurrent: i === 0
        });
      }
    } else if (period === '6months') {
      // Last 6 months
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      for (let i = 5; i >= 0; i--) {
        const targetMonth = (currentMonth - i + 12) % 12;
        const targetYear = currentMonth - i < 0 ? currentYear - 1 : currentYear;

        const monthStart = new Date(targetYear, targetMonth, 1);
        const monthEnd = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59);

        periods.push({
          label: monthNames[targetMonth] || 'Unknown',
          start: monthStart.toISOString(),
          end: monthEnd.toISOString(),
          isCurrent: targetMonth === currentMonth && targetYear === currentYear
        });
      }
    }

    // Generate data for each period
    for (const periodInfo of periods) {

      // Fetch sales data for this period
      const { data: periodSales, error: salesError } = await supabase
        .from('sales')
        .select('total_amount, boxes_quantity, kg_quantity, box_price, kg_price')
        .gte('date_time', periodInfo.start)
        .lte('date_time', periodInfo.end);

      if (salesError) {
        console.error(`❌ Error fetching sales for ${periodInfo.label}:`, salesError);
        // Continue with 0 values for this period
      }

      // Fetch expenses data for this period
      const { data: periodExpenses, error: expensesError } = await supabase
        .from('expenses')
        .select('amount')
        .gte('date', periodInfo.start.split('T')[0])
        .lte('date', periodInfo.end.split('T')[0]);

      if (expensesError) {
        console.error(`❌ Error fetching expenses for ${periodInfo.label}:`, expensesError);
        // Continue with 0 values for this period
      }

      // Calculate revenue for this period
      const periodRevenue = (periodSales || []).reduce((sum, sale) => {
        const amount = parseFloat(sale.total_amount?.toString() || '0');
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0);

      // Calculate cost for this period (investment)
      const periodCost = (periodSales || []).reduce((sum, sale) => {
        const boxesCost = (sale.boxes_quantity || 0) * parseFloat(sale.box_price?.toString() || '0');
        const kgCost = (sale.kg_quantity || 0) * parseFloat(sale.kg_price?.toString() || '0');
        return sum + boxesCost + kgCost;
      }, 0);

      // Add expenses to investment
      const periodExpensesTotal = (periodExpenses || []).reduce((sum, expense) => {
        const amount = parseFloat(expense.amount?.toString() || '0');
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0);

      const totalInvestment = periodCost + periodExpensesTotal;
      const profit = periodRevenue - totalInvestment;

      chartData.push({
        month: periodInfo.label,
        profit: Math.round(profit),
        invest: Math.round(totalInvestment),
        isCurrentMonth: periodInfo.isCurrent
      });
    }

    console.log('✅ Revenue chart data calculated:', chartData);

    return c.json({
      success: true,
      data: chartData,
      message: 'Revenue chart data retrieved successfully',
      timestamp: new Date().toISOString(),
      requestId: c.get('requestId') || 'unknown'
    });

  } catch (error) {
    console.error('❌ Error in getRevenueChartHandler:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch revenue chart data',
      timestamp: new Date().toISOString(),
      requestId: c.get('requestId') || 'unknown'
    }, 500);
  }
};

/**
 * Get financial overview data for pie chart
 */
export const getFinancialOverviewHandler = async (c: HonoContext) => {
  try {
    console.log('🔄 getFinancialOverviewHandler called');

    // Check authentication
    const user = c.get('user');
    if (!user) {
      return c.json({
        success: false,
        error: 'Authentication required',
        timestamp: new Date().toISOString(),
        requestId: c.get('requestId') || 'unknown'
      }, 401);
    }

    const supabase = c.get('supabase');

    // Get current month date range
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const currentMonthStart = new Date(currentYear, currentMonth, 1).toISOString();
    const currentMonthEnd = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59).toISOString();

    // Fetch current month sales data
    const { data: currentSales, error: salesError } = await supabase
      .from('sales')
      .select('total_amount, boxes_quantity, kg_quantity, box_price, kg_price')
      .gte('date_time', currentMonthStart)
      .lte('date_time', currentMonthEnd);

    if (salesError) {
      console.error('❌ Error fetching sales:', salesError);
      throw new Error(`Failed to fetch sales: ${salesError.message}`);
    }

    // Fetch current month expenses
    const { data: currentExpenses, error: expensesError } = await supabase
      .from('expenses')
      .select('amount')
      .gte('date', currentMonthStart.split('T')[0])
      .lte('date', currentMonthEnd.split('T')[0]);

    if (expensesError) {
      console.error('❌ Error fetching expenses:', expensesError);
      throw new Error(`Failed to fetch expenses: ${expensesError.message}`);
    }

    // Fetch damaged products data
    const { data: damagedProducts, error: damagedError } = await supabase
      .from('damaged_products')
      .select('loss_value')
      .eq('damaged_approval', true)
      .gte('damaged_date', currentMonthStart.split('T')[0])
      .lte('damaged_date', currentMonthEnd.split('T')[0]);

    if (damagedError) {
      console.error('❌ Error fetching damaged products:', damagedError);
      throw new Error(`Failed to fetch damaged products: ${damagedError.message}`);
    }

    // Calculate totals
    const totalRevenue = (currentSales || []).reduce((sum, sale) => {
      const amount = parseFloat(sale.total_amount?.toString() || '0');
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);

    // Calculate cost of goods sold
    const totalCost = (currentSales || []).reduce((sum, sale) => {
      const boxesCost = (sale.boxes_quantity || 0) * parseFloat(sale.box_price?.toString() || '0');
      const kgCost = (sale.kg_quantity || 0) * parseFloat(sale.kg_price?.toString() || '0');
      return sum + boxesCost + kgCost;
    }, 0);

    const totalProfit = totalRevenue - totalCost;

    const totalExpenses = (currentExpenses || []).reduce((sum, expense) => {
      const amount = parseFloat(expense.amount?.toString() || '0');
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);

    const totalDamaged = (damagedProducts || []).reduce((sum, damaged) => {
      const amount = parseFloat(damaged.loss_value?.toString() || '0');
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);

    // Calculate total for percentage calculation
    const total = totalRevenue + totalProfit + totalExpenses + totalDamaged;

    // Create financial overview data
    const financialData: FinancialOverviewData[] = [
      {
        name: 'Revenue',
        value: total > 0 ? Math.round((totalRevenue / total) * 100) : 0,
        amount: Math.round(totalRevenue * 100) / 100,
        color: '#22c55e',
        icon: '💰'
      },
      {
        name: 'Profit',
        value: total > 0 ? Math.round((totalProfit / total) * 100) : 0,
        amount: Math.round(totalProfit * 100) / 100,
        color: '#3b82f6',
        icon: '📈'
      },
      {
        name: 'Expense',
        value: total > 0 ? Math.round((totalExpenses / total) * 100) : 0,
        amount: Math.round(totalExpenses * 100) / 100,
        color: '#f59e0b',
        icon: '💸'
      },
      {
        name: 'Damaged',
        value: total > 0 ? Math.round((totalDamaged / total) * 100) : 0,
        amount: Math.round(totalDamaged * 100) / 100,
        color: '#ef4444',
        icon: '⚠️'
      }
    ];

    console.log('✅ Financial overview data calculated:', financialData);

    return c.json({
      success: true,
      data: financialData,
      message: 'Financial overview data retrieved successfully',
      timestamp: new Date().toISOString(),
      requestId: c.get('requestId') || 'unknown'
    });

  } catch (error) {
    console.error('❌ Error in getFinancialOverviewHandler:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch financial overview data',
      timestamp: new Date().toISOString(),
      requestId: c.get('requestId') || 'unknown'
    }, 500);
  }
};
