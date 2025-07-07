import { useState, useEffect } from 'react';
import { markdownStorage } from '@/utils/markdown-storage';
import { sampleMarkdownDecks } from '@/data/sample-decks';
import type { Deck } from '@/types';

export function useDecks() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  console.log('[useDecks] Hook initialized, current decks:', decks.map(d => ({ id: d.id, name: d.name })));
  
  // Initialize decks from markdown storage
  useEffect(() => {
    const initializeDecks = async () => {
      console.log('[useDecks] Starting deck initialization...');
      setIsLoading(true);
      try {
        // Load from markdown storage
        const { decks: markdownDecks, errors } = markdownStorage.loadAllDecks();
        console.log('[useDecks] Loaded from storage:', {
          deckCount: markdownDecks.length,
          errorCount: errors.length,
          deckIds: markdownDecks.map(d => d.id)
        });
        
        if (markdownDecks.length > 0) {
          // We have markdown decks, use them
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
    console.log(`[useDecks getDeck] Called with deckId: ${deckId}`);
    console.log(`[useDecks getDeck] Current state decks:`, decks.map(d => ({ id: d.id, name: d.name })));
    
    // First try to find in current state
    const deckFromState = decks.find(deck => deck.id === deckId);
    if (deckFromState) {
      console.log(`[useDecks getDeck] Found deck ${deckId} in state:`, {
        id: deckFromState.id,
        name: deckFromState.name,
        cardCount: deckFromState.cards.length
      });
      return deckFromState;
    }
    
    // If not found in state, try loading from markdown storage directly
    console.log(`[useDecks getDeck] Deck ${deckId} not in state, checking markdown storage...`);
    const { deck, result } = markdownStorage.loadDeck(deckId);
    console.log(`[useDecks getDeck] Storage load result:`, {
      found: !!deck,
      deckId: deck?.id,
      deckName: deck?.name,
      error: result.error
    });
    
    if (deck) {
      console.log(`[useDecks getDeck] Found deck ${deckId} in markdown storage, adding to state`);
      // Add to state for future use
      setDecks(prevDecks => {
        const exists = prevDecks.find(d => d.id === deckId);
        console.log(`[useDecks getDeck] Updating state, exists: ${!!exists}`);
        return exists ? prevDecks : [...prevDecks, deck];
      });
      return deck;
    } else {
      console.log(`[useDecks getDeck] Deck ${deckId} not found anywhere. Result:`, result);
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