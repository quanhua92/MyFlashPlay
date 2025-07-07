import { createFileRoute } from '@tanstack/react-router';
import { EditPage } from '@/pages/EditPage';

export const Route = createFileRoute('/edit/$deckId')({
  component: EditPage,
});