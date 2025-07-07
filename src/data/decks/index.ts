// Import all decks using wildcard imports to minimize maintenance
import * as myFlashPlayTeamDecks from './myflashplay-team';
import * as contributorDecks from './contributors';

// Aggregate all decks from all contributors and teams
export const allPublicDecks = [
  // MyFlashPlay Team decks
  ...Object.values(myFlashPlayTeamDecks),
  
  // Community contributor decks
  ...Object.values(contributorDecks).filter(deck => deck && typeof deck === 'object' && deck.id),
];