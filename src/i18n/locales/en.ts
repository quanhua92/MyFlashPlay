import type { TranslationNamespace } from '../../types/i18n.types';

/**
 * English Translation File - Master Template
 * 
 * This file serves as the reference for all other languages.
 * When adding new translation keys:
 * 1. Add them here first
 * 2. Update the TranslationNamespace type
 * 3. Add corresponding keys to all other language files
 * 
 * For contributors: Copy this file and translate only the values,
 * keeping all keys exactly the same.
 */

const en: TranslationNamespace = {
  // Navigation - Main app navigation items
  nav: {
    home: 'Home',
    create: 'Create',
    myDecks: 'My Decks',
    publicDecks: 'Public Decks',
    achievements: 'Achievements',
    progress: 'Progress',
    settings: 'Settings',
    appTitle: 'MyFlashPlay',
  },

  // Common - Reusable buttons, actions, and status messages
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

  // Home Page - Landing page content and features
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

  // Settings Page - All configuration options
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

  // Create Page - Deck creation form and guidance
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
    contentPlaceholder: 'Question 1 :: Answer 1\nQuestion 2 :: Answer 2',
    visibilityLabel: 'Visibility',
    public: 'Public',
    private: 'Private',
    createButton: 'Create Deck',
    markdownGuideTitle: 'Markdown Guide',
    basicFormat: 'Basic Format: Question :: Answer',
    advancedFormat: 'Advanced: Multiple choice, categories, and more',
  },

  // Deck Management - Deck listing and actions
  decks: {
    title: 'Flashcard Decks',
    myDecksTitle: 'My Decks',
    subtitle: 'Manage and play your flashcard collections',
    loadingDecks: 'Loading your decks...',
    publicDecksTitle: 'Public Decks',
    createNewDeck: 'Create New Deck',
    noDeckFound: 'No decks found',
    cards: 'cards', // Used as: "5 cards"
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

  // Game Modes - All game interfaces and feedback
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
    didntKnow: 'I didn\'t know',
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

  // Achievements - Progress tracking and gamification  
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

  // Error Messages - User-facing error handling
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

export default en;