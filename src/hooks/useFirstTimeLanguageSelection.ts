import { useState, useEffect } from 'react';
import { useI18n } from '../contexts/i18nContext';
import { type LanguageCode } from '../types/i18n.types';

const FIRST_TIME_LANGUAGE_KEY = 'myflashplay-first-time-language';
const PREFERENCES_KEY = 'myflashplay_preferences';

export const useFirstTimeLanguageSelection = () => {
  const { setLanguage, currentLanguage } = useI18n();
  const [showDialog, setShowDialog] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkFirstTimeUser = () => {
      try {
        // Check if user has seen the language selection dialog before
        const hasSeenLanguageDialog = localStorage.getItem(FIRST_TIME_LANGUAGE_KEY);
        
        // Check if user has preferences stored (with language)
        const storedPreferences = localStorage.getItem(PREFERENCES_KEY);
        let hasLanguagePreference = false;
        
        if (storedPreferences) {
          try {
            const preferences = JSON.parse(storedPreferences);
            hasLanguagePreference = !!(preferences.language && preferences.language !== 'en-US');
          } catch {
            // Invalid JSON, treat as no preference
            hasLanguagePreference = false;
          }
        }
        
        // Show dialog if:
        // 1. User hasn't seen the dialog before, AND
        // 2. User doesn't have a non-default language preference set
        const shouldShowDialog = !hasSeenLanguageDialog && !hasLanguagePreference;
        
        console.log('Language selection check:', {
          hasSeenLanguageDialog: !!hasSeenLanguageDialog,
          hasLanguagePreference,
          shouldShowDialog,
          currentLanguage
        });
        
        setShowDialog(shouldShowDialog);
      } catch (error) {
        console.warn('Error checking first-time language selection:', error);
        // Default to not showing dialog if localStorage is not available
        setShowDialog(false);
      } finally {
        setIsChecking(false);
      }
    };

    // Small delay to ensure smooth page load
    const timer = setTimeout(checkFirstTimeUser, 500);
    
    return () => clearTimeout(timer);
  }, [currentLanguage]);

  const handleLanguageSelect = (languageCode: LanguageCode) => {
    try {
      console.log('Selecting language:', languageCode);
      
      // Change the language using the correct function
      setLanguage(languageCode);
      
      // Mark that user has seen the language selection dialog
      localStorage.setItem(FIRST_TIME_LANGUAGE_KEY, 'true');
      
      // Hide the dialog
      setShowDialog(false);
      
      console.log('Language selection completed');
    } catch (error) {
      console.error('Error setting language preference:', error);
    }
  };

  const handleDialogClose = () => {
    try {
      console.log('Closing language dialog without selection');
      
      // Mark that user has seen the dialog (even if they dismissed it)
      localStorage.setItem(FIRST_TIME_LANGUAGE_KEY, 'true');
      
      // Hide the dialog
      setShowDialog(false);
      
      console.log('Language dialog closed');
    } catch (error) {
      console.error('Error handling dialog close:', error);
      setShowDialog(false);
    }
  };

  return {
    showDialog,
    isChecking,
    handleLanguageSelect,
    handleDialogClose
  };
};