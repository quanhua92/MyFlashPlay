import { Link, useRouterState } from '@tanstack/react-router';
import { Home, Plus, BookOpen, Trophy, Globe } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/i18n';

export function MobileNavigation() {
  const router = useRouterState();
  const currentPath = router.location.pathname;
  const t = useTranslation();

  const navItems = [
    { path: '/' as const, label: t('nav.home'), icon: Home },
    { path: '/create' as const, label: t('nav.create'), icon: Plus },
    { path: '/decks' as const, label: t('nav.myDecks'), icon: BookOpen },
    { path: '/public-decks' as const, label: t('nav.publicDecks'), icon: Globe },
    { path: '/achievements' as const, label: t('nav.achievements'), icon: Trophy }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 md:hidden z-50 pb-safe">
      <div className="flex justify-around items-center py-2">
        {navItems.map(({ path, label, icon: Icon }) => {
          const isActive = currentPath === path;
          
          return (
            <Link
              key={path}
              to={path}
              className={cn(
                'flex flex-col items-center justify-center p-2 rounded-lg transition-all',
                'hover:bg-gray-100 dark:hover:bg-gray-800',
                'relative min-w-[64px]'
              )}
            >
              <div className="relative">
                <Icon className={cn(
                  'w-6 h-6 transition-colors',
                  isActive
                    ? 'text-purple-600 dark:text-purple-400'
                    : 'text-gray-500 dark:text-gray-400'
                )} />
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute -inset-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg -z-10"
                    initial={false}
                    transition={{
                      type: 'spring',
                      stiffness: 500,
                      damping: 30
                    }}
                  />
                )}
              </div>
              <span className={cn(
                'text-xs mt-1',
                isActive
                  ? 'text-purple-600 dark:text-purple-400 font-medium'
                  : 'text-gray-500 dark:text-gray-400'
              )}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}