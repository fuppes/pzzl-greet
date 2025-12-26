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
}

interface FinalLeaderboardProps {
  sessionId: string
  players: Player[]
  currentPlayerId: string
  isHost: boolean
  onContinue?: () => void
}

export default function FinalLeaderboard({
  sessionId,
  players,
  currentPlayerId,
  isHost,
  onContinue,
}: FinalLeaderboardProps) {
  const [playerScores, setPlayerScores] = useState<PlayerScore[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    const loadScores = async () => {
      // Get ALL actions from ALL puzzles for final cumulative scoring
      const { data: actions } = await supabase
        .from('player_actions')
        .select('*')
        .eq('session_id', sessionId)
        .in('action_type', ['quiz_answer', 'memory_match', 'memory_mismatch', 'word_answer'])

      if (!actions) {
        setIsLoading(false)
        return
      }

      // Calculate cumulative scores per player across all puzzles
      const scores: Record<string, number> = {}

      actions.forEach((action: any) => {
        const data = action.data as any
        if (!scores[action.player_id]) {
          scores[action.player_id] = 0
        }
        // Add points (can be negative for wrong memory matches)
        const points = data.points || 0
        scores[action.player_id] = Math.max(0, scores[action.player_id] + points) // Min 0
      })

      console.log('Final leaderboard scores:', scores)

      // Map to player scores
      const playerScoresData: PlayerScore[] = players.map((player) => {
        return {
          playerId: player.id,
          playerName: player.name,
          playerColor: player.color || '#3b82f6',
          score: scores[player.id] || 0,
        }
      })

      // Sort by score descending
      playerScoresData.sort((a, b) => b.score - a.score)

      setPlayerScores(playerScoresData)
      setIsLoading(false)
    }

    loadScores()
  }, [sessionId, players])

  const currentPlayerData = playerScores.find((p) => p.playerId === currentPlayerId)
  const currentPlayerRank = playerScores.findIndex((p) => p.playerId === currentPlayerId) + 1
  const winner = playerScores[0]

  if (isLoading) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm text-center">
        <p className="text-gray-400">Berechne Endergebnisse...</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Celebration Header */}
      <div className="text-center space-y-6 py-8">
        <div className="text-6xl animate-bounce">🎉</div>
        <h2 className="text-5xl font-bold">
          <span className="bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
            Geschafft!
          </span>
        </h2>
        <p className="text-2xl text-gray-300">Alle Rätsel gelöst!</p>
      </div>

      {/* Winner Announcement */}
      {winner && (
        <div className="bg-gradient-to-r from-yellow-500/20 via-orange-500/20 to-red-500/20 border-2 border-yellow-500/50 rounded-2xl p-8 text-center">
          <p className="text-lg text-gray-300 mb-2">Gewinner</p>
          <div className="flex items-center justify-center gap-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-white font-semibold text-2xl"
              style={{ backgroundColor: winner.playerColor }}
            >
              {winner.playerName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-3xl font-bold text-white">{winner.playerName}</p>
              <p className="text-4xl font-bold text-yellow-400">{winner.score} Punkte</p>
            </div>
          </div>
          <p className="text-5xl mt-4">🏆</p>
        </div>
      )}

      {/* Current Player Highlight */}
      {currentPlayerData && currentPlayerRank > 1 && (
        <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-2 border-blue-500/50 rounded-xl p-6 text-center">
          <p className="text-gray-300 mb-2">Dein Endergebnis</p>
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

      {/* Final Leaderboard Table */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
        <h3 className="text-2xl font-bold text-white mb-4 text-center">Endstand</h3>
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
                {index === 0 && <span className="text-3xl">🥇</span>}
                {index === 1 && <span className="text-3xl">🥈</span>}
                {index === 2 && <span className="text-3xl">🥉</span>}
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

      {/* Continue Button (Host only) */}
      {isHost && onContinue && (
        <button
          onClick={onContinue}
          className="w-full px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg shadow-purple-500/50"
        >
          Zu den Silvestergrüßen 🎊
        </button>
      )}

      {/* Waiting Message (for non-hosts) */}
      {!isHost && (
        <div className="text-center p-4 bg-white/5 rounded-lg border border-white/10">
          <p className="text-gray-400">
            Warte darauf, dass der Host zu den Grüßen weitergeht...
          </p>
        </div>
      )}
    </div>
  )
}
