import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Play, BookOpen, Zap, Target, Brain, Layers, ArrowLeft, Edit, Trash2, Download, Share2, Calendar, Tag, Clock, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { StudyMode } from '@/components/game/StudyMode';
import { QuizMode } from '@/components/game/QuizMode';
import { SpeedChallenge } from '@/components/game/SpeedChallenge';
import { MemoryMatch } from '@/components/game/MemoryMatch';
import { FallingQuizMode } from '@/components/game/FallingQuizMode';
import { SafeContentRenderer } from '@/components/common/SafeContentRenderer';
import { useDecks } from '@/hooks/useDecks';
import type { GameMode, GameSession, Deck } from '@/types';

function DeckDetailPage() {
  const { deckId } = Route.useParams();
  const navigate = useNavigate();
  const { decks, deleteDeck, isLoading } = useDecks();
  const [selectedMode, setSelectedMode] = useState<GameMode | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [deck, setDeck] = useState<Deck | null>(null);

  // Find the deck by ID
  useEffect(() => {
    const foundDeck = decks.find(d => d.id === deckId);
    if (foundDeck) {
      setDeck(foundDeck);
    } else if (!isLoading) {
      navigate({ to: '/decks' });
    }
  }, [deckId, decks, isLoading, navigate]);

  const handleGameComplete = (session: GameSession) => {
    console.log('Game completed:', session);
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

  const handleBackToDecks = () => {
    navigate({ to: '/decks' });
  };

  const handleEdit = () => {
    navigate({ to: '/edit/$deckId', params: { deckId: deck!.id } });
  };

  const handleDelete = async () => {
    if (!deck) return;
    if (window.confirm(`Are you sure you want to delete "${deck.name}"? This action cannot be undone.`)) {
      await deleteDeck(deck.id);
      navigate({ to: '/decks' });
    }
  };

  const handleDownload = () => {
    if (!deck) return;
    const content = deck.cards.map(card => `${card.front} :: ${card.back}`).join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${deck.name.replace(/[^a-zA-Z0-9]/g, '-')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
          <p className="text-gray-600 dark:text-gray-300 mb-6">The requested deck could not be found in your collection.</p>
          <button
            onClick={handleBackToDecks}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Back to My Decks
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
            onClick={handleBackToDecks}
            className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to My Decks</span>
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
            
            {/* Deck Stats */}
            <motion.div 
              className="flex items-center justify-center space-x-6 text-sm text-gray-500 dark:text-gray-400"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center space-x-1">
                <BookOpen className="w-4 h-4" />
                <span>{deck.cards.length} cards</span>
              </div>
              {deck.createdAt && (
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>Created {new Date(deck.createdAt).toLocaleDateString()}</span>
                </div>
              )}
              {deck.tags && deck.tags.length > 0 && (
                <div className="flex items-center space-x-1">
                  <Tag className="w-4 h-4" />
                  <span>{deck.tags.length} tags</span>
                </div>
              )}
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              className="mt-6 flex items-center justify-center space-x-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <button
                onClick={handleEdit}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Edit className="w-4 h-4" />
                <span>Edit</span>
              </button>
              
              <button
                onClick={handleDownload}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </button>
              
              <button
                onClick={handleDelete}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
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

        {/* Tags Display */}
        {deck.tags && deck.tags.length > 0 && (
          <motion.div
            className="mt-12 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Tags</h3>
            <div className="flex flex-wrap justify-center gap-2">
              {deck.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export const Route = createFileRoute('/deck/$deckId')({
  component: DeckDetailPage,
});