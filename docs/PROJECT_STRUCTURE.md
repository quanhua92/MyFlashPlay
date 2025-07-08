# MyFlashPlay Project Structure

## Directory Layout

```
flashplay/
├── src/
│   ├── components/
│   │   ├── ui/                 # ShadCN UI components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── sheet.tsx
│   │   │   ├── toast.tsx
│   │   │   ├── progress.tsx
│   │   │   └── ...
│   │   ├── layout/
│   │   │   ├── RootLayout.tsx
│   │   │   ├── Navigation.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── ThemeProvider.tsx
│   │   ├── flashcard/
│   │   │   ├── FlashCard.tsx
│   │   │   ├── FlashCardDeck.tsx
│   │   │   ├── FlashCardViewer.tsx
│   │   │   ├── CardFlipAnimation.tsx
│   │   │   └── CardNavigation.tsx
│   │   ├── game/
│   │   │   ├── QuizMode.tsx
│   │   │   ├── MultipleChoice.tsx
│   │   │   ├── TrueFalse.tsx
│   │   │   ├── ScoreDisplay.tsx
│   │   │   ├── Timer.tsx
│   │   │   ├── ProgressTracker.tsx
│   │   │   └── GameControls.tsx
│   │   └── common/
│   │       ├── ThemeToggle.tsx
│   │       ├── ConfettiEffect.tsx
│   │       ├── LoadingSpinner.tsx
│   │       ├── ErrorBoundary.tsx
│   │       └── AnimatedBackground.tsx
│   ├── pages/
│   │   ├── HomePage.tsx
│   │   ├── PlayPage.tsx
│   │   ├── CreatePage.tsx
│   │   ├── DecksPage.tsx
│   │   ├── ScoresPage.tsx
│   │   └── NotFoundPage.tsx
│   ├── hooks/
│   │   ├── useLocalStorage.ts
│   │   ├── useFlashcards.ts
│   │   ├── useGameState.ts
│   │   ├── useTheme.ts
│   │   ├── useAnimation.ts
│   │   └── useMediaQuery.ts
│   ├── utils/
│   │   ├── markdown-parser.ts
│   │   ├── quiz-generator.ts
│   │   ├── storage.ts
│   │   ├── animations.ts
│   │   ├── helpers.ts
│   │   └── constants.ts
│   ├── types/
│   │   ├── flashcard.types.ts
│   │   ├── game.types.ts
│   │   ├── quiz.types.ts
│   │   └── storage.types.ts
│   ├── styles/
│   │   ├── globals.css
│   │   ├── animations.css
│   │   └── themes.css
│   ├── lib/
│   │   └── utils.ts         # ShadCN utilities
│   ├── App.tsx
│   ├── main.tsx
│   └── vite-env.d.ts
├── public/
│   ├── icons/
│   ├── sounds/              # Optional game sounds
│   └── manifest.json        # PWA manifest
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── .env.example
├── .eslintrc.json
├── .prettierrc
├── index.html
├── package.json
├── tailwind.config.ts
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## Key Component Descriptions

### Layout Components
- **RootLayout**: Main wrapper with providers (Theme, Router, Toast)
- **Navigation**: Kid-friendly nav bar with colorful icons
- **ThemeProvider**: Manages light/dark theme state

### Flashcard Components
- **FlashCard**: Individual card with flip animation
- **FlashCardDeck**: Manages collection of cards
- **FlashCardViewer**: Interactive viewer with swipe support

### Game Components
- **QuizMode**: Main quiz interface
- **MultipleChoice**: 4-option quiz component
- **TrueFalse**: Binary choice quiz
- **ScoreDisplay**: Animated score tracker
- **Timer**: Countdown timer for timed modes

### Utility Modules
- **markdown-parser**: Converts Markdown to flashcard data
- **quiz-generator**: Creates quiz questions from flashcards
- **storage**: LocalStorage wrapper with type safety
- **animations**: Framer Motion animation presets

## Type Definitions

### Core Types
```typescript
interface Flashcard {
  id: string;
  front: string;
  back: string;
  category?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  tags?: string[];
}

interface Deck {
  id: string;
  name: string;
  description: string;
  cards: Flashcard[];
  createdAt: Date;
  lastPlayed?: Date;
}

interface GameSession {
  deckId: string;
  mode: 'study' | 'quiz' | 'timed';
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  startTime: Date;
  endTime?: Date;
}

interface QuizQuestion {
  id: string;
  type: 'multiple-choice' | 'true-false';
  question: string;
  options?: string[];
  correctAnswer: string | boolean;
  explanation?: string;
}
```

## Routing Structure

```typescript
// Router configuration
const routeTree = {
  '/': HomePage,
  '/play/:deckId?': PlayPage,
  '/create': CreatePage,
  '/decks': DecksPage,
  '/scores': ScoresPage,
  '*': NotFoundPage
};
```

## State Management Pattern

Using React Context + Custom Hooks:
- **GameContext**: Current game state
- **DeckContext**: Available decks
- **ThemeContext**: Theme preferences
- **UserContext**: User settings and progress