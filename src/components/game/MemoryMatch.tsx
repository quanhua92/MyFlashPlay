import { useState, useMemo, useCallback, useEffect } from "react"
import { Brain, Trophy, RotateCcw, Home } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Link } from "@tanstack/react-router"
import { ScoreDisplay, ConfettiEffect, playSound } from "@/components/ui"
import { announce } from "@/hooks/useAccessibility"
import type { Deck, GameSession } from "@/types"
import { v4 as uuidv4 } from "uuid"

// #region --- Types and Constants ---
interface MemoryMatchProps {
  deck: Deck
  difficulty?: "easy" | "medium" | "hard"
  onComplete?: (session: GameSession) => void
}

interface MemoryCard {
  id: string
  cardId: string
  content: string
  isQuestion: boolean
  isFlipped: boolean
  isMatched: boolean
  pairId: string
}

const POINTS_PER_MATCH = 10
// #endregion

/**
 * Creates and shuffles the cards for a new game session.
 * This is a pure function, making it easy to use for state initialization.
 */
function createInitialBoard(usableCards: Deck["cards"]): MemoryCard[] {
  const cards: MemoryCard[] = []
  usableCards.forEach((card) => {
    const pairId = card.id
    cards.push({
      id: uuidv4(),
      cardId: card.id,
      content: card.front,
      isQuestion: true,
      isFlipped: false,
      isMatched: false,
      pairId,
    })
    cards.push({
      id: uuidv4(),
      cardId: card.id,
      content: card.back,
      isQuestion: false,
      isFlipped: false,
      isMatched: false,
      pairId,
    })
  })
  return cards.sort(() => Math.random() - 0.5)
}

/**
 * The core game component, containing all state and logic for a single session.
 * It is reset by its parent by changing its `key` prop.
 */
