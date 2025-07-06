import { Outlet } from '@tanstack/react-router';
import { ThemeProvider } from './ThemeProvider';
import { Navigation } from './Navigation';
import { Footer } from './Footer';

export function RootLayout() {
  return (
    <ThemeProvider>
      <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
        <Navigation />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Outlet />
        </main>
        <Footer />
      </div>
    </ThemeProvider>
  );
}