#!/usr/bin/env node

/**
 * Translation Helper Script for MyFlashPlay
 * 
 * This script helps contributors create new language translation files
 * by providing an interactive setup process.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Language metadata for common languages
const LANGUAGE_OPTIONS = {
  'fr': { name: 'French', nativeName: 'Français', flag: '🇫🇷', direction: 'ltr' },
  'de': { name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', direction: 'ltr' },
  'ja': { name: 'Japanese', nativeName: '日本語', flag: '🇯🇵', direction: 'ltr' },
  'ko': { name: 'Korean', nativeName: '한국어', flag: '🇰🇷', direction: 'ltr' },
  'pt': { name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹', direction: 'ltr' },
  'ru': { name: 'Russian', nativeName: 'Русский', flag: '🇷🇺', direction: 'ltr' },
  'ar': { name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', direction: 'rtl' },
  'hi': { name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳', direction: 'ltr' },
  'it': { name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹', direction: 'ltr' },
  'nl': { name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱', direction: 'ltr' },
  'sv': { name: 'Swedish', nativeName: 'Svenska', flag: '🇸🇪', direction: 'ltr' },
  'no': { name: 'Norwegian', nativeName: 'Norsk', flag: '🇳🇴', direction: 'ltr' },
  'da': { name: 'Danish', nativeName: 'Dansk', flag: '🇩🇰', direction: 'ltr' },
  'fi': { name: 'Finnish', nativeName: 'Suomi', flag: '🇫🇮', direction: 'ltr' },
  'pl': { name: 'Polish', nativeName: 'Polski', flag: '🇵🇱', direction: 'ltr' },
  'tr': { name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷', direction: 'ltr' },
  'th': { name: 'Thai', nativeName: 'ไทย', flag: '🇹🇭', direction: 'ltr' },
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function main() {
  console.log('🌍 MyFlashPlay Translation Helper');
  console.log('=====================================\n');
  
  console.log('This script will help you create a new translation file for MyFlashPlay.');
  console.log('You can either pick from common languages or add a custom one.\n');

  // Show available options
  console.log('📋 Common Languages Available:');
  Object.entries(LANGUAGE_OPTIONS).forEach(([code, info]) => {
    console.log(`   ${code} - ${info.flag} ${info.name} (${info.nativeName})`);
  });
  console.log('   custom - Add a custom language\n');

  // Get language choice
  const languageChoice = await question('Enter language code (e.g., fr, de, custom): ');
  
  let languageCode, languageInfo;
  
  if (languageChoice === 'custom') {
    // Custom language setup
    languageCode = await question('Enter ISO 639-1 language code (2 letters): ');
    const name = await question('Enter English name (e.g., French): ');
    const nativeName = await question('Enter native name (e.g., Français): ');
    const flag = await question('Enter flag emoji (e.g., 🇫🇷): ');
    const direction = await question('Text direction (ltr/rtl) [ltr]: ') || 'ltr';
    
    languageInfo = { name, nativeName, flag, direction };
  } else if (LANGUAGE_OPTIONS[languageChoice]) {
    languageCode = languageChoice;
    languageInfo = LANGUAGE_OPTIONS[languageChoice];
  } else {
    console.error('❌ Invalid language choice. Please run the script again.');
    rl.close();
    return;
  }

  console.log(`\n✅ Creating translation for: ${languageInfo.flag} ${languageInfo.name} (${languageCode})\n`);

  // Check if files already exist
  const translationPath = path.join(__dirname, '..', 'src', 'i18n', 'locales', `${languageCode}.ts`);
  const typesPath = path.join(__dirname, '..', 'src', 'types', 'i18n.types.ts');
  const indexPath = path.join(__dirname, '..', 'src', 'i18n', 'locales', 'index.ts');

  if (fs.existsSync(translationPath)) {
    console.log('⚠️  Translation file already exists. Do you want to overwrite it?');
    const overwrite = await question('Overwrite existing file? (y/N): ');
    if (overwrite.toLowerCase() !== 'y') {
      console.log('❌ Aborted. No changes made.');
      rl.close();
      return;
    }
  }

  try {
    // 1. Create translation file
    console.log('📝 Creating translation file...');
    await createTranslationFile(languageCode, languageInfo, translationPath);
    
    // 2. Update types file
    console.log('🔧 Updating TypeScript types...');
    await updateTypesFile(languageCode, languageInfo, typesPath);
    
    // 3. Update index file
    console.log('📦 Updating index file...');
    await updateIndexFile(languageCode, indexPath);
    
    console.log('\n🎉 Translation setup completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Edit the translation file:', translationPath);
    console.log('2. Run validation: pnpm validate-translations');
    console.log('3. Test build: pnpm build');
    console.log('4. Check the translation guide: docs/TRANSLATION_GUIDE.md');
    console.log('\nHappy translating! 🌟');

  } catch (error) {
    console.error('❌ Error creating translation:', error.message);
  }

  rl.close();
}

async function createTranslationFile(languageCode, languageInfo, filePath) {
  // Read the English template
  const englishPath = path.join(path.dirname(filePath), 'en.ts');
  const englishContent = fs.readFileSync(englishPath, 'utf8');
  
  // Create the new translation file with helpful comments
  const translationContent = `import type { TranslationNamespace } from '../../types/i18n.types';

/**
 * ${languageInfo.name} Translation File (${languageInfo.nativeName})
 * 
 * Translator Instructions:
 * - Translate only the values (text after the colon)
 * - Keep all keys exactly the same as English
 * - Preserve parameter placeholders like {{name}}, {{count}}
 * - Use ${languageInfo.nativeName} punctuation and typography standards
 * - Consider context when choosing formal vs informal language
 * 
 * For help, see: docs/TRANSLATION_GUIDE.md
 */

