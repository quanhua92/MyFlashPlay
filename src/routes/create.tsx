import { createFileRoute } from '@tanstack/react-router';
import { CreatePage } from '@/pages/CreatePage';

export const Route = createFileRoute('/create')({
  component: CreatePage,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      template: search.template as string | undefined
    };
  }
});