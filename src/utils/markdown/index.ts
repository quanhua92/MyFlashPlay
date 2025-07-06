export * from './types';
export * from './lexer';
export * from './parser';
export * from './validator';
export * from './exporter';
export * from './processor';

// Re-export the main processor for convenience
import { markdownProcessor } from './processor';
export { markdownProcessor };

// For backward compatibility with existing code
export class MarkdownParser {
  parse(markdown: string) {
    const result = markdownProcessor.parse(markdown);
    return result.cards;
  }
  
  sanitizeContent(content: string) {
    return markdownProcessor.sanitizeContent(content);
  }
}