const ${languageCode}: TranslationNamespace = {
  // Navigation - Main app navigation items
  nav: {
    home: 'Home', // TODO: Translate to ${languageInfo.nativeName}
    create: 'Create',
    myDecks: 'My Decks',
    publicDecks: 'Public Decks',
    achievements: 'Achievements',
    progress: 'Progress',
    settings: 'Settings',
    appTitle: 'MyFlashPlay',
  },

  // Common actions and buttons
  common: {
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    play: 'Play',
    back: 'Back',
    next: 'Next',
    previous: 'Previous',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    confirm: 'Confirm',
    yes: 'Yes',
    no: 'No',
    refresh: 'Refresh Page',
  },

  // TODO: Continue translating the remaining sections
  // Copy from en.ts and translate all values
  // Remember to keep the structure exactly the same!

  home: {
    title: 'Learn Anything with Interactive Flashcards',
    subtitle: 'Create, study, and master any subject with our powerful flashcard platform',
    featuresTitle: 'Powerful Features',
    feature1Title: 'Simple Markdown Format',
    feature1Description: 'Create flashcards with an intuitive one-line format: Question :: Answer',
    feature2Title: 'Multiple Game Modes',
    feature2Description: 'Study, Quiz, Speed Challenge, Memory Match, and Falling Quiz modes',
    feature3Title: 'Multi-Language Support',
    feature3Description: 'Full UTF-8 support for studying in any language worldwide',
    getStartedButton: 'Get Started',
    sampleDecksTitle: 'Sample Decks',
  },

  settings: {
    title: 'Settings',
    subtitle: 'Customize your MyFlashPlay experience',
    languageTitle: 'Language',
    languageDescription: 'Choose your preferred language for the interface',
    themeTitle: 'Theme',
    themeDescription: 'Choose your preferred color scheme',
    light: 'Light',
    dark: 'Dark',
    system: 'System',
    soundEffects: 'Sound Effects',
    dataTitle: 'Data Management',
    dataDescription: 'Import, export, or clear your flashcard data',
    exportData: 'Export Data',
    importData: 'Import Data',
    clearData: 'Clear All Data',
  },

  // TODO: Add remaining sections from en.ts:
  // - create: { ... }
  // - decks: { ... }
  // - game: { ... }
  // - achievements: { ... }
  // - errors: { ... }

  create: {
    title: 'Create New Deck',
    editTitle: 'Edit Flashcards',
    subtitle: 'Choose your preferred way to create flashcards - use our easy interface or write Markdown directly!',
    editSubtitle: 'Edit your flashcard deck using our easy interface or Markdown directly!',
    deckNameLabel: 'Deck Name',
    deckNamePlaceholder: 'Enter a name for your deck',
    descriptionLabel: 'Description',
    descriptionPlaceholder: 'Describe what this deck covers',
    deckInformation: 'Deck Information',
    emojiLabel: 'Emoji',
    tagsLabel: 'Tags',
    tagsPlaceholder: 'Add tags (press Enter or comma to add)',
    tagsHelp: 'Tags help organize and categorize your flashcard decks. Press Enter or comma to add multiple tags.',
    addTag: 'Add',
    easyInterface: 'Easy Interface',
    rawMarkdown: 'Raw Markdown',
    markdownEditor: 'Markdown Editor',
    upload: 'Upload',
    template: 'Template',
    markdownPlaceholder: 'Paste your Markdown content here...',
    interfaceTip: 'Tip: Switch to Easy Interface for a guided experience',
    characterCount: '{{count}} characters',
    preview: 'Preview',
    cards: 'cards',
    cardNumber: 'Card {{number}}',
    noCategory: 'No category',
    startCreating: 'Start creating to see your flashcards appear here!',
    creating: 'Creating...',
    created: 'Created!',
    updated: 'Updated!',
    redirecting: 'Redirecting...',
    createDeck: 'Create',
    updateDeck: 'Update',
    deck: 'Deck',
    fixErrors: 'Fix validation errors to',
    create: 'create',
    update: 'update',
    contentLabel: 'Flashcard Content',
    contentPlaceholder: 'Question 1 :: Answer 1\\nQuestion 2 :: Answer 2',
    visibilityLabel: 'Visibility',
    public: 'Public',
    private: 'Private',
    createButton: 'Create Deck',
    markdownGuideTitle: 'Markdown Guide',
    basicFormat: 'Basic Format: Question :: Answer',
    advancedFormat: 'Advanced: Multiple choice, categories, and more',
  },

  decks: {
    title: 'Flashcard Decks',
    myDecksTitle: 'My Decks',
    subtitle: 'Manage and play your flashcard collections',
    loadingDecks: 'Loading your decks...',
    publicDecksTitle: 'Public Decks',
    createNewDeck: 'Create New Deck',
    noDeckFound: 'No decks found',
    cards: 'cards',
    lastModified: 'Last modified',
    playDeck: 'Play Deck',
    editDeck: 'Edit Deck',
    deleteDeck: 'Delete Deck',
    downloadDeck: 'Download Deck',
    confirmDelete: 'Are you sure you want to delete',
    createFirstDeck: 'Create your first deck to get started!',
    noPublicDecks: 'No public decks available at the moment.',
    exportImportTitle: 'Export & Import Your Decks',
    exportImportDescription: 'Want to backup your decks or share them? You can export and import your flashcard collections.',
    exportDecks: 'Export Decks',
    importDecks: 'Import Decks',
    deckOptions: 'Deck options',
    playedTimes: 'Played {{count}} times',
    lastPlayed: 'Last played',
    never: 'Never',
    startStudy: 'Start Study',
    moreGameModes: 'More game modes',
    selectGameMode: 'Select a game mode:',
    studyDescription: 'Learn at your own pace',
    quizDescription: 'Test your knowledge',
    speedDescription: 'Race against time',
    memoryDescription: 'Match pairs',
    fallingDescription: 'Answer falling quizzes',
  },

  game: {
    studyMode: 'Study Mode',
    quizMode: 'Quiz Mode',
    speedMode: 'Speed Challenge',
    memoryMode: 'Memory Match',
    fallingMode: 'Falling Quiz',
    showAnswer: 'Show Answer',
    nextCard: 'Next Card',
    correct: 'Correct!',
    incorrect: 'Incorrect',
    score: 'Score',
    timeLeft: 'Time Left',
    gameComplete: 'Game Complete!',
    playAgain: 'Play Again',
    backToDecks: 'Back to Decks',
    cardProgress: 'Card {{current}} of {{total}}',
    completed: 'Completed',
    knewThis: 'I knew this',
    didntKnow: 'I didn\\'t know',
    studyComplete: 'Study Session Complete!',
    studyStats: 'You completed {{correct}} out of {{total}} cards correctly.',
    studyAgain: 'Study Again',
    questionProgress: 'Question {{current}} of {{total}}',
    submitAnswer: 'Submit Answer',
    nextQuestion: 'Next Question',
    correctAnswer: 'Correct answer',
    quizComplete: 'Quiz Complete!',
    finalScore: 'Final Score',
    tryAgain: 'Try Again',
  },

  achievements: {
    title: 'Achievement Gallery',
    subtitle: 'Track your progress and unlock rewards!',
    allAchievements: 'All Achievements',
    beginner: 'Beginner',
    streaks: 'Streaks',
    master: 'Master',
    unlocked: 'Unlocked',
    total: 'Total',
    points: 'Points',
    complete: 'Complete',
    progress: 'Progress',
    keepPlaying: 'Keep playing to unlock more achievements!',
  },

  errors: {
    deckNotFound: 'Deck not found',
    invalidFormat: 'Invalid flashcard format',
    saveError: 'Failed to save. Please try again.',
    loadError: 'Failed to load content. Please refresh the page.',
    networkError: 'Network error. Please check your connection.',
    genericError: 'Something went wrong. Please try again.',
    deckNameRequired: 'Deck name is required',
    contentRequired: 'Flashcard content is required',
  },
};

