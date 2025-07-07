import { useState } from 'react';
import { Filter, X, Search, Tag, FolderOpen, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Deck, Difficulty } from '@/types';

export interface FilterOptions {
  searchQuery: string;
  selectedTags: string[];
  selectedCategories: string[];
  selectedDifficulty: Difficulty | 'all';
  minCards: number | null;
  maxCards: number | null;
}

interface DeckFiltersProps {
  decks: Deck[];
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  showAdvanced?: boolean;
}

export function DeckFilters({ decks, filters, onFiltersChange, showAdvanced = false }: DeckFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Extract all unique tags and categories from decks
  const allTags = [...new Set(decks.flatMap(deck => deck.metadata?.tags || []))].sort();
  const allCategories = [...new Set(decks.flatMap(deck => 
    deck.cards.map(card => card.category).filter(Boolean)
  ))].sort();

  const updateFilters = (updates: Partial<FilterOptions>) => {
    onFiltersChange({ ...filters, ...updates });
  };

  const clearFilters = () => {
    onFiltersChange({
      searchQuery: '',
      selectedTags: [],
      selectedCategories: [],
      selectedDifficulty: 'all',
      minCards: null,
      maxCards: null
    });
  };

  const hasActiveFilters = filters.searchQuery || 
    filters.selectedTags.length > 0 || 
    filters.selectedCategories.length > 0 || 
    filters.selectedDifficulty !== 'all' ||
    filters.minCards !== null ||
    filters.maxCards !== null;

  const filteredDecksCount = decks.filter(deck => {
    // Search query
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      const matchesName = deck.name.toLowerCase().includes(query);
      const matchesDescription = deck.description.toLowerCase().includes(query);
      const matchesTags = deck.metadata?.tags?.some(tag => tag.toLowerCase().includes(query));
      const matchesCategories = deck.cards.some(card => 
        card.category?.toLowerCase().includes(query)
      );
      if (!matchesName && !matchesDescription && !matchesTags && !matchesCategories) {
        return false;
      }
    }

    // Tags filter
    if (filters.selectedTags.length > 0) {
      const deckTags = deck.metadata?.tags || [];
      if (!filters.selectedTags.some(tag => deckTags.includes(tag))) {
        return false;
      }
    }

    // Categories filter
    if (filters.selectedCategories.length > 0) {
      const deckCategories = [...new Set(deck.cards.map(card => card.category).filter(Boolean))];
      if (!filters.selectedCategories.some(category => deckCategories.includes(category))) {
        return false;
      }
    }

    // Difficulty filter
    if (filters.selectedDifficulty !== 'all') {
      if ((deck.metadata?.difficulty || 'medium') !== filters.selectedDifficulty) {
        return false;
      }
    }

    // Card count filters
    if (filters.minCards !== null && deck.cards.length < filters.minCards) {
      return false;
    }
    if (filters.maxCards !== null && deck.cards.length > filters.maxCards) {
      return false;
    }

    return true;
  }).length;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Filter Decks
          </h3>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            ({filteredDecksCount} of {decks.length})
          </span>
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex items-center gap-1"
            >
              <X className="w-4 h-4" />
              Clear all
            </button>
          )}
          {showAdvanced && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 flex items-center gap-1"
            >
              <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
              Advanced
            </button>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search decks by name, description, tags, or categories..."
          value={filters.searchQuery}
          onChange={(e) => updateFilters({ searchQuery: e.target.value })}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
      </div>

      {/* Quick Filters */}
      <div className="space-y-4">
        {/* Tags */}
        {allTags.length > 0 && (
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Tag className="w-4 h-4" />
              Tags
            </label>
            <div className="flex flex-wrap gap-2">
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => {
                    const isSelected = filters.selectedTags.includes(tag);
                    updateFilters({
                      selectedTags: isSelected
                        ? filters.selectedTags.filter(t => t !== tag)
                        : [...filters.selectedTags, tag]
                    });
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    filters.selectedTags.includes(tag)
                      ? 'bg-purple-600 text-white'
                      : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/50'
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Categories */}
        {allCategories.length > 0 && (
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <FolderOpen className="w-4 h-4" />
              Categories
            </label>
            <div className="flex flex-wrap gap-2">
              {allCategories.map(category => (
                <button
                  key={category}
                  onClick={() => {
                    const isSelected = filters.selectedCategories.includes(category);
                    updateFilters({
                      selectedCategories: isSelected
                        ? filters.selectedCategories.filter(c => c !== category)
                        : [...filters.selectedCategories, category]
                    });
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    filters.selectedCategories.includes(category)
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50'
                  }`}
                >
                  📂 {category}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Advanced Filters */}
      <AnimatePresence>
        {(isExpanded || !showAdvanced) && (
          <motion.div
            initial={showAdvanced ? { height: 0, opacity: 0 } : false}
            animate={showAdvanced ? { height: 'auto', opacity: 1 } : false}
            exit={showAdvanced ? { height: 0, opacity: 0 } : false}
            transition={{ duration: 0.2 }}
            className={showAdvanced ? 'overflow-hidden' : ''}
          >
            <div className={`${showAdvanced ? 'pt-4 mt-4 border-t border-gray-200 dark:border-gray-700' : ''} space-y-4`}>
              {/* Difficulty */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Difficulty
                </label>
                <div className="flex gap-2">
                  {(['all', 'easy', 'medium', 'hard'] as const).map(difficulty => (
                    <button
                      key={difficulty}
                      onClick={() => updateFilters({ selectedDifficulty: difficulty })}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                        filters.selectedDifficulty === difficulty
                          ? difficulty === 'easy' ? 'bg-green-600 text-white' :
                            difficulty === 'medium' ? 'bg-yellow-600 text-white' :
                            difficulty === 'hard' ? 'bg-red-600 text-white' :
                            'bg-gray-600 text-white'
                          : difficulty === 'easy' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50' :
                            difficulty === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-200 dark:hover:bg-yellow-900/50' :
                            difficulty === 'hard' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50' :
                            'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {difficulty === 'all' ? 'All' : difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Card Count Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Min Cards
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={filters.minCards || ''}
                    onChange={(e) => updateFilters({ 
                      minCards: e.target.value ? parseInt(e.target.value) : null 
                    })}
                    className="w-full px-3 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Max Cards
                  </label>
                  <input
                    type="number"
                    placeholder="∞"
                    value={filters.maxCards || ''}
                    onChange={(e) => updateFilters({ 
                      maxCards: e.target.value ? parseInt(e.target.value) : null 
                    })}
                    className="w-full px-3 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Helper function to apply filters to deck list
export function applyFilters(decks: Deck[], filters: FilterOptions): Deck[] {
  return decks.filter(deck => {
    // Search query
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      const matchesName = deck.name.toLowerCase().includes(query);
      const matchesDescription = deck.description.toLowerCase().includes(query);
      const matchesTags = deck.metadata?.tags?.some(tag => tag.toLowerCase().includes(query));
      const matchesCategories = deck.cards.some(card => 
        card.category?.toLowerCase().includes(query)
      );
      if (!matchesName && !matchesDescription && !matchesTags && !matchesCategories) {
        return false;
      }
    }

    // Tags filter
    if (filters.selectedTags.length > 0) {
      const deckTags = deck.metadata?.tags || [];
      if (!filters.selectedTags.some(tag => deckTags.includes(tag))) {
        return false;
      }
    }

    // Categories filter
    if (filters.selectedCategories.length > 0) {
      const deckCategories = [...new Set(deck.cards.map(card => card.category).filter(Boolean))];
      if (!filters.selectedCategories.some(category => deckCategories.includes(category))) {
        return false;
      }
    }

    // Difficulty filter
    if (filters.selectedDifficulty !== 'all') {
      if ((deck.metadata?.difficulty || 'medium') !== filters.selectedDifficulty) {
        return false;
      }
    }

    // Card count filters
    if (filters.minCards !== null && deck.cards.length < filters.minCards) {
      return false;
    }
    if (filters.maxCards !== null && deck.cards.length > filters.maxCards) {
      return false;
    }

    return true;
  });
}