import { STORAGE_KEYS } from './constants';
import { storageManager, deckStorage } from './storage';
import { markdownStorage } from './markdown-storage';
import { MarkdownParser } from './markdown-parser';
import { v4 as uuidv4 } from 'uuid';
import type { Deck } from '@/types';

export type MergeStrategy = 'replace' | 'keep-both' | 'merge-cards' | 'skip';

interface ImportResult {
  success: boolean;
  message: string;
  imported?: number;
  skipped?: number;
  errors?: string[];
}

interface ImportOptions {
  mergeStrategy: MergeStrategy;
  dryRun?: boolean;
}

export class DataImporter {
  private readonly markdownParser = new MarkdownParser();
  // Import full backup
  async importFullBackup(file: File): Promise<ImportResult> {
    try {
      const text = await this.readFile(file);
      const data = JSON.parse(text);

      // Validate backup structure
      if (!data.version || !data.data) {
        throw new Error('Invalid backup file format');
      }

      // Verify checksum if present
      if (data.checksum) {
        const calculatedChecksum = this.generateChecksum(JSON.stringify(data.data));
        if (calculatedChecksum !== data.checksum) {
          console.warn('Checksum mismatch - data may be corrupted');
        }
      }

      // Import each data type
      const results: string[] = [];
      const errors: string[] = [];

      Object.entries(data.data).forEach(([key, value]) => {
        try {
          const storageKey = STORAGE_KEYS[key.toUpperCase() as keyof typeof STORAGE_KEYS];
          if (storageKey && value) {
            storageManager.save(storageKey, value);
            results.push(`Imported ${key}`);
          }
        } catch (err) {
          errors.push(`Failed to import ${key}: ${err}`);
        }
      });

      return {
        success: errors.length === 0,
        message: `Import completed. ${results.length} sections imported.`,
        imported: results.length,
        errors: errors.length > 0 ? errors : undefined
      };
    } catch (error) {
      return {
        success: false,
        message: `Import failed: ${error}`,
        errors: [String(error)]
      };
    }
  }

  // Import decks with merge options
  async importDecks(file: File, options: ImportOptions): Promise<ImportResult> {
    try {
      const text = await this.readFile(file);
      const data = JSON.parse(text);

      let importedDecks: Deck[] = [];

      // Handle different file formats
      if (data.type === 'decks' && data.data) {
        // Our export format
        importedDecks = data.data.decks || [];
      } else if (Array.isArray(data)) {
        // Direct array of decks
        importedDecks = data;
      } else if (data.decks && Array.isArray(data.decks)) {
        // Object with decks property
        importedDecks = data.decks;
      } else {
        throw new Error('Invalid deck file format');
      }

      // Validate decks
      const validDecks = importedDecks.filter(deck => 
        deck && deck.name && Array.isArray(deck.cards)
      );

      if (validDecks.length === 0) {
        throw new Error('No valid decks found in file');
      }

      // Get existing decks
      const existingDecks = deckStorage.load();
      
      // Preview or execute merge
      const result = this.mergeDecks(existingDecks, validDecks, options);

      if (!options.dryRun) {
        // Save merged decks
        deckStorage.save(result.decks);
      }

      return {
        success: true,
        message: options.dryRun ? 'Preview generated' : 'Decks imported successfully',
        imported: result.imported,
        skipped: result.skipped
      };
    } catch (error) {
      return {
        success: false,
        message: `Import failed: ${error}`,
        errors: [String(error)]
      };
    }
  }

  // Merge deck arrays based on strategy
  private mergeDecks(
    existing: Deck[], 
    imported: Deck[], 
    options: ImportOptions
  ): { decks: Deck[]; imported: number; skipped: number } {
    const result: Deck[] = [...existing];
    let importedCount = 0;
    let skippedCount = 0;

    imported.forEach(importDeck => {
      const existingIndex = existing.findIndex(
        deck => deck.name === importDeck.name
      );

      if (existingIndex === -1) {
        // New deck - always import
        importDeck.id = uuidv4(); // Generate new ID
        result.push(importDeck);
        importedCount++;
      } else {
        // Duplicate found - apply strategy
        switch (options.mergeStrategy) {
          case 'replace':
            importDeck.id = existing[existingIndex].id; // Keep same ID
            result[existingIndex] = importDeck;
            importedCount++;
            break;

          case 'keep-both':
            importDeck.id = uuidv4();
            importDeck.name = `${importDeck.name} (Imported)`;
            result.push(importDeck);
            importedCount++;
            break;

          case 'merge-cards':
            const merged = this.mergeCards(existing[existingIndex], importDeck);
            result[existingIndex] = merged;
            importedCount++;
            break;

          case 'skip':
            skippedCount++;
            break;
        }
      }
    });

    return { decks: result, imported: importedCount, skipped: skippedCount };
  }

