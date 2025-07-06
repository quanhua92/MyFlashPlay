import { render, RenderOptions } from '@testing-library/react';
import { ReactElement, ReactNode } from 'react';
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
      <RouterProvider router={testRouter}>
        {children}
      </RouterProvider>
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
      type: 'basic' as const,
      difficulty: 'easy' as const,
      category: 'math'
    },
    {
      id: 'card-2',
      front: 'What is the capital of France?',
      back: 'Paris',
      type: 'basic' as const,
      difficulty: 'easy' as const,
      category: 'geography'
    }
  ],
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
  mode: 'quiz' as const,
  startTime: '2024-01-01T00:00:00Z',
  endTime: '2024-01-01T00:05:00Z',
  duration: 300,
  score: {
    points: 200,
    correct: 2,
    incorrect: 0,
    accuracy: 100,
    bestStreak: 2,
    totalQuestions: 2
  },
  cards: [
    {
      cardId: 'card-1',
      attempts: 1,
      correct: true,
      timeSpent: 10,
      hintsUsed: 0
    },
    {
      cardId: 'card-2',
      attempts: 1,
      correct: true,
      timeSpent: 8,
      hintsUsed: 0
    }
  ]
};