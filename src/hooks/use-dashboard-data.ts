/**
 * Dashboard Data Hooks
 * Custom React hooks for fetching and managing dashboard data
 */

import { useState, useEffect, useCallback } from 'react';
import { dashboardAPI, DashboardStats, RevenueChartData, FinancialOverviewData } from '@/services/api';

// Hook state interface
interface DashboardDataState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  lastFetched: Date | null;
}

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

/**
 * Hook for fetching dashboard statistics
 */
export const useDashboardStats = () => {
  const [state, setState] = useState<DashboardDataState<DashboardStats>>({
    data: null,
    loading: false,
    error: null,
    lastFetched: null,
  });

  const fetchStats = useCallback(async (force = false) => {
    // Check if we need to fetch (force or cache expired)
    const now = new Date();
    const shouldFetch = force || 
      !state.data || 
      !state.lastFetched || 
      (now.getTime() - state.lastFetched.getTime()) > CACHE_DURATION;

    if (!shouldFetch) {
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      console.log('🔄 Fetching dashboard stats...');
      const response = await dashboardAPI.getStats();
      
      if (response.success) {
        setState({
          data: response.data,
          loading: false,
          error: null,
          lastFetched: now,
        });
        console.log('✅ Dashboard stats fetched successfully:', response.data);
      } else {
        throw new Error('Failed to fetch dashboard stats');
      }
    } catch (error) {
      console.error('❌ Error fetching dashboard stats:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch dashboard stats',
      }));
    }
  }, [state.data, state.lastFetched]);

  // Auto-fetch on mount
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    ...state,
    refetch: () => fetchStats(true),
    refresh: () => fetchStats(true),
  };
};

/**
 * Hook for fetching revenue chart data with period support
 */
export const useRevenueChart = (period: 'week' | 'month' | '6months' = 'month') => {
  const [state, setState] = useState<DashboardDataState<RevenueChartData[]>>({
    data: null,
    loading: false,
    error: null,
    lastFetched: null,
  });

  const fetchRevenueChart = useCallback(async (force = false, newPeriod?: 'week' | 'month' | '6months') => {
    const currentPeriod = newPeriod || period;

    // Check if we need to fetch (force, period changed, or cache expired)
    const now = new Date();
    const shouldFetch = force ||
      !state.data ||
      !state.lastFetched ||
      (now.getTime() - state.lastFetched.getTime()) > CACHE_DURATION;

    if (!shouldFetch) {
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      console.log('🔄 Fetching revenue chart data for period:', currentPeriod);
      const response = await dashboardAPI.getRevenueChart(currentPeriod);

      if (response.success) {
        setState({
          data: response.data,
          loading: false,
          error: null,
          lastFetched: now,
        });
        console.log('✅ Revenue chart data fetched successfully:', response.data);
      } else {
        throw new Error('Failed to fetch revenue chart data');
      }
    } catch (error) {
      console.error('❌ Error fetching revenue chart data:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch revenue chart data',
      }));
    }
  }, [period, state.data, state.lastFetched]);

  // Auto-fetch on mount and when period changes
  useEffect(() => {
    fetchRevenueChart(true);
  }, [period]);

  return {
    ...state,
    refetch: (newPeriod?: 'week' | 'month' | '6months') => fetchRevenueChart(true, newPeriod),
    refresh: (newPeriod?: 'week' | 'month' | '6months') => fetchRevenueChart(true, newPeriod),
  };
};

/**
 * Hook for fetching financial overview data
 */
export const useFinancialOverview = () => {
  const [state, setState] = useState<DashboardDataState<FinancialOverviewData[]>>({
    data: null,
    loading: false,
    error: null,
    lastFetched: null,
  });

  const fetchFinancialOverview = useCallback(async (force = false) => {
    // Check if we need to fetch (force or cache expired)
    const now = new Date();
    const shouldFetch = force || 
      !state.data || 
      !state.lastFetched || 
      (now.getTime() - state.lastFetched.getTime()) > CACHE_DURATION;

    if (!shouldFetch) {
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      console.log('🔄 Fetching financial overview data...');
      const response = await dashboardAPI.getFinancialOverview();
      
      if (response.success) {
        setState({
          data: response.data,
          loading: false,
          error: null,
          lastFetched: now,
        });
        console.log('✅ Financial overview data fetched successfully:', response.data);
      } else {
        throw new Error('Failed to fetch financial overview data');
      }
    } catch (error) {
      console.error('❌ Error fetching financial overview data:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch financial overview data',
      }));
    }
  }, [state.data, state.lastFetched]);

  // Auto-fetch on mount
  useEffect(() => {
    fetchFinancialOverview();
  }, [fetchFinancialOverview]);

  return {
    ...state,
    refetch: () => fetchFinancialOverview(true),
    refresh: () => fetchFinancialOverview(true),
  };
};

/**
 * Combined hook for all dashboard data
 */
export const useDashboardData = (revenueChartPeriod: 'week' | 'month' | '6months' = 'month') => {
  const stats = useDashboardStats();
  const revenueChart = useRevenueChart(revenueChartPeriod);
  const financialOverview = useFinancialOverview();

  const refreshAll = useCallback((newPeriod?: 'week' | 'month' | '6months') => {
    stats.refresh();
    revenueChart.refresh(newPeriod);
    financialOverview.refresh();
  }, [stats.refresh, revenueChart.refresh, financialOverview.refresh]);

  const isLoading = stats.loading || revenueChart.loading || financialOverview.loading;
  const hasError = stats.error || revenueChart.error || financialOverview.error;

  return {
    stats,
    revenueChart,
    financialOverview,
    refreshAll,
    isLoading,
    hasError,
  };
};
