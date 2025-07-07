import { v4 as uuidv4 } from 'uuid';
import type { Flashcard, Difficulty } from '@/types';
import type { 
  Token, 
  ParseContext, 
  ParseResult, 
  ParseError,
  DeckMetadata,
  ParserPlugin 
} from './types';
import { TokenType } from './types';

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

export class MarkdownParser {
  private plugins: ParserPlugin[] = [];
  
  constructor(plugins: ParserPlugin[] = []) {
    this.plugins = plugins;
  }
  
  parse(tokens: Token[]): ParseResult {
    const startTime = performance.now();
    
    const context: ParseContext = {
      tokens,
      position: 0,
      currentCategory: '',
      currentSubcategory: '',
      deckMetadata: {},
      errors: [],
      warnings: []
    };
    
    // Apply plugin pre-processing
    for (const plugin of this.plugins) {
      if (plugin.afterTokenize) {
        context.tokens = plugin.afterTokenize(context.tokens);
      }
    }
    
    const cards: Flashcard[] = [];
    
    // First pass: extract metadata
    this.extractMetadata(context);
    
    // Second pass: parse cards
    while (context.position < context.tokens.length) {
      const token = this.peek(context);
      if (!token) break;
      
      try {
        const card = this.parseToken(token, context);
        if (card) {
          cards.push(card);
        }
      } catch (error) {
        this.addError(context, token, `Failed to parse: ${error}`);
      }
      
      context.position++;
    }
    
    const endTime = performance.now();
    
    const result: ParseResult = {
      cards,
      metadata: context.deckMetadata,
      errors: context.errors,
      warnings: context.warnings,
      stats: {
        totalLines: Math.max(...tokens.map(t => t.line), 0),
        totalCards: cards.length,
        cardsByType: this.countCardTypes(cards),
        categories: this.extractCategories(cards),
        parseTime: endTime - startTime
      }
    };
    
    // Apply plugin post-processing
    for (const plugin of this.plugins) {
      if (plugin.afterParse) {
        return plugin.afterParse(result);
      }
    }
    
    return result;
  }

  // Legacy method for backwards compatibility
  parseMarkdown(markdown: string): Flashcard[] {
    // Step 1: Tokenize markdown content
    const tokens = this.tokenize(markdown);
    
    // Step 2: Parse using new method
    const result = this.parse(tokens);
    
    // Step 3: Return just the cards for backwards compatibility
    return result.cards;
  }

  private tokenize(markdown: string): Token[] {
    const lines = markdown.split('\n');
    const tokens: Token[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      
      // Empty line
      if (!trimmed) {
        tokens.push({ 
          type: TokenType.EMPTY_LINE, 
          value: '', 
          line: i,
          column: 0,
          raw: line
        });
        continue;
      }

      // Headers
      if (trimmed.startsWith('# ')) {
        tokens.push({ 
          type: TokenType.HEADER1, 
          value: trimmed.substring(2).trim(), 
          line: i,
          column: 0,
          raw: line
        });
        continue;
      }
      
      if (trimmed.startsWith('## ')) {
        tokens.push({ 
          type: TokenType.HEADER2, 
          value: trimmed.substring(3).trim(), 
          line: i,
          column: 0,
          raw: line
        });
        continue;
      }

      // Comments
      if (trimmed.startsWith('<!--') && trimmed.endsWith('-->')) {
        tokens.push({ 
          type: TokenType.COMMENT, 
          value: trimmed.slice(4, -3).trim(), 
          line: i,
          column: 0,
          raw: line
        });
        continue;
      }

      // Multiple choice options or correct answer
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        tokens.push({ 
          type: TokenType.MC_OPTION, 
          value: trimmed.substring(2).trim(), 
          line: i,
          column: 0,
          raw: line
        });
        continue;
      }
      
      if (trimmed.startsWith('> ')) {
        tokens.push({ 
          type: TokenType.MC_CORRECT, 
          value: trimmed.substring(2).trim(), 
          line: i,
          column: 0,
          raw: line
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
          column: 0,
          raw: line,
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
            line: i,
            column: 0,
            raw: line
          });
          continue;
        }
      }

