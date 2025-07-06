# MyFlashPlay Game Mechanics

## Game Modes

### 1. Study Mode
- **Purpose**: Learn at your own pace
- **Features**:
  - Flip cards by clicking/tapping
  - Navigate with arrows or swipe gestures
  - Mark cards as "known" or "needs practice"
  - No time pressure
  - Optional hints available
  - Progress saved automatically

### 2. Quiz Mode
- **Purpose**: Test knowledge with various question types
- **Features**:
  - Multiple choice questions (4 options)
  - True/False questions
  - Fill-in-the-blank (for advanced users)
  - Immediate feedback on answers
  - Explanations shown after answering
  - Score tracking

### 3. Speed Challenge
- **Purpose**: Fast-paced learning with time pressure
- **Features**:
  - 30/60/90 second rounds
  - Quick card flips
  - Bonus points for speed
  - Combo multipliers for consecutive correct answers
  - Leaderboard for each deck

### 4. Memory Match
- **Purpose**: Match questions with answers
- **Features**:
  - Grid layout of face-down cards
  - Find matching pairs
  - Timer and move counter
  - Difficulty levels (4x4, 6x6, 8x8 grids)

## Scoring System

### Base Points
- Correct answer (first try): 100 points
- Correct answer (with hint): 50 points
- Correct answer (second try): 25 points
- Speed bonus: +10 points per second remaining

### Multipliers
- 3 correct in a row: 1.5x multiplier
- 5 correct in a row: 2x multiplier
- 10 correct in a row: 3x multiplier
- Perfect round: 5x multiplier

### Achievements & Badges
```typescript
interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement: AchievementRequirement;
  points: number;
}

const achievements = [
  {
    id: 'first-deck',
    name: 'Deck Master',
    description: 'Complete your first deck',
    icon: '🎯',
    points: 100
  },
  {
    id: 'speed-demon',
    name: 'Speed Demon',
    description: 'Complete a deck in under 2 minutes',
    icon: '⚡',
    points: 200
  },
  {
    id: 'perfect-score',
    name: 'Perfectionist',
    description: 'Get 100% on any quiz',
    icon: '🌟',
    points: 300
  },
  {
    id: 'streak-master',
    name: 'Streak Master',
    description: 'Get 20 correct answers in a row',
    icon: '🔥',
    points: 500
  }
];
```

## Quiz Generation Algorithm

### Multiple Choice Generation
```typescript
class QuizGenerator {
  generateMultipleChoice(card: Flashcard, allCards: Flashcard[]): QuizQuestion {
    // 1. Use the card's back as the correct answer
    const correctAnswer = card.back;
    
    // 2. Generate distractors (wrong answers)
    const distractors = this.generateDistractors(card, allCards);
    
    // 3. Shuffle options
    const options = this.shuffle([correctAnswer, ...distractors]);
    
    // 4. Return formatted question
    return {
      id: card.id,
      type: 'multiple-choice',
      question: card.front,
      options,
      correctAnswer,
      explanation: card.explanation
    };
  }
  
  private generateDistractors(card: Flashcard, allCards: Flashcard[]): string[] {
    // Smart distractor generation:
    // - Similar category cards
    // - Common misconceptions
    // - Random cards if needed
    // - Ensure uniqueness
  }
}
```

### Difficulty Adaptation
```typescript
class DifficultyManager {
  private userPerformance: Map<string, Performance>;
  
  adjustDifficulty(deckId: string): DifficultyLevel {
    const performance = this.userPerformance.get(deckId);
    
    if (performance.accuracy > 0.9) {
      return 'hard';
    } else if (performance.accuracy > 0.7) {
      return 'medium';
    } else {
      return 'easy';
    }
  }
  
  getDifficultyModifiers(level: DifficultyLevel) {
    switch(level) {
      case 'easy':
        return {
          timeLimit: 60,
          hintsAllowed: 3,
          optionCount: 3
        };
      case 'medium':
        return {
          timeLimit: 45,
          hintsAllowed: 1,
          optionCount: 4
        };
      case 'hard':
        return {
          timeLimit: 30,
          hintsAllowed: 0,
          optionCount: 5
        };
    }
  }
}
```

