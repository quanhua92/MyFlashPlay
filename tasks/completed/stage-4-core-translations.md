# Stage 4: Core Navigation & Interface Translations

## Objective
Apply translations to the navigation components, home page, and core interface elements to make language switching visible throughout the app.

## Overview
This stage transforms the main user interface from hardcoded English text to dynamic translations. Users will immediately see the language change impact across navigation, buttons, headings, and core interface elements.

## Key Design Decisions

### Translation Priority Strategy
- **High Visibility Elements First**: Navigation, main headings, primary buttons
- **User Flow Critical**: Elements that affect user navigation and core actions
- **Immediate Feedback**: Changes visible as soon as language is switched
- **Progressive Enhancement**: Core functionality works even if some translations are missing

### Component Update Approach
- **Minimal Disruption**: Keep existing component structure and styling
- **Type Safety**: Use TypeScript to catch missing translation keys
- **Performance**: Avoid unnecessary re-renders during translation updates
- **Accessibility**: Maintain ARIA labels and screen reader support

## Files to Create/Modify

### 1. Update Navigation Component (`src/components/layout/Navigation.tsx`)

```diff
@@ -1,4 +1,5 @@
 import { Link, useLocation } from '@tanstack/react-router';
+import { useTranslation } from '../../i18n';
 import { motion } from 'framer-motion';
 import {
   HomeIcon,
@@ -14,6 +15,7 @@ import {
 
 export function Navigation() {
   const location = useLocation();
+  const t = useTranslation();

   const isActive = (path: string) => {
     return location.pathname === path;
@@ -22,37 +24,37 @@ export function Navigation() {
   const navItems = [
     {
       to: '/',
-      label: 'Home',
+      label: t('nav.home'),
       icon: HomeIcon,
     },
     {
       to: '/create',
-      label: 'Create',
+      label: t('nav.create'),
       icon: PlusIcon,
     },
     {
       to: '/decks',
-      label: 'My Decks',
+      label: t('nav.myDecks'),
       icon: BookOpenIcon,
     },
     {
       to: '/public',
-      label: 'Public Decks',
+      label: t('nav.publicDecks'),
       icon: GlobeIcon,
     },
     {
       to: '/achievements',
-      label: 'Achievements',
+      label: t('nav.achievements'),
       icon: TrophyIcon,
     },
     {
       to: '/progress',
-      label: 'Progress',
+      label: t('nav.progress'),
       icon: TrendingUpIcon,
     },
     {
       to: '/settings',
-      label: 'Settings',
+      label: t('nav.settings'),
       icon: SettingsIcon,
     },
   ];
@@ -71,7 +73,7 @@ export function Navigation() {
           <Link to="/" className="flex items-center space-x-3">
             <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
               <span className="text-primary-foreground font-bold text-lg">M</span>
             </div>
-            <span className="text-xl font-bold text-foreground">MyFlashPlay</span>
+            <span className="text-xl font-bold text-foreground">{t('nav.appTitle')}</span>
           </Link>
         </motion.div>

@@ -83,7 +85,7 @@ export function Navigation() {
           {navItems.map((item, index) => (
             <motion.div
               key={item.to}
               initial={{ opacity: 0, x: -20 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ duration: 0.3, delay: index * 0.1 }}
             >
               <Link
                 to={item.to}
                 className={`
                   flex items-center space-x-3 px-4 py-3 rounded-lg
                   transition-all duration-200
                   ${isActive(item.to)
                     ? 'bg-primary text-primary-foreground shadow-md'
                     : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                   }
                 `}
+                aria-label={item.label}
               >
                 <item.icon className="w-5 h-5" />
                 <span className="font-medium">{item.label}</span>
               </Link>
             </motion.div>
           ))}
         </nav>
       </div>
     </aside>
   );
 }
```

**Explanation**: Updates the main navigation to use translations for all menu items and the app title. The navigation is the most visible part of the interface, so users will immediately see language changes here.

### 2. Update Mobile Navigation (`src/components/common/MobileNavigation.tsx`)

