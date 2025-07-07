# Stage 3: Language Switcher Implementation

## Objective
Implement the language switcher component in the Settings page and integrate it with the i18n system to enable real-time language switching.

## Overview
This stage creates the user interface for language selection and connects it to the existing preferences system. Users will be able to switch languages instantly and see the entire app update in real-time.

## Key Design Decisions

### Why Settings Page Integration
- **Familiar Location**: Users expect language settings in Settings/Preferences
- **Existing Infrastructure**: Preferences system already exists and works
- **Accessibility**: Part of the general configuration workflow
- **Persistence**: Language choice automatically saved in localStorage

### UI Component Design Choices
- **Native Flag Emojis**: Universally supported, no additional assets needed
- **Native + English Names**: Helps users identify languages they don't read
- **Dropdown Interface**: Familiar pattern, works well on mobile and desktop
- **Immediate Feedback**: Language changes instantly without page reload

### Technical Integration Strategy
- **React 19 Concurrent Features**: Smooth transitions without blocking UI
- **Optimistic Updates**: Language changes immediately, even during file loading
- **Graceful Fallbacks**: Falls back to English if translation loading fails
- **Performance Optimization**: Only loads new language files when needed

## Files to Create/Modify

### 1. Language Selector Component (`src/components/settings/LanguageSelector.tsx`) - NEW FILE

```typescript
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
        className="block text-sm font-medium text-foreground mb-2"
      >
        {t('settings.languageTitle')}
      </label>
      
      <p className="text-sm text-muted-foreground mb-3">
        {t('settings.languageDescription')}
      </p>

      <div className="relative">
        <select
          id="language-select"
          value={currentLanguage}
          onChange={(e) => handleLanguageChange(e.target.value as LanguageCode)}
          disabled={isPending}
          className={`
            w-full px-4 py-3 pr-10 
            bg-background border border-border rounded-lg
            text-foreground text-base
            focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
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
          w-5 h-5 text-muted-foreground pointer-events-none
          transition-transform duration-200
          ${isPending ? 'animate-spin' : ''}
        `} />
      </div>

      {/* Loading indicator for better UX */}
      {isPending && (
        <div className="mt-2 flex items-center text-sm text-muted-foreground">
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
          {t('common.loading')}
        </div>
      )}

      {/* Preview of selected language */}
      <div className="mt-3 p-3 bg-muted/50 rounded-lg border border-border">
        <div className="flex items-center space-x-3">
          <span className="text-2xl" role="img" aria-label={`${currentLanguageData.name} flag`}>
            {currentLanguageData.flag}
          </span>
          <div>
            <div className="font-medium text-foreground">
              {currentLanguageData.nativeName}
            </div>
            <div className="text-sm text-muted-foreground">
              {currentLanguageData.name} • {currentLanguageData.direction.toUpperCase()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

**Explanation**: This component provides an accessible, responsive language selector with visual feedback. It uses React 19's `useTransition` for smooth language switching and includes loading states for better UX.

### 2. Update Settings Page (`src/pages/SettingsPage.tsx`)

```diff
@@ -1,6 +1,7 @@
 import { useState } from 'react';
 import { motion } from 'framer-motion';
 import { usePreferences } from '../hooks/usePreferences';
+import { useTranslation } from '../i18n';
+import { LanguageSelector } from '../components/settings/LanguageSelector';
 import { Button } from '../components/ui/Button';
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
 import { Switch } from '../components/ui/Switch';
