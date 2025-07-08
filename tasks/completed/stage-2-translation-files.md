# Stage 2: Translation Files Structure & English Baseline

## Objective
Create the translation files structure with a comprehensive English baseline that serves as the reference for all other languages. Establish the JSON contribution system for open-source translators.

## Overview
This stage creates the actual translation content and establishes the contributor workflow. The English file serves as the master template, and other language files follow the same structure.

## Key Design Decisions

### Why TypeScript Files Instead of JSON
- **Type Safety**: TypeScript files provide compile-time validation
- **IntelliSense**: Better developer experience with autocompletion
- **Comments**: Allow context for translators (JSON doesn't support comments)
- **Export Consistency**: Matches the rest of the TypeScript codebase

### Translation File Organization Strategy
- **Namespace Structure**: Organized by feature/page for maintainability
- **Consistent Keys**: English keys remain constant across all languages
- **Context Comments**: Each section includes translator guidance
- **Parameter Placeholders**: Support for dynamic content with `{{variable}}`

### Contributor Workflow Design
- **Template-Based**: Copy English file and translate values
- **Validation Script**: Automated checking for missing keys
- **Documentation**: Clear guidelines for translators
- **Git Integration**: Easy pull request workflow

## Files to Create/Modify

### 1. English Translation File (`src/i18n/locales/en.ts`) - NEW FILE

```typescript
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
    languageTitle: 'Language',
    languageDescription: 'Choose your preferred language for the interface',
    themeTitle: 'Theme',
    themeDescription: 'Choose your preferred color scheme',
    light: 'Light',
    dark: 'Dark',
    system: 'System',
    dataTitle: 'Data Management',
    dataDescription: 'Import, export, or clear your flashcard data',
    exportData: 'Export Data',
    importData: 'Import Data',
    clearData: 'Clear All Data',
  },

  // Create Page - Deck creation form and guidance
  create: {
    title: 'Create New Deck',
    deckNameLabel: 'Deck Name',
    deckNamePlaceholder: 'Enter a name for your deck',
    descriptionLabel: 'Description',
    descriptionPlaceholder: 'Describe what this deck covers',
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
    publicDecksTitle: 'Public Decks',
    createNewDeck: 'Create New Deck',
    noDeckFound: 'No decks found',
    cards: 'cards', // Used as: "5 cards"
    lastModified: 'Last modified',
    playDeck: 'Play Deck',
    editDeck: 'Edit Deck',
    deleteDeck: 'Delete Deck',
    confirmDelete: 'Are you sure you want to delete this deck?',
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
  },

  // Error Messages - User-facing error handling
  errors: {
    deckNotFound: 'Deck not found',
    invalidFormat: 'Invalid flashcard format',
    saveError: 'Failed to save. Please try again.',
    loadError: 'Failed to load content. Please refresh the page.',
    networkError: 'Network error. Please check your connection.',
    genericError: 'Something went wrong. Please try again.',
  },
};

export default en;
```

**Explanation**: This English file serves as the master template with 85+ translation keys organized by feature. Comments provide context for translators, and the structure mirrors the TypeScript interface exactly.

### 2. Vietnamese Translation File (`src/i18n/locales/vi.ts`) - NEW FILE

```typescript
import type { TranslationNamespace } from '../../types/i18n.types';

/**
 * Vietnamese Translation File (Tiếng Việt)
 * 
 * Translator Instructions:
 * - Translate only the values (text after the colon)
 * - Keep all keys exactly the same as English
 * - Preserve parameter placeholders like {{name}}
 * - Use Vietnamese punctuation and typography standards
 * - Consider context when choosing formal vs informal language
 */

const vi: TranslationNamespace = {
  // Navigation - Điều hướng ứng dụng chính
  nav: {
    home: 'Trang Chủ',
    create: 'Tạo Mới',
    myDecks: 'Bộ Thẻ Của Tôi',
    publicDecks: 'Bộ Thẻ Công Khai',
    achievements: 'Thành Tích',
    progress: 'Tiến Độ',
    settings: 'Cài Đặt',
    appTitle: 'MyFlashPlay',
  },

  // Common - Nút và thông báo chung
  common: {
    save: 'Lưu',
    cancel: 'Hủy',
    delete: 'Xóa',
    edit: 'Sửa',
    play: 'Chơi',
    back: 'Quay Lại',
    next: 'Tiếp Theo',
    previous: 'Trước Đó',
    loading: 'Đang tải...',
    error: 'Lỗi',
    success: 'Thành Công',
    confirm: 'Xác Nhận',
    yes: 'Có',
    no: 'Không',
  },

  // Home Page - Nội dung trang chủ
  home: {
    title: 'Học Mọi Thứ với Thẻ Ghi Nhớ Tương Tác',
    subtitle: 'Tạo, học và thành thạo bất kỳ chủ đề nào với nền tảng thẻ ghi nhớ mạnh mẽ',
    featuresTitle: 'Tính Năng Mạnh Mẽ',
    feature1Title: 'Định Dạng Markdown Đơn Giản',
    feature1Description: 'Tạo thẻ ghi nhớ với định dạng một dòng trực quan: Câu Hỏi :: Câu Trả Lời',
    feature2Title: 'Nhiều Chế Độ Chơi',
    feature2Description: 'Chế độ Học, Trắc Nghiệm, Thử Thách Tốc Độ, Ghép Cặp và Câu Hỏi Rơi',
    feature3Title: 'Hỗ Trợ Đa Ngôn Ngữ',
    feature3Description: 'Hỗ trợ UTF-8 đầy đủ để học bằng bất kỳ ngôn ngữ nào trên thế giới',
    getStartedButton: 'Bắt Đầu',
    sampleDecksTitle: 'Bộ Thẻ Mẫu',
  },

  // Settings Page - Trang cài đặt
  settings: {
    title: 'Cài Đặt',
    languageTitle: 'Ngôn Ngữ',
    languageDescription: 'Chọn ngôn ngữ ưa thích cho giao diện',
    themeTitle: 'Giao Diện',
    themeDescription: 'Chọn bảng màu ưa thích của bạn',
    light: 'Sáng',
    dark: 'Tối',
    system: 'Hệ Thống',
    dataTitle: 'Quản Lý Dữ Liệu',
    dataDescription: 'Nhập, xuất hoặc xóa dữ liệu thẻ ghi nhớ của bạn',
    exportData: 'Xuất Dữ Liệu',
    importData: 'Nhập Dữ Liệu',
    clearData: 'Xóa Tất Cả Dữ Liệu',
  },

  // Create Page - Trang tạo bộ thẻ
  create: {
    title: 'Tạo Bộ Thẻ Mới',
    deckNameLabel: 'Tên Bộ Thẻ',
    deckNamePlaceholder: 'Nhập tên cho bộ thẻ của bạn',
    descriptionLabel: 'Mô Tả',
    descriptionPlaceholder: 'Mô tả nội dung của bộ thẻ này',
    contentLabel: 'Nội Dung Thẻ Ghi Nhớ',
    contentPlaceholder: 'Câu hỏi 1 :: Câu trả lời 1\nCâu hỏi 2 :: Câu trả lời 2',
    visibilityLabel: 'Quyền Truy Cập',
    public: 'Công Khai',
    private: 'Riêng Tư',
    createButton: 'Tạo Bộ Thẻ',
    markdownGuideTitle: 'Hướng Dẫn Markdown',
    basicFormat: 'Định dạng cơ bản: Câu Hỏi :: Câu Trả Lời',
    advancedFormat: 'Nâng cao: Nhiều lựa chọn, danh mục và hơn thế nữa',
  },

  // Deck Management - Quản lý bộ thẻ
  decks: {
    title: 'Bộ Thẻ Ghi Nhớ',
    myDecksTitle: 'Bộ Thẻ Của Tôi',
    publicDecksTitle: 'Bộ Thẻ Công Khai',
    createNewDeck: 'Tạo Bộ Thẻ Mới',
    noDeckFound: 'Không tìm thấy bộ thẻ nào',
    cards: 'thẻ', // Dùng như: "5 thẻ"
    lastModified: 'Sửa đổi lần cuối',
    playDeck: 'Chơi Bộ Thẻ',
    editDeck: 'Sửa Bộ Thẻ',
    deleteDeck: 'Xóa Bộ Thẻ',
    confirmDelete: 'Bạn có chắc chắn muốn xóa bộ thẻ này không?',
  },

  // Game Modes - Chế độ chơi
  game: {
    studyMode: 'Chế Độ Học',
    quizMode: 'Chế Độ Trắc Nghiệm',
    speedMode: 'Thử Thách Tốc Độ',
    memoryMode: 'Ghép Cặp Trí Nhớ',
    fallingMode: 'Câu Hỏi Rơi',
    showAnswer: 'Hiện Đáp Án',
    nextCard: 'Thẻ Tiếp Theo',
    correct: 'Đúng!',
    incorrect: 'Sai',
    score: 'Điểm Số',
    timeLeft: 'Thời Gian Còn Lại',
    gameComplete: 'Hoàn Thành Trò Chơi!',
    playAgain: 'Chơi Lại',
    backToDecks: 'Quay Lại Bộ Thẻ',
  },

  // Error Messages - Thông báo lỗi
  errors: {
    deckNotFound: 'Không tìm thấy bộ thẻ',
    invalidFormat: 'Định dạng thẻ ghi nhớ không hợp lệ',
    saveError: 'Không thể lưu. Vui lòng thử lại.',
    loadError: 'Không thể tải nội dung. Vui lòng làm mới trang.',
    networkError: 'Lỗi mạng. Vui lòng kiểm tra kết nối.',
    genericError: 'Có lỗi xảy ra. Vui lòng thử lại.',
  },
};

export default vi;
```

**Explanation**: The Vietnamese translation demonstrates proper localization with culturally appropriate language choices and Vietnamese typography standards.

### 3. Spanish Translation File (`src/i18n/locales/es.ts`) - NEW FILE

```typescript
import type { TranslationNamespace } from '../../types/i18n.types';

/**
 * Spanish Translation File (Español)
 * 
 * Translator Instructions:
 * - Use neutral Spanish suitable for all Spanish-speaking regions
 * - Follow Spanish punctuation rules (¿¡)
 * - Use formal "usted" in instructions, informal "tú" in casual contexts
 * - Maintain consistent terminology throughout
 */

const es: TranslationNamespace = {
  nav: {
    home: 'Inicio',
    create: 'Crear',
    myDecks: 'Mis Mazos',
    publicDecks: 'Mazos Públicos',
    achievements: 'Logros',
    progress: 'Progreso',
    settings: 'Configuración',
    appTitle: 'MyFlashPlay',
  },

  common: {
    save: 'Guardar',
    cancel: 'Cancelar',
    delete: 'Eliminar',
    edit: 'Editar',
    play: 'Jugar',
    back: 'Atrás',
    next: 'Siguiente',
    previous: 'Anterior',
    loading: 'Cargando...',
    error: 'Error',
    success: 'Éxito',
    confirm: 'Confirmar',
    yes: 'Sí',
    no: 'No',
  },

  home: {
    title: 'Aprende Cualquier Cosa con Tarjetas Interactivas',
    subtitle: 'Crea, estudia y domina cualquier tema con nuestra poderosa plataforma de tarjetas',
    featuresTitle: 'Características Poderosas',
    feature1Title: 'Formato Markdown Simple',
    feature1Description: 'Crea tarjetas con un formato intuitivo de una línea: Pregunta :: Respuesta',
    feature2Title: 'Múltiples Modos de Juego',
    feature2Description: 'Modos de Estudio, Quiz, Desafío de Velocidad, Emparejamiento y Quiz Cayente',
    feature3Title: 'Soporte Multiidioma',
    feature3Description: 'Soporte UTF-8 completo para estudiar en cualquier idioma del mundo',
    getStartedButton: 'Comenzar',
    sampleDecksTitle: 'Mazos de Ejemplo',
  },

  settings: {
    title: 'Configuración',
    languageTitle: 'Idioma',
    languageDescription: 'Elige tu idioma preferido para la interfaz',
    themeTitle: 'Tema',
    themeDescription: 'Elige tu esquema de colores preferido',
    light: 'Claro',
    dark: 'Oscuro',
    system: 'Sistema',
    dataTitle: 'Gestión de Datos',
    dataDescription: 'Importa, exporta o borra tus datos de tarjetas',
    exportData: 'Exportar Datos',
    importData: 'Importar Datos',
    clearData: 'Borrar Todos los Datos',
  },

  create: {
    title: 'Crear Nuevo Mazo',
    deckNameLabel: 'Nombre del Mazo',
    deckNamePlaceholder: 'Ingresa un nombre para tu mazo',
    descriptionLabel: 'Descripción',
    descriptionPlaceholder: 'Describe qué cubre este mazo',
    contentLabel: 'Contenido de las Tarjetas',
    contentPlaceholder: 'Pregunta 1 :: Respuesta 1\nPregunta 2 :: Respuesta 2',
    visibilityLabel: 'Visibilidad',
    public: 'Público',
    private: 'Privado',
    createButton: 'Crear Mazo',
    markdownGuideTitle: 'Guía de Markdown',
    basicFormat: 'Formato básico: Pregunta :: Respuesta',
    advancedFormat: 'Avanzado: Opción múltiple, categorías y más',
  },

  decks: {
    title: 'Mazos de Tarjetas',
    myDecksTitle: 'Mis Mazos',
    publicDecksTitle: 'Mazos Públicos',
    createNewDeck: 'Crear Nuevo Mazo',
    noDeckFound: 'No se encontraron mazos',
    cards: 'tarjetas',
    lastModified: 'Última modificación',
    playDeck: 'Jugar Mazo',
    editDeck: 'Editar Mazo',
    deleteDeck: 'Eliminar Mazo',
    confirmDelete: '¿Estás seguro de que quieres eliminar este mazo?',
  },

  game: {
    studyMode: 'Modo Estudio',
    quizMode: 'Modo Quiz',
    speedMode: 'Desafío de Velocidad',
    memoryMode: 'Emparejamiento',
    fallingMode: 'Quiz Cayente',
    showAnswer: 'Mostrar Respuesta',
    nextCard: 'Siguiente Tarjeta',
    correct: '¡Correcto!',
    incorrect: 'Incorrecto',
    score: 'Puntuación',
    timeLeft: 'Tiempo Restante',
    gameComplete: '¡Juego Completado!',
    playAgain: 'Jugar de Nuevo',
    backToDecks: 'Volver a Mazos',
  },

  errors: {
    deckNotFound: 'Mazo no encontrado',
    invalidFormat: 'Formato de tarjeta inválido',
    saveError: 'Error al guardar. Por favor, inténtalo de nuevo.',
    loadError: 'Error al cargar contenido. Por favor, actualiza la página.',
    networkError: 'Error de red. Por favor, verifica tu conexión.',
    genericError: 'Algo salió mal. Por favor, inténtalo de nuevo.',
  },
};

export default es;
```

**Explanation**: Spanish translation following neutral Spanish conventions suitable for all Spanish-speaking regions, with proper punctuation and formal/informal language balance.

### 4. Translation Validation Script (`scripts/validate-translations.js`) - NEW FILE

```javascript
#!/usr/bin/env node

/**
 * Translation Validation Script
 * 
 * This script validates that all translation files have the same keys
 * as the English baseline and reports any missing or extra keys.
 * 
 * Usage: node scripts/validate-translations.js
 */

const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, '../src/i18n/locales');
const ENGLISH_FILE = path.join(LOCALES_DIR, 'en.ts');

// Helper function to extract translation keys from a file
function extractKeys(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Simple regex to extract object keys (works for our structured format)
  const keyMatches = content.match(/^\s*(\w+):\s*['"`]/gm) || [];
  return keyMatches.map(match => match.trim().split(':')[0]);
}

