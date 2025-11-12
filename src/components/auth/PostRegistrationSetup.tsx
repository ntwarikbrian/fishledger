import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCurrency } from "@/contexts/CurrencyContext";
import { changeLanguage, languages } from "@/i18n";
import { CheckCircle, Globe, Coins, Loader2, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";

interface PostRegistrationSetupProps {
  isOpen: boolean;
  onComplete: () => void;
  businessName: string;
}

const PostRegistrationSetup: React.FC<PostRegistrationSetupProps> = ({ 
  isOpen, 
  onComplete,
  businessName
}) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { currency, updateCurrency } = useCurrency();
  
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language);
  const [selectedCurrency, setSelectedCurrency] = useState<'USD' | 'RWF'>(currency);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Trigger confetti when setup is complete
  useEffect(() => {
    if (isComplete && showConfetti) {
      const duration = 10 * 1000; // 10 seconds
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#FF577F', '#FF884B', '#FFD384', '#A0D995', '#8ACDD7']
        });
        
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#FF577F', '#FF884B', '#FFD384', '#A0D995', '#8ACDD7']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };

      frame();

      // Stop confetti after 10 seconds
      const timer = setTimeout(() => {
        setShowConfetti(false);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isComplete, showConfetti]);

  const handleSetupComplete = async () => {
    setIsProcessing(true);
    
    try {
      // Update language
      await changeLanguage(selectedLanguage);
      localStorage.setItem('i18nextLng', selectedLanguage);
      
      // Update currency
      await updateCurrency(selectedCurrency);
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setIsProcessing(false);
      setIsComplete(true);
      setShowConfetti(true);
    } catch (error) {
      console.error("Failed to save preferences:", error);
      setIsProcessing(false);
    }
  };

  const handleGetStarted = () => {
    onComplete();
    navigate("/");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md px-4">
        <Card className="shadow-2xl border-0 bg-white dark:bg-gray-800 rounded-2xl overflow-hidden">
          <CardHeader className="text-center pb-4 pt-6">
            <div className="mx-auto mb-4">
              {isComplete ? (
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
              ) : (
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
              )}
            </div>
            
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
              {isComplete 
                ? t('auth.setupComplete', 'Setup Complete!') 
                : t('auth.customizeExperience', 'Customize Your Experience')}
            </CardTitle>
            
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {isComplete
                ? t('auth.setupCompleteMessage', 'Your account is ready to go!')
                : t('auth.setupPreferences', 'Set your preferences to get started')}
            </p>
          </CardHeader>
          
          <CardContent className="px-6 pb-6">
            {isProcessing ? (
              <div className="text-center py-8">
                <Loader2 className="h-12 w-12 animate-spin text-blue-600 dark:text-blue-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {t('auth.savingPreferences', 'Saving Your Preferences')}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {t('auth.pleaseWait', 'Please wait while we set up your account...')}
                </p>
              </div>
            ) : isComplete ? (
              <div className="text-center py-6">
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {t('auth.congratulations', 'Congratulations!')}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {t('auth.accountReady', 'Your FishLedger account for {{businessName}} is ready!', { businessName })}
                  </p>
                </div>
                
                <Button 
                  onClick={handleGetStarted}
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-xl text-lg shadow-lg transition-all duration-300 transform hover:scale-[1.02]"
                >
                  {t('auth.getStarted', 'Get Started')}
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="language" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      {t('auth.language', 'Language')}
                    </Label>
                    <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                      <SelectTrigger className="h-12 text-base border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 rounded-xl">
                        <SelectValue placeholder={t('auth.selectLanguage', 'Select language')} />
                      </SelectTrigger>
                      <SelectContent>
                        {languages.map((lang) => (
                          <SelectItem key={lang.code} value={lang.code} className="py-2">
                            <div className="flex items-center gap-3">
                              <span className="font-medium">{lang.nativeName}</span>
                              <span className="text-xs text-gray-500">({lang.name})</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="currency" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <Coins className="h-4 w-4" />
                      {t('auth.currency', 'Currency')}
                    </Label>
                    <Select value={selectedCurrency} onValueChange={(value: 'USD' | 'RWF') => setSelectedCurrency(value)}>
                      <SelectTrigger className="h-12 text-base border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 rounded-xl">
                        <SelectValue placeholder={t('auth.selectCurrency', 'Select currency')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD" className="py-2">
                          <div className="flex items-center gap-3">
                            <span className="font-medium">US Dollar</span>
                            <span className="text-xs text-gray-500">(USD $)</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="RWF" className="py-2">
                          <div className="flex items-center gap-3">
                            <span className="font-medium">Rwandan Franc</span>
                            <span className="text-xs text-gray-500">(RWF)</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <Button 
                  onClick={handleSetupComplete}
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-xl text-lg shadow-lg transition-all duration-300"
                >
                  {t('auth.continue', 'Continue')}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PostRegistrationSetup;