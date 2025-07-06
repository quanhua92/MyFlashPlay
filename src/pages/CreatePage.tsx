import { useState } from 'react';
import { Upload, FileText, Wand2, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from '@tanstack/react-router';
import { v4 as uuidv4 } from 'uuid';
import { MarkdownParser } from '@/utils/markdown-parser';
import { sampleMarkdown } from '@/data/sample-decks';
import { useDecks } from '@/hooks/useDecks';
import type { Deck } from '@/types';

export function CreatePage() {
  const [markdown, setMarkdown] = useState(sampleMarkdown);
  const [deckName, setDeckName] = useState('My Custom Deck');
  const [description, setDescription] = useState('Created from Markdown');
  const [emoji, setEmoji] = useState('📚');
  const [isCreating, setIsCreating] = useState(false);
  const [isCreated, setIsCreated] = useState(false);
  
  const navigate = useNavigate();
  const { addDeck } = useDecks();
  const parser = new MarkdownParser();
  const parsedCards = markdown ? parser.parse(markdown) : [];

  const handleCreateDeck = async () => {
    if (parsedCards.length === 0) return;
    
    setIsCreating(true);
    
    // Create new deck
    const newDeck: Deck = {
      id: uuidv4(),
      name: deckName,
      description,
      emoji,
      cards: parsedCards,
      metadata: {
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        playCount: 0,
        source: 'created',
        originalMarkdown: markdown,
        tags: [],
        difficulty: 'beginner',
        estimatedTime: Math.ceil(parsedCards.length / 10) * 5 // Rough estimate
      },
      settings: {
        shuffleCards: true,
        repeatIncorrect: true,
        studyMode: 'random'
      }
    };

    // Add to storage
    addDeck(newDeck);
    
    setIsCreating(false);
    setIsCreated(true);
    
    // Redirect after a short delay
    setTimeout(() => {
      navigate({ to: '/play/$deckId', params: { deckId: newDeck.id } });
    }, 1500);
  };

  const loadTemplate = () => {
    setMarkdown(sampleMarkdown);
    setDeckName('Elementary Math');
    setDescription('Basic math problems for kids');
    setEmoji('🔢');
  };

  return (
    <div className="max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Create Flashcards
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Paste your Markdown content and watch it transform into interactive flashcards!
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="space-y-6">
            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Emoji
                </label>
                <input
                  type="text"
                  value={emoji}
                  onChange={(e) => setEmoji(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-center text-2xl"
                  placeholder="📚"
                  maxLength={2}
                />
              </div>
              <div className="col-span-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Deck Name
                </label>
                <input
                  type="text"
                  value={deckName}
                  onChange={(e) => setDeckName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="Enter deck name"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                placeholder="Enter deck description"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Markdown Content
              </label>
              <textarea
                value={markdown}
                onChange={(e) => setMarkdown(e.target.value)}
                className="w-full h-96 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-sm"
                placeholder="Paste your Markdown content here..."
              />
            </div>

            <div className="flex gap-4">
              <button 
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = '.md,.txt';
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (e) => {
                        const content = e.target?.result as string;
                        setMarkdown(content);
                      };
                      reader.readAsText(file);
                    }
                  };
                  input.click();
                }}
              >
                <Upload className="w-4 h-4" />
                <span>Upload File</span>
              </button>
              <button 
                className="flex items-center space-x-2 px-4 py-2 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors"
                onClick={loadTemplate}
              >
                <Wand2 className="w-4 h-4" />
                <span>Use Template</span>
              </button>
            </div>
          </div>

          {/* Preview Section */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Preview ({parsedCards.length} cards)
              </h3>
              
              {parsedCards.length > 0 ? (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {parsedCards.slice(0, 5).map((card, index) => (
                    <div
                      key={card.id}
                      className="border border-gray-200 dark:border-gray-600 rounded-lg p-4"
                    >
                      <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                        Card {index + 1} • {card.type} • {card.category || 'No category'}
                      </div>
                      <div className="font-medium text-gray-900 dark:text-white mb-2">
                        <div dangerouslySetInnerHTML={{ __html: card.front }} />
                      </div>
                      <div className="text-gray-600 dark:text-gray-300">
                        <div dangerouslySetInnerHTML={{ __html: card.back }} />
                      </div>
                    </div>
                  ))}
                  {parsedCards.length > 5 && (
                    <div className="text-center text-gray-500 dark:text-gray-400">
                      ... and {parsedCards.length - 5} more cards
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                  Start typing Markdown to see your flashcards appear here!
                </div>
              )}
            </div>

            {parsedCards.length > 0 && (
              <motion.button 
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-6 rounded-lg font-semibold hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                onClick={handleCreateDeck}
                disabled={isCreating || !deckName.trim()}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isCreating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Creating...</span>
                  </>
                ) : isCreated ? (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    <span>Created! Redirecting...</span>
                  </>
                ) : (
                  <span>Create Deck ({parsedCards.length} cards)</span>
                )}
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}