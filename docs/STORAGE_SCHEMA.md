# MyFlashPlay LocalStorage Schema

## Overview
MyFlashPlay uses localStorage to persist user data including flashcard decks, scores, preferences, and progress. All data is stored as JSON strings with versioning for migration support.

## Storage Keys and Structure

### 1. User Preferences
**Key**: `flashplay_preferences`
```typescript
interface UserPreferences {
  version: string; // "1.0.0"
  theme: 'light' | 'dark' | 'auto';
  colorScheme: 'rainbow' | 'ocean' | 'space' | 'forest';
  soundEnabled: boolean;
  animationsEnabled: boolean;
  fontSize: 'small' | 'medium' | 'large';
  language: string; // "en-US"
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
  lastUpdated: string; // ISO date
}
```

### 2. Flashcard Decks
**Key**: `flashplay_decks`
```typescript
interface StoredDecks {
  version: string; // "1.0.0"
  decks: Deck[];
  lastUpdated: string;
}

interface Deck {
  id: string; // UUID
  name: string;
  description: string;
  emoji: string; // Deck icon
  cards: Flashcard[];
  metadata: {
    createdAt: string; // ISO date
    lastModified: string;
    lastPlayed?: string;
    playCount: number;
    source: 'imported' | 'created' | 'template';
    originalMarkdown?: string; // Store original for re-parsing
    tags: string[];
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    estimatedTime: number; // minutes
  };
  settings: {
    shuffleCards: boolean;
    repeatIncorrect: boolean;
    studyMode: 'sequential' | 'random' | 'spaced';
  };
}

interface Flashcard {
  id: string; // UUID
  front: string;
  back: string;
  type: 'simple' | 'multiple-choice' | 'true-false';
  category?: string;
  subcategory?: string;
  media?: {
    type: 'image' | 'audio';
    url: string; // Data URL for localStorage
  };
  metadata: {
    difficulty: 'easy' | 'medium' | 'hard';
    tags: string[];
    hint?: string;
    explanation?: string;
    relatedCards?: string[]; // IDs of related cards
  };
  options?: QuizOption[]; // For multiple choice
}

interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
}
```

### 3. Game Sessions and Scores
**Key**: `flashplay_scores`
```typescript
interface StoredScores {
  version: string; // "1.0.0"
  sessions: GameSession[];
  statistics: GlobalStats;
  lastUpdated: string;
}

interface GameSession {
  id: string; // UUID
  deckId: string;
  deckName: string; // Denormalized for display
  mode: 'study' | 'quiz' | 'speed' | 'memory';
  startTime: string; // ISO date
  endTime: string;
  duration: number; // seconds
  score: {
    points: number;
    accuracy: number; // percentage
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

interface CardResult {
  cardId: string;
  wasCorrect: boolean;
  timeSpent: number; // seconds
  attempts: number;
  hintUsed: boolean;
}

interface Bonus {
  type: 'speed' | 'streak' | 'perfect' | 'no-hints';
  points: number;
  description: string;
}

interface GlobalStats {
  totalGamesPlayed: number;
  totalTimeSpent: number; // seconds
  averageAccuracy: number;
  totalPoints: number;
  achievements: string[]; // Achievement IDs
  dailyStreak: number;
  lastPlayedDate: string;
  favoriteDecks: DeckStats[];
}

interface DeckStats {
  deckId: string;
  timesPlayed: number;
  bestScore: number;
  averageScore: number;
  mastery: number; // 0-100%
}
```

### 4. Card Progress (Spaced Repetition)
**Key**: `flashplay_progress`
```typescript
interface StoredProgress {
  version: string; // "1.0.0"
  cardProgress: Map<string, CardProgress>; // cardId -> progress
  lastUpdated: string;
}

interface CardProgress {
  cardId: string;
  deckId: string;
  stats: {
    views: number;
    correctCount: number;
    incorrectCount: number;
    lastSeen: string; // ISO date
    averageResponseTime: number; // seconds
    confidence: number; // 0-100
  };
  spacedRepetition: {
    interval: number; // days until next review
    easeFactor: number; // 1.3 - 2.5
    nextReview: string; // ISO date
    stage: 'learning' | 'reviewing' | 'mastered';
  };
}
```

### 5. Achievements
**Key**: `flashplay_achievements`
```typescript
interface StoredAchievements {
  version: string; // "1.0.0"
  earned: EarnedAchievement[];
  progress: AchievementProgress[];
  lastUpdated: string;
}

interface EarnedAchievement {
  achievementId: string;
  earnedAt: string; // ISO date
  points: number;
  deckId?: string; // If deck-specific
}

interface AchievementProgress {
  achievementId: string;
  currentValue: number;
  targetValue: number;
  startedAt: string;
}
```

