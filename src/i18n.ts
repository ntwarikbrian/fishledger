import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import enTranslation from './locales/en/translation.json';
import rwTranslation from './locales/rw/translation.json';

/**
 * i18n Configuration for LocalFishing Application
 * Supports English (en) and Kinyarwanda (rw) languages
 */
i18n
  // Detect user language
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize i18next
  .init({
    // Define available resources
    resources: {
      en: {
        translation: enTranslation
      },
      rw: {
        translation: rwTranslation
      }
    },

    // Fallback language if detection fails
    fallbackLng: 'en',

    // Debug mode (set to false in production)
    debug: process.env.NODE_ENV === 'development',

    // Language detection options
    detection: {
      // Order of language detection methods
      order: ['localStorage', 'navigator', 'htmlTag'],

      // Cache user language preference
      caches: ['localStorage'],

      // Key to store language in localStorage
      lookupLocalStorage: 'i18nextLng',

      // Don't lookup from path, subdomain, etc.
      lookupFromPathIndex: 0,
      lookupFromSubdomainIndex: 0,

      // Exclude certain detection methods
      excludeCacheFor: ['cimode']
    },

    // Interpolation options
    interpolation: {
      // React already does escaping
      escapeValue: false,

      // Format function for numbers, dates, etc.
      format: function(value: any, format?: string, lng?: string): string {
        if (format === 'currency') {
          // Format currency based on language
          if (lng === 'rw') {
            return new Intl.NumberFormat('rw-RW', {
              style: 'currency',
              currency: 'RWF'
            }).format(Number(value));
          } else {
            return new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD'
            }).format(Number(value));
          }
        }

        if (format === 'number') {
          return new Intl.NumberFormat(lng).format(Number(value));
        }

        if (format === 'date') {
          return new Intl.DateTimeFormat(lng).format(new Date(value));
        }

        if (format === 'datetime') {
          return new Intl.DateTimeFormat(lng, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }).format(new Date(value));
        }

        return String(value);
      }
    },

    // React options
    react: {
      // Use Suspense for async loading
      useSuspense: false
    },

    // Save missing keys in development
    saveMissing: process.env.NODE_ENV === 'development'
  });

// Export configured i18n instance
export default i18n;

// Export language options for components
export const languages = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'rw', name: 'Kinyarwanda', nativeName: 'Ikinyarwanda' }
];

// Helper function to get current language
export const getCurrentLanguage = () => i18n.language;

// Helper function to change language
export const changeLanguage = (lng: string) => {
  i18n.changeLanguage(lng);
  localStorage.setItem('i18nextLng', lng);
};

// Helper function to get available languages
export const getAvailableLanguages = () => languages;

// Helper function to format currency (deprecated - use useCurrency hook instead)
// This function is kept for backward compatibility but should be replaced with useCurrency
export const formatCurrency = (amount: number, lng?: string) => {
  // Try to get currency from localStorage first
  const savedCurrency = localStorage.getItem('currency') as 'USD' | 'RWF' | null;
  const currency = savedCurrency || 'USD';

  try {
    const options: Intl.NumberFormatOptions = {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: currency === 'RWF' ? 0 : 2,
      maximumFractionDigits: currency === 'RWF' ? 0 : 2,
    };

    const locale = currency === 'RWF' ? 'rw-RW' : 'en-US';
    return new Intl.NumberFormat(locale, options).format(amount);
  } catch (error) {
    // Fallback formatting
    const symbol = currency === 'RWF' ? 'RWF' : '$';
    const formattedAmount = currency === 'RWF'
      ? Math.round(amount).toLocaleString()
      : amount.toFixed(2);

    return currency === 'USD'
      ? `${symbol}${formattedAmount}`
      : `${formattedAmount} ${symbol}`;
  }
};

// Helper function to format numbers
export const formatNumber = (number: number, lng?: string) => {
  const language = lng || i18n.language;
  return new Intl.NumberFormat(language).format(number);
};

// Helper function to format dates
export const formatDate = (date: Date | string, lng?: string) => {
  const language = lng || i18n.language;
  return new Intl.DateTimeFormat(language).format(new Date(date));
};

// Helper function to format date and time
export const formatDateTime = (date: Date | string, lng?: string) => {
  const language = lng || i18n.language;
  return new Intl.DateTimeFormat(language, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date));
};
