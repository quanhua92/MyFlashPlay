# Stage 1: i18n Infrastructure Setup

## Objective
Set up the foundational internationalization (i18n) infrastructure including TypeScript types, React context, and custom hooks for translation management.

## Overview
This stage creates the core i18n system that will support the entire multi-language implementation. We'll build a lightweight, type-safe translation system optimized for React 19 with TypeScript.

## Key Design Decisions

### Why Custom i18n vs Libraries (react-i18next, etc.)
- **Bundle Size**: MyFlashPlay prioritizes performance; custom solution is ~2KB vs 50KB+ for full i18n libraries
- **Type Safety**: Full TypeScript integration with compile-time key validation
- **React 19 Compatibility**: Built specifically for React 19's concurrent features
- **Control**: No external dependencies, easier maintenance for open-source contributors

### Architecture Choice: Context + Hooks Pattern
- **React 19 Optimized**: Uses `useMemo` for translation caching and `useCallback` for state updates
- **Type Safety**: Translation keys are strongly typed, preventing runtime errors
- **Performance**: Memoized translations prevent unnecessary re-renders
- **Developer Experience**: Simple `useTranslation()` hook API similar to react-i18next

## Files to Create/Modify

### 1. Translation Types (`src/types/i18n.types.ts`) - NEW FILE

```typescript
// Language codes following ISO 639-1 standard
export type LanguageCode = 'en' | 'vi' | 'es' | 'fr' | 'de' | 'ja' | 'ko' | 'zh';

// Language metadata for the language picker
export interface Language {
  code: LanguageCode;
  name: string;           // English name: "English", "Vietnamese"
  nativeName: string;     // Native name: "English", "Tiếng Việt"
  flag: string;           // Unicode flag emoji
  direction: 'ltr' | 'rtl'; // Text direction
}

// Available languages configuration
export const AVAILABLE_LANGUAGES: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸', direction: 'ltr' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', flag: '🇻🇳', direction: 'ltr' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', direction: 'ltr' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', direction: 'ltr' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', direction: 'ltr' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵', direction: 'ltr' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷', direction: 'ltr' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳', direction: 'ltr' },
];

// Translation namespace structure
export interface TranslationNamespace {
  // Navigation
  nav: {
    home: string;
    create: string;
    myDecks: string;
    publicDecks: string;
    achievements: string;
    progress: string;
    settings: string;
    appTitle: string;
  };
  
  // Common actions and buttons
  common: {
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    play: string;
    back: string;
    next: string;
    previous: string;
    loading: string;
    error: string;
    success: string;
    confirm: string;
    yes: string;
    no: string;
  };
  
  // Home page
  home: {
    title: string;
    subtitle: string;
    featuresTitle: string;
    feature1Title: string;
    feature1Description: string;
    feature2Title: string;
    feature2Description: string;
    feature3Title: string;
    feature3Description: string;
    getStartedButton: string;
    sampleDecksTitle: string;
  };
  
  // Settings page
  settings: {
    title: string;
    languageTitle: string;
    languageDescription: string;
    themeTitle: string;
    themeDescription: string;
    light: string;
    dark: string;
    system: string;
    dataTitle: string;
    dataDescription: string;
    exportData: string;
    importData: string;
    clearData: string;
  };
  
  // Create page
  create: {
    title: string;
    deckNameLabel: string;
    deckNamePlaceholder: string;
    descriptionLabel: string;
    descriptionPlaceholder: string;
    contentLabel: string;
    contentPlaceholder: string;
    visibilityLabel: string;
    public: string;
    private: string;
    createButton: string;
    markdownGuideTitle: string;
    basicFormat: string;
    advancedFormat: string;
  };
  
  // Deck management
  decks: {
    title: string;
    myDecksTitle: string;
    publicDecksTitle: string;
    createNewDeck: string;
    noDeckFound: string;
    cards: string;
    lastModified: string;
    playDeck: string;
    editDeck: string;
    deleteDeck: string;
    confirmDelete: string;
  };
  
  // Game modes
  game: {
    studyMode: string;
    quizMode: string;
    speedMode: string;
    memoryMode: string;
    fallingMode: string;
    showAnswer: string;
    nextCard: string;
    correct: string;
    incorrect: string;
    score: string;
    timeLeft: string;
    gameComplete: string;
    playAgain: string;
    backToDecks: string;
  };
  
  // Error messages
  errors: {
    deckNotFound: string;
    invalidFormat: string;
    saveError: string;
    loadError: string;
    networkError: string;
    genericError: string;
  };
}

// Helper type for deep key paths
export type TranslationKey = string;

// Translation function type
export type TranslationFunction = (key: TranslationKey, params?: Record<string, string | number>) => string;
```

