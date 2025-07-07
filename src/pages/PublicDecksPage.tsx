import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Globe, Download, Play, Copy, ExternalLink, Filter, Star, Heart, X, Check, Share2 } from 'lucide-react';
import { publicMarkdownDecks, getPublicDecksByTag, getPublicDecksByDifficulty, generatePublicDeckUrl } from '@/data/public-decks';
import { markdownStorage } from '@/utils/markdown-storage';
import { markdownProcessor } from '@/utils/markdown';
import { v4 as uuidv4 } from 'uuid';
import { useNavigate } from '@tanstack/react-router';
import { useLocalStorage } from '@/hooks/useLocalStorage';

type FilterType = 'all' | 'easy' | 'medium' | 'hard' | 'english-vietnamese';
type StarFilter = 'all' | 'starred' | 'unstarred';

export function PublicDecksPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [starFilter, setStarFilter] = useState<StarFilter>('all');
  const [saveStatus, setSaveStatus] = useState<{ [key: string]: 'idle' | 'saving' | 'saved' | 'error' }>({});
  const [starredDecks, setStarredDecks] = useLocalStorage<string[]>('starred_public_decks', []);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [shareDeckName, setShareDeckName] = useState('');
  const [urlCopied, setUrlCopied] = useState(false);
  const navigate = useNavigate();

  // Helper functions for starring
  const isStarred = (deckId: string) => starredDecks.includes(deckId);
  
  const toggleStar = (deckId: string) => {
    setStarredDecks(prev => 
      prev.includes(deckId) 
        ? prev.filter(id => id !== deckId)
        : [...prev, deckId]
    );
  };

  // Filter decks based on search term, filter, and star filter
  const filteredDecks = publicMarkdownDecks.filter(deck => {
    const matchesSearch = deck.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         deck.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         deck.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (!matchesSearch) return false;

    // Star filter
    switch (starFilter) {
      case 'starred':
        if (!isStarred(deck.id)) return false;
        break;
      case 'unstarred':
        if (isStarred(deck.id)) return false;
        break;
    }

    // Difficulty and tag filter
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

  // Open share dialog
  const handleOpenShareDialog = (deck: typeof publicMarkdownDecks[0]) => {
    const url = generatePublicDeckUrl(deck.id);
    setShareUrl(url);
    setShareDeckName(deck.name);
    setShareDialogOpen(true);
    setUrlCopied(false);
  };

  // Copy share link
  const handleCopyShareUrl = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setUrlCopied(true);
      setTimeout(() => setUrlCopied(false), 3000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  // Close share dialog
  const closeShareDialog = () => {
    setShareDialogOpen(false);
    setUrlCopied(false);
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

        {/* Star Filter Tabs */}
        <motion.div 
          className="mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <div className="flex justify-center">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-2 inline-flex">
              {[
                { value: 'all' as StarFilter, label: 'All Decks', icon: Globe, count: publicMarkdownDecks.length },
                { value: 'starred' as StarFilter, label: 'Starred', icon: Star, count: starredDecks.length },
                { value: 'unstarred' as StarFilter, label: 'Unstarred', icon: Heart, count: publicMarkdownDecks.length - starredDecks.length }
              ].map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setStarFilter(tab.value)}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-all ${
                    starFilter === tab.value
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  <span className="font-medium">{tab.label}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                    starFilter === tab.value
                      ? 'bg-white/20 text-white'
                      : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </motion.div>

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
                <option value="english-vietnamese">📚 English-Vietnamese</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-4 text-sm text-gray-600 dark:text-gray-300 flex items-center gap-4">
            <span>Showing {filteredDecks.length} of {publicMarkdownDecks.length} decks</span>
            {starFilter !== 'all' && (
              <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full text-xs font-medium">
                {starFilter === 'starred' ? '⭐ Starred' : '🤍 Unstarred'} Filter Active
              </span>
            )}
            {filter === 'english-vietnamese' && (
              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs">
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
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white line-clamp-2 flex-1 mr-3">
                      {deck.name}
                    </h3>
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <button
                        onClick={() => toggleStar(deck.id)}
                        className={`p-1 rounded-full transition-all hover:scale-110 ${
                          isStarred(deck.id)
                            ? 'text-yellow-500 hover:text-yellow-600'
                            : 'text-gray-300 dark:text-gray-600 hover:text-yellow-400'
                        }`}
                        title={isStarred(deck.id) ? 'Remove from starred' : 'Add to starred'}
                      >
                        <Star 
                          className={`w-6 h-6 transition-all ${
                            isStarred(deck.id) ? 'fill-current' : ''
                          }`} 
                        />
                      </button>
                    </div>
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

                  {/* Categories and Tags */}
                  <div className="mt-3 space-y-2">
                    {/* Categories (if we can extract them from markdown) */}
                    {(() => {
                      const categoryMatches = deck.markdown.match(/^##?\s+(.+)$/gm);
                      const categories = categoryMatches ? [...new Set(categoryMatches.map(match => match.replace(/^##?\s+/, '').trim()))] : [];
                      return categories.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {categories.slice(0, 2).map(category => (
                            <span 
                              key={category}
                              className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs font-medium"
                            >
                              📂 {category}
                            </span>
                          ))}
                          {categories.length > 2 && (
                            <span className="text-xs text-gray-400 dark:text-gray-500 px-2 py-1">
                              +{categories.length - 2} more categories
                            </span>
                          )}
                        </div>
                      );
                    })()}

                    {/* Tags */}
                    {deck.tags && (
                      <div className="flex flex-wrap gap-1">
                        {deck.tags.slice(0, 3).map(tag => (
                          <span 
                            key={tag}
                            className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-xs"
                          >
                            #{tag}
                          </span>
                        ))}
                        {deck.tags.length > 3 && (
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            +{deck.tags.length - 3} more tags
                          </span>
                        )}
                      </div>
                    )}
                  </div>
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
                      onClick={() => handleOpenShareDialog(deck)}
                      className="flex items-center justify-center space-x-1 py-2 px-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
                      title="Share Deck"
                    >
                      <Share2 className="w-4 h-4" />
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

      {/* Awesome Share Dialog */}
      <AnimatePresence>
        {shareDialogOpen && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeShareDialog}
          >
            <motion.div
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden"
              initial={{ scale: 0.7, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.7, opacity: 0, y: 50 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                        <Share2 className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">Share Deck</h3>
                        <p className="text-white/80 text-sm">Spread the knowledge!</p>
                      </div>
                    </div>
                    <button
                      onClick={closeShareDialog}
                      className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center hover:bg-white/30 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="text-center">
                    <h4 className="text-lg font-semibold mb-1">{shareDeckName}</h4>
                    <p className="text-white/80 text-sm">Share this awesome flashcard deck with friends!</p>
                  </div>
                </div>
                
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* URL Display */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Share URL
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={shareUrl}
                      readOnly
                      className="w-full px-4 py-3 pr-12 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 font-mono"
                    />
                    <div className="absolute right-1 top-1 bottom-1 flex items-center">
                      <button
                        onClick={handleCopyShareUrl}
                        className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${ 
                          urlCopied
                            ? 'bg-green-500 text-white'
                            : 'bg-purple-600 hover:bg-purple-700 text-white'
                        }`}
                      >
                        {urlCopied ? (
                          <div className="flex items-center space-x-1">
                            <Check className="w-4 h-4" />
                            <span>Copied!</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-1">
                            <Copy className="w-4 h-4" />
                            <span>Copy</span>
                          </div>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Social Share Options */}
                <div className="mb-6">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Or share via:
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <a
                      href={`https://twitter.com/intent/tweet?text=Check out this awesome flashcard deck: "${shareDeckName}"&url=${encodeURIComponent(shareUrl)}&hashtags=flashcards,learning,MyFlashPlay`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center space-x-2 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                      </svg>
                      <span className="text-sm font-medium">Twitter</span>
                    </a>
                    
                    <a
                      href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                      <span className="text-sm font-medium">Facebook</span>
                    </a>
                  </div>
                </div>

                {/* Tips */}
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-purple-100 dark:bg-purple-800 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Star className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-purple-800 dark:text-purple-200 mb-1">
                        Pro Tip
                      </p>
                      <p className="text-sm text-purple-700 dark:text-purple-300">
                        Anyone with this link can instantly play the deck or save it to their collection. Perfect for sharing with study groups!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}