import { useEffect } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { STORAGE_KEYS } from '@/utils/constants';
import type { UserPreferences } from '@/types';

export function useAccessibility() {
  const [preferences] = useLocalStorage<UserPreferences>(
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

  // Apply accessibility preferences
  useEffect(() => {
    const root = document.documentElement;
    
    // High contrast mode
    if (preferences.accessibility?.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
    
    // Reduced motion
    if (preferences.accessibility?.reducedMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }
    
    // Font size
    const fontSizeMap = {
      small: '14px',
      medium: '16px',
      large: '18px',
      'extra-large': '20px'
    };
    root.style.fontSize = fontSizeMap[preferences.fontSize || 'medium'];
    
    // Screen reader mode
    if (preferences.accessibility?.screenReaderMode) {
      root.setAttribute('data-screen-reader', 'true');
    } else {
      root.removeAttribute('data-screen-reader');
    }
  }, [preferences]);
  
  return preferences;
}

// Announce messages to screen readers
export function announce(message: string, priority: 'polite' | 'assertive' = 'polite') {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.classList.add('sr-only');
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

// Focus trap for modals and dialogs
export function useFocusTrap(isActive: boolean) {
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusableElements = document.querySelectorAll(
        'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select, [tabindex]:not([tabindex="-1"])'
      );
      
      const focusable = Array.from(focusableElements).filter(
        el => !el.hasAttribute('disabled') && el.offsetParent !== null
      );

      if (focusable.length === 0) return;

      const firstFocusable = focusable[0] as HTMLElement;
      const lastFocusable = focusable[focusable.length - 1] as HTMLElement;

      if (e.shiftKey && document.activeElement === firstFocusable) {
        e.preventDefault();
        lastFocusable.focus();
      } else if (!e.shiftKey && document.activeElement === lastFocusable) {
        e.preventDefault();
        firstFocusable.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isActive]);
}