  // Merge cards from two decks
  private mergeCards(existingDeck: Deck, importDeck: Deck): Deck {
    const existingCardMap = new Map(
      existingDeck.cards.map(card => [card.front, card])
    );

    // Add new cards from import
    importDeck.cards.forEach(card => {
      if (!existingCardMap.has(card.front)) {
        card.id = uuidv4(); // New ID for imported cards
        existingDeck.cards.push(card);
      }
    });

    // Update metadata
    existingDeck.metadata.lastModified = new Date().toISOString();
    
    return existingDeck;
  }

  // Read file as text
  private readFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        resolve(text);
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  // Checksum for validation
  private generateChecksum(data: string): string {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }

  // Import markdown file
  async importMarkdownFile(file: File, options: ImportOptions): Promise<ImportResult> {
    try {
      const text = await this.readFile(file);
      
      // Detect if it's a single deck or multiple decks
      const decks = this.parseMarkdownContent(text, file.name);
      
      if (decks.length === 0) {
        throw new Error('No valid decks found in markdown file');
      }

      // Get existing decks from markdown storage
      const { decks: existingDecks } = markdownStorage.loadAllDecks();
      
      // Preview or execute merge
      const result = this.mergeDecksToMarkdownStorage(existingDecks, decks, options);

      if (!options.dryRun) {
        // Save merged decks to markdown storage
        for (const deck of result.decks) {
          const saveResult = markdownStorage.saveDeck(deck);
          if (!saveResult.success) {
            console.error(`Failed to save deck ${deck.name}:`, saveResult.error);
          }
        }
      }

      return {
        success: true,
        message: options.dryRun ? 'Preview generated' : 'Markdown imported successfully',
        imported: result.imported,
        skipped: result.skipped
      };
    } catch (error) {
      return {
        success: false,
        message: `Markdown import failed: ${error}`,
        errors: [String(error)]
      };
    }
  }

