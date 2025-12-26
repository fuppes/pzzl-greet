'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { createSessionData, createPlayerData } from '@/lib/game/session'
import type { Database } from '@/types/database'

type Room = Database['public']['Tables']['rooms']['Row']

interface RoomLobbyProps {
  room: Room
}

export default function RoomLobby({ room }: RoomLobbyProps) {
  const [playerName, setPlayerName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!playerName.trim()) {
      setError('Bitte gib deinen Namen ein')
      return
    }

    setIsCreating(true)
    setError(null)

    try {
      const supabase = createClient()

      // Create new game session
      const sessionData = createSessionData({ roomId: room.id })
      const { data: session, error: sessionError } = await supabase
        .from('game_sessions')
        .insert(sessionData)
        .select()
        .single()

      if (sessionError) throw sessionError

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

      // Update session with host player ID
      await supabase
        .from('game_sessions')
        .update({ host_player_id: player.id })
        .eq('id', session.id)

      // Store player info in localStorage
      localStorage.setItem('player_id', player.id)
      localStorage.setItem('player_name', player.name)
      localStorage.setItem('session_id', session.id)

      // Redirect to game session
      window.location.href = `/session/${session.session_code}`
    } catch (err) {
      console.error('Error creating session:', err)
      setError('Fehler beim Erstellen der Session. Bitte versuche es erneut.')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-br from-[#0a0a0a] via-[#1a1a2e] to-[#0a0a0a]">
      <div className="max-w-2xl w-full space-y-8">
        {/* Room Header */}
        <div className="text-center space-y-4">
          <h1 className="text-5xl md:text-6xl font-bold">
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              {room.name}
            </span>
          </h1>
          {room.description && (
            <p className="text-xl text-gray-400 max-w-xl mx-auto">
              {room.description}
            </p>
          )}
        </div>

        {/* Join Form */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
          <form onSubmit={handleCreateSession} className="space-y-6">
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
                disabled={isCreating}
                autoComplete="off"
                maxLength={50}
              />
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={!playerName.trim() || isCreating}
              className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg shadow-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isCreating ? 'Erstelle Session...' : 'Spiel starten'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-sm text-gray-400 text-center">
              Ein neuer Raum wird erstellt. Andere können über den Session-Code beitreten.
            </p>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-white/5 border border-white/10 backdrop-blur-sm text-center">
            <div className="text-2xl mb-2">🎮</div>
            <p className="text-sm text-gray-400">3 Rätsel warten</p>
          </div>
          <div className="p-4 rounded-lg bg-white/5 border border-white/10 backdrop-blur-sm text-center">
            <div className="text-2xl mb-2">👥</div>
            <p className="text-sm text-gray-400">Spielt zusammen</p>
          </div>
          <div className="p-4 rounded-lg bg-white/5 border border-white/10 backdrop-blur-sm text-center">
            <div className="text-2xl mb-2">🎁</div>
            <p className="text-sm text-gray-400">Grüße am Ende</p>
          </div>
        </div>
      </div>
    </main>
  )
}
