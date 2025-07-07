import type { Flashcard } from '@/types/flashcard.types';
import type { ExportOptions, DeckMetadata } from './types';

export class MarkdownExporter {
  export(cards: Flashcard[], options?: ExportOptions): string {
    const format = options?.format || 'simple';
    
    switch (format) {
      case 'simple':
        return this.exportSimple(cards, options);
      case 'full':
        return this.exportFull(cards, options);
      case 'anki':
        return this.exportAnki(cards, options);
      case 'csv':
        return this.exportCSV(cards, options);
      default:
        return this.exportSimple(cards, options);
    }
  }
  
  private exportSimple(cards: Flashcard[], options?: ExportOptions): string {
    const lines: string[] = [];
    const lineEnding = options?.lineEnding || '\n';
    
    // Group by category
    const grouped = this.groupByCategory(cards);
    
    for (const [category, categoryCards] of grouped) {
      if (category && options?.includeMetadata !== false) {
        lines.push(`# ${category}`);
        lines.push('');
      }
      
      for (const card of categoryCards) {
        lines.push(this.cardToSimpleFormat(card));
        
        // Add metadata comments if requested
        if (options?.includeComments) {
          if (card.metadata.hint) {
            lines.push(`<!-- Hint: ${card.metadata.hint} -->`);
          }
          if (card.metadata.explanation) {
            lines.push(`<!-- Explanation: ${card.metadata.explanation} -->`);
          }
        }
        
        lines.push(''); // Empty line between cards
      }
    }
    
    return lines.join(lineEnding).trim();
  }
  
  private exportFull(cards: Flashcard[], options?: ExportOptions): string {
    const lines: string[] = [];
    const lineEnding = options?.lineEnding || '\n';
    
    // Add metadata block if available
    if (options?.includeMetadata) {
      lines.push('---');
      lines.push('title: My Flashcard Deck');
      lines.push('description: Exported flashcards');
      lines.push('emoji: 📚');
      lines.push(`created: ${new Date().toISOString()}`);
      lines.push('---');
      lines.push('');
    }
    
    // Export cards with full formatting
    const grouped = this.groupByCategory(cards);
    
    for (const [category, categoryCards] of grouped) {
      if (category) {
        lines.push(`# ${category}`);
        lines.push('');
      }
      
      // Sub-group by subcategory
      const subGrouped = this.groupBySubcategory(categoryCards);
      
      for (const [subcategory, subCards] of subGrouped) {
        if (subcategory) {
          lines.push(`## ${subcategory}`);
          lines.push('');
        }
        
        for (const card of subCards) {
          lines.push(this.cardToFullFormat(card));
          lines.push('');
        }
      }
    }
    
    // Add statistics if requested
    if (options?.includeStats) {
      lines.push('');
      lines.push('---');
      lines.push('# Statistics');
      lines.push(`Total cards: ${cards.length}`);
      lines.push(`Card types: ${this.getCardTypeStats(cards)}`);
      lines.push(`Categories: ${this.getCategoryStats(cards)}`);
    }
    
    return lines.join(lineEnding).trim();
  }
  
  private exportAnki(cards: Flashcard[], options?: ExportOptions): string {
    // Anki format: Front[TAB]Back[TAB]Tags
    const lines: string[] = [];
    const lineEnding = options?.lineEnding || '\n';
    
    for (const card of cards) {
      const front = this.escapeAnki(card.front);
      const back = this.escapeAnki(this.getFullAnswer(card));
      const tags = card.metadata.tags?.join(' ') || '';
      
      lines.push(`${front}\t${back}\t${tags}`);
    }
    
    return lines.join(lineEnding);
  }
  
  private exportCSV(cards: Flashcard[], options?: ExportOptions): string {
    const lines: string[] = [];
    const lineEnding = options?.lineEnding || '\n';
    
    // Header
    lines.push('Front,Back,Type,Category,Subcategory,Difficulty,Tags');
    
    // Data rows
    for (const card of cards) {
      const row = [
        this.escapeCSV(card.front),
        this.escapeCSV(this.getFullAnswer(card)),
        card.type,
        card.category || '',
        card.subcategory || '',
        card.metadata.difficulty || '',
        (card.metadata.tags || []).join(';')
      ];
      
      lines.push(row.join(','));
    }
    
    return lines.join(lineEnding);
  }
  
  private cardToSimpleFormat(card: Flashcard): string {
    switch (card.type) {
      case 'simple':
      case 'true-false':
        return `${card.front} :: ${card.back}`;
        
      case 'multiple-choice':
        const lines = [card.front];
        if (card.options) {
          for (const option of card.options) {
            lines.push(`- ${option.text}`);
          }
          const correct = card.options.find(opt => opt.isCorrect);
          if (correct) {
            lines.push(`> ${correct.text}`);
          }
        }
        return lines.join('\n');
        
      default:
        return `${card.front} :: ${card.back}`;
    }
  }
  
  private cardToFullFormat(card: Flashcard): string {
    const lines: string[] = [];
    
    // Main content
    lines.push(this.cardToSimpleFormat(card));
    
    // Metadata
    if (card.metadata.hint) {
      lines.push(`<!-- Hint: ${card.metadata.hint} -->`);
    }
    if (card.metadata.explanation) {
      lines.push(`<!-- Explanation: ${card.metadata.explanation} -->`);
    }
    if (card.metadata.difficulty && card.metadata.difficulty !== 'easy') {
      lines.push(`<!-- Difficulty: ${card.metadata.difficulty} -->`);
    }
    if (card.metadata.tags && card.metadata.tags.length > 0) {
      lines.push(`<!-- Tags: ${card.metadata.tags.join(', ')} -->`);
    }
    
    return lines.join('\n');
  }
  
  private getFullAnswer(card: Flashcard): string {
    if (card.type === 'multiple-choice' && card.options) {
      const correct = card.options.find(opt => opt.isCorrect);
      return correct?.text || card.back;
    }
    return card.back;
  }
  
  private groupByCategory(cards: Flashcard[]): Map<string, Flashcard[]> {
    const grouped = new Map<string, Flashcard[]>();
    
    for (const card of cards) {
      const category = card.category || '';
      if (!grouped.has(category)) {
        grouped.set(category, []);
      }
      grouped.get(category)!.push(card);
    }
    
    return grouped;
  }
  
  private groupBySubcategory(cards: Flashcard[]): Map<string, Flashcard[]> {
    const grouped = new Map<string, Flashcard[]>();
    
    for (const card of cards) {
      const subcategory = card.subcategory || '';
      if (!grouped.has(subcategory)) {
        grouped.set(subcategory, []);
      }
      grouped.get(subcategory)!.push(card);
    }
    
    return grouped;
  }
  
  private getCardTypeStats(cards: Flashcard[]): string {
    const counts: Record<string, number> = {};
    for (const card of cards) {
      counts[card.type] = (counts[card.type] || 0) + 1;
    }
    return Object.entries(counts)
      .map(([type, count]) => `${type}: ${count}`)
      .join(', ');
  }
  
  private getCategoryStats(cards: Flashcard[]): string {
    const categories = new Set<string>();
    for (const card of cards) {
      if (card.category) categories.add(card.category);
    }
    return `${categories.size} categories`;
  }
  
  private escapeAnki(text: string): string {
    // Escape HTML and special characters for Anki
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/\t/g, ' ')
      .replace(/\n/g, '<br>');
  }
  
  private escapeCSV(text: string): string {
    // Escape for CSV format
    if (text.includes(',') || text.includes('"') || text.includes('\n')) {
      return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
  }
}