## Animation System

### Card Animations
```css
/* Flip Animation */
.card-flip {
  transform-style: preserve-3d;
  transition: transform 0.6s cubic-bezier(0.4, 0.0, 0.2, 1);
}

.card-flip.flipped {
  transform: rotateY(180deg);
}

/* Swipe Animations */
.card-swipe-left {
  animation: swipeLeft 0.5s ease-out;
}

.card-swipe-right {
  animation: swipeRight 0.5s ease-out;
}

/* Success Animation */
.success-bounce {
  animation: bounce 0.5s ease-out;
}

@keyframes bounce {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.2); }
}
```

### Feedback Animations
- ✅ Correct: Green flash + checkmark + confetti
- ❌ Incorrect: Red shake + X mark
- 🎉 Perfect Score: Full-screen confetti + achievement popup
- 🔥 Streak: Fire animation around score

## Progress Tracking

### Spaced Repetition Algorithm
```typescript
interface CardProgress {
  cardId: string;
  lastSeen: Date;
  correctCount: number;
  incorrectCount: number;
  difficulty: number; // 1-5
  nextReview: Date;
}

class SpacedRepetition {
  calculateNextReview(progress: CardProgress): Date {
    const daysBetween = this.calculateInterval(progress);
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + daysBetween);
    return nextDate;
  }
  
  private calculateInterval(progress: CardProgress): number {
    // Based on SM-2 algorithm
    const { correctCount, difficulty } = progress;
    
    if (correctCount === 0) return 0; // Review immediately
    if (correctCount === 1) return 1; // Review tomorrow
    if (correctCount === 2) return 3; // Review in 3 days
    
    // Exponential growth based on performance
    return Math.ceil(
      Math.pow(2.5, correctCount - 1) * (difficulty / 3)
    );
  }
}
```

### Learning Analytics
```typescript
interface LearningStats {
  totalCardsStudied: number;
  totalTimeSpent: number; // minutes
  averageAccuracy: number;
  bestStreak: number;
  favoriteDecks: string[];
  weakAreas: CategoryStats[];
  strongAreas: CategoryStats[];
  dailyGoalProgress: number;
}

interface CategoryStats {
  category: string;
  accuracy: number;
  cardsStudied: number;
  averageTime: number;
}
```

## User Experience Features

### Kid-Friendly Elements
1. **Colorful Themes**:
   - Rainbow theme
   - Ocean theme
   - Space theme
   - Forest theme

2. **Sound Effects** (Optional):
   - Card flip sound
   - Correct answer chime
   - Incorrect answer buzz
   - Achievement unlock fanfare

3. **Visual Rewards**:
   - Animated stickers
   - Growing progress tree
   - Collection badges
   - Streak flames

4. **Motivational Messages**:
   - "Great job!" 
   - "You're on fire! 🔥"
   - "Keep it up!"
   - "Almost there!"

### Accessibility Features
1. **Keyboard Navigation**:
   - Arrow keys for card navigation
   - Space to flip
   - Enter to submit
   - Escape to pause

2. **Screen Reader Support**:
   - ARIA labels
   - Announcements for state changes
   - Descriptive button text

3. **Visual Adjustments**:
   - High contrast mode
   - Large text option
   - Reduced motion mode
   - Dyslexia-friendly fonts

## Game Flow State Machine
```typescript
type GameState = 
  | 'menu'
  | 'deck-selection'
  | 'mode-selection'
  | 'playing'
  | 'paused'
  | 'round-complete'
  | 'game-over';

class GameStateMachine {
  transition(from: GameState, event: GameEvent): GameState {
    // Define valid state transitions
  }
}