import { useSearch, useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { Play, BookOpen, Zap, Target, Brain, Layers, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { StudyMode } from '@/components/game/StudyMode';
import { QuizMode } from '@/components/game/QuizMode';
import { SpeedChallenge } from '@/components/game/SpeedChallenge';
import { MemoryMatch } from '@/components/game/MemoryMatch';
import { FallingQuizMode } from '@/components/game/FallingQuizMode';
import { SafeContentRenderer } from '@/components/common/SafeContentRenderer';
import type { GameMode, GameSession, Deck } from '@/types';

export function PlayTempPage() {
  const search = useSearch({ from: '/play-public' });
  const navigate = useNavigate();
  const [selectedMode, setSelectedMode] = useState<GameMode | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [deck, setDeck] = useState<Deck | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load temporary deck
  useEffect(() => {
    if (search?.deck && search?.source === 'temp') {
      try {
        const tempDeckData = sessionStorage.getItem(`temp_deck_${search.deck}`);
        if (tempDeckData) {
          const tempDeck = JSON.parse(tempDeckData);
          setDeck(tempDeck);
        } else {
          console.error('Temporary deck not found');
          navigate({ to: '/public-decks' });
        }
      } catch (error) {
        console.error('Failed to load temporary deck:', error);
        navigate({ to: '/public-decks' });
      }
    } else {
      navigate({ to: '/public-decks' });
    }
    setIsLoading(false);
  }, [search, navigate]);

  // Auto-select mode from search params
  useEffect(() => {
    if (search?.mode && ['study', 'quiz', 'speed', 'memory', 'falling'].includes(search.mode)) {
      setSelectedMode(search.mode as GameMode);
      if (deck) {
        setIsPlaying(true);
      }
    }
  }, [search?.mode, deck]);

  const handleGameComplete = (session: GameSession) => {
    console.log('Temporary deck game completed:', session);
    
    // For temporary decks, we don't save sessions or check achievements
    // Just return to game mode selection
    setIsPlaying(false);
    setSelectedMode(null);
  };

  const handleStartGame = (mode: GameMode) => {
    setSelectedMode(mode);
    setIsPlaying(true);
  };

  const handleBackToModes = () => {
    setIsPlaying(false);
    setSelectedMode(null);
  };

  const handleBackToPublic = () => {
    // Clean up temporary deck
    if (search?.deck) {
      sessionStorage.removeItem(`temp_deck_${search.deck}`);
    }
    navigate({ to: '/public-decks' });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading deck...</p>
        </div>
      </div>
    );
  }

  if (!deck) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Deck Not Found</h2>
          <p className="text-gray-600 mb-6">The requested deck could not be loaded.</p>
          <button
            onClick={handleBackToPublic}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Back to Public Decks
          </button>
        </div>
      </div>
    );
  }

  // Render game mode
  function renderGameMode() {
    if (!deck || !selectedMode) return null;

    switch (selectedMode) {
      case 'study':
        return <StudyMode deck={deck} onComplete={handleGameComplete} />;
      case 'quiz':
        return <QuizMode deck={deck} onComplete={handleGameComplete} />;
      case 'speed':
        return <SpeedChallenge deck={deck} timeLimit={60} onComplete={handleGameComplete} />;
      case 'memory':
        return <MemoryMatch deck={deck} difficulty="easy" onComplete={handleGameComplete} />;
      case 'falling':
        return <FallingQuizMode deck={deck} onComplete={handleGameComplete} />;
      default:
        return null;
    }
  }

  if (isPlaying && selectedMode) {
    return (
      <div className="relative">
        {/* Back Button */}
        <button
          onClick={handleBackToModes}
          className="absolute top-4 left-4 z-50 flex items-center space-x-2 px-4 py-2 bg-white/90 hover:bg-white text-gray-700 rounded-lg shadow-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
        
        {renderGameMode()}
      </div>
    );
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
      description: 'Race against time in 60 seconds',
      icon: Zap,
      color: 'from-yellow-500 to-orange-500'
    },
    {
      id: 'memory',
      name: 'Memory Match',
      description: 'Match pairs of cards and terms',
      icon: Brain,
      color: 'from-pink-500 to-rose-500'
    },
    {
      id: 'falling',
      name: 'Falling Quiz',
      description: 'Catch the answers as they fall',
      icon: Layers,
      color: 'from-purple-500 to-violet-500'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={handleBackToPublic}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Public Decks</span>
          </button>
          
          <div className="text-center">
            <motion.h1 
              className="text-4xl font-bold text-gray-900 mb-2"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {deck.emoji} {deck.name}
            </motion.h1>
            <motion.p 
              className="text-gray-600 mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <SafeContentRenderer content={deck.description || ''} />
            </motion.p>
            <motion.p 
              className="text-sm text-gray-500"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {deck.cards.length} cards • Preview Mode
            </motion.p>
          </div>
        </div>

        {/* Game Mode Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {gameModes.map((mode, index) => (
            <motion.div
              key={mode.id}
              className="relative overflow-hidden rounded-xl shadow-lg cursor-pointer group"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleStartGame(mode.id as GameMode)}
            >
              <div className={`bg-gradient-to-br ${mode.color} p-6 text-white h-full`}>
                <div className="flex items-center justify-between mb-4">
                  <mode.icon className="w-8 h-8" />
                  <Play className="w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <h3 className="text-xl font-bold mb-2">{mode.name}</h3>
                <p className="text-white/90 text-sm">{mode.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Info */}
        <motion.div
          className="mt-12 text-center text-gray-500 text-sm max-w-2xl mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <p className="mb-2">🎯 This is a preview of a public deck.</p>
          <p>To save progress and track achievements, save this deck to your collection from the Public Decks page.</p>
        </motion.div>
      </div>
    </div>
  );
}