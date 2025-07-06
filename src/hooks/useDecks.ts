import { useState, useEffect } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { deckStorage } from '@/utils/storage';
import { sampleDecks } from '@/data/sample-decks';
import type { Deck } from '@/types';

export function useDecks() {
  const [decks, setDecks] = useLocalStorage<Deck[]>('flashplay_decks', []);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize with sample decks if empty
  useEffect(() => {
    setIsLoading(true);
    try {
      // Validate decks structure
      if (!Array.isArray(decks)) {
        console.error('Decks data is not an array, resetting to sample decks');
        setDecks(sampleDecks);
        setError('Data was corrupted, restored sample decks');
      } else if (decks.length === 0) {
        setDecks(sampleDecks);
      } else {
        // Validate each deck has required fields
        const validDecks = decks.filter(deck => 
          deck && 
          deck.id && 
          deck.name && 
          Array.isArray(deck.cards)
        );
        
        if (validDecks.length !== decks.length) {
          console.warn('Some decks were invalid and filtered out');
          setDecks(validDecks);
        }
      }
    } catch (err) {
      console.error('Error initializing decks:', err);
      setDecks(sampleDecks);
      setError('Error loading decks, using defaults');
    }
    setIsLoading(false);
  }, []);

  const addDeck = (deck: Deck) => {
    const newDecks = [...decks, deck];
    setDecks(newDecks);
    deckStorage.save(newDecks);
  };

  const updateDeck = (deckId: string, updates: Partial<Deck>) => {
    const newDecks = decks.map(deck => 
      deck.id === deckId 
        ? { ...deck, ...updates, metadata: { ...deck.metadata, lastModified: new Date().toISOString() } }
        : deck
    );
    setDecks(newDecks);
    deckStorage.save(newDecks);
  };

  const deleteDeck = (deckId: string) => {
    const newDecks = decks.filter(deck => deck.id !== deckId);
    setDecks(newDecks);
    deckStorage.save(newDecks);
  };

  const getDeck = (deckId: string) => {
    return decks.find(deck => deck.id === deckId);
  };

  return {
    decks,
    isLoading,
    error,
    addDeck,
    updateDeck,
    deleteDeck,
    getDeck
  };
}