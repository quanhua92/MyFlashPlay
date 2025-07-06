import { v4 as uuidv4 } from 'uuid';
import type { Flashcard, Difficulty } from '@/types';

// Token types for our lexer
enum TokenType {
  HEADER1 = 'HEADER1',           // # Title
  HEADER2 = 'HEADER2',           // ## Subtitle
  QUESTION_ANSWER = 'QUESTION_ANSWER', // Question :: Answer
  MC_QUESTION = 'MC_QUESTION',   // Question (followed by options)
  MC_OPTION = 'MC_OPTION',       // - Option or * Option
  MC_CORRECT = 'MC_CORRECT',     // > Correct answer
  COMMENT = 'COMMENT',           // <!-- comment --> or // comment
  EMPTY_LINE = 'EMPTY_LINE',
  TEXT = 'TEXT'
}

interface Token {
  type: TokenType;
  value: string;
  line: number;
  metadata?: any;
}

// Parser states (for future use)
// enum ParserState {
//   INITIAL = 'INITIAL',
//   IN_CATEGORY = 'IN_CATEGORY',
//   IN_MULTIPLE_CHOICE = 'IN_MULTIPLE_CHOICE'
// }

// AST Node types (for future use)
// interface ASTNode {
//   type: string;
//   children?: ASTNode[];
//   value?: any;
// }

export class MarkdownParserV2 {
  private tokens: Token[] = [];
  private position = 0;
  private currentCategory = '';
  private currentSubcategory = '';

  parse(markdown: string): Flashcard[] {
    // Step 1: Tokenize
    this.tokens = this.tokenize(markdown);
    this.position = 0;
    

    // Step 2: Parse tokens into flashcards
    const flashcards: Flashcard[] = [];
    
    while (this.position < this.tokens.length) {
      const token = this.peek();
      
      if (!token) break;

      switch (token.type) {
        case TokenType.HEADER1:
          this.handleCategory();
          break;
        case TokenType.HEADER2:
          this.handleSubcategory();
          break;
        case TokenType.QUESTION_ANSWER:
          const simpleCard = this.parseSimpleCard();
          if (simpleCard) flashcards.push(simpleCard);
          break;
        case TokenType.MC_QUESTION:
          const mcCard = this.parseMultipleChoiceCard();
          if (mcCard) flashcards.push(mcCard);
          break;
        default:
          this.consume(); // Skip unknown tokens
      }
    }

    return flashcards;
  }

  private tokenize(markdown: string): Token[] {
    const lines = markdown.split('\n');
    const tokens: Token[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      
      // Empty line
      if (!trimmed) {
        tokens.push({ type: TokenType.EMPTY_LINE, value: '', line: i });
        continue;
      }

      // Headers
      if (trimmed.startsWith('# ')) {
        tokens.push({ 
          type: TokenType.HEADER1, 
          value: trimmed.substring(2).trim(), 
          line: i 
        });
        continue;
      }
      
      if (trimmed.startsWith('## ')) {
        tokens.push({ 
          type: TokenType.HEADER2, 
          value: trimmed.substring(3).trim(), 
          line: i 
        });
        continue;
      }

      // Comments
      if (trimmed.startsWith('<!--') && trimmed.endsWith('-->')) {
        tokens.push({ 
          type: TokenType.COMMENT, 
          value: trimmed.slice(4, -3).trim(), 
          line: i 
        });
        continue;
      }

      // Multiple choice options or correct answer
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        tokens.push({ 
          type: TokenType.MC_OPTION, 
          value: trimmed.substring(2).trim(), 
          line: i 
        });
        continue;
      }
      
      if (trimmed.startsWith('> ')) {
        tokens.push({ 
          type: TokenType.MC_CORRECT, 
          value: trimmed.substring(2).trim(), 
          line: i 
        });
        continue;
      }

      // Question :: Answer format
      if (trimmed.includes('::')) {
        const parts = trimmed.split('::');
        const question = parts[0]?.trim() || '';
        const answer = parts.slice(1).join('::').trim() || '';
        tokens.push({ 
          type: TokenType.QUESTION_ANSWER, 
          value: trimmed,
          line: i,
          metadata: { question, answer }
        });
        continue;
      }

      // Check if this might be a multiple choice question
      // (text followed by options on next lines)
      if (i + 1 < lines.length) {
        const nextLine = lines[i + 1].trim();
        if (nextLine.startsWith('- ') || nextLine.startsWith('* ')) {
          tokens.push({ 
            type: TokenType.MC_QUESTION, 
            value: trimmed, 
            line: i 
          });
          continue;
        }
      }

      // Default: plain text
      tokens.push({ 
        type: TokenType.TEXT, 
        value: trimmed, 
        line: i 
      });
    }

