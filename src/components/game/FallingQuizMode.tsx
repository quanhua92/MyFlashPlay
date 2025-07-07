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
  laneSpan: number; // How many lanes this card spans (1-4)
  position: number; // 0 to 100 (percentage from top)
  speed: number;
  answers: string[];
  correctIndex: number;
  height: number; // Card height in vh units for collision detection
}

type Difficulty = 'easy' | 'medium' | 'hard';

interface FallingQuizModeProps {
  deck: Deck;
  difficulty?: Difficulty;
  onComplete?: (session: GameSession) => void;
}

export function FallingQuizMode({ deck, difficulty: initialDifficulty = 'easy', onComplete }: FallingQuizModeProps) {
  const [gameState, setGameState] = useState<'setup' | 'playing' | 'paused' | 'gameOver'>('setup');
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>(initialDifficulty);
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
  
  // Difficulty settings for kid-friendly gameplay
  const getDifficultySettings = (diff: Difficulty, gameLevel: number) => {
    const settings = {
      easy: {
        baseSpeed: 0.05,
        speedIncrement: 0.02,
        baseSpawnTime: 8000,
        spawnTimeReduction: 200,
        maxLevel: 1
      },
      medium: {
        baseSpeed: 0.1,
        speedIncrement: 0.05,
        baseSpawnTime: 6000,
        spawnTimeReduction: 300,
        maxLevel: 2
      },
      hard: {
        baseSpeed: 0.2,
        speedIncrement: 0.1,
        baseSpawnTime: 4000,
        spawnTimeReduction: 400,
        maxLevel: 3
      }
    };
    
    const config = settings[diff];
    return {
      speed: config.baseSpeed + (Math.min(gameLevel, config.maxLevel) * config.speedIncrement),
      spawnTime: Math.max(2000, config.baseSpawnTime - (Math.min(gameLevel, config.maxLevel) * config.spawnTimeReduction))
    };
  };

  // Check collision with existing quizzes
  const checkCollision = useCallback((lane: number, laneSpan: number, position: number, height: number) => {
    return fallingQuizzes.some(quiz => {
      // Check if lanes overlap
      const laneOverlap = (
        lane < quiz.lane + quiz.laneSpan && 
        lane + laneSpan > quiz.lane
      );
      
      // Check if positions overlap (with some buffer)
      const positionOverlap = (
        position < quiz.position + quiz.height + 5 && // 5vh buffer
        position + height + 5 > quiz.position
      );
      
      return laneOverlap && positionOverlap;
    });
  }, [fallingQuizzes]);

  // Generate quiz from card
  const generateQuiz = useCallback((card: Card, lane: number, laneSpan: number): FallingQuiz => {
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

    // Calculate estimated height based on content (larger for mobile)
    const baseHeight = 12; // Larger base card height in vh for mobile
    const answerHeight = answers.length * 3.5; // Each answer button adds ~3.5vh (larger buttons)
    const estimatedHeight = baseHeight + answerHeight;

    return {
      id: `quiz-${card.id}-${Date.now()}-${Math.random()}`,
      card,
      lane,
      laneSpan,
      position: 0,
      speed: getDifficultySettings(selectedDifficulty, difficultyRef.current).speed,
      answers: answers.slice(0, 4), // Max 4 answers
      correctIndex,
      height: estimatedHeight
    };
  }, [deck.cards, checkCollision]);

  // Spawn new quiz
  const spawnQuiz = useCallback(() => {
    if (answeredQuizzes.size >= deck.cards.length) return;

    const availableCards = deck.cards.filter(card => 
      !fallingQuizzes.some(quiz => quiz.card.id === card.id) &&
      !answeredQuizzes.has(card.id)
    );

    if (availableCards.length === 0) return;

    const randomCard = availableCards[Math.floor(Math.random() * availableCards.length)];
    
    // Determine card span based on difficulty and content
    let laneSpan = 2; // Default span of 2 lanes
    if (selectedDifficulty === 'easy') {
      laneSpan = Math.random() < 0.7 ? 3 : 2; // 70% chance of 3-lane span in easy mode
    } else if (selectedDifficulty === 'hard') {
      laneSpan = Math.random() < 0.5 ? 1 : 2; // 50% chance of 1-lane span in hard mode
    }
    
    // Try to find a valid position without collision
    let attempts = 0;
    let foundPosition = false;
    let lane = 0;
    
    while (attempts < 20 && !foundPosition) {
      lane = Math.floor(Math.random() * (12 - laneSpan + 1)); // Ensure card fits within 12 lanes
      
      // Check if this position would cause collision
      if (!checkCollision(lane, laneSpan, 0, 20)) { // Assume 20vh height for initial check (larger cards)
        foundPosition = true;
      }
      attempts++;
    }
    
    // If no collision-free position found, use a random lane anyway (fallback)
    if (!foundPosition) {
      lane = Math.floor(Math.random() * (12 - laneSpan + 1));
    }
    
    const newQuiz = generateQuiz(randomCard, lane, laneSpan);
    setFallingQuizzes(prev => [...prev, newQuiz]);
  }, [deck.cards, fallingQuizzes, answeredQuizzes, generateQuiz, selectedDifficulty, checkCollision]);

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
    const { spawnTime } = getDifficultySettings(selectedDifficulty, difficultyRef.current);
    if (spawnTimerRef.current > spawnTime) {
      spawnQuiz();
      spawnTimerRef.current = 0;
    }

    // Update difficulty
    const timeInSeconds = (now - startTimeRef.current) / 1000;
    // Slower progression for easier difficulties
    const progressionTime = selectedDifficulty === 'easy' ? 120 : selectedDifficulty === 'medium' ? 90 : 60;
    const maxLevel = selectedDifficulty === 'easy' ? 1 : selectedDifficulty === 'medium' ? 2 : 3;
    difficultyRef.current = Math.min(maxLevel, 1 + Math.floor(timeInSeconds / progressionTime));

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
          difficulty: selectedDifficulty,
          hintsUsed: 0
        }
      };
      
      if (onComplete) {
        onComplete(session);
      }
    }
  }, [fallingQuizzes, streak, answeredQuizzes, deck, score, timeElapsed, onComplete]);

  // Setup screen
  if (gameState === 'setup') {
    return (
      <div className="h-screen bg-gradient-to-b from-blue-400 via-purple-500 to-pink-500 flex items-center justify-center">
        <div className="bg-white/90 rounded-xl p-8 shadow-2xl max-w-md w-full mx-4">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Choose Difficulty</h2>
          
          <div className="space-y-4 mb-6">
            {[
              { 
                value: 'easy' as Difficulty, 
                label: 'Easy', 
                description: 'Perfect for kids - Very slow falling speed',
                icon: '🐌',
                color: 'from-green-400 to-green-600'
              },
              { 
                value: 'medium' as Difficulty, 
                label: 'Medium', 
                description: 'Moderate speed for learning',
                icon: '🚶',
                color: 'from-yellow-400 to-orange-500'
              },
              { 
                value: 'hard' as Difficulty, 
                label: 'Hard', 
                description: 'Fast-paced challenge',
                icon: '🏃',
                color: 'from-red-400 to-red-600'
              }
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setSelectedDifficulty(option.value)}
                className={`w-full p-4 rounded-lg border-2 transition-all ${
                  selectedDifficulty === option.value
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{option.icon}</span>
                  <div className="text-left flex-1">
                    <div className="font-semibold text-gray-800">{option.label}</div>
                    <div className="text-sm text-gray-600">{option.description}</div>
                  </div>
                  {selectedDifficulty === option.value && (
                    <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
          
          <button
            onClick={() => setGameState('playing')}
            className="w-full py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all"
          >
            Start Game
          </button>
        </div>
      </div>
    );
  }

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
      <div className="flex h-full relative">
        {/* Twelve Lanes Grid */}
        <div className="w-full grid grid-cols-12 h-full">
          {Array.from({ length: 12 }, (_, laneIndex) => (
            <div key={laneIndex} className="relative border-r border-white/10 last:border-r-0">
            </div>
          ))}
        </div>
        
        {/* Falling Quizzes - Positioned Absolutely */}
        <div className="absolute inset-0 pointer-events-none">
          <AnimatePresence>
            {fallingQuizzes.map(quiz => (
              <motion.div
                key={quiz.id}
                initial={{ y: -100, opacity: 0 }}
                animate={{ 
                  y: `${quiz.position}vh`,
                  opacity: 1
                }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: 'linear', duration: 0.1 }}
                className="absolute bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-4 pointer-events-auto border-2 border-white/20"
                style={{ 
                  top: 0,
                  left: `${(quiz.lane / 12) * 100}%`,
                  width: `${(quiz.laneSpan / 12) * 100 - 0.5}%`, // -0.5% for minimal separation
                  minWidth: '160px', // Larger minimum width for mobile
                  minHeight: '120px', // Ensure minimum touch target height
                  zIndex: 10
                }}
              >
                {/* Question */}
                <div className="text-base font-semibold text-gray-900 dark:text-white mb-3 text-center leading-tight">
                  <SafeContentRenderer content={quiz.card.front} />
                </div>
                
                {/* Answer Buttons */}
                <div className={`grid gap-2 ${quiz.laneSpan >= 3 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                  {quiz.answers.map((answer, index) => (
                    <button
                      key={index}
                      onClick={() => handleAnswer(quiz.id, index)}
                      className="px-3 py-2.5 text-sm bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors font-medium active:scale-95 active:bg-purple-300 dark:active:bg-purple-700 min-h-[40px] flex items-center justify-center"
                    >
                      <span className="text-center leading-tight">{answer}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
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