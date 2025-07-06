import { v4 as uuidv4 } from 'uuid';
import type { Deck } from '@/types';

export const sampleDecks: Deck[] = [
  {
    id: 'math-basics',
    name: 'Elementary Math Fun',
    description: 'Learn basic math with fun questions!',
    emoji: '🔢',
    cards: [
      {
        id: uuidv4(),
        type: 'simple',
        front: 'What is 2 + 2?',
        back: '4',
        category: 'Addition',
        metadata: {
          difficulty: 'easy',
          tags: ['math', 'addition', 'basic'],
          hint: 'Count on your fingers!'
        }
      },
      {
        id: uuidv4(),
        type: 'simple',
        front: 'What is 5 × 3?',
        back: '15',
        category: 'Multiplication',
        metadata: {
          difficulty: 'medium',
          tags: ['math', 'multiplication'],
          hint: 'Add 5 three times'
        }
      },
      {
        id: uuidv4(),
        type: 'multiple-choice',
        front: 'Which number is bigger?',
        back: '10',
        category: 'Comparison',
        options: [
          { id: uuidv4(), text: '5', isCorrect: false },
          { id: uuidv4(), text: '10', isCorrect: true },
          { id: uuidv4(), text: '3', isCorrect: false },
          { id: uuidv4(), text: '7', isCorrect: false }
        ],
        metadata: {
          difficulty: 'easy',
          tags: ['math', 'comparison']
        }
      },
      {
        id: uuidv4(),
        type: 'true-false',
        front: '3 + 4 equals 7',
        back: 'true',
        category: 'Addition',
        metadata: {
          difficulty: 'easy',
          tags: ['math', 'addition', 'true-false']
        }
      }
    ],
    metadata: {
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      playCount: 0,
      source: 'template',
      tags: ['math', 'elementary', 'basic'],
      difficulty: 'beginner',
      estimatedTime: 5
    },
    settings: {
      shuffleCards: true,
      repeatIncorrect: true,
      studyMode: 'random'
    }
  },
  {
    id: 'science-animals',
    name: 'Amazing Animals',
    description: 'Discover fun facts about animals!',
    emoji: '🦁',
    cards: [
      {
        id: uuidv4(),
        type: 'simple',
        front: 'What is the largest mammal?',
        back: 'The blue whale',
        category: 'Ocean Animals',
        metadata: {
          difficulty: 'medium',
          tags: ['science', 'animals', 'ocean'],
          hint: 'It lives in the ocean',
          explanation: 'Blue whales can grow up to 100 feet long!'
        }
      },
      {
        id: uuidv4(),
        type: 'simple',
        front: 'How many legs does a spider have?',
        back: 'Eight legs',
        category: 'Insects & Arachnids',
        metadata: {
          difficulty: 'easy',
          tags: ['science', 'animals', 'spiders']
        }
      },
      {
        id: uuidv4(),
        type: 'multiple-choice',
        front: 'What do pandas eat?',
        back: 'Bamboo',
        category: 'Mammals',
        options: [
          { id: uuidv4(), text: 'Fish', isCorrect: false },
          { id: uuidv4(), text: 'Bamboo', isCorrect: true },
          { id: uuidv4(), text: 'Meat', isCorrect: false },
          { id: uuidv4(), text: 'Berries', isCorrect: false }
        ],
        metadata: {
          difficulty: 'easy',
          tags: ['science', 'animals', 'diet'],
          explanation: 'Pandas spend 12-16 hours a day eating bamboo!'
        }
      },
      {
        id: uuidv4(),
        type: 'true-false',
        front: 'Penguins can fly',
        back: 'false',
        category: 'Birds',
        metadata: {
          difficulty: 'easy',
          tags: ['science', 'animals', 'birds'],
          explanation: 'Penguins are flightless birds that swim instead!'
        }
      }
    ],
    metadata: {
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      playCount: 0,
      source: 'template',
      tags: ['science', 'animals', 'nature'],
      difficulty: 'beginner',
      estimatedTime: 5
    },
    settings: {
      shuffleCards: true,
      repeatIncorrect: true,
      studyMode: 'sequential'
    }
  },
  {
    id: 'space-exploration',
    name: 'Space Adventure',
    description: 'Explore the wonders of space!',
    emoji: '🚀',
    cards: [
      {
        id: uuidv4(),
        type: 'simple',
        front: 'What is the closest star to Earth?',
        back: 'The Sun',
        category: 'Stars',
        metadata: {
          difficulty: 'easy',
          tags: ['space', 'stars', 'solar-system']
        }
      },
      {
        id: uuidv4(),
        type: 'multiple-choice',
        front: 'Which planet is known as the Red Planet?',
        back: 'Mars',
        category: 'Planets',
        options: [
          { id: uuidv4(), text: 'Venus', isCorrect: false },
          { id: uuidv4(), text: 'Mars', isCorrect: true },
          { id: uuidv4(), text: 'Jupiter', isCorrect: false },
          { id: uuidv4(), text: 'Mercury', isCorrect: false }
        ],
        metadata: {
          difficulty: 'easy',
          tags: ['space', 'planets', 'solar-system'],
          explanation: 'Mars appears red due to iron oxide on its surface!'
        }
      },
      {
        id: uuidv4(),
        type: 'simple',
        front: 'How many moons does Earth have?',
        back: 'One moon',
        category: 'Earth',
        metadata: {
          difficulty: 'easy',
          tags: ['space', 'earth', 'moon']
        }
      },
      {
        id: uuidv4(),
        type: 'true-false',
        front: 'The sun is a planet',
        back: 'false',
        category: 'Solar System',
        metadata: {
          difficulty: 'easy',
          tags: ['space', 'sun', 'stars'],
          explanation: 'The sun is a star, not a planet!'
        }
      }
    ],
    metadata: {
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      playCount: 0,
      source: 'template',
      tags: ['science', 'space', 'astronomy'],
      difficulty: 'beginner',
      estimatedTime: 5
    },
    settings: {
      shuffleCards: true,
      repeatIncorrect: false,
      studyMode: 'random'
    }
  }
];

export const sampleMarkdown = `# Elementary Math

## Addition

- What is 2 + 2? :: 4
- What is 5 + 3? :: 8
- What is 10 + 10? :: 20

## Subtraction

- What is 10 - 5? :: 5
- What is 8 - 3? :: 5
- What is 7 - 4? :: 3

## Word Problems

- Tom has 3 apples. Sarah gives him 2 more. How many apples does Tom have now?
  * 4 apples
  * 5 apples [correct]
  * 6 apples
  * 7 apples

- There are 8 birds on a tree. 3 fly away. How many are left? :: 5 birds

## True or False

- 3 + 4 equals 7 :: true
- 10 - 2 equals 7 :: false
- 5 × 2 equals 10 :: true`;