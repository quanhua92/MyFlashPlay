import { useState } from 'react';
import { AlertTriangle, Download, RefreshCw, Trash2, Shield, FileText, Package } from 'lucide-react';
import { motion } from 'framer-motion';
import { STORAGE_KEYS } from '@/utils/constants';
import { markdownStorage } from '@/utils/markdown-storage';

interface ErrorRecoveryProps {
  error: Error;
  errorInfo?: React.ErrorInfo;
  onRecover?: () => void;
}

export function ErrorRecovery({ error, errorInfo }: ErrorRecoveryProps) {
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryStatus, setRecoveryStatus] = useState<string>('');
  const [deckErrors, setDeckErrors] = useState<Array<{ id: string; error: string }>>([]);

  const exportCorruptedData = () => {
    try {
      const data: Record<string, any> = {};
      
      // Attempt to export whatever we can from localStorage
      for (const key in localStorage) {
        try {
          data[key] = localStorage.getItem(key);
        } catch (e) {
          data[key] = 'ERROR: Could not read';
        }
      }

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `flashplay-corrupted-data-${new Date().toISOString()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      setRecoveryStatus('Corrupted data exported successfully');
    } catch (e) {
      setRecoveryStatus('Failed to export data');
    }
  };

  const clearSpecificData = (key: string) => {
    setIsRecovering(true);
    try {
      localStorage.removeItem(key);
      setRecoveryStatus(`Cleared ${key}`);
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (e) {
      setRecoveryStatus(`Failed to clear ${key}`);
    }
    setIsRecovering(false);
  };

  const resetToDefaults = () => {
    setIsRecovering(true);
    try {
      // Clear all FlashPlay data
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      
      setRecoveryStatus('Reset to defaults successful');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (e) {
      setRecoveryStatus('Failed to reset');
    }
    setIsRecovering(false);
  };

  const clearAllData = () => {
    if (confirm('This will delete ALL FlashPlay data. Are you sure?')) {
      setIsRecovering(true);
      try {
        localStorage.clear();
        setRecoveryStatus('All data cleared');
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } catch (e) {
        setRecoveryStatus('Failed to clear data');
      }
      setIsRecovering(false);
    }
  };

  const diagnoseDeckErrors = async () => {
    setIsRecovering(true);
    try {
      const { decks, errors } = markdownStorage.loadAllDecks();
      setDeckErrors(errors);
      setRecoveryStatus(`Found ${errors.length} deck errors out of ${decks.length + errors.length} total decks`);
    } catch (err) {
      setRecoveryStatus('Failed to diagnose deck errors');
    }
    setIsRecovering(false);
  };

  const recoverDeck = async (deckId: string) => {
    setIsRecovering(true);
    try {
      // Try to export the corrupted data first
      const key = `mdoc_${deckId}`;
      const corruptedData = localStorage.getItem(key);
      
      if (corruptedData) {
        const blob = new Blob([corruptedData], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `corrupted-deck-${deckId}-${Date.now()}.md`;
        a.click();
        URL.revokeObjectURL(url);
      }
      
      // Remove corrupted deck
      localStorage.removeItem(key);
      
      // Update errors list
      setDeckErrors(prev => prev.filter(err => err.id !== deckId));
      setRecoveryStatus(`Deck ${deckId} recovered and corrupted data exported`);
    } catch (err) {
      setRecoveryStatus(`Failed to recover deck ${deckId}`);
    }
    setIsRecovering(false);
  };

  const migrateFromJSON = async () => {
    setIsRecovering(true);
    try {
      const result = await markdownStorage.migrateFromJSON();
      if (result.success) {
        setRecoveryStatus(`Successfully migrated ${result.migrated} decks from JSON to markdown storage`);
        setTimeout(() => window.location.reload(), 2000);
      } else {
        setRecoveryStatus(`Migration completed with errors: ${result.errors.join(', ')}`);
      }
    } catch (err) {
      setRecoveryStatus('Migration failed');
    }
    setIsRecovering(false);
  };

  const exportAllAsMarkdown = async () => {
    setIsRecovering(true);
    try {
      const storageInfo = markdownStorage.getStorageInfo();
      let allMarkdown = '# FlashPlay Data Export\n\n';
      allMarkdown += `Exported on: ${new Date().toLocaleString()}\n`;
      allMarkdown += `Total decks: ${storageInfo.deckCount}\n\n`;
      
      const index = markdownStorage.getIndex();
      for (const entry of index) {
        try {
          const { deck } = markdownStorage.loadDeck(entry.id);
          if (deck) {
            allMarkdown += `\n## ${deck.emoji} ${deck.name}\n\n`;
            const key = `mdoc_${entry.id}`;
            const markdown = localStorage.getItem(key);
            if (markdown) {
              allMarkdown += markdown + '\n\n---\n\n';
            }
          }
        } catch (err) {
          allMarkdown += `\n## ❌ Error loading deck ${entry.name}\n`;
          allMarkdown += `Error: ${err}\n\n---\n\n`;
        }
      }
      
      const blob = new Blob([allMarkdown], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `flashplay-all-decks-${Date.now()}.md`;
      a.click();
      URL.revokeObjectURL(url);
      
      setRecoveryStatus('All deck data exported as markdown');
    } catch (err) {
      setRecoveryStatus('Failed to export markdown data');
    }
    setIsRecovering(false);
  };

  const isStorageError = error.message.includes('localStorage') || 
                       error.message.includes('parse') ||
                       error.message.includes('find') ||
                       error.message.includes('slice') ||
                       error.message.includes('undefined');

  const isDeckError = error.message.includes('deck') || 
                     error.message.includes('card') ||
                     error.message.includes('markdown');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl w-full"
      >
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8">
          <div className="flex items-center space-x-4 mb-6">
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
              <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Oops! Something went wrong
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {isStorageError ? 'It looks like there\'s an issue with your saved data' : 'An unexpected error occurred'}
              </p>
            </div>
          </div>

          <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <p className="text-sm font-mono text-red-600 dark:text-red-400 mb-2">
              {error.message}
            </p>
            {errorInfo && (
              <details className="text-xs text-gray-600 dark:text-gray-400">
                <summary className="cursor-pointer hover:text-gray-800 dark:hover:text-gray-200">
                  Technical details
                </summary>
                <pre className="mt-2 overflow-x-auto">{errorInfo.componentStack}</pre>
              </details>
            )}
          </div>

          {recoveryStatus && (
            <div className="mb-6 p-4 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">{recoveryStatus}</p>
            </div>
          )}

          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
              Recovery Options:
            </h3>

            {/* Deck-specific recovery options */}
            {isDeckError && (
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Deck Recovery Tools
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button
                    onClick={diagnoseDeckErrors}
                    disabled={isRecovering}
                    className="flex items-center justify-center space-x-2 p-3 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 rounded-lg transition-colors text-sm"
                  >
                    <Shield className="w-4 h-4" />
                    <span>Diagnose Deck Errors</span>
                  </button>
                  <button
                    onClick={exportAllAsMarkdown}
                    disabled={isRecovering}
                    className="flex items-center justify-center space-x-2 p-3 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 rounded-lg transition-colors text-sm"
                  >
                    <Download className="w-4 h-4" />
                    <span>Export All as Markdown</span>
                  </button>
                  <button
                    onClick={migrateFromJSON}
                    disabled={isRecovering}
                    className="flex items-center justify-center space-x-2 p-3 bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50 rounded-lg transition-colors text-sm"
                  >
                    <Package className="w-4 h-4" />
                    <span>Migrate from JSON</span>
                  </button>
                </div>
                
                {/* Individual deck errors */}
                {deckErrors.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                      Corrupted Decks ({deckErrors.length}):
                    </p>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {deckErrors.map(deckError => (
                        <div key={deckError.id} className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-mono text-red-800 dark:text-red-200 truncate">
                              {deckError.id}
                            </p>
                            <p className="text-xs text-red-600 dark:text-red-400 truncate">
                              {deckError.error}
                            </p>
                          </div>
                          <button
                            onClick={() => recoverDeck(deckError.id)}
                            disabled={isRecovering}
                            className="ml-2 px-2 py-1 text-xs bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 rounded transition-colors"
                          >
                            Recover
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={exportCorruptedData}
              disabled={isRecovering}
              className="w-full flex items-center justify-center space-x-3 p-4 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <Download className="w-5 h-5" />
              <span>Export corrupted data for debugging</span>
            </button>

            {isStorageError && (
              <>
                <button
                  onClick={resetToDefaults}
                  disabled={isRecovering}
                  className="w-full flex items-center justify-center space-x-3 p-4 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 rounded-lg transition-colors"
                >
                  <RefreshCw className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <span className="text-blue-800 dark:text-blue-200">Reset FlashPlay to defaults</span>
                </button>

                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(STORAGE_KEYS).map(([name, key]) => (
                    <button
                      key={key}
                      onClick={() => clearSpecificData(key)}
                      disabled={isRecovering}
                      className="flex items-center justify-center space-x-2 p-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors text-sm"
                    >
                      <Shield className="w-4 h-4" />
                      <span>Clear {name.toLowerCase()}</span>
                    </button>
                  ))}
                </div>

                <button
                  onClick={clearAllData}
                  disabled={isRecovering}
                  className="w-full flex items-center justify-center space-x-3 p-4 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
                  <span className="text-red-800 dark:text-red-200">Clear all data (last resort)</span>
                </button>
              </>
            )}

            <button
              onClick={() => window.location.reload()}
              disabled={isRecovering}
              className="w-full flex items-center justify-center space-x-3 p-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
              <span>Try again</span>
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
              If this problem persists, please{' '}
              <a
                href="https://github.com/yourusername/flashplay/issues"
                className="text-purple-600 dark:text-purple-400 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                report an issue
              </a>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}