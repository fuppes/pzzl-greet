'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { QRCodeSVG } from 'qrcode.react'
import QuizWithLeaderboard from '@/components/puzzles/QuizWithLeaderboard'
import MemoryWithLeaderboard from '@/components/puzzles/MemoryWithLeaderboard'
import WordWithLeaderboard from '@/components/puzzles/WordWithLeaderboard'
import ChatTypingRaceWithLeaderboard from '@/components/puzzles/ChatTypingRaceWithLeaderboard'
import CountdownRhythmWithLeaderboard from '@/components/puzzles/CountdownRhythmWithLeaderboard'
import EmojiCatcherWithLeaderboard from '@/components/puzzles/EmojiCatcherWithLeaderboard'
import FinalLeaderboard from '@/components/FinalLeaderboard'
import GreetingPage from '@/components/GreetingPage'
import ProgressBar from '@/components/ProgressBar'
import ShakeCelebration from '@/components/ShakeCelebration'
import type { Database } from '@/types/database'
import type { RoomGameQueueWithGame } from '@/types/games'
import { logError } from '@/lib/error-handler'

type GameSession = Database['public']['Tables']['game_sessions']['Row'] & {
  rooms: Database['public']['Tables']['rooms']['Row'] | null
  game_queue?: RoomGameQueueWithGame[]
}

type Player = Database['public']['Tables']['players']['Row']

interface GameSessionProps {
  session: GameSession
}

