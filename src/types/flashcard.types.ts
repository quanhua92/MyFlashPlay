export type CardType = 'simple' | 'multiple-choice' | 'true-false';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type StudyMode = 'sequential' | 'random' | 'spaced';

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  type: CardType;
  category?: string;
  subcategory?: string;
  media?: {
    type: 'image' | 'audio';
    url: string;
  };
  metadata: {
    difficulty: Difficulty;
    tags: string[];
    hint?: string;
    explanation?: string;
    relatedCards?: string[];
  };
  options?: QuizOption[];
}

export interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface Deck {
  id: string;
  name: string;
  description: string;
  emoji: string;
  cards: Flashcard[];
  metadata: {
    createdAt: string;
    lastModified: string;
    lastPlayed?: string;
    playCount: number;
    source: 'imported' | 'created' | 'template';
    originalMarkdown?: string;
    tags: string[];
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    estimatedTime: number;
  };
  settings: {
    shuffleCards: boolean;
    repeatIncorrect: boolean;
    studyMode: StudyMode;
  };
}

/**
 * Public deck structure for community-shared decks
 * Contains raw markdown content that gets parsed into Deck format
 */
export interface PublicDeck {
  id: string;
  name: string;
  description: string;
  author: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  markdown: string;
}