'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import CountdownRhythmPuzzle from './CountdownRhythmPuzzle'
import Leaderboard from '../Leaderboard'
import type { CountdownRhythmConfig } from '@/types/games'
import type { Database } from '@/types/database'

type Player = Database['public']['Tables']['players']['Row']

interface CountdownRhythmWithLeaderboardProps {
  sessionId: string
  playerId: string
  players: Player[]
  gameData: CountdownRhythmConfig
  isHost: boolean
  onContinue: () => void
  totalGames?: number
  puzzleIndex?: number
  roomId?: string
  nextGameName?: string
}

export default function CountdownRhythmWithLeaderboard({
  sessionId,
  playerId,
  players,
  gameData,
  isHost,
  onContinue,
  totalGames = 3,
  puzzleIndex = 0,
  roomId,
  nextGameName,
}: CountdownRhythmWithLeaderboardProps) {
  const [isFinished, setIsFinished] = useState(false)
  const [allPlayersFinished, setAllPlayersFinished] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    const checkAllFinished = async () => {
      // Get all countdown rhythm actions for this session
      const { data: actions } = await supabase
        .from('player_actions')
        .select('player_id')
        .eq('session_id', sessionId)
        .eq('puzzle_index', puzzleIndex)
        .eq('action_type', 'countdown_rhythm_stop')

      if (!actions) return

      // Get unique player IDs who have completed
      const playersFinished = new Set(actions.map((action: any) => action.player_id))

      // Check if all players have finished (each player should have exactly 1 action)
      const allFinished = players.every((player) => playersFinished.has(player.id))

      setAllPlayersFinished(allFinished)
    }

    // Check initially and set up polling as fallback
    checkAllFinished()

    // Poll every 2 seconds when waiting
    let pollInterval: NodeJS.Timeout | null = null
    if (isFinished && !allPlayersFinished) {
      pollInterval = setInterval(checkAllFinished, 2000)
    }

    // Subscribe to new actions
    const channel = supabase
      .channel(`countdown_rhythm_completion_${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'player_actions',
          filter: `session_id=eq.${sessionId}`,
        },
        () => {
          checkAllFinished()
        }
      )
      .subscribe()

    return () => {
      if (pollInterval) clearInterval(pollInterval)
      supabase.removeChannel(channel)
    }
  }, [sessionId, players, isFinished, allPlayersFinished, puzzleIndex])

  const handleGameComplete = () => {
    setIsFinished(true)
  }

  // Show leaderboard only when all players are finished
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

  // Show waiting screen if current player finished but others haven't
  if (isFinished) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a0a0a] via-[#1a1a2e] to-[#0a0a0a] flex items-center justify-center p-4">
        <div className="max-w-3xl w-full space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-12 backdrop-blur-sm text-center space-y-6">
            <div className="text-6xl">⏳</div>
            <h2 className="text-3xl font-bold text-white">
              Spiel abgeschlossen!
            </h2>
            <p className="text-xl text-gray-300">
              Warte auf die anderen Spieler...
            </p>
            <div className="pt-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/20 rounded-lg border border-blue-500/30">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-blue-300">Andere Spieler spielen noch</span>
              </div>
            </div>
            {/* Show player progress */}
            <div className="mt-8 space-y-2">
              {players.map((player) => {
                const isCurrentPlayer = player.id === playerId
                return (
                  <div
                    key={player.id}
                    className="flex items-center justify-between bg-white/5 rounded-lg px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{player.avatar || '👤'}</span>
                      <span className="text-white">
                        {player.name}
                        {isCurrentPlayer && ' (Du)'}
                      </span>
                    </div>
                    <div className="text-green-400">✓</div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show game if not finished yet
  return (
    <CountdownRhythmPuzzle
      sessionId={sessionId}
      playerId={playerId}
      players={players}
      gameData={gameData}
      onComplete={handleGameComplete}
      puzzleIndex={puzzleIndex}
    />
  )
}
