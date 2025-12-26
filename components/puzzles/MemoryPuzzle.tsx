'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { generateMemoryCards, type MemoryGameData, type MemoryCard } from '@/lib/puzzles/memory-data'
import type { Database } from '@/types/database'

type Player = Database['public']['Tables']['players']['Row']

interface MemoryPuzzleProps {
  sessionId: string
  playerId: string
  players: Player[]
  memoryData: MemoryGameData
  onComplete: () => void
}

export default function MemoryPuzzle({
  sessionId,
  playerId,
  players,
  memoryData,
  onComplete,
}: MemoryPuzzleProps) {
  const [cards, setCards] = useState<MemoryCard[]>([])
  const [flippedCards, setFlippedCards] = useState<string[]>([])
  const [matchedPairs, setMatchedPairs] = useState<string[]>([])
  const [isChecking, setIsChecking] = useState(false)
  const [moves, setMoves] = useState(0)

  // Initialize cards
  useEffect(() => {
    const generatedCards = generateMemoryCards(memoryData.pairs)
    setCards(generatedCards)
  }, [memoryData])

  // Subscribe to card flips from other players
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`memory_${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'player_actions',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const action = payload.new as any
          if (action.action_type === 'memory_flip' && action.puzzle_index === 1) {
            const data = action.data as { cardId: string }
            handleRemoteFlip(data.cardId)
          } else if (action.action_type === 'memory_match' && action.puzzle_index === 1) {
            const data = action.data as { pairId: string }
            setMatchedPairs((prev) => [...new Set([...prev, data.pairId])])
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [sessionId])

  const handleRemoteFlip = (cardId: string) => {
    setFlippedCards((prev) => {
      if (prev.includes(cardId) || prev.length >= 2) return prev
      return [...prev, cardId]
    })
  }

  const handleCardClick = async (cardId: string) => {
    if (isChecking || flippedCards.includes(cardId) || matchedPairs.some((pairId) =>
      cards.find((c) => c.id === cardId)?.pairId === pairId
    )) {
      return
    }

    const newFlippedCards = [...flippedCards, cardId]
    setFlippedCards(newFlippedCards)

    // Record flip in database
    const supabase = createClient()
    // @ts-ignore
    await supabase.from('player_actions').insert({
      session_id: sessionId,
      player_id: playerId,
      puzzle_index: 1,
      action_type: 'memory_flip',
      data: { cardId },
    })

    setMoves((prev) => prev + 1)

    // Check for match when two cards are flipped
    if (newFlippedCards.length === 2) {
      setIsChecking(true)

      const card1 = cards.find((c) => c.id === newFlippedCards[0])
      const card2 = cards.find((c) => c.id === newFlippedCards[1])

      setTimeout(async () => {
        if (card1 && card2 && card1.pairId === card2.pairId) {
          // Match found! +10 points
          setMatchedPairs((prev) => [...prev, card1.pairId])

          // Record match in database with points
          // @ts-ignore
          await supabase.from('player_actions').insert({
            session_id: sessionId,
            player_id: playerId,
            puzzle_index: 1,
            action_type: 'memory_match',
            data: {
              pairId: card1.pairId,
              isCorrect: true,
              points: 10,
            },
          })
        } else {
          // No match - record penalty (-2 points)
          // @ts-ignore
          await supabase.from('player_actions').insert({
            session_id: sessionId,
            player_id: playerId,
            puzzle_index: 1,
            action_type: 'memory_mismatch',
            data: {
              isCorrect: false,
              points: -2,
            },
          })
        }

        setFlippedCards([])
        setIsChecking(false)
      }, 1000)
    }
  }

  const isCardFlipped = (cardId: string) => {
    const card = cards.find((c) => c.id === cardId)
    return flippedCards.includes(cardId) || (card && matchedPairs.includes(card.pairId))
  }

  const isGameComplete = matchedPairs.length === memoryData.pairs.length

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold text-white">{memoryData.title}</h2>
        <p className="text-gray-400">{memoryData.description}</p>
        <div className="flex justify-center gap-8 text-sm">
          <div className="px-4 py-2 bg-white/10 rounded-lg">
            <span className="text-gray-400">Paare:</span>{' '}
            <span className="text-white font-semibold">
              {matchedPairs.length} / {memoryData.pairs.length}
            </span>
          </div>
          <div className="px-4 py-2 bg-white/10 rounded-lg">
            <span className="text-gray-400">Züge:</span>{' '}
            <span className="text-white font-semibold">{moves}</span>
          </div>
        </div>
      </div>

      {/* Memory Grid */}
      <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
        {cards.map((card) => (
          <button
            key={card.id}
            onClick={() => handleCardClick(card.id)}
            disabled={isChecking || isCardFlipped(card.id)}
            className={`aspect-square rounded-xl border-2 transition-all duration-300 transform hover:scale-105 ${
              isCardFlipped(card.id)
                ? 'bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-blue-500/50'
                : 'bg-white/5 border-white/10 hover:border-white/30'
            } disabled:cursor-not-allowed`}
          >
            <div className="text-5xl md:text-6xl">
              {isCardFlipped(card.id) ? card.emoji : '❓'}
            </div>
          </button>
        ))}
      </div>

      {/* Complete Button */}
      {isGameComplete && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm text-center space-y-4">
          <div className="text-6xl">🎉</div>
          <h3 className="text-2xl font-bold text-white">Alle Paare gefunden!</h3>
          <p className="text-gray-400">Ihr habt {moves} Züge gebraucht</p>
          <button
            onClick={onComplete}
            className="mt-4 px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg shadow-green-500/50"
          >
            Memory abschließen
          </button>
        </div>
      )}
    </div>
  )
}
