export type GameMode = 'study' | 'quiz' | 'speed' | 'memory' | 'falling';
export type GameState = 'menu' | 'deck-selection' | 'mode-selection' | 'playing' | 'paused' | 'round-complete' | 'game-over';

export interface GameSession {
  id: string;
  deckId: string;
  deckName: string;
  mode: GameMode;
  startTime: string;
  endTime?: string;
  duration?: number;
  score: {
    points: number;
    accuracy: number;
    correctAnswers: number;
    totalQuestions: number;
    streak: number;
    bestStreak: number;
  };
  details: {
    cardResults: CardResult[];
    bonuses: Bonus[];
    difficulty: string;
    hintsUsed: number;
  };
}

export interface CardResult {
  cardId: string;
  wasCorrect: boolean;
  timeSpent: number;
  attempts: number;
  hintUsed: boolean;
}

export interface Bonus {
  type: 'speed' | 'streak' | 'perfect' | 'no-hints';
  points: number;
  description: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement: {
    type: 'games-played' | 'perfect-score' | 'streak' | 'speed' | 'total-points';
    value: number;
    deckId?: string;
  };
  points: number;
  unlockedAt?: string;
}