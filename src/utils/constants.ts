export const APP_VERSION = '1.0.0';

export const STORAGE_KEYS = {
  PREFERENCES: 'flashplay_preferences',
  DECKS: 'flashplay_decks',
  SCORES: 'flashplay_scores',
  PROGRESS: 'flashplay_progress',
  ACHIEVEMENTS: 'flashplay_achievements',
  CACHE: 'flashplay_cache',
  VERSION: 'flashplay_version'
} as const;

// Achievement definitions moved to src/utils/achievements.ts

export const COLOR_SCHEMES = {
  rainbow: {
    primary: 'from-purple-500 to-pink-500',
    secondary: 'from-yellow-400 to-orange-500',
    accent: 'from-green-400 to-blue-500'
  },
  ocean: {
    primary: 'from-blue-500 to-cyan-500',
    secondary: 'from-teal-400 to-blue-600',
    accent: 'from-indigo-400 to-purple-500'
  },
  space: {
    primary: 'from-purple-900 to-indigo-900',
    secondary: 'from-pink-600 to-purple-600',
    accent: 'from-blue-600 to-purple-600'
  },
  forest: {
    primary: 'from-green-600 to-emerald-600',
    secondary: 'from-lime-500 to-green-600',
    accent: 'from-yellow-500 to-green-500'
  }
} as const;

export const QUIZ_TIME_LIMITS = {
  easy: 60,
  medium: 45,
  hard: 30
} as const;

export const POINTS = {
  CORRECT_FIRST_TRY: 100,
  CORRECT_WITH_HINT: 50,
  CORRECT_SECOND_TRY: 25,
  SPEED_BONUS_PER_SECOND: 10,
  STREAK_MULTIPLIERS: {
    3: 1.5,
    5: 2,
    10: 3,
    PERFECT: 5
  }
} as const;