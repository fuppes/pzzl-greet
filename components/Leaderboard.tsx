'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database'

type Player = Database['public']['Tables']['players']['Row']

interface PlayerScore {
  playerId: string
  playerName: string
  playerColor: string
  score: number
  isFinished: boolean
}

interface LeaderboardProps {
  sessionId: string
  puzzleIndex: number
  players: Player[]
  currentPlayerId: string
  isHost: boolean
  onContinue?: () => void
}

export default function Leaderboard({
  sessionId,
  puzzleIndex,
  players,
  currentPlayerId,
  isHost,
  onContinue,
}: LeaderboardProps) {
  const [playerScores, setPlayerScores] = useState<PlayerScore[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    const loadScores = async () => {
      // Get ALL actions up to and including current puzzle for cumulative scoring
      const { data: actions } = await supabase
        .from('player_actions')
        .select('*')
        .eq('session_id', sessionId)
        .lte('puzzle_index', puzzleIndex) // All puzzles up to current one
        .in('action_type', ['quiz_answer', 'memory_match', 'memory_mismatch', 'word_answer']) // All scoring actions

      if (!actions) {
        setIsLoading(false)
        return
      }

      // Calculate cumulative scores per player across all puzzles
      const scores: Record<string, { score: number; questionCount: number }> = {}

      actions.forEach((action: any) => {
        const data = action.data as any
        if (!scores[action.player_id]) {
          scores[action.player_id] = { score: 0, questionCount: 0 }
        }
        // Add points (can be negative for wrong memory matches)
        const points = data.points || 0
        scores[action.player_id].score = Math.max(0, scores[action.player_id].score + points) // Min 0
        scores[action.player_id].questionCount += 1
      })

      console.log('Cumulative leaderboard scores (up to puzzle', puzzleIndex + '):', scores)

      // Map to player scores
      const playerScoresData: PlayerScore[] = players.map((player) => {
        const playerData = scores[player.id] || { score: 0, questionCount: 0 }
        return {
          playerId: player.id,
          playerName: player.name,
          playerColor: player.color || '#3b82f6',
          score: playerData.score,
          isFinished: true, // Always true - we only show leaderboard when all players finished
        }
      })

      // Sort by score descending
      playerScoresData.sort((a, b) => b.score - a.score)

      setPlayerScores(playerScoresData)
      setIsLoading(false)
    }

    loadScores()

    // Subscribe to new answers
    const channel = supabase
      .channel(`leaderboard_${sessionId}_${puzzleIndex}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'player_actions',
          filter: `session_id=eq.${sessionId}`,
        },
        () => {
          loadScores()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [sessionId, puzzleIndex, players])

  const allFinished = playerScores.every((p) => p.isFinished)
  const currentPlayerData = playerScores.find((p) => p.playerId === currentPlayerId)
  const currentPlayerRank = playerScores.findIndex((p) => p.playerId === currentPlayerId) + 1

  if (isLoading) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm text-center">
        <p className="text-gray-400">Lade Ergebnisse...</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-bold">
          <span className="bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
            Leaderboard
          </span>
        </h2>
        <p className="text-xl text-gray-300">
          {allFinished ? 'Alle haben fertig gespielt!' : 'Warte auf andere Spieler...'}
        </p>
      </div>

      {/* Current Player Highlight */}
      {currentPlayerData && (
        <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-2 border-blue-500/50 rounded-xl p-6 text-center">
          <p className="text-gray-300 mb-2">Dein Ergebnis</p>
          <div className="flex items-center justify-center gap-6">
            <div>
              <p className="text-4xl font-bold text-white">{currentPlayerData.score}</p>
              <p className="text-sm text-gray-400">Punkte</p>
            </div>
            <div className="h-12 w-px bg-white/20"></div>
            <div>
              <p className="text-4xl font-bold text-white">#{currentPlayerRank}</p>
              <p className="text-sm text-gray-400">Platz</p>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard Table */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
        <div className="space-y-3">
          {playerScores.map((player, index) => (
            <div
              key={player.playerId}
              className={`flex items-center gap-4 p-4 rounded-lg transition-all ${
                player.playerId === currentPlayerId
                  ? 'bg-blue-500/20 border-2 border-blue-500/50'
                  : 'bg-white/5 border border-white/10'
              }`}
            >
              {/* Rank */}
              <div className="flex-shrink-0 w-12 text-center">
                {index === 0 && (
                  <span className="text-3xl">🥇</span>
                )}
                {index === 1 && (
                  <span className="text-3xl">🥈</span>
                )}
                {index === 2 && (
                  <span className="text-3xl">🥉</span>
                )}
                {index > 2 && (
                  <span className="text-2xl font-bold text-gray-400">#{index + 1}</span>
                )}
              </div>

              {/* Player Avatar */}
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-lg"
                style={{ backgroundColor: player.playerColor }}
              >
                {player.playerName.charAt(0).toUpperCase()}
              </div>

              {/* Player Name */}
              <div className="flex-1 min-w-0">
                <p className="text-lg font-semibold text-white truncate">
                  {player.playerName}
                  {player.playerId === currentPlayerId && (
                    <span className="ml-2 text-sm text-blue-400">(Du)</span>
                  )}
                </p>
                <p className="text-sm text-gray-400">
                  {player.isFinished ? '✓ Fertig' : '⏳ Spielt noch...'}
                </p>
              </div>

              {/* Score */}
              <div className="text-right">
                <p className="text-2xl font-bold text-white">{player.score}</p>
                <p className="text-xs text-gray-400">Punkte</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Continue Button (Host only, when all finished) */}
      {allFinished && isHost && onContinue && (
        <button
          onClick={() => {
            console.log('Continue button clicked!')
            onContinue()
          }}
          className="w-full px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg shadow-green-500/50"
        >
          {puzzleIndex === 2 ? 'Zum Endergebnis' : 'Weiter zum nächsten Rätsel'}
        </button>
      )}

      {/* Waiting Message (for non-hosts) */}
      {allFinished && !isHost && (
        <div className="text-center p-4 bg-white/5 rounded-lg border border-white/10">
          <p className="text-gray-400">
            {puzzleIndex === 2
              ? 'Warte darauf, dass der Host zum Endergebnis weitergeht...'
              : 'Warte darauf, dass der Host zum nächsten Rätsel weitergeht...'
            }
          </p>
        </div>
      )}
    </div>
  )
}
