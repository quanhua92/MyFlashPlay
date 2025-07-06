# MyFlashPlay Implementation Guide

## Quick Start Commands

```bash
# Create project
npm create vite@latest flashplay -- --template react-ts
cd flashplay

# Install dependencies
npm install @tanstack/react-router
npm install -D tailwindcss@next @tailwindcss/vite@next
npm install clsx tailwind-merge lucide-react
npm install framer-motion
npm install marked dompurify
npm install uuid
npm install @types/dompurify @types/uuid

# Initialize Tailwind CSS v4
npx tailwindcss init

# Setup ShadCN UI
npx shadcn@latest init
```

## Configuration Files

### vite.config.ts
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

### tailwind.config.ts
```typescript
import type { Config } from 'tailwindcss'

export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'kid-blue': '#4F46E5',
        'kid-pink': '#EC4899',
        'kid-green': '#10B981',
        'kid-yellow': '#F59E0B',
        'kid-purple': '#8B5CF6',
      },
      animation: {
        'card-flip': 'flip 0.6s ease-in-out',
        'bounce-in': 'bounceIn 0.5s ease-out',
        'shake': 'shake 0.5s ease-in-out',
        'confetti': 'confetti 1s ease-out',
      },
      keyframes: {
        flip: {
          '0%': { transform: 'rotateY(0deg)' },
          '100%': { transform: 'rotateY(180deg)' },
        },
        bounceIn: {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-10px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(10px)' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config
```

### tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

## Key Component Implementations

### Main App Router Setup
```typescript
// src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'
import './styles/globals.css'

const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
)
```

### Markdown Parser Implementation
```typescript
// src/utils/markdown-parser.ts
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { v4 as uuidv4 } from 'uuid'
import type { Flashcard, ParsedCard } from '@/types'

export class MarkdownParser {
  parse(markdown: string): Flashcard[] {
    const lines = markdown.split('\n')
    const cards: Flashcard[] = []
    let currentCategory = ''
    let currentSubcategory = ''
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      
      // Parse headers for categories
      if (line.startsWith('# ')) {
        currentCategory = line.substring(2).trim()
        currentSubcategory = ''
      } else if (line.startsWith('## ')) {
        currentSubcategory = line.substring(3).trim()
      }
      
      // Parse flashcard formats
      else if (line.startsWith('- ')) {
        const card = this.parseCardLine(line, lines, i)
        if (card) {
          card.category = currentCategory
          card.subcategory = currentSubcategory
          cards.push(card)
        }
      }
    }
    
    return cards
  }
  
  private parseCardLine(line: string, lines: string[], index: number): Flashcard | null {
    const content = line.substring(2).trim()
    
    // Simple Q&A format: "Question :: Answer"
    if (content.includes('::')) {
      const [front, back] = content.split('::').map(s => s.trim())
      return {
        id: uuidv4(),
        type: 'simple',
        front: this.sanitizeContent(front),
        back: this.sanitizeContent(back),
      }
    }
    
    // Multiple choice format
    if (index + 1 < lines.length && lines[index + 1].trim().startsWith('*')) {
      return this.parseMultipleChoice(content, lines, index + 1)
    }
    
    return null
  }
  
  private sanitizeContent(content: string): string {
    // Convert markdown to HTML and sanitize
    const html = marked(content)
    return DOMPurify.sanitize(html)
  }
}
```

### FlashCard Component
```typescript
// src/components/flashcard/FlashCard.tsx
import { useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { Flashcard } from '@/types'

interface FlashCardProps {
  card: Flashcard
  onFlip?: () => void
  className?: string
}

export function FlashCard({ card, onFlip, className }: FlashCardProps) {
  const [isFlipped, setIsFlipped] = useState(false)
  
  const handleFlip = () => {
    setIsFlipped(!isFlipped)
    onFlip?.()
  }
  
  return (
    <div className={cn('perspective-1000 w-full h-full', className)}>
      <motion.div
        className="relative w-full h-full cursor-pointer preserve-3d"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, type: 'spring' }}
        onClick={handleFlip}
      >
        {/* Front */}
        <div className={cn(
          'absolute w-full h-full backface-hidden',
          'bg-gradient-to-br from-kid-blue to-kid-purple',
          'rounded-2xl p-8 flex items-center justify-center',
          'text-white text-2xl font-bold text-center shadow-xl'
        )}>
          <div dangerouslySetInnerHTML={{ __html: card.front }} />
        </div>
        
        {/* Back */}
        <div className={cn(
          'absolute w-full h-full backface-hidden rotate-y-180',
          'bg-gradient-to-br from-kid-green to-kid-yellow',
          'rounded-2xl p-8 flex items-center justify-center',
          'text-white text-2xl font-bold text-center shadow-xl'
        )}>
          <div dangerouslySetInnerHTML={{ __html: card.back }} />
        </div>
      </motion.div>
    </div>
  )
}
```

