export type QuestionType = 'multiple-choice' | 'true-false' | 'fill-blank';

export interface QuizQuestion {
  id: string;
  type: QuestionType;
  question: string;
  options?: string[];
  correctAnswer: string | boolean;
  explanation?: string;
  hint?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  cardId: string;
  timeLimit?: number;
}

export interface QuizSettings {
  questionCount: number;
  timePerQuestion?: number;
  showHints: boolean;
  showExplanations: boolean;
  randomizeOptions: boolean;
  difficulty?: 'easy' | 'medium' | 'hard' | 'mixed';
}