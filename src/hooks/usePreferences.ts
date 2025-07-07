import { useLocalStorage } from './useLocalStorage';
import type { UserPreferences } from '../types/storage.types';

const DEFAULT_PREFERENCES: UserPreferences = {
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
    screenReaderMode: false,
  },
  gameSettings: {
    defaultDifficulty: 'medium',
    showHints: true,
    autoAdvance: false,
    timerWarning: true,
  },
  lastUpdated: new Date().toISOString(),
};

export function usePreferences() {
  const [preferences, setPreferences] = useLocalStorage<UserPreferences>(
    'myflashplay_preferences',
    DEFAULT_PREFERENCES
  );

  const updatePreferences = (updates: Partial<UserPreferences>) => {
    setPreferences(prev => ({
      ...prev,
      ...updates,
      lastUpdated: new Date().toISOString(),
    }));
  };

  return {
    preferences,
    updatePreferences,
    setPreferences,
  };
}