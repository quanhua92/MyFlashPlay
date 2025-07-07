import { STORAGE_KEYS, APP_VERSION } from './constants';
import { storageManager } from './storage';
import { markdownStorage } from './markdown-storage';
import type { StoredScores, StoredProgress, UserPreferences } from '@/types';
import JSZip from 'jszip';

// Simple MD5-like hash function for browser environment
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

// Legacy interface - no longer used
// interface ExportData {
//   version: string;
//   appVersion: string;
//   exportDate: string;
//   data: {
//     preferences?: UserPreferences;
//     decks?: StoredDecks;
//     scores?: StoredScores;
//     progress?: StoredProgress;
//     achievements?: any;
//   };
//   checksum?: string;
// }

export class DataExporter {
  // Export all data as markdown ZIP file with extensive logging
  async exportAllDataAsMarkdownZip(): Promise<void> {
    console.log('🚀 [EXPORT] Starting export process...');
    const exportStartTime = Date.now();
    
    try {
      const zip = new JSZip();
      const timestamp = this.getTimestamp();
      console.log(`📅 [EXPORT] Export timestamp: ${timestamp}`);
      
      // Get all decks from markdown storage
      const { decks } = markdownStorage.loadAllDecks();
      console.log(`📚 [EXPORT] Found ${decks.length} decks to export`);
      
      if (decks.length === 0) {
        console.error('❌ [EXPORT] No decks found to export');
        throw new Error('No decks found to export');
      }
      
      // Create decks folder and add each deck as a markdown file
      const decksFolder = zip.folder('decks');
      if (!decksFolder) {
        console.error('❌ [EXPORT] Failed to create decks folder');
        throw new Error('Failed to create decks folder');
      }
      
      // Create export log
      const exportLog: string[] = [];
      exportLog.push(`# Export Log - ${new Date().toISOString()}`);
      exportLog.push(`Total decks found: ${decks.length}\n`);
      
      let exportedCount = 0;
      let skippedCount = 0;
      
      decks.forEach((deck, index) => {
        console.log(`\n📋 [EXPORT] Processing deck ${index + 1}/${decks.length}:`);
        console.log(`   ID: ${deck.id}`);
        console.log(`   Name: "${deck.name}"`);
        console.log(`   Description: "${deck.description}"`);
        console.log(`   Emoji: ${deck.emoji}`);
        console.log(`   Cards: ${deck.cards.length}`);
        
        // Extract categories and tags
        const categories = [...new Set(deck.cards.map(card => card.category).filter(Boolean))];
        const tags = deck.metadata?.tags || [];
        
        console.log(`   Categories: [${categories.join(', ')}]`);
        console.log(`   Tags: [${tags.join(', ')}]`);
        
        const rawMarkdown = localStorage.getItem(`mdoc_${deck.id}`);
        if (rawMarkdown) {
          const contentHash = simpleHash(rawMarkdown);
          const contentLength = rawMarkdown.length;
          const firstLines = rawMarkdown.split('\n').slice(0, 3).join('\n');
          
          console.log(`   Raw markdown length: ${contentLength} characters`);
          console.log(`   Content hash: ${contentHash}`);
          console.log(`   First 3 lines of content:`);
          console.log(`   ${firstLines.split('\n').map(line => `     > ${line}`).join('\n')}`);
          
          const filename = `${deck.name.replace(/[^a-zA-Z0-9]/g, '-')}.md`;
          decksFolder.file(filename, rawMarkdown);
          exportedCount++;
          
          // Add to export log
          exportLog.push(`## Deck ${index + 1}: ${deck.name}`);
          exportLog.push(`- **ID**: ${deck.id}`);
          exportLog.push(`- **File**: ${filename}`);
          exportLog.push(`- **Description**: ${deck.description}`);
          exportLog.push(`- **Emoji**: ${deck.emoji}`);
          exportLog.push(`- **Cards**: ${deck.cards.length}`);
          exportLog.push(`- **Categories**: ${categories.length > 0 ? categories.join(', ') : 'None'}`);
          exportLog.push(`- **Tags**: ${tags.length > 0 ? tags.join(', ') : 'None'}`);
          exportLog.push(`- **Content Length**: ${contentLength} chars`);
          exportLog.push(`- **Content Hash**: ${contentHash}`);
          exportLog.push(`- **Created**: ${deck.metadata?.createdAt || 'Unknown'}`);
          exportLog.push(`- **Last Modified**: ${deck.metadata?.lastModified || 'Unknown'}`);
          exportLog.push(`- **Play Count**: ${deck.metadata?.playCount || 0}`);
          exportLog.push(`- **First Lines**:`);
          exportLog.push('  ```');
          exportLog.push(`  ${firstLines}`);
          exportLog.push('  ```\n');
          
          console.log(`   ✅ Exported as: ${filename}`);
        } else {
          console.warn(`   ⚠️  No raw markdown found for deck ${deck.id}, skipping`);
          skippedCount++;
          
          // Add to export log
          exportLog.push(`## Deck ${index + 1}: ${deck.name} (SKIPPED)`);
          exportLog.push(`- **ID**: ${deck.id}`);
          exportLog.push(`- **Reason**: No raw markdown found in localStorage`);
          exportLog.push('');
        }
      });
      
      console.log(`\n📊 [EXPORT] Export summary:`);
      console.log(`   Successfully exported: ${exportedCount} decks`);
      console.log(`   Skipped: ${skippedCount} decks`);
      
      // Add summary to export log
      exportLog.push(`\n## Export Summary`);
      exportLog.push(`- **Total decks found**: ${decks.length}`);
      exportLog.push(`- **Successfully exported**: ${exportedCount}`);
      exportLog.push(`- **Skipped**: ${skippedCount}`);
      exportLog.push(`- **Export time**: ${Date.now() - exportStartTime}ms`);
      exportLog.push(`- **Export date**: ${new Date().toISOString()}`);
      
      // Add export log to ZIP
      zip.file('export-log.md', exportLog.join('\n'));
      console.log('📄 [EXPORT] Added export log file');
      
      // Export progress data as markdown
      console.log('📈 [EXPORT] Processing progress data...');
      const progressData = this.exportProgressAsMarkdown();
      if (progressData) {
        zip.file('progress.md', progressData);
        console.log('✅ [EXPORT] Added progress.md');
      } else {
        console.log('ℹ️  [EXPORT] No progress data to export');
      }
      
      // Export achievements as markdown
      console.log('🏆 [EXPORT] Processing achievements data...');
      const achievementsData = this.exportAchievementsAsMarkdown();
      if (achievementsData) {
        zip.file('achievements.md', achievementsData);
        console.log('✅ [EXPORT] Added achievements.md');
      } else {
        console.log('ℹ️  [EXPORT] No achievements data to export');
      }
      
      // Export preferences as markdown
      console.log('⚙️ [EXPORT] Processing preferences data...');
      const preferencesData = this.exportPreferencesAsMarkdown();
      if (preferencesData) {
        zip.file('preferences.md', preferencesData);
        console.log('✅ [EXPORT] Added preferences.md');
      } else {
        console.log('ℹ️  [EXPORT] No preferences data to export');
      }
      
      // Add export info
      const exportInfo = `# MyFlashPlay Export\n\nExported on: ${new Date().toLocaleString()}\nVersion: ${APP_VERSION}\nTotal decks: ${decks.length}\nExported decks: ${exportedCount}\nSkipped decks: ${skippedCount}\n\n## Contents\n\n- **decks/**: Individual deck files in markdown format\n- **export-log.md**: Detailed export log with hashes and metadata\n- **progress.md**: Learning progress and statistics\n- **achievements.md**: Unlocked achievements\n- **preferences.md**: User preferences and settings\n\n## Import Instructions\n\n1. Extract this ZIP file\n2. Use MyFlashPlay's import feature to select the ZIP file\n3. Choose merge strategy for existing decks\n\n---\n\n*This export contains only markdown files for maximum compatibility*`;
      
      zip.file('README.md', exportInfo);
      console.log('📄 [EXPORT] Added README.md');
      
      // Generate and download ZIP
      console.log('📦 [EXPORT] Generating ZIP file...');
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const filename = `flashplay-export-${timestamp}.zip`;
      console.log(`💾 [EXPORT] Downloading as: ${filename}`);
      console.log(`📊 [EXPORT] ZIP file size: ${(zipBlob.size / 1024).toFixed(2)} KB`);
      
      this.downloadBlob(zipBlob, filename);
      
      const exportEndTime = Date.now();
      const totalTime = exportEndTime - exportStartTime;
      console.log(`🎉 [EXPORT] Export completed successfully!`);
      console.log(`⏱️  [EXPORT] Total export time: ${totalTime}ms`);
      console.log(`📈 [EXPORT] Final stats: ${exportedCount}/${decks.length} decks exported, ${skippedCount} skipped`);
      
    } catch (error) {
      console.error('❌ [EXPORT] Export failed:', error);
      throw new Error('Failed to export data. Please try again.');
    }
  }

