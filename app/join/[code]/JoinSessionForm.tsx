'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { createPlayerData } from '@/lib/game/session'
import type { Database } from '@/types/database'
import { getUserFriendlyMessage, logError } from '@/lib/error-handler'

type GameSession = Database['public']['Tables']['game_sessions']['Row'] & {
  rooms: Database['public']['Tables']['rooms']['Row'] | null
}

interface JoinSessionFormProps {
  session: GameSession
}

export default function JoinSessionForm({ session }: JoinSessionFormProps) {
  const [playerName, setPlayerName] = useState('')
  const [isJoining, setIsJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!playerName.trim()) {
      setError('Bitte gib deinen Namen ein')
      return
    }

    setIsJoining(true)
    setError(null)

    try {
      const supabase = createClient()

      // Create player
      const playerData = createPlayerData({
        sessionId: session.id,
        name: playerName.trim(),
      })
      const { data: player, error: playerError } = await supabase
        .from('players')
        .insert(playerData)
        .select()
        .single()

      if (playerError) throw playerError

      // Store player info in localStorage
      localStorage.setItem('player_id', player.id)
      localStorage.setItem('player_name', player.name)
      localStorage.setItem('session_id', session.id)

      // Redirect to game session
      window.location.href = `/session/${session.session_code}`
    } catch (err) {
      logError(err as Error, 'JoinSessionForm: handleJoin')
      setError(getUserFriendlyMessage(err as Error))
    } finally {
      setIsJoining(false)
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-br from-[#0a0a0a] via-[#1a1a2e] to-[#0a0a0a]">
      <div className="max-w-2xl w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-5xl md:text-6xl font-bold">
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              {session.rooms?.name}
            </span>
          </h1>
          <p className="text-xl text-gray-400">
            Du wurdest eingeladen, diesem Spiel beizutreten!
          </p>
          <div className="flex items-center justify-center gap-2">
            <span className="text-gray-400">Session Code:</span>
            <code className="px-4 py-2 bg-white/10 rounded-lg text-xl font-mono text-white border border-white/20">
              {session.session_code}
            </code>
          </div>
        </div>

        {/* Join Form */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
          <form onSubmit={handleJoin} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="playerName" className="block text-sm font-medium text-gray-300">
                Dein Name
              </label>
              <input
                id="playerName"
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Wie heißt du?"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                disabled={isJoining}
                autoComplete="off"
                maxLength={50}
                autoFocus
              />
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={!playerName.trim() || isJoining}
              className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg shadow-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isJoining ? 'Trete bei...' : 'Spiel beitreten'}
            </button>
          </form>
        </div>

        {/* Session Status */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6 text-center">
          <p className="text-blue-300">
            {session.status === 'waiting' && '🎮 Warte auf Start...'}
            {session.status === 'in_progress' && '⚡ Spiel läuft bereits!'}
          </p>
        </div>
      </div>
    </main>
  )
}
