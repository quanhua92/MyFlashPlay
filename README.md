# MyFlashPlay 🎯

A kid-friendly, interactive flashcard game web application that transforms Markdown content into engaging learning experiences. Features simplified markdown format and UTF-8 language support.

## Features ✨

- **Interactive Flashcards**: Beautiful card flip animations with touch support
- **Multiple Game Modes**: Study, Quiz, Speed Challenge, and Memory Match
- **Markdown Parser**: Convert any Markdown content into flashcards
- **Kid-Friendly Design**: Colorful themes, animations, and accessibility features
- **Progress Tracking**: Local storage for scores, achievements, and learning progress
- **Responsive Design**: Works seamlessly on tablets, phones, and desktops
- **Dark/Light Theme**: Automatic theme switching with manual override
- **Multiple Choice & True/False**: Auto-generated quiz questions from content

## Tech Stack 🚀

- **React 19** - Modern React with latest features
- **TypeScript** - Type-safe development
- **TanStack Router** - File-based routing with type safety
- **Tailwind CSS v4** - Utility-first styling with CSS variables
- **Framer Motion** - Smooth animations and transitions
- **Vite** - Fast development and build tool
- **Marked** - Markdown parsing
- **DOMPurify** - Safe HTML sanitization

## Getting Started 🎮

### Prerequisites
- Node.js 18+ 
- pnpm (or npm/yarn)

### Installation

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm serve
```

### Development Commands

```bash
pnpm dev         # Start development server (port 3000)
pnpm build       # Build for production
pnpm serve       # Preview production build
pnpm test        # Run tests
```

## Markdown Format 📝

MyFlashPlay supports flexible Markdown formats for creating flashcards:

### Simple Q&A
```markdown
# Math Basics

- What is 2 + 2? :: 4
- What is 5 × 3? :: 15
```

### Multiple Choice
```markdown
- What is the capital of France?
  * London
  * Berlin
  * Paris [correct]
  * Madrid
```

### True/False
```markdown
- The Earth is flat :: false
- Water boils at 100°C :: true
```

### Advanced Format
```markdown
- What is the Pythagorean theorem?
  Front: a² + b² = ?
  Back: c²
  Hint: It relates to right triangles
  Difficulty: medium
  Tags: geometry, theorems
```

## Project Structure 📁

```
src/
├── components/
│   ├── ui/           # ShadCN UI components
│   ├── layout/       # Layout components (Navigation, Footer)
│   ├── flashcard/    # Flashcard-specific components
│   ├── game/         # Game mode components
│   └── common/       # Shared components
├── pages/            # Route page components
├── hooks/            # Custom React hooks
├── utils/            # Utilities (parser, storage, etc.)
├── types/            # TypeScript type definitions
├── data/             # Sample data and constants
└── styles/           # Global styles and themes
```

## Features in Detail 🎯

### Game Modes
1. **Study Mode**: Self-paced learning with card flips
2. **Quiz Mode**: Multiple choice and true/false questions
3. **Speed Challenge**: Time-based challenges with bonuses
4. **Memory Match**: Match questions with answers (coming soon)

### Scoring System
- Base points: 100 for correct answers
- Speed bonuses: Extra points for quick answers
- Streak multipliers: 1.5x, 2x, 3x for consecutive correct answers
- Achievements: Unlock badges for milestones

### Data Storage
- **Local Storage**: All data stored locally (no server required)
- **Decks**: Save custom flashcard collections
- **Progress**: Track individual card performance
- **Scores**: Game session history and statistics
- **Preferences**: Theme, settings, and accessibility options

### Accessibility
- **Keyboard Navigation**: Full keyboard support
- **Screen Reader**: ARIA labels and semantic HTML
- **High Contrast**: Enhanced visibility options
- **Reduced Motion**: Respect user motion preferences
- **Font Scaling**: Adjustable text sizes

## Customization 🎨

### Color Schemes
MyFlashPlay includes multiple kid-friendly color schemes:
- **Rainbow**: Purple, pink, and blue gradients
- **Ocean**: Blue and cyan tones
- **Space**: Dark purples and cosmic colors
- **Forest**: Green and earth tones

### Adding New Themes
Edit `src/utils/constants.ts` to add new color schemes:

```typescript
export const COLOR_SCHEMES = {
  myTheme: {
    primary: 'from-red-500 to-yellow-500',
    secondary: 'from-green-400 to-blue-500',
    accent: 'from-purple-400 to-pink-500'
  }
};
```

## Development Guidelines 👩‍💻

### Code Style
- Use TypeScript for type safety
- Follow React hooks patterns
- Implement responsive design mobile-first
- Use semantic HTML and ARIA attributes
- Optimize for performance and accessibility

### Adding New Game Modes
1. Create component in `src/components/game/`
2. Add route in `src/routes/`
3. Update navigation and game mode selection
4. Implement scoring logic
5. Add to type definitions

### Adding New Card Types
1. Update `CardType` in types
2. Extend markdown parser logic
3. Create UI components for the new type
4. Update quiz generation logic

## Deployment 🚀

### Vercel (Recommended)
```bash
npm i -g vercel
vercel
```

### Netlify
- Build command: `pnpm build`
- Publish directory: `dist`

### Static Hosting
The app is fully client-side and can be deployed to any static hosting service.

## Browser Support 🌐

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## License 📄

This project is licensed under the MIT License.

## Acknowledgments 🙏

- Built with love for young learners everywhere
- Inspired by effective spaced repetition techniques
- Designed with accessibility and inclusion in mind

---

**Happy Learning! 🎓✨**