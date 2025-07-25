import { useState, useEffect, useRef } from "react"
import {
  BookOpen,
  Play,
  Trash2,
  Target,
  Zap,
  Brain,
  ChevronDown,
  ChevronRight,
  Layers,
  MoreVertical,
  Download,
  Edit,
  Eye,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Link, useNavigate } from "@tanstack/react-router"
import { useTranslation } from "@/i18n"
import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import type { Deck, GameMode } from "@/types"

interface DeckCardProps {
  deck: Deck
  index: number
  onDelete: (deckId: string) => void
}

export function DeckCard({ deck, index, onDelete }: DeckCardProps) {
  const t = useTranslation()
  const [showModes, setShowModes] = useState(false)
  const [selectedMode, setSelectedMode] = useState<GameMode | null>(null)
  const [showMenu, setShowMenu] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
      }
    }

    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showMenu])

  const gameModes = [
    {
      id: "study",
      name: t('game.studyMode'),
      description: t('decks.studyDescription'),
      icon: BookOpen,
      color: "blue",
    },
    {
      id: "quiz",
      name: t('game.quizMode'),
      description: t('decks.quizDescription'),
      icon: Target,
      color: "green",
    },
    {
      id: "speed",
      name: t('game.speedMode'),
      description: t('decks.speedDescription'),
      icon: Zap,
      color: "yellow",
    },
    {
      id: "memory",
      name: t('game.memoryMode'),
      description: t('decks.memoryDescription'),
      icon: Brain,
      color: "purple",
    },
    {
      id: "falling",
      name: t('game.fallingMode'),
      description: t('decks.fallingDescription'),
      icon: Layers,
      color: "indigo",
    },
  ]

  const handleModeSelect = (mode: GameMode) => {
    setSelectedMode(mode)
    setShowModes(false)
    // Immediately navigate to the game - no need to click "Start"
    navigate({
      to: "/play/$deckId",
      params: { deckId: deck.id },
      search: { mode },
    })
  }


  const handleDownload = () => {
    try {
      // Get the raw markdown from localStorage
      const rawMarkdown = localStorage.getItem(`mdoc_${deck.id}`)

      if (rawMarkdown) {
        const blob = new Blob([rawMarkdown], {
          type: "text/plain;charset=utf-8",
        })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `${deck.name.replace(/[^a-zA-Z0-9]/g, "-")}.md`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      } else {
        // Fallback: create markdown from deck data
        let markdown = `# ${deck.emoji} ${deck.name}\n\n`
        if (deck.description) {
          markdown += `${deck.description}\n\n`
        }

        deck.cards.forEach((card) => {
          if (card.type === "simple") {
            markdown += `- ${card.front} :: ${card.back}\n`
          } else if (card.type === "multiple-choice" && card.options) {
            markdown += `- ${card.front}\n`
            card.options.forEach((option) => {
              markdown += `  - ${option.text}\n`
            })
            const correctOption = card.options.find((opt) => opt.isCorrect)
            if (correctOption) {
              markdown += `  > ${correctOption.text}\n`
            }
          } else if (card.type === "true-false") {
            markdown += `- ${card.front} :: ${card.back}\n`
          }
          markdown += "\n"
        })

        const blob = new Blob([markdown], { type: "text/plain;charset=utf-8" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `${deck.name.replace(/[^a-zA-Z0-9]/g, "-")}.md`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }

      setShowMenu(false)
    } catch (error) {
      console.error("Failed to download deck:", error)
      alert("Failed to download deck. Please try again.")
    }
  }

  const handleEdit = () => {
    setShowMenu(false)
    navigate({ to: "/edit/$deckId", params: { deckId: deck.id } })
  }

  const handleViewDetails = () => {
    setShowMenu(false)
    navigate({ to: "/deck/$deckId", params: { deckId: deck.id } })
  }

  const handleDelete = () => {
    setShowMenu(false)
    setShowDeleteDialog(true)
  }

  const handleConfirmDelete = () => {
    setShowDeleteDialog(false)
    onDelete(deck.id)
  }

  const handleCancelDelete = () => {
    setShowDeleteDialog(false)
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 * index }}
        className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-200"
      >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <span className="text-3xl">{deck.emoji}</span>
          <div>
            <Link
              to="/deck/$deckId"
              params={{ deckId: deck.id }}
              className="block group"
            >
              <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                {deck.name}
              </h3>
            </Link>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {deck.cards.length} {t('decks.cards')}
            </p>
          </div>
        </div>

        {/* 3-Dot Menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            title={t('decks.deckOptions')}
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          <AnimatePresence>
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10"
              >
                <div className="py-1">
                  <button
                    onClick={handleViewDetails}
                    className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View Details</span>
                  </button>

                  <button
                    onClick={handleEdit}
                    className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    <span>{t('decks.editDeck')}</span>
                  </button>

                  <button
                    onClick={handleDownload}
                    className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>{t('decks.downloadDeck')}</span>
                  </button>

                  <div className="border-t border-gray-200 dark:border-gray-600 my-1"></div>

                  <button
                    onClick={handleDelete}
                    className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>{t('decks.deleteDeck')}</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Description */}
      <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm line-clamp-2">
        {deck.description}
      </p>

      {/* Tags and Info - Consistent with Public Decks */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            deck.metadata?.difficulty === 'beginner' ? 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30' :
            deck.metadata?.difficulty === 'intermediate' ? 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30' :
            deck.metadata?.difficulty === 'advanced' ? 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30' :
            'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700'
          }`}>
            {deck.metadata?.difficulty || 'intermediate'}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {deck.cards.length} {t('decks.cards')}
          </span>
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          ~{deck.metadata?.estimatedTime || 5} min
        </span>
      </div>

      {/* Categories */}
      {(() => {
        const categories = [...new Set(deck.cards.map(card => card.category).filter(Boolean))];
        return categories.length > 0 && (
          <div className="mb-2">
            <div className="flex flex-wrap gap-1">
              {categories.slice(0, 2).map(category => (
                <span 
                  key={category}
                  className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs font-medium"
                >
                  📂 {category}
                </span>
              ))}
              {categories.length > 2 && (
                <span className="text-xs text-gray-400 dark:text-gray-500 px-2 py-1">
                  +{categories.length - 2} more categories
                </span>
              )}
            </div>
          </div>
        );
      })()}

      {/* Tags */}
      {deck.metadata?.tags && deck.metadata.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {deck.metadata.tags.slice(0, 3).map(tag => (
            <span 
              key={tag}
              className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-xs"
            >
              #{tag}
            </span>
          ))}
          {deck.metadata.tags.length > 3 && (
            <span className="text-xs text-gray-400 dark:text-gray-500">
              +{deck.metadata.tags.length - 3} more tags
            </span>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 mb-4">
        <span>{t('decks.playedTimes', { count: deck.metadata?.playCount || 0 })}</span>
        <span>{t('decks.lastPlayed')}: {deck.metadata?.lastModified ? new Date(deck.metadata.lastModified).toLocaleDateString() : t('decks.never')}</span>
      </div>

      {/* Mode Selection */}
      <div className="space-y-3">
        {/* Quick Actions */}
        <div className="flex gap-2">
          {/* Quick Study Mode */}
          <Link
            to="/play/$deckId"
            params={{ deckId: deck.id }}
            search={{ mode: "study" }}
            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-center py-2 px-4 rounded-lg font-medium hover:shadow-md transition-shadow flex items-center justify-center space-x-2"
          >
            <Play className="w-4 h-4" />
            <span>{t('decks.startStudy')}</span>
          </Link>

          {/* More Modes Button */}
          <button
            onClick={() => setShowModes(!showModes)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center"
            title={t('decks.moreGameModes')}
          >
            {showModes ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Mode Selection Dropdown */}
        <AnimatePresence>
          {showModes && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-700/50"
            >
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                {t('decks.selectGameMode')}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {gameModes.map((mode) => {
                  const Icon = mode.icon
                  const colorClasses = {
                    blue: "text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400",
                    green:
                      "text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400",
                    yellow:
                      "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400",
                    purple:
                      "text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400",
                    indigo:
                      "text-indigo-600 bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400",
                  }[mode.color]

                  return (
                    <button
                      key={mode.id}
                      onClick={() => handleModeSelect(mode.id as GameMode)}
                      className={`p-2 rounded-lg transition-all hover:scale-105 ${colorClasses} ${
                        selectedMode === mode.id
                          ? "ring-2 ring-offset-1 ring-current"
                          : ""
                      }`}
                    >
                      <div className="flex flex-col items-center text-center">
                        <Icon className="w-5 h-5 mb-1" />
                        <span className="text-xs font-medium">{mode.name}</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>

      <ConfirmDialog
        isOpen={showDeleteDialog}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        title={t('decks.deleteDeck')}
        message={`${t('decks.confirmDelete')} "${deck.name}"?`}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
        variant="danger"
      />
    </>
  )
}
