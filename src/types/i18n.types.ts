// Language codes following ISO 639-1 standard
export type LanguageCode = 'en' | 'vi' | 'es' | 'fr' | 'de' | 'ja' | 'ko' | 'zh';

// Language metadata for the language picker
export interface Language {
  code: LanguageCode;
  name: string;           // English name: "English", "Vietnamese"
  nativeName: string;     // Native name: "English", "Tiếng Việt"
  flag: string;           // Unicode flag emoji
  direction: 'ltr' | 'rtl'; // Text direction
}

// Available languages configuration
export const AVAILABLE_LANGUAGES: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸', direction: 'ltr' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', flag: '🇻🇳', direction: 'ltr' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', direction: 'ltr' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', direction: 'ltr' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', direction: 'ltr' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵', direction: 'ltr' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷', direction: 'ltr' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳', direction: 'ltr' },
];

// Translation namespace structure
export interface TranslationNamespace {
  // Navigation
  nav: {
    home: string;
    create: string;
    myDecks: string;
    publicDecks: string;
    achievements: string;
    progress: string;
    settings: string;
    appTitle: string;
  };
  
  // Common actions and buttons
  common: {
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    play: string;
    back: string;
    next: string;
    previous: string;
    loading: string;
    error: string;
    success: string;
    confirm: string;
    yes: string;
    no: string;
    refresh: string;
  };
  
  // Home page
  home: {
    title: string;
    subtitle: string;
    featuresTitle: string;
    feature1Title: string;
    feature1Description: string;
    feature2Title: string;
    feature2Description: string;
    feature3Title: string;
    feature3Description: string;
    getStartedButton: string;
    sampleDecksTitle: string;
  };
  
  // Settings page
  settings: {
    title: string;
    subtitle: string;
    languageTitle: string;
    languageDescription: string;
    themeTitle: string;
    themeDescription: string;
    light: string;
    dark: string;
    system: string;
    soundEffects: string;
    dataTitle: string;
    dataDescription: string;
    exportData: string;
    importData: string;
    clearData: string;
  };
  
  // Create page
  create: {
    title: string;
    editTitle: string;
    subtitle: string;
    editSubtitle: string;
    deckNameLabel: string;
    deckNamePlaceholder: string;
    descriptionLabel: string;
    descriptionPlaceholder: string;
    deckInformation: string;
    emojiLabel: string;
    tagsLabel: string;
    tagsPlaceholder: string;
    tagsHelp: string;
    addTag: string;
    easyInterface: string;
    rawMarkdown: string;
    markdownEditor: string;
    upload: string;
    template: string;
    markdownPlaceholder: string;
    interfaceTip: string;
    characterCount: string;
    preview: string;
    cards: string;
    cardNumber: string;
    noCategory: string;
    startCreating: string;
    creating: string;
    created: string;
    updated: string;
    redirecting: string;
    createDeck: string;
    updateDeck: string;
    deck: string;
    fixErrors: string;
    create: string;
    update: string;
    contentLabel: string;
    contentPlaceholder: string;
    visibilityLabel: string;
    public: string;
    private: string;
    createButton: string;
    markdownGuideTitle: string;
    basicFormat: string;
    advancedFormat: string;
  };
  
  // Deck management
  decks: {
    title: string;
    myDecksTitle: string;
    subtitle: string;
    loadingDecks: string;
    publicDecksTitle: string;
    createNewDeck: string;
    noDeckFound: string;
    cards: string;
    lastModified: string;
    playDeck: string;
    editDeck: string;
    deleteDeck: string;
    downloadDeck: string;
    confirmDelete: string;
    createFirstDeck: string;
    noPublicDecks: string;
    exportImportTitle: string;
    exportImportDescription: string;
    exportDecks: string;
    importDecks: string;
    deckOptions: string;
    playedTimes: string;
    lastPlayed: string;
    never: string;
    startStudy: string;
    moreGameModes: string;
    selectGameMode: string;
    studyDescription: string;
    quizDescription: string;
    speedDescription: string;
    memoryDescription: string;
    fallingDescription: string;
  };
  
  // Game modes
  game: {
    studyMode: string;
    quizMode: string;
    speedMode: string;
    memoryMode: string;
    fallingMode: string;
    showAnswer: string;
    nextCard: string;
    correct: string;
    incorrect: string;
    score: string;
    timeLeft: string;
    gameComplete: string;
    playAgain: string;
    backToDecks: string;
    cardProgress: string;
    completed: string;
    knewThis: string;
    didntKnow: string;
    studyComplete: string;
    studyStats: string;
    studyAgain: string;
    questionProgress: string;
    submitAnswer: string;
    nextQuestion: string;
    correctAnswer: string;
    quizComplete: string;
    finalScore: string;
    tryAgain: string;
  };
  
  // Achievements
  achievements: {
    title: string;
    subtitle: string;
    allAchievements: string;
    beginner: string;
    streaks: string;
    master: string;
    unlocked: string;
    total: string;
    points: string;
    complete: string;
    progress: string;
    keepPlaying: string;
  };
  
  // Error messages
  errors: {
    deckNotFound: string;
    invalidFormat: string;
    saveError: string;
    loadError: string;
    networkError: string;
    genericError: string;
    deckNameRequired: string;
    contentRequired: string;
  };
}

// Helper type for deep key paths
export type TranslationKey = string;

// Translation function type
export type TranslationFunction = (key: TranslationKey, params?: Record<string, string | number>) => string;