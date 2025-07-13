/**
 * Custom hook for managing sales data
 */

import { useState, useEffect } from 'react';
import { inventoryService, Sale } from '@/lib/api/services/inventory';

interface UseSalesReturn {
  sales: Sale[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useSales = (): UseSalesReturn => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSales = async () => {
    try {
      setLoading(true);
      setError(null);
      const salesData = await inventoryService.getSales();
      setSales(salesData);
    } catch (err) {
      console.error('Error fetching sales:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch sales');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  return {
    sales,
    loading,
    error,
    refetch: fetchSales,
  };
};
