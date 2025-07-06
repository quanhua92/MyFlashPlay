import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { v4 as uuidv4 } from 'uuid';
import type { Flashcard, Difficulty } from '@/types';

export class MarkdownParser {
  parse(markdown: string): Flashcard[] {
    const lines = markdown.split('\n');
    const cards: Flashcard[] = [];
    let currentCategory = '';
    let currentSubcategory = '';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Parse headers for categories
      if (line.startsWith('# ')) {
        currentCategory = line.substring(2).trim();
        currentSubcategory = '';
      } else if (line.startsWith('## ')) {
        currentSubcategory = line.substring(3).trim();
      }
      
      // Parse flashcard formats
      else if (line.startsWith('- ')) {
        const card = this.parseCardLine(line, lines, i);
        if (card) {
          if (currentCategory) card.category = currentCategory;
          if (currentSubcategory) card.subcategory = currentSubcategory;
          cards.push(card);
          
          // Skip lines that were consumed by parseCardLine
          if (card.type === 'multiple-choice') {
            while (i + 1 < lines.length && lines[i + 1].trim().startsWith('*')) {
              i++;
            }
          }
        }
      }
    }
    
    return cards;
  }
  
  private parseCardLine(line: string, lines: string[], index: number): Flashcard | null {
    const content = line.substring(2).trim();
    
    // Advanced format with metadata
    if (index + 1 < lines.length && lines[index + 1].trim().startsWith('Front:')) {
      return this.parseAdvancedCard(lines, index);
    }
    
    // Multiple choice format
    if (index + 1 < lines.length && lines[index + 1].trim().startsWith('*')) {
      return this.parseMultipleChoice(content, lines, index + 1);
    }
    
    // True/False format (explicit)
    if (content.includes('::') && (content.includes(':: true') || content.includes(':: false'))) {
      const [front, answer] = content.split('::').map(s => s.trim());
      return {
        id: uuidv4(),
        type: 'true-false',
        front: this.sanitizeContent(front),
        back: answer,
        metadata: {
          difficulty: 'easy',
          tags: []
        }
      };
    }
    
    // Simple Q&A format: "Question :: Answer"
    if (content.includes('::')) {
      const [front, back] = content.split('::').map(s => s.trim());
      return {
        id: uuidv4(),
        type: 'simple',
        front: this.sanitizeContent(front),
        back: this.sanitizeContent(back),
        metadata: {
          difficulty: 'easy',
          tags: []
        }
      };
    }
    
    return null;
  }
  
  private parseMultipleChoice(question: string, lines: string[], startIndex: number): Flashcard | null {
    const options: { id: string; text: string; isCorrect: boolean }[] = [];
    let correctAnswer = '';
    
    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line.startsWith('*')) break;
      
      const optionText = line.substring(1).trim();
      const isCorrect = optionText.includes('[correct]');
      const cleanText = optionText.replace('[correct]', '').trim();
      
      options.push({
        id: uuidv4(),
        text: this.sanitizeContent(cleanText),
        isCorrect
      });
      
      if (isCorrect) correctAnswer = cleanText;
    }
    
    if (options.length < 2) return null;
    
    return {
      id: uuidv4(),
      type: 'multiple-choice',
      front: this.sanitizeContent(question),
      back: this.sanitizeContent(correctAnswer),
      options,
      metadata: {
        difficulty: 'medium',
        tags: []
      }
    };
  }
  
  private parseAdvancedCard(lines: string[], startIndex: number): Flashcard | null {
    const card: Partial<Flashcard> = {
      id: uuidv4(),
      type: 'simple',
      metadata: {
        difficulty: 'medium',
        tags: []
      }
    };
    
    let i = startIndex + 1;
    while (i < lines.length) {
      const line = lines[i].trim();
      
      if (line.startsWith('Front:')) {
        card.front = this.sanitizeContent(line.substring(6).trim());
      } else if (line.startsWith('Back:')) {
        card.back = this.sanitizeContent(line.substring(5).trim());
      } else if (line.startsWith('Hint:')) {
        card.metadata!.hint = line.substring(5).trim();
      } else if (line.startsWith('Explanation:')) {
        card.metadata!.explanation = line.substring(12).trim();
      } else if (line.startsWith('Difficulty:')) {
        const diff = line.substring(11).trim().toLowerCase();
        if (diff === 'easy' || diff === 'medium' || diff === 'hard') {
          card.metadata!.difficulty = diff as Difficulty;
        }
      } else if (line.startsWith('Tags:')) {
        card.metadata!.tags = line.substring(5).split(',').map(t => t.trim());
      } else if (line.startsWith('-') || line === '') {
        break;
      }
      
      i++;
    }
    
    if (!card.front || !card.back) return null;
    
    return card as Flashcard;
  }
  
  private sanitizeContent(content: string): string {
    // Check if content contains code blocks
    if (content.includes('```')) {
      return this.sanitizeWithCode(content);
    }
    
    // Convert markdown to HTML and sanitize
    const html = marked.parse(content, { async: false }) as string;
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['strong', 'em', 'code', 'pre', 'br', 'p', 'ul', 'ol', 'li'],
      ALLOWED_ATTR: ['class']
    });
  }
  
  private sanitizeWithCode(content: string): string {
    // Preserve code blocks while sanitizing
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const codeBlocks: string[] = [];
    
    // Extract code blocks
    content = content.replace(codeBlockRegex, (_, lang, code) => {
      const placeholder = `__CODE_BLOCK_${codeBlocks.length}__`;
      codeBlocks.push(`<pre><code class="language-${lang || 'plaintext'}">${this.escapeHtml(code.trim())}</code></pre>`);
      return placeholder;
    });
    
    // Sanitize the rest
    let html = marked.parse(content, { async: false }) as string;
    html = DOMPurify.sanitize(html);
    
    // Restore code blocks
    codeBlocks.forEach((block, index) => {
      html = html.replace(`__CODE_BLOCK_${index}__`, block);
    });
    
    return html;
  }
  
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}