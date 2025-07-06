import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { Globe, Check, RefreshCw } from 'lucide-react';
import { languages, changeLanguage, getCurrentLanguage } from '@/i18n';
import { toast } from 'sonner';

/**
 * Language Settings Component
 * Allows users to change their language preference in settings
 */
export const LanguageSettings: React.FC = () => {
  const { t, i18n } = useTranslation();
  const currentLanguage = getCurrentLanguage();

  /**
   * Handle language change
   * @param languageCode - The new language code
   */
  const handleLanguageChange = (languageCode: string) => {
    try {
      changeLanguage(languageCode);
      toast.success(
        t('settings.languageChanged', 'Language changed successfully'),
        {
          description: t('settings.languageChangeDescription', 'The interface language has been updated'),
        }
      );
    } catch (error) {
      toast.error(
        t('settings.languageChangeError', 'Failed to change language'),
        {
          description: t('settings.languageChangeErrorDescription', 'Please try again'),
        }
      );
    }
  };

  /**
   * Reset language to default (English)
   */
  const resetToDefault = () => {
    handleLanguageChange('en');
  };

  /**
   * Get language display information
   */
  const getLanguageInfo = (langCode: string) => {
    const language = languages.find(lang => lang.code === langCode);
    return language || { code: langCode, name: langCode, nativeName: langCode };
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Globe className="h-5 w-5 text-primary" />
          <div>
            <CardTitle>{t('settings.languagePreferences', 'Language Preferences')}</CardTitle>
            <CardDescription>
              {t('settings.languageDescription', 'Choose your preferred language for the interface')}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Language Display */}
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
              <Globe className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-medium">{t('settings.currentLanguage', 'Current Language')}</p>
              <p className="text-sm text-muted-foreground">
                {getLanguageInfo(currentLanguage).nativeName} ({getLanguageInfo(currentLanguage).name})
              </p>
            </div>
          </div>
          <Check className="h-5 w-5 text-green-500" />
        </div>

        {/* Language Selection */}
        <div className="space-y-4">
          <Label className="text-base font-medium">
            {t('settings.selectLanguage', 'Select Language')}
          </Label>
          <RadioGroup
            value={currentLanguage}
            onValueChange={handleLanguageChange}
            className="space-y-3"
          >
            {languages.map((language) => (
              <div
                key={language.code}
                className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <RadioGroupItem value={language.code} id={language.code} />
                <Label
                  htmlFor={language.code}
                  className="flex-1 cursor-pointer flex items-center justify-between"
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{language.nativeName}</span>
                    <span className="text-sm text-muted-foreground">{language.name}</span>
                  </div>
                  {currentLanguage === language.code && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        {/* Language Information */}
        <div className="space-y-3 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
          <h4 className="font-medium text-blue-900 dark:text-blue-100">
            {t('settings.languageInfo', 'Language Information')}
          </h4>
          <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
            <li className="flex items-start space-x-2">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
              <span>
                {t('settings.languageInfoAutoSave', 'Your language preference is automatically saved')}
              </span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
              <span>
                {t('settings.languageInfoInstant', 'Changes take effect immediately')}
              </span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
              <span>
                {t('settings.languageInfoPersistent', 'Settings persist across browser sessions')}
              </span>
            </li>
          </ul>
        </div>

        {/* Reset Button */}
        {currentLanguage !== 'en' && (
          <div className="flex justify-end pt-4 border-t">
            <Button
              variant="outline"
              onClick={resetToDefault}
              className="flex items-center space-x-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>{t('settings.resetToEnglish', 'Reset to English')}</span>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * Compact Language Settings Component
 * A smaller version for use in dropdowns or limited space
 */
export const CompactLanguageSettings: React.FC = () => {
  const { t } = useTranslation();
  const currentLanguage = getCurrentLanguage();

  const handleLanguageChange = (languageCode: string) => {
    changeLanguage(languageCode);
    toast.success(t('settings.languageChanged', 'Language changed successfully'));
  };

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">
        {t('settings.language', 'Language')}
      </Label>
      <RadioGroup
        value={currentLanguage}
        onValueChange={handleLanguageChange}
        className="space-y-2"
      >
        {languages.map((language) => (
          <div key={language.code} className="flex items-center space-x-2">
            <RadioGroupItem value={language.code} id={`compact-${language.code}`} />
            <Label
              htmlFor={`compact-${language.code}`}
              className="text-sm cursor-pointer flex-1"
            >
              {language.nativeName}
            </Label>
            {currentLanguage === language.code && (
              <Check className="h-3 w-3 text-primary" />
            )}
          </div>
        ))}
      </RadioGroup>
    </div>
  );
};

export default LanguageSettings;
