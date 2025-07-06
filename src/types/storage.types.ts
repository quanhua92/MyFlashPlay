export interface UserPreferences {
  version: string;
  theme: 'light' | 'dark' | 'auto';
  colorScheme: 'rainbow' | 'ocean' | 'space' | 'forest';
  soundEnabled: boolean;
  animationsEnabled: boolean;
  fontSize: 'small' | 'medium' | 'large';
  language: string;
  accessibility: {
    highContrast: boolean;
    reducedMotion: boolean;
    screenReaderMode: boolean;
  };
  gameSettings: {
    defaultDifficulty: 'easy' | 'medium' | 'hard';
    showHints: boolean;
    autoAdvance: boolean;
    timerWarning: boolean;
  };
  lastUpdated: string;
}

export interface StoredDecks {
  version: string;
  decks: import('./flashcard.types').Deck[];
  lastUpdated: string;
}

export interface StoredScores {
  version: string;
  sessions: import('./game.types').GameSession[];
  statistics: GlobalStats;
  lastUpdated: string;
}

export interface GlobalStats {
  totalGamesPlayed: number;
  totalTimeSpent: number;
  averageAccuracy: number;
  totalPoints: number;
  achievements: string[];
  dailyStreak: number;
  lastPlayedDate: string;
  favoriteDecks: DeckStats[];
}

export interface DeckStats {
  deckId: string;
  timesPlayed: number;
  bestScore: number;
  averageScore: number;
  mastery: number;
}

export interface CardProgress {
  cardId: string;
  deckId: string;
  stats: {
    views: number;
    correctCount: number;
    incorrectCount: number;
    lastSeen: string;
    averageResponseTime: number;
    confidence: number;
  };
  spacedRepetition: {
    interval: number;
    easeFactor: number;
    nextReview: string;
    stage: 'learning' | 'reviewing' | 'mastered';
  };
}

export interface StoredProgress {
  version: string;
  cardProgress: Record<string, CardProgress>;
  lastUpdated: string;
}