// Helper function to get nested object paths
function getObjectPaths(obj, prefix = '') {
  const paths = [];
  
  for (const [key, value] of Object.entries(obj)) {
    const currentPath = prefix ? `${prefix}.${key}` : key;
    
    if (typeof value === 'object' && value !== null) {
      paths.push(...getObjectPaths(value, currentPath));
    } else {
      paths.push(currentPath);
    }
  }
  
  return paths;
}

// Dynamic import for ES modules (Node.js compatibility)
async function validateTranslations() {
  try {
    console.log('🔍 Validating translation files...\n');

    // Get all translation files
    const files = fs.readdirSync(LOCALES_DIR)
      .filter(file => file.endsWith('.ts') && file !== 'en.ts')
      .map(file => path.join(LOCALES_DIR, file));

    if (files.length === 0) {
      console.log('ℹ️  No translation files found to validate.');
      return;
    }

    // Load English baseline
    const englishModule = await import(ENGLISH_FILE);
    const englishTranslations = englishModule.default;
    const englishKeys = getObjectPaths(englishTranslations).sort();

    console.log(`📋 English baseline has ${englishKeys.length} translation keys`);
    console.log(`🌍 Validating ${files.length} translation files...\n`);

    let allValid = true;

    for (const file of files) {
      const fileName = path.basename(file, '.ts');
      
      try {
        const module = await import(file);
        const translations = module.default;
        const keys = getObjectPaths(translations).sort();

        const missingKeys = englishKeys.filter(key => !keys.includes(key));
        const extraKeys = keys.filter(key => !englishKeys.includes(key));

        if (missingKeys.length === 0 && extraKeys.length === 0) {
          console.log(`✅ ${fileName}: All ${keys.length} keys present`);
        } else {
          allValid = false;
          console.log(`❌ ${fileName}: Issues found`);
          
          if (missingKeys.length > 0) {
            console.log(`   Missing keys (${missingKeys.length}):`);
            missingKeys.forEach(key => console.log(`     - ${key}`));
          }
          
          if (extraKeys.length > 0) {
            console.log(`   Extra keys (${extraKeys.length}):`);
            extraKeys.forEach(key => console.log(`     + ${key}`));
          }
        }
      } catch (error) {
        allValid = false;
        console.log(`❌ ${fileName}: Error loading file - ${error.message}`);
      }
    }

    console.log('\n' + '='.repeat(50));
    
    if (allValid) {
      console.log('🎉 All translation files are valid!');
      process.exit(0);
    } else {
      console.log('⚠️  Some translation files have issues. Please fix them before proceeding.');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Validation failed:', error.message);
    process.exit(1);
  }
}

validateTranslations();
```

**Explanation**: This validation script ensures translation consistency by comparing all language files against the English baseline. It's essential for maintaining quality as contributors add new languages.

### 5. Update Package.json Scripts (`package.json`)

```diff
@@ -8,6 +8,7 @@
     "preview": "vite preview",
     "type-check": "tsc --noEmit",
     "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
+    "validate-translations": "node scripts/validate-translations.js",
     "test": "vitest",
     "test:ui": "vitest --ui",
     "test:integration": "node scripts/integration-test.js",
```

**Explanation**: Adding a validation script to package.json makes it easy for contributors and CI to verify translation consistency.

### 6. Contributor Guide (`CONTRIBUTING_TRANSLATIONS.md`) - NEW FILE

```markdown
# Contributing Translations to MyFlashPlay

Thank you for helping make MyFlashPlay accessible to speakers of your language! 🌍

## Quick Start

1. **Copy the English template**: `src/i18n/locales/en.ts`
2. **Rename** to your language code (e.g., `fr.ts` for French)
3. **Translate values only** - keep all keys exactly the same
4. **Test your translation** with `npm run validate-translations`
5. **Submit a pull request**

## Language Codes

Use ISO 639-1 two-letter codes:
- `fr` - French
- `de` - German  
- `ja` - Japanese
- `ko` - Korean
- `zh` - Chinese
- `ar` - Arabic
- `pt` - Portuguese
- `ru` - Russian

## Translation Guidelines

### 1. Keep Keys Unchanged
```typescript
// ✅ Correct
nav: {
  home: 'Inicio',      // Translate the value
  create: 'Crear',     // Keep the key 'create'
},

// ❌ Wrong
nav: {
  inicio: 'Inicio',    // Don't change keys
  crear: 'Crear',      // This breaks the app
},
```

### 2. Preserve Placeholders
```typescript
// ✅ Correct - Keep {{placeholders}}
confirmDelete: '¿Estás seguro de que quieres eliminar {{deckName}}?',

// ❌ Wrong - Don't translate placeholders
confirmDelete: '¿Estás seguro de que quieres eliminar {{nombreMazo}}?',
```

### 3. Context Comments
Read the comments in each section for translation context:
```typescript
// Navigation - Main app navigation items
nav: {
  // These appear in the main menu
  home: 'Your Translation',
},
```

### 4. Cultural Adaptation
- Use appropriate formality levels for your language
- Follow your language's punctuation rules
- Consider regional variations if needed

## File Structure

```
src/i18n/locales/
├── en.ts      ← Master template (don't edit)
├── vi.ts      ← Vietnamese example
├── es.ts      ← Spanish example
└── [your-lang].ts ← Your translation
```

## Testing Your Translation

```bash
# Validate all translations
npm run validate-translations

# Test the app with your language
npm run dev
# Go to Settings → Language → Select your language
```

## Adding Your Language to the App

After creating your translation file, add your language to the list:

**File**: `src/types/i18n.types.ts`
```typescript
// Add your language code to this union type
export type LanguageCode = 'en' | 'vi' | 'es' | 'fr' | 'de' | 'ja' | 'ko' | 'zh' | 'YOUR_CODE';

// Add your language to this array
export const AVAILABLE_LANGUAGES: Language[] = [
  // ... existing languages
  { 
    code: 'YOUR_CODE', 
    name: 'English Name', 
    nativeName: 'Native Name', 
    flag: '🏁', 
    direction: 'ltr' 
  },
];
```

## Quality Standards

### Complete Translations
- All 85+ keys must be translated
- No keys should be left in English (unless it's a proper noun)
- Validation script must pass without errors

### Natural Language
- Use natural, fluent expressions in your language
- Avoid literal word-for-word translations
- Consider your language's conventions for UI text

### Consistency
- Use consistent terminology throughout
- Maintain the same tone across sections
- Follow established conventions for technical terms

## Example Translation Process

1. **Copy**: `cp src/i18n/locales/en.ts src/i18n/locales/fr.ts`

2. **Edit** the file header:
```typescript
/**
 * French Translation File (Français)
 * 
 * Translator: Your Name
 * Last Updated: Date
 */
```

3. **Translate** systematically by section:
```typescript
const fr: TranslationNamespace = {
  nav: {
    home: 'Accueil',
    create: 'Créer',
    // ... continue
  },
  // ... other sections
};
```

4. **Validate**: `npm run validate-translations`

5. **Test** in the app: Settings → Language → French

## Common Issues

### Missing Keys Error
```
❌ fr: Missing keys (2):
   - nav.newKey
   - game.newFeature
```
**Solution**: Add the missing keys from the English file

### Extra Keys Error
```
❌ fr: Extra keys (1):
   + nav.wrongKey
```
**Solution**: Remove keys that don't exist in English file

### Syntax Errors
**Problem**: TypeScript compilation fails
**Solution**: Check for missing commas, quotes, or brackets

## Getting Help

- **Questions**: Open an issue with the "translation" label
- **Discussion**: Join our translation discussion thread
- **Examples**: Look at the Vietnamese (`vi.ts`) translation for reference

## Recognition

All translators will be credited in:
- The app's About section
- This README file
- Release notes

Thank you for your contribution! 🙏
```

**Explanation**: This comprehensive guide makes it easy for contributors to add new languages while maintaining quality and consistency.

## Testing Strategy

### 1. Translation Loading Test (`src/i18n/__tests__/translation-loading.test.ts`) - NEW FILE

```typescript
import { describe, it, expect } from 'vitest';

describe('Translation Loading', () => {
  it('should load English translations', async () => {
    const en = await import('../locales/en');
    expect(en.default).toBeDefined();
    expect(en.default.nav.home).toBe('Home');
    expect(en.default.common.save).toBe('Save');
  });

  it('should load Vietnamese translations', async () => {
    const vi = await import('../locales/vi');
    expect(vi.default).toBeDefined();
    expect(vi.default.nav.home).toBe('Trang Chủ');
    expect(vi.default.common.save).toBe('Lưu');
  });

  it('should load Spanish translations', async () => {
    const es = await import('../locales/es');
    expect(es.default).toBeDefined();
    expect(es.default.nav.home).toBe('Inicio');
    expect(es.default.common.save).toBe('Guardar');
  });

  it('should have consistent structure across languages', async () => {
    const en = await import('../locales/en');
    const vi = await import('../locales/vi');
    const es = await import('../locales/es');

    const getKeys = (obj: any, prefix = ''): string[] => {
      const keys: string[] = [];
      for (const [key, value] of Object.entries(obj)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        if (typeof value === 'object') {
          keys.push(...getKeys(value, fullKey));
        } else {
          keys.push(fullKey);
        }
      }
      return keys.sort();
    };

    const enKeys = getKeys(en.default);
    const viKeys = getKeys(vi.default);
    const esKeys = getKeys(es.default);

    expect(viKeys).toEqual(enKeys);
    expect(esKeys).toEqual(enKeys);
  });
});
```

## Verification Steps

1. **File Creation**: Verify all translation files are created and structured correctly
2. **Validation Script**: Run `npm run validate-translations` to ensure consistency
3. **Type Checking**: Run `npm run type-check` to verify TypeScript compilation
4. **Dynamic Import**: Test that language files can be dynamically imported
5. **Structure Consistency**: Validate that all languages have identical key structures

## Next Stage Preview

Stage 3 will implement the language switcher in the Settings page and connect it to the translation system, allowing users to switch languages in real-time.

---

**AI Agent Instructions**: 
1. Create all translation files exactly as specified
2. Run `npm run validate-translations` to verify translation consistency
3. Run `npm run type-check` to ensure TypeScript compilation
4. Test dynamic imports by running the translation loading tests
5. If validation fails, check that all translation files have identical key structures
6. Continue to Stage 3 only after all validations pass successfully