import { Token, TokenType } from './types';

export class MarkdownLexer {
  private position = 0;
  private line = 1;
  private column = 1;
  private content: string;
  
  constructor(content: string) {
    this.content = content;
  }
  
  tokenize(): Token[] {
    const tokens: Token[] = [];
    const lines = this.content.split('\n');
    
    let inMetadataBlock = false;
    let inCodeBlock = false;
    let codeBlockLang = '';
    let codeBlockContent: string[] = [];
    let codeBlockStartLine = 0;
    
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex];
      const trimmed = line.trim();
      this.line = lineIndex + 1;
      this.column = 1;
      
      // Handle metadata block
      if (trimmed === '---') {
        if (lineIndex === 0 || inMetadataBlock) {
          inMetadataBlock = !inMetadataBlock;
          if (!inMetadataBlock && lineIndex > 0) {
            // End of metadata block
            const metadataLines = lines.slice(1, lineIndex);
            tokens.push(this.createToken(
              TokenType.METADATA_BLOCK,
              metadataLines.join('\n'),
              line
            ));
          }
          continue;
        }
      }
      
      if (inMetadataBlock) {
        continue; // Skip lines inside metadata block
      }
      
      // Handle code blocks
      if (trimmed.startsWith('```')) {
        if (!inCodeBlock) {
          inCodeBlock = true;
          codeBlockLang = trimmed.substring(3).trim();
          codeBlockContent = [];
          codeBlockStartLine = this.line;
        } else {
          inCodeBlock = false;
          tokens.push({
            type: TokenType.CODE_BLOCK,
            value: codeBlockContent.join('\n'),
            line: codeBlockStartLine,
            column: 1,
            raw: '```' + codeBlockLang + '\n' + codeBlockContent.join('\n') + '\n```',
            metadata: { language: codeBlockLang }
          });
        }
        continue;
      }
      
      if (inCodeBlock) {
        codeBlockContent.push(line);
        continue;
      }
      
      // Empty line
      if (!trimmed) {
        tokens.push(this.createToken(TokenType.EMPTY_LINE, '', line));
        continue;
      }
      
      // Headers
      if (trimmed.startsWith('### ')) {
        tokens.push(this.createToken(
          TokenType.HEADER3,
          trimmed.substring(4).trim(),
          line
        ));
        continue;
      }
      
      if (trimmed.startsWith('## ')) {
        tokens.push(this.createToken(
          TokenType.HEADER2,
          trimmed.substring(3).trim(),
          line
        ));
        continue;
      }
      
      if (trimmed.startsWith('# ')) {
        tokens.push(this.createToken(
          TokenType.HEADER1,
          trimmed.substring(2).trim(),
          line
        ));
        continue;
      }
      
      // Comments
      if (trimmed.startsWith('<!--') && trimmed.endsWith('-->')) {
        tokens.push(this.createToken(
          TokenType.COMMENT,
          trimmed.slice(4, -3).trim(),
          line
        ));
        continue;
      }
      
      // LaTeX math
      if (this.containsLatex(trimmed)) {
        tokens.push(this.createToken(TokenType.LATEX, trimmed, line));
        continue;
      }
      
      // Images
      if (this.isImageLine(trimmed)) {
        tokens.push(this.createToken(TokenType.IMAGE, trimmed, line));
        continue;
      }
      
      // Multiple choice correct answer
      if (trimmed.startsWith('> ')) {
        tokens.push(this.createToken(
          TokenType.MC_CORRECT,
          trimmed.substring(2).trim(),
          line
        ));
        continue;
      }
      
      // Multiple choice options
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        // Check if it's a list item or Q&A with dash
        if (trimmed.includes(' :: ')) {
          // It's a Q&A format with leading dash (legacy format)
          const qa = trimmed.substring(2).trim();
          const [question, answer] = qa.split(' :: ').map(s => s.trim());
          tokens.push({
            type: TokenType.QUESTION_ANSWER,
            value: qa,
            line: this.line,
            column: 1,
            raw: line,
            metadata: { question, answer }
          });
        } else {
          tokens.push(this.createToken(
            TokenType.MC_OPTION,
            trimmed.substring(2).trim(),
            line
          ));
        }
        continue;
      }
      
      // Question :: Answer format
      if (trimmed.includes(' :: ')) {
        const [question, answer] = trimmed.split(' :: ').map(s => s.trim());
        tokens.push({
          type: TokenType.QUESTION_ANSWER,
          value: trimmed,
          line: this.line,
          column: 1,
          raw: line,
          metadata: { question, answer }
        });
        continue;
      }
      
      // Check if this might be a multiple choice question
      if (this.isMultipleChoiceQuestion(lines, lineIndex)) {
        tokens.push(this.createToken(TokenType.MC_QUESTION, trimmed, line));
        continue;
      }
      
      // Default: plain text
      tokens.push(this.createToken(TokenType.TEXT, trimmed, line));
    }
    
    return tokens;
  }
  
  private createToken(type: TokenType, value: string, raw: string): Token {
    return {
      type,
      value,
      line: this.line,
      column: this.column,
      raw
    };
  }
  
  private containsLatex(line: string): boolean {
    // Check for LaTeX math delimiters
    return line.includes('$') || line.includes('\\[') || line.includes('\\(');
  }
  
  private isImageLine(line: string): boolean {
    // Check for markdown image syntax
    return /!\[.*?\]\(.*?\)/.test(line);
  }
  
  private isMultipleChoiceQuestion(lines: string[], currentIndex: number): boolean {
    if (currentIndex + 1 >= lines.length) return false;
    
    const nextLine = lines[currentIndex + 1].trim();
    return nextLine.startsWith('- ') || nextLine.startsWith('* ');
  }
}