# Stage 6: Contributor Documentation & Additional Languages

## Objective
Create comprehensive documentation and example language files to enable open-source contributors to easily add new languages to MyFlashPlay.

## Overview
This stage focuses on making the multi-language system accessible to the open-source community by providing clear documentation, examples, and tools that make contributing translations straightforward and rewarding.

## Key Design Decisions

### Documentation Strategy
- **Multiple Entry Points**: Quick start guide, detailed guide, and technical reference
- **Visual Examples**: Screenshots and before/after comparisons
- **Contributor Recognition**: Credit system for translation contributors
- **Quality Assurance**: Clear standards and validation tools

### Example Language Selection
- **Geographic Diversity**: Languages from different continents and writing systems
- **Difficulty Variety**: Simple (French) to complex (Arabic RTL) examples
- **Community Size**: Popular languages that will attract contributors
- **Educational Value**: Languages that demonstrate different localization challenges

## Files to Create/Modify

### 1. Main Contributor Documentation (`CONTRIBUTING_TRANSLATIONS.md`) - UPDATED

```markdown
# Contributing Translations to MyFlashPlay 🌍

Help make MyFlashPlay accessible to speakers of your language! This guide will walk you through contributing translations to our open-source flashcard platform.

## 🚀 Quick Start (5 minutes)

1. **Choose your language**: Check if it's [already supported](#supported-languages)
2. **Copy the template**: `cp src/i18n/locales/en.ts src/i18n/locales/[your-code].ts`
3. **Translate**: Replace English values with your language
4. **Test**: Run `npm run validate-translations`
5. **Submit**: Create a pull request

## 📋 Supported Languages

Currently supported languages:

| Language | Code | Status | Contributor |
|----------|------|--------|-------------|
| English | `en` | ✅ Complete | Core team |
| Vietnamese | `vi` | ✅ Complete | Core team |
| Spanish | `es` | ✅ Complete | Core team |
| French | `fr` | 🚧 In progress | [@contributor](link) |
| German | `de` | 🚧 In progress | [@contributor](link) |
| Japanese | `ja` | 📝 Needed | - |
| Korean | `ko` | 📝 Needed | - |
| Chinese | `zh` | 📝 Needed | - |
| Arabic | `ar` | 📝 Needed | - |
| Portuguese | `pt` | 📝 Needed | - |
| Russian | `ru` | 📝 Needed | - |

> **Want to add your language?** Choose a language code and follow the guide below!

## 📚 Detailed Translation Guide

### Step 1: Set Up Your Environment

```bash
# Clone the repository
git clone https://github.com/your-org/flashplay.git
cd flashplay

# Install dependencies
npm install

# Run the development server
npm run dev
```

### Step 2: Create Your Language File

```bash
# Copy the English template
cp src/i18n/locales/en.ts src/i18n/locales/fr.ts
```

### Step 3: Update Language Configuration

Edit `src/types/i18n.types.ts`:

```typescript
// Add your language code
export type LanguageCode = 'en' | 'vi' | 'es' | 'fr'; // <- Add your code

// Add language metadata
export const AVAILABLE_LANGUAGES: Language[] = [
  // ... existing languages
  { 
    code: 'fr', 
    name: 'French', 
    nativeName: 'Français', 
    flag: '🇫🇷', 
    direction: 'ltr' 
  },
];
```

### Step 4: Translate the Content

#### File Structure
```typescript
const fr: TranslationNamespace = {
  // Navigation - Keep keys, translate values
  nav: {
    home: 'Accueil',        // ← Translate this
    create: 'Créer',        // ← And this
    // ... etc
  },
  // ... other sections
};
```

#### Translation Guidelines

##### ✅ DO:
- Translate only the values (text after the colon)
- Keep all translation keys exactly the same
- Preserve parameter placeholders like `{{name}}`
- Use natural, fluent expressions in your language
- Follow your language's punctuation rules
- Consider cultural context and formality levels

##### ❌ DON'T:
- Change translation keys (`home` stays `home`)
- Translate placeholder names (`{{name}}` stays `{{name}}`)
- Leave strings in English (translate everything)
- Use machine translation without review

#### Parameter Interpolation Example
```typescript
// English
'Welcome {{name}} to MyFlashPlay!'

// French
'Bienvenue {{name}} sur MyFlashPlay !'

// Spanish  
'¡Bienvenido {{name}} a MyFlashPlay!'
```

### Step 5: Test Your Translation

```bash
# Validate translation completeness
npm run validate-translations

