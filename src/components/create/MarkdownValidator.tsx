import { useMemo } from 'react';
import { AlertTriangle, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { MarkdownParser } from '@/utils/markdown-parser';

interface ValidationResult {
  isValid: boolean;
  errors: Array<{
    type: 'error' | 'warning' | 'info';
    message: string;
    line?: number;
  }>;
  cardCount: number;
  categoryCount: number;
}

interface MarkdownValidatorProps {
  markdown: string;
  onValidationChange?: (result: ValidationResult) => void;
}

export function MarkdownValidator({ markdown, onValidationChange }: MarkdownValidatorProps) {
  const validation = useMemo(() => {
    const parser = new MarkdownParser();
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      cardCount: 0,
      categoryCount: 0
    };

    try {
      // Basic markdown validation
      if (!markdown || markdown.trim().length === 0) {
        result.isValid = false;
        result.errors.push({
          type: 'error',
          message: 'Markdown content is empty'
        });
        return result;
      }

      // Check for basic structure
      const lines = markdown.split('\n');
      let hasTitle = false;
      let hasCards = false;
      let currentCategory = '';
      const categories = new Set<string>();
      let cardCount = 0;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const lineNumber = i + 1;

        // Check for title
        if (line.startsWith('# ')) {
          hasTitle = true;
          continue;
        }

        // Check for categories
        if (line.startsWith('## ')) {
          currentCategory = line.substring(3).trim();
          if (currentCategory) {
            categories.add(currentCategory);
          }
          continue;
        }

        // Check for cards
        if (line.startsWith('- ')) {
          hasCards = true;
          cardCount++;

          // Validate Q&A format
          if (line.includes(' :: ')) {
            const parts = line.substring(2).split(' :: ');
            if (parts.length !== 2) {
              result.errors.push({
                type: 'error',
                message: 'Invalid Q&A format. Use: "- Question :: Answer"',
                line: lineNumber
              });
              result.isValid = false;
            } else {
              const question = parts[0].trim();
              const answer = parts[1].trim();
              
              if (!question) {
                result.errors.push({
                  type: 'error',
                  message: 'Question cannot be empty',
                  line: lineNumber
                });
                result.isValid = false;
              }
              
              if (!answer) {
                result.errors.push({
                  type: 'error',
                  message: 'Answer cannot be empty',
                  line: lineNumber
                });
                result.isValid = false;
              }
            }
          } else {
            // Check if it's a multiple choice question
            const nextLines = lines.slice(i + 1, i + 6); // Check next 5 lines for options
            const optionLines = nextLines.filter(l => l.trim().startsWith('  * '));
            
            if (optionLines.length > 0) {
              // Multiple choice question
              const correctOptions = optionLines.filter(l => l.includes('[correct]'));
              
              if (correctOptions.length === 0) {
                result.errors.push({
                  type: 'error',
                  message: 'Multiple choice question must have at least one [correct] answer',
                  line: lineNumber
                });
                result.isValid = false;
              }
              
              if (optionLines.length < 2) {
                result.errors.push({
                  type: 'warning',
                  message: 'Multiple choice questions should have at least 2 options',
                  line: lineNumber
                });
              }
            } else {
              // Not Q&A format and no multiple choice options
              result.errors.push({
                type: 'error',
                message: 'Card must be either Q&A format (Question :: Answer) or multiple choice with options',
                line: lineNumber
              });
              result.isValid = false;
            }
          }
        }
      }

      // Overall validation
      if (!hasTitle) {
        result.errors.push({
          type: 'warning',
          message: 'Consider adding a title with "# Title" format'
        });
      }

      if (!hasCards) {
        result.errors.push({
          type: 'error',
          message: 'No flashcards found. Add cards using "- Question :: Answer" format'
        });
        result.isValid = false;
      }

      if (cardCount === 0) {
        result.errors.push({
          type: 'error',
          message: 'No valid cards found'
        });
        result.isValid = false;
      }

      // Test with actual parser
      try {
        const parsedCards = parser.parse(markdown);
        result.cardCount = parsedCards.length;
        
        if (parsedCards.length === 0) {
          result.errors.push({
            type: 'error',
            message: 'Parser could not extract any valid cards from the markdown'
          });
          result.isValid = false;
        } else if (parsedCards.length !== cardCount) {
          result.errors.push({
            type: 'warning',
            message: `Expected ${cardCount} cards but parser found ${parsedCards.length}. Some cards may have issues.`
          });
        }
      } catch (parseError) {
        result.errors.push({
          type: 'error',
          message: `Parser error: ${parseError}`
        });
        result.isValid = false;
      }

      result.categoryCount = categories.size;

      // Success messages
      if (result.isValid && result.errors.length === 0) {
        result.errors.push({
          type: 'info',
          message: `Valid markdown with ${result.cardCount} cards${result.categoryCount > 0 ? ` in ${result.categoryCount} categories` : ''}`
        });
      }

    } catch (error) {
      result.isValid = false;
      result.errors.push({
        type: 'error',
        message: `Validation error: ${error}`
      });
    }

    // Notify parent component
    if (onValidationChange) {
      onValidationChange(result);
    }

    return result;
  }, [markdown, onValidationChange]);

  if (validation.errors.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {validation.errors.map((error, index) => {
        const Icon = {
          error: AlertTriangle,
          warning: AlertCircle,
          info: Info
        }[error.type];

        const colorClasses = {
          error: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
          warning: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
          info: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
        }[error.type];

        return (
          <div
            key={index}
            className={`p-3 border rounded-lg flex items-start gap-2 text-sm ${colorClasses}`}
          >
            <Icon className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              <span>{error.message}</span>
              {error.line && (
                <span className="ml-2 opacity-75">(Line {error.line})</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}