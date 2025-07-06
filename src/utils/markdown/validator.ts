import type { Flashcard } from '@/types/flashcard.types';
import type { ValidationRule, ValidationResult } from './types';

export class MarkdownValidator {
  private rules: ValidationRule[] = [];
  
  constructor(customRules: ValidationRule[] = []) {
    // Add default rules
    this.rules = [
      ...this.getDefaultRules(),
      ...customRules
    ];
  }
  
  validate(cards: Flashcard[]): ValidationResult[] {
    return cards.map(card => this.validateCard(card));
  }
  
  validateCard(card: Flashcard): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    for (const rule of this.rules) {
      const result = rule.validate(card);
      if (result.errors) errors.push(...result.errors);
      if (result.warnings) warnings.push(...result.warnings);
    }
    
    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }
  
  private getDefaultRules(): ValidationRule[] {
    return [
      {
        name: 'non-empty-content',
        validate: (card) => {
          const errors: string[] = [];
          
          if (!card.front || card.front.trim() === '') {
            errors.push('Question/front cannot be empty');
          }
          
          if (!card.back || card.back.trim() === '') {
            errors.push('Answer/back cannot be empty');
          }
          
          return {
            valid: errors.length === 0,
            errors
          };
        }
      },
      
      {
        name: 'valid-true-false',
        validate: (card) => {
          if (card.type !== 'true-false') {
            return { valid: true };
          }
          
          const validAnswers = ['true', 'false'];
          if (!validAnswers.includes(card.back.toLowerCase())) {
            return {
              valid: false,
              errors: ['True/false answer must be either "true" or "false"']
            };
          }
          
          return { valid: true };
        }
      },
      
      {
        name: 'multiple-choice-options',
        validate: (card) => {
          if (card.type !== 'multiple-choice') {
            return { valid: true };
          }
          
          const errors: string[] = [];
          const warnings: string[] = [];
          
          if (!card.options || card.options.length < 2) {
            errors.push('Multiple choice must have at least 2 options');
          }
          
          if (card.options && card.options.length > 6) {
            warnings.push('Multiple choice has more than 6 options, consider reducing');
          }
          
          const hasCorrect = card.options?.some(opt => opt.isCorrect);
          if (!hasCorrect) {
            errors.push('Multiple choice must have at least one correct answer');
          }
          
          const correctCount = card.options?.filter(opt => opt.isCorrect).length || 0;
          if (correctCount > 1) {
            warnings.push('Multiple choice has multiple correct answers');
          }
          
          return {
            valid: errors.length === 0,
            errors: errors.length > 0 ? errors : undefined,
            warnings: warnings.length > 0 ? warnings : undefined
          };
        }
      },
      
      {
        name: 'reasonable-length',
        validate: (card) => {
          const warnings: string[] = [];
          
          if (card.front.length > 500) {
            warnings.push('Question is very long (>500 characters), consider shortening');
          }
          
          if (card.back.length > 1000) {
            warnings.push('Answer is very long (>1000 characters), consider shortening');
          }
          
          return {
            valid: true,
            warnings: warnings.length > 0 ? warnings : undefined
          };
        }
      },
      
      {
        name: 'valid-difficulty',
        validate: (card) => {
          const validDifficulties = ['easy', 'medium', 'hard'];
          
          if (card.metadata.difficulty && 
              !validDifficulties.includes(card.metadata.difficulty)) {
            return {
              valid: false,
              errors: [`Invalid difficulty: ${card.metadata.difficulty}`]
            };
          }
          
          return { valid: true };
        }
      }
    ];
  }
}