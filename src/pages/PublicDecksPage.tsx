import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Globe, Download, Play, Copy, ExternalLink, Filter, Star } from 'lucide-react';
import { publicMarkdownDecks, getPublicDecksByTag, getPublicDecksByDifficulty, generatePublicDeckUrl } from '@/data/public-decks';
import { markdownStorage } from '@/utils/markdown-storage';
import { markdownProcessor } from '@/utils/markdown';
import { v4 as uuidv4 } from 'uuid';
import { useNavigate } from '@tanstack/react-router';

type FilterType = 'all' | 'easy' | 'medium' | 'hard' | 'english-vietnamese';

export function PublicDecksPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [saveStatus, setSaveStatus] = useState<{ [key: string]: 'idle' | 'saving' | 'saved' | 'error' }>({});
  const navigate = useNavigate();

  // Filter decks based on search term and filter
  const filteredDecks = publicMarkdownDecks.filter(deck => {
    const matchesSearch = deck.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         deck.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         deck.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (!matchesSearch) return false;

    switch (filter) {
      case 'easy':
      case 'medium':
      case 'hard':
        return deck.difficulty === filter;
      case 'english-vietnamese':
        return deck.tags?.includes('english') && deck.tags?.includes('vietnamese');
      default:
        return true;
    }
  });

  // Save deck as copy to user's collection
  const handleSaveAsCopy = async (publicDeck: typeof publicMarkdownDecks[0]) => {
    try {
      setSaveStatus(prev => ({ ...prev, [publicDeck.id]: 'saving' }));

      // Parse the markdown to validate it
      const parseResult = markdownProcessor.parse(publicDeck.markdown);
      if (parseResult.errors.length > 0 || parseResult.cards.length === 0) {
        throw new Error('Invalid deck format');
      }

      // Create a new deck with unique ID
      const newDeckId = uuidv4();
      const deckName = `${publicDeck.name} (Copy)`;
      
      // Save the markdown content
      const saveResult = markdownStorage.saveDeckFromMarkdown(publicDeck.markdown, deckName);
      
      if (!saveResult.success) {
        throw new Error(saveResult.error || 'Failed to save deck');
      }

      setSaveStatus(prev => ({ ...prev, [publicDeck.id]: 'saved' }));
      
      // Reset status after 3 seconds
      setTimeout(() => {
        setSaveStatus(prev => ({ ...prev, [publicDeck.id]: 'idle' }));
      }, 3000);

    } catch (error) {
      console.error('Failed to save deck:', error);
      setSaveStatus(prev => ({ ...prev, [publicDeck.id]: 'error' }));
      
      // Reset status after 3 seconds
      setTimeout(() => {
        setSaveStatus(prev => ({ ...prev, [publicDeck.id]: 'idle' }));
      }, 3000);
    }
  };

  // Download deck as markdown file
  const handleDownload = (deck: typeof publicMarkdownDecks[0]) => {
    const blob = new Blob([deck.markdown], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${deck.name.replace(/[^a-zA-Z0-9]/g, '-')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Play deck directly
  const handlePlay = (deck: typeof publicMarkdownDecks[0]) => {
    // Save temporarily and navigate to play
    const tempId = `temp-${deck.id}`;
    const parseResult = markdownProcessor.parse(deck.markdown);
    
    if (parseResult.errors.length === 0 && parseResult.cards.length > 0) {
      // Create temporary deck for playing with proper structure
      const tempDeck = {
        id: tempId,
        name: deck.name,
        description: deck.description,
        emoji: '🌟',
        cards: parseResult.cards,
        metadata: {
          createdAt: new Date().toISOString(),
          lastModified: new Date().toISOString(),
          playCount: 0,
          source: 'template' as const,
          originalMarkdown: deck.markdown,
          tags: [],
          difficulty: 'beginner' as const,
          estimatedTime: Math.ceil(parseResult.cards.length / 2) // 2 cards per minute estimate
        },
        settings: {
          shuffleCards: false,
          repeatIncorrect: true,
          studyMode: 'sequential' as const
        }
      };
      
      // Store temporarily in sessionStorage for immediate play
      sessionStorage.setItem(`temp_deck_${tempId}`, JSON.stringify(tempDeck));
      
      // Navigate to play page
      navigate({ to: '/play-public', search: { deck: tempId, source: 'temp' } });
    }
  };

  // Copy share link
  const handleCopyLink = async (deckId: string) => {
    const url = generatePublicDeckUrl(deckId);
    try {
      await navigator.clipboard.writeText(url);
      // Could add a toast notification here
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30';
      case 'medium': return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30';
      case 'hard': return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30';
      default: return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700';
    }
  };

  const getButtonStatus = (deckId: string) => {
    const status = saveStatus[deckId] || 'idle';
    switch (status) {
      case 'saving': return { text: 'Saving...', disabled: true, className: 'bg-blue-500' };
      case 'saved': return { text: 'Saved!', disabled: true, className: 'bg-green-500' };
      case 'error': return { text: 'Error', disabled: false, className: 'bg-red-500' };
      default: return { text: 'Save as Copy', disabled: false, className: 'bg-purple-600 hover:bg-purple-700' };
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.h1 
            className="text-4xl font-bold text-gray-900 dark:text-white mb-4 flex items-center justify-center gap-3"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Globe className="w-10 h-10 text-purple-600" />
            Public Decks
          </motion.h1>
          <motion.p 
            className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            Discover and learn from our curated collection of English-Vietnamese vocabulary decks
          </motion.p>
        </div>

        {/* Search and Filter Bar */}
        <motion.div 
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search decks by name, description, or tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as FilterType)}
                className="pl-10 pr-8 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">All Decks</option>
                <option value="english-vietnamese">🇺🇸🇻🇳 English-Vietnamese</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-4 text-sm text-gray-600 dark:text-gray-300">
            Showing {filteredDecks.length} of {publicMarkdownDecks.length} decks
            {filter === 'english-vietnamese' && (
              <span className="ml-2 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs">
                English Learning Focus
              </span>
            )}
          </div>
        </motion.div>

        {/* Deck Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDecks.map((deck, index) => {
            const cardCount = deck.markdown.split('::').length - 1;
            const buttonStatus = getButtonStatus(deck.id);
            
            return (
              <motion.div
                key={deck.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
              >
                {/* Header */}
                <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white line-clamp-2">
                      {deck.name}
                    </h3>
                    {deck.tags?.includes('english') && deck.tags?.includes('vietnamese') && (
                      <Star className="w-5 h-5 text-yellow-500 flex-shrink-0 ml-2" />
                    )}
                  </div>
                  
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-2">
                    {deck.description}
                  </p>

                  {/* Tags and Info */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(deck.difficulty)}`}>
                        {deck.difficulty}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {cardCount} cards
                      </span>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      by {deck.author}
                    </span>
                  </div>

                  {/* Tags */}
                  {deck.tags && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {deck.tags.slice(0, 3).map(tag => (
                        <span 
                          key={tag}
                          className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-xs"
                        >
                          #{tag}
                        </span>
                      ))}
                      {deck.tags.length > 3 && (
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          +{deck.tags.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="p-6 space-y-3">
                  {/* Primary Action - Save as Copy */}
                  <button
                    onClick={() => handleSaveAsCopy(deck)}
                    disabled={buttonStatus.disabled}
                    className={`w-full flex items-center justify-center space-x-2 py-3 px-4 text-white font-semibold rounded-lg transition-colors ${buttonStatus.className}`}
                  >
                    <Copy className="w-5 h-5" />
                    <span>{buttonStatus.text}</span>
                  </button>

                  {/* Secondary Actions */}
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => handlePlay(deck)}
                      className="flex items-center justify-center space-x-1 py-2 px-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
                      title="Play Now"
                    >
                      <Play className="w-4 h-4" />
                      <span className="text-sm">Play</span>
                    </button>

                    <button
                      onClick={() => handleDownload(deck)}
                      className="flex items-center justify-center space-x-1 py-2 px-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
                      title="Download Markdown"
                    >
                      <Download className="w-4 h-4" />
                      <span className="text-sm">Download</span>
                    </button>

                    <button
                      onClick={() => handleCopyLink(deck.id)}
                      className="flex items-center justify-center space-x-1 py-2 px-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
                      title="Copy Share Link"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span className="text-sm">Share</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredDecks.length === 0 && (
          <motion.div
            className="text-center py-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Globe className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">No decks found</h3>
            <p className="text-gray-500 dark:text-gray-500">
              Try adjusting your search terms or filters to find more decks.
            </p>
          </motion.div>
        )}

        {/* Info Footer */}
        <motion.div
          className="mt-12 text-center text-gray-500 dark:text-gray-400 text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <p>All public decks are free to use and created by the MyFlashPlay community.</p>
          <p className="mt-1">Save any deck to your collection and start learning immediately!</p>
        </motion.div>
      </div>
    </div>
  );
}