@@ -12,6 +13,7 @@ import {
 } from 'lucide-react';

 export function SettingsPage() {
+  const t = useTranslation();
   const { preferences, updatePreferences } = usePreferences();
   const [isExporting, setIsExporting] = useState(false);
   const [isImporting, setIsImporting] = useState(false);
@@ -52,7 +54,7 @@ export function SettingsPage() {
       className="container mx-auto px-4 py-8 max-w-4xl"
     >
       <motion.h1
-        className="text-3xl font-bold mb-8 text-center"
+        className="text-3xl font-bold mb-8 text-center text-foreground"
         initial={{ opacity: 0, y: -20 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ duration: 0.6 }}
@@ -60,7 +62,7 @@ export function SettingsPage() {
-        Settings
+        {t('settings.title')}
       </motion.h1>

       <div className="space-y-6">
+        {/* Language Settings */}
+        <motion.div
+          initial={{ opacity: 0, y: 20 }}
+          animate={{ opacity: 1, y: 0 }}
+          transition={{ duration: 0.6, delay: 0.1 }}
+        >
+          <Card>
+            <CardHeader>
+              <CardTitle className="flex items-center space-x-2">
+                <GlobeIcon className="w-5 h-5" />
+                <span>{t('settings.languageTitle')}</span>
+              </CardTitle>
+              <CardDescription>
+                {t('settings.languageDescription')}
+              </CardDescription>
+            </CardHeader>
+            <CardContent>
+              <LanguageSelector />
+            </CardContent>
+          </Card>
+        </motion.div>
+
         {/* Theme Settings */}
         <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
-          transition={{ duration: 0.6, delay: 0.1 }}
+          transition={{ duration: 0.6, delay: 0.2 }}
         >
           <Card>
             <CardHeader>
               <CardTitle className="flex items-center space-x-2">
                 <PaletteIcon className="w-5 h-5" />
-                <span>Theme</span>
+                <span>{t('settings.themeTitle')}</span>
               </CardTitle>
               <CardDescription>
-                Choose your preferred color scheme
+                {t('settings.themeDescription')}
               </CardDescription>
             </CardHeader>
             <CardContent>
@@ -101,7 +123,7 @@ export function SettingsPage() {
                         />
                         <label htmlFor="light-theme" className="cursor-pointer">
-                          Light
+                          {t('settings.light')}
                         </label>
                       </div>
@@ -116,7 +138,7 @@ export function SettingsPage() {
                         />
                         <label htmlFor="dark-theme" className="cursor-pointer">
-                          Dark
+                          {t('settings.dark')}
                         </label>
                       </div>
@@ -131,7 +153,7 @@ export function SettingsPage() {
                         />
                         <label htmlFor="system-theme" className="cursor-pointer">
-                          System
+                          {t('settings.system')}
                         </label>
                       </div>
                     </div>
@@ -144,14 +166,14 @@ export function SettingsPage() {
         <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
-          transition={{ duration: 0.6, delay: 0.2 }}
+          transition={{ duration: 0.6, delay: 0.3 }}
         >
           <Card>
             <CardHeader>
               <CardTitle className="flex items-center space-x-2">
                 <DatabaseIcon className="w-5 h-5" />
-                <span>Data Management</span>
+                <span>{t('settings.dataTitle')}</span>
               </CardTitle>
               <CardDescription>
-                Import, export, or clear your flashcard data
+                {t('settings.dataDescription')}
               </CardDescription>
             </CardHeader>
             <CardContent>
@@ -167,7 +189,7 @@ export function SettingsPage() {
                   disabled={isExporting}
                   className="flex items-center space-x-2"
                 >
                   <DownloadIcon className="w-4 h-4" />
-                  <span>Export Data</span>
+                  <span>{t('settings.exportData')}</span>
                 </Button>

                 <Button
@@ -176,7 +198,7 @@ export function SettingsPage() {
                   disabled={isImporting}
                   className="flex items-center space-x-2"
                 >
                   <UploadIcon className="w-4 h-4" />
-                  <span>Import Data</span>
+                  <span>{t('settings.importData')}</span>
                 </Button>

                 <Button
@@ -185,7 +207,7 @@ export function SettingsPage() {
                   disabled={isClearing}
                   className="flex items-center space-x-2"
                 >
                   <TrashIcon className="w-4 h-4" />
-                  <span>Clear All Data</span>
+                  <span>{t('settings.clearData')}</span>
                 </Button>
               </div>
             </CardContent>
```

**Explanation**: This updates the Settings page to use translations and adds the language selector as the first section. The language section gets priority placement since it affects the entire interface.

### 3. Add Globe Icon Import (`src/pages/SettingsPage.tsx`)

```diff
@@ -7,6 +7,7 @@ import {
   PaletteIcon,
   DatabaseIcon,
   DownloadIcon,
+  GlobeIcon,
   UploadIcon,
   TrashIcon,
 } from 'lucide-react';
```

**Explanation**: Adding the globe icon for the language section header.

### 4. Language Switching Integration Hook (`src/hooks/useLanguageSwitching.ts`) - NEW FILE

```typescript
import { useEffect } from 'react';
import { useI18n } from '../i18n';

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
        document.body.removeChild(announcement);
      }, 1000);
    }
  }, [currentLanguage, isLoading]);

  return { currentLanguage, isLoading };
}
```

**Explanation**: This hook handles important side effects of language switching, including accessibility improvements and proper document metadata updates.

### 5. Update App.tsx for Language Switching

```diff
@@ -1,6 +1,7 @@
 import { RouterProvider } from '@tanstack/react-router';
 import { I18nProvider } from './i18n';
+import { useLanguageSwitching } from './hooks/useLanguageSwitching';
 import { router } from './router';
 import { PreferencesProvider } from './contexts/PreferencesContext';
 import { DecksProvider } from './contexts/DecksContext';
 import './index.css';

+function AppContent() {
+  useLanguageSwitching();
+  
+  return <RouterProvider router={router} />;
+}
+
 function App() {
   return (
     <div className="min-h-screen bg-background text-foreground">
       <PreferencesProvider>
         <I18nProvider>
           <DecksProvider>
-            <RouterProvider router={router} />
+            <AppContent />
           </DecksProvider>
         </I18nProvider>
       </PreferencesProvider>
     </div>
   );
 }

 export default App;
```

**Explanation**: This ensures language switching side effects are properly handled throughout the app lifecycle.

### 6. Missing Import Fix (`src/hooks/useLanguageSwitching.ts`)

```diff
@@ -1,5 +1,6 @@
 import { useEffect } from 'react';
 import { useI18n } from '../i18n';
+import { AVAILABLE_LANGUAGES } from '../types/i18n.types';

 /**
  * Hook for handling language switching side effects
```

**Explanation**: Adding the missing import for AVAILABLE_LANGUAGES.

## Testing Strategy

### 1. Language Selector Component Test (`src/components/settings/__tests__/LanguageSelector.test.tsx`) - NEW FILE

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { LanguageSelector } from '../LanguageSelector';
import { I18nProvider } from '../../../i18n';
import { PreferencesProvider } from '../../../contexts/PreferencesContext';

// Mock the translation hook
const mockSetLanguage = vi.fn();
vi.mock('../../../i18n', async () => {
  const actual = await vi.importActual('../../../i18n');
  return {
    ...actual,
    useLanguage: () => ({
      currentLanguage: 'en',
      setLanguage: mockSetLanguage,
      isLoading: false,
    }),
    useTranslation: () => (key: string) => key,
  };
});

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <PreferencesProvider>
    <I18nProvider>
      {children}
    </I18nProvider>
  </PreferencesProvider>
);

describe('LanguageSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders language selector with all available languages', () => {
    render(<LanguageSelector />, { wrapper: TestWrapper });
    
    const select = screen.getByLabelText(/settings.languageDescription/);
    expect(select).toBeInTheDocument();
    
    // Check that all language options are present
    const options = screen.getAllByRole('option');
    expect(options.length).toBeGreaterThan(3); // At least en, vi, es
  });

  it('displays current language correctly', () => {
    render(<LanguageSelector />, { wrapper: TestWrapper });
    
    const select = screen.getByDisplayValue('en');
    expect(select).toBeInTheDocument();
  });

  it('calls setLanguage when selection changes', async () => {
    render(<LanguageSelector />, { wrapper: TestWrapper });
    
    const select = screen.getByLabelText(/settings.languageDescription/);
    fireEvent.change(select, { target: { value: 'vi' } });
    
    await waitFor(() => {
      expect(mockSetLanguage).toHaveBeenCalledWith('vi');
    });
  });

  it('shows loading state during language change', () => {
    // Mock loading state
    vi.mocked(useLanguage).mockReturnValue({
      currentLanguage: 'en',
      setLanguage: mockSetLanguage,
      isLoading: true,
    });

    render(<LanguageSelector />, { wrapper: TestWrapper });
    
    expect(screen.getByText('common.loading')).toBeInTheDocument();
    const select = screen.getByLabelText(/settings.languageDescription/);
    expect(select).toBeDisabled();
  });

  it('displays language preview correctly', () => {
    render(<LanguageSelector />, { wrapper: TestWrapper });
    
    // Should show English flag and names
    expect(screen.getByText('🇺🇸')).toBeInTheDocument();
    expect(screen.getByText('English')).toBeInTheDocument();
    expect(screen.getByText('LTR')).toBeInTheDocument();
  });
});
```

### 2. Language Switching Integration Test (`src/hooks/__tests__/useLanguageSwitching.test.ts`) - NEW FILE

```typescript
import { renderHook } from '@testing-library/react';
import { vi } from 'vitest';
import { useLanguageSwitching } from '../useLanguageSwitching';

// Mock the i18n hook
vi.mock('../../i18n', () => ({
  useI18n: () => ({
    currentLanguage: 'en',
    isLoading: false,
  }),
}));

describe('useLanguageSwitching', () => {
  beforeEach(() => {
    // Reset document attributes
    document.documentElement.lang = '';
    document.documentElement.dir = '';
  });

  it('updates document language attribute', () => {
    renderHook(() => useLanguageSwitching());
    
    expect(document.documentElement.lang).toBe('en');
  });

  it('sets text direction correctly', () => {
    renderHook(() => useLanguageSwitching());
    
    expect(document.documentElement.dir).toBe('ltr');
  });

  it('announces language changes to screen readers', () => {
    const createElementSpy = vi.spyOn(document, 'createElement');
    const appendChildSpy = vi.spyOn(document.body, 'appendChild');
    
    renderHook(() => useLanguageSwitching());
    
    expect(createElementSpy).toHaveBeenCalledWith('div');
    expect(appendChildSpy).toHaveBeenCalled();
  });
});
```

## Performance Considerations

### Optimizations Implemented

1. **React 19 Concurrent Features**: Using `useTransition` for non-blocking language switches
2. **Dynamic Imports**: Language files are loaded only when needed
3. **Memoization**: Translation functions are memoized to prevent unnecessary re-renders
4. **Graceful Loading**: Loading states prevent UI jarring during language switches

### Bundle Size Impact

- **Base i18n System**: ~3KB (types, context, hooks)
- **Per Language File**: ~2KB (85 translation keys)
- **Total for 3 Languages**: ~9KB (significantly smaller than react-i18next ~50KB)

## Potential Challenges & Solutions

### Challenge 1: Language File Loading Delays
**Problem**: Network delays when loading language files
**Solution**: Implement loading states and preload popular languages
**Recovery**: Fall back to cached English translations

### Challenge 2: Incomplete Translations During Development
**Problem**: New features added without updating all languages
**Solution**: Validation script catches missing keys, falls back to English
**Recovery**: Development mode shows missing key warnings

### Challenge 3: RTL Language Support
**Problem**: UI layout issues with right-to-left languages
**Solution**: CSS logical properties and automatic direction switching
**Recovery**: Graceful degradation to LTR layout

## Verification Steps

1. **Component Rendering**: Verify LanguageSelector renders without errors
2. **Language Switching**: Test that selecting languages updates the entire interface
3. **Persistence**: Verify language choice is saved and restored on page reload
4. **Loading States**: Check that loading indicators work during language changes
5. **Accessibility**: Verify screen reader announcements and proper ARIA attributes
6. **Performance**: Test that language switching doesn't block the UI thread

## Next Stage Preview

Stage 4 will apply translations to the navigation components and core app sections, making the language switching visible throughout the interface.

---

**AI Agent Instructions**: 
1. Create the LanguageSelector component exactly as specified
2. Update SettingsPage.tsx with all the translation integrations
3. Create the useLanguageSwitching hook for side effects
4. Update App.tsx to use the language switching hook
5. Run `npm run type-check` to ensure TypeScript compilation
6. Test the language selector in the Settings page
7. Verify that language changes persist across page reloads
8. If errors occur, check import paths and component integration
9. Continue to Stage 4 only after successful verification