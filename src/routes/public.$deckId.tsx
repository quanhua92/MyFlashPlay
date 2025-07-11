import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Play, BookOpen, Zap, Target, Brain, Layers, ArrowLeft, Copy, Check, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { StudyMode } from '@/components/game/StudyMode';
import { QuizMode } from '@/components/game/QuizMode';
import { SpeedChallenge } from '@/components/game/SpeedChallenge';
import { MemoryMatch } from '@/components/game/MemoryMatch';
import { FallingQuizMode } from '@/components/game/FallingQuizMode';
import { SafeContentRenderer } from '@/components/common/SafeContentRenderer';
import { getPublicDeck } from '@/data/public-decks';
import { markdownProcessor } from '@/utils/markdown';
import { markdownStorage } from '@/utils/markdown-storage';
import { v4 as uuidv4 } from 'uuid';
import type { GameMode, GameSession, Deck } from '@/types';

function PublicDeckPlayPage() {
  const { deckId } = Route.useParams();
  const navigate = useNavigate();
  const [selectedMode, setSelectedMode] = useState<GameMode | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [deck, setDeck] = useState<Deck | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [publicDeckData, setPublicDeckData] = useState<any>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Load public deck
  useEffect(() => {
    const loadDeck = async () => {
      try {
        const publicDeck = getPublicDeck(deckId);
        if (publicDeck) {
          setPublicDeckData(publicDeck);
          // Ensure markdown property exists and is a string
          const markdownContent = publicDeck.markdown || '';
          const result = markdownProcessor.parse(markdownContent);
          const cards = result.cards;
          const processedDeck: Deck = {
            id: publicDeck.id,
            name: publicDeck.name,
            description: publicDeck.description,
            emoji: publicDeck.name.split(' ')[0] || '📚',
            cards,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            tags: publicDeck.tags || []
          };
          setDeck(processedDeck);
        } else {
          console.error('Public deck not found:', deckId);
          navigate({ to: '/public-decks' });
        }
      } catch (error) {
        console.error('Failed to load public deck:', error);
        navigate({ to: '/public-decks' });
      } finally {
        setIsLoading(false);
      }
    };

    loadDeck();
  }, [deckId, navigate]);

  const handleGameComplete = (session: GameSession) => {
    console.log('Public deck game completed:', session);
    
    // For public decks, we don't save sessions or check achievements
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
    navigate({ to: '/public-decks' });
  };

  // Save deck as copy to user's collection
  const handleSaveAsCopy = async () => {
    if (!publicDeckData) return;
    
    try {
      setSaveStatus('saving');

      // Parse the markdown to validate it
      const parseResult = markdownProcessor.parse(publicDeckData.markdown);
      if (parseResult.errors.length > 0 || parseResult.cards.length === 0) {
        throw new Error('Invalid deck format');
      }

      // Create a new deck with unique ID
      const deckName = `${publicDeckData.name} (Copy)`;
      
      // Save the markdown content
      const saveResult = markdownStorage.saveDeckFromMarkdown(publicDeckData.markdown, deckName);
      
      if (!saveResult.success) {
        throw new Error(saveResult.error || 'Failed to save deck');
      }

      setSaveStatus('saved');
      
      // Reset status after 3 seconds
      setTimeout(() => {
        setSaveStatus('idle');
      }, 3000);

    } catch (error) {
      console.error('Failed to save deck:', error);
      setSaveStatus('error');
      
      // Reset status after 3 seconds
      setTimeout(() => {
        setSaveStatus('idle');
      }, 3000);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading deck...</p>
        </div>
      </div>
    );
  }

  if (!deck) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Deck Not Found</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">The requested deck could not be loaded.</p>
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
          className="absolute top-4 left-4 z-50 flex items-center space-x-2 px-4 py-2 bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-lg shadow-lg transition-colors"
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
    <div className="bg-gray-50 dark:bg-gray-950 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={handleBackToPublic}
            className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Public Decks</span>
          </button>
          
          <div className="text-center">
            <motion.h1 
              className="text-4xl font-bold text-gray-900 dark:text-white mb-2"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {deck.emoji} {deck.name}
            </motion.h1>
            <motion.p 
              className="text-gray-600 dark:text-gray-300 mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <SafeContentRenderer content={deck.description || ''} />
            </motion.p>
            <motion.p 
              className="text-sm text-gray-500 dark:text-gray-400"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {deck.cards.length} cards • Public Deck
            </motion.p>
            
            {/* Save As Copy Button */}
            <motion.div
              className="mt-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <button
                onClick={handleSaveAsCopy}
                disabled={saveStatus !== 'idle'}
                className={`inline-flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                  saveStatus === 'idle' ? 'bg-purple-600 hover:bg-purple-700 text-white' :
                  saveStatus === 'saving' ? 'bg-blue-500 text-white cursor-not-allowed' :
                  saveStatus === 'saved' ? 'bg-green-500 text-white cursor-not-allowed' :
                  'bg-red-500 text-white cursor-not-allowed'
                }`}
              >
                {saveStatus === 'saving' && (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Saving...</span>
                  </>
                )}
                {saveStatus === 'saved' && (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Saved to Collection!</span>
                  </>
                )}
                {saveStatus === 'error' && (
                  <>
                    <X className="w-4 h-4" />
                    <span>Failed to Save</span>
                  </>
                )}
                {saveStatus === 'idle' && (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Save as Copy</span>
                  </>
                )}
              </button>
            </motion.div>
          </div>
        </div>

        {/* Game Mode Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {gameModes.map((mode, index) => (
            <motion.div
              key={mode.id}
              className="relative overflow-hidden rounded-xl shadow-lg cursor-pointer group bg-white dark:bg-gray-800"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleStartGame(mode.id as GameMode)}
            >
              <div className={`p-6 text-white h-full bg-gradient-to-br ${mode.color}`}>
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
          className="mt-12 text-center text-gray-500 dark:text-gray-400 text-sm max-w-2xl mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <p className="mb-2">🎯 This is a public deck preview.</p>
          <p>To save progress and track achievements, save this deck to your collection from the Public Decks page.</p>
        </motion.div>
      </div>
    </div>
  );
}

export const Route = createFileRoute('/public/$deckId')({
  component: PublicDeckPlayPage,
});