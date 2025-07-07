import { useEffect } from 'react';
import { useI18n } from '../i18n';
import { AVAILABLE_LANGUAGES } from '../types/i18n.types';

/**
 * Hook for handling language switching side effects
 * 
 * This hook manages:
 * - Document language attribute updates
 * - Text direction changes (for RTL languages)
 * - Accessibility announcements
 * - Analytics tracking (if implemented)
 */
export function useLanguageSwitching() {
  const { currentLanguage, isLoading } = useI18n();

  useEffect(() => {
    // Update document language for accessibility and SEO
    document.documentElement.lang = currentLanguage;
    
    // Set text direction (important for RTL languages like Arabic)
    const languageData = AVAILABLE_LANGUAGES.find(lang => lang.code === currentLanguage);
    if (languageData) {
      document.documentElement.dir = languageData.direction;
    }

    // Announce language change to screen readers
    if (!isLoading) {
      const announcement = document.createElement('div');
      announcement.setAttribute('aria-live', 'polite');
      announcement.setAttribute('aria-atomic', 'true');
      announcement.className = 'sr-only';
      announcement.textContent = `Language changed to ${languageData?.nativeName || currentLanguage}`;
      
      document.body.appendChild(announcement);
      
      // Clean up announcement after screen readers have processed it
      setTimeout(() => {
        if (document.body.contains(announcement)) {
          document.body.removeChild(announcement);
        }
      }, 1000);
    }
  }, [currentLanguage, isLoading]);

  return { currentLanguage, isLoading };
}