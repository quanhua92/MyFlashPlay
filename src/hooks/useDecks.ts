import { useState, useEffect } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { deckStorage } from '@/utils/storage';
import { sampleDecks } from '@/data/sample-decks';
import type { Deck } from '@/types';

export function useDecks() {
  const [decks, setDecks] = useLocalStorage<Deck[]>('flashplay_decks', []);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize with sample decks if empty
  useEffect(() => {
    setIsLoading(true);
    if (decks.length === 0) {
      setDecks(sampleDecks);
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
    addDeck,
    updateDeck,
    deleteDeck,
    getDeck
  };
}