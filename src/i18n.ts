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
      format: function(value, format, lng) {
        if (format === 'currency') {
          // Format currency based on language
          if (lng === 'rw') {
            return new Intl.NumberFormat('rw-RW', {
              style: 'currency',
              currency: 'RWF'
            }).format(value);
          } else {
            return new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD'
            }).format(value);
          }
        }
        
        if (format === 'number') {
          return new Intl.NumberFormat(lng).format(value);
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
        
        return value;
      }
    },
    
    // React options
    react: {
      // Use Suspense for async loading
      useSuspense: false,
      
      // Bind i18n instance to React component
      bindI18n: 'languageChanged',
      
      // Bind store to React component
      bindI18nStore: '',
      
      // How to handle trans component defaultValue
      transEmptyNodeValue: '',
      
      // Transform the defaultValue
      transSupportBasicHtmlNodes: true,
      transKeepBasicHtmlNodesFor: ['br', 'strong', 'i', 'p'],
      
      // Unescape passed in values
      unescape: true
    },
    
    // Backend options (if using backend plugin)
    backend: {
      // Path where resources get loaded from
      loadPath: '/locales/{{lng}}/{{ns}}.json',
      
      // Path to post missing resources
      addPath: '/locales/add/{{lng}}/{{ns}}',
      
      // Allow cross domain requests
      crossDomain: false,
      
      // Allow credentials on cross domain requests
      withCredentials: false,
      
      // Define how long to wait for loading a resource
      requestOptions: {
        mode: 'cors',
        credentials: 'same-origin',
        cache: 'default'
      }
    },
    
    // Namespace options
    ns: ['translation'],
    defaultNS: 'translation',
    
    // Key separator
    keySeparator: '.',
    
    // Namespace separator
    nsSeparator: ':',
    
    // Plural separator
    pluralSeparator: '_',
    
    // Context separator
    contextSeparator: '_',
    
    // Save missing keys
    saveMissing: process.env.NODE_ENV === 'development',
    
    // Missing key handler
    missingKeyHandler: function(lng, ns, key, fallbackValue) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`Missing translation key: ${key} for language: ${lng}`);
      }
    },
    
    // Post processor
    postProcess: false,
    
    // Return null for empty values
    returnNull: false,
    
    // Return empty string for empty values
    returnEmptyString: false,
    
    // Return objects
    returnObjects: false,
    
    // Join arrays
    joinArrays: false,
    
    // Return details
    returnedObjectHandler: function(key, value, options) {
      return value;
    },
    
    // Parse missing key handler
    parseMissingKeyHandler: function(key) {
      return key;
    },
    
    // Append namespace to missing key
    appendNamespaceToMissingKey: false,
    
    // Append namespace to CIMode
    appendNamespaceToCIMode: false,
    
    // Override options
    overloadTranslationOptionHandler: function(args) {
      return {
        defaultValue: args[1]
      };
    }
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

// Helper function to format currency
export const formatCurrency = (amount: number, lng?: string) => {
  const language = lng || i18n.language;
  if (language === 'rw') {
    return new Intl.NumberFormat('rw-RW', {
      style: 'currency',
      currency: 'RWF'
    }).format(amount);
  } else {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
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
