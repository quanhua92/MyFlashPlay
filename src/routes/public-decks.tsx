import { createFileRoute } from '@tanstack/react-router'
import { PublicDecksPage } from '../pages/PublicDecksPage'

export const Route = createFileRoute('/public-decks')({
  component: PublicDecksPage,
})