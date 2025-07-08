# MyFlashPlay Documentation

This folder contains comprehensive documentation for the MyFlashPlay project.

## 📚 Documentation Index

### 🧪 Testing & Quality Assurance
- **[TEST-ULTIMATE.md](./TEST-ULTIMATE.md)** - Complete testing guide with ultimate integration test suite
- **[LANGUAGE_DIALOG_TESTING.md](./LANGUAGE_DIALOG_TESTING.md)** - Language selection modal testing procedures
- **[TRANSLATION_GUIDE.md](./TRANSLATION_GUIDE.md)** - Internationalization and translation documentation

### 🏗️ Architecture & Implementation
- **[PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)** - Project architecture and code organization
- **[PROJECT_STATUS.md](./PROJECT_STATUS.md)** - Current project status and progress tracking
- **[STORAGE_SCHEMA.md](./STORAGE_SCHEMA.md)** - Data storage structure and localStorage schema
- **[MARKDOWN_SPEC.md](./MARKDOWN_SPEC.md)** - Markdown format specification for flashcards

### 🎮 Game Features
- **[GAME_MECHANICS.md](./GAME_MECHANICS.md)** - Game modes, mechanics, and gameplay features

## 🚀 Quick Start

For developers new to the project:

1. Start with **[PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)** to understand the codebase
2. Read **[MARKDOWN_SPEC.md](./MARKDOWN_SPEC.md)** to understand the flashcard format
3. Use **[TEST-ULTIMATE.md](./TEST-ULTIMATE.md)** for comprehensive testing procedures
4. Check **[TRANSLATION_GUIDE.md](./TRANSLATION_GUIDE.md)** for internationalization

## 📖 Main Project Files

The following important files remain in the project root:
- `README.md` - Main project documentation and setup instructions
- `CLAUDE.md` - Development guidelines and project instructions for Claude

## 🔧 Testing Commands

Quick reference for testing:
```bash
# Quick health check
pnpm test:quick:local

# Robust testing (recommended for development)
pnpm test:robust:local

# Ultimate comprehensive testing
pnpm test:ultimate:local

# Production testing
pnpm test:robust https://www.MyFlashPlay.com
```

## 📝 Contributing

When adding new documentation:
1. Place it in this `docs/` folder
2. Update this README.md index
3. Use clear, descriptive filenames
4. Follow the existing documentation style

---

For the latest development instructions and project overview, see the main [README.md](../README.md) in the project root.