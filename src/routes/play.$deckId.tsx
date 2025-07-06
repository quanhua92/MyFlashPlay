import { createFileRoute } from '@tanstack/react-router';
import { PlayPage } from '@/pages/PlayPage';

export const Route = createFileRoute('/play/$deckId')({
  component: PlayPage,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      mode: search.mode as string | undefined
    };
  }
});