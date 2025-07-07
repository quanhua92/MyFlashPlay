# Translation Guide for MyFlashPlay

Welcome to the MyFlashPlay translation project! This guide will help you contribute translations to make MyFlashPlay accessible to users worldwide.

## 🌍 Current Language Status

| Language | Code | Status | Translator | Completeness |
|----------|------|--------|------------|--------------|
| English | `en` | ✅ Complete | Core Team | 175/175 (100%) |
| Spanish | `es` | ✅ Complete | Core Team | 175/175 (100%) |
| Chinese | `zh` | ✅ Complete | Core Team | 175/175 (100%) |
| Vietnamese | `vi` | ✅ Complete | Core Team | 175/175 (100%) |
| French | `fr` | ✅ Complete | Core Team | 175/175 (100%) |
| German | `de` | ✅ Complete | Core Team | 175/175 (100%) |
| Japanese | `ja` | ✅ Complete | Core Team | 175/175 (100%) |
| Korean | `ko` | ✅ Complete | Core Team | 175/175 (100%) |

**All languages are now complete!** Ready for production deployment and community contributions.

## 🚀 Quick Start for Contributors

### 1. Choose Your Language

Pick a language from the table above that needs help, or propose a new language by opening an issue.

### 2. Set Up Your Environment

```bash
# Clone the repository
git clone https://github.com/yourusername/flashplay.git
cd flashplay

# Install dependencies
pnpm install

# Run validation to see current status
pnpm validate-translations
```

### 3. Start Translating

Copy the English translation file and modify the values:

```bash
# Copy the English template
cp src/i18n/locales/en.ts src/i18n/locales/YOUR_LANGUAGE_CODE.ts

# Edit the new file with your translations
# Keep all the keys exactly the same, only translate the values
```

### 4. Test Your Translations

```bash
# Validate your translations
pnpm validate-translations

# Build to test for errors
pnpm build

# Test in browser (if you have the dev environment)
pnpm dev
```

## 📋 Translation Guidelines

### Language Codes
Use [ISO 639-1](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes) two-letter codes:
- French: `fr`
- German: `de` 
- Japanese: `ja`
- Korean: `ko`
- Portuguese: `pt`
- Russian: `ru`
- etc.

### File Structure

Each translation file follows this pattern:

```typescript
import type { TranslationNamespace } from '../../types/i18n.types';

const LANGUAGE_CODE: TranslationNamespace = {
  // Navigation
  nav: {
    home: 'Your Translation',
    create: 'Your Translation',
    // ... more keys
  },
  
  // Common actions
  common: {
    save: 'Your Translation',
    cancel: 'Your Translation',
    // ... more keys  
  },
  
  // ... more sections
};

export default LANGUAGE_CODE;
```

### Translation Rules

1. **Keep Keys Unchanged**: Never modify the keys (left side of the colon)
2. **Translate Values Only**: Only change the values (right side of the colon) 
3. **Preserve Parameters**: Keep placeholders like `{{count}}`, `{{name}}` unchanged
4. **Maintain Capitalization**: Follow your language's capitalization rules
5. **Context Matters**: Consider where the text appears in the interface

### Parameter Examples

Some translations use parameters that get replaced with dynamic values:

```typescript
// English
cardProgress: 'Card {{current}} of {{total}}',
characterCount: '{{count}} characters',
playedTimes: 'Played {{count}} times',

// Spanish example  
cardProgress: 'Tarjeta {{current}} de {{total}}',
characterCount: '{{count}} caracteres',
playedTimes: 'Jugado {{count}} veces',
```

## 🗂️ Translation Sections

The translation file is organized into logical sections:

### `nav` - Navigation (8 keys)
Main navigation menu items like Home, Create, Settings, etc.

### `common` - Common Actions (11 keys)  
Reusable buttons and actions: Save, Cancel, Delete, Loading, etc.

### `home` - Home Page (11 keys)
Landing page content, features, and call-to-action buttons.

### `settings` - Settings Page (13 keys)
Configuration options, language settings, data management.

### `create` - Creation Interface (32 keys)
Deck creation form, markdown editor, templates, validation messages.

### `decks` - Deck Management (28 keys)
Deck listing, actions, game modes, statistics.

### `game` - Game Modes (18 keys)
Study mode, quiz mode, game feedback, progress indicators.

