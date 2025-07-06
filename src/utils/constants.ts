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

export const ACHIEVEMENTS = [
  {
    id: 'first-deck',
    name: 'Deck Master',
    description: 'Complete your first deck',
    icon: '🎯',
    requirement: { type: 'games-played', value: 1 },
    points: 100
  },
  {
    id: 'speed-demon',
    name: 'Speed Demon',
    description: 'Complete a deck in under 2 minutes',
    icon: '⚡',
    requirement: { type: 'speed', value: 120 },
    points: 200
  },
  {
    id: 'perfect-score',
    name: 'Perfectionist',
    description: 'Get 100% on any quiz',
    icon: '🌟',
    requirement: { type: 'perfect-score', value: 100 },
    points: 300
  },
  {
    id: 'streak-master',
    name: 'Streak Master',
    description: 'Get 20 correct answers in a row',
    icon: '🔥',
    requirement: { type: 'streak', value: 20 },
    points: 500
  },
  {
    id: 'dedicated-learner',
    name: 'Dedicated Learner',
    description: 'Play for 7 days in a row',
    icon: '📚',
    requirement: { type: 'streak', value: 7 },
    points: 400
  }
] as const;

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