      // Default: plain text
      tokens.push({ 
        type: TokenType.TEXT, 
        value: trimmed, 
        line: i,
        column: 0,
        raw: line
      });
    }

    return tokens;
  }

  private parseToken(token: Token, context: ParseContext): Flashcard | null {
    // Check plugins first
    for (const plugin of this.plugins) {
      if (plugin.canHandleToken?.(token, context)) {
        return plugin.handleToken?.(token, context) || null;
      }
    }
    
    switch (token.type) {
      case TokenType.HEADER1:
        context.currentCategory = token.value;
        context.currentSubcategory = '';
        return null;
        
      case TokenType.HEADER2:
        context.currentSubcategory = token.value;
        return null;
        
      case TokenType.QUESTION_ANSWER:
        return this.parseQuestionAnswer(token, context);
        
      case TokenType.MC_QUESTION:
        return this.parseMultipleChoice(token, context);
        
      case TokenType.CODE_BLOCK:
        return this.parseCodeBlock(token, context);
        
      case TokenType.IMAGE:
        return this.parseImage(token, context);
        
      case TokenType.LATEX:
        return this.parseLatex(token, context);
        
      default:
        return null;
    }
  }

  private parseQuestionAnswer(token: Token, context: ParseContext): Flashcard | null {
    const { question, answer } = token.metadata || {};
    
    // Handle edge cases where question or answer might be empty
    const frontText = question || '';
    const backText = answer || '';
    
    // Only reject if both are empty (completely invalid)
    if (!frontText && !backText) {
      this.addError(context, token, 'Invalid question/answer format - both question and answer are empty');
      return null;
    }
    
    // Detect card type
    const cardType = this.detectCardType(backText);
    
    const card: Flashcard = {
      id: uuidv4(),
      type: cardType,
      front: frontText,
      back: this.normalizeAnswer(backText, cardType),
      metadata: {
        difficulty: 'easy' as Difficulty,
        tags: []
      }
    };
    
    // Apply categories
    if (context.currentCategory) card.category = context.currentCategory;
    if (context.currentSubcategory) card.subcategory = context.currentSubcategory;
    
    // Look for metadata in following comments
    this.parseMetadata(card, context);
    
    return card;
  }

  private parseMultipleChoice(token: Token, context: ParseContext): Flashcard | null {
    const question = token.value;
    const options: { id: string; text: string; isCorrect: boolean }[] = [];
    let correctAnswer = '';
    
    // Collect options and correct answer
    let pos = context.position + 1;
    while (pos < context.tokens.length) {
      const nextToken = context.tokens[pos];
      
      if (nextToken.type === TokenType.MC_OPTION) {
        options.push({
          id: uuidv4(),
          text: nextToken.value,
          isCorrect: false
        });
      } else if (nextToken.type === TokenType.MC_CORRECT) {
        correctAnswer = nextToken.value;
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
      } else if (nextToken.type !== TokenType.EMPTY_LINE) {
        break;
      }
      
      pos++;
    }
    
    // Update context position
    context.position = pos - 1;
    
    if (options.length < 2) {
      this.addWarning(context, token, 'Multiple choice question has less than 2 options');
      return null;
    }
    
    if (!correctAnswer) {
      this.addError(context, token, 'Multiple choice question missing correct answer');
      return null;
    }
    
    const card: Flashcard = {
      id: uuidv4(),
      type: 'multiple-choice',
      front: question,
      back: correctAnswer,
      options,
      metadata: {
        difficulty: 'medium' as Difficulty,
        tags: []
      }
    };
    
    if (context.currentCategory) card.category = context.currentCategory;
    if (context.currentSubcategory) card.subcategory = context.currentSubcategory;
    
    this.parseMetadata(card, context);
    
    return card;
  }

  private parseCodeBlock(token: Token, context: ParseContext): Flashcard | null {
    // Handle code blocks in questions
    // This is a placeholder - implement based on requirements
    return null;
  }
  
  private parseImage(token: Token, context: ParseContext): Flashcard | null {
    // Handle images in questions
    // This is a placeholder - implement based on requirements
    return null;
  }
  
  private parseLatex(token: Token, context: ParseContext): Flashcard | null {
    // Handle LaTeX math in questions
    // This is a placeholder - implement based on requirements
    return null;
  }
  
  private parseMetadata(card: Flashcard, context: ParseContext): void {
    // Look ahead for metadata comments
    let pos = context.position + 1;
    
    while (pos < context.tokens.length) {
      const token = context.tokens[pos];
      
      if (token.type !== TokenType.COMMENT) {
        if (token.type !== TokenType.EMPTY_LINE) break;
        pos++;
        continue;
      }
      
      const comment = token.value;
      
      if (comment.startsWith('Hint:')) {
        card.metadata.hint = comment.substring(5).trim();
      } else if (comment.startsWith('Explanation:')) {
        card.metadata.explanation = comment.substring(12).trim();
      } else if (comment.startsWith('Difficulty:')) {
        const diff = comment.substring(11).trim().toLowerCase();
        if (diff === 'easy' || diff === 'medium' || diff === 'hard') {
          card.metadata.difficulty = diff as Difficulty;
        }
      } else if (comment.startsWith('Tags:')) {
        card.metadata.tags = comment.substring(5).split(',').map(t => t.trim());
      }
      
      pos++;
    }
  }
  
  private extractMetadata(context: ParseContext): void {
    const metadataToken = context.tokens.find(t => t.type === TokenType.METADATA_BLOCK);
    if (!metadataToken) return;
    
    const lines = metadataToken.value.split('\n');
    const metadata: DeckMetadata = {};
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;
      
      // Basic YAML validation - check for valid key:value format
      if (!trimmedLine.includes(':')) {
        context.errors.push({
          line: metadataToken.line || 0,
          column: 0,
          message: `Invalid YAML format: "${trimmedLine}" - missing colon`,
          code: 'INVALID_YAML',
          severity: 'error'
        });
        continue;
      }
      
      // Check if line has multiple colons that could indicate malformed YAML
      const colonCount = (trimmedLine.match(/:/g) || []).length;
      if (colonCount > 1 && trimmedLine.includes('::')) {
        context.errors.push({
          line: metadataToken.line || 0,
          column: 0,
          message: `Invalid YAML format: "${trimmedLine}" - contains multiple colons or invalid syntax`,
          code: 'INVALID_YAML',
          severity: 'error'
        });
        continue;
      }
      
      const [key, ...valueParts] = line.split(':');
      if (!key || !key.trim()) {
        context.errors.push({
          line: metadataToken.line || 0,
          column: 0,
          message: `Invalid YAML format: empty key in "${trimmedLine}"`,
          code: 'INVALID_YAML',
          severity: 'error'
        });
        continue;
      }
      
      const value = valueParts.join(':').trim();
      
      switch (key.trim().toLowerCase()) {
        case 'title':
          metadata.title = value;
          break;
        case 'description':
          metadata.description = value;
          break;
        case 'emoji':
          metadata.emoji = value;
          break;
        case 'tags':
          metadata.tags = value.slice(1, -1).split(',').map(t => t.trim());
          break;
        case 'difficulty':
          if (['beginner', 'intermediate', 'advanced'].includes(value)) {
            metadata.difficulty = value as any;
          }
          break;
        case 'author':
          metadata.author = value;
          break;
        case 'version':
          metadata.version = value;
          break;
      }
    }
    
    context.deckMetadata = metadata;
  }
  
  private detectCardType(answer: string): 'simple' | 'true-false' {
    const normalized = answer.toLowerCase().trim();
    
    // Check for various true/false formats
    if (normalized === 'true' || normalized === 'false' ||
        normalized === 'đúng' || normalized === 'sai' ||
        normalized.includes('(true)') || normalized.includes('(false)') ||
        normalized.includes('đúng (true)') || normalized.includes('sai (false)')) {
      return 'true-false';
    }
    
    return 'simple';
  }
  
  private normalizeAnswer(answer: string, cardType: string): string {
    if (cardType === 'true-false') {
      const normalized = answer.toLowerCase();
      if (normalized.includes('true') || normalized === 'đúng') {
        return 'true';
      } else if (normalized.includes('false') || normalized === 'sai') {
        return 'false';
      }
    }
    return answer;
  }
  
  private peek(context: ParseContext, offset = 0): Token | null {
    const pos = context.position + offset;
    return pos < context.tokens.length ? context.tokens[pos] : null;
  }
  
  private addError(context: ParseContext, token: Token, message: string): void {
    context.errors.push({
      line: token.line,
      column: token.column,
      message,
      code: 'PARSE_ERROR',
      severity: 'error'
    });
  }
  
  private addWarning(context: ParseContext, token: Token, message: string): void {
    context.warnings.push({
      line: token.line,
      column: token.column,
      message,
      code: 'PARSE_WARNING',
      severity: 'warning'
    });
  }
  
  private countCardTypes(cards: Flashcard[]): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const card of cards) {
      counts[card.type] = (counts[card.type] || 0) + 1;
    }
    return counts;
  }
  
  private extractCategories(cards: Flashcard[]): string[] {
    const categories = new Set<string>();
    for (const card of cards) {
      if (card.category) categories.add(card.category);
      if (card.subcategory) categories.add(card.subcategory);
    }
    return Array.from(categories);
  }
}

// Export alias for backwards compatibility
export { MarkdownParser as MarkdownParserV2 };