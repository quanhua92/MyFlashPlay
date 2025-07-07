# Claude Development Guide for MyFlashPlay

## 🎯 Project Overview

**MyFlashPlay** is a modern flashcard application built with React 19, TypeScript, and Vite. It features a simplified markdown-based deck creation system with support for multiple languages (UTF-8), various game modes, and comprehensive testing.

**Live Site**: https://myflashplay.vercel.app

## 🧪 Testing & Quality Assurance

### IMPORTANT: Testing Procedures

**See TEST.md for the complete testing plan and troubleshooting guide.**

The TEST.md file contains:
- Proper environment setup (avoiding port conflicts)
- Detailed test scenarios with expected results
- Common issues and their solutions
- Root cause analysis steps for Vietnamese deck loading issues

### Integration Testing Suite

I have built a comprehensive integration testing system that can verify MyFlashPlay's functionality on any deployed URL.

#### Proper Testing Workflow

```bash
# 1. Kill any existing processes
pkill -f "vite" || true
lsof -ti:3000,3001,3002,4173,4174,4175 | xargs kill -9 2>/dev/null || true

# 2. Build the project
pnpm build

# 3. Start preview server in background and capture the port
pnpm serve > serve.log 2>&1 &
sleep 2  # Give server time to start

# 4. Extract the actual port from the log
PORT=$(grep -o 'http://localhost:[0-9]*' serve.log | head -1 | grep -o '[0-9]*$')
echo "Server running on port: $PORT"

# 5. Run tests with the actual port
pnpm test:integration http://localhost:$PORT

# 6. Clean up
kill %1  # Kill the background serve process
rm serve.log

# For production testing
pnpm test:integration https://myflashplay.vercel.app
```

#### Alternative: Use concurrently (recommended)

```bash
# Kill existing processes first
pkill -f "vite" || true

# Use the built-in test:self command
pnpm test:self
```

#### What Gets Tested

✅ **Page Load & Navigation** - Site accessibility and basic loading  
✅ **Sample Decks Present** - Vietnamese UTF-8 support, deck visibility  
✅ **Deck Creation Flow** - Markdown editor, save functionality  
✅ **Gameplay Functionality** - Game modes, flashcard interaction  
✅ **Markdown Guide & Templates** - Simple format documentation  
✅ **Mobile Responsiveness** - Mobile viewport compatibility  
✅ **Error Handling** - 404 pages, graceful failures  

#### Test Results Format

```
📊 Test Results Summary
==================================================
✅ Page Load & Navigation          1205ms
✅ Sample Decks Present             843ms
✅ Deck Creation Flow              2156ms
✅ Gameplay Functionality          1789ms
✅ Markdown Guide & Templates       654ms
✅ Mobile Responsiveness            432ms
✅ Error Handling                   876ms
==================================================
📈 7/7 tests passed (7955ms total)
🎉 All tests passed! MyFlashPlay is working correctly.
```

## 📝 Markdown Format

### Simple Format (Recommended)

The core innovation is the **ultra-simple** markdown format:

```markdown
What is 2 + 2? :: 4
Capital of France? :: Paris
The sun is a star :: true
Fish can fly :: false
```

### Advanced Features (Optional)

```markdown
# Multiple choice when needed
What is the largest planet?
- Earth
- Jupiter
- Mars
- Venus
> Jupiter

# Categories for organization
# Math Section
What is 5 × 3? :: 15
What is 10 ÷ 2? :: 5

# Science Section
What is H2O? :: Water
```

## 🌍 UTF-8 Language Support

MyFlashPlay showcases international language support with Vietnamese sample decks:

- **Động Vật Việt Nam** (Vietnamese Animals)
- **Màu Sắc Việt Nam** (Vietnamese Colors)  
- **Toán Học Tiếng Việt** (Vietnamese Math)

This demonstrates the app's ability to handle complex UTF-8 characters and various writing systems.

## 🏗️ Architecture

### Key Components

- **Storage**: Pure markdown-based with localStorage
- **Parser**: `utils/markdown-parser.ts` - converts markdown to flashcards
- **State**: React hooks with `useDecks.ts`
- **UI**: Framer Motion animations, Tailwind CSS styling
- **Routing**: TanStack Router for type-safe navigation

### No Legacy JSON Support

