import { useState } from 'react';
import { Download, Upload, Moon, Sun, Monitor, Volume2, VolumeX, Save, AlertCircle, Accessibility } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '@/components/layout/ThemeProvider';
import { dataExporter } from '@/utils/data-export';
import { dataImporter, type MergeStrategy } from '@/utils/data-import';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { STORAGE_KEYS } from '@/utils/constants';
import { AccessibilitySettings } from '@/components/common/AccessibilitySettings';
import type { UserPreferences } from '@/types';

export function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [preferences, setPreferences] = useLocalStorage<UserPreferences>(
    STORAGE_KEYS.PREFERENCES,
    {
      version: '1.0.0',
      theme: 'auto',
      colorScheme: 'rainbow',
      soundEnabled: true,
      animationsEnabled: true,
      fontSize: 'medium',
      language: 'en-US',
      accessibility: {
        highContrast: false,
        reducedMotion: false,
        screenReaderMode: false
      },
      gameSettings: {
        defaultDifficulty: 'medium',
        showHints: true,
        autoAdvance: false,
        timerWarning: true
      },
      lastUpdated: new Date().toISOString()
    } as UserPreferences
  );
  
  const [exportStatus, setExportStatus] = useState<string>('');
  const [importStatus, setImportStatus] = useState<string>('');
  const [importPreview, setImportPreview] = useState<any>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [mergeStrategy, setMergeStrategy] = useState<MergeStrategy>('keep-both');
  const [isImporting, setIsImporting] = useState(false);

  // Export handlers
  const handleExportAll = async () => {
    try {
      await dataExporter.exportAllDataAsMarkdownZip();
      setExportStatus('Data exported successfully!');
      setTimeout(() => setExportStatus(''), 3000);
    } catch (error) {
      setExportStatus(`Export failed: ${error}`);
    }
  };


  // Import handlers
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setImportStatus('');
    setImportPreview(null);

    try {
      const preview = await dataImporter.previewImport(file);
      setImportPreview(preview);
    } catch (error) {
      setImportStatus(`Preview failed: ${error}`);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    setIsImporting(true);
    try {
      const result = await dataImporter.importFile(selectedFile, { mergeStrategy });
      
      if (result.success) {
        setImportStatus(`Success! Imported ${result.imported} decks.`);
        setImportPreview(null);
        setSelectedFile(null);
        
        // Reload page after successful import
        setTimeout(() => window.location.reload(), 2000);
      } else {
        setImportStatus(result.message);
      }
    } catch (error) {
      setImportStatus(`Import failed: ${error}`);
    }
    setIsImporting(false);
  };

  const handleFullImport = async () => {
    if (!selectedFile) return;

    if (!confirm('This will replace ALL your data. Are you sure?')) return;

    setIsImporting(true);
    try {
      const result = await dataImporter.importLegacyJsonBackup(selectedFile);
      
      if (result.success) {
        setImportStatus('Full backup imported successfully!');
        setTimeout(() => window.location.reload(), 2000);
      } else {
        setImportStatus(result.message);
      }
    } catch (error) {
      setImportStatus(`Import failed: ${error}`);
    }
    setIsImporting(false);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Settings
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Customize your MyFlashPlay experience
          </p>
        </div>

        <div className="space-y-8">
          {/* Theme Settings */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <Sun className="w-5 h-5 mr-2" />
              Appearance
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Theme
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'light' as const, icon: Sun, label: 'Light' },
                    { value: 'dark' as const, icon: Moon, label: 'Dark' },
                    { value: 'system' as const, icon: Monitor, label: 'System' }
                  ].map(({ value, icon: Icon, label }) => (
                    <button
                      key={value}
                      onClick={() => setTheme(value)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        theme === value
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <Icon className="w-6 h-6 mx-auto mb-2" />
                      <span className="text-sm font-medium">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Sound Effects
                  </span>
                  <button
                    onClick={() => setPreferences({ 
                      ...preferences, 
                      soundEnabled: !preferences.soundEnabled 
                    })}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    {preferences?.soundEnabled ? (
                      <Volume2 className="w-5 h-5 text-green-600" />
                    ) : (
                      <VolumeX className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                </label>
              </div>
            </div>
          </div>

          {/* Export Settings */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <Download className="w-5 h-5 mr-2" />
              Export Data
            </h2>
            
            <div className="space-y-3">
              <button
                onClick={handleExportAll}
                className="w-full flex items-center justify-center space-x-2 p-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                <Save className="w-5 h-5" />
                <span>Export Data</span>
              </button>
              
              {exportStatus && (
                <div className="p-3 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded-lg text-sm">
                  {exportStatus}
                </div>
              )}
            </div>
          </div>

          {/* Import Settings */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <Upload className="w-5 h-5 mr-2" />
              Import Data
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select file to import
                </label>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileSelect}
                  className="block w-full text-sm text-gray-500 dark:text-gray-400
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-lg file:border-0
                    file:text-sm file:font-semibold
                    file:bg-purple-50 file:text-purple-700
                    dark:file:bg-purple-900/20 dark:file:text-purple-300
                    hover:file:bg-purple-100 dark:hover:file:bg-purple-900/30"
                />
              </div>

              {importPreview && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                    Import Preview
                  </h3>
                  <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                    <li>• {importPreview.new} new decks to import</li>
                    <li>• {importPreview.existing} existing decks</li>
                    {importPreview.duplicates.length > 0 && (
                      <li className="text-orange-600 dark:text-orange-400">
                        • {importPreview.duplicates.length} duplicates: {importPreview.duplicates.join(', ')}
                      </li>
                    )}
                  </ul>
                </div>
              )}

              {selectedFile && importPreview?.duplicates.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    How to handle duplicates?
                  </label>
                  <select
                    value={mergeStrategy}
                    onChange={(e) => setMergeStrategy(e.target.value as MergeStrategy)}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="keep-both">Keep both (rename imported)</option>
                    <option value="replace">Replace existing</option>
                    <option value="merge-cards">Merge cards</option>
                    <option value="skip">Skip duplicates</option>
                  </select>
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={handleImport}
                  disabled={!selectedFile || isImporting}
                  className="flex-1 flex items-center justify-center space-x-2 p-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
                >
                  <Upload className="w-5 h-5" />
                  <span>{isImporting ? 'Importing...' : 'Import Decks'}</span>
                </button>
                
                <button
                  onClick={handleFullImport}
                  disabled={!selectedFile || isImporting}
                  className="flex items-center justify-center space-x-2 px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
                  title="Replace all data with backup"
                >
                  <AlertCircle className="w-5 h-5" />
                  <span>Full Restore</span>
                </button>
              </div>

              {importStatus && (
                <div className={`p-3 rounded-lg text-sm ${
                  importStatus.includes('Success') || importStatus.includes('successfully')
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                    : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
                }`}>
                  {importStatus}
                </div>
              )}
            </div>
          </div>

          {/* Accessibility Settings */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <Accessibility className="w-5 h-5 mr-2" />
              Accessibility
            </h2>
            <AccessibilitySettings />
          </div>
        </div>
      </motion.div>
    </div>
  );
}