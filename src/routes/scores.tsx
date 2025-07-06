import { createFileRoute } from '@tanstack/react-router';
import { ScoresPage } from '@/pages/ScoresPage';

export const Route = createFileRoute('/scores')({
  component: ScoresPage
});