The system has been simplified to **pure markdown storage**:
- ✅ Simple text-based format
- ✅ Easy import/export  
- ✅ Human-readable
- ❌ No complex JSON schemas
- ❌ No migration complexity

## 🚀 Development Workflow

### IMPORTANT: User-Controlled Dev Server Only

**User ALWAYS runs `pnpm dev` in a separate terminal. Claude NEVER builds or serves:**

```bash
# User runs in terminal:
pnpm dev

# Claude ONLY runs tests against running dev server:
pnpm test:integration http://localhost:3000  # or whatever port shown
```

**Claude Rules:**
- ❌ NEVER run `pnpm serve`, or `pnpm test:self`
- ❌ NEVER kill processes or manage dev server
- ✅ ONLY test against user's running dev server
- ✅ Ask user to run `pnpm dev` if needed
- ✅ Run `pnpm build` after making changes

**Benefits:**
- ✅ No port conflicts or process management
- ✅ Hot reload works during development
- ✅ User has full control over dev server
- ✅ Faster iteration cycle
- ✅ Real-time development testing

### Testing Commands for Claude

```bash
# Development testing (user must run pnpm dev first)
pnpm test:integration http://localhost:3000

# Quick health check  
pnpm test:quick http://localhost:3000

# Production verification only
pnpm test:integration https://myflashplay.vercel.app
```

### Production Deployment Testing

```bash
# Only for production testing after deployment
pnpm test:integration https://myflashplay.vercel.app
```

## 🎮 Game Modes

MyFlashPlay supports multiple learning modes:

1. **Study Mode** - Traditional flashcard review
2. **Quiz Mode** - Multiple choice questions
3. **Speed Mode** - Timed challenges
4. **Memory Mode** - Card matching game
5. **Falling Mode** - Falling quiz game

## 🎨 UI/UX Principles

### Simplicity First
- **One line = one flashcard** for basic use
- **Progressive disclosure** of advanced features
- **Mobile-first** responsive design

### Visual Feedback
- **Green ✅ / Red ❌** for clear status
- **Smooth animations** with Framer Motion
- **Dark/light mode** support

## 📱 Mobile Experience

The app is fully responsive with:
- Touch-friendly card interactions
- Swipe gestures for navigation
- Optimized mobile layouts
- PWA support for app-like experience

## 🔧 Build System

```bash
# Development
pnpm dev              # Start dev server
pnpm build           # Production build  
pnpm serve           # Preview build
pnpm type-check      # TypeScript validation

# Testing
pnpm test                    # Unit tests
pnpm test:integration <URL>  # Integration tests
pnpm test:quick <URL>        # Quick health check
```

## 🐛 Debugging Integration Tests

### Common Issues

**Vietnamese text not found**
- Check if latest changes are deployed
- Verify sample decks include Vietnamese content

**Markdown editor not found**
- Page may still be loading
- Check for CodeMirror or textarea elements

**Play buttons missing**
- Verify deck cards have play functionality
- Check for proper button selectors

### Test Development

Tests are in `scripts/` directory:
- `integration-test.ts` - Full comprehensive test
- `quick-test.ts` - Fast health check
- `README.md` - Test documentation

## 📚 Sample Content

The app includes sample decks demonstrating:

1. **Elementary Math** - Basic arithmetic
2. **Amazing Animals** - Science facts
3. **Space Adventure** - Astronomy
4. **Vietnamese Animals** - UTF-8 demonstration
5. **Vietnamese Colors** - Color vocabulary
6. **Vietnamese Math** - Numbers in Vietnamese

## 🎯 Quality Standards

### Before Deployment

1. ✅ All integration tests pass
2. ✅ Vietnamese UTF-8 content loads
3. ✅ Markdown editor functional
4. ✅ Sample decks visible
5. ✅ Mobile view responsive

### Performance

- Bundle size optimized with Vite
- Code splitting for large components
- Lazy loading where appropriate
- Service worker for caching

## 🔮 Future Considerations

### Scaling
- Consider moving to database for large user bases
- Add user authentication for deck sharing
- Implement collaborative editing

### Features
- Export to various formats (PDF, Anki)
- Import from other flashcard apps
- Advanced spaced repetition algorithms
- Multiplayer quiz modes

---

**Remember**: Run `pnpm test:integration https://myflashplay.vercel.app` after any deployment to verify everything works correctly! 🚀