  // Export decks as markdown ZIP file
  async exportDecksAsMarkdownZip(): Promise<void> {
    try {
      const zip = new JSZip();
      const timestamp = this.getTimestamp();
      
      // Get all decks from markdown storage
      const { decks } = markdownStorage.loadAllDecks();
      
      if (decks.length === 0) {
        throw new Error('No decks found to export');
      }
      
      // Create decks folder and add each deck as a markdown file
      const decksFolder = zip.folder('decks');
      if (!decksFolder) throw new Error('Failed to create decks folder');
      
      decks.forEach(deck => {
        const rawMarkdown = localStorage.getItem(`mdoc_${deck.id}`);
        if (rawMarkdown) {
          const filename = `${deck.name.replace(/[^a-zA-Z0-9]/g, '-')}.md`;
          decksFolder.file(filename, rawMarkdown);
        }
      });
      
      // Add export info
      const exportInfo = `# MyFlashPlay Decks Export\n\nExported on: ${new Date().toLocaleString()}\nVersion: ${APP_VERSION}\nTotal decks: ${decks.length}\n\n## Contents\n\n- **decks/**: Individual deck files in markdown format\n\n## Import Instructions\n\n1. Extract this ZIP file\n2. Use MyFlashPlay's import feature to select the ZIP file or individual markdown files\n3. Choose merge strategy for existing decks\n\n---\n\n*This export contains only markdown files for maximum compatibility*`;
      
      zip.file('README.md', exportInfo);
      
      // Generate and download ZIP
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      this.downloadBlob(zipBlob, `flashplay-decks-${timestamp}.zip`);
      
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

      let markdown = '# MyFlashPlay Decks Export\n\n';
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
        const header = `# MyFlashPlay Individual Deck Files\n\nExported on: ${new Date().toLocaleString()}\nTotal decks: ${decks.length}\n\nEach deck is separated by headers below. Copy the content between headers to create individual .md files.\n\n`;
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

      let markdown = '# MyFlashPlay Decks Export (Legacy)\n\n';
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

  // Export progress data as markdown
  private exportProgressAsMarkdown(): string | null {
    try {
      const progress = storageManager.load<StoredProgress>(STORAGE_KEYS.PROGRESS);
      const scores = storageManager.load<StoredScores>(STORAGE_KEYS.SCORES);
      
      if (!progress && !scores) return null;
      
      let markdown = '# Learning Progress\n\n';
      markdown += `Exported on: ${new Date().toLocaleString()}\n\n`;
      
      // Statistics
      if (scores?.statistics) {
        const stats = scores.statistics;
        markdown += '## Statistics\n\n';
        markdown += `- Total games played: ${stats.totalGamesPlayed}\n`;
        markdown += `- Total time spent: ${Math.round(stats.totalTimeSpent / 60)} minutes\n`;
        markdown += `- Average accuracy: ${Math.round(stats.averageAccuracy)}%\n`;
        markdown += `- Total points: ${stats.totalPoints}\n`;
        markdown += `- Daily streak: ${stats.dailyStreak} days\n`;
        markdown += `- Last played: ${new Date(stats.lastPlayedDate).toLocaleDateString()}\n\n`;
      }
      
      // Card progress
      if (progress?.cardProgress) {
        markdown += '## Card Progress\n\n';
        const cardEntries = Object.entries(progress.cardProgress);
        if (cardEntries.length > 0) {
          cardEntries.forEach(([cardId, cardProg]) => {
            markdown += `### Card ${cardId}\n\n`;
            markdown += `- Times seen: ${cardProg.stats.views}\n`;
            markdown += `- Correct answers: ${cardProg.stats.correctCount}\n`;
            markdown += `- Accuracy: ${Math.round((cardProg.stats.correctCount / cardProg.stats.views) * 100)}%\n`;
            markdown += `- Last seen: ${new Date(cardProg.stats.lastSeen).toLocaleDateString()}\n`;
            markdown += `- Confidence: ${cardProg.stats.confidence}\n\n`;
          });
        }
      }
      
      // Recent sessions
      if (scores?.sessions && scores.sessions.length > 0) {
        markdown += '## Recent Sessions\n\n';
        const recentSessions = scores.sessions.slice(-10); // Last 10 sessions
        recentSessions.forEach((session, index) => {
          markdown += `### Session ${recentSessions.length - index}\n\n`;
          markdown += `- Date: ${new Date(session.startTime).toLocaleDateString()}\n`;
          markdown += `- Duration: ${Math.round((session.duration || 0) / 60)} minutes\n`;
          markdown += `- Score: ${session.score.points} points\n`;
          markdown += `- Accuracy: ${Math.round(session.score.accuracy)}%\n`;
          markdown += `- Cards: ${session.score.correctAnswers}/${session.score.totalQuestions}\n\n`;
        });
      }
      
      return markdown;
    } catch (error) {
      console.error('Error exporting progress:', error);
      return null;
    }
  }
  
  // Export achievements as markdown
  private exportAchievementsAsMarkdown(): string | null {
    try {
      const achievements = storageManager.load<any>(STORAGE_KEYS.ACHIEVEMENTS);
      if (!achievements) return null;
      
      let markdown = '# Achievements\n\n';
      markdown += `Exported on: ${new Date().toLocaleString()}\n\n`;
      
      if (Array.isArray(achievements)) {
        achievements.forEach(achievement => {
          markdown += `## ${achievement.name}\n\n`;
          markdown += `- Description: ${achievement.description}\n`;
          markdown += `- Unlocked: ${new Date(achievement.unlockedAt).toLocaleDateString()}\n`;
          markdown += `- Points: ${achievement.points || 0}\n\n`;
        });
      }
      
      return markdown;
    } catch (error) {
      console.error('Error exporting achievements:', error);
      return null;
    }
  }
  
  // Export preferences as markdown
  private exportPreferencesAsMarkdown(): string | null {
    try {
      const preferences = storageManager.load<UserPreferences>(STORAGE_KEYS.PREFERENCES);
      if (!preferences) return null;
      
      let markdown = '# User Preferences\n\n';
      markdown += `Exported on: ${new Date().toLocaleString()}\n\n`;
      
      markdown += `## Display Settings\n\n`;
      markdown += `- Theme: ${preferences.theme}\n`;
      markdown += `- Color scheme: ${preferences.colorScheme}\n`;
      markdown += `- Font size: ${preferences.fontSize}\n`;
      markdown += `- Language: ${preferences.language}\n\n`;
      
      markdown += `## Game Settings\n\n`;
      markdown += `- Sound enabled: ${preferences.soundEnabled}\n`;
      markdown += `- Animations enabled: ${preferences.animationsEnabled}\n`;
      markdown += `- Default difficulty: ${preferences.gameSettings?.defaultDifficulty || 'medium'}\n`;
      markdown += `- Show hints: ${preferences.gameSettings?.showHints || true}\n`;
      markdown += `- Auto advance: ${preferences.gameSettings?.autoAdvance || false}\n\n`;
      
      if (preferences.accessibility) {
        markdown += `## Accessibility\n\n`;
        markdown += `- High contrast: ${preferences.accessibility.highContrast}\n`;
        markdown += `- Reduced motion: ${preferences.accessibility.reducedMotion}\n`;
        markdown += `- Screen reader mode: ${preferences.accessibility.screenReaderMode}\n\n`;
      }
      
      return markdown;
    } catch (error) {
      console.error('Error exporting preferences:', error);
      return null;
    }
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
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    const minute = String(now.getMinutes()).padStart(2, '0');
    const second = String(now.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day}-${hour}-${minute}-${second}`;
  }

  // Simple checksum for data integrity
  private _generateChecksum(data: string): string {
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