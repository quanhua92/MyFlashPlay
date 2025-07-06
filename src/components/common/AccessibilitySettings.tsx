import { Eye, Type, Zap, Volume2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { STORAGE_KEYS } from '@/utils/constants';
import type { UserPreferences } from '@/types';

export function AccessibilitySettings() {
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
    } as UserPreferences
  );

  const updateAccessibility = (key: keyof UserPreferences['accessibility'], value: boolean) => {
    setPreferences({
      ...preferences,
      accessibility: {
        ...preferences.accessibility,
        [key]: value
      }
    });
  };

  const updateFontSize = (size: string) => {
    setPreferences({
      ...preferences,
      fontSize: size as any
    });
  };

  return (
    <div className="space-y-6">
      {/* Visual Settings */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Eye className="w-5 h-5" />
          Visual Settings
        </h3>
        
        <div className="space-y-4">
          <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div>
              <span className="font-medium text-gray-900 dark:text-white">High Contrast Mode</span>
              <p className="text-sm text-gray-600 dark:text-gray-400">Increase contrast for better visibility</p>
            </div>
            <input
              type="checkbox"
              role="switch"
              aria-checked={preferences.accessibility?.highContrast}
              checked={preferences.accessibility?.highContrast}
              onChange={(e) => updateAccessibility('highContrast', e.target.checked)}
              className="w-12 h-6 rounded-full bg-gray-300 dark:bg-gray-600 relative cursor-pointer transition-colors checked:bg-purple-600"
            />
          </label>

          <div>
            <label className="block font-medium text-gray-900 dark:text-white mb-2">
              Font Size
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { value: 'small', label: 'S' },
                { value: 'medium', label: 'M' },
                { value: 'large', label: 'L' },
                { value: 'extra-large', label: 'XL' }
              ].map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => updateFontSize(value)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    preferences.fontSize === value
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                  aria-pressed={preferences.fontSize === value}
                >
                  <span className={`font-bold ${
                    value === 'small' ? 'text-sm' :
                    value === 'large' ? 'text-lg' :
                    value === 'extra-large' ? 'text-xl' :
                    'text-base'
                  }`}>{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Motion Settings */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Motion Settings
        </h3>
        
        <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div>
            <span className="font-medium text-gray-900 dark:text-white">Reduce Motion</span>
            <p className="text-sm text-gray-600 dark:text-gray-400">Minimize animations and transitions</p>
          </div>
          <input
            type="checkbox"
            role="switch"
            aria-checked={preferences.accessibility?.reducedMotion}
            checked={preferences.accessibility?.reducedMotion}
            onChange={(e) => updateAccessibility('reducedMotion', e.target.checked)}
            className="w-12 h-6 rounded-full bg-gray-300 dark:bg-gray-600 relative cursor-pointer transition-colors checked:bg-purple-600"
          />
        </label>
      </div>

      {/* Screen Reader Settings */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Volume2 className="w-5 h-5" />
          Screen Reader Settings
        </h3>
        
        <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div>
            <span className="font-medium text-gray-900 dark:text-white">Screen Reader Mode</span>
            <p className="text-sm text-gray-600 dark:text-gray-400">Optimize for screen reader navigation</p>
          </div>
          <input
            type="checkbox"
            role="switch"
            aria-checked={preferences.accessibility?.screenReaderMode}
            checked={preferences.accessibility?.screenReaderMode}
            onChange={(e) => updateAccessibility('screenReaderMode', e.target.checked)}
            className="w-12 h-6 rounded-full bg-gray-300 dark:bg-gray-600 relative cursor-pointer transition-colors checked:bg-purple-600"
          />
        </label>
      </div>

      {/* Keyboard Shortcuts */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Keyboard Shortcuts
        </h3>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="font-medium text-gray-700 dark:text-gray-300">Navigate cards:</dt>
              <dd className="text-gray-600 dark:text-gray-400">
                <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">←</kbd> / 
                <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded ml-1">→</kbd>
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="font-medium text-gray-700 dark:text-gray-300">Flip card:</dt>
              <dd className="text-gray-600 dark:text-gray-400">
                <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">Space</kbd>
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="font-medium text-gray-700 dark:text-gray-300">Select answer:</dt>
              <dd className="text-gray-600 dark:text-gray-400">
                <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">1</kbd> - 
                <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded ml-1">4</kbd>
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="font-medium text-gray-700 dark:text-gray-300">True/False:</dt>
              <dd className="text-gray-600 dark:text-gray-400">
                <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">T</kbd> / 
                <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded ml-1">F</kbd>
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}