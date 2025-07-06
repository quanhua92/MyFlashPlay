import { Outlet } from '@tanstack/react-router';
import { ThemeProvider } from './ThemeProvider';
import { Navigation } from './Navigation';
import { MobileNavigation } from '@/components/common/MobileNavigation';
import { Footer } from './Footer';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

export function RootLayout() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
          <Navigation />
          <main className="flex-1 container mx-auto px-4 py-8 pb-20 md:pb-8">
            <Outlet />
          </main>
          <Footer />
          <MobileNavigation />
        </div>
      </ThemeProvider>
    </ErrorBoundary>
  );
}