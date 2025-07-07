import { storageManager } from './storage';
import { markdownProcessor } from './markdown';
import type { Deck } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export interface MarkdownStorageResult {
  success: boolean;
  error?: string;
  recoverable?: boolean;
  corruptedData?: string;
}

export class MarkdownStorage {
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
      
      // IMPORTANT: Deck title comes from deckName parameter ONLY
      // # headers in markdown are for categories/sections, NOT deck titles
      const fullTitle = deckName || 'Untitled Deck';
      const emoji = this.extractEmoji(fullTitle) || '📚';
      // Use the deck name exactly as provided (preserving parentheses, etc)
      const name = fullTitle;
      
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
    console.log(`[MarkdownStorage] loadDeck called with deckId: ${deckId}`);
    try {
      const key = `${this.PREFIX}${deckId}`;
      console.log(`[MarkdownStorage] Looking for key: ${key}`);
      const markdown = localStorage.getItem(key);
      console.log(`[MarkdownStorage] Found markdown:`, {
        found: !!markdown,
        length: markdown?.length || 0,
        preview: markdown?.substring(0, 100) + '...'
      });
      
      if (!markdown) {
        console.log(`[MarkdownStorage] No markdown found for key: ${key}`);
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

      // Get deck metadata from index
      const index = this.getIndex();
      console.log(`[MarkdownStorage] Current index:`, index);
      const deckMetadata = index.find(entry => entry.id === deckId);
      console.log(`[MarkdownStorage] Found metadata:`, deckMetadata);
      
      const deck = this.markdownToDeck(deckId, markdown, deckMetadata?.name, deckMetadata?.emoji);
      console.log(`[MarkdownStorage] Converted to deck:`, {
        found: !!deck,
        id: deck?.id,
        name: deck?.name,
        cardCount: deck?.cards?.length
      });
      
      if (!deck) {
        console.log(`[MarkdownStorage] Failed to parse markdown`);
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

      console.log(`[MarkdownStorage] Successfully loaded deck ${deckId}`);
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
    console.log('[MarkdownStorage] loadAllDecks called');
    const index = this.getIndex();
    console.log('[MarkdownStorage] Loading decks from index:', index.map(e => ({ id: e.id, name: e.name })));
    const decks: Deck[] = [];
    const errors: Array<{ id: string; error: string }> = [];

    index.forEach(entry => {
      console.log(`[MarkdownStorage] Loading deck from index: ${entry.id} - ${entry.name}`);
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

    console.log('[MarkdownStorage] loadAllDecks complete:', {
      deckCount: decks.length,
      errorCount: errors.length
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
    console.log('[MarkdownStorage] getIndex called');
    try {
      const indexData = localStorage.getItem(this.INDEX_KEY);
      console.log(`[MarkdownStorage] Index data found:`, {
        found: !!indexData,
        length: indexData?.length || 0
      });
      const parsed = indexData ? JSON.parse(indexData) : [];
      console.log(`[MarkdownStorage] Parsed index:`, parsed);
      return parsed;
    } catch (error) {
      console.error('[MarkdownStorage] Failed to load deck index:', error);
      console.log('[MarkdownStorage] Rebuilding index...');
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
  private markdownToDeck(deckId: string, markdown: string, providedName?: string, providedEmoji?: string): Deck | null {
    try {
      console.log(`[MarkdownStorage markdownToDeck] Processing deck ${deckId}:`, {
        markdownLength: markdown.length,
        providedName,
        providedEmoji,
        markdownPreview: markdown.substring(0, 200) + '...'
      });
      
      const parseResult = markdownProcessor.parse(markdown);
      const cards = parseResult.cards;
      
      console.log(`[MarkdownStorage markdownToDeck] Parse result for ${deckId}:`, {
        cardCount: cards.length,
        parseErrors: parseResult.errors?.length || 0,
        firstThreeCards: cards.slice(0, 3).map(card => ({
          type: card.type,
          front: card.front.substring(0, 50) + '...',
          back: card.back.substring(0, 50) + '...'
        }))
      });
      
      if (cards.length === 0) {
        console.log(`[MarkdownStorage markdownToDeck] No cards found for ${deckId}`);
        return null;
      }
      
      // IMPORTANT: Use provided name/emoji from index, NOT from markdown content
      // # headers in markdown are for categories/sections only
      const name = providedName || 'Untitled Deck';
      const emoji = providedEmoji || '📚';
      
      // Description can be extracted from first non-header line if needed
      const lines = markdown.split('\n');
      const descriptionLine = lines.find((line, index) => {
        return index > 0 && line.trim() && !line.startsWith('#') && !line.startsWith('-') && !line.includes('::');
      });
      const description = descriptionLine?.trim() || '';
      
      const finalDeck = {
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
      
      console.log(`[MarkdownStorage markdownToDeck] Final deck for ${deckId}:`, {
        id: finalDeck.id,
        name: finalDeck.name,
        cardCount: finalDeck.cards.length,
        originalMarkdownLength: finalDeck.metadata.originalMarkdown.length
      });
      
      return finalDeck;
    } catch (error) {
      console.error('Failed to convert markdown to deck:', error);
      return null;
    }
  }

  // Validate markdown format using v2 processor
  private validateMarkdown(markdown: string): boolean {
    try {
      // Basic validation checks
      if (!markdown || typeof markdown !== 'string') {
        return false;
      }
      
      // Use the v2 processor to validate
      const parseResult = markdownProcessor.parse(markdown);
      return parseResult.cards.length > 0 && parseResult.errors.length === 0;
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