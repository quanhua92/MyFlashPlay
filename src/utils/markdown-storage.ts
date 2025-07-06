import { storageManager } from './storage';
import { MarkdownParser } from './markdown';
import type { Deck } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export interface MarkdownStorageResult {
  success: boolean;
  error?: string;
  recoverable?: boolean;
  corruptedData?: string;
}

export class MarkdownStorage {
  private readonly parser = new MarkdownParser();
  private readonly PREFIX = 'mdoc_';
  private readonly INDEX_KEY = 'mdoc_index';

  // Save deck as markdown
  saveDeck(deck: Deck): MarkdownStorageResult {
    try {
      const markdown = this.deckToMarkdown(deck);
      const key = `${this.PREFIX}${deck.id}`;
      
      // Create backup before saving
      this.createBackup(key);
      
      // Save markdown content
      localStorage.setItem(key, markdown);
      
      // Update index
      this.updateIndex(deck.id, deck.name, deck.emoji);
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `Failed to save deck: ${error}`,
        recoverable: true
      };
    }
  }

  // Save deck from markdown content directly
  saveDeckFromMarkdown(markdown: string, deckName?: string): MarkdownStorageResult {
    try {
      const deckId = uuidv4();
      const key = `${this.PREFIX}${deckId}`;
      
      // Validate markdown
      if (!this.validateMarkdown(markdown)) {
        return {
          success: false,
          error: 'Invalid markdown format',
          recoverable: true
        };
      }
      
      // Extract deck info from markdown
      const lines = markdown.split('\n');
      const titleLine = lines.find(line => line.startsWith('# '));
      const fullTitle = titleLine ? titleLine.substring(2).trim() : (deckName || 'Untitled Deck');
      const emoji = this.extractEmoji(fullTitle) || '📚';
      const name = fullTitle.replace(/^[^\w]+\s*/, ''); // Remove emoji
      
      // Save markdown content
      localStorage.setItem(key, markdown);
      
      // Update index
      this.updateIndex(deckId, name, emoji);
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `Failed to save deck from markdown: ${error}`,
        recoverable: true
      };
    }
  }

  // Load deck from markdown
  loadDeck(deckId: string): { deck: Deck | null; result: MarkdownStorageResult } {
    try {
      const key = `${this.PREFIX}${deckId}`;
      const markdown = localStorage.getItem(key);
      
      if (!markdown) {
        return {
          deck: null,
          result: { success: false, error: 'Deck not found' }
        };
      }

      // Validate markdown format
      if (!this.validateMarkdown(markdown)) {
        return {
          deck: null,
          result: {
            success: false,
            error: 'Corrupted markdown format',
            recoverable: true,
            corruptedData: markdown
          }
        };
      }

      const deck = this.markdownToDeck(deckId, markdown);
      
      if (!deck) {
        return {
          deck: null,
          result: {
            success: false,
            error: 'Failed to parse markdown',
            recoverable: true,
            corruptedData: markdown
          }
        };
      }

      return {
        deck,
        result: { success: true }
      };
    } catch (error) {
      return {
        deck: null,
        result: {
          success: false,
          error: `Load error: ${error}`,
          recoverable: false
        }
      };
    }
  }

  // Load all decks
  loadAllDecks(): { decks: Deck[]; errors: Array<{ id: string; error: string }> } {
    const index = this.getIndex();
    const decks: Deck[] = [];
    const errors: Array<{ id: string; error: string }> = [];

    index.forEach(entry => {
      const { deck, result } = this.loadDeck(entry.id);
      
      if (deck) {
        decks.push(deck);
      } else {
        errors.push({
          id: entry.id,
          error: result.error || 'Unknown error'
        });
      }
    });

    return { decks, errors };
  }

  // Delete deck
  deleteDeck(deckId: string): MarkdownStorageResult {
    try {
      const key = `${this.PREFIX}${deckId}`;
      
      // Create backup before deletion
      this.createBackup(key);
      
      // Remove deck
      localStorage.removeItem(key);
      
      // Update index
      this.removeFromIndex(deckId);
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `Failed to delete deck: ${error}`,
        recoverable: true
      };
    }
  }

  // Get deck index for listing
  getIndex(): Array<{ id: string; name: string; emoji: string; lastModified: string }> {
    try {
      const indexData = localStorage.getItem(this.INDEX_KEY);
      return indexData ? JSON.parse(indexData) : [];
    } catch (error) {
      console.error('Failed to load deck index:', error);
      return this.rebuildIndex();
    }
  }

  // Rebuild index from existing decks
  private rebuildIndex(): Array<{ id: string; name: string; emoji: string; lastModified: string }> {
    const index: Array<{ id: string; name: string; emoji: string; lastModified: string }> = [];
    
    // Scan localStorage for deck keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(this.PREFIX)) {
        const deckId = key.substring(this.PREFIX.length);
        const markdown = localStorage.getItem(key);
        
        if (markdown) {
          try {
            // Extract deck info from markdown
            const lines = markdown.split('\n');
            const titleLine = lines.find(line => line.startsWith('# '));
            const name = titleLine ? titleLine.substring(2).trim() : 'Untitled Deck';
            const emoji = this.extractEmoji(name) || '📚';
            
            index.push({
              id: deckId,
              name: name.replace(/^[^\w]+\s*/, ''), // Remove emoji from name
              emoji,
              lastModified: new Date().toISOString()
            });
          } catch (error) {
            console.error(`Failed to parse deck ${deckId}:`, error);
          }
        }
      }
    }
    
    // Save rebuilt index
    try {
      localStorage.setItem(this.INDEX_KEY, JSON.stringify(index));
    } catch (error) {
      console.error('Failed to save rebuilt index:', error);
    }
    
    return index;
  }

  // Update deck index
  private updateIndex(deckId: string, name: string, emoji: string): void {
    try {
      const index = this.getIndex();
      const existingIndex = index.findIndex(entry => entry.id === deckId);
      
      const entry = {
        id: deckId,
        name,
        emoji,
        lastModified: new Date().toISOString()
      };
      
      if (existingIndex >= 0) {
        index[existingIndex] = entry;
      } else {
        index.push(entry);
      }
      
      localStorage.setItem(this.INDEX_KEY, JSON.stringify(index));
    } catch (error) {
      console.error('Failed to update index:', error);
    }
  }

  // Remove from deck index
  private removeFromIndex(deckId: string): void {
    try {
      const index = this.getIndex();
      const filtered = index.filter(entry => entry.id !== deckId);
      localStorage.setItem(this.INDEX_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Failed to remove from index:', error);
    }
  }

  // Convert deck to markdown
  private deckToMarkdown(deck: Deck): string {
    let markdown = `# ${deck.emoji} ${deck.name}\n\n`;
    
    if (deck.description) {
      markdown += `${deck.description}\n\n`;
    }
    
    // Group cards by category  
    const categoryMap = new Map<string, typeof deck.cards>();
    
    deck.cards.forEach(card => {
      const category = card.category || 'General';
      if (!categoryMap.has(category)) {
        categoryMap.set(category, []);
      }
      categoryMap.get(category)!.push(card);
    });
    
    // Write cards by category
    categoryMap.forEach((cards, category) => {
      if (category !== 'General') {
        markdown += `## ${category}\n\n`;
      }
      
      cards.forEach(card => {
        if (card.type === 'simple') {
          markdown += `${card.front} :: ${card.back}\n`;
        } else if (card.type === 'multiple-choice' && card.options) {
          markdown += `${card.front}\n`;
          card.options.forEach((option: any) => {
            markdown += `* ${option.text}${option.isCorrect ? ' [correct]' : ''}\n`;
          });
        } else if (card.type === 'true-false') {
          markdown += `${card.front} :: ${card.back}\n`;
        }
        
        // Add metadata as comments
        if (card.metadata?.hint) {
          markdown += `  <!-- Hint: ${card.metadata.hint} -->\n`;
        }
        if (card.metadata?.explanation) {
          markdown += `  <!-- Explanation: ${card.metadata.explanation} -->\n`;
        }
        
        markdown += '\n';
      });
      
      markdown += '\n';
    });
    
    return markdown.trim();
  }

  // Convert markdown to deck
  private markdownToDeck(deckId: string, markdown: string): Deck | null {
    try {
      const cards = this.parser.parse(markdown);
      
      if (cards.length === 0) {
        return null;
      }
      
      // Extract deck info from markdown
      const lines = markdown.split('\n');
      const titleLine = lines.find(line => line.startsWith('# '));
      const descriptionLine = lines.find((line, index) => {
        return index > 0 && line.trim() && !line.startsWith('#') && !line.startsWith('-');
      });
      
      const fullTitle = titleLine ? titleLine.substring(2).trim() : 'Untitled Deck';
      const emoji = this.extractEmoji(fullTitle) || '📚';
      const name = fullTitle.replace(/^[^\w]+\s*/, ''); // Remove emoji
      const description = descriptionLine?.trim() || '';
      
      return {
        id: deckId,
        name,
        description,
        emoji,
        cards,
        metadata: {
          createdAt: new Date().toISOString(),
          lastModified: new Date().toISOString(),
          playCount: 0,
          source: 'imported',
          originalMarkdown: markdown,
          tags: [],
          difficulty: 'beginner',
          estimatedTime: Math.ceil(cards.length / 10) * 5
        },
        settings: {
          shuffleCards: true,
          repeatIncorrect: true,
          studyMode: 'random'
        }
      };
    } catch (error) {
      console.error('Failed to convert markdown to deck:', error);
      return null;
    }
  }

  // Validate markdown format
  private validateMarkdown(markdown: string): boolean {
    try {
      // Basic validation checks
      if (!markdown || typeof markdown !== 'string') {
        return false;
      }
      
      // Must have at least one card (simplified check)
      const hasCard = markdown.includes(' :: ');
      
      return hasCard;
    } catch {
      return false;
    }
  }

  // Extract emoji from title
  private extractEmoji(title: string): string | null {
    const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u;
    const match = title.match(emojiRegex);
    return match ? match[0] : null;
  }

  // Create backup before operations
  private createBackup(key: string): void {
    try {
      const existing = localStorage.getItem(key);
      if (existing) {
        const backupKey = `${key}_backup_${Date.now()}`;
        localStorage.setItem(backupKey, existing);
        
        // Clean old backups (keep only last 3)
        this.cleanupBackups(key);
      }
    } catch (error) {
      console.error('Failed to create backup:', error);
    }
  }

  // Cleanup old backups
  private cleanupBackups(key: string): void {
    try {
      const backupKeys: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const storageKey = localStorage.key(i);
        if (storageKey?.startsWith(`${key}_backup_`)) {
          backupKeys.push(storageKey);
        }
      }
      
      // Sort by timestamp and keep only last 3
      backupKeys.sort().reverse();
      backupKeys.slice(3).forEach(backupKey => {
        localStorage.removeItem(backupKey);
      });
    } catch (error) {
      console.error('Failed to cleanup backups:', error);
    }
  }

  // Get storage usage info
  getStorageInfo(): {
    deckCount: number;
    totalSize: number;
    breakdown: Array<{ id: string; name: string; size: number }>;
  } {
    const index = this.getIndex();
    const breakdown: Array<{ id: string; name: string; size: number }> = [];
    let totalSize = 0;
    
    index.forEach(entry => {
      try {
        const key = `${this.PREFIX}${entry.id}`;
        const content = localStorage.getItem(key);
        const size = content ? content.length * 2 : 0; // UTF-16 characters
        
        breakdown.push({
          id: entry.id,
          name: entry.name,
          size
        });
        
        totalSize += size;
      } catch (error) {
        console.error(`Failed to get size for deck ${entry.id}:`, error);
      }
    });
    
    return {
      deckCount: index.length,
      totalSize,
      breakdown
    };
  }

  // Migrate from JSON storage
  async migrateFromJSON(): Promise<{ success: boolean; migrated: number; errors: string[] }> {
    try {
      const jsonDecks = storageManager.load<any>('flashplay_decks');
      const errors: string[] = [];
      let migrated = 0;
      
      if (!jsonDecks) {
        return { success: true, migrated: 0, errors: [] };
      }
      
      // Handle both array and object formats
      const decks = Array.isArray(jsonDecks) ? jsonDecks : jsonDecks.decks || [];
      
      for (const deck of decks) {
        try {
          if (deck.id && deck.name && Array.isArray(deck.cards)) {
            const result = this.saveDeck(deck);
            if (result.success) {
              migrated++;
            } else {
              errors.push(`Failed to migrate ${deck.name}: ${result.error}`);
            }
          }
        } catch (error) {
          errors.push(`Failed to migrate deck: ${error}`);
        }
      }
      
      return { success: errors.length === 0, migrated, errors };
    } catch (error) {
      return {
        success: false,
        migrated: 0,
        errors: [`Migration failed: ${error}`]
      };
    }
  }
}

export const markdownStorage = new MarkdownStorage();