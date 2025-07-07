import { useMemo, useEffect } from 'react';
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { MarkdownParser } from '@/utils/markdown';

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

        // Skip empty lines
        if (line === '') {
          continue;
        }

        // Check for title
        if (line.startsWith('# ')) {
          const title = line.substring(2).trim();
          if (!title) {
            result.errors.push({
              type: 'error',
              message: 'Title cannot be empty after "#". Example: "# My Flashcards"',
              line: lineNumber
            });
            result.isValid = false;
          } else {
            hasTitle = true;
          }
          continue;
        }

        // Check for categories
        if (line.startsWith('## ')) {
          const category = line.substring(3).trim();
          if (!category) {
            result.errors.push({
              type: 'error',
              message: 'Category name cannot be empty after "##". Example: "## Math"',
              line: lineNumber
            });
            result.isValid = false;
          } else {
            currentCategory = category;
            categories.add(currentCategory);
          }
          continue;
        }

        // Check for cards (both "- Question :: Answer" and "Question :: Answer" formats)
        if (line.startsWith('- ') || line.includes(' :: ')) {
          hasCards = true;
          cardCount++;

          const cardContent = line.startsWith('- ') ? line.substring(2).trim() : line;
          if (!cardContent) {
            result.errors.push({
              type: 'error',
              message: 'Card content cannot be empty. Example: "What is 2+2? :: 4" or "- What is 2+2? :: 4"',
              line: lineNumber
            });
            result.isValid = false;
            continue;
          }

          // Validate Q&A format
          if (cardContent.includes(' :: ')) {
            const parts = cardContent.split(' :: ');
            if (parts.length > 2) {
              result.errors.push({
                type: 'warning',
                message: 'Multiple "::" found. Only the first one will be used to separate question and answer.',
                line: lineNumber
              });
            }
            
            const question = parts[0].trim();
            const answer = parts[1] ? parts[1].trim() : '';
            
            if (!question) {
              result.errors.push({
                type: 'error',
                message: 'Question cannot be empty before "::". Example: "What is your name? :: John"',
                line: lineNumber
              });
              result.isValid = false;
            }
            
            if (!answer) {
              result.errors.push({
                type: 'error',
                message: 'Answer cannot be empty after "::". Example: "What is 2+2? :: 4"',
                line: lineNumber
              });
              result.isValid = false;
            }

            if (question.length > 200) {
              result.errors.push({
                type: 'warning',
                message: 'Question is very long. Consider shortening for better readability.',
                line: lineNumber
              });
            }

            if (answer.length > 200) {
              result.errors.push({
                type: 'warning',
                message: 'Answer is very long. Consider shortening for better readability.',
                line: lineNumber
              });
            }
          } else {
            // Check for multiple choice format
            let nextLineIndex = i + 1;
            const optionLines = [];
            let correctAnswerLine = null;
            
            // Look for options (lines starting with spaces + -)
            while (nextLineIndex < lines.length) {
              const nextLine = lines[nextLineIndex];
              if (nextLine.match(/^\s+- /)) {
                const option = nextLine.trim().substring(2).trim();
                if (!option) {
                  result.errors.push({
                    type: 'error',
                    message: 'Option cannot be empty. Example: "  - Option text"',
                    line: nextLineIndex + 1
                  });
                  result.isValid = false;
                } else {
                  optionLines.push({ line: nextLineIndex + 1, content: option });
                }
              } else if (nextLine.match(/^\s+> /)) {
                const correctAnswer = nextLine.trim().substring(2).trim();
                if (!correctAnswer) {
                  result.errors.push({
                    type: 'error',
                    message: 'Correct answer cannot be empty after ">". Example: "  > Correct answer"',
                    line: nextLineIndex + 1
                  });
                  result.isValid = false;
                } else {
                  correctAnswerLine = { line: nextLineIndex + 1, content: correctAnswer };
                }
                break;
              } else if (nextLine.trim() === '') {
                // Skip empty lines
              } else {
                // Non-matching line, stop looking for options
                break;
              }
              nextLineIndex++;
            }
            
            if (optionLines.length > 0) {
              // Multiple choice format detected
              if (!correctAnswerLine) {
                result.errors.push({
                  type: 'error',
                  message: 'Multiple choice question missing correct answer. Add "  > Correct Answer" after the options.',
                  line: lineNumber
                });
                result.isValid = false;
              } else {
                // Check if correct answer matches one of the options
                const matchingOption = optionLines.find(opt => 
                  opt.content.toLowerCase().trim() === correctAnswerLine.content.toLowerCase().trim()
                );
                if (!matchingOption) {
                  result.errors.push({
                    type: 'warning',
                    message: `Correct answer "${correctAnswerLine.content}" doesn't exactly match any option. Make sure it matches one of your options exactly.`,
                    line: correctAnswerLine.line
                  });
                }
              }
              
              if (optionLines.length < 2) {
                result.errors.push({
                  type: 'error',
                  message: 'Multiple choice questions must have at least 2 options. Add more "  - Option" lines.',
                  line: lineNumber
                });
                result.isValid = false;
              }
              
              if (optionLines.length > 6) {
                result.errors.push({
                  type: 'warning',
                  message: 'Too many options (more than 6). Consider reducing for better user experience.',
                  line: lineNumber
                });
              }
              
              // Skip processed lines
              i = nextLineIndex;
            } else {
              // Not Q&A format and no multiple choice options
              result.errors.push({
                type: 'error',
                message: 'Invalid card format. Use "Question :: Answer" OR multiple choice format.',
                line: lineNumber
              });
              result.errors.push({
                type: 'info',
                message: 'Multiple choice example:\\n- What is 2+2?\\n  - 3\\n  - 4\\n  - 5\\n  > 4'
              });
              result.isValid = false;
            }
          }
        } else if (line.startsWith('  - ') || line.startsWith('  > ')) {
          // These should be part of multiple choice, but we're not in a card context
          result.errors.push({
            type: 'error',
            message: 'Option or answer line found outside of a multiple choice card. These must follow a card starting with "-"',
            line: lineNumber
          });
          result.isValid = false;
        } else if (line.match(/^\s+/)) {
          // Line starts with spaces but doesn't match expected patterns
          result.errors.push({
            type: 'warning',
            message: 'Unexpected indented line. For options use "  - Option" and for correct answers use "  > Answer"',
            line: lineNumber
          });
        } else {
          // Unknown line format
          result.errors.push({
            type: 'warning',
            message: 'Unknown line format. Expected: "# Title", "## Category", "Question :: Answer", "  - Option", or "  > Answer"',
            line: lineNumber
          });
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
          message: 'No flashcards found. Add cards using "Question :: Answer" format'
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

    return result;
  }, [markdown]);

  // Use useEffect to notify parent component to avoid state updates during render
  useEffect(() => {
    if (onValidationChange) {
      onValidationChange(validation);
    }
  }, [validation, onValidationChange]);

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