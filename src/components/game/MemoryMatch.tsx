import { useState, useEffect, useCallback } from 'react';
import { Brain, Trophy, RotateCcw, Home } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from '@tanstack/react-router';
import { ScoreDisplay, ConfettiEffect, playSound } from '@/components/ui';
import { announce } from '@/hooks/useAccessibility';
import type { Deck, GameSession } from '@/types';
import { v4 as uuidv4 } from 'uuid';

interface MemoryMatchProps {
  deck: Deck;
  difficulty?: 'easy' | 'medium' | 'hard';
  onComplete?: (session: GameSession) => void;
}

interface MemoryCard {
  id: string;
  cardId: string;
  content: string;
  isQuestion: boolean;
  isFlipped: boolean;
  isMatched: boolean;
  pairId: string;
}

export function MemoryMatch({ 
  deck, 
  difficulty = 'easy',
  onComplete 
}: MemoryMatchProps) {
  const gridSizes = {
    easy: { rows: 4, cols: 4, pairs: 8 },
    medium: { rows: 6, cols: 6, pairs: 18 },
    hard: { rows: 8, cols: 8, pairs: 32 }
  };

  const { cols, pairs } = gridSizes[difficulty];

  // Filter cards that can be used (simple type only for now)
  const usableCards = deck.cards
    .filter(card => card.type === 'simple')
    .slice(0, pairs);

  if (usableCards.length < pairs) {
    return (
      <div className="text-center py-16">
        <Brain className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Not Enough Cards
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          This deck needs at least {pairs} simple cards for {difficulty} difficulty.
          It currently has {usableCards.length} cards.
        </p>
        <Link
          to="/play/$deckId"
          params={{ deckId: deck.id }}
          search={{ mode: undefined }}
          className="inline-flex items-center space-x-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Home className="w-5 h-5" />
          <span>Back to Game Modes</span>
        </Link>
      </div>
    );
  }

  const [memoryCards, setMemoryCards] = useState<MemoryCard[]>([]);
  const [flippedCards, setFlippedCards] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [score, setScore] = useState(0);
  const [startTime] = useState(new Date());
  const [isComplete, setIsComplete] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Initialize game board
  useEffect(() => {
    const cards: MemoryCard[] = [];
    
    usableCards.forEach(card => {
      const pairId = card.id;
      
      // Question card
      cards.push({
        id: uuidv4(),
        cardId: card.id,
        content: card.front,
        isQuestion: true,
        isFlipped: false,
        isMatched: false,
        pairId
      });
      
      // Answer card
      cards.push({
        id: uuidv4(),
        cardId: card.id,
        content: card.back,
        isQuestion: false,
        isFlipped: false,
        isMatched: false,
        pairId
      });
    });
    
    // Shuffle cards
    const shuffled = cards.sort(() => Math.random() - 0.5);
    setMemoryCards(shuffled);
  }, [usableCards]);

  const handleCardClick = useCallback((cardId: string) => {
    const card = memoryCards.find(c => c.id === cardId);
    if (!card || card.isFlipped || card.isMatched || flippedCards.length >= 2) {
      return;
    }

    playSound('flip');
    const newFlippedCards = [...flippedCards, cardId];
    setFlippedCards(newFlippedCards);
    
    // Update card state
    setMemoryCards(prev => prev.map(c => 
      c.id === cardId ? { ...c, isFlipped: true } : c
    ));

    // Check for match if two cards are flipped
    if (newFlippedCards.length === 2) {
      setMoves(moves + 1);
      checkForMatch(newFlippedCards);
    }
  }, [memoryCards, flippedCards, moves]);

  const checkForMatch = (flippedIds: string[]) => {
    const [firstId, secondId] = flippedIds;
    const firstCard = memoryCards.find(c => c.id === firstId);
    const secondCard = memoryCards.find(c => c.id === secondId);

    if (!firstCard || !secondCard) return;

    // Check if cards match (same pairId and one is question, one is answer)
    const isMatch = firstCard.pairId === secondCard.pairId && 
                   firstCard.isQuestion !== secondCard.isQuestion;

    setTimeout(() => {
      if (isMatch) {
        // Match found
        playSound('correct');
        setMatchedPairs(matchedPairs + 1);
        setScore(score + calculatePoints());
        
        setMemoryCards(prev => prev.map(c => 
          c.pairId === firstCard.pairId ? { ...c, isMatched: true } : c
        ));
        
        announce(`Match found! ${firstCard.content} matches ${secondCard.content}`);
        
        // Check win condition
        if (matchedPairs + 1 === pairs) {
          completeGame();
        }
      } else {
        // No match
        playSound('incorrect');
        setMemoryCards(prev => prev.map(c => 
          (c.id === firstId || c.id === secondId) ? { ...c, isFlipped: false } : c
        ));
        
        announce('No match, try again');
      }
      
      setFlippedCards([]);
    }, 1000);
  };

  const calculatePoints = (): number => {
    const basePoints = 100;
    const movesPenalty = Math.max(0, moves - pairs) * 5;
    return Math.max(50, basePoints - movesPenalty);
  };

  const completeGame = () => {
    const endTime = new Date();
    const duration = Math.round((endTime.getTime() - startTime.getTime()) / 1000);
    const finalScore = score + calculateTimeBonus(duration) + (moves === pairs ? 500 : 0);
    
    setScore(finalScore);
    setIsComplete(true);
    setShowConfetti(true);
    playSound('complete');
    
    const session: GameSession = {
      id: uuidv4(),
      deckId: deck.id,
      deckName: deck.name,
      mode: 'memory',
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      duration,
      score: {
        points: finalScore,
        accuracy: (pairs / moves) * 100,
        correctAnswers: pairs,
        totalQuestions: pairs,
        streak: 0,
        bestStreak: 0
      },
      details: {
        cardResults: [],
        bonuses: [
          { type: 'time', amount: calculateTimeBonus(duration) },
          moves === pairs ? { type: 'perfect', amount: 500 } : null
        ].filter(Boolean) as any[],
        difficulty,
        hintsUsed: 0
      }
    };
    
    onComplete?.(session);
  };

  const calculateTimeBonus = (seconds: number): number => {
    const targetTime = pairs * 5; // 5 seconds per pair
    if (seconds < targetTime) {
      return Math.floor((targetTime - seconds) * 2);
    }
    return 0;
  };

  const resetGame = () => {
    const shuffled = [...memoryCards].sort(() => Math.random() - 0.5);
    setMemoryCards(shuffled.map(c => ({ ...c, isFlipped: false, isMatched: false })));
    setFlippedCards([]);
    setMoves(0);
    setMatchedPairs(0);
    setScore(0);
    setIsComplete(false);
  };

  if (isComplete) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-16"
      >
        <ConfettiEffect trigger={showConfetti} />
        
        <div className="mb-8">
          <div className="w-24 h-24 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Perfect Memory!
          </h2>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            You matched all {pairs} pairs in {moves} moves!
          </p>
        </div>

        <div className="max-w-md mx-auto mb-8">
          <ScoreDisplay
            score={score}
            accuracy={(pairs / moves) * 100}
            size="lg"
          />
        </div>

        <div className="flex justify-center space-x-4">
          <button
            onClick={resetGame}
            className="flex items-center space-x-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
          >
            <RotateCcw className="w-5 h-5" />
            <span>Play Again</span>
          </button>
          <Link
            to="/decks"
            className="flex items-center space-x-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            <Home className="w-5 h-5" />
            <span>Back to Decks</span>
          </Link>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <ConfettiEffect trigger={showConfetti} />
      
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Memory Match: {deck.name}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Match questions with their answers
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {moves}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Moves</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {matchedPairs}/{pairs}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Matches</div>
            </div>
          </div>
        </div>
      </div>

      {/* Game Board */}
      <div
        className={`grid gap-2 md:gap-3 mx-auto`}
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          maxWidth: `${cols * 120}px`
        }}
        role="grid"
        aria-label="Memory match game board"
      >
        <AnimatePresence>
          {memoryCards.map((card, index) => (
            <motion.button
              key={card.id}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ 
                opacity: card.isMatched ? 0 : 1, 
                scale: card.isMatched ? 0.8 : 1 
              }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3, delay: index * 0.02 }}
              onClick={() => handleCardClick(card.id)}
              disabled={card.isFlipped || card.isMatched}
              className={`
                aspect-square rounded-lg p-3 md:p-4 text-sm md:text-base font-medium
                transition-all duration-300 transform preserve-3d
                ${card.isFlipped || card.isMatched 
                  ? 'rotate-y-180' 
                  : 'hover:scale-105 cursor-pointer'
                }
                ${card.isMatched 
                  ? 'pointer-events-none' 
                  : ''
                }
              `}
              style={{
                transformStyle: 'preserve-3d',
                transform: card.isFlipped || card.isMatched ? 'rotateY(180deg)' : 'rotateY(0deg)'
              }}
              aria-label={`Card ${index + 1}. ${card.isFlipped ? card.content : 'Face down'}`}
              aria-pressed={card.isFlipped}
            >
              {/* Card Back */}
              <div className={`
                absolute inset-0 rounded-lg flex items-center justify-center
                bg-gradient-to-br from-purple-500 to-pink-500 text-white
                backface-hidden
              `}>
                <Brain className="w-8 h-8 md:w-12 md:h-12 opacity-50" />
              </div>
              
              {/* Card Front */}
              <div className={`
                absolute inset-0 rounded-lg flex items-center justify-center p-2
                ${card.isQuestion 
                  ? 'bg-gradient-to-br from-blue-500 to-cyan-500' 
                  : 'bg-gradient-to-br from-green-500 to-emerald-500'
                }
                text-white rotate-y-180 backface-hidden
              `}>
                <span className="text-center break-words">
                  {card.content}
                </span>
              </div>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>

      {/* Instructions */}
      <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
        Click cards to flip them. Match questions (blue) with their answers (green).
      </div>
    </div>
  );
}