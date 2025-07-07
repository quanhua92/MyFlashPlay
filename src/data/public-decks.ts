// Public decks defined as markdown - consistent with our markdown-based architecture
// These showcase English-Vietnamese vocabulary for language learning
// 
// NOTE: Individual deck files are now located in the ./decks/ directory
// organized by author/contributor for better GitHub collaboration

import { allPublicDecks } from './decks/index';

export const publicMarkdownDecks = allPublicDecks;

export function getPublicDeck(id: string) {
  return publicMarkdownDecks.find(deck => deck.id === id);
}

export function getPublicDecksByTag(tag: string) {
  return publicMarkdownDecks.filter(deck =>
    deck.tags?.includes(tag)
  );
}

export function getPublicDecksByDifficulty(difficulty: string) {
  return publicMarkdownDecks.filter(deck =>
    deck.difficulty === difficulty
  );
}

export function generatePublicDeckUrl(deckId: string): string {
  const baseUrl = window.location.origin;
  return `${baseUrl}/public/${deckId}`;
}

// Featured decks for home page showcase
export const featuredVietnameseDecks = [
  'public-english-vietnamese-basic',
  'public-english-vietnamese-family',
  'public-english-vietnamese-colors',
  'public-english-vietnamese-animals',
  'public-english-vietnamese-food',
  'public-english-vietnamese-numbers',
  'public-english-vietnamese-verbs',
  'public-english-vietnamese-time',
  'public-english-vietnamese-clothing',
  'public-english-vietnamese-transportation',
  'public-english-vietnamese-technology',
  'public-english-vietnamese-hobbies'
];