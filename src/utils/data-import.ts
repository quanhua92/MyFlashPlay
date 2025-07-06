import { storageManager } from './storage';
import { markdownStorage } from './markdown-storage';
import { MarkdownParser } from './markdown-parser';
import { v4 as uuidv4 } from 'uuid';
import type { Deck } from '@/types';
import JSZip from 'jszip';

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
  
  // Import markdown ZIP file (new primary import method)
  async importMarkdownZip(file: File, options: ImportOptions): Promise<ImportResult> {
    try {
      const zip = new JSZip();
      const zipData = await file.arrayBuffer();
      const zipContents = await zip.loadAsync(zipData);
      
      const results: string[] = [];
      const errors: string[] = [];
      const importedDecks: Deck[] = [];
      
      // Process deck files
      const decksFolder = zipContents.folder('decks');
      if (decksFolder) {
        const deckFiles = Object.keys(decksFolder.files).filter(name => 
          name.endsWith('.md') && !decksFolder.files[name].dir
        );
        
        for (const filename of deckFiles) {
          try {
            const content = await decksFolder.file(filename)?.async('text');
            if (content) {
              const deck = this.createDeckFromMarkdown(content, filename);
              if (deck) {
                importedDecks.push(deck);
                results.push(`Imported deck: ${deck.name}`);
              }
            }
          } catch (err) {
            errors.push(`Failed to import deck ${filename}: ${err}`);
          }
        }
      }
      
      // Process progress file
      const progressFile = zipContents.file('progress.md');
      if (progressFile) {
        try {
          await progressFile.async('text');
          // Progress is informational only, we don't import it back
          results.push('Progress data found (informational only)');
        } catch (err) {
          errors.push(`Failed to read progress: ${err}`);
        }
      }
      
      // Process achievements file
      const achievementsFile = zipContents.file('achievements.md');
      if (achievementsFile) {
        try {
          await achievementsFile.async('text');
          // Achievements are informational only, we don't import them back
          results.push('Achievements data found (informational only)');
        } catch (err) {
          errors.push(`Failed to read achievements: ${err}`);
        }
      }
      
      // Process preferences file
      const preferencesFile = zipContents.file('preferences.md');
      if (preferencesFile) {
        try {
          await preferencesFile.async('text');
          // Preferences are informational only, we don't import them back
          results.push('Preferences data found (informational only)');
        } catch (err) {
          errors.push(`Failed to read preferences: ${err}`);
        }
      }
      
      if (importedDecks.length === 0) {
        throw new Error('No valid decks found in ZIP file');
      }
      
      // Get existing decks from markdown storage
      const { decks: existingDecks } = markdownStorage.loadAllDecks();
      
      // Preview or execute merge
      const result = this.mergeDecksToMarkdownStorage(existingDecks, importedDecks, options);
      
      if (!options.dryRun) {
        // Save merged decks to markdown storage
        for (const deck of result.decks) {
          const saveResult = markdownStorage.saveDeck(deck);
          if (!saveResult.success) {
            errors.push(`Failed to save deck ${deck.name}: ${saveResult.error}`);
          }
        }
      }
      
      return {
        success: errors.length === 0,
        message: options.dryRun ? 'ZIP preview generated' : `ZIP import completed. ${result.imported} decks imported.`,
        imported: result.imported,
        skipped: result.skipped,
        errors: errors.length > 0 ? errors : undefined
      };
    } catch (error) {
      return {
        success: false,
        message: `ZIP import failed: ${error}`,
        errors: [String(error)]
      };
    }
  }
  
  // Legacy import for old JSON backups (for migration only)
  async importLegacyJsonBackup(file: File): Promise<ImportResult> {
    try {
      const text = await this.readFile(file);
      const data = JSON.parse(text);

      // Validate backup structure
      if (!data.version || !data.data) {
        throw new Error('Invalid backup file format');
      }

      // Only migrate deck data, ignore old JSON storage keys
      const results: string[] = [];
      const errors: string[] = [];
      
      // Convert old JSON decks to markdown storage
      if (data.data.decks) {
        let oldDecks: any[] = [];
        
        if (Array.isArray(data.data.decks)) {
          oldDecks = data.data.decks;
        } else if (data.data.decks.decks && Array.isArray(data.data.decks.decks)) {
          oldDecks = data.data.decks.decks;
        }
        
        if (oldDecks.length > 0) {
          // Convert each old deck to markdown and save
          for (const oldDeck of oldDecks) {
            try {
              const markdownContent = this.convertDeckToMarkdown(oldDeck);
              if (markdownContent) {
                const saveResult = markdownStorage.saveDeckFromMarkdown(markdownContent, oldDeck.name);
                if (saveResult.success) {
                  results.push(`Migrated deck: ${oldDeck.name}`);
                } else {
                  errors.push(`Failed to migrate deck ${oldDeck.name}: ${saveResult.error}`);
                }
              }
            } catch (err) {
              errors.push(`Failed to convert deck ${oldDeck.name}: ${err}`);
            }
          }
        }
      }
      
      return {
        success: errors.length === 0,
        message: `Legacy import completed. ${results.length} decks migrated to markdown format.`,
        imported: results.length,
        errors: errors.length > 0 ? errors : undefined
      };
    } catch (error) {
      return {
        success: false,
        message: `Legacy import failed: ${error}`,
        errors: [String(error)]
      };
    }
  }

  // Universal import method - handles ZIP, markdown, and legacy JSON
  async importFile(file: File, options: ImportOptions): Promise<ImportResult> {
    try {
      if (file.name.endsWith('.zip')) {
        return this.importMarkdownZip(file, options);
      } else if (file.name.endsWith('.md') || file.name.endsWith('.txt')) {
        return this.importMarkdownFile(file, options);
      } else if (file.name.endsWith('.json')) {
        return this.importLegacyJsonBackup(file);
      } else {
        throw new Error('Unsupported file format. Please use .zip, .md, or .json files.');
      }
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

  // Convert old JSON deck to markdown format
  private convertDeckToMarkdown(oldDeck: any): string | null {
    try {
      let markdown = `# ${oldDeck.emoji || '📚'} ${oldDeck.name}\n\n`;
      
      if (oldDeck.description) {
        markdown += `${oldDeck.description}\n\n`;
      }
      
      if (!oldDeck.cards || oldDeck.cards.length === 0) {
        return null;
      }
      
      // Group cards by category
      const categories = new Map<string, any[]>();
      oldDeck.cards.forEach((card: any) => {
        const category = card.category || 'General';
        if (!categories.has(category)) {
          categories.set(category, []);
        }
        categories.get(category)!.push(card);
      });
      
      // Convert cards to markdown
      categories.forEach((cards, category) => {
        if (category !== 'General') {
          markdown += `## ${category}\n\n`;
        }
        
        cards.forEach(card => {
          if (card.type === 'simple') {
            markdown += `- ${card.front} :: ${card.back}\n`;
          } else if (card.type === 'multiple-choice' && card.options) {
            markdown += `- ${card.front}\n`;
            card.options.forEach((opt: any) => {
              markdown += `  - ${opt.text}\n`;
            });
            // Find correct answer
            const correctOption = card.options.find((opt: any) => opt.isCorrect);
            if (correctOption) {
              markdown += `  > ${correctOption.text}\n`;
            }
          } else if (card.type === 'true-false') {
            markdown += `- ${card.front} :: ${card.back}\n`;
          }
        });
        
        markdown += '\n';
      });
      
      return markdown;
    } catch (error) {
      console.error('Error converting deck to markdown:', error);
      return null;
    }
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
      let importedDecks: Deck[] = [];
      
      // Check if it's ZIP, markdown, or legacy JSON
      if (file.name.endsWith('.zip')) {
        // ZIP file
        const zip = new JSZip();
        const zipData = await file.arrayBuffer();
        const zipContents = await zip.loadAsync(zipData);
        
        const decksFolder = zipContents.folder('decks');
        if (decksFolder) {
          const deckFiles = Object.keys(decksFolder.files).filter(name => 
            name.endsWith('.md') && !decksFolder.files[name].dir
          );
          
          for (const filename of deckFiles) {
            const content = await decksFolder.file(filename)?.async('text');
            if (content) {
              const deck = this.createDeckFromMarkdown(content, filename);
              if (deck) {
                importedDecks.push(deck);
              }
            }
          }
        }
      } else if (file.name.endsWith('.md') || file.name.endsWith('.txt')) {
        // Single markdown file
        const text = await this.readFile(file);
        importedDecks = this.parseMarkdownContent(text, file.name);
      } else {
        // Legacy JSON format
        const text = await this.readFile(file);
        const data = JSON.parse(text);
        
        if (data.type === 'decks' && data.data) {
          // Convert old JSON decks to preview format
          const oldDecks = data.data.decks || [];
          importedDecks = oldDecks.map((oldDeck: any) => ({
            id: oldDeck.id,
            name: oldDeck.name,
            description: oldDeck.description || '',
            emoji: oldDeck.emoji || '📚',
            cards: oldDeck.cards || []
          }));
        } else if (Array.isArray(data)) {
          importedDecks = data;
        } else if (data.decks) {
          importedDecks = data.decks;
        }
      }

      // Get existing decks from markdown storage (only source of truth now)
      const { decks: existingDecks } = markdownStorage.loadAllDecks();
      
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