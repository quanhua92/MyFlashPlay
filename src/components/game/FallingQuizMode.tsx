import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Zap, Target, Heart } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { SafeContentRenderer } from '@/components/common/SafeContentRenderer';
import type { Deck, Card, GameSession } from '@/types';

interface FallingQuiz {
  id: string;
  card: Card;
  lane: number;
  position: number; // 0 to 100 (percentage from top)
  speed: number;
  answers: string[];
  correctIndex: number;
}

interface FallingQuizModeProps {
  deck: Deck;
  onComplete?: (session: GameSession) => void;
}

export function FallingQuizMode({ deck, onComplete }: FallingQuizModeProps) {
  const [gameState, setGameState] = useState<'playing' | 'paused' | 'gameOver'>('playing');
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [lives, setLives] = useState(3);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [fallingQuizzes, setFallingQuizzes] = useState<FallingQuiz[]>([]);
  const [answeredQuizzes, setAnsweredQuizzes] = useState<Set<string>>(new Set());
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  
  const gameLoopRef = useRef<number>();
  const startTimeRef = useRef<Date>(new Date());
  const spawnTimerRef = useRef<number>(0);
  const difficultyRef = useRef<number>(1);

  // Generate quiz from card
  const generateQuiz = useCallback((card: Card, lane: number): FallingQuiz => {
    let answers: string[] = [];
    let correctIndex = 0;

    if (card.type === 'multiple_choice' && card.choices) {
      answers = [...card.choices];
      correctIndex = answers.findIndex(choice => choice === card.back);
    } else {
      // For basic cards, generate some wrong answers from other cards
      const otherCards = deck.cards.filter(c => c.id !== card.id).slice(0, 3);
      answers = [card.back, ...otherCards.map(c => c.back)];
      // Shuffle answers
      for (let i = answers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [answers[i], answers[j]] = [answers[j], answers[i]];
      }
      correctIndex = answers.findIndex(answer => answer === card.back);
    }

    return {
      id: `quiz-${card.id}-${Date.now()}-${Math.random()}`,
      card,
      lane,
      position: 0,
      speed: 0.5 + (difficultyRef.current * 0.2),
      answers: answers.slice(0, 4), // Max 4 answers
      correctIndex
    };
  }, [deck.cards]);

  // Spawn new quiz
  const spawnQuiz = useCallback(() => {
    if (answeredQuizzes.size >= deck.cards.length) return;

    const availableCards = deck.cards.filter(card => 
      !fallingQuizzes.some(quiz => quiz.card.id === card.id) &&
      !answeredQuizzes.has(card.id)
    );

    if (availableCards.length === 0) return;

    const randomCard = availableCards[Math.floor(Math.random() * availableCards.length)];
    const randomLane = Math.floor(Math.random() * 3);
    
    const newQuiz = generateQuiz(randomCard, randomLane);
    setFallingQuizzes(prev => [...prev, newQuiz]);
  }, [deck.cards, fallingQuizzes, answeredQuizzes, generateQuiz]);

  // Game loop
  const gameLoop = useCallback(() => {
    if (gameState !== 'playing') return;

    const now = Date.now();
    const deltaTime = 16; // ~60fps

    // Update quiz positions
    setFallingQuizzes(prev => prev.map(quiz => ({
      ...quiz,
      position: quiz.position + quiz.speed
    })).filter(quiz => {
      // Remove quizzes that fell off screen
      if (quiz.position > 100) {
        setLives(prevLives => {
          const newLives = prevLives - 1;
          if (newLives <= 0) {
            setGameState('gameOver');
          }
          return newLives;
        });
        setStreak(0);
        return false;
      }
      return true;
    }));

    // Spawn new quizzes
    spawnTimerRef.current += deltaTime;
    if (spawnTimerRef.current > 2000 - (difficultyRef.current * 200)) { // Spawn every 2-1.2 seconds based on difficulty
      spawnQuiz();
      spawnTimerRef.current = 0;
    }

    // Update difficulty
    const timeInSeconds = (now - startTimeRef.current) / 1000;
    difficultyRef.current = Math.min(3, 1 + Math.floor(timeInSeconds / 30)); // Increase every 30 seconds, max 3

    setTimeElapsed(Math.floor(timeInSeconds));

    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [gameState, spawnQuiz]);

  // Start game loop
  useEffect(() => {
    if (gameState === 'playing') {
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    }
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState, gameLoop]);

  // Handle answer selection
  const handleAnswer = useCallback((quizId: string, answerIndex: number) => {
    const quiz = fallingQuizzes.find(q => q.id === quizId);
    if (!quiz) return;

    const isCorrect = answerIndex === quiz.correctIndex;
    const points = isCorrect ? (100 + streak * 10) : 0;

    if (isCorrect) {
      setScore(prev => prev + points);
      setStreak(prev => {
        const newStreak = prev + 1;
        setBestStreak(current => Math.max(current, newStreak));
        return newStreak;
      });
      setCorrectAnswers(prev => prev + 1);
      setAnsweredQuizzes(prev => new Set([...prev, quiz.card.id]));
      
      // Remove the quiz immediately
      setFallingQuizzes(prev => prev.filter(q => q.id !== quizId));
    } else {
      setStreak(0);
      // Quiz continues falling for wrong answers
    }

    // Check if game complete
    if (isCorrect && answeredQuizzes.size + 1 >= deck.cards.length) {
      setGameState('gameOver');
      const endTime = new Date();
      const duration = Math.round((endTime.getTime() - startTimeRef.current.getTime()) / 1000);
      const accuracy = ((correctAnswers + 1) / deck.cards.length) * 100;
      
      const session: GameSession = {
        id: uuidv4(),
        deckId: deck.id,
        deckName: deck.name,
        mode: 'falling',
        startTime: startTimeRef.current.toISOString(),
        endTime: endTime.toISOString(),
        duration,
        score: {
          points: score + points,
          accuracy,
          correctAnswers: correctAnswers + 1,
          totalQuestions: deck.cards.length,
          streak,
          bestStreak: Math.max(bestStreak, streak + 1)
        },
        details: {
          cardResults: [],
          bonuses: [],
          difficulty: 'medium',
          hintsUsed: 0
        }
      };
      
      if (onComplete) {
        onComplete(session);
      }
    }
  }, [fallingQuizzes, streak, answeredQuizzes, deck, score, timeElapsed, onComplete]);

  return (
    <div className="h-screen bg-gradient-to-b from-blue-400 via-purple-500 to-pink-500 overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center p-4 bg-black/20 text-white">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <Target className="w-5 h-5" />
            <span className="font-bold">{score}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Zap className="w-5 h-5" />
            <span>{streak}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Clock className="w-5 h-5" />
            <span>{Math.floor(timeElapsed / 60)}:{(timeElapsed % 60).toString().padStart(2, '0')}</span>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          {Array.from({ length: 3 }, (_, i) => (
            <Heart
              key={i}
              className={`w-6 h-6 ${i < lives ? 'text-red-500 fill-current' : 'text-gray-400'}`}
            />
          ))}
        </div>
      </div>

      {/* Game Area */}
      <div className="flex h-full">
        {/* Three Lanes */}
        {Array.from({ length: 3 }, (_, laneIndex) => (
          <div key={laneIndex} className="flex-1 relative border-r border-white/20 last:border-r-0">
            {/* Falling Quizzes */}
            <AnimatePresence>
              {fallingQuizzes
                .filter(quiz => quiz.lane === laneIndex)
                .map(quiz => (
                  <motion.div
                    key={quiz.id}
                    initial={{ y: -100, opacity: 0 }}
                    animate={{ 
                      y: `${quiz.position}vh`,
                      opacity: 1
                    }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: 'linear', duration: 0.1 }}
                    className="absolute left-2 right-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3"
                    style={{ top: 0 }}
                  >
                    {/* Question */}
                    <div className="text-sm font-medium text-gray-900 dark:text-white mb-2 text-center">
                      <SafeContentRenderer content={quiz.card.front} />
                    </div>
                    
                    {/* Answer Buttons */}
                    <div className="grid grid-cols-1 gap-1">
                      {quiz.answers.map((answer, index) => (
                        <button
                          key={index}
                          onClick={() => handleAnswer(quiz.id, index)}
                          className="px-2 py-1 text-xs bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors"
                        >
                          {answer}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                ))
              }
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* Game Over Screen */}
      <AnimatePresence>
        {gameState === 'gameOver' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/80 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center max-w-md mx-4"
            >
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                {lives > 0 ? 'Congratulations!' : 'Game Over!'}
              </h2>
              <div className="space-y-2 text-gray-600 dark:text-gray-300">
                <p>Final Score: <span className="font-bold text-purple-600">{score}</span></p>
                <p>Questions Answered: <span className="font-bold">{answeredQuizzes.size}/{deck.cards.length}</span></p>
                <p>Time: <span className="font-bold">{Math.floor(timeElapsed / 60)}:{(timeElapsed % 60).toString().padStart(2, '0')}</span></p>
                <p>Best Streak: <span className="font-bold">{streak}</span></p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}