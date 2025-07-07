import { motion } from 'framer-motion';
import { Download, Upload, Info } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { useDecks } from '@/hooks/useDecks';
import { DeckCard } from '@/components/decks/DeckCard';
import { useTranslation } from '@/i18n';

export function DecksPage() {
  const t = useTranslation();
  const { decks, isLoading, deleteDeck } = useDecks();

  if (isLoading) {
    return (
      <div className="text-center py-16">
        <div className="animate-spin w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-300">{t('decks.loadingDecks', 'Loading your decks...')}</p>
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
            {t('decks.myDecksTitle')}
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-6">
            {t('decks.subtitle', 'Manage and play your flashcard collections')}
          </p>
          
          {/* Export/Import Notice */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 max-w-2xl mx-auto">
            <div className="flex items-start space-x-3">
              <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-left">
                <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                  {t('decks.exportImportTitle', 'Export & Import Your Decks')}
                </h3>
                <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                  {t('decks.exportImportDescription', 'Want to backup your decks or share them? You can export and import your flashcard collections.')}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Link 
                    to="/settings"
                    className="inline-flex items-center space-x-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>{t('decks.exportDecks', 'Export Decks')}</span>
                  </Link>
                  <Link 
                    to="/settings"
                    className="inline-flex items-center space-x-2 px-3 py-1.5 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    <span>{t('decks.importDecks', 'Import Decks')}</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
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