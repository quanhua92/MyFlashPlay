import { motion } from 'framer-motion';
import { useDecks } from '@/hooks/useDecks';
import { DeckCard } from '@/components/decks/DeckCard';

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
            <DeckCard
              key={deck.id}
              deck={deck}
              index={index}
              onDelete={deleteDeck}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}