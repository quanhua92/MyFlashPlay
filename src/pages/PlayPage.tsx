import { useParams, useSearch } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { Play, BookOpen, Zap, Target, Brain } from 'lucide-react';
import { motion } from 'framer-motion';
import { useDecks } from '@/hooks/useDecks';
import { StudyMode } from '@/components/game/StudyMode';
import { QuizMode } from '@/components/game/QuizMode';
import { SpeedChallenge } from '@/components/game/SpeedChallenge';
import { MemoryMatch } from '@/components/game/MemoryMatch';
import { AchievementNotification } from '@/components/ui/AchievementNotification';
import { achievementManager } from '@/utils/achievements';
import type { GameMode, GameSession, Achievement } from '@/types';

export function PlayPage() {
  const { deckId } = useParams({ from: '/play/$deckId' });
  const search = useSearch({ from: '/play/$deckId' });
  const [selectedMode, setSelectedMode] = useState<GameMode | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAchievement, setCurrentAchievement] = useState<Achievement | null>(null);
  
  const { getDeck } = useDecks();
  const deck = getDeck(deckId);

  // Auto-select mode from search params
  useEffect(() => {
    if (search?.mode && ['study', 'quiz', 'speed', 'memory'].includes(search.mode)) {
      setSelectedMode(search.mode as GameMode);
      if (deck) {
        setIsPlaying(true);
      }
    }
  }, [search?.mode, deck]);

  const handleGameComplete = (session: GameSession) => {
    console.log('Game completed:', session);
    
    // Check for achievements
    const newAchievements = achievementManager.checkAchievements(session);
    
    // Show achievement notification if any were unlocked
    if (newAchievements.length > 0) {
      setCurrentAchievement(newAchievements[0]); // Show first achievement
    }
    
    // Save session to localStorage
    const sessions = JSON.parse(localStorage.getItem('flashplay_sessions') || '[]');
    sessions.push(session);
    localStorage.setItem('flashplay_sessions', JSON.stringify(sessions));
    
    setIsPlaying(false);
    setSelectedMode(null);
  };

  const startGame = () => {
    if (selectedMode && deck) {
      setIsPlaying(true);
    }
  };

  if (!deck) {
    return (
      <div className="text-center py-16">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Deck not found
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          The flashcard deck you're looking for doesn't exist.
        </p>
      </div>
    );
  }

  // Render game interface
  if (isPlaying && selectedMode) {
    if (selectedMode === 'study') {
      return <StudyMode deck={deck} onComplete={handleGameComplete} />;
    }
    if (selectedMode === 'quiz') {
      return <QuizMode deck={deck} onComplete={handleGameComplete} />;
    }
    if (selectedMode === 'speed') {
      return <SpeedChallenge deck={deck} timeLimit={60} onComplete={handleGameComplete} />;
    }
    if (selectedMode === 'memory') {
      return <MemoryMatch deck={deck} difficulty="easy" onComplete={handleGameComplete} />;
    }
  }

  const gameModes = [
    {
      id: 'study',
      name: 'Study Mode',
      description: 'Learn at your own pace with card flips',
      icon: BookOpen,
      color: 'from-blue-500 to-cyan-500'
    },
    {
      id: 'quiz',
      name: 'Quiz Mode',
      description: 'Test your knowledge with multiple choice',
      icon: Target,
      color: 'from-green-500 to-emerald-500'
    },
    {
      id: 'speed',
      name: 'Speed Challenge',
      description: 'Race against time for bonus points',
      icon: Zap,
      color: 'from-yellow-500 to-orange-500'
    },
    {
      id: 'memory',
      name: 'Memory Match',
      description: 'Match questions with their answers',
      icon: Brain,
      color: 'from-purple-500 to-pink-500'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Achievement Notification */}
      <AchievementNotification
        achievement={currentAchievement}
        onClose={() => setCurrentAchievement(null)}
      />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Deck Info */}
        <div className="text-center mb-12">
          <div className="text-6xl mb-4">{deck.emoji}</div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            {deck.name}
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-6">
            {deck.description}
          </p>
          <div className="flex justify-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
            <span>{deck.cards.length} cards</span>
            <span>~{deck.metadata.estimatedTime} minutes</span>
            <span>{deck.metadata.difficulty} level</span>
          </div>
        </div>

        {/* Game Mode Selection */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-8">
            Choose Your Game Mode
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            {gameModes.map((mode, index) => (
              <motion.button
                key={mode.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 * index }}
                onClick={() => setSelectedMode(mode.id as GameMode)}
                className={`p-6 rounded-xl border-2 transition-all duration-200 hover:scale-105 ${
                  selectedMode === mode.id
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r ${mode.color} flex items-center justify-center`}>
                  <mode.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {mode.name}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  {mode.description}
                </p>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Start Button */}
        {selectedMode && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-center"
          >
            <button 
              onClick={startGame}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center space-x-2 mx-auto"
            >
              <Play className="w-5 h-5" />
              <span>Start {gameModes.find(m => m.id === selectedMode)?.name}</span>
            </button>
          </motion.div>
        )}

        {/* Deck Preview */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16"
        >
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            Deck Preview
          </h3>
          <div className="grid gap-4 max-h-96 overflow-y-auto">
            {deck.cards.slice(0, 3).map((card) => (
              <div
                key={card.id}
                className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
              >
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  {card.type} • {card.category || 'No category'}
                </div>
                <div className="font-medium text-gray-900 dark:text-white">
                  <div dangerouslySetInnerHTML={{ __html: card.front }} />
                </div>
              </div>
            ))}
            {deck.cards.length > 3 && (
              <div className="text-center text-gray-500 dark:text-gray-400 py-4">
                ... and {deck.cards.length - 3} more cards
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}