import { Outlet } from '@tanstack/react-router';
import { ThemeProvider } from './ThemeProvider';
import { Navigation } from './Navigation';
import { MobileNavigation } from '@/components/common/MobileNavigation';
import { Footer } from './Footer';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { SkipLinks } from '@/components/common/SkipLinks';
import { useAccessibility } from '@/hooks/useAccessibility';

export function RootLayout() {
  useAccessibility();
  
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
          <SkipLinks />
          <Navigation />
          <main id="main-content" className="flex-1 container mx-auto px-4 py-8 pb-20 md:pb-8">
            <Outlet />
          </main>
          <Footer />
          <MobileNavigation />
        </div>
      </ThemeProvider>
    </ErrorBoundary>
  );
}