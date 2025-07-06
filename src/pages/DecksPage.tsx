import { BookOpen, Play, Settings, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from '@tanstack/react-router';
import { useDecks } from '@/hooks/useDecks';

export function DecksPage() {
  const { decks, isLoading, deleteDeck } = useDecks();

  if (isLoading) {
    return (
      <div className="text-center py-16">
        <div className="animate-spin w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-300">Loading your decks...</p>
      </div>
    );
  }
  return (
    <div className="max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            My Flashcard Decks
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Manage and play your flashcard collections
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {decks.map((deck, index) => (
            <motion.div
              key={deck.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 * index }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <span className="text-3xl">{deck.emoji}</span>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      {deck.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {deck.cards.length} cards
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                    <Settings className="w-4 h-4" />
                  </button>
                  <button 
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    onClick={() => {
                      if (confirm(`Are you sure you want to delete "${deck.name}"?`)) {
                        deleteDeck(deck.id);
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">
                {deck.description}
              </p>

              <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 mb-4">
                <span>Played {deck.metadata.playCount} times</span>
                <span>{deck.metadata.estimatedTime} min</span>
              </div>

              <div className="flex gap-2">
                <Link
                  to="/play/$deckId"
                  params={{ deckId: deck.id }}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-center py-2 px-4 rounded-lg font-medium hover:shadow-md transition-shadow flex items-center justify-center space-x-2"
                >
                  <Play className="w-4 h-4" />
                  <span>Play</span>
                </Link>
                <Link
                  to="/play/$deckId"
                  params={{ deckId: deck.id }}
                  search={{ mode: 'study' }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors inline-flex items-center"
                >
                  <BookOpen className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}