import type { Flashcard } from '@/types/flashcard.types';
import { MarkdownLexer } from './lexer';
import { MarkdownParser } from './parser';
import { MarkdownValidator } from './validator';
import { MarkdownExporter } from './exporter';
import type { 
  ParseResult, 
  ParserPlugin, 
  ValidationRule, 
  ExportOptions 
} from './types';

export class MarkdownProcessor {
  private lexer: MarkdownLexer;
  private parser: MarkdownParser;
  private validator: MarkdownValidator;
  private exporter: MarkdownExporter;
  private plugins: ParserPlugin[];
  
  constructor(options?: {
    plugins?: ParserPlugin[];
    validationRules?: ValidationRule[];
  }) {
    this.plugins = options?.plugins || [];
    this.lexer = new MarkdownLexer('');
    this.parser = new MarkdownParser(this.plugins);
    this.validator = new MarkdownValidator(options?.validationRules || []);
    this.exporter = new MarkdownExporter();
  }
  
  /**
   * Parse markdown content into flashcards
   */
  parse(markdown: string): ParseResult {
    // Handle null/undefined markdown
    if (!markdown || typeof markdown !== 'string') {
      return {
        cards: [],
        errors: ['Invalid markdown content: expected string but received ' + typeof markdown],
        warnings: []
      };
    }
    
    // Apply pre-processing
    let processedMarkdown = this.preprocess(markdown);
    
    // Apply plugin pre-tokenization
    for (const plugin of this.plugins) {
      if (plugin.beforeTokenize) {
        processedMarkdown = plugin.beforeTokenize(processedMarkdown);
      }
    }
    
    // Tokenize
    this.lexer = new MarkdownLexer(processedMarkdown);
    const tokens = this.lexer.tokenize();
    
    // Parse tokens into cards
    let result = this.parser.parse(tokens);
    
    // Apply plugin post-processing
    for (const plugin of this.plugins) {
      if (plugin.afterParse) {
        result = plugin.afterParse(result);
      }
    }
    
    // Validate cards
    const validationResults = this.validator.validate(result.cards);
    
    // Merge validation errors/warnings
    for (const [index, validation] of validationResults.entries()) {
      if (!validation.valid) {
        validation.errors?.forEach(error => {
          result.errors.push({
            line: 0, // Would need to track this better
            column: 0,
            message: `Card ${index + 1}: ${error}`,
            code: 'VALIDATION_ERROR',
            severity: 'error'
          });
        });
        
        validation.warnings?.forEach(warning => {
          result.warnings.push({
            line: 0,
            column: 0,
            message: `Card ${index + 1}: ${warning}`,
            code: 'VALIDATION_WARNING',
            severity: 'warning'
          });
        });
      }
    }
    
    return result;
  }
  
  /**
   * Export flashcards to markdown
   */
  export(cards: Flashcard[], options?: ExportOptions): string {
    return this.exporter.export(cards, options);
  }
  
  /**
   * Validate markdown content without parsing
   */
  validateMarkdown(markdown: string): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    try {
      const result = this.parse(markdown);
      return {
        valid: result.errors.length === 0,
        errors: result.errors.map(e => `Line ${e.line}: ${e.message}`),
        warnings: result.warnings.map(w => `Line ${w.line}: ${w.message}`)
      };
    } catch (error) {
      return {
        valid: false,
        errors: [`Parse error: ${error}`],
        warnings: []
      };
    }
  }
  
  /**
   * Get a preview of what will be parsed
   */
  preview(markdown: string, limit = 5): {
    cards: Flashcard[];
    totalCount: number;
  } {
    const result = this.parse(markdown);
    return {
      cards: result.cards.slice(0, limit),
      totalCount: result.cards.length
    };
  }
  
  /**
   * Pre-process markdown before parsing
   */
  private preprocess(markdown: string): string {
    // Normalize line endings
    let processed = markdown.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    
    // Remove BOM if present
    if (processed.charCodeAt(0) === 0xFEFF) {
      processed = processed.slice(1);
    }
    
    // Ensure file ends with newline
    if (!processed.endsWith('\n')) {
      processed += '\n';
    }
    
    return processed;
  }
  
  /**
   * Sanitize content for safe display
   */
  sanitizeContent(content: string): string {
    // For now, just return the content as-is
    // The UI component should handle any necessary sanitization
    return content;
  }
}

// Singleton instance for backward compatibility
export const markdownProcessor = new MarkdownProcessor();