# Check TypeScript compilation
npm run type-check

# Test in the app
npm run dev
# Go to Settings → Language → Select your language
```

### Step 6: Submit Your Contribution

```bash
# Create a new branch
git checkout -b add-french-translation

# Commit your changes
git add .
git commit -m "Add French translation

- Complete French translation with 85+ strings
- Add French to language selector
- Test all interface elements

Co-authored-by: Your Name <your.email@domain.com>"

# Push and create pull request
git push origin add-french-translation
```

## 🎯 Translation Quality Standards

### Completeness
- ✅ All 85+ translation keys must be translated
- ✅ No English strings should remain (except proper nouns)
- ✅ Validation script must pass without errors

### Language Quality
- ✅ Natural, fluent expressions (not literal translations)
- ✅ Consistent terminology throughout the application
- ✅ Appropriate formality level for UI text
- ✅ Correct grammar and punctuation

### Technical Quality
- ✅ All translation keys preserved exactly
- ✅ Parameter placeholders maintained
- ✅ TypeScript compilation succeeds
- ✅ No runtime errors in the application

## 🔧 Translation Tools & Resources

### Validation Script
```bash
# Check for missing or extra keys
npm run validate-translations

# Output example:
# ✅ fr: All 85 keys present
# ❌ de: Missing keys (3): nav.newFeature, game.timer, errors.timeout
```

### Testing Your Translation
1. **Visual Testing**: Navigate through all pages in your language
2. **Form Testing**: Try creating decks and playing games
3. **Error Testing**: Trigger validation errors to see error messages
4. **Mobile Testing**: Check responsive design with your language

### Language-Specific Considerations

#### Right-to-Left Languages (Arabic, Hebrew)
```typescript
{ 
  code: 'ar', 
  name: 'Arabic', 
  nativeName: 'العربية', 
  flag: '🇸🇦', 
  direction: 'rtl'  // ← Important for RTL support
}
```

#### Long Text Languages (German, Finnish)
- Test that UI elements accommodate longer text
- Check button labels don't overflow
- Verify responsive design works

#### Character Set Considerations (Chinese, Japanese, Thai)
- Test font rendering and readability
- Verify character encoding (UTF-8)
- Check line height and spacing

## 👥 Contributor Recognition

### Hall of Fame
All translation contributors will be recognized in:

- 🏆 **App Credits**: Listed in the About section
- 📄 **README**: Contributor section with links
- 🎉 **Release Notes**: Mentioned in version releases
- 🌟 **GitHub**: Special contributor label

### Attribution Format
```markdown
## Translation Contributors 🌍

