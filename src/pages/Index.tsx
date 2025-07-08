
import React from 'react';
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TrendingUp, DollarSign, ArrowUpRight, ArrowDownRight, Calendar, ChevronLeft, ChevronRight, Package, AlertTriangle, Zap, ChevronDown } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { usePageTitle } from "@/hooks/use-page-title";
import { useUser, getUserDisplayName } from "@/hooks/use-user";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, ReferenceLine, PieChart, Pie, Cell } from "recharts";

/**
 * Revenue Chart Component
 * Displays profit and investment data over time with area chart
 */
const RevenueChart = () => {
  const { t, i18n } = useTranslation();

  // Sample data for the revenue chart
  const revenueData = [
    { month: "Jan", profit: 65000, invest: 45000, isCurrentMonth: false },
    { month: "Feb", profit: 85000, invest: 55000, isCurrentMonth: false },
    { month: "Mar", profit: 95000, invest: 65000, isCurrentMonth: false },
    { month: "Apr", profit: 75000, invest: 50000, isCurrentMonth: false },
    { month: "May", profit: 88000, invest: 58000, isCurrentMonth: true },
    { month: "Jun", profit: 105000, invest: 70000, isCurrentMonth: false },
    { month: "Jul", profit: 98000, invest: 68000, isCurrentMonth: false },
    { month: "Aug", profit: 110000, invest: 75000, isCurrentMonth: false },
    { month: "Sep", profit: 120000, invest: 80000, isCurrentMonth: false },
  ];

  const chartConfig = React.useMemo(() => ({
    profit: {
      label: t('dashboard.profit', 'Profit'),
      color: "hsl(var(--chart-1))",
    },
    invest: {
      label: t('dashboard.invest', 'Investment'),
      color: "hsl(var(--chart-2))",
    },
  }), [t, i18n.language]);

  // Custom tick component for highlighting current month
  const CustomXAxisTick = (props: any) => {
    const { x, y, payload } = props;
    const isCurrentMonth = revenueData.find(item => item.month === payload.value)?.isCurrentMonth;

    return (
      <g transform={`translate(${x},${y})`}>
        {isCurrentMonth && (
          <circle
            cx={0}
            cy={-5}
            r={12}
            fill="#000"
            className="dark:fill-white"
          />
        )}
        <text
          x={0}
          y={0}
          dy={16}
          textAnchor="middle"
          fill={isCurrentMonth ? "#fff" : "#6b7280"}
          fontSize="10"
          className={isCurrentMonth ? "dark:fill-black" : ""}
        >
          {payload.value}
        </text>
      </g>
    );
  };

  // Custom label component for showing values on chart
  const CustomLabel = (props: any) => {
    const { x, y, value, dataKey } = props;
    if (dataKey === 'profit' && value > 100000) {
      return (
        <g>
          <rect
            x={x - 20}
            y={y - 25}
            width={40}
            height={16}
            fill="#22c55e"
            rx={8}
            opacity={0.9}
          />
          <text
            x={x}
            y={y - 15}
            textAnchor="middle"
            fill="white"
            fontSize="10"
            fontWeight="500"
          >
            ${(value / 1000).toFixed(0)}K
          </text>
        </g>
      );
    }
    return null;
  };

  return (
    <div className="w-full">
      {/* Legend */}
      <div className="flex items-center gap-4 md:gap-6 mb-4 md:mb-6">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-green-500"></div>
          <span className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400">Profit</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-yellow-400"></div>
          <span className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400">Invest</span>
        </div>
      </div>

      {/* Chart */}
      <ChartContainer config={chartConfig} className="h-[200px] md:h-[300px] w-full">
        <AreaChart
          data={revenueData}
          margin={{
            top: 10,
            right: 10,
            left: 0,
            bottom: 10,
          }}
        >
          <defs>
            <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0.1}/>
            </linearGradient>
            <linearGradient id="investGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#eab308" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#eab308" stopOpacity={0.1}/>
            </linearGradient>
          </defs>

          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={<CustomXAxisTick />}
            className="text-gray-500"
            interval={0}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: '#6b7280' }}
            tickFormatter={(value) => `${value / 1000}K`}
            className="text-gray-500"
            width={30}
          />

          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value, name) => [
                  `$${(value as number).toLocaleString()}`,
                  name === 'profit' ? 'Profit' : 'Invest'
                ]}
                labelFormatter={(label) => `Month: ${label}`}
              />
            }
          />

          {/* Reference line for current month */}
          <ReferenceLine
            x="May"
            stroke="#6b7280"
            strokeDasharray="3 3"
            strokeOpacity={0.5}
          />

          <Area
            type="monotone"
            dataKey="invest"
            stroke="#eab308"
            strokeWidth={2}
            fill="url(#investGradient)"
            fillOpacity={0.6}
            dot={{ fill: '#eab308', strokeWidth: 0, r: 3 }}
            activeDot={{ r: 4, fill: '#eab308' }}
          />
          <Area
            type="monotone"
            dataKey="profit"
            stroke="#22c55e"
            strokeWidth={2}
            fill="url(#profitGradient)"
            fillOpacity={0.6}
            dot={{ fill: '#22c55e', strokeWidth: 0, r: 3 }}
            activeDot={{ r: 4, fill: '#22c55e' }}
            label={<CustomLabel />}
          />
        </AreaChart>
      </ChartContainer>
    </div>
  );
};