```diff
@@ -1,4 +1,5 @@
 import { Link, useLocation } from '@tanstack/react-router';
+import { useTranslation } from '../../i18n';
 import {
   HomeIcon,
   PlusIcon,
@@ -11,6 +12,7 @@ import {
 
 export function MobileNavigation() {
   const location = useLocation();
+  const t = useTranslation();

   const isActive = (path: string) => {
     return location.pathname === path;
@@ -19,27 +21,27 @@ export function MobileNavigation() {
   const navItems = [
     {
       to: '/',
-      label: 'Home',
+      label: t('nav.home'),
       icon: HomeIcon,
     },
     {
       to: '/create',
-      label: 'Create',
+      label: t('nav.create'),
       icon: PlusIcon,
     },
     {
       to: '/decks',
-      label: 'My Decks',
+      label: t('nav.myDecks'),
       icon: BookOpenIcon,
     },
     {
       to: '/public',
-      label: 'Public',
+      label: t('nav.publicDecks'),
       icon: GlobeIcon,
     },
     {
       to: '/achievements',
-      label: 'Achievements',
+      label: t('nav.achievements'),
       icon: TrophyIcon,
     },
   ];
@@ -55,6 +57,7 @@ export function MobileNavigation() {
             to={item.to}
             className={`
               flex flex-col items-center justify-center space-y-1 py-2 px-1
               transition-colors duration-200
               ${isActive(item.to)
                 ? 'text-primary'
                 : 'text-muted-foreground'
               }
             `}
+            aria-label={item.label}
           >
             <item.icon className="w-5 h-5" />
             <span className="text-xs font-medium">{item.label}</span>
           </Link>
         ))}
       </div>
     </nav>
   );
 }
```

**Explanation**: Updates mobile navigation to match the desktop navigation translations, ensuring consistency across all device types.

### 3. Update Home Page (`src/pages/HomePage.tsx`)

```diff
@@ -1,4 +1,5 @@
 import { motion } from 'framer-motion';
+import { useTranslation } from '../i18n';
 import { Link } from '@tanstack/react-router';
 import { Button } from '../components/ui/Button';
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
@@ -10,6 +11,7 @@ import {
 } from 'lucide-react';

 export function HomePage() {
+  const t = useTranslation();
+
   return (
     <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
       {/* Hero Section */}
@@ -18,13 +20,13 @@ export function HomePage() {
         <motion.div
           initial={{ opacity: 0, y: 30 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.8 }}
           className="text-center"
         >
-          <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
-            Learn Anything with
+          <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
+            {t('home.title')}
           </h1>
-          <h2 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent mb-8">
-            Interactive Flashcards
-          </h2>
-          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
-            Create, study, and master any subject with our powerful flashcard platform
+          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
+            {t('home.subtitle')}
           </p>
           
           <motion.div
             initial={{ opacity: 0, scale: 0.9 }}
             animate={{ opacity: 1, scale: 1 }}
             transition={{ duration: 0.6, delay: 0.2 }}
           >
             <Button asChild size="lg" className="text-lg px-8 py-4">
               <Link to="/create">
-                Get Started
+                {t('home.getStartedButton')}
               </Link>
             </Button>
           </motion.div>
@@ -53,7 +50,7 @@ export function HomePage() {
         >
           <div className="text-center mb-12">
-            <h3 className="text-3xl font-bold text-foreground mb-4">Powerful Features</h3>
+            <h3 className="text-3xl font-bold text-foreground mb-4">{t('home.featuresTitle')}</h3>
           </div>

           <div className="grid md:grid-cols-3 gap-8">
@@ -65,12 +62,12 @@ export function HomePage() {
             >
               <Card className="h-full hover:shadow-lg transition-shadow duration-300">
                 <CardHeader className="text-center">
                   <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                     <FileTextIcon className="w-8 h-8 text-primary" />
                   </div>
-                  <CardTitle>Simple Markdown Format</CardTitle>
+                  <CardTitle>{t('home.feature1Title')}</CardTitle>
                 </CardHeader>
                 <CardContent>
-                  <CardDescription className="text-center">
-                    Create flashcards with an intuitive one-line format: Question :: Answer
-                  </CardDescription>
+                  <CardDescription className="text-center text-base leading-relaxed">
+                    {t('home.feature1Description')}
+                  </CardDescription>
                 </CardContent>
               </Card>
             </motion.div>
@@ -84,12 +81,12 @@ export function HomePage() {
             >
               <Card className="h-full hover:shadow-lg transition-shadow duration-300">
                 <CardHeader className="text-center">
                   <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                     <GamepadIcon className="w-8 h-8 text-primary" />
                   </div>
-                  <CardTitle>Multiple Game Modes</CardTitle>
+                  <CardTitle>{t('home.feature2Title')}</CardTitle>
                 </CardHeader>
                 <CardContent>
-                  <CardDescription className="text-center">
-                    Study, Quiz, Speed Challenge, Memory Match, and Falling Quiz modes
-                  </CardDescription>
+                  <CardDescription className="text-center text-base leading-relaxed">
+                    {t('home.feature2Description')}
+                  </CardDescription>
                 </CardContent>
               </Card>
             </motion.div>
@@ -103,12 +100,12 @@ export function HomePage() {
             >
               <Card className="h-full hover:shadow-lg transition-shadow duration-300">
                 <CardHeader className="text-center">
                   <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                     <GlobeIcon className="w-8 h-8 text-primary" />
                   </div>
-                  <CardTitle>Multi-Language Support</CardTitle>
+                  <CardTitle>{t('home.feature3Title')}</CardTitle>
                 </CardHeader>
                 <CardContent>
-                  <CardDescription className="text-center">
-                    Full UTF-8 support for studying in any language worldwide
-                  </CardDescription>
+                  <CardDescription className="text-center text-base leading-relaxed">
+                    {t('home.feature3Description')}
+                  </CardDescription>
                 </CardContent>
               </Card>
             </motion.div>
@@ -125,7 +122,7 @@ export function HomePage() {
           className="text-center"
         >
           <div className="mb-8">
-            <h3 className="text-3xl font-bold text-foreground mb-4">Sample Decks</h3>
+            <h3 className="text-3xl font-bold text-foreground mb-4">{t('home.sampleDecksTitle')}</h3>
           </div>

           <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
```