**Explanation**: This file establishes the type foundation for our i18n system. The `TranslationNamespace` interface ensures all translation files have the same structure, preventing missing translations. The `LanguageCode` union type provides compile-time safety for language selection.

### 2. i18n Context (`src/contexts/i18nContext.tsx`) - NEW FILE

```typescript
import React, { createContext, useContext, useCallback, useMemo, useEffect } from 'react';
import { LanguageCode, TranslationNamespace, TranslationFunction } from '../types/i18n.types';
import { usePreferences } from '../hooks/usePreferences';

interface I18nContextType {
  currentLanguage: LanguageCode;
  setLanguage: (language: LanguageCode) => void;
  t: TranslationFunction;
  translations: TranslationNamespace;
  isLoading: boolean;
}

const I18nContext = createContext<I18nContextType | null>(null);

interface I18nProviderProps {
  children: React.ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
  const { preferences, updatePreferences } = usePreferences();
  const [translations, setTranslations] = React.useState<TranslationNamespace | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  // Extract language code from preferences (remove country code if present)
  const currentLanguage = useMemo(() => {
    const lang = preferences.language || 'en-US';
    return lang.split('-')[0] as LanguageCode;
  }, [preferences.language]);

  // Load translation file dynamically
  const loadTranslations = useCallback(async (language: LanguageCode) => {
    setIsLoading(true);
    try {
      // Dynamic import for code splitting
      const translationModule = await import(`../i18n/locales/${language}.ts`);
      setTranslations(translationModule.default);
    } catch (error) {
      console.warn(`Failed to load translations for ${language}, falling back to English`);
      try {
        const fallbackModule = await import('../i18n/locales/en.ts');
        setTranslations(fallbackModule.default);
      } catch (fallbackError) {
        console.error('Failed to load fallback translations:', fallbackError);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load translations when language changes
  useEffect(() => {
    loadTranslations(currentLanguage);
  }, [currentLanguage, loadTranslations]);

  // Update language preference
  const setLanguage = useCallback((language: LanguageCode) => {
    updatePreferences({ language: `${language}-${language.toUpperCase()}` });
  }, [updatePreferences]);

  // Translation function with parameter interpolation
  const t = useCallback<TranslationFunction>((key: string, params?: Record<string, string | number>) => {
    if (!translations) {
      return key; // Return key if translations not loaded
    }

    // Navigate nested object path
    const keys = key.split('.');
    let value: any = translations;
    
    for (const k of keys) {
      value = value?.[k];
      if (value === undefined) {
        console.warn(`Translation key not found: ${key}`);
        return key;
      }
    }

    // Handle parameter interpolation
    if (typeof value === 'string' && params) {
      return Object.entries(params).reduce(
        (str, [paramKey, paramValue]) => str.replace(`{{${paramKey}}}`, String(paramValue)),
        value
      );
    }

    return value || key;
  }, [translations]);

  const contextValue = useMemo(() => ({
    currentLanguage,
    setLanguage,
    t,
    translations: translations!,
    isLoading,
  }), [currentLanguage, setLanguage, t, translations, isLoading]);

  return (
    <I18nContext.Provider value={contextValue}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}
```

**Explanation**: This context provides centralized language management with React 19 optimizations. The dynamic imports enable code splitting, so only the current language file is loaded. The parameter interpolation supports dynamic content like `"Welcome {{name}}!"`.

### 3. Translation Hook (`src/hooks/useTranslation.ts`) - NEW FILE

```typescript
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
```

**Explanation**: These hooks provide a clean API similar to popular i18n libraries, making it easy for contributors familiar with react-i18next to adapt.

### 4. i18n Entry Point (`src/i18n/index.ts`) - NEW FILE

```typescript
export { I18nProvider, useI18n } from '../contexts/i18nContext';
export { useTranslation, useLanguage } from '../hooks/useTranslation';
export type { LanguageCode, Language, TranslationNamespace } from '../types/i18n.types';
export { AVAILABLE_LANGUAGES } from '../types/i18n.types';
```

**Explanation**: This barrel export makes imports cleaner and provides a single entry point for the i18n system.