### Quiz Mode Component
```typescript
// src/components/game/QuizMode.tsx
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import type { QuizQuestion, GameSession } from '@/types'

interface QuizModeProps {
  questions: QuizQuestion[]
  onComplete: (session: GameSession) => void
}

export function QuizMode({ questions, onComplete }: QuizModeProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  
  const currentQuestion = questions[currentIndex]
  const progress = ((currentIndex + 1) / questions.length) * 100
  
  const handleAnswer = (answer: string) => {
    setSelectedAnswer(answer)
    setShowFeedback(true)
    
    if (answer === currentQuestion.correctAnswer) {
      setScore(score + 100)
      // Play success sound
    }
    
    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(currentIndex + 1)
        setSelectedAnswer(null)
        setShowFeedback(false)
      } else {
        // Complete quiz
        onComplete({
          // ... session data
        })
      }
    }, 2000)
  }
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      <Progress value={progress} className="mb-8" />
      
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion.id}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          className="space-y-6"
        >
          <h2 className="text-3xl font-bold text-center mb-8">
            {currentQuestion.question}
          </h2>
          
          <div className="grid grid-cols-2 gap-4">
            {currentQuestion.options?.map((option, index) => (
              <Button
                key={index}
                onClick={() => handleAnswer(option)}
                disabled={showFeedback}
                className={cn(
                  'p-6 text-lg h-auto',
                  showFeedback && option === currentQuestion.correctAnswer && 
                    'bg-green-500 hover:bg-green-500',
                  showFeedback && option === selectedAnswer && 
                    option !== currentQuestion.correctAnswer &&
                    'bg-red-500 hover:bg-red-500'
                )}
              >
                {option}
              </Button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
```

### LocalStorage Hook
```typescript
// src/hooks/useLocalStorage.ts
import { useState, useEffect } from 'react'

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.error(`Error loading ${key} from localStorage:`, error)
      return initialValue
    }
  })
  
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      window.localStorage.setItem(key, JSON.stringify(valueToStore))
    } catch (error) {
      console.error(`Error saving ${key} to localStorage:`, error)
    }
  }
  
  return [storedValue, setValue] as const
}
```

## Sample Flashcard Deck
```typescript
// src/data/sample-deck.ts
export const sampleDeck = {
  id: 'sample-math-deck',
  name: 'Elementary Math Fun',
  description: 'Learn basic math with fun questions!',
  emoji: '🔢',
  cards: [
    {
      id: '1',
      type: 'simple',
      front: 'What is 2 + 2?',
      back: '4',
      category: 'Addition',
      metadata: {
        difficulty: 'easy',
        tags: ['math', 'addition', 'basic']
      }
    },
    {
      id: '2',
      type: 'multiple-choice',
      front: 'Which number is bigger?',
      back: '10',
      options: [
        { id: 'a', text: '5', isCorrect: false },
        { id: 'b', text: '10', isCorrect: true },
        { id: 'c', text: '3', isCorrect: false },
        { id: 'd', text: '7', isCorrect: false }
      ],
      category: 'Comparison',
      metadata: {
        difficulty: 'easy',
        tags: ['math', 'comparison']
      }
    }
  ]
}
```

## Deployment Instructions

### Build for Production
```bash
npm run build
npm run preview
```

### Deploy to Vercel
```bash
npm i -g vercel
vercel
```

### Deploy to Netlify
```bash
# Build command: npm run build
# Publish directory: dist
```

### PWA Configuration
```json
// public/manifest.json
{
  "name": "MyFlashPlay - Fun Learning Cards",
  "short_name": "MyFlashPlay",
  "description": "Kid-friendly flashcard learning game",
  "theme_color": "#4F46E5",
  "background_color": "#ffffff",
  "display": "standalone",
  "scope": "/",
  "start_url": "/",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```