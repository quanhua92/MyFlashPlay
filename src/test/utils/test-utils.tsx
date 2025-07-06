import { render, type RenderOptions } from '@testing-library/react';
import { type ReactElement, type ReactNode } from 'react';
import { createMemoryHistory } from '@tanstack/react-router';
import { Router, RouterProvider, createRouter } from '@tanstack/react-router';
import { routeTree } from '../../routeTree.gen';

// Custom render function with router context
function createTestRouter() {
  const history = createMemoryHistory({ initialEntries: ['/'] });
  
  return createRouter({
    routeTree,
    history,
    context: {
      // Add any required context here
    }
  });
}

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  router?: Router<any, any>;
  initialEntries?: string[];
}

function customRender(
  ui: ReactElement,
  options: CustomRenderOptions = {}
) {
  const { router, ...renderOptions } = options;
  
  const testRouter = router || createTestRouter();
  
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <RouterProvider router={testRouter} />
    );
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

// Re-export everything from testing-library
export * from '@testing-library/react';
export { customRender as render };

// Mock deck data for testing
export const mockDeck = {
  id: 'test-deck',
  name: 'Test Deck',
  description: 'A test deck for unit tests',
  emoji: '🧪',
  cards: [
    {
      id: 'card-1',
      front: 'What is 2+2?',
      back: '4',
      type: 'simple' as const,
      difficulty: 'easy' as const,
      category: 'math',
      metadata: {
        difficulty: 'easy' as const,
        tags: [],
        created: '2024-01-01T00:00:00Z',
        lastReviewed: null,
        reviewCount: 0
      }
    },
    {
      id: 'card-2',
      front: 'What is the capital of France?',
      back: 'Paris',
      type: 'simple' as const,
      difficulty: 'easy' as const,
      category: 'geography',
      metadata: {
        difficulty: 'easy' as const,
        tags: [],
        created: '2024-01-01T00:00:00Z',
        lastReviewed: null,
        reviewCount: 0
      }
    }
  ],
  settings: {
    shuffleCards: false,
    showHints: true,
    autoAdvance: false,
    timeLimit: 0
  },
  metadata: {
    estimatedTime: 5,
    difficulty: 'easy' as const,
    lastModified: '2024-01-01T00:00:00Z',
    created: '2024-01-01T00:00:00Z',
    version: '1.0.0'
  }
};

// Mock game session data
export const mockGameSession = {
  id: 'test-session',
  deckId: 'test-deck',
  deckName: 'Test Deck',
  mode: 'quiz' as const,
  startTime: '2024-01-01T00:00:00Z',
  endTime: '2024-01-01T00:05:00Z',
  duration: 300,
  score: {
    points: 200,
    accuracy: 100,
    correctAnswers: 2,
    totalQuestions: 2,
    streak: 2,
    bestStreak: 2
  },
  details: {
    cardResults: [
      {
        cardId: 'card-1',
        attempts: 1,
        wasCorrect: true,
        timeSpent: 10,
        hintUsed: false
      },
      {
        cardId: 'card-2',
        attempts: 1,
        wasCorrect: true,
        timeSpent: 8,
        hintUsed: false
      }
    ],
    bonuses: [],
    difficulty: 'easy' as const,
    hintsUsed: 0
  }
};