  // Import multiple markdown files
  async importMultipleMarkdownFiles(files: FileList, options: ImportOptions): Promise<ImportResult> {
    try {
      const allDecks: Deck[] = [];
      const errors: string[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.name.endsWith('.md') || file.name.endsWith('.txt')) {
          try {
            const text = await this.readFile(file);
            const decks = this.parseMarkdownContent(text, file.name);
            allDecks.push(...decks);
          } catch (error) {
            errors.push(`Failed to import ${file.name}: ${error}`);
          }
        }
      }

      if (allDecks.length === 0) {
        throw new Error('No valid decks found in any markdown files');
      }

      // Get existing decks from markdown storage
      const { decks: existingDecks } = markdownStorage.loadAllDecks();
      
      // Preview or execute merge
      const result = this.mergeDecksToMarkdownStorage(existingDecks, allDecks, options);

      if (!options.dryRun) {
        // Save merged decks to markdown storage
        for (const deck of result.decks) {
          const saveResult = markdownStorage.saveDeck(deck);
          if (!saveResult.success) {
            console.error(`Failed to save deck ${deck.name}:`, saveResult.error);
          }
        }
      }

      return {
        success: true,
        message: options.dryRun ? 'Preview generated' : `Imported ${result.imported} decks from ${files.length} files`,
        imported: result.imported,
        skipped: result.skipped,
        errors: errors.length > 0 ? errors : undefined
      };
    } catch (error) {
      return {
        success: false,
        message: `Multiple file import failed: ${error}`,
        errors: [String(error)]
      };
    }
  }

  // Parse markdown content into deck(s)
  private parseMarkdownContent(text: string, filename: string): Deck[] {
    const decks: Deck[] = [];
    
    // Check if it's a multi-deck export (has separator lines)
    if (text.includes('==================== ') || text.includes('---')) {
      // Try to split by separators
      const sections = text.split(/(?:^|\n)(?:={20,}.*?={20,}|---+)\s*\n/);
      
      for (const section of sections) {
        if (section.trim()) {
          try {
            const deck = this.createDeckFromMarkdown(section.trim(), filename);
            if (deck) {
              decks.push(deck);
            }
          } catch (error) {
            console.error('Failed to parse section:', error);
          }
        }
      }
    } else {
      // Single deck file
      const deck = this.createDeckFromMarkdown(text, filename);
      if (deck) {
        decks.push(deck);
      }
    }
    
    return decks;
  }

  // Create deck from markdown text
  private createDeckFromMarkdown(markdown: string, filename: string): Deck | null {
    try {
      const cards = this.markdownParser.parse(markdown);
      
      if (cards.length === 0) {
        return null;
      }
      
      // Extract deck info from markdown
      const lines = markdown.split('\n');
      const titleLine = lines.find(line => line.startsWith('# '));
      const descriptionLine = lines.find((line, index) => {
        return index > 0 && line.trim() && !line.startsWith('#') && !line.startsWith('-');
      });
      
      const fullTitle = titleLine ? titleLine.substring(2).trim() : filename.replace(/\.(md|txt)$/, '');
      const emoji = this.extractEmoji(fullTitle) || '📚';
      const name = fullTitle.replace(/^[^\w]+\s*/, ''); // Remove emoji
      const description = descriptionLine?.trim() || '';
      
      return {
        id: uuidv4(),
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
      console.error('Failed to create deck from markdown:', error);
      return null;
    }
  }

  // Extract emoji from title
  private extractEmoji(title: string): string | null {
    const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u;
    const match = title.match(emojiRegex);
    return match ? match[0] : null;
  }

  // Merge deck arrays for markdown storage
  private mergeDecksToMarkdownStorage(
    existing: Deck[], 
    imported: Deck[], 
    options: ImportOptions
  ): { decks: Deck[]; imported: number; skipped: number } {
    const result: Deck[] = [...existing];
    let importedCount = 0;
    let skippedCount = 0;

    imported.forEach(importDeck => {
      const existingIndex = existing.findIndex(
        deck => deck.name === importDeck.name
      );

      if (existingIndex === -1) {
        // New deck - always import
        result.push(importDeck);
        importedCount++;
      } else {
        // Duplicate found - apply strategy
        switch (options.mergeStrategy) {
          case 'replace':
            importDeck.id = existing[existingIndex].id; // Keep same ID
            result[existingIndex] = importDeck;
            importedCount++;
            break;

          case 'keep-both':
            importDeck.name = `${importDeck.name} (Imported)`;
            result.push(importDeck);
            importedCount++;
            break;

          case 'merge-cards':
            const merged = this.mergeCards(existing[existingIndex], importDeck);
            result[existingIndex] = merged;
            importedCount++;
            break;

          case 'skip':
            skippedCount++;
            break;
        }
      }
    });

    return { decks: result, imported: importedCount, skipped: skippedCount };
  }

  // Preview import changes (updated for markdown support)
  async previewImport(file: File): Promise<{
    existing: number;
    new: number;
    duplicates: string[];
  }> {
    try {
      const text = await this.readFile(file);
      let importedDecks: Deck[] = [];
      
      // Check if it's markdown or JSON
      if (file.name.endsWith('.md') || file.name.endsWith('.txt')) {
        importedDecks = this.parseMarkdownContent(text, file.name);
      } else {
        // JSON format
        const data = JSON.parse(text);
        
        if (data.type === 'decks' && data.data) {
          importedDecks = data.data.decks || [];
        } else if (Array.isArray(data)) {
          importedDecks = data;
        } else if (data.decks) {
          importedDecks = data.decks;
        }
      }

      // Get existing decks from both storages
      const jsonDecks = deckStorage.load();
      const { decks: markdownDecks } = markdownStorage.loadAllDecks();
      const existingDecks = [...jsonDecks, ...markdownDecks];
      
      const existingNames = new Set(existingDecks.map(d => d.name));
      
      const duplicates = importedDecks
        .filter(deck => existingNames.has(deck.name))
        .map(deck => deck.name);

      const newCount = importedDecks.filter(
        deck => !existingNames.has(deck.name)
      ).length;

      return {
        existing: existingDecks.length,
        new: newCount,
        duplicates
      };
    } catch (error) {
      throw new Error(`Preview failed: ${error}`);
    }
  }
}

export const dataImporter = new DataImporter();