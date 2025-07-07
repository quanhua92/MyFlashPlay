import React, { useTransition } from 'react';
import { ChevronDownIcon } from 'lucide-react';
import { useLanguage, useTranslation } from '../../i18n';
import { AVAILABLE_LANGUAGES, type LanguageCode } from '../../types/i18n.types';

interface LanguageSelectorProps {
  className?: string;
}

export function LanguageSelector({ className = '' }: LanguageSelectorProps) {
  const { currentLanguage, setLanguage } = useLanguage();
  const t = useTranslation();
  const [isPending, startTransition] = useTransition();

  const handleLanguageChange = (newLanguage: LanguageCode) => {
    // Use React 19's startTransition for smooth UI updates
    startTransition(() => {
      setLanguage(newLanguage);
    });
  };

  const currentLanguageData = AVAILABLE_LANGUAGES.find(
    lang => lang.code === currentLanguage
  ) || AVAILABLE_LANGUAGES[0];

  return (
    <div className={`relative ${className}`}>
      <label 
        htmlFor="language-select" 
        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
      >
        {t('settings.languageTitle')}
      </label>
      
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
        {t('settings.languageDescription')}
      </p>

      <div className="relative">
        <select
          id="language-select"
          data-testid="language-select"
          value={currentLanguage}
          onChange={(e) => handleLanguageChange(e.target.value as LanguageCode)}
          disabled={isPending}
          className={`
            w-full px-4 py-3 pr-10 
            bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg
            text-gray-900 dark:text-white text-base
            focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-200
            ${isPending ? 'opacity-50' : ''}
          `}
          aria-label={t('settings.languageDescription')}
        >
          {AVAILABLE_LANGUAGES.map((language) => (
            <option key={language.code} value={language.code}>
              {language.flag} {language.nativeName} ({language.name})
            </option>
          ))}
        </select>

        <ChevronDownIcon className={`
          absolute right-3 top-1/2 transform -translate-y-1/2 
          w-5 h-5 text-gray-400 pointer-events-none
          transition-transform duration-200
          ${isPending ? 'animate-spin' : ''}
        `} />
      </div>

      {/* Loading indicator for better UX */}
      {isPending && (
        <div className="mt-2 flex items-center text-sm text-gray-600 dark:text-gray-400">
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
          {t('common.loading')}
        </div>
      )}

      {/* Preview of selected language */}
      <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <span className="text-2xl" role="img" aria-label={`${currentLanguageData.name} flag`}>
            {currentLanguageData.flag}
          </span>
          <div>
            <div className="font-medium text-gray-900 dark:text-white">
              {currentLanguageData.nativeName}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {currentLanguageData.name} • {currentLanguageData.direction.toUpperCase()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}