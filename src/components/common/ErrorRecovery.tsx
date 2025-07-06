import { useState } from 'react';
import { AlertTriangle, Download, RefreshCw, Trash2, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import { STORAGE_KEYS } from '@/utils/constants';

interface ErrorRecoveryProps {
  error: Error;
  errorInfo?: React.ErrorInfo;
  onRecover?: () => void;
}

export function ErrorRecovery({ error, errorInfo }: ErrorRecoveryProps) {
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryStatus, setRecoveryStatus] = useState<string>('');

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

  const isStorageError = error.message.includes('localStorage') || 
                       error.message.includes('parse') ||
                       error.message.includes('find') ||
                       error.message.includes('slice') ||
                       error.message.includes('undefined');

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