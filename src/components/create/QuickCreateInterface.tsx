import { useState, useRef, useEffect, useCallback } from 'react';
import { Plus, X, ArrowDown, ArrowUp, Copy, FileText, Keyboard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Card {
  id: string;
  question: string;
  answer: string;
  category?: string;
  type: 'simple' | 'multiple-choice';
  options?: string[];
}

interface QuickCreateInterfaceProps {
  onMarkdownChange: (markdown: string) => void;
  initialMarkdown?: string;
  isActive?: boolean;
}

export function QuickCreateInterface({ onMarkdownChange, initialMarkdown = '', isActive = true }: QuickCreateInterfaceProps) {
  const [cards, setCards] = useState<Card[]>(() => {
    // Initialize with one empty card if no initial markdown
    if (!initialMarkdown) {
      return [{
        id: Date.now().toString() + Math.random(),
        question: '',
        answer: '',
        type: 'simple'
      }];
    }
    return [];
  });
  const [deckTitle, setDeckTitle] = useState('');
  const [deckDescription, setDeckDescription] = useState('');
  const [focusedCardIndex, setFocusedCardIndex] = useState<number | null>(null);
  const [showKeyboardHints, setShowKeyboardHints] = useState(false);
  const [isInitializing, setIsInitializing] = useState(Boolean(initialMarkdown));
  
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Generate markdown function
  const generateMarkdown = useCallback(() => {
    let markdown = '';
    
    if (deckTitle) {
      markdown += `# ${deckTitle}\n\n`;
    }
    
    // Group cards by category
    const cardsByCategory = cards.reduce((acc, card) => {
      const category = card.category || 'General';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(card);
      return acc;
    }, {} as Record<string, Card[]>);
    
    // Generate markdown by category
    Object.entries(cardsByCategory).forEach(([category, categoryCards]) => {
      if (category !== 'General') {
        markdown += `## ${category}\n\n`;
      }
      
      categoryCards.forEach(card => {
        markdown += `- ${card.question} :: ${card.answer}\n`;
      });
      
      markdown += '\n';
    });
    
    onMarkdownChange(markdown.trim());
  }, [cards, deckTitle, deckDescription, onMarkdownChange]);

  // Debounced markdown generation
  const debouncedGenerateMarkdown = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      generateMarkdown();
    }, 300);
  }, [generateMarkdown]);

  // Initialize from markdown if provided or when initialMarkdown changes
  useEffect(() => {
    console.log('[QuickCreateInterface] initialMarkdown changed:', {
      hasInitialMarkdown: !!initialMarkdown,
      length: initialMarkdown.length,
      preview: initialMarkdown.substring(0, 100) + '...',
      isInitializing,
      currentCardCount: cards.length
    });
    
    if (initialMarkdown) {
      console.log('[QuickCreateInterface] Parsing markdown to cards...');
      parseMarkdownToCards(initialMarkdown);
      setIsInitializing(false);
    }
  }, [initialMarkdown]);

  // Convert cards to markdown whenever cards change (debounced)
  useEffect(() => {
    // Only generate markdown when component is active and not initializing
    if (isActive && !isInitializing && cards.length > 0) {
      debouncedGenerateMarkdown();
    }
  }, [cards, deckTitle, deckDescription, isInitializing, isActive]);

  const parseMarkdownToCards = (markdown: string) => {
    console.log('[QuickCreateInterface parseMarkdownToCards] Parsing markdown:', {
      length: markdown.length,
      preview: markdown.substring(0, 200) + '...',
      fullContent: markdown
    });
    
    const lines = markdown.split('\n');
    const parsedCards: Card[] = [];
    let title = '';
    let currentCategory = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      
      console.log(`[QuickCreateInterface parseMarkdownToCards] Processing line ${i}: "${trimmed}"`);
      
      // Parse title
      if (trimmed.startsWith('# ')) {
        title = trimmed.substring(2).trim();
        console.log(`[QuickCreateInterface parseMarkdownToCards] Found title: "${title}"`);
        continue;
      }
      
      // Parse category headers
      if (trimmed.startsWith('## ')) {
        currentCategory = trimmed.substring(3).trim();
        console.log(`[QuickCreateInterface parseMarkdownToCards] Found category: "${currentCategory}"`);
        continue;
      }
      
      // Parse simple Q&A format: "What is 2 + 2? :: 4" or "- What is 2 + 2? :: 4"
      if (trimmed.includes(' :: ')) {
        const content = trimmed.startsWith('- ') ? trimmed.substring(2) : trimmed; // Remove "- " if present
        const parts = content.split(' :: ');
        if (parts.length >= 2) {
          const newCard = {
            id: Date.now().toString() + Math.random() + parsedCards.length,
            question: parts[0].trim(),
            answer: parts[1].trim(),
            category: currentCategory || undefined,
            type: 'simple' as const
          };
          console.log(`[QuickCreateInterface parseMarkdownToCards] Created card ${parsedCards.length + 1}:`, newCard);
          parsedCards.push(newCard);
        }
        continue;
      }
      
      // Parse multiple choice format
      if (trimmed.startsWith('- ') && !trimmed.includes(' :: ')) {
        // This is part of a multiple choice question - we'll handle this later
        // For now, skip complex parsing and focus on simple Q&A
        console.log(`[QuickCreateInterface parseMarkdownToCards] Skipping multiple choice line: "${trimmed}"`);
        continue;
      }
      
      if (trimmed) {
        console.log(`[QuickCreateInterface parseMarkdownToCards] Skipping unrecognized line: "${trimmed}"`);
      }
    }

    console.log('[QuickCreateInterface parseMarkdownToCards] Final result:', {
      title,
      cardCount: parsedCards.length,
      cards: parsedCards
    });

    setDeckTitle(title);
    setCards(parsedCards);
  };

  const addCard = () => {
    const newCard: Card = {
      id: Date.now().toString() + Math.random(),
      question: '',
      answer: '',
      type: 'simple'
    };
    setCards([...cards, newCard]);
    setFocusedCardIndex(cards.length);
    
    // Focus the new card after a brief delay
    setTimeout(() => {
      const newIndex = cards.length;
      cardRefs.current[newIndex]?.querySelector('input')?.focus();
    }, 100);
  };

  const removeCard = (index: number) => {
    const newCards = cards.filter((_, i) => i !== index);
    setCards(newCards);
    
    if (focusedCardIndex === index) {
      setFocusedCardIndex(Math.max(0, index - 1));
    } else if (focusedCardIndex !== null && focusedCardIndex > index) {
      setFocusedCardIndex(focusedCardIndex - 1);
    }
  };

  const updateCard = (index: number, updates: Partial<Card>) => {
    const newCards = [...cards];
    newCards[index] = { ...newCards[index], ...updates };
    setCards(newCards);
  };

  const moveCard = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === cards.length - 1)
    ) return;

    const newCards = [...cards];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    [newCards[index], newCards[targetIndex]] = [newCards[targetIndex], newCards[index]];
    setCards(newCards);
    setFocusedCardIndex(targetIndex);
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number, field: 'question' | 'answer' | 'category') => {
    if (e.metaKey || e.ctrlKey) {
      switch (e.key) {
        case 'Enter':
          e.preventDefault();
          addCard();
          break;
        case 'Backspace':
          e.preventDefault();
          if (cards.length > 1) removeCard(index);
          break;
        case 'ArrowUp':
          e.preventDefault();
          moveCard(index, 'up');
          break;
        case 'ArrowDown':
          e.preventDefault();
          moveCard(index, 'down');
          break;
        case '/':
          e.preventDefault();
          setShowKeyboardHints(!showKeyboardHints);
          break;
      }
    } else if (e.key === 'Tab' && field === 'answer') {
      e.preventDefault();
      if (index === cards.length - 1) {
        addCard();
      } else {
        cardRefs.current[index + 1]?.querySelector('input')?.focus();
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Quick Create Interface
        </h3>
        <button
          onClick={() => setShowKeyboardHints(!showKeyboardHints)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <Keyboard className="w-4 h-4" />
          Keyboard Shortcuts
        </button>
      </div>

      {/* Keyboard Hints */}
      <AnimatePresence>
        {showKeyboardHints && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4"
          >
            <h4 className="font-medium text-amber-800 dark:text-amber-200 mb-3">Keyboard Shortcuts</h4>
            <div className="grid grid-cols-2 gap-4 text-sm text-amber-700 dark:text-amber-300">
              <div className="space-y-1">
                <div><kbd className="bg-amber-200 dark:bg-amber-800 px-1.5 py-0.5 rounded text-xs">Cmd/Ctrl + Enter</kbd> Add new card</div>
                <div><kbd className="bg-amber-200 dark:bg-amber-800 px-1.5 py-0.5 rounded text-xs">Cmd/Ctrl + Backspace</kbd> Delete card</div>
                <div><kbd className="bg-amber-200 dark:bg-amber-800 px-1.5 py-0.5 rounded text-xs">Tab</kbd> Next field (adds card at end)</div>
              </div>
              <div className="space-y-1">
                <div><kbd className="bg-amber-200 dark:bg-amber-800 px-1.5 py-0.5 rounded text-xs">Cmd/Ctrl + ↑</kbd> Move card up</div>
                <div><kbd className="bg-amber-200 dark:bg-amber-800 px-1.5 py-0.5 rounded text-xs">Cmd/Ctrl + ↓</kbd> Move card down</div>
                <div><kbd className="bg-amber-200 dark:bg-amber-800 px-1.5 py-0.5 rounded text-xs">Cmd/Ctrl + /</kbd> Toggle shortcuts</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Deck Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Deck Title
          </label>
          <input
            type="text"
            value={deckTitle}
            onChange={(e) => setDeckTitle(e.target.value)}
            placeholder="Enter deck title..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Description
          </label>
          <input
            type="text"
            value={deckDescription}
            onChange={(e) => setDeckDescription(e.target.value)}
            placeholder="Brief description..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>
      </div>

      {/* Cards */}
      <div className="space-y-4">
        <AnimatePresence>
          {cards.map((card, index) => (
            <motion.div
              key={card.id}
              ref={(el) => (cardRefs.current[index] = el)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`border-2 rounded-lg p-4 transition-all ${
                focusedCardIndex === index
                  ? 'border-purple-300 dark:border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
              }`}
              onFocus={() => setFocusedCardIndex(index)}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Card {index + 1}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => moveCard(index, 'up')}
                    disabled={index === 0}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => moveCard(index, 'down')}
                    disabled={index === cards.length - 1}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => removeCard(index)}
                    disabled={cards.length === 1}
                    className="p-1 text-red-400 hover:text-red-600 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Category (optional)
                  </label>
                  <input
                    type="text"
                    value={card.category || ''}
                    onChange={(e) => updateCard(index, { category: e.target.value || undefined })}
                    onKeyDown={(e) => handleKeyDown(e, index, 'category')}
                    placeholder="e.g., Math, History, Science..."
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Question
                  </label>
                  <input
                    type="text"
                    value={card.question}
                    onChange={(e) => updateCard(index, { question: e.target.value })}
                    onKeyDown={(e) => handleKeyDown(e, index, 'question')}
                    placeholder="What's your question?"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Answer
                  </label>
                  <input
                    type="text"
                    value={card.answer}
                    onChange={(e) => updateCard(index, { answer: e.target.value })}
                    onKeyDown={(e) => handleKeyDown(e, index, 'answer')}
                    placeholder="What's the answer?"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        <button
          onClick={addCard}
          className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:border-purple-300 dark:hover:border-purple-600 hover:text-purple-600 dark:hover:text-purple-400 transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Card (Cmd/Ctrl + Enter)
        </button>
      </div>

      {cards.length > 0 && (
        <div className="text-sm text-gray-600 dark:text-gray-400 text-center">
          {cards.length} card{cards.length !== 1 ? 's' : ''} created
        </div>
      )}
    </div>
  );
}