**Explanation**: Updates the home page with dynamic translations for the hero section, features, and sample decks area. This gives users immediate visual feedback when changing languages.

### 4. Update Common Button Component (`src/components/ui/Button.tsx`)

```diff
@@ -1,4 +1,5 @@
 import React from 'react';
+import { useTranslation } from '../../i18n';
 import { cn } from '../../lib/utils';

 interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
@@ -6,6 +7,7 @@ interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
   size?: 'sm' | 'md' | 'lg';
   asChild?: boolean;
   children: React.ReactNode;
+  translationKey?: string;
 }

 export function Button({
@@ -14,6 +16,7 @@ export function Button({
   size = 'md',
   asChild = false,
   children,
+  translationKey,
   className,
   ...props
 }: ButtonProps) {
+  const t = useTranslation();
+
   const baseClasses = `
     inline-flex items-center justify-center rounded-md font-medium
     transition-colors focus-visible:outline-none focus-visible:ring-2 
     focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50
   `;

   const variants = {
     default: 'bg-primary text-primary-foreground hover:bg-primary/90',
     destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
     outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
     secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
     ghost: 'hover:bg-accent hover:text-accent-foreground',
     link: 'text-primary underline-offset-4 hover:underline',
   };

   const sizes = {
     sm: 'h-9 px-3 text-sm',
     md: 'h-10 px-4 py-2',
     lg: 'h-11 px-8 text-lg',
   };

   const buttonClasses = cn(
     baseClasses,
     variants[variant],
     sizes[size],
     className
   );

   if (asChild) {
     return React.cloneElement(children as React.ReactElement, {
       className: buttonClasses,
-      children: children.props.children,
+      children: translationKey ? t(translationKey) : children.props.children,
     });
   }

   return (
     <button className={buttonClasses} {...props}>
-      {children}
+      {translationKey ? t(translationKey) : children}
     </button>
   );
 }
```

**Explanation**: Adds optional translation support to the Button component, allowing for dynamic button text while maintaining backward compatibility.

### 5. Update Error Boundary (`src/components/common/ErrorBoundary.tsx`)

```diff
@@ -1,5 +1,6 @@
 import React, { Component, ReactNode } from 'react';
 import { Button } from '../ui/Button';
+import { withTranslation, TranslationProps } from '../../i18n/withTranslation';

-interface Props {
+interface Props extends TranslationProps {
   children: ReactNode;
 }

 interface State {
   hasError: boolean;
   error?: Error;
 }

-class ErrorBoundary extends Component<Props, State> {
+class ErrorBoundaryClass extends Component<Props, State> {
   constructor(props: Props) {
     super(props);
     this.state = { hasError: false };
   }

   static getDerivedStateFromError(error: Error): State {
     return { hasError: true, error };
   }

   componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
     console.error('Error caught by boundary:', error, errorInfo);
   }

   render() {
     if (this.state.hasError) {
+      const { t } = this.props;
+
       return (
         <div className="min-h-screen flex items-center justify-center p-4">
           <div className="max-w-md w-full bg-card border border-border rounded-lg p-6 text-center">
-            <h2 className="text-2xl font-bold text-foreground mb-4">Something went wrong</h2>
-            <p className="text-muted-foreground mb-6">
-              We apologize for the inconvenience. Please try refreshing the page.
-            </p>
+            <h2 className="text-2xl font-bold text-foreground mb-4">{t('errors.genericError')}</h2>
+            <p className="text-muted-foreground mb-6">{t('errors.loadError')}</p>
             <Button 
               onClick={() => window.location.reload()}
               className="w-full"
+              translationKey="common.refresh"
             >
-              Refresh Page
             </Button>
           </div>
         </div>
       );
     }

     return this.props.children;
   }
 }

+export const ErrorBoundary = withTranslation(ErrorBoundaryClass);
-export { ErrorBoundary };
```