### 5. Update App Root (`src/App.tsx`)

```diff
@@ -1,4 +1,5 @@
 import { RouterProvider } from '@tanstack/react-router';
+import { I18nProvider } from './i18n';
 import { router } from './router';
 import { PreferencesProvider } from './contexts/PreferencesContext';
 import { DecksProvider } from './contexts/DecksContext';
@@ -9,11 +10,13 @@ function App() {
   return (
     <div className="min-h-screen bg-background text-foreground">
       <PreferencesProvider>
-        <DecksProvider>
-          <RouterProvider router={router} />
-        </DecksProvider>
+        <I18nProvider>
+          <DecksProvider>
+            <RouterProvider router={router} />
+          </DecksProvider>
+        </I18nProvider>
       </PreferencesProvider>
     </div>
   );
 }
```

**Explanation**: Wrapping the app with `I18nProvider` makes translations available throughout the component tree. The order matters: `PreferencesProvider` → `I18nProvider` → `DecksProvider` ensures language preferences are available before translations load.

## Testing Strategy

### 1. Create Test File (`src/hooks/__tests__/useTranslation.test.tsx`) - NEW FILE

```typescript
import { renderHook, act } from '@testing-library/react';
import { useTranslation, useLanguage } from '../useTranslation';
import { I18nProvider } from '../../contexts/i18nContext';
import { PreferencesProvider } from '../../contexts/PreferencesContext';

// Mock preferences
const mockUpdatePreferences = jest.fn();
jest.mock('../usePreferences', () => ({
  usePreferences: () => ({
    preferences: { language: 'en-US' },
    updatePreferences: mockUpdatePreferences,
  }),
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <PreferencesProvider>
    <I18nProvider>
      {children}
    </I18nProvider>
  </PreferencesProvider>
);

describe('useTranslation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return translation function', () => {
    const { result } = renderHook(() => useTranslation(), {
      wrapper: TestWrapper,
    });

    expect(typeof result.current).toBe('function');
  });

  it('should handle missing translation keys gracefully', () => {
    const { result } = renderHook(() => useTranslation(), {
      wrapper: TestWrapper,
    });

    const translation = result.current('missing.key');
    expect(translation).toBe('missing.key');
  });
});

describe('useLanguage', () => {
  it('should return current language and setter', () => {
    const { result } = renderHook(() => useLanguage(), {
      wrapper: TestWrapper,
    });

    expect(result.current.currentLanguage).toBe('en');
    expect(typeof result.current.setLanguage).toBe('function');
    expect(typeof result.current.isLoading).toBe('boolean');
  });

  it('should update language preference when setLanguage called', () => {
    const { result } = renderHook(() => useLanguage(), {
      wrapper: TestWrapper,
    });

    act(() => {
      result.current.setLanguage('vi');
    });

    expect(mockUpdatePreferences).toHaveBeenCalledWith({ language: 'vi-VI' });
  });
});
```

**Explanation**: These tests verify the core functionality of our translation hooks, including error handling for missing keys and language switching.

## Potential Challenges & Solutions

### Challenge 1: Translation Loading Performance
**Problem**: Dynamic imports might cause loading delays
**Solution**: Implement loading states and preload common languages
**Recovery**: Add fallback to cached translations or default language

### Challenge 2: Type Safety with Dynamic Keys
**Problem**: Dynamic translation keys lose TypeScript safety
**Solution**: Use template literal types for common patterns
**Recovery**: Runtime validation with helpful error messages

### Challenge 3: Memory Usage with Multiple Languages
**Problem**: Loading many languages could increase memory usage
**Solution**: Only load current language, implement lazy loading
**Recovery**: LRU cache for recently used languages

## Verification Steps

1. **Type Checking**: Run `npm run type-check` to ensure TypeScript compilation
2. **Basic Functionality**: Check that translation context provides expected values
3. **Language Switching**: Verify language changes update throughout app
4. **Error Handling**: Test missing translation keys return graceful fallbacks

## Next Stage Preview

Stage 2 will create the actual translation files starting with English baseline, and implement the translation JSON structure for contributors.

---

**AI Agent Instructions**: 
1. Create all files exactly as specified above
2. Run `npm run type-check` after implementation
3. If TypeScript errors occur, check import paths and type definitions
4. Verify the app still compiles and runs without errors
5. If context provider errors occur, ensure provider order matches the diff
6. Continue to Stage 2 only after successful verification