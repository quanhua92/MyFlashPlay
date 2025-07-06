import React, { createContext, useContext, useEffect, useState } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { STORAGE_KEYS } from '@/utils/constants';
import type { UserPreferences } from '@/types';

type Theme = 'light' | 'dark' | 'auto';
type ColorScheme = 'rainbow' | 'ocean' | 'space' | 'forest';

interface ThemeContextType {
  theme: Theme;
  colorScheme: ColorScheme;
  setTheme: (theme: Theme) => void;
  setColorScheme: (scheme: ColorScheme) => void;
  actualTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useLocalStorage<UserPreferences>(
    STORAGE_KEYS.PREFERENCES,
    {
      version: '1.0.0',
      theme: 'auto',
      colorScheme: 'rainbow',
      soundEnabled: true,
      animationsEnabled: true,
      fontSize: 'medium',
      language: 'en-US',
      accessibility: {
        highContrast: false,
        reducedMotion: false,
        screenReaderMode: false
      },
      gameSettings: {
        defaultDifficulty: 'medium',
        showHints: true,
        autoAdvance: false,
        timerWarning: true
      },
      lastUpdated: new Date().toISOString()
    }
  );

  const [actualTheme, setActualTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const updateTheme = () => {
      if (preferences.theme === 'auto') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setActualTheme(prefersDark ? 'dark' : 'light');
      } else {
        setActualTheme(preferences.theme);
      }
    };

    updateTheme();

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', updateTheme);

    return () => mediaQuery.removeEventListener('change', updateTheme);
  }, [preferences.theme]);

  useEffect(() => {
    // Apply theme to document
    document.documentElement.classList.toggle('dark', actualTheme === 'dark');
    document.documentElement.setAttribute('data-theme', actualTheme);
    document.documentElement.setAttribute('data-color-scheme', preferences.colorScheme);
  }, [actualTheme, preferences.colorScheme]);

  const setTheme = (theme: Theme) => {
    setPreferences(prev => ({
      ...prev,
      theme,
      lastUpdated: new Date().toISOString()
    }));
  };

  const setColorScheme = (colorScheme: ColorScheme) => {
    setPreferences(prev => ({
      ...prev,
      colorScheme,
      lastUpdated: new Date().toISOString()
    }));
  };

  return (
    <ThemeContext.Provider
      value={{
        theme: preferences.theme,
        colorScheme: preferences.colorScheme,
        setTheme,
        setColorScheme,
        actualTheme
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}