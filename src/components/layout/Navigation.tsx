import { Link, useRouterState } from '@tanstack/react-router';
import { Home, Plus, BookOpen, Trophy, Menu, X, Settings, TrendingUp, Globe } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/i18n';

export function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouterState();
  const currentPath = router.location.pathname;
  const t = useTranslation();

  const navItems = [
    { path: '/' as const, label: t('nav.home'), icon: Home },
    { path: '/create' as const, label: t('nav.create'), icon: Plus },
    { path: '/decks' as const, label: t('nav.myDecks'), icon: BookOpen },
    { path: '/public-decks' as const, label: t('nav.publicDecks'), icon: Globe },
    { path: '/achievements' as const, label: t('nav.achievements'), icon: Trophy },
    { path: '/progress' as const, label: t('nav.progress'), icon: TrendingUp },
    { path: '/settings' as const, label: t('nav.settings'), icon: Settings }
  ];

  return (
    <nav id="navigation" className="bg-white dark:bg-gray-900 shadow-lg sticky top-0 z-50" role="navigation" aria-label="Main navigation">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-3">
              <span className="text-3xl">🎯</span>
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                {t('nav.appTitle')}
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex lg:items-center lg:space-x-2">
            {navItems.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                className={cn(
                  'flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors whitespace-nowrap',
                  'hover:bg-gray-100 dark:hover:bg-gray-800',
                  currentPath === path
                    ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300'
                    : 'text-gray-600 dark:text-gray-300'
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium text-sm">{label}</span>
              </Link>
            ))}
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-gray-900 dark:text-gray-100" />
              ) : (
                <Menu className="w-6 h-6 text-gray-900 dark:text-gray-100" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white dark:bg-gray-900 border-t dark:border-gray-800">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navItems.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors',
                  'hover:bg-gray-100 dark:hover:bg-gray-800',
                  currentPath === path
                    ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300'
                    : 'text-gray-600 dark:text-gray-300'
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{label}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}