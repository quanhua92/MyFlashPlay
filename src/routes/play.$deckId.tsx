import { createFileRoute } from '@tanstack/react-router';
import { PlayPage } from '@/pages/PlayPage';

export const Route = createFileRoute('/play/$deckId')({
  component: PlayPage
});