function MemoryGame({
  deck,
  usableCards,
  grid,
  onGameEnd,
  resetGame,
}: {
  deck: Deck
  usableCards: Deck["cards"]
  grid: { cols: number; pairs: number }
  onGameEnd: (session: GameSession) => void
  resetGame: () => void
}) {
  const { cols, pairs } = grid

  // Use lazy initialization for state. This function runs only once when the component mounts.
  const [memoryCards, setMemoryCards] = useState(() =>
    createInitialBoard(usableCards),
  )
  const [flippedCards, setFlippedCards] = useState<MemoryCard[]>([])
  const [moves, setMoves] = useState(0)
  const [matchedPairs, setMatchedPairs] = useState(0)
  const [score, setScore] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const [isChecking, setIsChecking] = useState(false) // Prevents clicks during match check
  const [startTime] = useState(new Date())

  // --- Core Game Logic ---
  const handleCardClick = (clickedCard: MemoryCard) => {
    if (
      isChecking ||
      flippedCards.length >= 2 ||
      clickedCard.isFlipped ||
      clickedCard.isMatched
    ) {
      return
    }

    playSound("flip")
    setMemoryCards((prev) =>
      prev.map((c) =>
        c.id === clickedCard.id ? { ...c, isFlipped: true } : c,
      ),
    )
    setFlippedCards((prev) => [...prev, clickedCard])
  }

  // The only useEffect is for the side-effect of checking a match after a delay.
  useEffect(() => {
    if (flippedCards.length !== 2) return

    setIsChecking(true)
    setMoves((m) => m + 1)

    const [firstCard, secondCard] = flippedCards
    const isMatch = firstCard.pairId === secondCard.pairId

    const timer = setTimeout(() => {
      if (isMatch) {
        playSound("correct")
        setMatchedPairs((p) => p + 1)
        setScore((s) => s + POINTS_PER_MATCH)
        setMemoryCards((prev) =>
          prev.map((c) =>
            c.pairId === firstCard.pairId ? { ...c, isMatched: true } : c,
          ),
        )
        announce(`Match found!`)
      } else {
        playSound("incorrect")
        setMemoryCards((prev) =>
          prev.map((c) =>
            c.id === firstCard.id || c.id === secondCard.id
              ? { ...c, isFlipped: false }
              : c,
          ),
        )
        announce("No match, try again")
      }
      setFlippedCards([])
      setIsChecking(false)
    }, 1000)

    return () => clearTimeout(timer) // Cleanup timer on unmount
  }, [flippedCards])

  // Effect to check for game completion
  useEffect(() => {
    if (matchedPairs > 0 && matchedPairs === pairs) {
      setIsComplete(true)
      const endTime = new Date()
      const session: GameSession = {
        id: uuidv4(),
        deckId: deck.id,
        gameMode: "memory-match",
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        score: score,
        wasCompleted: true,
        moves: moves,
      }
      onGameEnd(session)
      announce("Congratulations! You matched all pairs.")
    }
  }, [matchedPairs, pairs, deck.id, startTime, score, moves, onGameEnd])

  // --- Render Logic ---
  if (isComplete) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-16"
      >
        <ConfettiEffect trigger={true} />
        <div className="mb-8">
          <div className="w-24 h-24 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Perfect Memory!
          </h2>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            You matched all {pairs} pairs in {moves} moves!
          </p>
        </div>
        <div className="max-w-md mx-auto mb-8">
          <ScoreDisplay
            score={score}
            accuracy={moves > 0 ? (pairs / moves) * 100 : 100}
            size="lg"
          />
        </div>
        <div className="flex justify-center space-x-4">
          <button
            onClick={resetGame}
            className="flex items-center space-x-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
          >
            <RotateCcw className="w-5 h-5" />
            <span>Play Again</span>
          </button>
          <Link
            to="/decks"
            className="flex items-center space-x-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            <Home className="w-5 h-5" />
            <span>Back to Decks</span>
          </Link>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Memory Match: {deck.name}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Match questions with their answers
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {moves}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Moves
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {matchedPairs}/{pairs}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Matches
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Game Board */}
      <div
        className={`grid gap-2 md:gap-3 mx-auto`}
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          maxWidth: `${cols * 120}px`,
        }}
        role="grid"
      >
        <AnimatePresence>
          {memoryCards.map((card) => (
            <motion.button
              key={card.id}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: card.isMatched ? 0.2 : 1 }}
              transition={{ duration: 0.3 }}
              onClick={() => handleCardClick(card)}
              disabled={isChecking || card.isFlipped || card.isMatched}
              className={`aspect-square rounded-lg p-2 font-medium transition-transform duration-300 preserve-3d ${
                !card.isMatched && !card.isFlipped ? "hover:scale-105" : ""
              }`}
              style={{
                transform: card.isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
              }}
            >
              <div
                className={`absolute inset-0 w-full h-full rounded-lg flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500 text-white backface-hidden`}
              >
                <Brain className="w-1/2 h-1/2 opacity-50" />
              </div>
              <div
                className={`absolute inset-0 w-full h-full rounded-lg flex items-center justify-center p-2 text-white rotate-y-180 backface-hidden ${
                  card.isQuestion
                    ? "bg-gradient-to-br from-blue-500 to-cyan-500"
                    : "bg-gradient-to-br from-green-500 to-emerald-500"
                }`}
              >
                <span className="text-center break-words text-sm md:text-base">
                  {card.content}
                </span>
              </div>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

/**
 * Main container component. It manages game lifecycle (starting/resetting)
 * by changing the `key` prop on the MemoryGame component.
 */
export function MemoryMatch({
  deck,
  difficulty = "easy",
  onComplete,
}: MemoryMatchProps) {
  const [gameKey, setGameKey] = useState(1)

  const gridSizes = {
    easy: { rows: 4, cols: 4, pairs: 8 },
    medium: { rows: 6, cols: 6, pairs: 18 },
    hard: { rows: 8, cols: 8, pairs: 32 },
  }

  const grid = gridSizes[difficulty]

  const usableCards = useMemo(
    () => deck.cards.filter((c) => c.type === "simple").slice(0, grid.pairs),
    [deck.cards, grid.pairs],
  )

  const resetGame = useCallback(() => setGameKey((k) => k + 1), [])
  const handleGameEnd = useCallback(
    (session: GameSession) => {
      if (onComplete) {
        onComplete(session)
      }
    },
    [onComplete],
  )

  if (usableCards.length < grid.pairs) {
    return (
      <div className="text-center py-16">
        <Brain className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Not Enough Cards
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          This deck needs at least {grid.pairs} simple cards for {difficulty}{" "}
          difficulty. It currently has {usableCards.length}.
        </p>
      </div>
    )
  }

  return (
    <MemoryGame
      key={gameKey}
      deck={deck}
      usableCards={usableCards}
      grid={grid}
      onGameEnd={handleGameEnd}
      resetGame={resetGame}
    />
  )
}