export default function GameSession({ session: initialSession }: GameSessionProps) {
  const [session, setSession] = useState<GameSession>(initialSession)
  const [players, setPlayers] = useState<Player[]>([])
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showGreeting, setShowGreeting] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const [localNetworkIp, setLocalNetworkIp] = useState<string | null>(null)

  // Detect local network IP using WebRTC
  useEffect(() => {
    const detectLocalIp = async () => {
      try {
        const pc = new RTCPeerConnection({ iceServers: [] })
        pc.createDataChannel('')

        const offer = await pc.createOffer()
        await pc.setLocalDescription(offer)

        pc.onicecandidate = (ice) => {
          if (!ice || !ice.candidate || !ice.candidate.candidate) return

          const candidate = ice.candidate.candidate
          const ipMatch = /([0-9]{1,3}(\.[0-9]{1,3}){3})/.exec(candidate)

          if (ipMatch && ipMatch[1]) {
            const ip = ipMatch[1]
            // Filter out localhost and special IPs
            if (!ip.startsWith('127.') && !ip.startsWith('0.')) {
              setLocalNetworkIp(ip)
              pc.close()
            }
          }
        }
      } catch (err) {
        console.log('Could not detect local IP:', err)
      }
    }

    if (typeof window !== 'undefined') {
      detectLocalIp()
    }
  }, [])

  // Helper to get the correct base URL for QR codes on development/test systems
  const getBaseUrl = () => {
    if (typeof window === 'undefined') return ''

    const hostname = window.location.hostname
    const isDevelopment = hostname === 'localhost' || hostname === '127.0.0.1'
    const port = window.location.port
    const protocol = window.location.protocol

    // If on localhost and we detected a network IP, use that
    if (isDevelopment && localNetworkIp) {
      return `${protocol}//${localNetworkIp}${port ? `:${port}` : ''}`
    }

    // Otherwise use current origin
    return window.location.origin
  }

  // ✅ keep latest status for polling guard without stale closure issues
  const sessionStatusRef = useRef<GameSession['status']>(initialSession.status)
  useEffect(() => {
    sessionStatusRef.current = session.status
  }, [session.status])

  // Get games from queue
  const gameQueue = (session as any).game_queue || []
  const totalGames = gameQueue.length

  // Get next game name
  const nextGameIndex = session.current_puzzle_index + 1
  const nextGame = nextGameIndex < gameQueue.length ? gameQueue[nextGameIndex] : null
  const nextGameName = nextGame ? (nextGame.games as any)?.name : undefined

  useEffect(() => {
    const supabase = createClient()

    // Get current player from localStorage
    const playerId = localStorage.getItem('player_id')

    // If no player ID, redirect to join page
    if (!playerId) {
      window.location.href = `/join/${session.session_code}`
      return
    }

    const loadPlayers = async () => {
      const { data: playersData, error } = await supabase
        .from('players')
        .select('*')
        .eq('session_id', session.id)
        .order('joined_at', { ascending: true })
        .returns<Player[]>()

      if (error) {
        logError(error, 'GameSession: loadPlayers')
        setIsLoading(false)
        return
      }

      const list = playersData ?? []
      setPlayers(list)

      const player = list.find((p) => p.id === playerId)
      if (player) {
        setCurrentPlayer(player)
      } else {
        window.location.href = `/join/${session.session_code}`
        return
      }

      setIsLoading(false)
    }

    loadPlayers()

    // Subscribe to player changes
    const playersChannel = supabase
      .channel(`session_${session.id}_players`, {
        config: {
          broadcast: { self: true }
        }
      })
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'players',
          filter: `session_id=eq.${session.id}`,
        },
        () => {
          console.log('📡 Player change detected via Realtime')
          loadPlayers()
        }
      )
      .subscribe((status) => {
        console.log('📡 Players channel subscription status:', status)
      })

    // Polling fallback for lobby (when status is 'waiting')
    // This ensures the player list refreshes even if Realtime is slow/unreliable
    const pollingInterval = setInterval(() => {
      if (sessionStatusRef.current === 'waiting') {
        console.log('🔄 Polling player list (lobby)')
        loadPlayers()
      }
    }, 2000) // Poll every 2 seconds while in lobby

    // Subscribe to session changes (✅ only apply meaningful changes)
    const sessionChannel = supabase
      .channel(`session_${session.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'game_sessions',
          filter: `id=eq.${session.id}`,
        },
        (payload) => {
          const next = payload.new as Partial<GameSession>

          setSession((prev) => {
            const nextStatus = (next.status ?? prev.status) as GameSession['status']
            const nextIndex =
              typeof next.current_puzzle_index === 'number'
                ? next.current_puzzle_index
                : prev.current_puzzle_index
            const nextStartedAt = (next.started_at ?? prev.started_at) as GameSession['started_at']
            const nextCompletedAt = (next.completed_at ?? prev.completed_at) as GameSession['completed_at']

            const changed =
              nextStatus !== prev.status ||
              nextIndex !== prev.current_puzzle_index ||
              nextStartedAt !== prev.started_at ||
              nextCompletedAt !== prev.completed_at

            // ✅ Prevent needless re-renders during games (e.g. memory reshuffle)
            if (!changed) return prev

            return {
              ...prev,
              ...next,
              status: nextStatus,
              current_puzzle_index: nextIndex,
              started_at: nextStartedAt,
              completed_at: nextCompletedAt,
            }
          })
        }
      )
      .subscribe()

    // Polling fallback - check session status every 2 seconds
    // ✅ Only apply changes when something actually changed to avoid re-init / reshuffle
    const pollInterval = setInterval(async () => {
      const { data, error } = await supabase
        .from('game_sessions')
        .select('status, current_puzzle_index, started_at, completed_at')
        .eq('id', session.id)
        .single<
          Pick<
            GameSession,
            'status' | 'current_puzzle_index' | 'started_at' | 'completed_at'
          >
        >()

      if (error || !data) return

      setSession((prev) => {
        const changed =
          data.status !== prev.status ||
          data.current_puzzle_index !== prev.current_puzzle_index ||
          data.started_at !== prev.started_at ||
          data.completed_at !== prev.completed_at

        if (!changed) return prev

        return { ...prev, ...data }
      })
    }, 2000)

    return () => {
      supabase.removeChannel(playersChannel)
      supabase.removeChannel(sessionChannel)
      clearInterval(pollInterval)
      clearInterval(pollingInterval)
    }
  }, [session.id, session.session_code])

  const handleStartGame = async () => {
    // Update local state immediately for instant feedback
    const startedAt = new Date().toISOString()
    setSession(
      (prev) =>
        ({
          ...prev,
          status: 'in_progress' as const,
          started_at: startedAt,
        }) as GameSession
    )

    const supabase = createClient()
    const { error } = await (supabase.from('game_sessions') as any)
      .update({
        status: 'in_progress',
        started_at: startedAt,
      })
      .eq('id', session.id)
      .select()

    if (error) {
      logError(error, 'GameSession: startGame')
      // Revert on error
      setSession(
        (prev) =>
          ({
            ...prev,
            status: 'waiting' as const,
            started_at: null,
          }) as GameSession
      )
    }
  }

  const handlePuzzleComplete = async () => {
    const supabase = createClient()
    const nextPuzzleIndex = session.current_puzzle_index + 1

    if (nextPuzzleIndex >= totalGames) {
      // All games completed - update local state immediately
      const completedAt = new Date().toISOString()
      setSession(
        (prev) =>
          ({
            ...prev,
            status: 'completed' as const,
            completed_at: completedAt,
          }) as GameSession
      )

      await (supabase.from('game_sessions') as any)
        .update({
          status: 'completed',
          completed_at: completedAt,
        })
        .eq('id', session.id)
    } else {
      // Move to next game - update local state immediately
      setSession(
        (prev) =>
          ({
            ...prev,
            current_puzzle_index: nextPuzzleIndex,
          }) as GameSession
      )

      await (supabase.from('game_sessions') as any)
        .update({
          current_puzzle_index: nextPuzzleIndex,
        })
        .eq('id', session.id)
    }
  }

  const handleShowGreeting = () => {
    setShowGreeting(true)
  }

  const handleCopyLink = async () => {
    const url = window.location.href
    try {
      await navigator.clipboard.writeText(url)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    } catch (err) {
      // Silent fail - clipboard API not available or permission denied
      // User can still manually copy the URL
    }
  }

  const isHost = currentPlayer?.id === session.host_player_id

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0a0a] via-[#1a1a2e] to-[#0a0a0a]">
        <div className="text-gray-400">Lade...</div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-br from-[#0a0a0a] via-[#1a1a2e] to-[#0a0a0a]">
      {/* Shake to Celebrate - nur während des Spiels */}
      {session.status === 'in_progress' && <ShakeCelebration />}

      <div className="max-w-4xl w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold">
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              {session.rooms?.name}
            </span>
          </h1>
          <div className="flex flex-col md:flex-row items-center justify-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-gray-400">Session Code:</span>
              <code className="px-4 py-2 bg-white/10 rounded-lg text-xl font-mono text-white border border-white/20">
                {session.session_code}
              </code>
            </div>
            <button
              onClick={handleCopyLink}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all flex items-center gap-2 text-sm font-medium"
            >
              {linkCopied ? (
                <>
                  <span>✓</span>
                  <span>Link kopiert!</span>
                </>
              ) : (
                <>
                  <span>🔗</span>
                  <span>Link kopieren</span>
                </>
              )}
            </button>
          </div>

          {/* Progress Bar - nur während des Spiels */}
          {session.status === 'in_progress' && totalGames > 0 && (
            <div className="max-w-2xl mx-auto pt-4">
              <ProgressBar
                currentStep={session.current_puzzle_index + 1}
                totalSteps={totalGames}
                label="Spielfortschritt"
              />
            </div>
          )}
        </div>

        {/* Lobby */}
        {session.status === 'waiting' && (
          <div className="space-y-6">
            {/* Players List */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
              <h2 className="text-2xl font-semibold mb-6 text-white">
                Spieler ({players.length})
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {players.map((player) => (
                  <div
                    key={player.id}
                    className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10"
                  >
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                      style={{ backgroundColor: player.color || '#3b82f6' }}
                    >
                      {(player as any).avatar || '😀'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{player.name}</p>
                      {player.id === session.host_player_id && (
                        <p className="text-xs text-gray-400">Host</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* QR Code & Instructions */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* QR Code */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-6 flex flex-col items-center justify-center space-y-4">
                <h3 className="text-lg font-semibold text-white mb-2">
                  Mit dem Handy beitreten
                </h3>
                <div className="bg-white p-4 rounded-lg">
                  <QRCodeSVG
                    value={`${getBaseUrl()}/join/${session.session_code}`}
                    size={180}
                    level="H"
                  />
                </div>
                <p className="text-xs text-gray-400 text-center">
                  QR-Code scannen zum Beitreten
                </p>
                {typeof window !== 'undefined' &&
                  (window.location.hostname === 'localhost' ||
                    window.location.hostname === '127.0.0.1') && (
                    <div
                      className={`rounded-lg p-3 ${
                        localNetworkIp
                          ? 'bg-green-500/10 border border-green-500/30'
                          : 'bg-yellow-500/10 border border-yellow-500/30'
                      }`}
                    >
                      {localNetworkIp ? (
                        <div className="text-xs text-green-200 text-center leading-relaxed">
                          ✅ <strong>Netzwerk-IP erkannt:</strong>{' '}
                          <span className="font-mono">{localNetworkIp}</span>
                          <br />
                          Der QR-Code verwendet automatisch diese IP. Handy muss im selben WLAN
                          sein.
                        </div>
                      ) : (
                        <p className="text-xs text-yellow-200 text-center leading-relaxed">
                          ⚠️ <strong>Localhost-Hinweis:</strong> Netzwerk-IP wird erkannt...
                          <br />
                          Alternativ rufe diese Seite über deine lokale IP auf (z.B.
                          http://192.168.x.x:3000).
                        </p>
                      )}
                    </div>
                  )}
              </div>

              {/* Instructions */}
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-blue-300 mb-2">
                  Wie es funktioniert
                </h3>
                <ul className="space-y-2 text-gray-300 text-sm">
                  <li>• Teile den Session-Code mit deinen Freunden</li>
                  <li>• Oder scanne den QR-Code mit dem Handy</li>
                  <li>• Löst gemeinsam {totalGames} Spiele</li>
                  <li>• Am Ende erwarten euch persönliche Grüße</li>
                </ul>
              </div>
            </div>

            {/* Start Button (Host only) */}
            {isHost ? (
              <button
                onClick={handleStartGame}
                className="w-full px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg shadow-blue-500/50"
              >
                Spiel starten
              </button>
            ) : (
              <div className="text-center p-4 bg-white/5 rounded-lg border border-white/10">
                <p className="text-gray-400">
                  Warte darauf, dass der Host das Spiel startet...
                </p>
              </div>
            )}
          </div>
        )}

        {/* Game in Progress */}
        {session.status === 'in_progress' && currentPlayer && (
          <div>
            {session.current_puzzle_index < gameQueue.length &&
              (() => {
                const queueItem = gameQueue[session.current_puzzle_index]
                const game = queueItem.games as any

                if (game.game_type === 'quiz') {
                  return (
                    <QuizWithLeaderboard
                      sessionId={session.id}
                      playerId={currentPlayer.id}
                      players={players}
                      quizData={game.config}
                      isHost={isHost}
                      onContinue={handlePuzzleComplete}
                      puzzleIndex={session.current_puzzle_index}
                      totalGames={totalGames}
                      roomId={(session.rooms as any)?.id}
                    />
                  )
                }

                if (game.game_type === 'memory') {
                  return (
                    <MemoryWithLeaderboard
                      sessionId={session.id}
                      playerId={currentPlayer.id}
                      players={players}
                      memoryData={game.config}
                      isHost={isHost}
                      onContinue={handlePuzzleComplete}
                      puzzleIndex={session.current_puzzle_index}
                      totalGames={totalGames}
                      roomId={(session.rooms as any)?.id}
                    />
                  )
                }

                if (game.game_type === 'word') {
                  return (
                    <WordWithLeaderboard
                      sessionId={session.id}
                      playerId={currentPlayer.id}
                      players={players}
                      wordData={game.config}
                      isHost={isHost}
                      onContinue={handlePuzzleComplete}
                      puzzleIndex={session.current_puzzle_index}
                      totalGames={totalGames}
                      roomId={(session.rooms as any)?.id}
                    />
                  )
                }

                if (game.game_type === 'chat_typing') {
                  return (
                    <ChatTypingRaceWithLeaderboard
                      sessionId={session.id}
                      playerId={currentPlayer.id}
                      players={players as any}
                      config={game.config}
                      isHost={isHost}
                      onContinue={handlePuzzleComplete}
                      totalGames={totalGames}
                      puzzleIndex={session.current_puzzle_index}
                      nextGameName={nextGameName}
                    />
                  )
                }

                if (game.game_type === 'countdown_rhythm') {
                  return (
                    <CountdownRhythmWithLeaderboard
                      sessionId={session.id}
                      playerId={currentPlayer.id}
                      players={players as any}
                      gameData={game.config}
                      isHost={isHost}
                      onContinue={handlePuzzleComplete}
                      totalGames={totalGames}
                      puzzleIndex={session.current_puzzle_index}
                      roomId={(session.rooms as any)?.id}
                      nextGameName={nextGameName}
                    />
                  )
                }

                if (game.game_type === 'emoji_catcher') {
                  return (
                    <EmojiCatcherWithLeaderboard
                      sessionId={session.id}
                      playerId={currentPlayer.id}
                      players={players as any}
                      gameData={game.config}
                      isHost={isHost}
                      onContinue={handlePuzzleComplete}
                      totalGames={totalGames}
                      puzzleIndex={session.current_puzzle_index}
                      roomId={(session.rooms as any)?.id}
                      nextGameName={nextGameName}
                    />
                  )
                }

                return null
              })()}
          </div>
        )}

        {/* Game Completed - Final Leaderboard */}
        {session.status === 'completed' && currentPlayer && !showGreeting && (
          <FinalLeaderboard
            sessionId={session.id}
            players={players}
            currentPlayerId={currentPlayer.id}
            isHost={isHost}
            onContinue={handleShowGreeting}
          />
        )}

        {/* Greeting Page */}
        {session.status === 'completed' && currentPlayer && showGreeting && (
          <GreetingPage
            sessionId={session.id}
            playerId={currentPlayer.id}
            playerName={currentPlayer.name}
            videoUrl={(session.rooms as any)?.video_url || null}
            roomId={(session.rooms as any)?.id}
          />
        )}
      </div>
    </main>
  )
}