### 6. App State Cache
**Key**: `flashplay_cache`
```typescript
interface AppCache {
  version: string;
  lastRoute: string;
  lastDeckId?: string;
  tempDraft?: {
    markdown: string;
    savedAt: string;
  };
  recentDecks: string[]; // Last 5 deck IDs
  uiState: {
    sidebarCollapsed: boolean;
    sortOrder: 'name' | 'created' | 'played';
    filterTags: string[];
  };
}
```

## Storage Utilities

### Storage Manager Class
```typescript
class StorageManager {
  private readonly VERSION = '1.0.0';
  private readonly KEYS = {
    PREFERENCES: 'flashplay_preferences',
    DECKS: 'flashplay_decks',
    SCORES: 'flashplay_scores',
    PROGRESS: 'flashplay_progress',
    ACHIEVEMENTS: 'flashplay_achievements',
    CACHE: 'flashplay_cache'
  };

  // Save with compression for large data
  save<T>(key: string, data: T): void {
    try {
      const serialized = JSON.stringify(data);
      
      // Check size and compress if needed
      if (serialized.length > 100000) { // 100KB
        const compressed = this.compress(serialized);
        localStorage.setItem(key, compressed);
        localStorage.setItem(`${key}_compressed`, 'true');
      } else {
        localStorage.setItem(key, serialized);
        localStorage.removeItem(`${key}_compressed`);
      }
    } catch (error) {
      this.handleStorageError(error);
    }
  }

  // Load with decompression
  load<T>(key: string): T | null {
    try {
      const isCompressed = localStorage.getItem(`${key}_compressed`);
      const data = localStorage.getItem(key);
      
      if (!data) return null;
      
      const decompressed = isCompressed === 'true' 
        ? this.decompress(data) 
        : data;
        
      return JSON.parse(decompressed);
    } catch (error) {
      this.handleStorageError(error);
      return null;
    }
  }

  // Storage size management
  getStorageInfo(): StorageInfo {
    let totalSize = 0;
    const breakdown: Record<string, number> = {};
    
    for (const key in localStorage) {
      const size = localStorage.getItem(key)?.length || 0;
      totalSize += size;
      breakdown[key] = size;
    }
    
    return {
      totalSize,
      breakdown,
      percentUsed: (totalSize / 5242880) * 100, // 5MB limit
      remaining: 5242880 - totalSize
    };
  }

  // Clean up old data
  cleanup(): void {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    // Remove old sessions
    const scores = this.load<StoredScores>(this.KEYS.SCORES);
    if (scores) {
      scores.sessions = scores.sessions.filter(
        session => new Date(session.endTime) > oneMonthAgo
      );
      this.save(this.KEYS.SCORES, scores);
    }
  }

  // Migration support
  migrate(): void {
    const currentVersion = this.VERSION;
    const storedVersion = localStorage.getItem('flashplay_version');
    
    if (!storedVersion || storedVersion < currentVersion) {
      // Run migrations
      this.runMigrations(storedVersion, currentVersion);
      localStorage.setItem('flashplay_version', currentVersion);
    }
  }
}
```

### Data Export/Import
```typescript
class DataExporter {
  exportAllData(): string {
    const data = {
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      preferences: storageManager.load(KEYS.PREFERENCES),
      decks: storageManager.load(KEYS.DECKS),
      scores: storageManager.load(KEYS.SCORES),
      progress: storageManager.load(KEYS.PROGRESS),
      achievements: storageManager.load(KEYS.ACHIEVEMENTS)
    };
    
    return JSON.stringify(data, null, 2);
  }
  
  importData(jsonString: string): ImportResult {
    try {
      const data = JSON.parse(jsonString);
      
      // Validate version compatibility
      if (!this.isVersionCompatible(data.version)) {
        throw new Error('Incompatible version');
      }
      
      // Import each section
      if (data.preferences) {
        storageManager.save(KEYS.PREFERENCES, data.preferences);
      }
      // ... continue for other sections
      
      return { success: true, itemsImported: 5 };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}
```

## Storage Limits and Optimization

### Size Limits
- localStorage limit: ~5-10MB (browser dependent)
- Implement warning at 80% usage
- Auto-cleanup at 90% usage

### Optimization Strategies
1. **Compression**: Use LZ-string for large datasets
2. **Pagination**: Load scores/progress in chunks
3. **Archiving**: Move old data to IndexedDB
4. **Cleanup**: Remove data older than 6 months

### Data Integrity
1. **Versioning**: Track schema versions
2. **Validation**: Validate data on load
3. **Backup**: Periodic export reminders
4. **Recovery**: Fallback to defaults on corruption