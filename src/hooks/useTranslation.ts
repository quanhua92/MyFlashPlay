import { useI18n } from '../contexts/i18nContext';

/**
 * Convenient hook for accessing translation function
 * 
 * Usage:
 * const t = useTranslation();
 * return <h1>{t('home.title')}</h1>;
 */
export function useTranslation() {
  const { t } = useI18n();
  return t;
}

/**
 * Hook for language management
 * 
 * Usage:
 * const { currentLanguage, setLanguage, availableLanguages } = useLanguage();
 */
export function useLanguage() {
  const { currentLanguage, setLanguage, isLoading } = useI18n();
  
  return {
    currentLanguage,
    setLanguage,
    isLoading,
  };
}