    return tokens;
  }

  private peek(offset = 0): Token | null {
    const pos = this.position + offset;
    return pos < this.tokens.length ? this.tokens[pos] : null;
  }

  private consume(): Token | null {
    return this.position < this.tokens.length ? this.tokens[this.position++] : null;
  }

  private handleCategory(): void {
    const token = this.consume();
    if (token) {
      this.currentCategory = token.value;
      this.currentSubcategory = '';
    }
  }

  private handleSubcategory(): void {
    const token = this.consume();
    if (token) {
      this.currentSubcategory = token.value;
    }
  }

  private parseSimpleCard(): Flashcard | null {
    const token = this.consume();
    if (!token || token.type !== TokenType.QUESTION_ANSWER) return null;

    const { question, answer } = token.metadata;
    
    // Check if it's true/false (also handle Vietnamese format)
    const answerLower = answer.toLowerCase();
    const isTrueFalse = answerLower === 'true' || answerLower === 'false' ||
                        answerLower.includes('(true)') || answerLower.includes('(false)');

    // Extract true/false value if needed
    let backValue = answer;
    if (isTrueFalse) {
      if (answerLower.includes('true')) {
        backValue = 'true';
      } else if (answerLower.includes('false')) {
        backValue = 'false';
      } else {
        backValue = answerLower; // fallback
      }
    }

    const card: Flashcard = {
      id: uuidv4(),
      type: isTrueFalse ? 'true-false' : 'simple',
      front: question,
      back: backValue,
      metadata: {
        difficulty: 'easy' as Difficulty,
        tags: []
      }
    };

    // Apply category if exists
    if (this.currentCategory) card.category = this.currentCategory;
    if (this.currentSubcategory) card.subcategory = this.currentSubcategory;

    // Look for metadata in following comments
    this.parseMetadata(card);

    return card;
  }

  private parseMultipleChoiceCard(): Flashcard | null {
    const questionToken = this.consume();
    if (!questionToken || questionToken.type !== TokenType.MC_QUESTION) return null;

    const options: { id: string; text: string; isCorrect: boolean }[] = [];
    let correctAnswer = '';

    // Collect all options and correct answer
    while (this.peek()) {
      const next = this.peek();
      if (!next) break;

      if (next.type === TokenType.MC_OPTION) {
        const optionToken = this.consume()!;
        options.push({
          id: uuidv4(),
          text: optionToken.value,
          isCorrect: false
        });
      } else if (next.type === TokenType.MC_CORRECT) {
        const correctToken = this.consume()!;
        correctAnswer = correctToken.value;
        
        // Mark the matching option as correct
        const matchingOption = options.find(opt => opt.text === correctAnswer);
        if (matchingOption) {
          matchingOption.isCorrect = true;
        } else {
          // Add as new option if not found
          options.push({
            id: uuidv4(),
            text: correctAnswer,
            isCorrect: true
          });
        }
      } else if (next.type !== TokenType.EMPTY_LINE) {
        // Stop if we hit non-option content
        break;
      } else {
        this.consume(); // Skip empty lines
      }
    }

    if (options.length < 2 || !correctAnswer) return null;

    const card: Flashcard = {
      id: uuidv4(),
      type: 'multiple-choice',
      front: questionToken.value,
      back: correctAnswer,
      options,
      metadata: {
        difficulty: 'medium' as Difficulty,
        tags: []
      }
    };

    if (this.currentCategory) card.category = this.currentCategory;
    if (this.currentSubcategory) card.subcategory = this.currentSubcategory;

    this.parseMetadata(card);

    return card;
  }

  private parseMetadata(card: Flashcard): void {
    // Look ahead for metadata in comments
    while (this.peek()) {
      const token = this.peek();
      if (!token || token.type !== TokenType.COMMENT) break;

      const comment = token.value;
      const colonIndex = comment.indexOf(':');
      if (colonIndex > 0) {
        const key = comment.substring(0, colonIndex).trim().toLowerCase();
        const value = comment.substring(colonIndex + 1).trim();
        
        switch (key) {
          case 'hint':
            card.metadata.hint = value;
            this.consume();
            break;
          case 'explanation':
            card.metadata.explanation = value;
            this.consume();
            break;
          case 'difficulty':
            const diff = value.toLowerCase();
            if (diff === 'easy' || diff === 'medium' || diff === 'hard') {
              card.metadata.difficulty = diff as Difficulty;
            }
            this.consume();
            break;
          case 'tags':
            card.metadata.tags = value.split(',').map(t => t.trim()).filter(t => t);
            this.consume();
            break;
          default:
            // Unknown metadata, don't consume
            return;
        }
      } else {
        break;
      }
    }
  }

  // Content sanitization - just return plain text for now
  // The UI component will handle any formatting
  sanitizeContent(content: string): string {
    return content;
  }
}