export default ${languageCode};
`;

  fs.writeFileSync(filePath, translationContent, 'utf8');
}

async function updateTypesFile(languageCode, languageInfo, typesPath) {
  let content = fs.readFileSync(typesPath, 'utf8');
  
  // Update LanguageCode type
  const languageCodeRegex = /export type LanguageCode = '([^']+)'([^;]*);/;
  const match = content.match(languageCodeRegex);
  if (match) {
    const existingCodes = match[1] + match[2];
    if (!existingCodes.includes(`'${languageCode}'`)) {
      const newType = `export type LanguageCode = '${match[1]}'${match[2]} | '${languageCode}';`;
      content = content.replace(languageCodeRegex, newType);
    }
  }
  
  // Update AVAILABLE_LANGUAGES array
  const availableLanguagesRegex = /(export const AVAILABLE_LANGUAGES: Language\[\] = \[)([\s\S]*?)(\];)/;
  const arrayMatch = content.match(availableLanguagesRegex);
  if (arrayMatch) {
    const existingArray = arrayMatch[2];
    if (!existingArray.includes(`code: '${languageCode}'`)) {
      const newEntry = `  { code: '${languageCode}', name: '${languageInfo.name}', nativeName: '${languageInfo.nativeName}', flag: '${languageInfo.flag}', direction: '${languageInfo.direction}' },`;
      const newArray = existingArray.trim() + '\n' + newEntry;
      content = content.replace(availableLanguagesRegex, `$1\n${newArray}\n$3`);
    }
  }
  
  fs.writeFileSync(typesPath, content, 'utf8');
}

async function updateIndexFile(languageCode, indexPath) {
  let content = fs.readFileSync(indexPath, 'utf8');
  
  // Add import to translations object
  const translationsRegex = /(export const translations = \{)([\s\S]*?)(\};)/;
  const match = content.match(translationsRegex);
  if (match) {
    const existingTranslations = match[2];
    if (!existingTranslations.includes(`${languageCode}:`)) {
      const newEntry = `  ${languageCode}: () => import('./${languageCode}'),`;
      const newTranslations = existingTranslations.trim() + '\n' + newEntry;
      content = content.replace(translationsRegex, `$1\n${newTranslations}\n$3`);
    }
  }
  
  fs.writeFileSync(indexPath, content, 'utf8');
}

// Run the script
main().catch(console.error);