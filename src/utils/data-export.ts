import { STORAGE_KEYS, APP_VERSION } from './constants';
import { storageManager } from './storage';
import { markdownStorage } from './markdown-storage';
import type { StoredDecks, StoredScores, StoredProgress, UserPreferences, Deck } from '@/types';

interface ExportData {
  version: string;
  appVersion: string;
  exportDate: string;
  data: {
    preferences?: UserPreferences;
    decks?: StoredDecks;
    scores?: StoredScores;
    progress?: StoredProgress;
    achievements?: any;
  };
  checksum?: string;
}

export class DataExporter {
  // Export all localStorage data
  exportAllData(): void {
    try {
      const exportData: ExportData = {
        version: '1.0.0',
        appVersion: APP_VERSION,
        exportDate: new Date().toISOString(),
        data: {}
      };

      // Collect all FlashPlay data
      Object.entries(STORAGE_KEYS).forEach(([name, key]) => {
        try {
          const data = storageManager.load(key);
          if (data) {
            exportData.data[name.toLowerCase() as keyof ExportData['data']] = data;
          }
        } catch (err) {
          console.error(`Error exporting ${name}:`, err);
        }
      });

      // Generate checksum for data integrity
      exportData.checksum = this.generateChecksum(JSON.stringify(exportData.data));

      // Convert to JSON and download
      this.downloadJSON(exportData, `flashplay-backup-${this.getTimestamp()}.json`);
    } catch (error) {
      console.error('Export failed:', error);
      throw new Error('Failed to export data. Please try again.');
    }
  }

  // Export specific data types
  exportDecks(): void {
    try {
      const stored = storageManager.load<any>(STORAGE_KEYS.DECKS);
      let decks: any[] = [];
      
      // Handle both array format and object with decks array
      if (Array.isArray(stored)) {
        decks = stored;
      } else if (stored?.decks && Array.isArray(stored.decks)) {
        decks = stored.decks;
      }
      
      if (decks.length === 0) {
        throw new Error('No decks found to export');
      }

      const exportData = {
        version: '1.0.0',
        type: 'decks',
        exportDate: new Date().toISOString(),
        data: { decks }
      };

      this.downloadJSON(exportData, `flashplay-decks-${this.getTimestamp()}.json`);
    } catch (error) {
      console.error('Deck export failed:', error);
      throw error;
    }
  }

  // Export as human-readable markdown (from new storage)
  exportAsMarkdown(): void {
    try {
      const { decks, errors } = markdownStorage.loadAllDecks();
      
      if (decks.length === 0 && errors.length === 0) {
        throw new Error('No decks found to export');
      }

      let markdown = '# FlashPlay Decks Export\n\n';
      markdown += `Exported on: ${new Date().toLocaleString()}\n`;
      markdown += `Total decks: ${decks.length}\n`;
      if (errors.length > 0) {
        markdown += `Errors: ${errors.length} decks could not be loaded\n`;
      }
      markdown += '\n';

      // Export valid decks
      decks.forEach(deck => {
        markdown += `## ${deck.emoji} ${deck.name}\n\n`;
        if (deck.description) {
          markdown += `${deck.description}\n\n`;
        }
        
        // Group cards by category
        const categories = new Map<string, typeof deck.cards>();
        
        deck.cards.forEach(card => {
          const category = card.category || 'General';
          if (!categories.has(category)) {
            categories.set(category, []);
          }
          categories.get(category)!.push(card);
        });

        // Write cards by category
        categories.forEach((cards, category) => {
          if (category !== 'General') {
            markdown += `### ${category}\n\n`;
          }
          
          cards.forEach(card => {
            if (card.type === 'simple') {
              markdown += `- ${card.front} :: ${card.back}\n`;
            } else if (card.type === 'multiple-choice' && card.options) {
              markdown += `- ${card.front}\n`;
              card.options.forEach(opt => {
                markdown += `  * ${opt.text}${opt.isCorrect ? ' [correct]' : ''}\n`;
              });
            } else if (card.type === 'true-false') {
              markdown += `- ${card.front} :: ${card.back}\n`;
            }
            
            if (card.metadata?.hint) {
              markdown += `  <!-- Hint: ${card.metadata.hint} -->\n`;
            }
            if (card.metadata?.explanation) {
              markdown += `  <!-- Explanation: ${card.metadata.explanation} -->\n`;
            }
            markdown += '\n';
          });
        });
        
        markdown += '\n---\n\n';
      });

      // Include error information
      if (errors.length > 0) {
        markdown += '## ❌ Corrupted Decks\n\n';
        markdown += 'The following decks could not be loaded due to corruption:\n\n';
        errors.forEach(error => {
          markdown += `- **${error.id}**: ${error.error}\n`;
        });
        markdown += '\n';
      }

      this.downloadText(markdown, `flashplay-decks-${this.getTimestamp()}.md`);
    } catch (error) {
      console.error('Markdown export failed:', error);
      throw error;
    }
  }

