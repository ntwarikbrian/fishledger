import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { languages, changeLanguage, getCurrentLanguage } from '@/i18n';

/**
 * Language Switcher Component
 * Provides a dropdown menu to switch between available languages
 */
export const LanguageSwitcher: React.FC = () => {
  const { t, i18n } = useTranslation();
  const currentLanguage = getCurrentLanguage();

  /**
   * Handle language change
   * @param languageCode - The language code to switch to
   */
  const handleLanguageChange = (languageCode: string) => {
    changeLanguage(languageCode);
  };

  /**
   * Get the current language display name
   */
  const getCurrentLanguageDisplay = () => {
    const current = languages.find(lang => lang.code === currentLanguage);
    return current?.nativeName || current?.name || 'English';
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 px-0 lg:h-9 lg:w-auto lg:px-3"
          title={t('common.language')}
        >
          <Globe className="h-4 w-4" />
          <span className="hidden lg:ml-2 lg:inline-block">
            {getCurrentLanguageDisplay()}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            className="flex items-center justify-between cursor-pointer"
          >
            <div className="flex flex-col">
              <span className="font-medium">{language.nativeName}</span>
              <span className="text-xs text-muted-foreground">{language.name}</span>
            </div>
            {currentLanguage === language.code && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

/**
 * Compact Language Switcher Component
 * A more compact version for mobile or space-constrained areas
 */
export const CompactLanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();
  const currentLanguage = getCurrentLanguage();

  /**
   * Handle language change
   * @param event - The select change event
   */
  const handleLanguageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const languageCode = event.target.value;
    changeLanguage(languageCode);
  };

  return (
    <div className="flex items-center space-x-2">
      <Globe className="h-4 w-4 text-muted-foreground" />
      <select
        value={currentLanguage}
        onChange={handleLanguageChange}
        className="bg-transparent border-none text-sm focus:outline-none focus:ring-0 cursor-pointer"
        title="Select Language"
      >
        {languages.map((language) => (
          <option key={language.code} value={language.code}>
            {language.nativeName}
          </option>
        ))}
      </select>
    </div>
  );
};

/**
 * Language Toggle Component
 * Simple toggle between two languages (EN/RW)
 */
export const LanguageToggle: React.FC = () => {
  const currentLanguage = getCurrentLanguage();
  const isKinyarwanda = currentLanguage === 'rw';

  /**
   * Toggle between English and Kinyarwanda
   */
  const toggleLanguage = () => {
    const newLanguage = isKinyarwanda ? 'en' : 'rw';
    changeLanguage(newLanguage);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleLanguage}
      className="h-8 px-3 text-xs font-medium"
      title={`Switch to ${isKinyarwanda ? 'English' : 'Kinyarwanda'}`}
    >
      <Globe className="h-3 w-3 mr-1" />
      {isKinyarwanda ? 'EN' : 'RW'}
    </Button>
  );
};

/**
 * Language Switcher with Flags Component
 * Enhanced version with flag icons (if available)
 */
export const LanguageSwitcherWithFlags: React.FC = () => {
  const { t } = useTranslation();
  const currentLanguage = getCurrentLanguage();

  /**
   * Handle language change
   * @param languageCode - The language code to switch to
   */
  const handleLanguageChange = (languageCode: string) => {
    changeLanguage(languageCode);
  };

  /**
   * Get flag emoji for language
   * @param languageCode - The language code
   */
  const getFlagEmoji = (languageCode: string) => {
    switch (languageCode) {
      case 'en':
        return '🇺🇸'; // US flag for English
      case 'rw':
        return '🇷🇼'; // Rwanda flag for Kinyarwanda
      default:
        return '🌐'; // Globe for unknown languages
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 lg:h-9 lg:px-3"
          title={t('common.language')}
        >
          <span className="text-lg mr-1">{getFlagEmoji(currentLanguage)}</span>
          <span className="hidden lg:inline-block text-sm">
            {languages.find(lang => lang.code === currentLanguage)?.nativeName}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            className="flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center space-x-3">
              <span className="text-lg">{getFlagEmoji(language.code)}</span>
              <div className="flex flex-col">
                <span className="font-medium">{language.nativeName}</span>
                <span className="text-xs text-muted-foreground">{language.name}</span>
              </div>
            </div>
            {currentLanguage === language.code && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// Export default as the main LanguageSwitcher
export default LanguageSwitcher;
