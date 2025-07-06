import { STORAGE_KEYS, APP_VERSION } from './constants';
import type { 
  UserPreferences, 
  StoredDecks, 
  StoredScores, 
  StoredProgress,
  Deck,
  GameSession,
  CardProgress
} from '@/types';

export class StorageManager {
  private readonly VERSION = APP_VERSION;

  // Save with error handling
  save<T>(key: string, data: T): void {
    try {
      const serialized = JSON.stringify(data);
      
      // Check size and warn if getting large
      if (serialized.length > 100000) { // 100KB
        console.warn(`Storage for ${key} is getting large: ${(serialized.length / 1024).toFixed(2)}KB`);
      }
      
      localStorage.setItem(key, serialized);
    } catch (error) {
      this.handleStorageError(error, key);
    }
  }

  // Load with error handling and validation
  load<T>(key: string): T | null {
    try {
      const data = localStorage.getItem(key);
      if (!data) return null;
      
      const parsed = JSON.parse(data);
      
      // Validate the data structure
      if (!this.validateData(key, parsed)) {
        console.error(`Invalid data structure for ${key}`);
        return null;
      }
      
      return parsed;
    } catch (error) {
      this.handleStorageError(error, key);
      return null;
    }
  }

  // Validate data structure
  private validateData(key: string, data: any): boolean {
    try {
      switch (key) {
        case STORAGE_KEYS.DECKS:
          return data && Array.isArray(data.decks);
        case STORAGE_KEYS.SCORES:
          return data && Array.isArray(data.sessions) && data.statistics;
        case STORAGE_KEYS.PREFERENCES:
          return data && data.theme && data.version;
        case STORAGE_KEYS.PROGRESS:
          return data && typeof data.cardProgress === 'object';
        default:
          return true;
      }
    } catch {
      return false;
    }
  }

  // Remove item
  remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing ${key}:`, error);
    }
  }

  // Get storage info
  getStorageInfo(): {
    totalSize: number;
    breakdown: Record<string, number>;
    percentUsed: number;
    remaining: number;
  } {
    let totalSize = 0;
    const breakdown: Record<string, number> = {};
    
    for (const key in localStorage) {
      const size = (localStorage.getItem(key)?.length || 0) * 2; // UTF-16 chars
      totalSize += size;
      breakdown[key] = size;
    }
    
    return {
      totalSize,
      breakdown,
      percentUsed: (totalSize / 10485760) * 100, // 10MB limit
      remaining: 10485760 - totalSize
    };
  }

  // Clean up old data
  cleanup(): void {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    // Clean old game sessions
    const scores = this.load<StoredScores>(STORAGE_KEYS.SCORES);
    if (scores) {
      scores.sessions = scores.sessions.filter(
        session => new Date(session.endTime || session.startTime) > oneMonthAgo
      );
      this.save(STORAGE_KEYS.SCORES, scores);
    }
    
    // Clean old progress data
    const progress = this.load<StoredProgress>(STORAGE_KEYS.PROGRESS);
    if (progress) {
      const cleanedProgress: Record<string, CardProgress> = {};
      
      Object.entries(progress.cardProgress).forEach(([id, cardProg]) => {
        if (new Date(cardProg.stats.lastSeen) > oneMonthAgo) {
          cleanedProgress[id] = cardProg;
        }
      });
      
      progress.cardProgress = cleanedProgress;
      this.save(STORAGE_KEYS.PROGRESS, progress);
    }
  }

  // Migration support
  migrate(): void {
    const storedVersion = localStorage.getItem(STORAGE_KEYS.VERSION);
    
    if (!storedVersion || storedVersion < this.VERSION) {
      console.log(`Migrating from version ${storedVersion || '0.0.0'} to ${this.VERSION}`);
      
      // Run migrations based on version
      if (!storedVersion) {
        this.migrateFromV0();
      }
      
      localStorage.setItem(STORAGE_KEYS.VERSION, this.VERSION);
    }
  }

  private migrateFromV0(): void {
    // Initial setup - set default preferences
    const defaultPreferences: UserPreferences = {
      version: this.VERSION,
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
    };
    
    this.save(STORAGE_KEYS.PREFERENCES, defaultPreferences);
  }

  private handleStorageError(error: unknown, key: string): void {
    if (error instanceof Error) {
      if (error.name === 'QuotaExceededError') {
        console.error(`Storage quota exceeded for ${key}. Running cleanup...`);
        this.cleanup();
      } else {
        console.error(`Storage error for ${key}:`, error);
      }
    }
  }
}

// Singleton instance
export const storageManager = new StorageManager();

// Specific storage functions
export const deckStorage = {
  save(decks: Deck[]): void {
    const stored: StoredDecks = {
      version: APP_VERSION,
      decks,
      lastUpdated: new Date().toISOString()
    };
    storageManager.save(STORAGE_KEYS.DECKS, stored);
  },
  
  load(): Deck[] {
    const stored = storageManager.load<StoredDecks>(STORAGE_KEYS.DECKS);
    return stored?.decks || [];
  },
  
  saveDeck(deck: Deck): void {
    const decks = this.load();
    const index = decks.findIndex(d => d.id === deck.id);
    
    if (index >= 0) {
      decks[index] = deck;
    } else {
      decks.push(deck);
    }
    
    this.save(decks);
  },
  
  deleteDeck(deckId: string): void {
    const decks = this.load();
    const filtered = decks.filter(d => d.id !== deckId);
    this.save(filtered);
  }
};

export const sessionStorage = {
  save(session: GameSession): void {
    const stored = storageManager.load<StoredScores>(STORAGE_KEYS.SCORES) || {
      version: APP_VERSION,
      sessions: [],
      statistics: {
        totalGamesPlayed: 0,
        totalTimeSpent: 0,
        averageAccuracy: 0,
        totalPoints: 0,
        achievements: [],
        dailyStreak: 0,
        lastPlayedDate: new Date().toISOString(),
        favoriteDecks: []
      },
      lastUpdated: new Date().toISOString()
    };
    
    stored.sessions.push(session);
    
    // Update statistics
    stored.statistics.totalGamesPlayed++;
    stored.statistics.totalTimeSpent += session.duration || 0;
    stored.statistics.totalPoints += session.score.points;
    
    // Recalculate average accuracy
    const totalAccuracy = stored.sessions.reduce((sum, s) => sum + s.score.accuracy, 0);
    stored.statistics.averageAccuracy = totalAccuracy / stored.sessions.length;
    
    // Update daily streak
    const today = new Date().toDateString();
    const lastPlayed = new Date(stored.statistics.lastPlayedDate).toDateString();
    
    if (today !== lastPlayed) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      if (yesterday.toDateString() === lastPlayed) {
        stored.statistics.dailyStreak++;
      } else {
        stored.statistics.dailyStreak = 1;
      }
    }
    
    stored.statistics.lastPlayedDate = new Date().toISOString();
    stored.lastUpdated = new Date().toISOString();
    
    storageManager.save(STORAGE_KEYS.SCORES, stored);
  },
  
  loadSessions(deckId?: string): GameSession[] {
    const stored = storageManager.load<StoredScores>(STORAGE_KEYS.SCORES);
    if (!stored) return [];
    
    if (deckId) {
      return stored.sessions.filter(s => s.deckId === deckId);
    }
    
    return stored.sessions;
  },
  
  getStatistics() {
    const stored = storageManager.load<StoredScores>(STORAGE_KEYS.SCORES);
    return stored?.statistics || null;
  }
};