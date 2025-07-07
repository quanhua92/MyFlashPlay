import { Link } from "@tanstack/react-router"
import { Plus, BookOpen, Sparkles, Target, Trophy, Zap } from "lucide-react"
import { motion } from "framer-motion"
import { useDecks } from "@/hooks/useDecks"
import { achievementManager } from "@/utils/achievements"
import { useTranslation } from "@/i18n"
import { DeckCard } from "@/components/decks/DeckCard"
import { markdownStorage } from "@/utils/markdown-storage"
import { sampleMarkdownDecks } from "@/data/sample-decks"
import type { Deck } from "@/types"

export function HomePage() {
  const { deleteDeck } = useDecks()
  const t = useTranslation()
  achievementManager.checkDailyStreak() // Check daily streak on home page visit

  // Development helper: Force reload sample decks if URL has ?reload-samples
  if (
    typeof window !== "undefined" &&
    window.location.search.includes("reload-samples")
  ) {
    // Clear localStorage and reload
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("mdoc_")) {
        localStorage.removeItem(key)
      }
    })
    if (!window.location.search.includes("reloaded")) {
      window.location.href = window.location.pathname + "?reloaded=true"
    }
  }

  const parsedSampleDecks = sampleMarkdownDecks
    .map((deckData) => {
      const deck = markdownStorage["markdownToDeck"](
        deckData.id,
        deckData.markdown,
        deckData.name,
        deckData.name.match(/\p{Emoji}/u)?.[0],
      )
      if (deck) {
        deck.description = deckData.description
        deck.metadata.tags = deckData.tags
        deck.metadata.difficulty = deckData.difficulty
      }
      return deck
    })
    .filter(Boolean) as Deck[]

  const features = [
    {
      icon: Target,
      title: t("home.feature1Title"),
      description: t("home.feature1Description"),
      color: "from-purple-500 to-pink-500",
    },
    {
      icon: Zap,
      title: t("home.feature2Title"),
      description: t("home.feature2Description"),
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: Trophy,
      title: t("home.feature3Title"),
      description: t("home.feature3Description"),
      color: "from-green-500 to-emerald-500",
    },
    {
      icon: Sparkles,
      title: "Kid-Friendly",
      description: "Designed for young learners with accessibility in mind",
      color: "from-yellow-500 to-orange-500",
    },
  ]

  return (
    <div className="max-w-7xl mx-auto">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center py-12"
      >
        <h1 className="text-5xl md:text-7xl font-bold mb-6">
          <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
            {t("nav.appTitle")}
          </span>
        </h1>
        <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
          {t("home.subtitle")}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            to="/create"
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>{t("home.getStartedButton")}</span>
          </Link>

          <Link
            to="/decks"
            className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-8 py-4 rounded-xl text-lg font-semibold border-2 border-gray-200 dark:border-gray-700 hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center space-x-2"
          >
            <BookOpen className="w-5 h-5" />
            <span>{t("nav.myDecks")}</span>
          </Link>
        </div>
      </motion.div>

      {/* Features Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="py-16"
      >
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900 dark:text-white">
          {t("home.featuresTitle")}
        </h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 * index }}
              className="text-center p-6 rounded-2xl bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-shadow"
            >
              <div
                className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r ${feature.color} flex items-center justify-center`}
              >
                <feature.icon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                {feature.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Sample Decks Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="py-16"
      >
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900 dark:text-white">
          {t("home.sampleDecksTitle")}
        </h2>

        <div className="grid md:grid-cols-3 gap-8">
          {parsedSampleDecks.map((deck, index) => (
            <DeckCard
              key={deck.id}
              deck={deck}
              index={index}
              onDelete={deleteDeck}
            />
          ))}
        </div>
      </motion.div>
    </div>
  )
}
