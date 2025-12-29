'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import MemoryPuzzle from './MemoryPuzzle'
import Leaderboard from '../Leaderboard'
import type { MemoryConfig } from '@/types/games'
import type { Database } from '@/types/database'

type Player = Database['public']['Tables']['players']['Row']

interface MemoryWithLeaderboardProps {
  sessionId: string
  playerId: string
  players: Player[]
  memoryData: MemoryConfig
  isHost: boolean
  onContinue: () => void
  puzzleIndex?: number
  totalGames?: number
  roomId?: string
  nextGameName?: string
}

export default function MemoryWithLeaderboard({
  sessionId,
  playerId,
  players,
  memoryData,
  isHost,
  onContinue,
  puzzleIndex = 0,
  totalGames = 3,
  roomId,
  nextGameName,
}: MemoryWithLeaderboardProps) {
  const [isFinished, setIsFinished] = useState(false)
  const [allPlayersFinished, setAllPlayersFinished] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    const checkAllFinished = async () => {
      // Check if anyone has completed the memory game
      const { data: actions } = await supabase
        .from('player_actions')
        .select('player_id')
        .eq('session_id', sessionId)
        .eq('puzzle_index', puzzleIndex)
        .eq('action_type', 'memory_complete')

      if (!actions) return

      // For memory, if anyone completes it, everyone is done (collaborative game)
      const someoneFinished = actions.length > 0

      setAllPlayersFinished(someoneFinished)
    }

    checkAllFinished()

    // Poll every 2 seconds when waiting
    let pollInterval: NodeJS.Timeout | null = null
    if (isFinished && !allPlayersFinished) {
      pollInterval = setInterval(checkAllFinished, 2000)
    }

    // Subscribe to completion events
    const channel = supabase
      .channel(`memory_completion_${sessionId}`)
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
          if (action.action_type === 'memory_complete' && action.puzzle_index === puzzleIndex) {
            checkAllFinished()
          }
        }
      )
      .subscribe()

    return () => {
      if (pollInterval) clearInterval(pollInterval)
      supabase.removeChannel(channel)
    }
  }, [sessionId, players, isFinished, allPlayersFinished, puzzleIndex])

  const handleMemoryComplete = async () => {
    // Record completion in database
    const supabase = createClient()
    // @ts-ignore
    await supabase.from('player_actions').insert({
      session_id: sessionId,
      player_id: playerId,
      puzzle_index: puzzleIndex,
      action_type: 'memory_complete',
      data: {},
    })

    setIsFinished(true)
  }

  // Show leaderboard only when someone finished (collaborative game)
  if (allPlayersFinished) {
    return (
      <Leaderboard
        sessionId={sessionId}
        puzzleIndex={puzzleIndex}
        players={players}
        currentPlayerId={playerId}
        isHost={isHost}
        onContinue={onContinue}
        totalGames={totalGames}
        roomId={roomId}
        nextGameName={nextGameName}
      />
    )
  }

  // Show waiting screen if current player finished but broadcast not received yet
  if (isFinished) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-12 backdrop-blur-sm text-center space-y-6">
          <div className="text-6xl">⏳</div>
          <h2 className="text-3xl font-bold text-white">
            Memory abgeschlossen!
          </h2>
          <p className="text-xl text-gray-300">
            Warte einen Moment...
          </p>
        </div>
      </div>
    )
  }

  // Show memory game
  // Convert MemoryConfig to MemoryGameData format
  const memoryGameData = {
    title: 'Memory',
    description: 'Finde alle Paare!',
    pairs: memoryData.pairs.map(pair => ({
      emoji: pair.content,
      name: `Paar ${pair.id}`,
    })),
  }

  return (
    <MemoryPuzzle
      sessionId={sessionId}
      playerId={playerId}
      players={players}
      memoryData={memoryGameData}
      onComplete={handleMemoryComplete}
    />
  )
}