### `achievements` - Progress Tracking (12 keys)
Achievement system, progress stats, motivation messages.

### `errors` - Error Messages (10 keys)
User-facing error handling and validation messages.

## 🛠️ Validation Tools

We provide automated validation to ensure translation quality:

```bash
# Check for missing keys
pnpm validate-translations

# Verify build compatibility  
pnpm build

# Quick health check (if MyFlashPlay is running)
pnpm test:quick http://localhost:3000
```

### Common Validation Errors

1. **Missing Keys**: You haven't translated all required keys
2. **Extra Keys**: You added keys that don't exist in English
3. **Syntax Errors**: TypeScript compilation errors
4. **Parameter Mismatches**: Missing or incorrect `{{parameter}}` placeholders

## 🌐 Adding a New Language

To add a completely new language:

### 1. Update Language Types

Add your language code to `src/types/i18n.types.ts`:

```typescript
export type LanguageCode = 'en' | 'vi' | 'es' | 'fr' | 'de' | 'ja' | 'ko' | 'zh' | 'YOUR_CODE';

export const AVAILABLE_LANGUAGES: Language[] = [
  // ... existing languages
  { code: 'YOUR_CODE', name: 'English Name', nativeName: 'Native Name', flag: '🇫🇷', direction: 'ltr' },
];
```

### 2. Create Translation File

Create `src/i18n/locales/YOUR_CODE.ts` based on the English template.

### 3. Update Index File

Add your language to `src/i18n/locales/index.ts`:

```typescript
export const translations = {
  // ... existing imports
  YOUR_CODE: () => import('./YOUR_CODE'),
};
```

### 4. Test Integration

Validate and build to ensure everything works correctly.

## ✅ Quality Checklist

Before submitting your translation:

- [ ] All 175 keys are translated
- [ ] Parameters like `{{count}}` are preserved
- [ ] Validation script passes: `pnpm validate-translations`
- [ ] Build succeeds: `pnpm build`  
- [ ] Language follows cultural conventions
- [ ] Translations fit in UI (not too long for buttons)
- [ ] Grammar and spelling are correct
- [ ] Tone is consistent (formal/informal)

## 📝 Translation Context

### Interface Locations

Understanding where text appears helps with accurate translation:

- **Navigation**: Top menu and mobile navigation
- **Buttons**: Action buttons throughout the app
- **Forms**: Input labels, placeholders, help text
- **Messages**: Success, error, and status messages  
- **Game Interface**: Study mode, quiz feedback
- **Settings**: Configuration options and descriptions

### Tone Guidelines

- **Friendly & Encouraging**: This is an educational app for learners
- **Clear & Simple**: Avoid complex terminology
- **Consistent**: Use the same terms throughout
- **Age-Appropriate**: Consider younger users

## 🤝 Contributing Process

### 1. Fork & Branch
```bash
git fork https://github.com/yourusername/flashplay.git
git checkout -b translation/YOUR_LANGUAGE_CODE
```

### 2. Translate & Test
- Follow this guide
- Validate your work
- Test in browser if possible

### 3. Submit Pull Request
- Include validation results
- Mention your language progress
- Add yourself to the contributor table

### 4. Review Process
- Core team reviews for technical issues
- Native speakers may review for language quality
- Feedback incorporated and merged

## 🎯 Translation Priorities

If you can't complete all 175 keys at once, prioritize these sections:

1. **High Priority** (covers main user flows):
   - `nav` - Navigation (8 keys)
   - `common` - Common actions (11 keys) 
   - `home` - Landing page (11 keys)
   - `create` - Basic creation (20 most important keys)

2. **Medium Priority** (enhances experience):
   - `decks` - Deck management (28 keys)
   - `settings` - Configuration (13 keys)

3. **Low Priority** (nice to have):
   - `game` - Game modes (18 keys)
   - `achievements` - Progress tracking (12 keys)
   - `errors` - Error messages (10 keys)

## 🌟 Recognition

Contributors will be:
- Listed in this translation guide
- Credited in the app's About section  
- Mentioned in release notes
- Added to the GitHub contributors list

## 📞 Getting Help

- **Questions**: Open a GitHub issue with the `translation` label
- **Chat**: Join our Discord community for real-time help
- **Email**: Contact maintainers directly for complex questions

Thank you for helping make MyFlashPlay accessible to more learners worldwide! 🌍✨