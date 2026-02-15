'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database'
import { logError } from '@/lib/error-handler'
import { getLeaderboardScores, displayScore } from '@/lib/scoring'

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
  totalGames: number
  roomId?: string
  nextGameName?: string
}

// ✅ Passe das ggf. an deine echte Route an:
const GREETING_PATH = '/greeting'

export default function Leaderboard({
  sessionId,
  puzzleIndex,
  players,
  currentPlayerId,
  isHost,
  onContinue,
  totalGames,
  roomId,
  nextGameName,
}: LeaderboardProps) {
  const router = useRouter()

  const [playerScores, setPlayerScores] = useState<PlayerScore[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [selectedEmoji, setSelectedEmoji] = useState('')
  const [messageSent, setMessageSent] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)

  const isLastGame = puzzleIndex === totalGames - 1

  const buildGreetingUrl = useCallback(() => {
    // Wenn du auf der GreetingPage Query-Params nutzt, ist das praktisch.
    const params = new URLSearchParams()
    params.set('sessionId', sessionId)
    params.set('playerId', currentPlayerId)
    if (roomId) params.set('roomId', roomId)
    return `${GREETING_PATH}?${params.toString()}`
  }, [sessionId, currentPlayerId, roomId])

  useEffect(() => {
    const supabase = createClient()

    const loadScores = async () => {
      const scores = await getLeaderboardScores(sessionId, puzzleIndex)

      const playerScoresData: PlayerScore[] = players.map((player) => {
        const playerData = scores[player.id]
        return {
          playerId: player.id,
          playerName: player.name,
          playerColor: player.color || '#3b82f6',
          score: displayScore(playerData?.score ?? 0),
          isFinished: true,
        }
      })

      playerScoresData.sort((a, b) => b.score - a.score)

      setPlayerScores(playerScoresData)
      setIsLoading(false)
    }

    loadScores()

    // Score updates
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

  /**
   * ✅ FIX: Navigation-Sync für ALLE Spieler
   * Host schreibt am Ende "navigate -> greeting"
   * Alle Clients hören drauf und leiten weiter.
   */
  useEffect(() => {
    const supabase = createClient()

    const navChannel = supabase
      .channel(`nav_${sessionId}`, {
        config: {
          broadcast: { self: true }
        }
      })
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'player_actions',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const action: any = payload.new
          if (action?.action_type === 'navigate' && action?.data?.to === 'greeting') {
            console.log('📡 Navigation event received:', action)
            setIsRedirecting(true)
            router.replace(buildGreetingUrl())
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Nav channel subscription status:', status)
      })

    // Fallback: Check for navigate action periodically if last game
    let intervalId: NodeJS.Timeout | null = null
    if (isLastGame && !isHost) {
      intervalId = setInterval(async () => {
        const { data } = await supabase
          .from('player_actions')
          .select('*')
          .eq('session_id', sessionId)
          .eq('action_type', 'navigate')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (data && (data as any).data?.to === 'greeting') {
          console.log('📡 Navigate action found via polling')
          setIsRedirecting(true)
          router.replace(buildGreetingUrl())
          if (intervalId) clearInterval(intervalId)
        }
      }, 2000) // Check every 2 seconds
    }

    return () => {
      supabase.removeChannel(navChannel)
      if (intervalId) clearInterval(intervalId)
    }
  }, [sessionId, router, buildGreetingUrl, isLastGame, isHost])

  const allFinished = playerScores.every((p) => p.isFinished)
  const currentPlayerData = playerScores.find((p) => p.playerId === currentPlayerId)
  const currentPlayerRank = playerScores.findIndex((p) => p.playerId === currentPlayerId) + 1

  const emojis = ['🎉', '❤️', '🔥', '⭐', '🎊', '👏', '🙌', '💯', '✨', '🎈', '🌟', '💝']

  const handleSendMessage = async () => {
    if (!message.trim() && !selectedEmoji) return
    if (!roomId) return

    const supabase = createClient()

    const { error } = await supabase
      .from('player_messages')
      // @ts-expect-error
      .insert({
        session_id: sessionId,
        player_id: currentPlayerId,
        room_id: roomId,
        message: message.trim() || '(Nur Emoji)',
        emoji: selectedEmoji || null,
      })

    if (error) {
      logError(error, 'Leaderboard: sendMessage')
      alert('Fehler beim Senden der Nachricht')
      return
    }

    setMessageSent(true)
    setMessage('')
    setSelectedEmoji('')
  }

  const handleContinue = async () => {
    if (!allFinished) return

    // Normaler Flow (nicht letztes Spiel): einfach onContinue (Host-only) verwenden
    if (!isLastGame) {
      onContinue?.()
      return
    }

    // ✅ Letztes Spiel: Host broadcastet Navigation -> greeting
    // Damit werden ALLE Spieler weitergeleitet (nicht nur der Host).
    try {
      setIsRedirecting(true)
      const supabase = createClient()

      await supabase.from('player_actions').insert({
        session_id: sessionId,
        player_id: currentPlayerId,
        puzzle_index: puzzleIndex,
        action_type: 'navigate',
        data: { to: 'greeting' },
      } as any)

      // Optional: Host kann zusätzlich direkt navigieren
      // (Realtime kommt meist sofort, aber so ist es „sicher“)
      router.replace(buildGreetingUrl())
    } catch (err) {
      logError(err as Error, 'Leaderboard: navigateToGreeting')
      // Fallback: wenigstens Host kommt weiter
      router.replace(buildGreetingUrl())
    }
  }

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
          {isRedirecting
            ? 'Einen Moment… du wirst weitergeleitet 👀'
            : allFinished
              ? 'Alle haben fertig gespielt!'
              : 'Warte auf andere Spieler...'}
        </p>

        {/* Refresh hint */}
        <div className="mx-auto max-w-2xl text-left bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
          <p className="text-white font-semibold mb-1">Falls du hier festhängst:</p>
          <p className="text-gray-200 text-sm leading-relaxed">
            Diese Ansicht aktualisiert sich nicht automatisch. Bitte{' '}
            <span className="font-semibold">einmal die Seite neu laden (Refresh)</span>, am besten{' '}
            <span className="font-semibold">
              direkt nachdem der Host auf „Weiter“ gedrückt hat
            </span>
            .
          </p>

          <div className="mt-3 grid gap-2 text-sm text-gray-200">
            <div className="flex gap-2">
              <span className="text-gray-400">•</span>
              <span>
                <span className="font-semibold">Am PC/Mac:</span> Drücke{' '}
                <span className="font-semibold">F5</span> oder{' '}
                <span className="font-semibold">Strg + R</span> (Windows) /{' '}
                <span className="font-semibold">⌘ + R</span> (Mac).
              </span>
            </div>
            <div className="flex gap-2">
              <span className="text-gray-400">•</span>
              <span>
                <span className="font-semibold">Im Browser:</span> Klicke auf{' '}
                <span className="font-semibold">↻</span> neben der Adresszeile.
              </span>
            </div>
            <div className="flex gap-2">
              <span className="text-gray-400">•</span>
              <span>
                <span className="font-semibold">Am Handy/Tablet:</span> Ziehe die Seite kurz{' '}
                <span className="font-semibold">nach unten</span> (Pull-to-refresh).
              </span>
            </div>
          </div>
        </div>
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
                <p className="text-sm text-gray-400">{player.isFinished ? '✓ Fertig' : '⏳ Spielt noch...'}</p>
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

      {/* Next Game Preview */}
      {allFinished && nextGameName && !isLastGame && (
        <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-2 border-purple-500/50 rounded-xl p-6 text-center">
          <p className="text-gray-300 mb-2">Als Nächstes</p>
          <p className="text-2xl font-bold text-white">{nextGameName}</p>
        </div>
      )}

      {/* Continue Button (Host only, when all finished) */}
      {allFinished && isHost && (
        <button
          onClick={handleContinue}
          disabled={isRedirecting}
          className="w-full px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg shadow-green-500/50 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
        >
          {isLastGame
            ? 'Zur Greetings-Seite 🎆'
            : `Weiter${nextGameName ? `: ${nextGameName}` : ''}`}
        </button>
      )}

      {/* Waiting Message (for non-hosts) */}
      {allFinished && !isHost && (
        <div className="text-center p-4 bg-white/5 rounded-lg border border-white/10">
          <p className="text-gray-400">
            {isRedirecting
              ? 'Du wirst gleich weitergeleitet…'
              : isLastGame
                ? 'Warte kurz – der Host bringt uns gleich zur Greetings-Seite 🎆'
                : 'Warte darauf, dass der Host zum nächsten Spiel weitergeht...'}
          </p>
        </div>
      )}
    </div>
  )
}
