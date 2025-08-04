/**
 * Currency Context
 * Provides currency management functionality throughout the application
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';

// Currency types
export type Currency = 'USD' | 'RWF';

// Currency configuration
export const CURRENCIES = {
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    locale: 'en-US',
  },
  RWF: {
    code: 'RWF',
    symbol: 'RWF',
    name: 'Rwandan Franc',
    locale: 'rw-RW',
  },
} as const;

// Context interface
interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  formatCurrency: (amount: number) => string;
  getCurrencySymbol: () => string;
  getCurrencyName: () => string;
  isLoading: boolean;
  updateCurrency: (newCurrency: Currency) => Promise<void>;
}

// Create context
const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

// Currency provider props
interface CurrencyProviderProps {
  children: ReactNode;
}

/**
 * Currency Provider Component
 * Manages currency state and provides currency utilities
 */
export const CurrencyProvider: React.FC<CurrencyProviderProps> = ({ children }) => {
  const [currency, setCurrencyState] = useState<Currency>('USD');
  const [isLoading, setIsLoading] = useState(false);

  // Load currency from localStorage on mount
  useEffect(() => {
    const savedCurrency = localStorage.getItem('currency') as Currency;
    if (savedCurrency && (savedCurrency === 'USD' || savedCurrency === 'RWF')) {
      setCurrencyState(savedCurrency);
    }
  }, []);

  /**
   * Format currency amount based on current currency
   */
  const formatCurrency = (amount: number): string => {
    const currencyConfig = CURRENCIES[currency];
    
    try {
      // For RWF, we don't want decimal places as it's typically whole numbers
      const options: Intl.NumberFormatOptions = {
        style: 'currency',
        currency: currencyConfig.code,
        minimumFractionDigits: currency === 'RWF' ? 0 : 2,
        maximumFractionDigits: currency === 'RWF' ? 0 : 2,
      };

      return new Intl.NumberFormat(currencyConfig.locale, options).format(amount);
    } catch (error) {
      // Fallback formatting if Intl.NumberFormat fails
      const symbol = currencyConfig.symbol;
      const formattedAmount = currency === 'RWF' 
        ? Math.round(amount).toLocaleString()
        : amount.toFixed(2);
      
      return currency === 'USD' 
        ? `${symbol}${formattedAmount}`
        : `${formattedAmount} ${symbol}`;
    }
  };

  /**
   * Get current currency symbol
   */
  const getCurrencySymbol = (): string => {
    return CURRENCIES[currency].symbol;
  };

  /**
   * Get current currency name
   */
  const getCurrencyName = (): string => {
    return CURRENCIES[currency].name;
  };

  /**
   * Update currency and save to localStorage and backend
   */
  const updateCurrency = async (newCurrency: Currency): Promise<void> => {
    setIsLoading(true);
    
    try {
      // Save to localStorage immediately for instant UI update
      localStorage.setItem('currency', newCurrency);
      setCurrencyState(newCurrency);

      // Try to save to backend (if user is authenticated)
      try {
        const token = localStorage.getItem('auth_token');
        if (token) {
          const response = await fetch('/api/settings', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ currency: newCurrency }),
          });

          if (!response.ok) {
            console.warn('Failed to save currency to backend, but localStorage updated');
          }
        }
      } catch (backendError) {
        console.warn('Backend currency update failed:', backendError);
        // Don't throw error - localStorage update is sufficient for now
      }

      toast.success(`Currency changed to ${CURRENCIES[newCurrency].name}`);
    } catch (error) {
      console.error('Failed to update currency:', error);
      toast.error('Failed to update currency preference');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Set currency (internal state only)
   */
  const setCurrency = (newCurrency: Currency): void => {
    setCurrencyState(newCurrency);
    localStorage.setItem('currency', newCurrency);
  };

  const value: CurrencyContextType = {
    currency,
    setCurrency,
    formatCurrency,
    getCurrencySymbol,
    getCurrencyName,
    isLoading,
    updateCurrency,
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};

/**
 * Hook to use currency context
 */
export const useCurrency = (): CurrencyContextType => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};

/**
 * Utility function to format currency without context (for use in non-React contexts)
 */
export const formatCurrencyStatic = (amount: number, currency: Currency = 'USD'): string => {
  const currencyConfig = CURRENCIES[currency];
  
  try {
    const options: Intl.NumberFormatOptions = {
      style: 'currency',
      currency: currencyConfig.code,
      minimumFractionDigits: currency === 'RWF' ? 0 : 2,
      maximumFractionDigits: currency === 'RWF' ? 0 : 2,
    };

    return new Intl.NumberFormat(currencyConfig.locale, options).format(amount);
  } catch (error) {
    // Fallback formatting
    const symbol = currencyConfig.symbol;
    const formattedAmount = currency === 'RWF' 
      ? Math.round(amount).toLocaleString()
      : amount.toFixed(2);
    
    return currency === 'USD' 
      ? `${symbol}${formattedAmount}`
      : `${formattedAmount} ${symbol}`;
  }
};

/**
 * Utility function to get currency symbol without context
 */
export const getCurrencySymbolStatic = (currency: Currency = 'USD'): string => {
  return CURRENCIES[currency].symbol;
};

export default CurrencyContext;