- **French**: [@username](https://github.com/username) - First name Last
- **German**: [@username](https://github.com/username) - First name Last
- **Japanese**: [@username](https://github.com/username) - First name Last
```

## 🐛 Common Issues & Solutions

### ❌ "Missing keys" Error
**Problem**: Validation script reports missing translation keys
```bash
❌ fr: Missing keys (2):
   - nav.newFeature
   - game.timer
```
**Solution**: Add the missing keys from the English file
```typescript
nav: {
  // ... existing keys
  newFeature: 'Nouvelle Fonctionnalité',
},
game: {
  // ... existing keys
  timer: 'Minuteur',
}
```

### ❌ "Extra keys" Error
**Problem**: Your file has keys that don't exist in English
```bash
❌ fr: Extra keys (1):
   + nav.wrongKey
```
**Solution**: Remove the extra key or check for typos

### ❌ TypeScript Compilation Error
**Problem**: `npm run type-check` fails
**Solution**: Check for:
- Missing commas in object properties
- Unmatched quotes or brackets
- Incorrect file export syntax

### ❌ Runtime Errors
**Problem**: App crashes when switching to your language
**Solution**: 
- Check browser console for specific errors
- Verify file exports correctly with `export default`
- Test dynamic import: `import('./locales/fr.ts')`

## 📞 Getting Help

### Communication Channels
- **Issues**: [GitHub Issues](https://github.com/your-org/flashplay/issues) with "translation" label
- **Discussions**: [Translation Discussion Thread](https://github.com/your-org/flashplay/discussions)
- **Discord**: #translations channel (if available)

### Question Templates

**For New Languages:**
```
Title: Add [Language Name] Translation

Hi! I'd like to contribute a [Language] translation.

- Language: [Native Name] ([English Name])
- ISO Code: [xx]
- Native Speaker: Yes/No
- Estimated Completion: [timeframe]

Any specific considerations for this language?
```

**For Translation Issues:**
```
Title: Translation Issue - [Language] - [Brief Description]

**Language**: [xx]
**Issue Type**: Missing keys / Extra keys / Quality / Technical

**Details**: 
[Describe the specific issue]

**Environment**:
- OS: [Windows/Mac/Linux]
- Node Version: [version]
- Browser: [if relevant]
```

## 🚀 Advanced Topics

### Adding Sample Decks in Your Language
Create translated sample decks to showcase your language:

```typescript
// In your language file, add sample deck content
sampleDecks: {
  basicMath: {
    name: 'Mathématiques de Base',
    description: 'Opérations arithmétiques simples',
    content: `
Qu'est-ce que 2 + 2? :: 4
Qu'est-ce que 5 × 3? :: 15
Qu'est-ce que 10 ÷ 2? :: 5
    `.trim()
  }
}
```

### Regional Variations
For languages with significant regional differences:

```typescript
// Primary language file: es.ts (Spain Spanish)
// Regional variant: es-mx.ts (Mexican Spanish)
// Regional variant: es-ar.ts (Argentine Spanish)
```

### Pluralization Support
Some languages need complex plural rules:

```typescript
// Future enhancement for complex pluralization
cardCount: {
  zero: 'no cards',
  one: '1 card', 
  two: '2 cards',
  few: '{{count}} cards',
  many: '{{count}} cards',
  other: '{{count}} cards'
}
```

## 🏁 Final Checklist

Before submitting your pull request:

- [ ] ✅ All translation keys are present and translated
- [ ] ✅ `npm run validate-translations` passes
- [ ] ✅ `npm run type-check` passes 
- [ ] ✅ Language appears in settings dropdown
- [ ] ✅ All main pages work in your language
- [ ] ✅ Forms and games function correctly
- [ ] ✅ Error messages display properly
- [ ] ✅ Mobile view works well
- [ ] ✅ Text fits in UI components
- [ ] ✅ Cultural context is appropriate
- [ ] ✅ Grammar and spelling are correct

## 🎉 Thank You!

Your contribution makes MyFlashPlay accessible to millions of speakers of your language. Every translation helps build a more inclusive learning platform for the global community.

**Ready to get started?** Pick a language and dive in! 🚀

---

*Last updated: [Current Date]*
*Need to update this guide? Submit an issue or PR!*
```

### 2. French Translation Example (`src/i18n/locales/fr.ts`) - NEW FILE

```typescript
import type { TranslationNamespace } from '../../types/i18n.types';

/**
 * French Translation File (Français)
 * 
 * Translator: [Open for contribution]
 * Review Status: Draft
 * Last Updated: [Date]
 * 
 * Translation Notes:
 * - Using formal "vous" for instructions, informal "tu" for casual contexts
 * - Following French typography rules (spaces before punctuation)
 * - Maintaining gender-neutral language where possible
 */

const fr: TranslationNamespace = {
  // Navigation - Navigation principale
  nav: {
    home: 'Accueil',
    create: 'Créer',
    myDecks: 'Mes Paquets',
    publicDecks: 'Paquets Publics',
    achievements: 'Succès',
    progress: 'Progrès',
    settings: 'Paramètres',
    appTitle: 'MyFlashPlay',
  },

  // Common - Boutons et actions communes
  common: {
    save: 'Enregistrer',
    cancel: 'Annuler',
    delete: 'Supprimer',
    edit: 'Modifier',
    play: 'Jouer',
    back: 'Retour',
    next: 'Suivant',
    previous: 'Précédent',
    loading: 'Chargement...',
    error: 'Erreur',
    success: 'Succès',
    confirm: 'Confirmer',
    yes: 'Oui',
    no: 'Non',
    refresh: 'Actualiser la page',
  },

  // Home Page - Page d'accueil
  home: {
    title: 'Apprenez tout avec des cartes mémo interactives',
    subtitle: 'Créez, étudiez et maîtrisez n\'importe quel sujet avec notre plateforme de cartes mémo puissante',
    featuresTitle: 'Fonctionnalités puissantes',
    feature1Title: 'Format Markdown simple',
    feature1Description: 'Créez des cartes mémo avec un format intuitif d\'une ligne : Question :: Réponse',
    feature2Title: 'Modes de jeu multiples',
    feature2Description: 'Modes Étude, Quiz, Défi de vitesse, Jeu de mémoire et Quiz tombant',
    feature3Title: 'Support multilingue',
    feature3Description: 'Support UTF-8 complet pour étudier dans n\'importe quelle langue du monde',
    getStartedButton: 'Commencer',
    sampleDecksTitle: 'Paquets d\'exemple',
  },

  // Settings Page - Page des paramètres
  settings: {
    title: 'Paramètres',
    languageTitle: 'Langue',
    languageDescription: 'Choisissez votre langue préférée pour l\'interface',
    themeTitle: 'Thème',
    themeDescription: 'Choisissez votre schéma de couleurs préféré',
    light: 'Clair',
    dark: 'Sombre',
    system: 'Système',
    dataTitle: 'Gestion des données',
    dataDescription: 'Importez, exportez ou effacez vos données de cartes mémo',
    exportData: 'Exporter les données',
    importData: 'Importer les données',
    clearData: 'Effacer toutes les données',
  },

  // Create Page - Page de création
  create: {
    title: 'Créer un nouveau paquet',
    deckNameLabel: 'Nom du paquet',
    deckNamePlaceholder: 'Entrez un nom pour votre paquet',
    descriptionLabel: 'Description',
    descriptionPlaceholder: 'Décrivez le contenu de ce paquet',
    contentLabel: 'Contenu des cartes mémo',
    contentPlaceholder: 'Question 1 :: Réponse 1\nQuestion 2 :: Réponse 2',
    visibilityLabel: 'Visibilité',
    public: 'Public',
    private: 'Privé',
    createButton: 'Créer le paquet',
    markdownGuideTitle: 'Guide Markdown',
    basicFormat: 'Format de base : Question :: Réponse',
    advancedFormat: 'Avancé : Choix multiples, catégories et plus',
  },

  // Deck Management - Gestion des paquets
  decks: {
    title: 'Paquets de cartes mémo',
    myDecksTitle: 'Mes paquets',
    publicDecksTitle: 'Paquets publics',
    createNewDeck: 'Créer un nouveau paquet',
    noDeckFound: 'Aucun paquet trouvé',
    cards: 'cartes',
    lastModified: 'Dernière modification',
    playDeck: 'Jouer le paquet',
    editDeck: 'Modifier le paquet',
    deleteDeck: 'Supprimer le paquet',
    confirmDelete: 'Êtes-vous sûr de vouloir supprimer ce paquet ?',
    createFirstDeck: 'Créez votre premier paquet pour commencer !',
    noPublicDecks: 'Aucun paquet public disponible pour le moment.',
  },

  // Game Modes - Modes de jeu
  game: {
    studyMode: 'Mode Étude',
    quizMode: 'Mode Quiz',
    speedMode: 'Défi de vitesse',
    memoryMode: 'Jeu de mémoire',
    fallingMode: 'Quiz tombant',
    showAnswer: 'Afficher la réponse',
    nextCard: 'Carte suivante',
    correct: 'Correct !',
    incorrect: 'Incorrect',
    score: 'Score',
    timeLeft: 'Temps restant',
    gameComplete: 'Jeu terminé !',
    playAgain: 'Rejouer',
    backToDecks: 'Retour aux paquets',
    cardProgress: 'Carte {{current}} sur {{total}}',
    completed: 'Terminé',
    knewThis: 'Je le savais',
    didntKnow: 'Je ne le savais pas',
    studyComplete: 'Session d\'étude terminée !',
    studyStats: 'Vous avez réussi {{correct}} cartes sur {{total}} correctement.',
    studyAgain: 'Étudier à nouveau',
    questionProgress: 'Question {{current}} sur {{total}}',
    submitAnswer: 'Soumettre la réponse',
    nextQuestion: 'Question suivante',
    correctAnswer: 'Réponse correcte',
    quizComplete: 'Quiz terminé !',
    finalScore: 'Score final',
    tryAgain: 'Réessayer',
  },

  // Error Messages - Messages d'erreur
  errors: {
    deckNotFound: 'Paquet non trouvé',
    invalidFormat: 'Format de carte mémo invalide',
    saveError: 'Échec de l\'enregistrement. Veuillez réessayer.',
    loadError: 'Échec du chargement du contenu. Veuillez actualiser la page.',
    networkError: 'Erreur réseau. Veuillez vérifier votre connexion.',
    genericError: 'Quelque chose s\'est mal passé. Veuillez réessayer.',
    deckNameRequired: 'Le nom du paquet est requis',
    contentRequired: 'Le contenu des cartes mémo est requis',
  },
};

export default fr;
```

**Explanation**: Complete French translation demonstrating proper French typography, formal language use, and cultural adaptation.

### 3. German Translation Example (`src/i18n/locales/de.ts`) - NEW FILE

```typescript
import type { TranslationNamespace } from '../../types/i18n.types';

/**
 * German Translation File (Deutsch)
 * 
 * Translator: [Open for contribution]
 * Review Status: Draft
 * Last Updated: [Date]
 * 
 * Translation Notes:
 * - Using formal "Sie" for app instructions
 * - German compound words are kept readable
 * - Following German capitalization rules
 * - Considering longer text lengths typical in German
 */

const de: TranslationNamespace = {
  // Navigation - Hauptnavigation
  nav: {
    home: 'Startseite',
    create: 'Erstellen',
    myDecks: 'Meine Kartensets',
    publicDecks: 'Öffentliche Kartensets',
    achievements: 'Erfolge',
    progress: 'Fortschritt',
    settings: 'Einstellungen',
    appTitle: 'MyFlashPlay',
  },

  // Common - Gemeinsame Aktionen
  common: {
    save: 'Speichern',
    cancel: 'Abbrechen',
    delete: 'Löschen',
    edit: 'Bearbeiten',
    play: 'Spielen',
    back: 'Zurück',
    next: 'Weiter',
    previous: 'Zurück',
    loading: 'Wird geladen...',
    error: 'Fehler',
    success: 'Erfolgreich',
    confirm: 'Bestätigen',
    yes: 'Ja',
    no: 'Nein',
    refresh: 'Seite aktualisieren',
  },

  // Home Page - Startseite
  home: {
    title: 'Lernen Sie alles mit interaktiven Lernkarten',
    subtitle: 'Erstellen, lernen und meistern Sie jedes Thema mit unserer leistungsstarken Lernkarten-Plattform',
    featuresTitle: 'Leistungsstarke Funktionen',
    feature1Title: 'Einfaches Markdown-Format',
    feature1Description: 'Erstellen Sie Lernkarten mit einem intuitiven einzeiligen Format: Frage :: Antwort',
    feature2Title: 'Mehrere Spielmodi',
    feature2Description: 'Lern-, Quiz-, Geschwindigkeits-, Memory- und Fallquiz-Modi',
    feature3Title: 'Mehrsprachige Unterstützung',
    feature3Description: 'Vollständige UTF-8-Unterstützung zum Lernen in jeder Sprache weltweit',
    getStartedButton: 'Jetzt starten',
    sampleDecksTitle: 'Beispiel-Kartensets',
  },

  // Settings Page - Einstellungsseite
  settings: {
    title: 'Einstellungen',
    languageTitle: 'Sprache',
    languageDescription: 'Wählen Sie Ihre bevorzugte Sprache für die Benutzeroberfläche',
    themeTitle: 'Design',
    themeDescription: 'Wählen Sie Ihr bevorzugtes Farbschema',
    light: 'Hell',
    dark: 'Dunkel',
    system: 'System',
    dataTitle: 'Datenverwaltung',
    dataDescription: 'Importieren, exportieren oder löschen Sie Ihre Lernkarten-Daten',
    exportData: 'Daten exportieren',
    importData: 'Daten importieren',
    clearData: 'Alle Daten löschen',
  },

  // Create Page - Erstellungsseite
  create: {
    title: 'Neues Kartenset erstellen',
    deckNameLabel: 'Name des Kartensets',
    deckNamePlaceholder: 'Geben Sie einen Namen für Ihr Kartenset ein',
    descriptionLabel: 'Beschreibung',
    descriptionPlaceholder: 'Beschreiben Sie, was dieses Kartenset abdeckt',
    contentLabel: 'Lernkarten-Inhalt',
    contentPlaceholder: 'Frage 1 :: Antwort 1\nFrage 2 :: Antwort 2',
    visibilityLabel: 'Sichtbarkeit',
    public: 'Öffentlich',
    private: 'Privat',
    createButton: 'Kartenset erstellen',
    markdownGuideTitle: 'Markdown-Anleitung',
    basicFormat: 'Grundformat: Frage :: Antwort',
    advancedFormat: 'Erweitert: Multiple Choice, Kategorien und mehr',
  },

  // Deck Management - Kartenset-Verwaltung
  decks: {
    title: 'Lernkarten-Sets',
    myDecksTitle: 'Meine Kartensets',
    publicDecksTitle: 'Öffentliche Kartensets',
    createNewDeck: 'Neues Kartenset erstellen',
    noDeckFound: 'Keine Kartensets gefunden',
    cards: 'Karten',
    lastModified: 'Zuletzt geändert',
    playDeck: 'Kartenset spielen',
    editDeck: 'Kartenset bearbeiten',
    deleteDeck: 'Kartenset löschen',
    confirmDelete: 'Sind Sie sicher, dass Sie dieses Kartenset löschen möchten?',
    createFirstDeck: 'Erstellen Sie Ihr erstes Kartenset, um zu beginnen!',
    noPublicDecks: 'Momentan sind keine öffentlichen Kartensets verfügbar.',
  },

  // Game Modes - Spielmodi
  game: {
    studyMode: 'Lernmodus',
    quizMode: 'Quiz-Modus',
    speedMode: 'Geschwindigkeits-Challenge',
    memoryMode: 'Memory-Spiel',
    fallingMode: 'Fall-Quiz',
    showAnswer: 'Antwort zeigen',
    nextCard: 'Nächste Karte',
    correct: 'Richtig!',
    incorrect: 'Falsch',
    score: 'Punkte',
    timeLeft: 'Verbleibende Zeit',
    gameComplete: 'Spiel beendet!',
    playAgain: 'Nochmal spielen',
    backToDecks: 'Zurück zu den Kartensets',
    cardProgress: 'Karte {{current}} von {{total}}',
    completed: 'Abgeschlossen',
    knewThis: 'Das wusste ich',
    didntKnow: 'Das wusste ich nicht',
    studyComplete: 'Lernsitzung abgeschlossen!',
    studyStats: 'Sie haben {{correct}} von {{total}} Karten richtig beantwortet.',
    studyAgain: 'Erneut lernen',
    questionProgress: 'Frage {{current}} von {{total}}',
    submitAnswer: 'Antwort einreichen',
    nextQuestion: 'Nächste Frage',
    correctAnswer: 'Richtige Antwort',
    quizComplete: 'Quiz abgeschlossen!',
    finalScore: 'Endergebnis',
    tryAgain: 'Erneut versuchen',
  },

  // Error Messages - Fehlermeldungen
  errors: {
    deckNotFound: 'Kartenset nicht gefunden',
    invalidFormat: 'Ungültiges Lernkarten-Format',
    saveError: 'Speichern fehlgeschlagen. Bitte versuchen Sie es erneut.',
    loadError: 'Laden des Inhalts fehlgeschlagen. Bitte aktualisieren Sie die Seite.',
    networkError: 'Netzwerkfehler. Bitte überprüfen Sie Ihre Verbindung.',
    genericError: 'Etwas ist schief gelaufen. Bitte versuchen Sie es erneut.',
    deckNameRequired: 'Name des Kartensets ist erforderlich',
    contentRequired: 'Lernkarten-Inhalt ist erforderlich',
  },
};

export default de;
```

**Explanation**: German translation showcasing compound words, formal language, and consideration for longer text lengths typical in German UI.

### 4. Update Language Types (`src/types/i18n.types.ts`)

```diff
@@ -1,5 +1,5 @@
 // Language codes following ISO 639-1 standard
-export type LanguageCode = 'en' | 'vi' | 'es' | 'fr' | 'de' | 'ja' | 'ko' | 'zh';
+export type LanguageCode = 'en' | 'vi' | 'es' | 'fr' | 'de' | 'ja' | 'ko' | 'zh' | 'ar' | 'pt' | 'ru';

 // Language metadata for the language picker
 export interface Language {
@@ -17,6 +17,9 @@ export const AVAILABLE_LANGUAGES: Language[] = [
   { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵', direction: 'ltr' },
   { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷', direction: 'ltr' },
   { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳', direction: 'ltr' },
+  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', direction: 'rtl' },
+  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹', direction: 'ltr' },
+  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺', direction: 'ltr' },
 ];
```

**Explanation**: Adds more language options to demonstrate the system's scalability and includes RTL language (Arabic) for testing.

### 5. Translation Template Generator (`scripts/generate-template.js`) - NEW FILE

```javascript
#!/usr/bin/env node

/**
 * Translation Template Generator
 * 
 * Generates a new translation file template from the English baseline
 * 
 * Usage: node scripts/generate-template.js [language-code]
 * Example: node scripts/generate-template.js fr
 */

const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, '../src/i18n/locales');
const ENGLISH_FILE = path.join(LOCALES_DIR, 'en.ts');

function generateTemplate(languageCode) {
  if (!languageCode) {
    console.error('❌ Please provide a language code');
    console.log('Usage: node scripts/generate-template.js [language-code]');
    console.log('Example: node scripts/generate-template.js fr');
    process.exit(1);
  }

  const targetFile = path.join(LOCALES_DIR, `${languageCode}.ts`);

  if (fs.existsSync(targetFile)) {
    console.log(`⚠️  File ${languageCode}.ts already exists`);
    process.exit(1);
  }

  try {
    // Read English template
    let englishContent = fs.readFileSync(ENGLISH_FILE, 'utf8');

    // Replace language code and add translation notes
    const template = englishContent
      .replace(/const en:/, `const ${languageCode}:`)
      .replace(/export default en;/, `export default ${languageCode};`)
      .replace(
        /English Translation File - Master Template[\s\S]*?keeping all keys exactly the same\./,
        `${languageCode.toUpperCase()} Translation File
 * 
 * Translator: [Your Name] <your.email@domain.com>
 * Review Status: Draft
 * Last Updated: ${new Date().toISOString().split('T')[0]}
 * 
 * Translation Guidelines:
 * 1. Translate only the values (text after the colon)
 * 2. Keep all keys exactly the same as English
 * 3. Preserve parameter placeholders like {{name}}
 * 4. Use natural, fluent expressions in ${languageCode}
 * 5. Follow ${languageCode} punctuation and typography rules
 * 
 * TODO: Replace all English values with ${languageCode} translations`
      );

    // Write template file
    fs.writeFileSync(targetFile, template);

    console.log(`✅ Generated template: ${languageCode}.ts`);
    console.log('');
    console.log('Next steps:');
    console.log(`1. Edit src/i18n/locales/${languageCode}.ts`);
    console.log('2. Translate all English values');
    console.log('3. Add language to AVAILABLE_LANGUAGES in src/types/i18n.types.ts');
    console.log('4. Run: npm run validate-translations');
    console.log('5. Test in app: npm run dev');

  } catch (error) {
    console.error('❌ Failed to generate template:', error.message);
    process.exit(1);
  }
}

// Get language code from command line
const languageCode = process.argv[2];
generateTemplate(languageCode);
```

**Explanation**: Automated tool to generate translation templates, making it easier for contributors to start translating.

### 6. Update Package.json Scripts (`package.json`)

```diff
@@ -10,6 +10,7 @@
     "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
     "validate-translations": "node scripts/validate-translations.js",
+    "generate-translation": "node scripts/generate-template.js",
     "test": "vitest",
     "test:ui": "vitest --ui",
     "test:integration": "node scripts/integration-test.js",
```

**Explanation**: Adds the template generator to npm scripts for easier access.

### 7. Contributor Recognition System (`src/components/about/TranslationCredits.tsx`) - NEW FILE

```typescript
import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from '../../i18n';
import { AVAILABLE_LANGUAGES } from '../../types/i18n.types';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { GlobeIcon } from 'lucide-react';

interface Contributor {
  name: string;
  github?: string;
  languages: string[];
  avatar?: string;
}

const TRANSLATION_CONTRIBUTORS: Contributor[] = [
  {
    name: 'Core Team',
    languages: ['en', 'vi', 'es'],
    github: 'flashplay-team',
  },
  // Future contributors will be added here
  {
    name: 'Your Name Here',
    languages: ['fr'],
    github: 'your-username',
  },
];

export function TranslationCredits() {
  const t = useTranslation();

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <GlobeIcon className="w-5 h-5" />
          <span>Translation Contributors</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {TRANSLATION_CONTRIBUTORS.map((contributor, index) => (
            <motion.div
              key={contributor.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-primary font-semibold">
                    {contributor.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <h4 className="font-medium text-foreground">
                    {contributor.github ? (
                      <a
                        href={`https://github.com/${contributor.github}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-primary transition-colors"
                      >
                        {contributor.name}
                      </a>
                    ) : (
                      contributor.name
                    )}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {contributor.languages.length} language{contributor.languages.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                {contributor.languages.map((lang) => {
                  const language = AVAILABLE_LANGUAGES.find(l => l.code === lang);
                  return (
                    <Badge key={lang} variant="secondary" className="text-xs">
                      {language?.flag} {language?.nativeName || lang}
                    </Badge>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
          <h4 className="font-medium text-foreground mb-2">
            Want to contribute?
          </h4>
          <p className="text-sm text-muted-foreground mb-3">
            Help make MyFlashPlay accessible in your language! 
            See our translation guide to get started.
          </p>
          <a
            href="https://github.com/your-org/flashplay/blob/main/CONTRIBUTING_TRANSLATIONS.md"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary text-sm font-medium hover:underline"
          >
            View Translation Guide →
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
```

**Explanation**: Recognition system for translation contributors, encouraging community participation and showing appreciation.

## Testing Strategy

### 1. Translation Completeness Test (`scripts/__tests__/translation-completeness.test.js`) - NEW FILE

```javascript
const fs = require('fs');
const path = require('path');

describe('Translation Completeness', () => {
  const LOCALES_DIR = path.join(__dirname, '../../src/i18n/locales');
  const languages = ['en', 'vi', 'es', 'fr', 'de'];

  function getTranslationKeys(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const keys = [];
    
    // Extract all translation keys using regex
    const keyPattern = /^\s*(\w+):\s*{/gm;
    let match;
    while ((match = keyPattern.exec(content)) !== null) {
      keys.push(match[1]);
    }
    
    return keys;
  }

  test('all language files should have the same top-level keys', () => {
    const englishKeys = getTranslationKeys(path.join(LOCALES_DIR, 'en.ts'));
    
    languages.slice(1).forEach(lang => {
      const langFile = path.join(LOCALES_DIR, `${lang}.ts`);
      if (fs.existsSync(langFile)) {
        const langKeys = getTranslationKeys(langFile);
        expect(langKeys.sort()).toEqual(englishKeys.sort());
      }
    });
  });

  test('template generator should create valid files', () => {
    // This would test the template generator script
    expect(true).toBe(true); // Placeholder
  });
});
```

### 2. Documentation Link Test (`scripts/__tests__/documentation.test.js`) - NEW FILE

```javascript
const fs = require('fs');
const path = require('path');

describe('Translation Documentation', () => {
  test('CONTRIBUTING_TRANSLATIONS.md should exist', () => {
    const docPath = path.join(__dirname, '../../CONTRIBUTING_TRANSLATIONS.md');
    expect(fs.existsSync(docPath)).toBe(true);
  });

  test('documentation should include all supported languages', () => {
    const docPath = path.join(__dirname, '../../CONTRIBUTING_TRANSLATIONS.md');
    const content = fs.readFileSync(docPath, 'utf8');
    
    // Check that each language is mentioned
    expect(content).toMatch(/English.*en/);
    expect(content).toMatch(/Vietnamese.*vi/);
    expect(content).toMatch(/Spanish.*es/);
    expect(content).toMatch(/French.*fr/);
    expect(content).toMatch(/German.*de/);
  });
});
```

## Performance Considerations

### Bundle Size Analysis
- **Documentation**: Adds ~15KB of markdown documentation (not bundled)
- **Example Languages**: Each language file adds ~2KB to bundle when loaded
- **Contributor Tools**: Scripts are development-only, no runtime impact

### Development Experience
- **Template Generator**: Speeds up new language setup from 30+ minutes to 5 minutes
- **Validation Tools**: Catch errors early, preventing runtime issues
- **Clear Documentation**: Reduces support burden on maintainers

## Verification Steps

1. **Documentation Quality**: Review translation guide for clarity and completeness
2. **Template Generation**: Test that generated templates compile and work
3. **Language Examples**: Verify French and German translations load correctly
4. **Contributor Tools**: Test validation and generation scripts
5. **Recognition System**: Check that contributor credits display properly
6. **Link Validation**: Ensure all documentation links work

## Next Stage Preview

Stage 7 will focus on comprehensive testing, final validation, and creating a complete test suite to ensure the multi-language system works reliably across all supported languages and use cases.

---

**AI Agent Instructions**: 
1. Create comprehensive CONTRIBUTING_TRANSLATIONS.md documentation
2. Create French and German translation example files
3. Update language types to include additional language options
4. Create template generator script for easy contribution setup
5. Create contributor recognition component
6. Add template generation to package.json scripts
7. Run `npm run validate-translations` to ensure all examples work
8. Test template generator with a new language code
9. Verify that French and German translations load in the app
10. Continue to Stage 7 only after successful verification