### 6. Higher-Order Component for Class Components (`src/i18n/withTranslation.tsx`) - NEW FILE

```typescript
import React from 'react';
import { useTranslation } from './hooks/useTranslation';

export interface TranslationProps {
  t: (key: string, params?: Record<string, string | number>) => string;
}

/**
 * Higher-order component to provide translation support to class components
 * 
 * Usage:
 * const TranslatedComponent = withTranslation(ClassComponent);
 */
export function withTranslation<P extends TranslationProps>(
  Component: React.ComponentType<P>
) {
  const WrappedComponent = (props: Omit<P, keyof TranslationProps>) => {
    const t = useTranslation();
    
    return <Component {...(props as P)} t={t} />;
  };

  WrappedComponent.displayName = `withTranslation(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}
```

**Explanation**: This HOC allows class components like ErrorBoundary to access translations, ensuring error messages are properly localized.

### 7. Add Missing Translation Keys (`src/i18n/locales/en.ts`)

```diff
@@ -77,6 +77,7 @@ const en: TranslationNamespace = {
     success: 'Success',
     confirm: 'Confirm',
     yes: 'Yes',
     no: 'No',
+    refresh: 'Refresh Page',
   },
```

**Explanation**: Adding the missing translation key for the refresh button in error boundary.

### 8. Update Translation Type (`src/types/i18n.types.ts`)

```diff
@@ -65,6 +65,7 @@ export interface TranslationNamespace {
     confirm: string;
     yes: string;
     no: string;
+    refresh: string;
   };
```

**Explanation**: Adding the refresh key to the TypeScript interface to maintain type safety.

## Testing Strategy

### 1. Navigation Translation Test (`src/components/layout/__tests__/Navigation.test.tsx`) - NEW FILE

```typescript
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from '@tanstack/react-router';
import { vi } from 'vitest';
import { Navigation } from '../Navigation';

// Mock translation hook
const mockT = vi.fn((key: string) => key);
vi.mock('../../../i18n', () => ({
  useTranslation: () => mockT,
}));

describe('Navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockT.mockImplementation((key: string) => key);
  });

  it('renders all navigation items with translations', () => {
    render(
      <MemoryRouter>
        <Navigation />
      </MemoryRouter>
    );

    // Check that translation keys are called
    expect(mockT).toHaveBeenCalledWith('nav.home');
    expect(mockT).toHaveBeenCalledWith('nav.create');
    expect(mockT).toHaveBeenCalledWith('nav.myDecks');
    expect(mockT).toHaveBeenCalledWith('nav.publicDecks');
    expect(mockT).toHaveBeenCalledWith('nav.achievements');
    expect(mockT).toHaveBeenCalledWith('nav.progress');
    expect(mockT).toHaveBeenCalledWith('nav.settings');
    expect(mockT).toHaveBeenCalledWith('nav.appTitle');
  });

  it('displays translated text when translation function returns values', () => {
    mockT.mockImplementation((key: string) => {
      const translations = {
        'nav.home': 'Inicio',
        'nav.create': 'Crear',
        'nav.appTitle': 'MyFlashPlay',
      };
      return translations[key] || key;
    });

    render(
      <MemoryRouter>
        <Navigation />
      </MemoryRouter>
    );

    expect(screen.getByText('Inicio')).toBeInTheDocument();
    expect(screen.getByText('Crear')).toBeInTheDocument();
    expect(screen.getByText('MyFlashPlay')).toBeInTheDocument();
  });

  it('maintains accessibility attributes', () => {
    render(
      <MemoryRouter>
        <Navigation />
      </MemoryRouter>
    );

    const homeLink = screen.getByRole('link', { name: /nav.home/ });
    expect(homeLink).toHaveAttribute('aria-label');
  });
});
```

### 2. Home Page Translation Test (`src/pages/__tests__/HomePage.test.tsx`) - NEW FILE

```typescript
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from '@tanstack/react-router';
import { vi } from 'vitest';
import { HomePage } from '../HomePage';

