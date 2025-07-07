import { useState, useEffect } from 'react';
import { markdownStorage } from '@/utils/markdown-storage';
import { sampleMarkdownDecks } from '@/data/sample-decks';
import type { Deck } from '@/types';

export function useDecks() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Initialize decks from markdown storage
  useEffect(() => {
    const initializeDecks = async () => {
      setIsLoading(true);
      try {
        // Load from markdown storage
        const { decks: markdownDecks, errors } = markdownStorage.loadAllDecks();
        
        // Check if we have sample decks specifically (look for known sample deck IDs)
        const hasSampleDecks = markdownDecks.some(deck => 
          ['math-basics', 'science-animals', 'space-exploration', 'vietnamese-animals', 'vietnamese-colors', 'vietnamese-math'].includes(deck.id)
        );
        
        if (markdownDecks.length > 0 && hasSampleDecks) {
          // We have markdown decks including samples, use them
          setDecks(markdownDecks);
          if (errors.length > 0) {
            setError(`Loaded ${markdownDecks.length} decks, but ${errors.length} had errors`);
          }
        } else {
          // No decks at all, use samples
          console.log('No existing decks found, initializing with sample decks');
          console.log('sampleMarkdownDecks count:', sampleMarkdownDecks.length);
          
          const migratedSamples = await Promise.all(
            sampleMarkdownDecks.map(async (sampleDeck) => {
              console.log('Processing sample deck:', sampleDeck.id, sampleDeck.name);
              
              // Save the markdown directly to localStorage
              const markdownKey = `mdoc_${sampleDeck.id}`;
              localStorage.setItem(markdownKey, sampleDeck.markdown);
              console.log('Saved to localStorage:', markdownKey);
              
              // Parse the markdown to create deck object
              const { deck, result } = markdownStorage.loadDeck(sampleDeck.id);
              console.log('Load result for', sampleDeck.id, ':', result);
              
              if (deck) {
                // Update the deck name to match our sample
                deck.name = sampleDeck.name;
                console.log('Successfully created deck:', deck.name, 'with', deck.cards.length, 'cards');
                return deck;
              } else {
                console.log('Failed to create deck for', sampleDeck.id, 'Error:', result.error);
              }
              return null;
            })
          );
          
          const successfulSamples = migratedSamples.filter(Boolean) as Deck[];
          console.log('Successfully migrated', successfulSamples.length, 'sample decks');
          setDecks(successfulSamples);
        }
      } catch (err) {
        console.error('Error initializing decks:', err);
        setError('Error loading decks');
        setDecks([]);
      }
      setIsLoading(false);
    };

    initializeDecks();
  }, []);

  const addDeck = (deck: Deck) => {
    console.log(`Adding deck ${deck.id} (${deck.name}) to storage...`);
    // Save to markdown storage
    const result = markdownStorage.saveDeck(deck);
    
    if (result.success) {
      console.log(`Successfully saved deck ${deck.id} to markdown storage`);
      const newDecks = [...decks, deck];
      setDecks(newDecks);
      console.log(`Updated state with ${newDecks.length} decks`);
      return { success: true };
    } else {
      console.error(`Failed to save deck ${deck.id}:`, result.error);
      setError(`Failed to save deck: ${result.error}`);
      return { success: false, error: result.error };
    }
  };

  const updateDeck = (deckId: string, updates: Partial<Deck>) => {
    const existingDeck = decks.find(deck => deck.id === deckId);
    if (!existingDeck) {
      setError('Deck not found');
      return;
    }
    
    const updatedDeck = { 
      ...existingDeck, 
      ...updates, 
      metadata: { ...existingDeck.metadata, lastModified: new Date().toISOString() } 
    };
    
    // Save to markdown storage
    const result = markdownStorage.saveDeck(updatedDeck);
    
    if (result.success) {
      const newDecks = decks.map(deck => 
        deck.id === deckId ? updatedDeck : deck
      );
      setDecks(newDecks);
    } else {
      setError(`Failed to update deck: ${result.error}`);
    }
  };

  const deleteDeck = (deckId: string) => {
    // Delete from markdown storage
    const result = markdownStorage.deleteDeck(deckId);
    
    if (result.success) {
      const newDecks = decks.filter(deck => deck.id !== deckId);
      setDecks(newDecks);
    } else {
      setError(`Failed to delete deck: ${result.error}`);
    }
  };

  const getDeck = (deckId: string) => {
    // First try to find in current state
    const deckFromState = decks.find(deck => deck.id === deckId);
    if (deckFromState) {
      console.log(`Found deck ${deckId} in state`);
      return deckFromState;
    }
    
    // If not found in state, try loading from markdown storage directly
    console.log(`Deck ${deckId} not in state, checking markdown storage...`);
    const { deck, result } = markdownStorage.loadDeck(deckId);
    if (deck) {
      console.log(`Found deck ${deckId} in markdown storage, adding to state`);
      // Add to state for future use
      setDecks(prevDecks => {
        const exists = prevDecks.find(d => d.id === deckId);
        return exists ? prevDecks : [...prevDecks, deck];
      });
      return deck;
    } else {
      console.log(`Deck ${deckId} not found anywhere. Result:`, result);
    }
    
    return null;
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