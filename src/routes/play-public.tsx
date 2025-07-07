import { createFileRoute } from '@tanstack/react-router';
import { PlayTempPage } from '@/pages/PlayTempPage';

export const Route = createFileRoute('/play-public')({
  component: PlayTempPage,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      deck: search.deck as string | undefined,
      source: search.source as string | undefined,
      mode: search.mode as string | undefined
    };
  }
});