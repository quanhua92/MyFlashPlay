import { useState } from 'react';
import { CheckCircle, XCircle, Home, RotateCcw, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from '@tanstack/react-router';
import type { Deck, GameSession, QuizQuestion } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { cn } from '@/lib/utils';

interface QuizModeProps {
  deck: Deck;
  onComplete?: (session: GameSession) => void;
}

export function QuizMode({ deck, onComplete }: QuizModeProps) {
  const [questions] = useState(() => generateQuizQuestions(deck));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [startTime] = useState(new Date());
  const [isComplete, setIsComplete] = useState(false);

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  const handleAnswer = (answer: string) => {
    if (showFeedback) return;
    
    setSelectedAnswer(answer);
    setShowFeedback(true);
    
    const isCorrect = answer === currentQuestion.correctAnswer;
    
    if (isCorrect) {
      setScore(score + 100);
      setCorrectAnswers(correctAnswers + 1);
    }
    
    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setSelectedAnswer(null);
        setShowFeedback(false);
      } else {
        completeSession();
      }
    }, 2000);
  };

  const completeSession = () => {
    const endTime = new Date();
    const duration = Math.round((endTime.getTime() - startTime.getTime()) / 1000);
    const accuracy = (correctAnswers / questions.length) * 100;
    
    const session: GameSession = {
      id: uuidv4(),
      deckId: deck.id,
      deckName: deck.name,
      mode: 'quiz',
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      duration,
      score: {
        points: score,
        accuracy,
        correctAnswers,
        totalQuestions: questions.length,
        streak: 0,
        bestStreak: 0
      },
      details: {
        cardResults: [],
        bonuses: [],
        difficulty: 'quiz',
        hintsUsed: 0
      }
    };

    setIsComplete(true);
    onComplete?.(session);
  };

  if (isComplete) {
    const accuracy = (correctAnswers / questions.length) * 100;
    const isPerfect = accuracy === 100;
    
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-16"
      >
        <div className="mb-8">
          <div className={cn(
            "w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4",
            isPerfect ? "bg-yellow-100 dark:bg-yellow-900" : "bg-blue-100 dark:bg-blue-900"
          )}>
            {isPerfect ? (
              <Trophy className="w-12 h-12 text-yellow-600 dark:text-yellow-400" />
            ) : (
              <CheckCircle className="w-12 h-12 text-blue-600 dark:text-blue-400" />
            )}
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {isPerfect ? 'Perfect Score!' : 'Quiz Complete!'}
          </h2>
          <p className="text-gray-600 dark:text-gray-300 text-lg mb-4">
            You scored {correctAnswers} out of {questions.length} questions
          </p>
          
          <div className="grid grid-cols-3 gap-4 max-w-md mx-auto mb-8">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{score}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Points</div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{Math.round(accuracy)}%</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Accuracy</div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{correctAnswers}/{questions.length}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Correct</div>
            </div>
          </div>
        </div>

        <div className="flex justify-center space-x-4">
          <button
            onClick={() => {
              setCurrentIndex(0);
              setSelectedAnswer(null);
              setShowFeedback(false);
              setScore(0);
              setCorrectAnswers(0);
              setIsComplete(false);
            }}
            className="flex items-center space-x-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
          >
            <RotateCcw className="w-5 h-5" />
            <span>Try Again</span>
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
    <div className="max-w-4xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Question {currentIndex + 1} of {questions.length}
          </span>
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Score: {score} points
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <motion.div
            className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
              {currentQuestion.question}
            </h2>

            <div className="grid gap-4">
              {currentQuestion.options?.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswer(option)}
                  disabled={showFeedback}
                  className={cn(
                    'p-4 rounded-xl text-left transition-all duration-200 border-2',
                    !showFeedback && 'hover:border-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20',
                    !showFeedback && 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700',
                    showFeedback && option === currentQuestion.correctAnswer && 'border-green-500 bg-green-100 dark:bg-green-900/30',
                    showFeedback && option === selectedAnswer && option !== currentQuestion.correctAnswer && 'border-red-500 bg-red-100 dark:bg-red-900/30',
                    showFeedback && option !== selectedAnswer && option !== currentQuestion.correctAnswer && 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 opacity-50'
                  )}
                >
                  <div className="flex items-center space-x-3">
                    <div className={cn(
                      'w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold',
                      !showFeedback && 'border-gray-300 dark:border-gray-600',
                      showFeedback && option === currentQuestion.correctAnswer && 'border-green-500 bg-green-500 text-white',
                      showFeedback && option === selectedAnswer && option !== currentQuestion.correctAnswer && 'border-red-500 bg-red-500 text-white'
                    )}>
                      {showFeedback && option === currentQuestion.correctAnswer && <CheckCircle className="w-5 h-5" />}
                      {showFeedback && option === selectedAnswer && option !== currentQuestion.correctAnswer && <XCircle className="w-5 h-5" />}
                      {!showFeedback && String.fromCharCode(65 + index)}
                    </div>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {option}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            {showFeedback && currentQuestion.explanation && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500"
              >
                <p className="text-gray-700 dark:text-gray-300">
                  <strong>Explanation:</strong> {currentQuestion.explanation}
                </p>
              </motion.div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// Helper function to generate quiz questions from deck
function generateQuizQuestions(deck: Deck): QuizQuestion[] {
  return deck.cards
    .filter(card => card.type === 'multiple-choice' || card.type === 'simple')
    .map(card => {
      if (card.type === 'multiple-choice' && card.options) {
        return {
          id: card.id,
          type: 'multiple-choice' as const,
          question: card.front.replace(/<[^>]*>/g, ''), // Strip HTML
          options: card.options.map(opt => opt.text),
          correctAnswer: card.options.find(opt => opt.isCorrect)?.text || '',
          explanation: card.metadata.explanation,
          hint: card.metadata.hint,
          difficulty: card.metadata.difficulty,
          cardId: card.id
        };
      } else {
        // Generate multiple choice from simple cards
        const otherAnswers = deck.cards
          .filter(c => c.id !== card.id && c.back !== card.back)
          .map(c => c.back.replace(/<[^>]*>/g, ''))
          .slice(0, 3);
        
        const correctAnswer = card.back.replace(/<[^>]*>/g, '');
        const options = [correctAnswer, ...otherAnswers]
          .sort(() => Math.random() - 0.5);

        return {
          id: card.id,
          type: 'multiple-choice' as const,
          question: card.front.replace(/<[^>]*>/g, ''),
          options,
          correctAnswer,
          explanation: card.metadata.explanation,
          hint: card.metadata.hint,
          difficulty: card.metadata.difficulty,
          cardId: card.id
        };
      }
    })
    .slice(0, 10); // Limit to 10 questions
}