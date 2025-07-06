import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDecks } from '../useDecks';
import { mockDeck } from '../../test/utils/test-utils';

describe('useDecks Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should initialize with empty decks', () => {
    const { result } = renderHook(() => useDecks());
    
    expect(result.current.decks).toHaveLength(0);
  });

  it('should add a new deck', () => {
    const { result } = renderHook(() => useDecks());
    
    act(() => {
      result.current.addDeck(mockDeck);
    });
    
    expect(result.current.decks).toHaveLength(1);
    expect(result.current.decks[0]).toEqual(mockDeck);
  });

  it('should get deck by id', () => {
    const { result } = renderHook(() => useDecks());
    
    act(() => {
      result.current.addDeck(mockDeck);
    });
    
    const deck = result.current.getDeck(mockDeck.id);
    expect(deck).toEqual(mockDeck);
  });

  it('should return undefined for non-existent deck', () => {
    const { result } = renderHook(() => useDecks());
    
    const deck = result.current.getDeck('non-existent');
    expect(deck).toBeUndefined();
  });

  it('should update existing deck', () => {
    const { result } = renderHook(() => useDecks());
    
    act(() => {
      result.current.addDeck(mockDeck);
    });
    
    const updatedDeck = { ...mockDeck, name: 'Updated Name' };
    
    act(() => {
      result.current.updateDeck(mockDeck.id, updatedDeck);
    });
    
    const deck = result.current.getDeck(mockDeck.id);
    expect(deck?.name).toBe('Updated Name');
  });

  it('should delete deck', () => {
    const { result } = renderHook(() => useDecks());
    
    act(() => {
      result.current.addDeck(mockDeck);
    });
    
    expect(result.current.decks).toHaveLength(1);
    
    act(() => {
      result.current.deleteDeck(mockDeck.id);
    });
    
    expect(result.current.decks).toHaveLength(0);
  });

  it('should persist decks to localStorage', () => {
    const { result } = renderHook(() => useDecks());
    
    act(() => {
      result.current.addDeck(mockDeck);
    });
    
    expect(localStorage.setItem).toHaveBeenCalledWith(
      'flashplay_decks',
      JSON.stringify([mockDeck])
    );
  });

  it('should load decks from localStorage', () => {
    // Pre-populate localStorage
    localStorage.setItem('flashplay_decks', JSON.stringify([mockDeck]));
    
    const { result } = renderHook(() => useDecks());
    
    expect(result.current.decks).toHaveLength(1);
    expect(result.current.decks[0]).toEqual(mockDeck);
  });

  it('should handle invalid localStorage data', () => {
    localStorage.setItem('flashplay_decks', 'invalid json');
    
    const { result } = renderHook(() => useDecks());
    
    expect(result.current.decks).toHaveLength(0);
  });

  it('should duplicate deck', () => {
    const { result } = renderHook(() => useDecks());
    
    act(() => {
      result.current.addDeck(mockDeck);
    });
    
    act(() => {
      result.current.duplicateDeck(mockDeck.id);
    });
    
    expect(result.current.decks).toHaveLength(2);
    expect(result.current.decks[1].name).toBe(`${mockDeck.name} (Copy)`);
  });

  it('should import decks', () => {
    const { result } = renderHook(() => useDecks());
    const newDecks = [mockDeck];
    
    act(() => {
      result.current.importDecks(newDecks);
    });
    
    expect(result.current.decks).toHaveLength(1);
    expect(result.current.decks[0]).toEqual(mockDeck);
  });

  it('should clear all decks', () => {
    const { result } = renderHook(() => useDecks());
    
    act(() => {
      result.current.addDeck(mockDeck);
    });
    
    expect(result.current.decks).toHaveLength(1);
    
    act(() => {
      result.current.clearDecks();
    });
    
    expect(result.current.decks).toHaveLength(0);
  });

  it('should get deck statistics', () => {
    const { result } = renderHook(() => useDecks());
    
    act(() => {
      result.current.addDeck(mockDeck);
    });
    
    const stats = result.current.getDeckStats(mockDeck.id);
    
    expect(stats).toEqual({
      totalCards: mockDeck.cards.length,
      categories: ['math', 'geography'],
      difficulties: ['easy'],
      averageDifficulty: 'easy',
      estimatedTime: mockDeck.metadata.estimatedTime
    });
  });
});