/**
 * Financial Overview Component
 * Displays revenue, profit, expense, and damaged values with beautiful donut chart
 */
const FinancialOverviewChart = () => {
  const { t, i18n } = useTranslation();

  // Sample data for financial overview - memoized to handle language changes properly
  const financialData = React.useMemo(() => [
    { name: t('dashboard.revenue', 'Revenue'), value: 45, amount: 16500, color: "#22c55e", icon: "💰" }, // green-500
    { name: t('dashboard.profit', 'Profit'), value: 30, amount: 8200, color: "#3b82f6", icon: "📈" }, // blue-500
    { name: t('dashboard.expense', 'Expense'), value: 20, amount: 6800, color: "#f59e0b", icon: "💸" }, // amber-500
    { name: t('dashboard.damaged', 'Damaged'), value: 5, amount: 1500, color: "#ef4444", icon: "⚠️" }, // red-500
  ], [t, i18n.language]);

  // Calculate total for center display
  const totalAmount = React.useMemo(() =>
    financialData.reduce((sum, item) => sum + item.amount, 0),
    [financialData]
  );

  return (
    <Card key={`financial-overview-${i18n.language}`} className="hover-card rounded-2xl border-0 shadow-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
      <CardHeader className="pb-4">
        <div>
          <CardTitle className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {t('dashboard.financialOverview', 'Financial Overview')}
          </CardTitle>
          <CardDescription className="text-sm text-gray-600 dark:text-gray-400">
            {t('dashboard.revenueExpensesAndDamages', 'Revenue, Profit, Expenses & Damages')}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-col items-center space-y-6">
          {/* Donut Chart */}
          <div className="relative w-32 h-32 md:w-40 md:h-40 financial-chart-container">
            <ChartContainer config={{}} className="w-full h-full">
              <PieChart key={i18n.language}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.8}/>
                    <stop offset="100%" stopColor="#16a34a" stopOpacity={1}/>
                  </linearGradient>
                  <linearGradient id="profitGradient" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="100%" stopColor="#2563eb" stopOpacity={1}/>
                  </linearGradient>
                  <linearGradient id="expenseGradient" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.8}/>
                    <stop offset="100%" stopColor="#d97706" stopOpacity={1}/>
                  </linearGradient>
                  <linearGradient id="damagedGradient" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity={0.8}/>
                    <stop offset="100%" stopColor="#dc2626" stopOpacity={1}/>
                  </linearGradient>
                </defs>
                <Pie
                  data={financialData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={65}
                  paddingAngle={3}
                  dataKey="value"
                  className="md:inner-radius-[50] md:outer-radius-[80]"
                  animationBegin={0}
                  animationDuration={1000}
                >
                  {financialData.map((_, index) => {
                    const gradientIds = ["url(#revenueGradient)", "url(#profitGradient)", "url(#expenseGradient)", "url(#damagedGradient)"];
                    return (
                      <Cell
                        key={`cell-${index}`}
                        fill={gradientIds[index]}
                        stroke="rgba(255,255,255,0.2)"
                        strokeWidth={1}
                      />
                    );
                  })}
                </Pie>
                <ChartTooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg">{data.icon}</span>
                            <span className="font-medium text-gray-900 dark:text-gray-100">{data.name}</span>
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            Amount: <span className="font-bold text-gray-900 dark:text-gray-100">${data.amount.toLocaleString()}</span>
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            Percentage: <span className="font-bold text-gray-900 dark:text-gray-100">{data.value}%</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ChartContainer>

            {/* Center Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg md:text-xl font-bold text-gray-900 dark:text-gray-100">
                ${(totalAmount / 1000).toFixed(0)}K
              </span>
              <span className="text-[10px] md:text-xs text-gray-600 dark:text-gray-400 text-center">
                {t('dashboard.totalValue', 'Total Value')}
              </span>
            </div>
          </div>

          {/* Beautiful Legend */}
          <div className="grid grid-cols-2 gap-3 w-full">
            {financialData.map((item, index) => (
              <div key={`${item.name}-${index}-${i18n.language}`} className="financial-legend-item flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                <div className="flex items-center gap-2 flex-1">
                  <div
                    className="w-3 h-3 rounded-full shadow-sm"
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-gray-900 dark:text-gray-100">
                      {item.name}
                    </span>
                    <span className="text-[10px] text-gray-600 dark:text-gray-400">
                      ${(item.amount / 1000).toFixed(1)}K
                    </span>
                  </div>
                </div>
                <span className="text-xs font-bold text-gray-900 dark:text-gray-100">
                  {item.value}%
                </span>
              </div>
            ))}
          </div>

          {/* Summary Stats */}
          <div className="w-full pt-2 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-sm font-bold text-green-600 dark:text-green-400">
                  ${((financialData[0].amount + financialData[1].amount) / 1000).toFixed(1)}K
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">{t('dashboard.netPositive', 'Net Positive')}</div>
              </div>
              <div>
                <div className="text-sm font-bold text-red-600 dark:text-red-400">
                  ${((financialData[2].amount + financialData[3].amount) / 1000).toFixed(1)}K
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">{t('dashboard.totalCosts', 'Total Costs')}</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const Dashboard = () => {
  const { t } = useTranslation();
  usePageTitle('navigation.dashboard', 'Dashboard');
  const userInfo = useUser();

  const [mobileChartView, setMobileChartView] = useState(0); // 0 = Revenue Chart, 1 = Financial Overview
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  // Mobile chart navigation functions
  const nextChart = () => {
    setMobileChartView((prev) => (prev + 1) % 2);
  };

  const prevChart = () => {
    setMobileChartView((prev) => (prev - 1 + 2) % 2);
  };

  // Touch handlers for swipe navigation
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      nextChart();
    } else if (isRightSwipe) {
      prevChart();
    }
  };












  return (
    <AppLayout>
      <div className="space-y-4">
        {/* Welcome Section */}
        {userInfo.isAuthenticated && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-2xl p-6 border border-blue-100 dark:border-blue-900/30">
            <div className="flex items-center gap-3">
              <div className="text-2xl">☀️</div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {t('common.hello', 'Hello')} {getUserDisplayName(userInfo)} 👋
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('dashboard.overview', 'Welcome back to your dashboard overview')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="space-y-4">
          {/* Mobile: Horizontal scrolling container */}
          <div className="md:hidden overflow-hidden relative">
            <div className="flex gap-4 animate-scroll-horizontal min-w-max">
              {/* First set of cards */}
              {/* Mobile cards will be rendered here */}
              {/* Total Revenue Card - Mobile */}
              <Card className="hover-card rounded-2xl border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 min-w-[280px]">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    {/* Icon at top left */}
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-xl">
                      <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    {/* Circular clickable arrow at top right */}
                    <button className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full hover:bg-green-200 dark:hover:bg-green-800/40 transition-colors">
                      <ArrowUpRight className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </button>
                  </div>

                  {/* Title */}
                  <div className="mt-4">
                    <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {t('dashboard.totalRevenue', 'Total Revenue')}
                    </h3>

                    {/* Main figure */}
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                      $18,450
                    </div>

                    {/* Growth indicator */}
                    <div className="flex items-center mt-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                        +15%
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                        {t('dashboard.fromLastMonth', 'from last month')}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Products in Stock Card - Mobile */}
              <Card className="hover-card rounded-2xl border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 min-w-[280px]">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    {/* Icon at top left */}
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                      <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    {/* Circular clickable arrow at top right */}
                    <button className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800/40 transition-colors">
                      <ArrowUpRight className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </button>
                  </div>

                  {/* Title */}
                  <div className="mt-4">
                    <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {t('dashboard.productsInStock', 'Products in Stock')}
                    </h3>

                    {/* Main figure */}
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                      12
                    </div>

                    {/* Growth indicator */}
                    <div className="flex items-center mt-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                        5 {t('dashboard.types', 'types')}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                        {t('dashboard.differentFish', 'different fish')}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Low Stock Items Card - Mobile */}
              <Card className="hover-card rounded-2xl border-0 shadow-lg bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20 min-w-[280px]">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    {/* Icon at top left */}
                    <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-xl">
                      <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                    </div>
                    {/* Circular clickable arrow at top right */}
                    <button className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full hover:bg-red-200 dark:hover:bg-red-800/40 transition-colors">
                      <ArrowDownRight className="h-4 w-4 text-red-600 dark:text-red-400" />
                    </button>
                  </div>

                  {/* Title */}
                  <div className="mt-4">
                    <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {t('dashboard.lowStockItems', 'Low Stock Items')}
                    </h3>

                    {/* Main figure */}
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                      4
                    </div>

                    {/* Growth indicator */}
                    <div className="flex items-center mt-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                        {t('dashboard.critical', 'Critical')}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                        {t('dashboard.needRestocking', 'need restocking')}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Damaged Items Card - Mobile */}
              <Card className="hover-card rounded-2xl border-0 shadow-lg bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 min-w-[280px]">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    {/* Icon at top left */}
                    <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
                      <Zap className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    {/* Circular clickable arrow at top right */}
                    <button className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-full hover:bg-orange-200 dark:hover:bg-orange-800/40 transition-colors">
                      <ArrowDownRight className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                    </button>
                  </div>

                  {/* Title */}
                  <div className="mt-4">
                    <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {t('dashboard.damagedItems', 'Damaged Items')}
                    </h3>

                    {/* Main figure */}
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                      7
                    </div>

                    {/* Growth indicator */}
                    <div className="flex items-center mt-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
                        -2 {t('dashboard.today', 'today')}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                        {t('dashboard.needDisposal', 'need disposal')}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Second set of cards for seamless infinite scroll */}
              {/* Total Revenue Card - Mobile (Duplicate) */}
              <Card className="hover-card rounded-2xl border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 min-w-[280px]">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-xl">
                      <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <button className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full hover:bg-green-200 dark:hover:bg-green-800/40 transition-colors">
                      <ArrowUpRight className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </button>
                  </div>
                  <div className="mt-4">
                    <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {t('dashboard.totalRevenue', 'Total Revenue')}
                    </h3>
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                      $18,450
                    </div>
                    <div className="flex items-center mt-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                        +15%
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                        {t('dashboard.fromLastMonth', 'from last month')}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Products in Stock Card - Mobile (Duplicate) */}
              <Card className="hover-card rounded-2xl border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 min-w-[280px]">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                      <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <button className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800/40 transition-colors">
                      <ArrowUpRight className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </button>
                  </div>
                  <div className="mt-4">
                    <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {t('dashboard.productsInStock', 'Products in Stock')}
                    </h3>
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                      12
                    </div>
                    <div className="flex items-center mt-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                        5 {t('dashboard.types', 'types')}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                        {t('dashboard.differentFish', 'different fish')}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Low Stock Items Card - Mobile (Duplicate) */}
              <Card className="hover-card rounded-2xl border-0 shadow-lg bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20 min-w-[280px]">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-xl">
                      <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                    </div>
                    <button className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full hover:bg-red-200 dark:hover:bg-red-800/40 transition-colors">
                      <ArrowDownRight className="h-4 w-4 text-red-600 dark:text-red-400" />
                    </button>
                  </div>
                  <div className="mt-4">
                    <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {t('dashboard.lowStockItems', 'Low Stock Items')}
                    </h3>
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                      4
                    </div>
                    <div className="flex items-center mt-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                        {t('dashboard.critical', 'Critical')}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                        {t('dashboard.needRestocking', 'need restocking')}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Damaged Items Card - Mobile (Duplicate) */}
              <Card className="hover-card rounded-2xl border-0 shadow-lg bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 min-w-[280px]">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
                      <Zap className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <button className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-full hover:bg-orange-200 dark:hover:bg-orange-800/40 transition-colors">
                      <ArrowDownRight className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                    </button>
                  </div>
                  <div className="mt-4">
                    <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {t('dashboard.damagedItems', 'Damaged Items')}
                    </h3>
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                      7
                    </div>
                    <div className="flex items-center mt-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
                        -2 {t('dashboard.today', 'today')}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                        {t('dashboard.needDisposal', 'need disposal')}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Desktop: Grid layout */}
          <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Revenue Card - Desktop */}
            <Card className="hover-card rounded-2xl border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  {/* Icon at top left */}
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-xl">
                    <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  {/* Circular clickable arrow at top right */}
                  <button className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full hover:bg-green-200 dark:hover:bg-green-800/40 transition-colors">
                    <ArrowUpRight className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </button>
                </div>

                {/* Title */}
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {t('dashboard.totalRevenue', 'Total Revenue')}
                  </h3>

                  {/* Main figure */}
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                    $18,450
                  </div>

                  {/* Growth indicator */}
                  <div className="flex items-center mt-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                      +15%
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                      {t('dashboard.fromLastMonth', 'from last month')}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Products in Stock Card - Desktop */}
            <Card className="hover-card rounded-2xl border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  {/* Icon at top left */}
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                    <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  {/* Circular clickable arrow at top right */}
                  <button className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800/40 transition-colors">
                    <ArrowUpRight className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </button>
                </div>

                {/* Title */}
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {t('dashboard.productsInStock', 'Products in Stock')}
                  </h3>

                  {/* Main figure */}
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                    12
                  </div>

                  {/* Growth indicator */}
                  <div className="flex items-center mt-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                      5 {t('dashboard.types', 'types')}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                      {t('dashboard.differentFish', 'different fish')}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Low Stock Items Card - Desktop */}
            <Card className="hover-card rounded-2xl border-0 shadow-lg bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  {/* Icon at top left */}
                  <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-xl">
                    <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  </div>
                  {/* Circular clickable arrow at top right */}
                  <button className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full hover:bg-red-200 dark:hover:bg-red-800/40 transition-colors">
                    <ArrowDownRight className="h-4 w-4 text-red-600 dark:text-red-400" />
                  </button>
                </div>

                {/* Title */}
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {t('dashboard.lowStockItems', 'Low Stock Items')}
                  </h3>

                  {/* Main figure */}
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                    4
                  </div>

                  {/* Growth indicator */}
                  <div className="flex items-center mt-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                      {t('dashboard.critical', 'Critical')}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                      {t('dashboard.needRestocking', 'need restocking')}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Damaged Items Card - Desktop */}
            <Card className="hover-card rounded-2xl border-0 shadow-lg bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  {/* Icon at top left */}
                  <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
                    <Zap className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  {/* Circular clickable arrow at top right */}
                  <button className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-full hover:bg-orange-200 dark:hover:bg-orange-800/40 transition-colors">
                    <ArrowDownRight className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  </button>
                </div>

                {/* Title */}
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {t('dashboard.damagedItems', 'Damaged Items')}
                  </h3>

                  {/* Main figure */}
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                    7
                  </div>

                  {/* Growth indicator */}
                  <div className="flex items-center mt-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
                      -2 {t('dashboard.today', 'today')}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                      {t('dashboard.needDisposal', 'need disposal')}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Revenue Chart and Financial Overview Section */}

        {/* Desktop Layout - Side by side */}
        <div className="hidden lg:grid lg:grid-cols-3 gap-6">
          {/* Revenue Chart - Takes 2/3 width on desktop */}
          <div className="lg:col-span-2">
            <Card className="hover-card rounded-2xl border-0 shadow-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-xl">
                      <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">
                        {t('dashboard.revenue', 'Revenue')}
                      </CardTitle>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          $16,500
                        </span>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                          {t('dashboard.comparedToLastMonth', '+15% Compared to last month')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Monthly Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {t('dashboard.monthly', 'Monthly')}
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-32">
                      <DropdownMenuItem>{t('dashboard.weekly', 'Weekly')}</DropdownMenuItem>
                      <DropdownMenuItem>{t('dashboard.monthly', 'Monthly')}</DropdownMenuItem>
                      <DropdownMenuItem>{t('dashboard.quarterly', 'Quarterly')}</DropdownMenuItem>
                      <DropdownMenuItem>{t('dashboard.yearly', 'Yearly')}</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <RevenueChart />
              </CardContent>
            </Card>
          </div>

          {/* Financial Overview - Takes 1/3 width on desktop */}
          <div className="lg:col-span-1">
            <FinancialOverviewChart />
          </div>
        </div>

        {/* Mobile Layout - Slideshow */}
        <div className="lg:hidden">
          {/* Navigation Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <div className={`nav-dot w-2 h-2 rounded-full transition-colors ${mobileChartView === 0 ? 'bg-green-600 active' : 'bg-gray-300'}`}></div>
                <div className={`nav-dot w-2 h-2 rounded-full transition-colors ${mobileChartView === 1 ? 'bg-blue-600 active' : 'bg-gray-300'}`}></div>
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {mobileChartView === 0 ? t('dashboard.revenueChart', 'Revenue Chart') : t('dashboard.financialOverview', 'Financial Overview')}
              </span>
            </div>

            {/* Navigation Arrows */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={prevChart}
                className="nav-arrow p-2 h-8 w-8"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={nextChart}
                className="nav-arrow p-2 h-8 w-8"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Slideshow Container */}
          <div
            className="relative overflow-hidden mobile-chart-slideshow"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div
              className="flex mobile-chart-slide"
              style={{ transform: `translateX(-${mobileChartView * 100}%)` }}
            >
              {/* Revenue Chart Slide */}
              <div className="w-full flex-shrink-0">
                <Card className="hover-card rounded-2xl border-0 shadow-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
                  <CardHeader className="pb-4">
                    <div className="space-y-3">
                      {/* Header with title and dropdown */}
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-bold text-gray-900 dark:text-gray-100">
                          {t('dashboard.revenue', 'Revenue')}
                        </CardTitle>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <ChevronDown className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-32">
                            <DropdownMenuItem>{t('dashboard.weekly', 'Weekly')}</DropdownMenuItem>
                            <DropdownMenuItem>{t('dashboard.monthly', 'Monthly')}</DropdownMenuItem>
                            <DropdownMenuItem>{t('dashboard.quarterly', 'Quarterly')}</DropdownMenuItem>
                            <DropdownMenuItem>{t('dashboard.yearly', 'Yearly')}</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Amount */}
                      <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                        $16500
                      </div>

                      {/* Comparison text */}
                      <div className="text-sm font-medium text-green-600 dark:text-green-400">
                        {t('dashboard.comparedToLastMonth', '+15% Compared to last month')}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <RevenueChart />
                  </CardContent>
                </Card>
              </div>

              {/* Financial Overview Slide */}
              <div className="w-full flex-shrink-0">
                <FinancialOverviewChart />
              </div>
            </div>
          </div>
        </div>


      </div>
    </AppLayout>
  );
};

export default Dashboard;
