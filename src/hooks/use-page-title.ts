import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Custom hook for managing page titles with internationalization
 * Automatically updates the document title when language changes
 */
export const usePageTitle = (titleKey: string, fallback?: string) => {
  const { t, i18n } = useTranslation();

  useEffect(() => {
    // Get the translated title
    const translatedTitle = t(titleKey, fallback || titleKey);
    
    // Set the document title with the app name
    const appName = t('common.appName', 'LocalFishing');
    document.title = `${translatedTitle} - ${appName}`;

    // Cleanup function to reset title when component unmounts
    return () => {
      document.title = appName;
    };
  }, [t, titleKey, fallback, i18n.language]);
};

/**
 * Hook for setting a simple page title without translation
 */
export const useSimplePageTitle = (title: string) => {
  const { t } = useTranslation();

  useEffect(() => {
    const appName = t('common.appName', 'LocalFishing');
    document.title = `${title} - ${appName}`;

    return () => {
      document.title = appName;
    };
  }, [title, t]);
};

/**
 * Hook for setting the default app title
 */
export const useDefaultPageTitle = () => {
  const { t, i18n } = useTranslation();

  useEffect(() => {
    const appName = t('common.appName', 'LocalFishing');
    const subtitle = t('common.appSubtitle', 'Fish Management System');
    document.title = `${appName} - ${subtitle}`;
  }, [t, i18n.language]);
};
