import { markdownStorage } from './markdown-storage';
import { MarkdownParser } from './markdown';
import { v4 as uuidv4 } from 'uuid';
import type { Deck } from '@/types';
import JSZip from 'jszip';

// Simple hash function for browser environment (same as export)
function simpleHash(str: string): string {
  let hash = 0;
  if (str.length === 0) return hash.toString();
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
}

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
  
  // Import markdown ZIP file with extensive logging
  async importMarkdownZip(file: File, options: ImportOptions): Promise<ImportResult> {
    console.log('🚀 [IMPORT] Starting import process...');
    const importStartTime = Date.now();
    
    console.log(`📄 [IMPORT] File details:`);
    console.log(`   Name: ${file.name}`);
    console.log(`   Size: ${(file.size / 1024).toFixed(2)} KB`);
    console.log(`   Type: ${file.type}`);
    console.log(`   Last Modified: ${new Date(file.lastModified).toISOString()}`);
    console.log(`   Merge Strategy: ${options.mergeStrategy}`);
    console.log(`   Dry Run: ${options.dryRun || false}`);
    
    try {
      const zip = new JSZip();
      const zipData = await file.arrayBuffer();
      console.log(`📦 [IMPORT] ZIP data loaded, ${zipData.byteLength} bytes`);
      
      const zipContents = await zip.loadAsync(zipData);
      console.log(`✅ [IMPORT] ZIP file parsed successfully`);
      
      const results: string[] = [];
      const errors: string[] = [];
      const importedDecks: Deck[] = [];
      
      // Create import log
      const importLog: string[] = [];
      importLog.push(`# Import Log - ${new Date().toISOString()}`);
      importLog.push(`Source file: ${file.name}`);
      importLog.push(`File size: ${(file.size / 1024).toFixed(2)} KB`);
      importLog.push(`Merge strategy: ${options.mergeStrategy}`);
      importLog.push(`Dry run: ${options.dryRun || false}\n`);
      
      // Check if this looks like an export log is present
      const exportLogFile = zipContents.file('export-log.md');
      if (exportLogFile) {
        const exportLogContent = await exportLogFile.async('text');
        console.log('📋 [IMPORT] Found export log in ZIP file');
        console.log('📋 [IMPORT] Export log preview:');
        console.log(exportLogContent.split('\n').slice(0, 10).map(line => `   ${line}`).join('\n'));
        importLog.push('## Original Export Log Found');
        importLog.push('```');
        importLog.push(exportLogContent.split('\n').slice(0, 20).join('\n')); // First 20 lines
        importLog.push('```\n');
      }
      
      // Process deck files
      const decksFolder = zipContents.folder('decks');
      if (decksFolder) {
        const deckFiles = Object.keys(decksFolder.files).filter(name => 
          name.endsWith('.md') && !decksFolder.files[name].dir && name.startsWith('decks/')
        );
        
        console.log(`📚 [IMPORT] Found ${deckFiles.length} deck files in ZIP`);
        console.log(`📚 [IMPORT] Deck files: [${deckFiles.join(', ')}]`);
        
        for (const filename of deckFiles) {
          console.log(`\n📋 [IMPORT] Processing: ${filename}`);
          
          try {
            // Remove 'decks/' prefix to get the relative filename within the folder
            const relativeFilename = filename.replace('decks/', '');
            const content = await decksFolder.file(relativeFilename)?.async('text');
            if (content) {
              const contentHash = simpleHash(content);
              const contentLength = content.length;
              const firstLines = content.split('\n').slice(0, 3).join('\n');
              
              console.log(`   Content length: ${contentLength} characters`);
              console.log(`   Content hash: ${contentHash}`);
              console.log(`   First 3 lines:`);
              console.log(`   ${firstLines.split('\n').map(line => `     > ${line}`).join('\n')}`);
              
              const deck = this.createDeckFromMarkdown(content, filename);
              if (deck) {
                // Extract categories and tags from deck
                const categories = [...new Set(deck.cards.map(card => card.category).filter(Boolean))];
                const tags = deck.metadata?.tags || [];
                
                console.log(`   ✅ Deck created successfully:`);
                console.log(`      ID: ${deck.id}`);
                console.log(`      Name: "${deck.name}"`);
                console.log(`      Description: "${deck.description}"`);
                console.log(`      Emoji: ${deck.emoji}`);
                console.log(`      Cards: ${deck.cards.length}`);
                console.log(`      Categories: [${categories.join(', ')}]`);
                console.log(`      Tags: [${tags.join(', ')}]`);
                
                importedDecks.push(deck);
                
                // Add to import log
                importLog.push(`## Deck: ${deck.name}`);
                importLog.push(`- **Source File**: ${filename}`);
                importLog.push(`- **Generated ID**: ${deck.id}`);
                importLog.push(`- **Name**: ${deck.name}`);
                importLog.push(`- **Description**: ${deck.description}`);
                importLog.push(`- **Emoji**: ${deck.emoji}`);
                importLog.push(`- **Cards**: ${deck.cards.length}`);
                importLog.push(`- **Categories**: ${categories.length > 0 ? categories.join(', ') : 'None'}`);
                importLog.push(`- **Tags**: ${tags.length > 0 ? tags.join(', ') : 'None'}`);
                importLog.push(`- **Content Length**: ${contentLength} chars`);
                importLog.push(`- **Content Hash**: ${contentHash}`);
                importLog.push(`- **Import Status**: Success`);
                importLog.push(`- **First Lines**:`);
                importLog.push('  ```');
                importLog.push(`  ${firstLines}`);
                importLog.push('  ```\n');
                results.push(`Imported deck: ${deck.name}`);
              } else {
                console.warn(`   ⚠️  Failed to create deck from ${filename}`);
                errors.push(`Failed to parse deck from ${filename}`);
                
                // Add to import log
                importLog.push(`## Deck: ${filename} (FAILED)`);
                importLog.push(`- **Source File**: ${filename}`);
                importLog.push(`- **Content Length**: ${contentLength} chars`);
                importLog.push(`- **Content Hash**: ${contentHash}`);
                importLog.push(`- **Import Status**: Failed - Could not parse deck`);
                importLog.push(`- **Error**: Failed to create deck from markdown`);
                importLog.push('');
              }
            } else {
              console.warn(`   ⚠️  No content found in ${filename}`);
              errors.push(`No content found in ${filename}`);
            }
          } catch (err) {
            console.error(`   ❌ Error processing ${filename}:`, err);
            errors.push(`Failed to import deck ${filename}: ${err}`);
            
            // Add to import log
            importLog.push(`## Deck: ${filename} (ERROR)`);
            importLog.push(`- **Source File**: ${filename}`);
            importLog.push(`- **Import Status**: Error`);
            importLog.push(`- **Error**: ${err}`);
            importLog.push('');
          }
        }
      } else {
        console.log('📂 [IMPORT] No decks folder found in ZIP file');
        importLog.push('## No Decks Folder Found');
        importLog.push('The ZIP file does not contain a "decks" folder.');
        importLog.push('');
      }
      
      console.log(`\n📊 [IMPORT] Processing summary:`);
      console.log(`   Decks parsed: ${importedDecks.length}`);
      console.log(`   Errors: ${errors.length}`);
      
      // Process progress file
      console.log('📈 [IMPORT] Checking for progress.md...');
      const progressFile = zipContents.file('progress.md');
      if (progressFile) {
        try {
          const _progressContent = await progressFile.async('text');
          console.log('✅ [IMPORT] Found progress.md (informational only)');
          results.push('Progress data found (informational only)');
          importLog.push('## Progress Data Found');
          importLog.push('Progress.md file was found but not imported (informational only).');
          importLog.push('');
        } catch (err) {
          console.error('❌ [IMPORT] Failed to read progress.md:', err);
          errors.push(`Failed to read progress: ${err}`);
        }
      } else {
        console.log('ℹ️  [IMPORT] No progress.md found');
      }
      
      // Process achievements file
      console.log('🏆 [IMPORT] Checking for achievements.md...');
      const achievementsFile = zipContents.file('achievements.md');
      if (achievementsFile) {
        try {
          const _achievementsContent = await achievementsFile.async('text');
          console.log('✅ [IMPORT] Found achievements.md (informational only)');
          results.push('Achievements data found (informational only)');
          importLog.push('## Achievements Data Found');
          importLog.push('Achievements.md file was found but not imported (informational only).');
          importLog.push('');
        } catch (err) {
          console.error('❌ [IMPORT] Failed to read achievements.md:', err);
          errors.push(`Failed to read achievements: ${err}`);
        }
      } else {
        console.log('ℹ️  [IMPORT] No achievements.md found');
      }
      
      // Process preferences file
      console.log('⚙️ [IMPORT] Checking for preferences.md...');
      const preferencesFile = zipContents.file('preferences.md');
      if (preferencesFile) {
        try {
          const _preferencesContent = await preferencesFile.async('text');
          console.log('✅ [IMPORT] Found preferences.md (informational only)');
          results.push('Preferences data found (informational only)');
          importLog.push('## Preferences Data Found');
          importLog.push('Preferences.md file was found but not imported (informational only).');
          importLog.push('');
        } catch (err) {
          console.error('❌ [IMPORT] Failed to read preferences.md:', err);
          errors.push(`Failed to read preferences: ${err}`);
        }
      } else {
        console.log('ℹ️  [IMPORT] No preferences.md found');
      }
      
      if (importedDecks.length === 0) {
        console.error('❌ [IMPORT] No valid decks found in ZIP file');
        throw new Error('No valid decks found in ZIP file');
      }
      
      // Get existing decks from markdown storage
      console.log('🔍 [IMPORT] Loading existing decks for merge analysis...');
      const { decks: existingDecks } = markdownStorage.loadAllDecks();
      console.log(`📚 [IMPORT] Found ${existingDecks.length} existing decks`);
      
      // Preview or execute merge
      console.log(`🔄 [IMPORT] Processing merge with strategy: ${options.mergeStrategy}`);
      const result = this.mergeDecksToMarkdownStorage(existingDecks, importedDecks, options);
      console.log(`📊 [IMPORT] Merge result: ${result.imported} imported, ${result.skipped} skipped`);
      
      // Add merge summary to import log
      importLog.push('## Import Summary');
      importLog.push(`- **Decks processed**: ${importedDecks.length}`);
      importLog.push(`- **Decks imported**: ${result.imported}`);
      importLog.push(`- **Decks skipped**: ${result.skipped}`);
      importLog.push(`- **Errors**: ${errors.length}`);
      importLog.push(`- **Merge strategy**: ${options.mergeStrategy}`);
      importLog.push(`- **Dry run**: ${options.dryRun || false}`);
      importLog.push(`- **Import time**: ${Date.now() - importStartTime}ms`);
      importLog.push(`- **Existing decks before import**: ${existingDecks.length}`);
      
      if (!options.dryRun) {
        console.log('💾 [IMPORT] Saving decks to storage...');
        // Save merged decks to markdown storage
        let savedCount = 0;
        for (const deck of result.decks) {
          console.log(`   Saving: ${deck.name} (${deck.id})`);
          const saveResult = markdownStorage.saveDeck(deck);
          if (!saveResult.success) {
            console.error(`   ❌ Failed to save ${deck.name}:`, saveResult.error);
            errors.push(`Failed to save deck ${deck.name}: ${saveResult.error}`);
          } else {
            console.log(`   ✅ Saved: ${deck.name}`);
            // Also save raw markdown to localStorage for future editing
            const rawMarkdown = deck.metadata?.originalMarkdown;
            if (rawMarkdown) {
              localStorage.setItem(`mdoc_${deck.id}`, rawMarkdown);
              console.log(`   ✅ Saved raw markdown for: ${deck.name}`);
            }
            savedCount++;
          }
        }
        console.log(`💾 [IMPORT] Successfully saved ${savedCount}/${result.decks.length} decks`);
        
        // Save import log to localStorage for debugging
        const importLogContent = importLog.join('\n');
        const logKey = `import_log_${Date.now()}`;
        localStorage.setItem(logKey, importLogContent);
        console.log(`📋 [IMPORT] Import log saved to localStorage: ${logKey}`);
      } else {
        console.log('🔍 [IMPORT] Dry run - no decks saved');
      }
      
      const importEndTime = Date.now();
      const totalTime = importEndTime - importStartTime;
      console.log(`\n🎉 [IMPORT] Import ${options.dryRun ? 'preview' : 'process'} completed!`);
      console.log(`⏱️  [IMPORT] Total import time: ${totalTime}ms`);
      console.log(`📈 [IMPORT] Final result: ${result.imported}/${importedDecks.length} decks imported, ${errors.length} errors`);
      
      return {
        success: errors.length === 0,
        message: options.dryRun ? 'ZIP preview generated' : `ZIP import completed. ${result.imported} decks imported.`,
        imported: result.imported,
        skipped: result.skipped,
        errors: errors.length > 0 ? errors : undefined
      };
    } catch (error) {
      console.error('❌ [IMPORT] Import failed:', error);
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
  private _mergeDecks(
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
            name.endsWith('.md') && !decksFolder.files[name].dir && name.startsWith('decks/')
          );
          
          for (const filename of deckFiles) {
            // Remove 'decks/' prefix to get the relative filename within the folder
            const relativeFilename = filename.replace('decks/', '');
            const content = await decksFolder.file(relativeFilename)?.async('text');
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