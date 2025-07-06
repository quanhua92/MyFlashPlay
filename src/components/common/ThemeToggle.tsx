import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from '@/components/layout/ThemeProvider';
import { cn } from '@/lib/utils';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const themes = [
    { value: 'light' as const, icon: Sun, label: 'Light' },
    { value: 'dark' as const, icon: Moon, label: 'Dark' },
    { value: 'auto' as const, icon: Monitor, label: 'Auto' }
  ];

  // Force light mode button for debugging
  const forceLight = () => {
    console.log('Forcing light mode');
    localStorage.removeItem('flashplay_preferences');
    setTheme('light');
    window.location.reload();
  };

  return (
    <div className="flex items-center space-x-2">
      <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
        {themes.map(({ value, icon: Icon, label }) => (
          <button
            key={value}
            onClick={() => {
              console.log('Theme button clicked:', value, 'Current theme:', theme);
              setTheme(value);
            }}
            className={cn(
              'p-2 rounded-md transition-all',
              theme === value
                ? 'bg-white dark:bg-gray-700 shadow-sm'
                : 'hover:bg-gray-200 dark:hover:bg-gray-700'
            )}
            title={label}
          >
            <Icon 
              className={cn(
                'w-4 h-4',
                theme === value
                  ? 'text-purple-600 dark:text-purple-400'
                  : 'text-gray-600 dark:text-gray-400'
              )}
            />
          </button>
        ))}
      </div>
      <button
        onClick={forceLight}
        className="px-2 py-1 text-xs bg-red-500 text-white rounded"
        title="Reset theme"
      >
        Reset
      </button>
    </div>
  );
}