  // Export individual deck as markdown file
  exportDeckAsMarkdown(deckId: string): void {
    try {
      const { deck, result } = markdownStorage.loadDeck(deckId);
      
      if (!deck || !result.success) {
        throw new Error(result.error || 'Deck not found');
      }

      // Get the raw markdown from storage
      const rawMarkdown = localStorage.getItem(`mdoc_${deckId}`);
      
      if (rawMarkdown) {
        const filename = `${deck.name.replace(/[^a-zA-Z0-9]/g, '-')}-${this.getTimestamp()}.md`;
        this.downloadText(rawMarkdown, filename);
      } else {
        throw new Error('Raw markdown not found');
      }
    } catch (error) {
      console.error('Individual deck export failed:', error);
      throw error;
    }
  }

  // Export all decks as separate markdown files (ZIP)
  async exportAllDecksAsMarkdownFiles(): Promise<void> {
    try {
      const { decks } = markdownStorage.loadAllDecks();
      
      if (decks.length === 0) {
        throw new Error('No decks found to export');
      }

      // Create a simple archive-like structure
      let archiveContent = '';
      
      decks.forEach(deck => {
        const rawMarkdown = localStorage.getItem(`mdoc_${deck.id}`);
        if (rawMarkdown) {
          const filename = `${deck.name.replace(/[^a-zA-Z0-9]/g, '-')}.md`;
          archiveContent += `\n\n==================== ${filename} ====================\n\n`;
          archiveContent += rawMarkdown;
        }
      });

      if (archiveContent) {
        const header = `# FlashPlay Individual Deck Files\n\nExported on: ${new Date().toLocaleString()}\nTotal decks: ${decks.length}\n\nEach deck is separated by headers below. Copy the content between headers to create individual .md files.\n\n`;
        this.downloadText(header + archiveContent, `flashplay-all-decks-${this.getTimestamp()}.md`);
      } else {
        throw new Error('No deck content found');
      }
    } catch (error) {
      console.error('Multiple deck export failed:', error);
      throw error;
    }
  }

  // Legacy markdown export (for backward compatibility)
  exportAsMarkdownLegacy(): void {
    try {
      const stored = storageManager.load<any>(STORAGE_KEYS.DECKS);
      let decks: any[] = [];
      
      // Handle both array format and object with decks array
      if (Array.isArray(stored)) {
        decks = stored;
      } else if (stored?.decks && Array.isArray(stored.decks)) {
        decks = stored.decks;
      }
      
      if (decks.length === 0) {
        throw new Error('No decks found to export');
      }

      let markdown = '# FlashPlay Decks Export (Legacy)\n\n';
      markdown += `Exported on: ${new Date().toLocaleString()}\n\n`;

      decks.forEach(deck => {
        markdown += `## ${deck.emoji} ${deck.name}\n\n`;
        if (deck.description) {
          markdown += `${deck.description}\n\n`;
        }
        
        // Group cards by category
        const categories = new Map<string, typeof deck.cards>();
        
        deck.cards.forEach((card: any) => {
          const category = card.category || 'Uncategorized';
          if (!categories.has(category)) {
            categories.set(category, []);
          }
          categories.get(category)!.push(card);
        });

        // Write cards by category
        categories.forEach((cards, category) => {
          markdown += `### ${category}\n\n`;
          
          cards.forEach((card: any) => {
            if (card.type === 'simple') {
              markdown += `- ${card.front} :: ${card.back}\n`;
            } else if (card.type === 'multiple-choice' && card.options) {
              markdown += `- ${card.front}\n`;
              card.options.forEach((opt: any) => {
                markdown += `  * ${opt.text}${opt.isCorrect ? ' [correct]' : ''}\n`;
              });
            } else if (card.type === 'true-false') {
              markdown += `- ${card.front} :: ${card.back}\n`;
            }
            
            if (card.metadata?.hint) {
              markdown += `  Hint: ${card.metadata.hint}\n`;
            }
            if (card.metadata?.explanation) {
              markdown += `  Explanation: ${card.metadata.explanation}\n`;
            }
            markdown += '\n';
          });
        });
        
        markdown += '\n---\n\n';
      });

      this.downloadText(markdown, `flashplay-decks-legacy-${this.getTimestamp()}.md`);
    } catch (error) {
      console.error('Legacy markdown export failed:', error);
      throw error;
    }
  }

  // Helper to download JSON file
  private downloadJSON(data: any, filename: string): void {
    const blob = new Blob([JSON.stringify(data, null, 2)], { 
      type: 'application/json' 
    });
    this.downloadBlob(blob, filename);
  }

  // Helper to download text file
  private downloadText(text: string, filename: string): void {
    const blob = new Blob([text], { 
      type: 'text/plain;charset=utf-8' 
    });
    this.downloadBlob(blob, filename);
  }

  // Helper to trigger download
  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Generate timestamp for filenames
  private getTimestamp(): string {
    const now = new Date();
    return now.toISOString().replace(/[:.]/g, '-').slice(0, -5);
  }

  // Simple checksum for data integrity
  private generateChecksum(data: string): string {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }
}

export const dataExporter = new DataExporter();