// Mock translation hook
const mockT = vi.fn((key: string) => key);
vi.mock('../../i18n', () => ({
  useTranslation: () => mockT,
}));

describe('HomePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockT.mockImplementation((key: string) => key);
  });

  it('renders hero section with translations', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    expect(mockT).toHaveBeenCalledWith('home.title');
    expect(mockT).toHaveBeenCalledWith('home.subtitle');
    expect(mockT).toHaveBeenCalledWith('home.getStartedButton');
  });

  it('renders features section with translations', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    expect(mockT).toHaveBeenCalledWith('home.featuresTitle');
    expect(mockT).toHaveBeenCalledWith('home.feature1Title');
    expect(mockT).toHaveBeenCalledWith('home.feature1Description');
    expect(mockT).toHaveBeenCalledWith('home.feature2Title');
    expect(mockT).toHaveBeenCalledWith('home.feature2Description');
    expect(mockT).toHaveBeenCalledWith('home.feature3Title');
    expect(mockT).toHaveBeenCalledWith('home.feature3Description');
  });

  it('displays translated content correctly', () => {
    mockT.mockImplementation((key: string) => {
      const translations = {
        'home.title': 'Aprende Cualquier Cosa',
        'home.featuresTitle': 'Características Poderosas',
        'home.getStartedButton': 'Comenzar',
      };
      return translations[key] || key;
    });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    expect(screen.getByText('Aprende Cualquier Cosa')).toBeInTheDocument();
    expect(screen.getByText('Características Poderosas')).toBeInTheDocument();
    expect(screen.getByText('Comenzar')).toBeInTheDocument();
  });
});
```

## Performance Monitoring

### Translation Performance Hook (`src/hooks/useTranslationPerformance.ts`) - NEW FILE

```typescript
import { useEffect, useRef } from 'react';
import { useI18n } from '../i18n';

/**
 * Development hook to monitor translation performance
 * Only runs in development mode
 */
export function useTranslationPerformance() {
  const { currentLanguage, isLoading } = useI18n();
  const loadStartTime = useRef<number>();

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;

    if (isLoading && !loadStartTime.current) {
      loadStartTime.current = performance.now();
    }

    if (!isLoading && loadStartTime.current) {
      const loadTime = performance.now() - loadStartTime.current;
      console.log(`🌍 Language ${currentLanguage} loaded in ${loadTime.toFixed(2)}ms`);
      loadStartTime.current = undefined;
    }
  }, [currentLanguage, isLoading]);

  return { currentLanguage, isLoading };
}
```

**Explanation**: This development-only hook helps monitor translation loading performance during development.

## Verification Steps

1. **Navigation Translation**: Verify navigation items change language correctly
2. **Home Page Content**: Check that hero section, features, and buttons are translated
3. **Mobile Navigation**: Confirm mobile navigation matches desktop translations
4. **Error Handling**: Test that error boundaries show translated error messages
5. **Performance**: Verify no performance regressions during language switching
6. **Type Safety**: Ensure TypeScript compilation with translation keys
7. **Accessibility**: Check that screen readers announce translated content correctly

## Visual Changes Expected

After implementing this stage:

- **Navigation**: All menu items will display in selected language
- **Home Page**: Hero title, subtitle, features, and buttons will be translated
- **App Title**: "MyFlashPlay" remains the same (brand name)
- **Error Messages**: Any error screens will show localized messages
- **Buttons**: Common action buttons will be translated

## Next Stage Preview

Stage 5 will focus on form components, deck management, and game modes - areas with more complex UI interactions and user input handling.

---

**AI Agent Instructions**: 
1. Update Navigation component with all translation integrations
2. Update MobileNavigation to match desktop navigation translations
3. Update HomePage with hero section, features, and sample decks translations
4. Create withTranslation HOC for class component support
5. Update ErrorBoundary to use translations
6. Add missing translation keys to all language files
7. Run `npm run type-check` to ensure TypeScript compilation
8. Test navigation and home page in different languages
9. Verify error boundary shows translated messages
10. Continue to Stage 5 only after successful verification