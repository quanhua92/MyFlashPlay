import { useState } from 'react';
import { Download, Upload, Moon, Sun, Monitor, Volume2, VolumeX, Save, AlertCircle, Accessibility, Database, Trash2, Shield, HardDrive, FileText, Globe, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '@/components/layout/ThemeProvider';
import { dataExporter } from '@/utils/data-export';
import { dataImporter, type MergeStrategy } from '@/utils/data-import';
import { markdownStorage } from '@/utils/markdown-storage';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { STORAGE_KEYS } from '@/utils/constants';
import { AccessibilitySettings } from '@/components/common/AccessibilitySettings';
import { LanguageSelector } from '@/components/settings/LanguageSelector';
import { useTranslation } from '@/i18n';
import type { UserPreferences } from '@/types';

export function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const t = useTranslation();
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
  
  // Advanced localStorage management states
  const [storageInfo, setStorageInfo] = useState<any>(null);
  const [showAdvancedStorage, setShowAdvancedStorage] = useState(false);
  const [confirmationStep, setConfirmationStep] = useState<string>('');
  const [confirmationCode, setConfirmationCode] = useState<string>('');
  const [userInputCode, setUserInputCode] = useState<string>('');
  const [storageAction, setStorageAction] = useState<string>('');
  const [hasExportedData, setHasExportedData] = useState<boolean>(false);
  const [nuclearUnlocked, setNuclearUnlocked] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [showImportFormat, setShowImportFormat] = useState<boolean>(false);

  // Export handlers
  const handleExportAll = async () => {
    setIsExporting(true);
    try {
      await dataExporter.exportAllDataAsMarkdownZip();
      setExportStatus('Data exported successfully!');
      setHasExportedData(true); // Enable clear buttons after export
      setTimeout(() => setExportStatus(''), 3000);
    } catch (error) {
      setExportStatus(`Export failed: ${error}`);
    }
    setIsExporting(false);
  };

  // Quick export for storage management
  const handleQuickExport = async () => {
    setIsExporting(true);
    try {
      await dataExporter.exportAllDataAsMarkdownZip();
      setHasExportedData(true);
      setImportStatus('Data exported! Clear buttons are now enabled.');
      setTimeout(() => setImportStatus(''), 3000);
    } catch (error) {
      setImportStatus(`Export failed: ${error}`);
    }
    setIsExporting(false);
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


  // Advanced localStorage management functions
  const getStorageInfo = () => {
    const info: any = {
      totalItems: 0,
      totalSize: 0,
      categories: {
        decks: { count: 0, size: 0, keys: [] },
        preferences: { count: 0, size: 0, keys: [] },
        sessions: { count: 0, size: 0, keys: [] },
        temporary: { count: 0, size: 0, keys: [] },
        other: { count: 0, size: 0, keys: [] }
      }
    };

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      
      const value = localStorage.getItem(key);
      const size = new Blob([value || '']).size;
      
      info.totalItems++;
      info.totalSize += size;
      
      // Categorize keys
      if (key.startsWith('mdoc_')) {
        info.categories.decks.count++;
        info.categories.decks.size += size;
        info.categories.decks.keys.push(key);
      } else if (key.includes('preference') || key.includes('setting')) {
        info.categories.preferences.count++;
        info.categories.preferences.size += size;
        info.categories.preferences.keys.push(key);
      } else if (key.includes('session') || key.includes('achievement')) {
        info.categories.sessions.count++;
        info.categories.sessions.size += size;
        info.categories.sessions.keys.push(key);
      } else if (key.startsWith('temp_')) {
        info.categories.temporary.count++;
        info.categories.temporary.size += size;
        info.categories.temporary.keys.push(key);
      } else {
        info.categories.other.count++;
        info.categories.other.size += size;
        info.categories.other.keys.push(key);
      }
    }
    
    setStorageInfo(info);
  };

  const generateConfirmationCode = (isNuclear = false) => {
    if (isNuclear) {
      // Generate 12-character code for nuclear option
      return Math.random().toString(36).substring(2, 8).toUpperCase() + 
             Math.random().toString(36).substring(2, 8).toUpperCase();
    }
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getCategoryInfo = (category: string) => {
    const categoryData = {
      decks: {
        name: 'Deck Data',
        description: 'Your flashcard decks in markdown format',
        why: 'These contain all your flashcard collections. Only clear if you want to delete specific decks.',
        icon: '📚',
        safety: 'high-risk'
      },
      preferences: {
        name: 'App Preferences', 
        description: 'Settings like theme, sound, accessibility options',
        why: 'App configuration and user preferences. Safe to clear if you want to reset settings to defaults.',
        icon: '⚙️',
        safety: 'low-risk'
      },
      sessions: {
        name: 'Game Sessions & Achievements',
        description: 'Your game history, scores, and unlocked achievements',
        why: 'Progress tracking and statistics. Clear to reset your game progress and achievements.',
        icon: '🏆',
        safety: 'medium-risk'
      },
      temporary: {
        name: 'Temporary Data',
        description: 'Cached data from public decks and temporary files',
        why: 'Safe to clear - this is just cached data that will regenerate. Helps free up space.',
        icon: '🗂️',
        safety: 'safe'
      },
      other: {
        name: 'Other Data',
        description: 'Miscellaneous localStorage items not categorized above',
        why: 'Various app data. Review carefully before clearing as it may affect app functionality.',
        icon: '📦',
        safety: 'medium-risk'
      }
    };
    return categoryData[category as keyof typeof categoryData] || {
      name: category,
      description: 'Unknown data category',
      why: 'Purpose unknown - review carefully before clearing.',
      icon: '❓',
      safety: 'high-risk'
    };
  };

  const initiateStorageAction = (action: string, category?: string) => {
    const isNuclear = action === 'clear' && category === 'all';
    const code = generateConfirmationCode(isNuclear);
    setConfirmationCode(code);
    setUserInputCode('');
    setStorageAction(action);
    setConfirmationStep(`${action}-${category || 'all'}`);
  };

  const unlockNuclearOption = () => {
    if (!hasExportedData) {
      setImportStatus('You must export data first before unlocking nuclear option!');
      return;
    }
    setNuclearUnlocked(true);
    setImportStatus('Nuclear option unlocked! Use with extreme caution.');
    setTimeout(() => setImportStatus(''), 3000);
  };

  const executeStorageAction = async () => {
    if (userInputCode !== confirmationCode) {
      setImportStatus('Confirmation code does not match!');
      return;
    }

    try {
      // Export data before any destructive action
      if (storageAction === 'clear') {
        await dataExporter.exportAllDataAsMarkdownZip();
        setExportStatus('Data backed up before clearing!');
      }

      // Execute the action
      const [action, category] = confirmationStep.split('-');
      
      if (action === 'clear' && category === 'all') {
        localStorage.clear();
        setImportStatus('All localStorage data has been cleared. Page will reload.');
        setTimeout(() => window.location.reload(), 2000);
      } else if (action === 'clear' && storageInfo) {
        // Clear specific category
        const keys = storageInfo.categories[category]?.keys || [];
        keys.forEach((key: string) => localStorage.removeItem(key));
        setImportStatus(`Cleared ${keys.length} items from ${category} category.`);
        getStorageInfo(); // Refresh storage info
      }
      
      setConfirmationStep('');
      setConfirmationCode('');
      setUserInputCode('');
      setStorageAction('');
    } catch (error) {
      setImportStatus(`Action failed: ${error}`);
    }
  };

  const cancelStorageAction = () => {
    setConfirmationStep('');
    setConfirmationCode('');
    setUserInputCode('');
    setStorageAction('');
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
            {t('settings.title')}
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            {t('settings.subtitle')}
          </p>
        </div>

        <div className="space-y-8">
          {/* Language Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
          >
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <Globe className="w-5 h-5 mr-2" />
              {t('settings.languageTitle')}
            </h2>
            <LanguageSelector />
            
          </motion.div>

          {/* Theme Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
          >
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <Sun className="w-5 h-5 mr-2" />
              {t('settings.themeTitle')}
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('settings.themeTitle')}
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
                      <span className="text-sm font-medium">{t(`settings.${value}`)}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('settings.soundEffects')}
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
          </motion.div>

          {/* Export Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
          >
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <Download className="w-5 h-5 mr-2" />
              {t('settings.exportData')}
            </h2>
            
            <div className="space-y-3">
              <button
                onClick={handleExportAll}
                className="w-full flex items-center justify-center space-x-2 p-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                <Save className="w-5 h-5" />
                <span>{t('settings.exportData')}</span>
              </button>
              
              {exportStatus && (
                <div className="p-3 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded-lg text-sm">
                  {exportStatus}
                </div>
              )}
            </div>
          </motion.div>

          {/* Import Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
          >
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <Upload className="w-5 h-5 mr-2" />
              {t('settings.importData')}
            </h2>
            
            <div className="space-y-4">
              {/* File Selection */}
              <div>
                <input
                  ref={(input) => {
                    if (input) {
                      // Store ref for programmatic access
                      (window as any).fileInputRef = input;
                    }
                  }}
                  type="file"
                  accept=".zip"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                {!selectedFile ? (
                  <button
                    onClick={() => (window as any).fileInputRef?.click()}
                    className="w-full flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-purple-400 dark:hover:border-purple-500 rounded-lg transition-colors bg-gray-50 dark:bg-gray-700 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                  >
                    <Upload className="w-6 h-6 text-gray-400" />
                    <div className="text-center">
                      <div className="text-lg font-medium text-gray-700 dark:text-gray-300">
                        Select ZIP file to import
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Click to browse for your MyFlashPlay export file
                      </div>
                    </div>
                  </button>
                ) : (
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-100 dark:bg-green-800 rounded-lg flex items-center justify-center">
                          <FileText className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <div className="font-medium text-green-800 dark:text-green-200">
                            {selectedFile.name}
                          </div>
                          <div className="text-sm text-green-600 dark:text-green-400">
                            {(selectedFile.size / 1024).toFixed(2)} KB
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedFile(null);
                          setImportPreview(null);
                          setImportStatus('');
                        }}
                        className="p-2 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-800 rounded-lg transition-colors"
                        title="Remove file"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Format Details Toggle */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <button
                  onClick={() => setShowImportFormat(!showImportFormat)}
                  className="flex items-center justify-between w-full p-3 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Expected ZIP File Format
                    </span>
                  </div>
                  <div className={`transform transition-transform ${showImportFormat ? 'rotate-180' : ''}`}>
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {showImportFormat && (
                  <div className="mt-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-3">
                      📦 Expected ZIP File Structure
                    </h4>
                    
                    <div className="space-y-3 text-xs font-mono">
                      <div className="text-blue-700 dark:text-blue-300">
                        <div className="font-semibold mb-2">flashplay-export-YYYY-MM-DD-HH-MM-SS.zip</div>
                        <div className="ml-2 space-y-1">
                          <div>├── 📁 <span className="font-semibold text-purple-600 dark:text-purple-400">decks/</span></div>
                          <div className="ml-4 space-y-1 text-gray-600 dark:text-gray-400">
                            <div>├── Deck-Name-1.md</div>
                            <div>├── Deck-Name-2.md</div>
                            <div>└── Deck-Name-N.md</div>
                          </div>
                          <div>├── 📄 <span className="text-gray-600 dark:text-gray-400">export-log.md</span> <span className="text-gray-500">(optional - detailed export info)</span></div>
                          <div>├── 📄 <span className="text-gray-600 dark:text-gray-400">progress.md</span> <span className="text-gray-500">(optional - learning stats)</span></div>
                          <div>├── 📄 <span className="text-gray-600 dark:text-gray-400">achievements.md</span> <span className="text-gray-500">(optional - achievements)</span></div>
                          <div>├── 📄 <span className="text-gray-600 dark:text-gray-400">preferences.md</span> <span className="text-gray-500">(optional - user settings)</span></div>
                          <div>└── 📄 <span className="text-gray-600 dark:text-gray-400">README.md</span> <span className="text-gray-500">(optional - export info)</span></div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded border border-blue-200 dark:border-blue-700">
                      <h5 className="text-xs font-semibold text-blue-800 dark:text-blue-200 mb-2">
                        📋 Deck File Format (Markdown)
                      </h5>
                      <pre className="text-xs text-gray-700 dark:text-gray-300 overflow-x-auto">
{`# 📚 Deck Name

Brief deck description

## Category 1

- Front text :: Back text
- Question? :: Answer
- True or false statement :: true

## Category 2

- Multiple choice question?
  - Option 1
  - Option 2 
  - Correct option
  > Correct option`}
                      </pre>
                    </div>

                    <div className="mt-3 text-xs space-y-2">
                      <div className="flex items-start space-x-2">
                        <div className="w-4 h-4 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mt-0.5">
                          <div className="w-2 h-2 bg-green-600 dark:bg-green-400 rounded-full"></div>
                        </div>
                        <div>
                          <span className="font-medium text-green-800 dark:text-green-200">Required:</span>
                          <span className="text-green-700 dark:text-green-300 ml-1">decks/ folder with .md files</span>
                        </div>
                      </div>
                      <div className="flex items-start space-x-2">
                        <div className="w-4 h-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mt-0.5">
                          <div className="w-2 h-2 bg-gray-600 dark:bg-gray-400 rounded-full"></div>
                        </div>
                        <div>
                          <span className="font-medium text-gray-800 dark:text-gray-200">Optional:</span>
                          <span className="text-gray-700 dark:text-gray-300 ml-1">export-log.md, progress.md, achievements.md, preferences.md, README.md</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-700">
                      <div className="flex items-start space-x-2">
                        <div className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5">💡</div>
                        <div>
                          <div className="text-xs font-medium text-yellow-800 dark:text-yellow-200 mb-1">Pro Tip</div>
                          <div className="text-xs text-yellow-700 dark:text-yellow-300">
                            Use the "Export Data" button above to create a properly formatted ZIP file that you can then re-import or share.
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Import Actions - Only show when file is selected */}
              {selectedFile && (
                <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-4">
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

                  {importPreview?.duplicates.length > 0 && (
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
                      disabled={isImporting}
                      className="flex-1 flex items-center justify-center space-x-2 p-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
                    >
                      <Upload className="w-5 h-5" />
                      <span>{isImporting ? 'Importing...' : 'Import Decks'}</span>
                    </button>
                    
                    <button
                      onClick={handleFullImport}
                      disabled={isImporting}
                      className="flex items-center justify-center space-x-2 px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
                      title="Replace all data with backup"
                    >
                      <AlertCircle className="w-5 h-5" />
                      <span>Full Restore</span>
                    </button>
                  </div>
                </div>
              )}

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
          </motion.div>


          {/* Advanced localStorage Management */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border-2 border-yellow-200 dark:border-yellow-800"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                <Database className="w-5 h-5 mr-2" />
                Advanced Storage Management
              </h2>
              <div className="flex items-center space-x-2 text-yellow-600 dark:text-yellow-400">
                <Shield className="w-4 h-4" />
                <span className="text-sm font-medium">Advanced Users Only</span>
              </div>
            </div>
            
            <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                ⚠️ <strong>Warning:</strong> These tools can permanently delete your data. Use with extreme caution.
              </p>
              <p className="text-sm text-yellow-800 dark:text-yellow-200 mt-2">
                📤 <strong>Required:</strong> You must click "Export Data" above before Clear buttons are enabled.
              </p>
            </div>

            {!hasExportedData && (
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  🔒 <strong>Safety Lock:</strong> Clear buttons are disabled until you export your data as a backup. 
                  Scroll up and click "Export Data" first.
                </p>
              </div>
            )}

            <div className="space-y-4">
              <button
                onClick={() => {
                  if (!showAdvancedStorage) {
                    getStorageInfo();
                  }
                  setShowAdvancedStorage(!showAdvancedStorage);
                }}
                className="w-full flex items-center justify-center space-x-2 p-3 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 text-blue-800 dark:text-blue-200 rounded-lg transition-colors"
              >
                <HardDrive className="w-5 h-5" />
                <span>{showAdvancedStorage ? 'Hide Storage Details' : 'Show Storage Details'}</span>
              </button>

              {showAdvancedStorage && storageInfo && (
                <div className="space-y-4">
                  {/* Confirmation Dialog - Moved to Top */}
                  {confirmationStep && (
                    <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border-2 border-orange-300 dark:border-orange-600">
                      <h3 className="font-semibold text-orange-800 dark:text-orange-200 mb-3 text-lg">
                        ⚠️ Confirm Destructive Action
                      </h3>
                      <p className="text-sm text-orange-700 dark:text-orange-300 mb-4">
                        You are about to <strong>{storageAction}</strong> data. This action cannot be undone.
                        {storageAction === 'clear' && confirmationStep.includes('all') && (
                          <span className="block mt-2 text-red-700 dark:text-red-300 font-medium">
                            🚨 This will delete EVERYTHING - all decks, settings, progress, and achievements!
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-orange-700 dark:text-orange-300 mb-4">
                        Type the confirmation code: <strong className="font-mono bg-orange-100 dark:bg-orange-900/30 px-2 py-1 rounded text-lg">{confirmationCode}</strong>
                      </p>
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={userInputCode}
                          onChange={(e) => setUserInputCode(e.target.value.toUpperCase())}
                          placeholder="Enter confirmation code"
                          className="w-full p-3 border-2 border-orange-300 dark:border-orange-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-lg"
                        />
                        <div className="flex space-x-3">
                          <button
                            onClick={executeStorageAction}
                            disabled={userInputCode !== confirmationCode}
                            className="flex-1 flex items-center justify-center space-x-2 p-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg transition-colors disabled:cursor-not-allowed font-medium"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Confirm & Execute</span>
                          </button>
                          <button
                            onClick={cancelStorageAction}
                            className="flex-1 flex items-center justify-center space-x-2 p-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium"
                          >
                            <span>Cancel</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Storage Overview */}
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Storage Overview</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Total Items:</span>
                        <span className="ml-2 font-medium">{storageInfo.totalItems}</span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Total Size:</span>
                        <span className="ml-2 font-medium">{formatSize(storageInfo.totalSize)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Category Breakdown */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-gray-900 dark:text-white">Storage Categories</h3>
                    {Object.entries(storageInfo.categories).map(([category, info]: [string, any]) => {
                      const categoryInfo = getCategoryInfo(category);
                      const safetyColors = {
                        'safe': 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20',
                        'low-risk': 'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20',
                        'medium-risk': 'border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20',
                        'high-risk': 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20'
                      };
                      
                      return info.count > 0 && (
                        <div key={category} className={`p-4 rounded-lg border ${safetyColors[categoryInfo.safety as keyof typeof safetyColors]}`}>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <span className="text-xl">{categoryInfo.icon}</span>
                              <div>
                                <span className="font-semibold text-gray-900 dark:text-white">
                                  {categoryInfo.name}
                                </span>
                                <div className="text-xs text-gray-600 dark:text-gray-400">
                                  {info.count} items • {formatSize(info.size)}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="mb-3 space-y-2">
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                              <strong>What it is:</strong> {categoryInfo.description}
                            </p>
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                              <strong>Why clear it:</strong> {categoryInfo.why}
                            </p>
                          </div>
                          
                          {/* Category Actions */}
                          <div className="flex space-x-2">
                            {hasExportedData ? (
                              <button
                                onClick={() => initiateStorageAction('clear', category)}
                                className="px-3 py-1.5 text-xs bg-red-600 hover:bg-red-700 text-white rounded transition-colors font-medium"
                              >
                                Clear {categoryInfo.name}
                              </button>
                            ) : (
                              <button
                                onClick={handleQuickExport}
                                disabled={isExporting}
                                className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded transition-colors font-medium"
                                title="Export to enable clear button"
                              >
                                {isExporting ? '⏳ Exporting...' : '📤 Export to Enable Clear'}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Nuclear Option */}
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border-2 border-red-300 dark:border-red-600">
                    <h3 className="font-semibold text-red-800 dark:text-red-200 mb-3 flex items-center">
                      <Trash2 className="w-4 h-4 mr-2" />
                      ☢️ Nuclear Option
                    </h3>
                    <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                      This will delete <strong>everything</strong> - all decks, settings, progress, and achievements. 
                      Only use if you want to completely reset the app to factory defaults.
                    </p>
                    
                    {!nuclearUnlocked ? (
                      <button
                        onClick={unlockNuclearOption}
                        disabled={!hasExportedData}
                        className={`w-full flex items-center justify-center space-x-2 p-3 rounded-lg transition-colors font-medium ${
                          hasExportedData
                            ? 'bg-orange-600 hover:bg-orange-700 text-white'
                            : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                        }`}
                        title={!hasExportedData ? 'Export data first to unlock nuclear option' : 'Click to unlock the nuclear option'}
                      >
                        <Shield className="w-5 h-5" />
                        <span>{hasExportedData ? '🔓 Unlock Nuclear Option' : '📤 Export First to Unlock'}</span>
                      </button>
                    ) : (
                      <div className="space-y-3">
                        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-300 dark:border-yellow-600">
                          <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">
                            ⚠️ Nuclear option is now unlocked! This will require a 12-character confirmation code.
                          </p>
                        </div>
                        <button
                          onClick={() => initiateStorageAction('clear', 'all')}
                          className="w-full flex items-center justify-center space-x-2 p-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
                        >
                          <Trash2 className="w-5 h-5" />
                          <span>☢️ Clear ALL Data</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          </motion.div>

          {/* Accessibility Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
          >
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <Accessibility className="w-5 h-5 mr-2" />
              Accessibility
            </h2>
            <AccessibilitySettings />
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}