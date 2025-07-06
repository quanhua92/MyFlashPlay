import { useState, useEffect, useRef } from 'react';
import { Timer, Zap, AlertCircle, Home } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from '@tanstack/react-router';
import { ScoreDisplay, ConfettiEffect, playSound } from '@/components/ui';
import type { Deck, GameSession } from '@/types';
import { v4 as uuidv4 } from 'uuid';

interface SpeedChallengeProps {
  deck: Deck;
  timeLimit?: 30 | 60 | 90; // seconds
  onComplete?: (session: GameSession) => void;
}

export function SpeedChallenge({ 
  deck, 
  timeLimit = 60,
  onComplete 
}: SpeedChallengeProps) {
  const [cards] = useState(() => {
    // Filter to only quiz-compatible cards
    return deck.cards.filter(card => 
      card.type === 'multiple-choice' || card.type === 'true-false'
    ).sort(() => Math.random() - 0.5);
  });
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(timeLimit);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  // const [answerTime, setAnswerTime] = useState<number>(0); // Removed unused
  const [speedBonus, setSpeedBonus] = useState(0);
  
  const startTime = useRef(new Date());
  const questionStartTime = useRef(Date.now());
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const cardResults = useRef<Array<any>>([]);

  const currentCard = cards[currentIndex];
  const progress = ((currentIndex + 1) / cards.length) * 100;
  const isTimeWarning = timeRemaining <= 10;
  const accuracy = currentIndex > 0 ? (correctAnswers / currentIndex) * 100 : 0;

  // Timer effect
  useEffect(() => {
    if (!isComplete && timeRemaining > 0) {
      timerRef.current = setTimeout(() => {
        setTimeRemaining(prev => Math.max(0, prev - 1) as 30 | 60 | 90);
      }, 1000);
    } else if (timeRemaining <= 0 && !isComplete) {
      completeSession();
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [timeRemaining, isComplete]);

  // Calculate speed bonus based on answer time
  const calculateSpeedBonus = (answerTimeMs: number): number => {
    if (answerTimeMs < 1000) return 50; // Under 1 second
    if (answerTimeMs < 2000) return 30; // Under 2 seconds
    if (answerTimeMs < 3000) return 20; // Under 3 seconds
    if (answerTimeMs < 5000) return 10; // Under 5 seconds
    return 0;
  };

  const handleAnswer = (isCorrect: boolean) => {
    const answerEndTime = Date.now();
    const timeSpent = answerEndTime - questionStartTime.current;

    let pointsEarned = 0;
    let newStreak = streak;
    
    if (isCorrect) {
      const basePoints = 100;
      const bonus = calculateSpeedBonus(timeSpent);
      const streakMultiplier = Math.min(streak + 1, 5); // Max 5x multiplier
      
      pointsEarned = (basePoints + bonus) * streakMultiplier;
      setScore(score + pointsEarned);
      setSpeedBonus(bonus);
      
      newStreak = streak + 1;
      setStreak(newStreak);
      setCorrectAnswers(correctAnswers + 1);
      
      playSound('correct');
      
      if (newStreak >= 5) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 2000);
      }
    } else {
      setStreak(0);
      playSound('incorrect');
    }

    // Record result
    cardResults.current.push({
      cardId: currentCard.id,
      wasCorrect: isCorrect,
      timeSpent: timeSpent / 1000,
      attempts: 1,
      hintUsed: false,
      speedBonus: isCorrect ? calculateSpeedBonus(timeSpent) : 0
    });

    // Move to next card
    setTimeout(() => {
      if (currentIndex < cards.length - 1) {
        setCurrentIndex(currentIndex + 1);
        questionStartTime.current = Date.now();
        setSpeedBonus(0);
      } else {
        completeSession();
      }
    }, 1000);
  };

  const completeSession = () => {
    const endTime = new Date();
    const duration = Math.round((endTime.getTime() - startTime.current.getTime()) / 1000);
    
    const session: GameSession = {
      id: uuidv4(),
      deckId: deck.id,
      deckName: deck.name,
      mode: 'speed',
      startTime: startTime.current.toISOString(),
      endTime: endTime.toISOString(),
      duration,
      score: {
        points: score,
        accuracy: accuracy,
        correctAnswers,
        totalQuestions: currentIndex + 1,
        streak: Math.max(...cardResults.current.map((_, i) => 
          cardResults.current.slice(0, i + 1).reverse().findIndex(r => !r.wasCorrect)
        )),
        bestStreak: streak
      },
      details: {
        cardResults: cardResults.current,
        bonuses: [
          { type: 'speed', description: 'Speed bonus', points: cardResults.current.reduce((sum, r) => sum + (r.speedBonus || 0), 0) }
        ],
        difficulty: 'speed',
        hintsUsed: 0
      }
    };

    setIsComplete(true);
    playSound('complete');
    onComplete?.(session);
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (isComplete) return;
      
      if (e.key >= '1' && e.key <= '4' && currentCard?.type === 'multiple-choice') {
        const optionIndex = parseInt(e.key) - 1;
        if (currentCard.options && currentCard.options[optionIndex]) {
          handleAnswer(currentCard.options[optionIndex].isCorrect);
        }
      }
      
      if ((e.key === 't' || e.key === 'f') && currentCard?.type === 'true-false') {
        handleAnswer(e.key === 't' ? currentCard.back === 'True' : currentCard.back === 'False');
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentCard, isComplete]);

  if (cards.length === 0) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          No Quiz Cards Available
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          This deck doesn't have any multiple choice or true/false cards for Speed Challenge mode.
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

  if (isComplete) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-16"
      >
        <ConfettiEffect trigger={true} />
        
        <div className="mb-8">
          <div className="w-24 h-24 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Zap className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Speed Challenge Complete!
          </h2>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            You answered {currentIndex + 1} questions in {timeLimit} seconds
          </p>
        </div>

        <div className="max-w-md mx-auto mb-8">
          <ScoreDisplay
            score={score}
            streak={streak}
            accuracy={accuracy}
            size="lg"
          />
        </div>

        <div className="flex justify-center space-x-4">
          <button
            onClick={() => window.location.reload()}
            className="flex items-center space-x-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Zap className="w-5 h-5" />
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
    <div className="max-w-4xl mx-auto">
      <ConfettiEffect trigger={showConfetti} />
      
      {/* Timer and Score */}
      <div className="mb-6 grid grid-cols-2 gap-4">
        <motion.div
          animate={isTimeWarning ? { scale: [1, 1.05, 1] } : {}}
          transition={{ repeat: Infinity, duration: 1 }}
          className={`bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg ${
            isTimeWarning ? 'ring-2 ring-red-500' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Timer className={`w-6 h-6 ${isTimeWarning ? 'text-red-500' : 'text-gray-600 dark:text-gray-400'}`} />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Time</span>
            </div>
            <div className={`text-2xl font-bold ${
              isTimeWarning ? 'text-red-500' : 'text-gray-900 dark:text-white'
            }`}>
              {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
            </div>
          </div>
        </motion.div>

        <ScoreDisplay
          score={score}
          streak={streak}
          accuracy={accuracy}
          size="sm"
          showAnimation={true}
        />
      </div>

      {/* Speed Bonus Indicator */}
      <AnimatePresence>
        {speedBonus > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center mb-4"
          >
            <span className="inline-flex items-center gap-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 px-4 py-2 rounded-full font-bold">
              <Zap className="w-5 h-5" />
              +{speedBonus} Speed Bonus!
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400 mb-2">
          <span>Question {currentIndex + 1} of {cards.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <motion.div
            className="bg-gradient-to-r from-yellow-500 to-orange-500 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Question Card */}
      <div className="mb-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentCard.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg"
          >
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
              {currentCard.front}
            </h3>

            {currentCard.type === 'multiple-choice' && currentCard.options && (
              <div className="space-y-3">
                {currentCard.options.map((option, index) => (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleAnswer(option.isCorrect)}
                    className="w-full p-4 text-left bg-gray-50 dark:bg-gray-700 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors flex items-center gap-3"
                  >
                    <span className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">
                      {index + 1}
                    </span>
                    <span className="text-gray-900 dark:text-white">
                      {option.text}
                    </span>
                  </motion.button>
                ))}
              </div>
            )}

            {currentCard.type === 'true-false' && (
              <div className="grid grid-cols-2 gap-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleAnswer(currentCard.back === 'True')}
                  className="p-6 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                >
                  <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                    True (T)
                  </span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleAnswer(currentCard.back === 'False')}
                  className="p-6 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                >
                  <span className="text-2xl font-bold text-red-600 dark:text-red-400">
                    False (F)
                  </span>
                </motion.button>
              </div>
            )}

            <div className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
              Press number keys (1-4) or T/F for keyboard shortcuts
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}