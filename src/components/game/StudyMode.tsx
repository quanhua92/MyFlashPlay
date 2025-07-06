import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw, Home, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from '@tanstack/react-router';
import { FlashCard } from '@/components/flashcard/FlashCard';
import { ProgressBar, playSound } from '@/components/ui';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';
import type { Deck, GameSession } from '@/types';
import { v4 as uuidv4 } from 'uuid';

interface StudyModeProps {
  deck: Deck;
  onComplete?: (session: GameSession) => void;
}

export function StudyMode({ deck, onComplete }: StudyModeProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cards] = useState(() => 
    deck.settings.shuffleCards 
      ? [...deck.cards].sort(() => Math.random() - 0.5)
      : deck.cards
  );
  const [startTime] = useState(new Date());
  const [isComplete, setIsComplete] = useState(false);

  const currentCard = cards[currentIndex];
  const progress = ((currentIndex + 1) / cards.length) * 100;

  const goNext = () => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      playSound('flip');
    } else {
      completeSession();
    }
  };

  const goPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      playSound('flip');
    }
  };

  const completeSession = () => {
    const endTime = new Date();
    const duration = Math.round((endTime.getTime() - startTime.getTime()) / 1000);
    
    const session: GameSession = {
      id: uuidv4(),
      deckId: deck.id,
      deckName: deck.name,
      mode: 'study',
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      duration,
      score: {
        points: cards.length * 10, // Basic points for studying
        accuracy: 100, // Study mode doesn't track accuracy
        correctAnswers: cards.length,
        totalQuestions: cards.length,
        streak: 0,
        bestStreak: 0
      },
      details: {
        cardResults: cards.map(card => ({
          cardId: card.id,
          wasCorrect: true,
          timeSpent: duration / cards.length,
          attempts: 1,
          hintUsed: false
        })),
        bonuses: [],
        difficulty: 'study',
        hintsUsed: 0
      }
    };

    setIsComplete(true);
    playSound('complete');
    onComplete?.(session);
  };

  // Swipe gestures
  const swipeRef = useSwipeGesture({
    onSwipeLeft: goNext,
    onSwipeRight: goPrevious
  });

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goPrevious();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === ' ') e.preventDefault(); // Prevent page scroll on space
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentIndex]);

  if (isComplete) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-16"
      >
        <div className="mb-8">
          <div className="w-24 h-24 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Study Session Complete!
          </h2>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            You've reviewed all {cards.length} cards in {deck.name}
          </p>
        </div>

        <div className="flex justify-center space-x-4">
          <button
            onClick={() => {
              setCurrentIndex(0);
              setIsComplete(false);
            }}
            className="flex items-center space-x-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
          >
            <RotateCcw className="w-5 h-5" />
            <span>Study Again</span>
          </button>
          <Link
            to="/"
            className="flex items-center space-x-2 bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Home className="w-5 h-5" />
            <span>Home</span>
          </Link>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto" ref={swipeRef as any}>
      {/* Progress Bar */}
      <div className="mb-8">
        <ProgressBar
          current={currentIndex + 1}
          total={cards.length}
          showPercentage={true}
          showSteps={true}
          color="purple"
          size="md"
          animated={true}
        />
      </div>

      {/* Flashcard */}
      <div className="mb-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentCard.id}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            <FlashCard card={currentCard} />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <button
          onClick={goPrevious}
          disabled={currentIndex === 0}
          className="flex items-center space-x-2 px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>Previous</span>
        </button>

        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
          <p>Click card to flip • Use arrow keys to navigate</p>
        </div>

        <button
          onClick={goNext}
          className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition-shadow"
        >
          <span>{currentIndex === cards.length - 1 ? 'Complete' : 'Next'}</span>
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}