import type { Flashcard, Difficulty } from '@/types/flashcard.types';

// Token types for lexical analysis
export enum TokenType {
  // Structure tokens
  HEADER1 = 'HEADER1',
  HEADER2 = 'HEADER2',
  HEADER3 = 'HEADER3',
  METADATA_BLOCK = 'METADATA_BLOCK',
  
  // Content tokens
  QUESTION_ANSWER = 'QUESTION_ANSWER',
  MC_QUESTION = 'MC_QUESTION',
  MC_OPTION = 'MC_OPTION',
  MC_CORRECT = 'MC_CORRECT',
  
  // Special tokens
  CODE_BLOCK = 'CODE_BLOCK',
  IMAGE = 'IMAGE',
  LATEX = 'LATEX',
  COMMENT = 'COMMENT',
  
  // Basic tokens
  TEXT = 'TEXT',
  EMPTY_LINE = 'EMPTY_LINE',
  UNKNOWN = 'UNKNOWN'
}

export interface Token {
  type: TokenType;
  value: string;
  line: number;
  column: number;
  raw: string;
  metadata?: Record<string, any>;
}

export interface ParseContext {
  tokens: Token[];
  position: number;
  currentCategory: string;
  currentSubcategory: string;
  deckMetadata: DeckMetadata;
  errors: ParseError[];
  warnings: ParseWarning[];
}

export interface DeckMetadata {
  title?: string;
  description?: string;
  emoji?: string;
  tags?: string[];
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  author?: string;
  version?: string;
  created?: string;
  modified?: string;
}

export interface ParseError {
  line: number;
  column: number;
  message: string;
  code: string;
  severity: 'error' | 'warning';
}

export interface ParseWarning extends ParseError {
  severity: 'warning';
}

export interface ParseResult {
  cards: Flashcard[];
  metadata: DeckMetadata;
  errors: ParseError[];
  warnings: ParseWarning[];
  stats: ParseStats;
}

export interface ParseStats {
  totalLines: number;
  totalCards: number;
  cardsByType: Record<string, number>;
  categories: string[];
  parseTime: number;
}

// Parser plugin interface for extensibility
export interface ParserPlugin {
  name: string;
  version: string;
  
  // Hooks for different parsing stages
  beforeTokenize?: (content: string) => string;
  afterTokenize?: (tokens: Token[]) => Token[];
  
  // Custom token handlers
  canHandleToken?: (token: Token, context: ParseContext) => boolean;
  handleToken?: (token: Token, context: ParseContext) => Flashcard | null;
  
  // Post-processing
  afterParse?: (result: ParseResult) => ParseResult;
}

// Validation rules
export interface ValidationRule {
  name: string;
  validate: (card: Flashcard) => ValidationResult;
}

export interface ValidationResult {
  valid: boolean;
  errors?: string[];
  warnings?: string[];
}

// Export format options
export interface ExportOptions {
  includeMetadata?: boolean;
  includeComments?: boolean;
  includeStats?: boolean;
  format?: 'simple' | 'full' | 'anki' | 'csv';
  lineEnding?: '\n' | '\r\n';
}